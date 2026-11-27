// Boot and the one loop for Zephyr Valley 3D: input is read every
// frame, the world advances in fixed 1/60 s steps, three.js paints
// the world and the HUD canvas paints the instruments on top.
// Screens: title, play, paused, over, complete.
//
// ?seed=N fixes the valley. ?shot=start|play|mission|storm|cockpit
// stages that scene instead of running the loop, paints it twice
// and sets window.__shotReady for a screenshot.
// v2.3 wires low fuel audio, touchdown dust and boost audio into
// the step, and exposes window.__game so headless checks can read
// the live state, the scene and the audio without guessing.
import { BEST_KEY, STEP } from './config.js';
import { createRandom } from './random.js';
import { createTerrain, hitsMountain } from './terrain.js';
import { createAircraft, damageAircraft, resetAircraft, updateAircraft } from './aircraft.js';
import { advanceLevel, createMissions, startMission, stormPush, updateMissions } from './missions.js';
import { createAudio } from './audio.js';
import { ACTION_CONFIRM, ACTION_FLAPS, ACTION_MUTE, ACTION_NEXT, ACTION_PAUSE, ACTION_VIEW, createInput } from './input.js';
import { createScene } from './scene.js';
import { drawHud, drawScreen } from './hud.js';
import { stageShot } from './shots.js';

const MAX_FRAME = 0.25;
const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);

const canvas = document.getElementById('game');
const hudCanvas = document.getElementById('hud');
const status = document.getElementById('status');
const audio = createAudio();
let scene = null;

function createGameState() {
  const random = createRandom(seed);
  const terrain = createTerrain(random);
  const plane = createAircraft();
  const missions = createMissions(random);
  const state = {
    plane, terrain, missions, random,
    time: 0,
    screen: 'title',
    lowFuelBeepAt: -10,
    lowFuelWarned: false,
    onboarding: { throttle: false, pitch: false, roll: false, ring: false },
    startMission() { startMission(state.missions, state.random, plane.z); },
    reset(nextSeed) {
      const freshRandom = createRandom(nextSeed || seed);
      state.random = freshRandom;
      state.terrain = createTerrain(freshRandom);
      state.missions = createMissions(freshRandom);
      state.time = 0;
      state.screen = 'title';
      state.lowFuelBeepAt = -10;
      state.lowFuelWarned = false;
      state.onboarding = { throttle: false, pitch: false, roll: false, ring: false };
      resetAircraft(plane, 0);
      state.startMission();
    },
    step(dt, input, demo) {
      state.time += dt;
      if (state.screen !== 'play' && !demo) return;
      if (input.throttleUp) { plane.throttle = Math.min(1, plane.throttle + 0.55 * dt); state.onboarding.throttle = true; }
      if (input.throttleDown) plane.throttle = Math.max(0, plane.throttle - 0.55 * dt);
      if (input.brake) plane.throttle = Math.max(0.08, plane.throttle - 0.8 * dt);
      if (input.pitch !== 0) state.onboarding.pitch = true;
      if (input.roll !== 0) state.onboarding.roll = true;
      stormPush(state.missions, plane, dt);
      const events = updateAircraft(plane, input, dt, state.terrain);
      const missionEvents = updateMissions(state.missions, plane, dt, state.terrain);
      if (missionEvents.ring) state.onboarding.ring = true;
      if (events.touched && scene) scene.dust(plane.x, plane.alt, plane.z);
      if (plane.lowFuel && state.time - state.lowFuelBeepAt > 2) {
        state.lowFuelBeepAt = state.time;
        audio.lowFuel();
      }
      if (plane.lowFuel && !state.lowFuelWarned) {
        state.lowFuelWarned = true;
        state.missions.message = 'LOW FUEL HEAD FOR MERIDIAN AIRSTRIP';
        state.missions.messageTime = 3;
      }
      if (plane.fuel > 30) state.lowFuelWarned = false;
      const peak = hitsMountain(state.terrain, plane.x, plane.alt, plane.z);
      if (peak && !plane.onGround) {
        const destroyed = damageAircraft(plane, 25 * dt);
        if (destroyed || plane.hull <= 0) {
          state.screen = 'over';
          audio.crash();
          return;
        }
      }
      if (missionEvents.ring) audio.ring();
      if (missionEvents.gate) audio.gate();
      if (missionEvents.storm) { damageAircraft(plane, 18); audio.storm(); }
      if (missionEvents.landed) audio.land();
      if (events.crashed) {
        audio.crash();
        state.screen = 'over';
        return;
      }
      if (missionEvents.complete) {
        state.screen = 'complete';
        return;
      }
      if (plane.hull <= 0 || (events.outOfFuel && plane.alt <= state.terrain.groundHeight(plane.x, plane.z) + 4)) {
        state.screen = 'over';
        return;
      }
      if (plane.z > state.terrain.runway.z + 900 && state.missions.type() === 1 && !state.missions.done) {
        plane.z = 0;
        resetAircraft(plane, 0);
        plane.alt = 420;
      }
      audio.setEngine(plane.throttle, plane.speed, state.screen === 'play', plane.boosting);
    },
  };
  state.startMission();
  return state;
}

const state = createGameState();
window.__game = { state, audio, get scene() { return scene; } };

function readBest() {
  try { return Number.parseInt(window.localStorage.getItem(BEST_KEY) ?? '0', 10) || 0; }
  catch { return 0; }
}
function saveBest(value) {
  try { window.localStorage.setItem(BEST_KEY, String(value)); }
  catch { /* storage can be off; best lasts this visit only */ }
}

function paintFrame(best, screenOverride) {
  const w = window.innerWidth;
  const h = window.innerHeight;
  if (canvas.width !== w || canvas.height !== h) scene.resize(w, h);
  if (hudCanvas.width !== w || hudCanvas.height !== h) { hudCanvas.width = w; hudCanvas.height = h; }
  const screen = screenOverride || state.screen;
  const showOnboarding = state.missions.level === 1 && state.missions.index === 0 && !(state.onboarding.throttle && state.onboarding.pitch && state.onboarding.roll && state.onboarding.ring);
  scene.draw(state, STEP, state.time);
  const ctx = hudCanvas.getContext('2d');
  drawHud(ctx, w, h, state.plane, state.missions, best, screen, showOnboarding ? state.onboarding : null, scene.view());
  if (screen !== 'play') drawScreen(ctx, w, h, screen, state, best);
}

function runShot(name) {
  scene = createScene(canvas, state.terrain);
  const staged = stageShot(name, state);
  state.screen = staged.screen;
  scene.setView(staged.view);
  scene.snap(state);
  let painted = 0;
  function paint() {
    paintFrame(staged.best, staged.screen);
    painted += 1;
    if (painted < 3) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
}

function runGame() {
  const input = createInput(canvas);
  scene = createScene(canvas, state.terrain);
  window.__input = input;
  let best = readBest();
  let accumulator = 0;
  let last = performance.now();
  const touchBar = document.getElementById('touchbar');
  if (touchBar && input.isTouch()) touchBar.classList.add('show');

  function announce(message) { status.textContent = message; }
  function startGame() {
    state.reset(seed);
    state.screen = 'play';
    scene.setView(0);
    scene.snap(state);
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
    if (actions & ACTION_FLAPS && state.screen === 'play') { state.plane.flaps = !state.plane.flaps; announce(state.plane.flaps ? 'Flaps down.' : 'Flaps up.'); }
    if (actions & ACTION_VIEW && state.screen === 'play') { scene.toggleView(); }
    if (actions & ACTION_CONFIRM && (state.screen === 'title' || state.screen === 'over')) startGame();
    else if (actions & ACTION_NEXT && state.screen === 'complete') {
      advanceLevel(state.missions, state.random, state.plane.z);
      resetAircraft(state.plane, 0);
      state.plane.alt = 420;
      state.screen = 'play';
      announce(`Mission ${state.missions.level}. ${state.missions.name()}.`);
    } else if (actions & ACTION_PAUSE && state.screen === 'play') {
      state.screen = 'paused';
      announce('Paused.');
    } else if (actions & (ACTION_PAUSE | ACTION_CONFIRM) && state.screen === 'paused') {
      state.screen = 'play';
      announce('Playing.');
    }
  }
  function frame(now) {
    requestAnimationFrame(frame);
    accumulator += Math.min((now - last) / 1000, MAX_FRAME);
    last = now;
    handleActions();
    if (state.screen === 'title') {
      state.time += 1 / 60;
      state.plane.z += 2;
    } else if (state.screen === 'play') {
      while (accumulator >= STEP) {
        const controls = input.controls();
        const keys = input.throttleKeys();
        state.step(STEP, { ...controls, throttleUp: keys.up, throttleDown: keys.down, flaps: false }, false);
        accumulator -= STEP;
        if (state.screen !== 'play') break;
      }
      if (state.screen === 'over') endGame();
    } else {
      accumulator = 0;
    }
    paintFrame(best);
  }
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && state.screen === 'play') state.screen = 'paused';
  });
  announce('Zephyr Valley. Press Space or tap to fly.');
  requestAnimationFrame(frame);
}

if (shot) runShot(shot);
else runGame();
