export type Tuning = Readonly<{
  gravity: number;
  drag: number;
  groundY: number;
  minRopeLength: number;
  reelSpeed: number;
  maxSubSteps: number;
  maxElapsed: number;
  minFov: number;
  maxFov: number;
  maxAnchorDistance: number;
  groundFriction: number;
  cellSize: number;
  buildingDensity: number;
  minBuildingHeight: number;
  maxBuildingHeight: number;
  buildingMargin: number;
  cameraDistance: number;
  cameraHeight: number;
  cameraTau: number;
  fovSpeedGain: number;
  fovFallGain: number;
}>;

export const DEFAULT_TUNING: Tuning = {
  gravity: 15,
  drag: 0.05,
  groundY: 0,
  minRopeLength: 2,
  reelSpeed: 10,
  maxSubSteps: 120,
  maxElapsed: 1.0,
  minFov: 60,
  maxFov: 90,
  maxAnchorDistance: 100,
  groundFriction: 10,
  cellSize: 20,
  buildingDensity: 0.7,
  minBuildingHeight: 10,
  maxBuildingHeight: 50,
  buildingMargin: 2,
  cameraDistance: 15,
  cameraHeight: 5,
  cameraTau: 0.15,
  fovSpeedGain: 0.5,
  fovFallGain: 0.8,
};
