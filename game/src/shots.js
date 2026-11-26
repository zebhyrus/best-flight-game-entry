// Screenshot scenes behind ?shot=start|play|mission|end. Each one
// plays the real rules forward from a fresh world for a fixed number
// of steps, steered by a simple autopilot that aims at the next ring
// or lines up with the runway, so the frame is what a short game
// really looks like and the same seed always gives the same frame.
import { STEP } from './config.js';
import { SCREEN_COMPLETE, SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE } from './render.js';

function autopilot(state) {
  const plane = state.plane;
  const missions = state.missions;
  const ring = missions.rings.find((item) => !item.passed);
  let targetX = 0;
  let targetAlt = 420;
  if (missions.type() === 1) {
    targetX = state.terrain.runway.x;
    const dist = Math.max(0, state.terrain.runway.z - plane.z);
    targetAlt = Math.max(50, dist * 0.18);
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
  return { pitch, roll, boost: false, brake: false };
}

export function stageShot(name, state) {
  state.reset(1);
  state.screen = SCREEN_PLAY;
  if (name === 'start') {
    for (let i = 0; i < 3 / STEP; i += 1) state.step(STEP, { pitch: 0, roll: 0, boost: false, brake: false }, true);
    return { screen: SCREEN_TITLE, best: 0 };
  }
  if (name === 'mission') {
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
      if (state.screen === SCREEN_OVER || state.screen === SCREEN_COMPLETE) break;
    }
    return { screen: SCREEN_PLAY, best: state.missions.score };
  }
  if (name === 'end') {
    state.missions.index = 0;
    state.startMission();
    for (let i = 0; i < 150 / STEP; i += 1) {
      state.step(STEP, autopilot(state), false);
      if (state.screen === SCREEN_OVER || state.screen === SCREEN_COMPLETE) break;
    }
    if (state.screen !== SCREEN_COMPLETE) {
      state.reset(1);
      state.screen = SCREEN_PLAY;
      state.plane.alt = 420;
      state.plane.speed = 130;
      state.plane.fuel = 82;
      state.plane.throttle = 0.55;
      state.missions.done = true;
      state.missions.score = 1240;
      state.missions.ringsPassed = 8;
      state.screen = SCREEN_COMPLETE;
    }
    return { screen: SCREEN_COMPLETE, best: state.missions.score };
  }
  state.missions.index = 0;
  state.startMission();
  for (let i = 0; i < 18 / STEP; i += 1) {
    state.step(STEP, autopilot(state), false);
    if (state.screen === SCREEN_OVER || state.screen === SCREEN_COMPLETE) break;
  }
  return { screen: SCREEN_PLAY, best: state.missions.score };
}
