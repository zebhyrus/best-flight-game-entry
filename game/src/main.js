// Boot and the one loop for Skyhawk Valley: input is read every
// frame, the world advances in fixed 1/60 s steps, and the renderer
// paints what is there. Screens: title, play, paused, over, complete.
//
// ?seed=N fixes the valley. ?shot=start|play|mission|end (with
// &seed=N) stages that scene instead of running the loop, paints it
// twice and sets window.__shotReady for a screenshot.
import { BEST_KEY, STEP } from './config.js';
import { createRandom } from './random.js';
import { createTerrain, hitsMountain } from './terrain.js';
import { createAircraft, damageAircraft, resetAircraft, updateAircraft } from './aircraft.js';
import { advanceLevel, createMissions, startMission, updateMissions } from './missions.js';
import { createAudio } from './audio.js';
import { ACTION_CONFIRM, ACTION_MUTE, ACTION_NEXT, ACTION_PAUSE, createInput } from './input.js';
import { createRenderer, SCREEN_COMPLETE, SCREEN_OVER, SCREEN_PAUSED, SCREEN_PLAY, SCREEN_TITLE } from './render.js';
import { stageShot } from './shots.js';

const MAX_FRAME = 0.25;
const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const audio = createAudio();

function createGameState() {
  const random = createRandom(seed);
  const terrain = createTerrain(random);
  const plane = createAircraft();
  const missions = createMissions(random);
  const state = {
    plane, terrain, missions, random,
    time: 0,
    screen: SCREEN_TITLE,
    startMission() { startMission(state.missions, state.random, plane.z); },
    reset(nextSeed) {
      const freshRandom = createRandom(nextSeed || seed);
      state.random = freshRandom;
      state.terrain = createTerrain(freshRandom);
      state.missions = createMissions(freshRandom);
      state.time = 0;
      state.screen = SCREEN_TITLE;
      resetAircraft(plane, 0);
      state.startMission();
    },
    step(dt, input, demo) {
      state.time += dt;
      if (state.screen !== SCREEN_PLAY && !demo) return;
      const keys = input.throttleUp !== undefined ? input : { throttleUp: false, throttleDown: false };
      if (keys.throttleUp) plane.throttle = Math.min(1, plane.throttle + 0.55 * dt);
      if (keys.throttleDown) plane.throttle = Math.max(0, plane.throttle - 0.55 * dt);
      if (input.brake) plane.throttle = Math.max(0.08, plane.throttle - 0.8 * dt);
      const events = updateAircraft(plane, input, dt, state.terrain);
      const missionEvents = updateMissions(state.missions, plane, dt, state.terrain);
      const peak = hitsMountain(state.terrain, plane.x, plane.alt, plane.z);
      if (peak && !plane.onGround) {
        const destroyed = damageAircraft(plane, 25 * dt);
        if (destroyed || plane.hull <= 0) {
          state.screen = SCREEN_OVER;
          audio.crash();
          return;
        }
      }
      if (missionEvents.ring) audio.ring();
      if (missionEvents.storm) { damageAircraft(plane, 18); audio.storm(); }
      if (missionEvents.landed) audio.land();
      if (events.crashed) {
        audio.crash();
        state.screen = SCREEN_OVER;
        return;
      }
      if (missionEvents.complete) {
        state.screen = SCREEN_COMPLETE;
        return;
      }
      if (plane.hull <= 0 || (events.outOfFuel && plane.alt <= state.terrain.groundHeight(plane.x, plane.z) + 4)) {
        state.screen = SCREEN_OVER;
        return;
      }
      if (plane.z > state.terrain.runway.z + 900 && state.missions.type() === 1 && !state.missions.done) {
        plane.z = 0;
        resetAircraft(plane, 0);
        plane.alt = 420;
      }
      audio.setEngine(plane.throttle, plane.speed, state.screen === SCREEN_PLAY);
    },
  };
  state.startMission();
  return state;
}

const state = createGameState();

function readBest() {
  try { return Number.parseInt(window.localStorage.getItem(BEST_KEY) ?? '0', 10) || 0; }
  catch { return 0; }
}
function saveBest(value) {
  try { window.localStorage.setItem(BEST_KEY, String(value)); }
  catch { /* storage can be off; best lasts this visit only */ }
}

function runShot(name) {
  const scene = stageShot(name, state);
  let painted = 0;
  function paint() {
    const renderer = createRenderer(canvas);
    renderer.draw(state, scene.screen, scene.best);
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
}

function runGame() {
  const input = createInput(canvas);
  const renderer = createRenderer(canvas);
  let best = readBest();
  let accumulator = 0;
  let last = performance.now();
  const touchBar = document.getElementById('touchbar');
  if (touchBar && input.isTouch()) touchBar.classList.add('show');

  function announce(message) { status.textContent = message; }
  function startGame() {
    state.reset(seed);
    state.screen = SCREEN_PLAY;
    audio.unlock();
    audio.click();
    announce('Playing. Fly the rings.');
  }
  function endGame() {
    if (state.missions.score > best) { best = state.missions.score; saveBest(best); }
    announce(`Game over. Score ${state.missions.score}. Best ${best}.`);
  }
  function handleActions() {
    const actions = input.takeActions();
    if (actions & ACTION_MUTE) { const on = audio.toggle(); announce(on ? 'Sound on.' : 'Sound off.'); }
    if (actions & ACTION_CONFIRM && (state.screen === SCREEN_TITLE || state.screen === SCREEN_OVER)) startGame();
    else if (actions & ACTION_NEXT && state.screen === SCREEN_COMPLETE) {
      advanceLevel(state.missions, state.random, state.plane.z);
      resetAircraft(state.plane, 0);
      state.plane.alt = 420;
      state.screen = SCREEN_PLAY;
      announce(`Mission ${state.missions.level}. ${state.missions.name()}.`);
    } else if (actions & ACTION_PAUSE && state.screen === SCREEN_PLAY) {
      state.screen = SCREEN_PAUSED;
      announce('Paused.');
    } else if (actions & (ACTION_PAUSE | ACTION_CONFIRM) && state.screen === SCREEN_PAUSED) {
      state.screen = SCREEN_PLAY;
      announce('Playing.');
    }
  }
  function frame(now) {
    requestAnimationFrame(frame);
    accumulator += Math.min((now - last) / 1000, MAX_FRAME);
    last = now;
    handleActions();
    if (state.screen === SCREEN_TITLE) {
      state.time += 1 / 60;
      state.plane.z += 2;
    } else if (state.screen === SCREEN_PLAY) {
      while (accumulator >= STEP) {
        const controls = input.controls();
        const keys = input.throttleKeys();
        state.step(STEP, { ...controls, throttleUp: keys.up, throttleDown: keys.down }, false);
        accumulator -= STEP;
        if (state.screen !== SCREEN_PLAY) break;
      }
      if (state.screen === SCREEN_OVER) endGame();
    } else {
      accumulator = 0;
    }
    renderer.draw(state, state.screen, best);
  }
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && state.screen === SCREEN_PLAY) state.screen = SCREEN_PAUSED;
  });
  announce('Skyhawk Valley. Press Space or tap to fly.');
  requestAnimationFrame(frame);
}

if (shot) runShot(shot);
else runGame();
