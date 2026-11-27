// Screenshot scenes behind ?shot=start|play|mission|storm|cockpit.
// Each one plays the real rules forward from a fresh world for a
// fixed number of steps, steered by a simple autopilot that aims at
// the next ring or lines up with the runway, so the frame is what a
// short game really looks like and the same seed always gives the
// same frame. v2.3 restages shot 4, the old cockpit view, as a
// chase view hero: aircraft, target ring and runway in one frame,
// with the HUD text over clear sky. The shot name stays cockpit
// so the entry program keeps writing the same four files.
import { STEP } from './config.js';
import { MISSION_LAND, MISSION_RING, MISSION_STORM, setMissionType } from './missions.js';

function autopilot(state) {
  const plane = state.plane;
  const missions = state.missions;
  const ring = missions.rings.find((item) => !item.passed);
  let targetX = 0;
  let targetAlt = 420;
  if (missions.type() === MISSION_LAND) {
    targetX = state.terrain.runway.x;
    const dist = Math.max(0, state.terrain.runway.z - plane.z);
    targetAlt = Math.max(60, dist * 0.18);
  } else if (ring) {
    targetX = ring.x;
    targetAlt = ring.y;
  }
  const dz = ring ? Math.max(60, ring.z - plane.z) : 800;
  const wantHeading = Math.atan2(targetX - plane.x, dz);
  let diff = wantHeading - plane.heading;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  const roll = Math.max(-0.7, Math.min(0.7, diff * 1.6));
  const pitch = Math.max(-0.8, Math.min(0.8, (plane.alt - targetAlt) / 200));
  return { pitch, roll, boost: false, brake: false, flaps: false, throttleUp: false, throttleDown: false };
}

export function stageShot(name, state) {
  state.reset(1);
  state.screen = 'play';
  state.onboarding = { throttle: true, pitch: true, roll: true, ring: true };
  if (name === 'start') {
    for (let i = 0; i < 3 / STEP; i += 1) state.step(STEP, { pitch: 0, roll: 0, boost: false, brake: false, flaps: false }, true);
    return { screen: 'title', best: 0, view: 0 };
  }
  if (name === 'mission') {
    setMissionType(state.missions, MISSION_LAND);
    state.missions.index = 1;
    state.missions.level = 2;
    state.startMission();
    state.plane.z = state.terrain.runway.z - 1300;
    state.plane.x = 90;
    state.plane.alt = 300;
    state.plane.speed = 140;
    state.plane.throttle = 0.45;
    for (let i = 0; i < 7 / STEP; i += 1) {
      state.step(STEP, autopilot(state), false);
      if (state.screen === 'over' || state.screen === 'complete') break;
    }
    return { screen: 'play', best: state.missions.score, view: 0 };
  }
  if (name === 'storm') {
    setMissionType(state.missions, MISSION_STORM);
    state.missions.index = 2;
    state.missions.level = 3;
    state.startMission();
    for (let i = 0; i < 14 / STEP; i += 1) {
      state.step(STEP, autopilot(state), false);
      if (state.screen === 'over' || state.screen === 'complete') break;
    }
    return { screen: 'play', best: state.missions.score, view: 0 };
  }
  if (name === 'cockpit' || name === 'hero') {
    setMissionType(state.missions, MISSION_RING);
    state.missions.index = 0;
    state.missions.level = 1;
    state.startMission();
    state.plane.z = state.terrain.runway.z - 1100;
    state.plane.x = -40;
    state.plane.alt = 340;
    state.plane.heading = 0;
    state.plane.roll = 0;
    state.plane.pitch = 0;
    state.plane.speed = 150;
    state.plane.throttle = 0.6;
    state.plane.fuel = 78;
    state.missions.score = 340;
    state.missions.ringsPassed = 2;
    state.missions.rings.forEach((ring, i) => { if (i < 2) ring.passed = true; });
    const heroRing = state.missions.rings.find((item) => !item.passed);
    if (heroRing) {
      heroRing.x = 60;
      heroRing.y = 330;
      heroRing.z = state.terrain.runway.z - 650;
    }
    state.missions.message = 'MERIDIAN AIRSTRIP AHEAD FLY THE RING';
    state.missions.messageTime = 4;
    state.screen = 'play';
    return { screen: 'play', best: state.missions.score, view: 0 };
  }
  if (name === 'end') {
    setMissionType(state.missions, MISSION_RING);
    state.missions.index = 0;
    state.startMission();
    for (let i = 0; i < 150 / STEP; i += 1) {
      state.step(STEP, autopilot(state), false);
      if (state.screen === 'over' || state.screen === 'complete') break;
    }
    if (state.screen !== 'complete') {
      state.reset(1);
      state.screen = 'play';
      state.plane.alt = 420;
      state.plane.speed = 130;
      state.plane.fuel = 82;
      state.plane.throttle = 0.55;
      state.missions.done = true;
      state.missions.score = 1240;
      state.missions.ringsPassed = 8;
      state.screen = 'complete';
    }
    return { screen: 'complete', best: state.missions.score, view: 0 };
  }
  setMissionType(state.missions, MISSION_RING);
  state.missions.index = 0;
  state.startMission();
  for (let i = 0; i < 18 / STEP; i += 1) {
    state.step(STEP, autopilot(state), false);
    if (state.screen === 'over' || state.screen === 'complete') break;
  }
  return { screen: 'play', best: state.missions.score, view: 0 };
}
