// Terrain of Skyhawk Valley: river, road, fields, forests, mountains,
// clouds and the runway, all placed from one seed so the valley is
// the same every time a seed is used. World axes: x is lateral,
// z is forward along the valley, y is height above the ground.
// The 3D scene reads the same groundHeight the physics uses, so the
// mesh the pilot sees is the ground the pilot can hit.
import { RUNWAY, WORLD } from './config.js';

function smoothNoise(random, points) {
  const values = [];
  for (let i = 0; i < points; i += 1) values.push(random.next());
  return function at(t) {
    const scaled = t * (points - 1);
    const i = Math.floor(scaled);
    const f = scaled - i;
    const a = values[Math.min(i, points - 1)];
    const b = values[Math.min(i + 1, points - 1)];
    const s = f * f * (3 - 2 * f);
    return a + (b - a) * s;
  };
}

export function createTerrain(seedRandom) {
  const riverCurve = smoothNoise(seedRandom, 9);
  const roadCurve = smoothNoise(seedRandom, 9);
  const ridgeCurve = smoothNoise(seedRandom, 7);
  const peaks = [];
  for (let i = 0; i < 26; i += 1) {
    peaks.push({
      x: seedRandom.range(-WORLD.width, WORLD.width),
      z: seedRandom.range(300, WORLD.length),
      height: seedRandom.range(120, 420),
      width: seedRandom.range(180, 420),
      snow: seedRandom.next() > 0.45,
    });
  }
  const trees = [];
  for (let i = 0; i < 240; i += 1) {
    trees.push({
      x: seedRandom.range(-WORLD.width, WORLD.width),
      z: seedRandom.range(100, WORLD.length),
      size: seedRandom.range(6, 16),
      shade: seedRandom.pick([0x1d6b2e, 0x2a7d33, 0x17603a, 0x3a8a2f]),
    });
  }
  const fields = [];
  for (let i = 0; i < 60; i += 1) {
    fields.push({
      x: seedRandom.range(-WORLD.width, WORLD.width),
      z: seedRandom.range(100, WORLD.length),
      w: seedRandom.range(120, 320),
      d: seedRandom.range(120, 300),
      color: seedRandom.pick([0x7fb069, 0xa3c14a, 0xe9c46a, 0x8ac926, 0x6a994e]),
    });
  }
  const clouds = [];
  for (let i = 0; i < 34; i += 1) {
    clouds.push({
      x: seedRandom.range(-2200, 2200),
      y: seedRandom.range(520, 900),
      z: seedRandom.range(200, WORLD.length),
      size: seedRandom.range(50, 150),
      drift: seedRandom.range(2, 9),
    });
  }
  const barns = [];
  for (let i = 0; i < 14; i += 1) {
    barns.push({
      x: seedRandom.range(-1400, 1400),
      z: seedRandom.range(400, WORLD.length - 400),
      red: seedRandom.next() > 0.5,
    });
  }
  return {
    peaks, trees, fields, clouds, barns,
    riverX(z) { return (riverCurve(z / WORLD.length) - 0.5) * 1600 - 500; },
    roadX(z) { return (roadCurve(z / WORLD.length) - 0.5) * 1500 + 500; },
    ridgeHeight(x) { return 90 + ridgeCurve((x + WORLD.width) / (WORLD.width * 2)) * 260; },
    groundHeight(x, z) {
      if (Math.abs(x - RUNWAY.x) < RUNWAY.width + 30 && z > RUNWAY.z - RUNWAY.length - 60 && z < RUNWAY.z + 140) return 20;
      const edge = Math.min(1, Math.max(0, (Math.abs(x) - 900) / 900));
      let height = 18 + edge * edge * 320;
      for (const peak of peaks) {
        const dx = (x - peak.x) / peak.width;
        const dz = (z - peak.z) / (peak.width * 1.4);
        const d = dx * dx + dz * dz;
        if (d < 1) height += peak.height * (1 - d) * (1 - d);
      }
      return height;
    },
    runway: RUNWAY,
  };
}

// True when a point in the air is inside a mountain peak.
export function hitsMountain(terrain, x, y, z) {
  for (const peak of terrain.peaks) {
    const dx = (x - peak.x) / peak.width;
    const dz = (z - peak.z) / (peak.width * 1.4);
    const d = dx * dx + dz * dz;
    if (d < 1) {
      const top = 18 + peak.height * (1 - d) * (1 - d);
      if (y < top + 12) return peak;
    }
  }
  return null;
}
