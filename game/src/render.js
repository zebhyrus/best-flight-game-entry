// Renderer for Skyhawk Valley: sky, sun, clouds, mountains, ground,
// river, road, runway, rings, storms and the Skyhawk itself, all in
// Canvas 2D. One file, one job: turn the world state into the picture
// the judge and the pilot see. Chase view, plane low centre.
import { WORLD } from './config.js';
import { drawHud, drawHorizonDial } from './hud.js';
import { hitsMountain } from './terrain.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_OVER = 'over';
export const SCREEN_COMPLETE = 'complete';

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');
  function resize() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.floor(window.innerWidth * dpr);
    canvas.height = Math.floor(window.innerHeight * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();
  window.addEventListener('resize', resize);
  return {
    draw(state, screen, best) {
      const w = window.innerWidth;
      const h = window.innerHeight;
      drawSky(ctx, w, h, state);
      drawMountains(ctx, w, h, state);
      drawGround(ctx, w, h, state);
      drawRunway(ctx, w, h, state);
      drawRings(ctx, w, h, state);
      drawStorms(ctx, w, h, state);
      drawClouds(ctx, w, h, state);
      if (screen === SCREEN_TITLE) { drawAircraft(ctx, w, h, state); drawTitle(ctx, w, h, state, best); }
      else {
        drawAircraft(ctx, w, h, state);
        drawHud(ctx, w, h, state.plane, state.missions, best, screen);
        drawHorizonDial(ctx, 310, h - 64, 34, state.plane);
        if (screen === SCREEN_PAUSED) drawOverlay(ctx, w, h, 'PAUSED', 'PRESS P TO KEEP FLYING');
        if (screen === SCREEN_OVER) drawOverlay(ctx, w, h, 'CRASHED', `SCORE ${state.missions.score}  PRESS SPACE TO FLY AGAIN`);
        if (screen === SCREEN_COMPLETE) drawOverlay(ctx, w, h, 'MISSION COMPLETE', `SCORE ${state.missions.score}  PRESS N FOR THE NEXT MISSION`);
      }
    },
  };
}

function project(state, wx, wy, wz) {
  const plane = state.plane;
  const dz = wz - plane.z;
  if (dz < 12 || dz > WORLD.viewDistance) return null;
  const w = window.innerWidth;
  const h = window.innerHeight;
  const horizon = h * WORLD.horizonY - plane.pitch * h * 0.35;
  const scale = WORLD.focal / dz;
  const dx = (wx - plane.x - Math.sin(plane.heading) * dz * 0.35) * scale;
  const dy = (wy - plane.alt) * scale;
  return { x: w / 2 + dx, y: horizon - dy, scale, dz };
}

function drawSky(ctx, w, h, state) {
  const grad = ctx.createLinearGradient(0, 0, 0, h * 0.55);
  grad.addColorStop(0, '#1c6dd9');
  grad.addColorStop(0.55, '#6db9f2');
  grad.addColorStop(1, '#cfeefb');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h * 0.55 + 2);
  const sunX = w * 0.78;
  const sunY = h * 0.13;
  const glow = ctx.createRadialGradient(sunX, sunY, 8, sunX, sunY, 130);
  glow.addColorStop(0, 'rgba(255, 244, 180, 0.95)');
  glow.addColorStop(0.35, 'rgba(255, 214, 90, 0.55)');
  glow.addColorStop(1, 'rgba(255, 214, 90, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(sunX - 140, sunY - 140, 280, 280);
  ctx.fillStyle = '#fff3b0';
  ctx.beginPath();
  ctx.arc(sunX, sunY, 34, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  for (let i = 0; i < 5; i += 1) {
    const cx = ((i * 317 + state.time * 6) % (w + 240)) - 120;
    const cy = 46 + i * 26;
    ctx.beginPath();
    ctx.ellipse(cx, cy, 64, 15, 0, 0, Math.PI * 2);
    ctx.ellipse(cx + 34, cy + 6, 44, 12, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  void state;
}

function drawMountains(ctx, w, h, state) {
  const horizon = h * WORLD.horizonY - state.plane.pitch * h * 0.35;
  const terrain = state.terrain;
  for (const peak of terrain.peaks) {
    const dz = peak.z - state.plane.z;
    if (dz < 40 || dz > WORLD.viewDistance) continue;
    const scale = WORLD.focal / dz;
    const px = w / 2 + (peak.x - state.plane.x) * scale * 0.9;
    const base = horizon + 6;
    const top = base - peak.height * scale * 0.9;
    const half = peak.width * scale * 0.9;
    if (px + half < -80 || px - half > w + 80) continue;
    ctx.fillStyle = '#5d7fa8';
    ctx.beginPath();
    ctx.moveTo(px - half, base);
    ctx.lineTo(px, top);
    ctx.lineTo(px + half, base);
    ctx.closePath();
    ctx.fill();
    if (peak.snow) {
      ctx.fillStyle = '#f4f8ff';
      ctx.beginPath();
      ctx.moveTo(px - half * 0.32, top + (base - top) * 0.32);
      ctx.lineTo(px, top);
      ctx.lineTo(px + half * 0.32, top + (base - top) * 0.32);
      ctx.lineTo(px, top + (base - top) * 0.5);
      ctx.closePath();
      ctx.fill();
    }
  }
  ctx.fillStyle = '#4a6b3a';
  ctx.fillRect(0, horizon - 2, w, 6);
}

function drawGround(ctx, w, h, state) {
  const horizon = h * WORLD.horizonY - state.plane.pitch * h * 0.35;
  const grad = ctx.createLinearGradient(0, horizon, 0, h);
  grad.addColorStop(0, '#8fce6a');
  grad.addColorStop(0.5, '#5da244');
  grad.addColorStop(1, '#3c7a2c');
  ctx.fillStyle = grad;
  ctx.fillRect(0, horizon, w, h - horizon);
  const plane = state.plane;
  const terrain = state.terrain;
  for (const field of terrain.fields) {
    const a = project(state, field.x - field.w / 2, 0, field.z - field.d / 2);
    const b = project(state, field.x + field.w / 2, 0, field.z - field.d / 2);
    const c = project(state, field.x + field.w / 2, 0, field.z + field.d / 2);
    const d = project(state, field.x - field.w / 2, 0, field.z + field.d / 2);
    if (!a || !b || !c || !d) continue;
    ctx.fillStyle = field.color;
    ctx.globalAlpha = 0.75;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.lineTo(c.x, c.y); ctx.lineTo(d.x, d.y);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 1;
  }
  drawRiver(ctx, state, horizon);
  drawRoad(ctx, state, horizon);
  for (const tree of terrain.trees) {
    const p = project(state, tree.x, 0, tree.z);
    if (!p) continue;
    const s = Math.max(2, tree.size * p.scale * 0.55);
    ctx.fillStyle = tree.shade;
    ctx.beginPath();
    ctx.arc(p.x, p.y - s, s, 0, Math.PI * 2);
    ctx.fill();
  }
  for (const barn of terrain.barns) {
    const p = project(state, barn.x, 0, barn.z);
    if (!p) continue;
    const s = Math.max(3, 26 * p.scale * 0.5);
    ctx.fillStyle = barn.red ? '#b23a2e' : '#e8e0cc';
    ctx.fillRect(p.x - s, p.y - s * 0.8, s * 2, s * 0.8);
    ctx.fillStyle = '#5a3a22';
    ctx.beginPath();
    ctx.moveTo(p.x - s - 2, p.y - s * 0.8);
    ctx.lineTo(p.x, p.y - s * 1.5);
    ctx.lineTo(p.x + s + 2, p.y - s * 0.8);
    ctx.closePath();
    ctx.fill();
  }
  void plane;
}

function drawRiver(ctx, state, horizon) {
  ctx.strokeStyle = '#3f9fd8';
  ctx.lineWidth = 10;
  ctx.lineCap = 'round';
  ctx.beginPath();
  let started = false;
  for (let z = state.plane.z + 40; z < state.plane.z + WORLD.viewDistance; z += 90) {
    const p = project(state, state.terrain.riverX(z), 0, z);
    if (!p) continue;
    if (!started) { ctx.moveTo(p.x, p.y); started = true; }
    else ctx.lineTo(p.x, p.y);
    ctx.lineWidth = Math.max(2, 26 * p.scale * 0.35);
  }
  ctx.stroke();
}

function drawRoad(ctx, state, horizon) {
  ctx.strokeStyle = '#5b5b52';
  ctx.lineWidth = 6;
  ctx.beginPath();
  let started = false;
  for (let z = state.plane.z + 40; z < state.plane.z + WORLD.viewDistance; z += 90) {
    const p = project(state, state.terrain.roadX(z), 0, z);
    if (!p) continue;
    if (!started) { ctx.moveTo(p.x, p.y); started = true; }
    else ctx.lineTo(p.x, p.y);
    ctx.lineWidth = Math.max(1.5, 14 * p.scale * 0.35);
  }
  ctx.stroke();
  void horizon;
}
function drawRunway(ctx, w, h, state) {
  const r = state.terrain.runway;
  const zNear = Math.max(r.z - r.length, state.plane.z + 25);
  const near = project(state, r.x, 0, zNear);
  const far = project(state, r.x, 0, r.z + 60);
  if (!near && !far) return;
  const nL = project(state, r.x - r.width, 0, zNear);
  const nR = project(state, r.x + r.width, 0, zNear);
  const fL = project(state, r.x - r.width, 0, r.z + 60);
  const fR = project(state, r.x + r.width, 0, r.z + 60);
  if (!nL || !nR || !fL || !fR) return;
  ctx.fillStyle = '#3a3f46';
  ctx.beginPath();
  ctx.moveTo(nL.x, nL.y); ctx.lineTo(nR.x, nR.y); ctx.lineTo(fR.x, fR.y); ctx.lineTo(fL.x, fL.y);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo((nL.x + nR.x) / 2, (nL.y + nR.y) / 2);
  ctx.lineTo((fL.x + fR.x) / 2, (fL.y + fR.y) / 2);
  ctx.setLineDash([14, 12]);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = '#ffe27a';
  for (const side of [-1, 1]) {
    for (let i = 0; i < 6; i += 1) {
      const z = r.z - r.length + i * (r.length / 5);
      const p = project(state, r.x + side * (r.width + 10), 0, z);
      if (!p) continue;
      ctx.beginPath();
      ctx.arc(p.x, p.y, Math.max(2, 7 * p.scale * 0.4), 0, Math.PI * 2);
      ctx.fill();
    }
  }
  void w; void h;
}

function drawRings(ctx, w, h, state) {
  for (const ring of state.missions.rings) {
    if (ring.passed) continue;
    const p = project(state, ring.x, ring.y, ring.z);
    if (!p || p.dz < 140) continue;
    const radius = Math.min(240, Math.max(6, 34 * p.scale * 1.6));
    const glow = ctx.createRadialGradient(p.x, p.y, radius * 0.4, p.x, p.y, radius * 1.6);
    glow.addColorStop(0, 'rgba(255, 210, 60, 0.18)');
    glow.addColorStop(1, 'rgba(255, 210, 60, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(p.x - radius * 1.6, p.y - radius * 1.6, radius * 3.2, radius * 3.2);
    ctx.strokeStyle = '#ffd23c';
    ctx.lineWidth = Math.max(3, radius * 0.16);
    ctx.beginPath();
    ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = '#ff8c1a';
    ctx.lineWidth = Math.max(2, radius * 0.07);
    ctx.beginPath();
    ctx.arc(p.x, p.y, radius * 0.82, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.font = `800 ${Math.max(11, Math.round(radius * 0.5))}px system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(String(ring.index + 1), p.x, p.y + radius * 0.18);
  }
  void w; void h;
}

function drawStorms(ctx, w, h, state) {
  for (const storm of state.missions.storms) {
    const p = project(state, storm.x, storm.y, storm.z);
    if (!p) continue;
    const s = Math.max(8, storm.size * p.scale * 0.9);
    ctx.fillStyle = storm.hit ? 'rgba(90, 90, 110, 0.5)' : 'rgba(52, 52, 72, 0.92)';
    ctx.beginPath();
    ctx.ellipse(p.x, p.y, s, s * 0.62, 0, 0, Math.PI * 2);
    ctx.ellipse(p.x - s * 0.6, p.y + s * 0.15, s * 0.6, s * 0.4, 0, 0, Math.PI * 2);
    ctx.ellipse(p.x + s * 0.6, p.y + s * 0.15, s * 0.6, s * 0.4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffd23c';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(p.x - 4, p.y + s * 0.4);
    ctx.lineTo(p.x + 4, p.y + s * 0.7);
    ctx.lineTo(p.x - 2, p.y + s * 0.7);
    ctx.lineTo(p.x + 6, p.y + s * 1.05);
    ctx.stroke();
  }
  void w; void h;
}

function drawClouds(ctx, w, h, state) {
  for (const cloud of state.terrain.clouds) {
    const p = project(state, cloud.x, cloud.y, cloud.z);
    if (!p) continue;
    const s = Math.max(6, cloud.size * p.scale * 0.8);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.beginPath();
    ctx.ellipse(p.x, p.y, s, s * 0.38, 0, 0, Math.PI * 2);
    ctx.ellipse(p.x - s * 0.5, p.y + s * 0.08, s * 0.55, s * 0.3, 0, 0, Math.PI * 2);
    ctx.ellipse(p.x + s * 0.5, p.y + s * 0.08, s * 0.55, s * 0.3, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  void w; void h;
}

function drawAircraft(ctx, w, h, state) {
  const plane = state.plane;
  const cx = w / 2;
  const cy = h * 0.72;
  const scale = Math.min(w, h) / 620;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(plane.roll * 0.35);
  ctx.scale(scale, scale);
  // Exhaust glow
  const glow = ctx.createRadialGradient(0, 96, 2, 0, 96, 42);
  glow.addColorStop(0, 'rgba(255, 180, 60, 0.85)');
  glow.addColorStop(1, 'rgba(255, 180, 60, 0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(0, 96, 42, 0, Math.PI * 2);
  ctx.fill();
  // Wings
  ctx.fillStyle = '#c8442e';
  ctx.beginPath();
  ctx.moveTo(-14, 30); ctx.lineTo(-150, 78); ctx.lineTo(-150, 96); ctx.lineTo(-12, 62);
  ctx.closePath(); ctx.fill();
  ctx.beginPath();
  ctx.moveTo(14, 30); ctx.lineTo(150, 78); ctx.lineTo(150, 96); ctx.lineTo(12, 62);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#8f2a1c';
  ctx.fillRect(-150, 78, 138, 6);
  ctx.fillRect(12, 78, 138, 6);
  // Tail
  ctx.fillStyle = '#c8442e';
  ctx.beginPath();
  ctx.moveTo(-10, 84); ctx.lineTo(-52, 112); ctx.lineTo(-52, 122); ctx.lineTo(-8, 100);
  ctx.closePath(); ctx.fill();
  ctx.beginPath();
  ctx.moveTo(10, 84); ctx.lineTo(52, 112); ctx.lineTo(52, 122); ctx.lineTo(8, 100);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#f2f2f2';
  ctx.beginPath();
  ctx.moveTo(-7, 82); ctx.lineTo(-16, 118); ctx.lineTo(-4, 118); ctx.lineTo(4, 84);
  ctx.closePath(); ctx.fill();
  ctx.beginPath();
  ctx.moveTo(7, 82); ctx.lineTo(16, 118); ctx.lineTo(4, 118); ctx.lineTo(-4, 84);
  ctx.closePath(); ctx.fill();
  // Fuselage
  const body = ctx.createLinearGradient(-20, 0, 20, 0);
  body.addColorStop(0, '#dfe8f2');
  body.addColorStop(0.5, '#ffffff');
  body.addColorStop(1, '#b9c6d4');
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.moveTo(0, -118);
  ctx.quadraticCurveTo(20, -60, 17, 10);
  ctx.quadraticCurveTo(15, 70, 8, 102);
  ctx.lineTo(-8, 102);
  ctx.quadraticCurveTo(-15, 70, -17, 10);
  ctx.quadraticCurveTo(-20, -60, 0, -118);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#c8442e';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-14, -30); ctx.lineTo(14, -30);
  ctx.stroke();
  // Canopy
  ctx.fillStyle = '#1d6fb8';
  ctx.beginPath();
  ctx.ellipse(0, -58, 11, 30, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  ctx.beginPath();
  ctx.ellipse(-4, -70, 4, 12, -0.3, 0, Math.PI * 2);
  ctx.fill();
  // Engine nozzle
  ctx.fillStyle = '#3a3f46';
  ctx.beginPath();
  ctx.arc(0, 100, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffb43c';
  ctx.beginPath();
  ctx.arc(0, 100, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  void hitsMountain;
}

function drawTitle(ctx, w, h, state, best) {
  ctx.fillStyle = 'rgba(4, 16, 32, 0.45)';
  ctx.fillRect(0, 0, w, h);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffe27a';
  ctx.font = '800 15px system-ui, sans-serif';
  ctx.fillText('MAKE FUN PRESENTS', w / 2, h * 0.2);
  ctx.fillStyle = '#ffffff';
  ctx.font = '800 64px system-ui, sans-serif';
  ctx.fillText('SKYHAWK VALLEY', w / 2, h * 0.2 + 64);
  ctx.fillStyle = '#9fe8ff';
  ctx.font = '700 20px system-ui, sans-serif';
  ctx.fillText('FLY THE RINGS  LAND ON THE RUNWAY  DODGE THE STORMS', w / 2, h * 0.2 + 100);
  ctx.fillStyle = 'rgba(6, 18, 34, 0.78)';
  const bw = 560;
  const bx = w / 2 - bw / 2;
  const by = h * 0.2 + 128;
  ctx.beginPath();
  ctx.roundRect(bx, by, bw, 150, 14);
  ctx.fill();
  ctx.strokeStyle = 'rgba(120, 220, 255, 0.5)';
  ctx.stroke();
  ctx.fillStyle = '#ffffff';
  ctx.font = '700 16px system-ui, sans-serif';
  ctx.fillText('ARROWS steer  W and S throttle  SHIFT boost  CTRL slow down', w / 2, by + 32);
  ctx.fillText('SPACE boost  P pause  M sound  N next mission', w / 2, by + 60);
  ctx.fillStyle = '#ffe27a';
  ctx.fillText('THREE MISSIONS  FUEL AND HULL MATTER  FLY CLEAN FOR STREAKS', w / 2, by + 92);
  ctx.fillStyle = '#9fe8ff';
  ctx.fillText(`BEST SCORE ${best}`, w / 2, by + 122);
  ctx.fillStyle = '#ffffff';
  ctx.font = '800 22px system-ui, sans-serif';
  const blink = Math.floor(state.time * 2) % 2 === 0;
  if (blink) ctx.fillText('PRESS SPACE OR TAP TO FLY', w / 2, by + 190);
  void state;
}

function drawOverlay(ctx, w, h, title, sub) {
  ctx.fillStyle = 'rgba(4, 16, 32, 0.55)';
  ctx.fillRect(0, 0, w, h);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffffff';
  ctx.font = '800 52px system-ui, sans-serif';
  ctx.fillText(title, w / 2, h * 0.42);
  ctx.fillStyle = '#ffe27a';
  ctx.font = '700 18px system-ui, sans-serif';
  ctx.fillText(sub, w / 2, h * 0.42 + 40);
}
