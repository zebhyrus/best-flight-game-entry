// Zephyr Valley 3D: shared tuning constants for the flight game.
// One file, one job: every number the physics, the world and the
// renderer agree on lives here so a tweak lands everywhere at once.
// v2.3: fuel now binds, sorties run longer, a fourth mission joins,
// boost gets a wider view, and the valley gets named landmarks.
export const STEP = 1 / 60;
export const BEST_KEY = 'zephyr-valley-best';
export const WORLD = {
  width: 2600,
  length: 9000,
  viewDistance: 5200,
};
export const PLANE = {
  startX: 0,
  startAlt: 420,
  startSpeed: 120,
  minSpeed: 45,
  maxSpeed: 260,
  cruiseSpeed: 130,
  climbRate: 78,
  sinkRate: 70,
  turnRate: 0.9,
  rollRate: 2.4,
  maxRoll: 1.1,
  stallSpeed: 58,
  flapStallSpeed: 48,
  fuelMax: 100,
  fuelDrain: 1.35,
  fuelLow: 25,
  hullMax: 100,
};
export const RING = {
  radius: 46,
  count: 8,
  spacing: 720,
};
export const SLALOM = {
  gates: 10,
  spacing: 430,
  timeLimit: 95,
  weave: 200,
};
export const RUNWAY = {
  x: 0,
  z: 7800,
  length: 700,
  width: 46,
};
export const SCORE = {
  ring: 100,
  ringStreak: 25,
  landing: 500,
  softLanding: 250,
  centrelineBonus: 150,
  stormDodge: 150,
  slalomGate: 100,
  slalomBonus: 300,
  timeBonus: 2,
};
export const MISSION_NAMES = ['RING RUN', 'VALLEY LANDING', 'STORM DODGE', 'GORGE SLALOM'];
export const PLANE_NAME = 'ZEPHYR';
export const VALLEY_NAME = 'ZEPHYR VALLEY';
export const LANDMARKS = {
  gorge: { name: 'ZEPHYR GORGE', z: 2600 },
  bridge: { name: 'GORGE BRIDGE', z: 2600 },
  village: { name: 'MERIDIAN VILLAGE', z: 7400 },
  airstrip: { name: 'MERIDIAN AIRSTRIP', z: 7800 },
  river: { name: 'ZEPHYR RIVER', z: 1300 },
};
export const CAMERA = {
  baseFov: 62,
  boostFov: 78,
  chaseHeight: 11,
  chaseBack: 42,
};
