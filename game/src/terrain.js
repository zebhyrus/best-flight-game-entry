// Terrain of Zephyr Valley: a river gorge with a bridge, a small
// airstrip village, fields, forests, mountains, clouds and the runway,
// all placed from one seed so the valley is the same every time a
// seed is used. World axes: x is lateral, z is forward along the
// valley, y is height above the ground. The 3D scene reads the same
// groundHeight the physics uses, so the mesh the pilot sees is the
// ground the pilot can hit. v2.3 adds the gorge cut, the bridge line,
// the village houses and named landmarks the HUD can point to.
import { LANDMARKS, RUNWAY, WORLD } from './config.js';

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
  const riverX = (z) => (riverCurve(z / WORLD.length) - 0.5) * 1600 - 500;
  const roadX = (z) => (roadCurve(z / WORLD.length) - 0.5) * 1500 + 500;
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
  peaks[0] = { x: 900, z: 4500, height: 520, width: 520, snow: false, volcano: true };
  const volcano = peaks[0];
  const trees = [];
  for (let i = 0; i < 320; i += 1) {
    trees.push({
      x: seedRandom.range(-WORLD.width, WORLD.width),
      z: seedRandom.range(100, WORLD.length),
      size: seedRandom.range(8, 20),
      shade: seedRandom.pick([0x145c26, 0x1d6b2e, 0x2a7d33, 0x0f4d2a, 0x3a8a2f]),
    });
  }
  const fields = [];
  for (let i = 0; i < 60; i += 1) {
    fields.push({
      x: seedRandom.range(-WORLD.width, WORLD.width),
      z: seedRandom.range(100, WORLD.length),
      w: seedRandom.range(120, 320),
      d: seedRandom.range(120, 300),
      color: seedRandom.pick([0x86c15a, 0xa8d94a, 0xf2c94c, 0x8ee02e, 0x74b84e, 0xe8a34c]),
    });
  }
  const clouds = [];
  for (let i = 0; i < 34; i += 1) {
    clouds.push({
      x: seedRandom.range(-2200, 2200),
      y: seedRandom.range(560, 940),
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
  const houses = [];
  for (let i = 0; i < 18; i += 1) {
    const side = i % 2 === 0 ? -1 : 1;
    houses.push({
      x: 260 + side * seedRandom.range(60, 300),
      z: 7150 + Math.floor(i / 2) * 90 + seedRandom.range(-20, 20),
      w: seedRandom.range(16, 26),
      d: seedRandom.range(14, 22),
      h: seedRandom.range(9, 15),
      color: seedRandom.pick([0xe8dcc8, 0xd8b48a, 0xc98a6a, 0xf2e8d5, 0xa8c8a0]),
    });
  }
  const gorge = { name: LANDMARKS.gorge.name, x: riverX(LANDMARKS.gorge.z), z: LANDMARKS.gorge.z };
  const bridge = { name: LANDMARKS.bridge.name, x: riverX(LANDMARKS.bridge.z), z: LANDMARKS.bridge.z };
  const village = { name: LANDMARKS.village.name, x: 260, z: LANDMARKS.village.z };
  const airstrip = { name: LANDMARKS.airstrip.name, x: RUNWAY.x, z: RUNWAY.z };
  function groundHeight(x, z) {
    if (Math.abs(x - RUNWAY.x) < RUNWAY.width + 30 && z > RUNWAY.z - RUNWAY.length - 60 && z < RUNWAY.z + 140) return 20;
    if (Math.abs(x - 260) < 320 && z > 7050 && z < 7950) return 20;
    const edge = Math.min(1, Math.max(0, (Math.abs(x) - 900) / 900));
    let height = 18 + edge * edge * 320;
    for (const peak of peaks) {
      const dx = (x - peak.x) / peak.width;
      const dz = (z - peak.z) / (peak.width * 1.4);
      const d = dx * dx + dz * dz;
      if (d < 1) height += peak.height * (1 - d) * (1 - d);
    }
    if (z > 2100 && z < 3200) {
      const distRiver = Math.abs(x - riverX(z));
      if (distRiver < 130) height = Math.min(height, 10 + distRiver * 0.08);
      else if (distRiver < 320) height = Math.min(height, 26 + (distRiver - 130) * 0.55);
    }
    return height;
  }
  return {
    peaks, trees, fields, clouds, barns, houses, gorge, bridge, village, airstrip, volcano,
    landmarks: [gorge, bridge, village, airstrip],
    riverX, roadX,
    ridgeHeight(x) { return 90 + ridgeCurve((x + WORLD.width) / (WORLD.width * 2)) * 260; },
    groundHeight,
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
