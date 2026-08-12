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
  minAnchorDistance: number;
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
  minAnchorDistance: 12,
  maxAnchorDistance: 180,
  groundFriction: 10,
  cellSize: 60,
  buildingDensity: 0.7,
  minBuildingHeight: 30,
  maxBuildingHeight: 160,
  buildingMargin: 15,
  cameraDistance: 15,
  cameraHeight: 5,
  cameraTau: 0.15,
  fovSpeedGain: 0.5,
  fovFallGain: 0.8,
};
