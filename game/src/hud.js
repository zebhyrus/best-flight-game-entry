// HUD for Skyhawk Valley: altitude, speed, heading, fuel, hull,
// mission banner and the artificial horizon. One file, one job:
// every instrument the pilot reads, drawn lit on dark glass.
import { compassPoint, headingDegrees } from './aircraft.js';

export function drawHud(ctx, w, h, plane, missions, best, screen) {
  const pad = 16;
  ctx.save();
  ctx.textBaseline = 'alphabetic';
  // Top bar
  ctx.fillStyle = 'rgba(6, 18, 34, 0.72)';
  roundRect(ctx, pad, pad, w - pad * 2, 64, 12);
  ctx.fill();
  ctx.strokeStyle = 'rgba(120, 220, 255, 0.5)';
  ctx.lineWidth = 1.5;
  roundRect(ctx, pad, pad, w - pad * 2, 64, 12);
  ctx.stroke();
  // Altitude
  ctx.fillStyle = '#9fe8ff';
  ctx.font = '700 11px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('ALTITUDE', pad + 14, pad + 20);
  ctx.fillStyle = '#ffffff';
  ctx.font = '700 26px system-ui, sans-serif';
  ctx.fillText(`${Math.round(plane.alt)} FT`, pad + 14, pad + 50);
  // Speed
  ctx.fillStyle = '#9fe8ff';
  ctx.font = '700 11px system-ui, sans-serif';
  ctx.fillText('SPEED', pad + 190, pad + 20);
  ctx.fillStyle = '#ffffff';
  ctx.font = '700 26px system-ui, sans-serif';
  ctx.fillText(`${Math.round(plane.speed)} KT`, pad + 190, pad + 50);
  // Heading compass
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
  // Score
  ctx.fillStyle = '#9fe8ff';
  ctx.font = '700 11px system-ui, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText('SCORE', w - pad - 14, pad + 20);
  ctx.fillStyle = '#ffe27a';
  ctx.font = '700 26px system-ui, sans-serif';
  ctx.fillText(String(missions.score), w - pad - 14, pad + 50);
  // Mission line
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
  // Fuel and hull bars, bottom left
  drawBar(ctx, pad, h - 92, 210, 16, plane.fuel / 100, '#ffb020', 'FUEL');
  drawBar(ctx, pad, h - 64, 210, 16, plane.hull / 100, '#37e08a', 'HULL');
  // Throttle gauge, bottom right
  drawThrottle(ctx, w - pad - 210, h - 92, plane);
  // Mission message banner
  if (missions.messageTime > 0 && missions.message) {
    ctx.font = '800 22px system-ui, sans-serif';
    const tw = ctx.measureText(missions.message).width;
    ctx.fillStyle = 'rgba(6, 18, 34, 0.78)';
    roundRect(ctx, cx - tw / 2 - 18, 108, tw + 36, 40, 10);
    ctx.fill();
    ctx.strokeStyle = '#ffe27a';
    ctx.stroke();
    ctx.fillStyle = '#ffe27a';
    ctx.textAlign = 'center';
    ctx.fillText(missions.message, cx, 135);
  }
  // Stall warning
  if (plane.speed < 58 && screen === 'play') {
    ctx.fillStyle = '#ff5a4e';
    ctx.font = '800 24px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('STALL PULL UP ADD POWER', cx, h - 130);
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
