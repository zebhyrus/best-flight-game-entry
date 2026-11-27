// Skyhawk Valley 3D: shared tuning constants for the flight game.
// One file, one job: every number the physics, the world and the
// renderer agree on lives here so a tweak lands everywhere at once.
export const STEP = 1 / 60;
export const BEST_KEY = 'skyhawk-valley-best';
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
  fuelDrain: 0.55,
  hullMax: 100,
};
export const RING = {
  radius: 34,
  count: 8,
  spacing: 520,
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
  timeBonus: 2,
};
export const MISSION_NAMES = ['RING RUN', 'VALLEY LANDING', 'STORM DODGE'];
export const PLANE_NAME = 'SKYHAWK';
export const VALLEY_NAME = 'SKYHAWK VALLEY';
