// HUD for Skyhawk Valley 3D: altitude, speed, heading, fuel, hull,
// mission banner and the artificial horizon. One file, one job:
// every instrument the pilot reads, drawn lit on dark glass.
// v2 adds altitude and speed tapes, a pitch ladder, a heading tape,
// a chevron guide to the next ring and an onboarding checklist.
import { compassPoint, headingDegrees } from './aircraft.js';
import { nextRing } from './missions.js';

export function drawHud(ctx, w, h, plane, missions, best, screen, onboarding, view) {
  const pad = 16;
  ctx.save();
  ctx.clearRect(0, 0, w, h);
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = 'rgba(6, 18, 34, 0.72)';
  roundRect(ctx, pad, pad, w - pad * 2, 64, 12);
  ctx.fill();
  ctx.strokeStyle = 'rgba(120, 220, 255, 0.5)';
  ctx.lineWidth = 1.5;
  roundRect(ctx, pad, pad, w - pad * 2, 64, 12);
  ctx.stroke();
  ctx.fillStyle = '#9fe8ff';
  ctx.font = '700 11px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('ALTITUDE', pad + 14, pad + 20);
  ctx.fillStyle = '#ffffff';
  ctx.font = '700 26px system-ui, sans-serif';
  ctx.fillText(`${Math.round(plane.alt)} FT`, pad + 14, pad + 50);
  ctx.fillStyle = '#9fe8ff';
  ctx.font = '700 11px system-ui, sans-serif';
  ctx.fillText('SPEED', pad + 190, pad + 20);
  ctx.fillStyle = '#ffffff';
  ctx.font = '700 26px system-ui, sans-serif';
  ctx.fillText(`${Math.round(plane.speed)} KT`, pad + 190, pad + 50);
  const cx = w / 2;
  ctx.fillStyle = '#9fe8ff';
  ctx.font = '700 11px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('HEADING', cx, pad + 20);
  ctx.fillStyle = '#ffffff';
  ctx.font = '700 26px system-ui, sans-serif';
  ctx.fillText(`${headingDegrees(plane)} ${compassPoint(plane)}`, cx, pad + 50);
  ctx.strokeStyle = 'rgba(255,255,255,0.35)';
  ctx.beginPath();
  ctx.moveTo(cx - 70, pad + 58);
  ctx.lineTo(cx + 70, pad + 58);
  ctx.stroke();
  ctx.fillStyle = '#9fe8ff';
  ctx.font = '700 11px system-ui, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText('SCORE', w - pad - 14, pad + 20);
  ctx.fillStyle = '#ffe27a';
  ctx.font = '700 26px system-ui, sans-serif';
  ctx.fillText(String(missions.score), w - pad - 14, pad + 50);
  ctx.fillStyle = '#9fe8ff';
  ctx.font = '700 11px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(`MISSION ${missions.level}  ${missions.name()}`, pad + 14, pad + 92);
  ctx.fillStyle = '#ffffff';
  ctx.font = '700 13px system-ui, sans-serif';
  const progress = missions.type() === 1 ? (missions.done ? 'LAND THE PLANE' : 'FIND THE RUNWAY') : `RINGS ${missions.ringsPassed} OF ${missions.rings.length}`;
  ctx.fillText(progress, pad + 14, pad + 110);
  ctx.fillStyle = '#9fe8ff';
  ctx.textAlign = 'right';
  ctx.fillText(`BEST ${best}`, w - pad - 14, pad + 92);
  ctx.fillText(view === 1 ? 'COCKPIT VIEW  C' : 'CHASE VIEW  C', w - pad - 14, pad + 110);
  drawTape(ctx, pad + 14, 150, 54, 220, plane.alt, 100, 'FT');
  drawTape(ctx, w - pad - 68, 150, 54, 220, plane.speed, 20, 'KT');
  if (view === 1) drawCockpitFrame(ctx, w, h, plane);
  drawHeadingTape(ctx, cx, 96, 420, plane);
  drawHorizonDial(ctx, cx, h - 108, 62, plane);
  drawBar(ctx, pad, h - 92, 210, 16, plane.fuel / 100, '#ffb020', 'FUEL');
  drawBar(ctx, pad, h - 64, 210, 16, plane.hull / 100, '#37e08a', 'HULL');
  drawThrottle(ctx, w - pad - 210, h - 92, plane);
  if (plane.flaps) {
    ctx.fillStyle = '#ffe27a';
    ctx.font = '700 12px system-ui, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('FLAPS DOWN  F', w - pad - 14, h - 108);
  }
  const ring = nextRing(missions);
  if (ring && screen === 'play' && missions.type() !== 1) drawChevron(ctx, w, h, plane, ring);
  if (missions.type() === 1 && screen === 'play') drawRunwayGuide(ctx, w, h, plane);
  if (missions.messageTime > 0 && missions.message) {
    ctx.font = '800 22px system-ui, sans-serif';
    const tw = ctx.measureText(missions.message).width;
    ctx.fillStyle = 'rgba(6, 18, 34, 0.78)';
    roundRect(ctx, cx - tw / 2 - 18, 148, tw + 36, 40, 10);
    ctx.fill();
    ctx.strokeStyle = '#ffe27a';
    ctx.stroke();
    ctx.fillStyle = '#ffe27a';
    ctx.textAlign = 'center';
    ctx.fillText(missions.message, cx, 175);
  }
  if (onboarding && screen === 'play') drawOnboarding(ctx, w, h, onboarding);
  if (plane.speed < 58 && screen === 'play') {
    ctx.fillStyle = '#ff5a4e';
    ctx.font = '800 24px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('STALL PULL UP ADD POWER', cx, h - 190);
  }
  ctx.restore();
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawBar(ctx, x, y, w, h, frac, color, label) {
  ctx.fillStyle = 'rgba(6, 18, 34, 0.72)';
  roundRect(ctx, x, y, w, h + 18, 8);
  ctx.fill();
  ctx.fillStyle = '#9fe8ff';
  ctx.font = '700 10px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(label, x + 8, y + 12);
  ctx.fillStyle = 'rgba(255,255,255,0.18)';
  roundRect(ctx, x + 52, y + 4, w - 62, h - 8, 4);
  ctx.fill();
  ctx.fillStyle = frac < 0.25 ? '#ff5a4e' : color;
  roundRect(ctx, x + 52, y + 4, Math.max(6, (w - 62) * Math.max(0, Math.min(1, frac))), h - 8, 4);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'right';
  ctx.fillText(`${Math.round(frac * 100)}`, x + w - 6, y + 12);
}

function drawThrottle(ctx, x, y, plane) {
  ctx.fillStyle = 'rgba(6, 18, 34, 0.72)';
  roundRect(ctx, x, y, 210, 46, 8);
  ctx.fill();
  ctx.fillStyle = '#9fe8ff';
  ctx.font = '700 10px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('THROTTLE', x + 8, y + 14);
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'right';
  ctx.fillText(`${Math.round(plane.throttle * 100)}`, x + 202, y + 14);
  ctx.fillStyle = 'rgba(255,255,255,0.18)';
  roundRect(ctx, x + 8, y + 22, 194, 12, 6);
  ctx.fill();
  ctx.fillStyle = '#7cc7ff';
  roundRect(ctx, x + 8, y + 22, Math.max(6, 194 * plane.throttle), 12, 6);
  ctx.fill();
}

function drawTape(ctx, x, y, w, h, value, step, unit) {
  ctx.fillStyle = 'rgba(6, 18, 34, 0.66)';
  roundRect(ctx, x, y, w, h, 8);
  ctx.fill();
  ctx.strokeStyle = 'rgba(120, 220, 255, 0.4)';
  ctx.stroke();
  const centre = y + h / 2;
  const perUnit = h / (step * 4);
  const base = Math.floor(value / step) * step;
  ctx.font = '700 11px system-ui, sans-serif';
  ctx.textAlign = 'left';
  for (let v = base - step * 2; v <= base + step * 2; v += step) {
    const ty = centre - (v - value) * perUnit;
    if (ty < y + 10 || ty > y + h - 10) continue;
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.beginPath();
    ctx.moveTo(x + w - 14, ty);
    ctx.lineTo(x + w - 4, ty);
    ctx.stroke();
    ctx.fillStyle = '#cfeeff';
    ctx.fillText(String(Math.round(v)), x + 6, ty + 4);
  }
  ctx.fillStyle = '#ffe27a';
  ctx.beginPath();
  ctx.moveTo(x + w, centre - 7);
  ctx.lineTo(x + w + 10, centre);
  ctx.lineTo(x + w, centre + 7);
  ctx.closePath();
  ctx.fill();
}

function drawCockpitFrame(ctx, w, h, plane) {
  const cx = w / 2;
  ctx.fillStyle = '#1c2733';
  ctx.beginPath();
  ctx.moveTo(0, h);
  ctx.lineTo(0, h - 118);
  ctx.quadraticCurveTo(cx, h - 168, w, h - 118);
  ctx.lineTo(w, h);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#2a3846';
  ctx.beginPath();
  ctx.moveTo(cx - 150, h);
  ctx.lineTo(cx - 60, h - 108);
  ctx.lineTo(cx + 60, h - 108);
  ctx.lineTo(cx + 150, h);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 226, 122, 0.6)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx - 60, h - 108);
  ctx.lineTo(cx + 60, h - 108);
  ctx.stroke();
  ctx.fillStyle = '#37e08a';
  ctx.beginPath();
  ctx.arc(cx - 34, h - 52, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = plane.speed < 58 ? '#ff5a4e' : '#37e08a';
  ctx.beginPath();
  ctx.arc(cx + 34, h - 52, 5, 0, Math.PI * 2);
  ctx.fill();
}

function drawHeadingTape(ctx, cx, y, w, plane) {
  const deg = ((plane.heading * 180) / Math.PI + 360) % 360;
  ctx.fillStyle = 'rgba(6, 18, 34, 0.66)';
  roundRect(ctx, cx - w / 2, y, w, 26, 8);
  ctx.fill();
  ctx.font = '700 11px system-ui, sans-serif';
  ctx.textAlign = 'center';
  for (let d = Math.floor((deg - 60) / 10) * 10; d <= deg + 60; d += 10) {
    const norm = ((d % 360) + 360) % 360;
    const dx = cx + (d - deg) * 3;
    if (dx < cx - w / 2 + 8 || dx > cx + w / 2 - 8) continue;
    ctx.fillStyle = norm % 90 === 0 ? '#ffffff' : '#9fe8ff';
    ctx.fillText(norm % 90 === 0 ? ['N', 'E', 'S', 'W'][Math.round(norm / 90) % 4] : String(norm), dx, y + 18);
  }
  ctx.fillStyle = '#ffe27a';
  ctx.beginPath();
  ctx.moveTo(cx - 6, y);
  ctx.lineTo(cx + 6, y);
  ctx.lineTo(cx, y + 8);
  ctx.closePath();
  ctx.fill();
}

function drawChevron(ctx, w, h, plane, ring) {
  const dx = ring.x - plane.x;
  const dz = ring.z - plane.z;
  const dy = ring.y - plane.alt;
  const dist = Math.round(Math.sqrt(dx * dx + dy * dy + dz * dz));
  const bearing = Math.atan2(dx, dz);
  let diff = bearing - plane.heading;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  const cx = w / 2;
  const cy = h * 0.32;
  const off = Math.max(-260, Math.min(260, diff * 420));
  const x = cx + off;
  const up = dy > 30;
  ctx.save();
  ctx.translate(x, cy);
  ctx.fillStyle = Math.abs(diff) < 0.25 ? '#ffe27a' : 'rgba(255, 226, 122, 0.75)';
  ctx.beginPath();
  ctx.moveTo(0, up ? -26 : 26);
  ctx.lineTo(20, up ? 14 : -14);
  ctx.lineTo(8, up ? 14 : -14);
  ctx.lineTo(8, up ? 26 : -26);
  ctx.lineTo(-8, up ? 26 : -26);
  ctx.lineTo(-8, up ? 14 : -14);
  ctx.lineTo(-20, up ? 14 : -14);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  ctx.fillStyle = '#ffffff';
  ctx.font = '800 18px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`NEXT RING ${dist} FT`, cx, cy + 62);
  ctx.fillStyle = '#9fe8ff';
  ctx.font = '700 12px system-ui, sans-serif';
  ctx.fillText(diff > 0.2 ? 'TURN RIGHT' : diff < -0.2 ? 'TURN LEFT' : 'STRAIGHT AHEAD', cx, cy + 82);
}

function drawRunwayGuide(ctx, w, h, plane) {
  const dx = 0 - plane.x;
  const dz = 7800 - plane.z;
  const dist = Math.round(Math.sqrt(dx * dx + dz * dz));
  const cx = w / 2;
  ctx.fillStyle = '#ffffff';
  ctx.font = '800 18px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`RUNWAY ${Math.max(0, dist)} FT AHEAD`, cx, h * 0.32);
  ctx.fillStyle = '#9fe8ff';
  ctx.font = '700 12px system-ui, sans-serif';
  ctx.fillText(Math.abs(dx) < 60 ? 'ON CENTRELINE' : dx > 0 ? 'DRIFT RIGHT TO CENTRE' : 'DRIFT LEFT TO CENTRE', cx, h * 0.32 + 22);
}

// Artificial horizon dial, drawn in the lower centre.
export function drawHorizonDial(ctx, x, y, radius, plane) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.clip();
  ctx.translate(x, y);
  ctx.rotate(-plane.roll * 0.6);
  ctx.translate(0, plane.pitch * radius * 1.4);
  ctx.fillStyle = '#2f7fd0';
  ctx.fillRect(-radius * 2, -radius * 2, radius * 4, radius * 2);
  ctx.fillStyle = '#7a5a2e';
  ctx.fillRect(-radius * 2, 0, radius * 4, radius * 2);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(-radius * 2, -2, radius * 4, 4);
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.font = '700 9px system-ui, sans-serif';
  ctx.textAlign = 'center';
  for (const pitchDeg of [-20, -10, 10, 20]) {
    const py = -pitchDeg * radius / 28;
    ctx.fillRect(-14, py, 28, 1);
    ctx.fillText(String(Math.abs(pitchDeg)), 22, py + 3);
  }
  ctx.restore();
  ctx.save();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = '#ffe27a';
  ctx.beginPath();
  ctx.moveTo(x - 18, y);
  ctx.lineTo(x - 4, y);
  ctx.lineTo(x, y + 5);
  ctx.lineTo(x + 4, y);
  ctx.lineTo(x + 18, y);
  ctx.lineTo(x + 18, y + 4);
  ctx.lineTo(x - 18, y + 4);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawOnboarding(ctx, w, h, onboarding) {
  const steps = [
    ['W OR S', 'SET THROTTLE', onboarding.throttle],
    ['ARROWS UP DOWN', 'PITCH THE NOSE', onboarding.pitch],
    ['ARROWS LEFT RIGHT', 'BANK AND TURN', onboarding.roll],
    ['GOLD RING', 'FLY THROUGH IT', onboarding.ring],
  ];
  const cx = w / 2;
  const y = h - 330;
  ctx.fillStyle = 'rgba(6, 18, 34, 0.72)';
  roundRect(ctx, cx - 210, y - 18, 420, 30 + steps.length * 24, 10);
  ctx.fill();
  ctx.font = '800 13px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillStyle = '#ffe27a';
  ctx.fillText('FIRST FLIGHT CHECKLIST', cx - 196, y + 4);
  ctx.font = '700 12px system-ui, sans-serif';
  steps.forEach((step, i) => {
    const sy = y + 26 + i * 24;
    ctx.fillStyle = step[2] ? '#37e08a' : '#ffffff';
    ctx.fillText(step[2] ? 'DONE' : 'TODO', cx - 196, sy);
    ctx.fillStyle = '#9fe8ff';
    ctx.fillText(step[0], cx - 140, sy);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(step[1], cx - 20, sy);
  });
}

export function drawScreen(ctx, w, h, screen, state, best) {
  ctx.save();
  ctx.textAlign = 'center';
  const cx = w / 2;
  if (screen === 'title') {
    ctx.fillStyle = 'rgba(4, 12, 24, 0.55)';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#ffe27a';
    ctx.font = '800 64px system-ui, sans-serif';
    ctx.fillText('SKYHAWK VALLEY', cx, h * 0.32);
    ctx.fillStyle = '#ffffff';
    ctx.font = '700 24px system-ui, sans-serif';
    ctx.fillText('REAL 3D FLIGHT OVER A GREEN VALLEY', cx, h * 0.32 + 44);
    ctx.fillStyle = '#cfeeff';
    ctx.font = '400 17px system-ui, sans-serif';
    ctx.fillText('Fly the gold rings. Land on the lit runway. Dodge the storms.', cx, h * 0.32 + 78);
    ctx.fillText('Arrows steer. W and S throttle. Shift boosts. F flaps. C changes view.', cx, h * 0.32 + 106);
    ctx.fillStyle = '#ffe27a';
    ctx.font = '800 22px system-ui, sans-serif';
    ctx.fillText('PRESS SPACE OR TAP TO FLY', cx, h * 0.32 + 152);
    ctx.fillStyle = '#9fe8ff';
    ctx.font = '700 14px system-ui, sans-serif';
    ctx.fillText(`BEST SCORE ${best}`, cx, h * 0.32 + 182);
  } else if (screen === 'paused') {
    ctx.fillStyle = 'rgba(4, 12, 24, 0.6)';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#ffffff';
    ctx.font = '800 44px system-ui, sans-serif';
    ctx.fillText('PAUSED', cx, h * 0.45);
    ctx.font = '700 18px system-ui, sans-serif';
    ctx.fillText('Press P to keep flying', cx, h * 0.45 + 40);
  } else if (screen === 'over') {
    ctx.fillStyle = 'rgba(20, 4, 4, 0.55)';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#ff5a4e';
    ctx.font = '800 52px system-ui, sans-serif';
    ctx.fillText('FLIGHT OVER', cx, h * 0.4);
    ctx.fillStyle = '#ffffff';
    ctx.font = '700 22px system-ui, sans-serif';
    ctx.fillText(`SCORE ${state.missions.score}   BEST ${best}`, cx, h * 0.4 + 44);
    ctx.fillStyle = '#cfeeff';
    ctx.font = '400 17px system-ui, sans-serif';
    ctx.fillText('Press R or Space to fly again', cx, h * 0.4 + 76);
  } else if (screen === 'complete') {
    ctx.fillStyle = 'rgba(4, 20, 12, 0.55)';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#37e08a';
    ctx.font = '800 52px system-ui, sans-serif';
    ctx.fillText('MISSION COMPLETE', cx, h * 0.4);
    ctx.fillStyle = '#ffffff';
    ctx.font = '700 22px system-ui, sans-serif';
    ctx.fillText(`SCORE ${state.missions.score}   BEST ${best}`, cx, h * 0.4 + 44);
    if (state.missions.landingGrade) {
      ctx.fillStyle = '#ffe27a';
      ctx.fillText(state.missions.landingGrade, cx, h * 0.4 + 76);
    }
    ctx.fillStyle = '#cfeeff';
    ctx.font = '400 17px system-ui, sans-serif';
    ctx.fillText('Press N for the next mission', cx, h * 0.4 + 108);
  }
  ctx.restore();
}
