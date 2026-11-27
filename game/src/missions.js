// Missions for Skyhawk Valley: three sortie types, ring placement,
// storm clouds, scoring and level flow. One file, one job: what the
// pilot has to do, and whether it counts as done.
// v2 deepens each one: storm cells push the plane, landings are
// judged on flare, sink rate and centreline, and streaks pay more.
import { MISSION_NAMES, RING, RUNWAY, SCORE, WORLD } from './config.js';

export const MISSION_RING = 0;
export const MISSION_LAND = 1;
export const MISSION_STORM = 2;

export function createMissions(random) {
  return {
    level: 1,
    index: 0,
    score: 0,
    streak: 0,
    ringsPassed: 0,
    rings: [],
    storms: [],
    message: '',
    messageTime: 0,
    done: false,
    failed: false,
    elapsed: 0,
    bestStreak: 0,
    landings: 0,
    landingGrade: '',
    type() { return this.index % 3; },
    name() { return MISSION_NAMES[this.type()]; },
  };
}

function placeRings(missions, random, startZ, stormy) {
  missions.rings = [];
  missions.storms = [];
  let z = startZ + 500;
  let x = 0;
  for (let i = 0; i < RING.count; i += 1) {
    x = Math.max(-1100, Math.min(1100, x + random.range(-340, 340)));
    const y = random.range(280, 560);
    missions.rings.push({ x, y, z, passed: false, index: i });
    if (stormy && i > 0) {
      missions.storms.push({
        x: x + random.range(-260, 260),
        y: y + random.range(-90, 120),
        z: z + random.range(-160, 160),
        size: random.range(70, 130),
        hit: false,
        pushX: random.range(-14, 14),
        pushY: random.range(-6, 10),
      });
    }
    z += RING.spacing + random.range(-60, 90);
  }
}

export function startMission(missions, random, planeZ) {
  missions.ringsPassed = 0;
  missions.streak = 0;
  missions.done = false;
  missions.failed = false;
  missions.elapsed = 0;
  missions.landingGrade = '';
  const type = missions.type();
  if (type === MISSION_LAND) {
    missions.rings = [];
    missions.storms = [];
    missions.message = 'LAND ON THE RUNWAY AHEAD';
  } else if (type === MISSION_STORM) {
    placeRings(missions, random, planeZ, true);
    missions.message = 'FLY THE RINGS AND DODGE THE STORMS';
  } else {
    placeRings(missions, random, planeZ, false);
    missions.message = 'FLY THROUGH EVERY RING';
  }
  missions.messageTime = 4;
}

export function nextRing(missions) {
  return missions.rings.find((ring) => !ring.passed) || null;
}

export function stormPush(missions, plane, dt) {
  let pushed = false;
  for (const storm of missions.storms) {
    if (storm.hit) continue;
    const dz = storm.z - plane.z;
    const dx = storm.x - plane.x;
    const dy = storm.y - plane.alt;
    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
    if (dist < storm.size + 160) {
      plane.x += storm.pushX * dt * (1 - dist / (storm.size + 160));
      plane.alt += storm.pushY * dt * (1 - dist / (storm.size + 160));
      pushed = true;
    }
  }
  return pushed;
}

// Advance one step. Returns event flags the loop turns into sound,
// score popups and screen changes.
export function updateMissions(missions, plane, dt, terrain) {
  const events = { ring: false, storm: false, landed: false, complete: false };
  missions.elapsed += dt;
  if (missions.messageTime > 0) missions.messageTime -= dt;
  const type = missions.type();
  if (type !== MISSION_LAND) {
    const ring = nextRing(missions);
    if (ring) {
      const dz = ring.z - plane.z;
      const dx = ring.x - plane.x;
      const dy = ring.y - plane.alt;
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (dist < RING.radius + 26) {
        ring.passed = true;
        missions.ringsPassed += 1;
        missions.streak += 1;
        missions.bestStreak = Math.max(missions.bestStreak, missions.streak);
        missions.score += SCORE.ring + (missions.streak - 1) * SCORE.ringStreak;
        events.ring = true;
        missions.message = missions.streak > 1 ? `RING ${missions.ringsPassed} OF ${RING.count} STREAK ${missions.streak}` : `RING ${missions.ringsPassed} OF ${RING.count}`;
        missions.messageTime = 2.2;
        if (missions.ringsPassed >= RING.count) {
          missions.done = true;
          missions.score += Math.max(0, Math.round(600 - missions.elapsed) * SCORE.timeBonus);
          events.complete = true;
        }
      } else if (dz < -RING.radius - 60) {
        ring.passed = true;
        missions.streak = 0;
        missions.message = 'RING MISSED KEEP FLYING';
        missions.messageTime = 2;
        if (missions.rings.every((r) => r.passed)) {
          missions.done = true;
          events.complete = true;
        }
      }
    }
    for (const storm of missions.storms) {
      if (storm.hit) continue;
      const dz = storm.z - plane.z;
      const dx = storm.x - plane.x;
      const dy = storm.y - plane.alt;
      if (Math.abs(dz) < 46 && Math.sqrt(dx * dx + dy * dy) < storm.size) {
        storm.hit = true;
        events.storm = true;
        missions.streak = 0;
        missions.score = Math.max(0, missions.score - 50);
        missions.message = 'STORM HIT HULL DAMAGED';
        missions.messageTime = 2.5;
      }
    }
  } else {
    const runway = terrain.runway;
    const dz = runway.z - plane.z;
    if (plane.landed && plane.onGround) {
      missions.landings += 1;
      const soft = Math.abs(plane.touchdownSink) <= 10;
      const centred = plane.touchdownOffset < 12;
      const flared = plane.flared;
      let bonus = 0;
      if (soft) bonus += SCORE.softLanding;
      if (centred) bonus += SCORE.centrelineBonus;
      if (flared) bonus += 100;
      missions.landingGrade = soft && centred && flared ? 'PERFECT LANDING' : soft ? 'SMOOTH LANDING' : 'LANDED ON THE RUNWAY';
      missions.score += SCORE.landing + bonus;
      missions.done = true;
      events.landed = true;
      events.complete = true;
      missions.message = `${missions.landingGrade} BONUS ${bonus}`;
      missions.messageTime = 4;
    } else if (dz < -400 && !plane.onGround) {
      missions.message = 'OVERSHOT THE RUNWAY TURN BACK';
      missions.messageTime = 2;
    } else if (dz < 1600 && dz > 0) {
      const aligned = Math.abs(plane.x - runway.x) < 220;
      missions.message = aligned ? 'ON FINAL SLOW DOWN AND SETTLE' : 'LINE UP WITH THE RUNWAY LIGHTS';
      missions.messageTime = 0.4;
    }
  }
  void WORLD;
  void RUNWAY;
  return events;
}

export function advanceLevel(missions, random, planeZ) {
  missions.level += 1;
  missions.index += 1;
  startMission(missions, random, planeZ);
}

export function missionProgress(missions) {
  if (missions.type() === MISSION_LAND) return missions.done ? 1 : 0;
  return missions.ringsPassed / Math.max(1, missions.rings.length);
}
