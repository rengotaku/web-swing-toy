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
}>;

export const DEFAULT_TUNING: Tuning = {
  gravity: 15,
  drag: 0.05,
  groundY: 0,
  minRopeLength: 2,
  reelSpeed: 10,
  maxSubSteps: 10,
  maxElapsed: 0.25,
  minFov: 60,
  maxFov: 90,
  maxAnchorDistance: 100,
};
