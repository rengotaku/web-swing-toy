import * as THREE from "three";

export type SceneManager = {
  scene: THREE.Scene;
  updateSkyPosition: (cameraPos: THREE.Vector3) => void;
  dispose: () => void;
};

// Design tokens
const COLOR_SKY_HIGH = "#1b2b52";
const COLOR_SKY_LOW = "#f0a06a";
const COLOR_INK = "#0b1020";
const COLOR_HUD = "#e9f0ff";

/**
 * 地面用の格子模様テクスチャを生成する (落ちたことが分かる質感)
 */
function createGroundTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");

  if (ctx) {
    ctx.fillStyle = COLOR_INK;
    ctx.fillRect(0, 0, 256, 256);

    // 格子は「動いていることが分かる」ためだけに置く。以前はネオン調の
    // 明るいグリッドで、地面が空とビルより目立っていた。ここは背景なので、
    // 存在は分かるが視線を奪わない濃さに留める。
    ctx.strokeStyle = COLOR_SKY_HIGH;
    ctx.globalAlpha = 0.55;
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(256, 0);
    ctx.moveTo(0, 0);
    ctx.lineTo(0, 256);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  // 2000m の平面に対して 1 マス約 30m。以前は 10m 刻みで、高度 200m から
  // 浅い角度で見ると線が詰まってモアレになり、地面がビルより明るい面として
  // 立ち上がっていた（暗いシルエットが手前にある奥行きの読みが反転する）。
  texture.repeat.set(66, 66);
  texture.anisotropy = 8;
  texture.needsUpdate = true;
  return texture;
}

/**
 * STEP1 のシーン（空のグラデーション、フォグ、地面、ライト）を構築する
 */
export function setupScene(): SceneManager {
  const scene = new THREE.Scene();

  // 1. フォグ
  //
  // 色は水平線の暖色に合わせる。遠くのビルが空へ溶けることで距離が読め、
  // それが速度感の主要な手がかりになる。
  //
  // 範囲を遠くに置くのが要点。近いと（以前は 20〜250m だった）100m 先から
  // 全部が暖色に溶けて、街のシルエットも「ワイヤーだけが高彩度」という
  // 方針も同時に壊れる。飛行中は数ブロック先まで見えている必要がある。
  scene.fog = new THREE.Fog(COLOR_SKY_LOW, 300, 1600);

  // 2. 空のグラデーション (大きな球体の内側に ShaderMaterial)
  const skyGeometry = new THREE.SphereGeometry(1000, 32, 16);
  const skyMaterial = new THREE.ShaderMaterial({
    uniforms: {
      topColor: { value: new THREE.Color(COLOR_SKY_HIGH) },
      bottomColor: { value: new THREE.Color(COLOR_SKY_LOW) },
    },
    vertexShader: `
      varying vec3 vLocalPosition;
      #include <common>
      void main() {
        vLocalPosition = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 topColor;
      uniform vec3 bottomColor;
      varying vec3 vLocalPosition;
      #include <common>
      // colorspace_fragment は gl_FragColor への代入文なので main() の中だけに置く。
      // ファイルスコープに置くと関数外に文がある不正な GLSL になり、シェーダの
      // リンクが失敗して画面が黒くなる（エラーは console の警告にしか出ない）。
      void main() {
        vec3 nPos = normalize(vLocalPosition);
        // 飛行中に画面に映るのは水平線から上 30 度ほど。グラデーションの全域を
        // その帯に割り当てないと、中間の濁った色しか出ない。仰角 22 度
        // (sin ≈ 0.38) で濃紺に振り切り、暖色は水平線際の細い帯に留める。
        float h = smoothstep(0.0, 0.38, nPos.y);
        gl_FragColor = vec4(mix(bottomColor, topColor, h), 1.0);
        #include <colorspace_fragment>
      }
    `,
    side: THREE.BackSide,
    depthWrite: false,
  });
  const skyMesh = new THREE.Mesh(skyGeometry, skyMaterial);
  scene.add(skyMesh);

  // 3. 地面 (無限平面風の PlaneGeometry + 格子テクスチャ)
  const groundTexture = createGroundTexture();
  const groundGeometry = new THREE.PlaneGeometry(2000, 2000);
  const groundMaterial = new THREE.MeshBasicMaterial({
    map: groundTexture,
    side: THREE.DoubleSide,
  });
  const groundMesh = new THREE.Mesh(groundGeometry, groundMaterial);
  groundMesh.rotation.x = -Math.PI / 2;
  groundMesh.position.y = 0;
  scene.add(groundMesh);

  // 4. ライト
  //
  // ビルは「明るい水平線を背にした暗いシルエット」に見せる。以前は暖色の
  // 指向光を強度 0.8 で当てていたため、街が文字どおりオレンジに塗られ、
  // 画面から低彩度が失われていた。
  //
  // 環境光は寒色を弱く。指向光は面の向きが分かる最小限だけ入れる
  // (完全に潰すと立体が板になり、街が塊にしか見えなくなる)。
  const ambientLight = new THREE.AmbientLight(COLOR_SKY_HIGH, 0.9);
  scene.add(ambientLight);

  const dirLight = new THREE.DirectionalLight(COLOR_HUD, 0.35);
  dirLight.position.set(60, 120, 40);
  scene.add(dirLight);

  // カメラ追従: 空球体の平行移動 & 地面の格子単位スナップ追従 (泳ぎ防止)
  const updateSkyPosition = (cameraPos: THREE.Vector3) => {
    skyMesh.position.copy(cameraPos);
    // 地面テクスチャの格子間隔 10m 単位でスナップ
    groundMesh.position.x = Math.floor(cameraPos.x / 10) * 10;
    groundMesh.position.z = Math.floor(cameraPos.z / 10) * 10;
  };

  // リソース破棄処理
  const dispose = () => {
    scene.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        if (obj.geometry) {
          obj.geometry.dispose();
        }
        if (obj.material) {
          if (Array.isArray(obj.material)) {
            obj.material.forEach((mat) => mat.dispose());
          } else {
            obj.material.dispose();
          }
        }
      }
    });

    groundTexture.dispose();
    skyGeometry.dispose();
    skyMaterial.dispose();
    groundGeometry.dispose();
    groundMaterial.dispose();
    scene.clear();
  };

  return {
    scene,
    updateSkyPosition,
    dispose,
  };
}
