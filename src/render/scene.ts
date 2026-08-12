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
    // 地面のベース色 (--ink)
    ctx.fillStyle = COLOR_INK;
    ctx.fillRect(0, 0, 256, 256);

    // 格子線 (--sky-high)
    ctx.strokeStyle = COLOR_SKY_HIGH;
    ctx.lineWidth = 4;

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(256, 0);
    ctx.moveTo(0, 0);
    ctx.lineTo(0, 256);
    ctx.moveTo(128, 0);
    ctx.lineTo(128, 256);
    ctx.moveTo(0, 128);
    ctx.lineTo(256, 128);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(200, 200);
  texture.needsUpdate = true;
  return texture;
}

/**
 * STEP1 のシーン（空のグラデーション、フォグ、地面、ライト）を構築する
 */
export function setupScene(): SceneManager {
  const scene = new THREE.Scene();

  // 1. フォグ (同系色 --sky-low)
  scene.fog = new THREE.Fog(COLOR_SKY_LOW, 20, 250);

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
        float h = pow(clamp(nPos.y, 0.0, 1.0), 0.45);
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
  const ambientLight = new THREE.AmbientLight(COLOR_HUD, 0.6);
  scene.add(ambientLight);

  const dirLight = new THREE.DirectionalLight(COLOR_SKY_LOW, 0.8);
  dirLight.position.set(50, 100, 50);
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
