// The Skyhawk aircraft: position, speed, pitch, roll, heading, fuel
// and hull. One file, one job: pure flight physics with no drawing,
// so the loop, the missions and the screenshots all share one truth.
import { PLANE, WORLD } from './config.js';

export function createAircraft() {
  return {
    x: PLANE.startX,
    alt: PLANE.startAlt,
    z: 0,
    speed: PLANE.startSpeed,
    throttle: 0.55,
    pitch: 0,
    roll: 0,
    heading: 0,
    fuel: PLANE.fuelMax,
    hull: PLANE.hullMax,
    onGround: false,
    landed: false,
    verticalSpeed: 0,
    bank: 0,
  };
}

export function resetAircraft(plane, startZ) {
  const fresh = createAircraft();
  fresh.z = startZ || 0;
  Object.assign(plane, fresh);
}

// input: { pitch: -1..1, roll: -1..1, throttleDelta, boost }
// Returns event flags for the caller to score and sound.
export function updateAircraft(plane, input, dt, terrain) {
  const events = { stalled: false, scraped: false, crashed: false, outOfFuel: false };
  if (plane.onGround) {
    plane.speed = Math.max(0, plane.speed + (plane.throttle - 0.12) * 90 * dt);
    plane.z += plane.speed * dt * 0.9;
    if (plane.throttle > 0.6 && plane.speed > 70) {
      plane.onGround = false;
      plane.alt = terrain.groundHeight(plane.x, plane.z) + 6;
    }
    return events;
  }
  const targetSpeed = PLANE.minSpeed + plane.throttle * (PLANE.maxSpeed - PLANE.minSpeed);
  const boost = input.boost ? 26 : 0;
  plane.speed += ((targetSpeed + boost - plane.speed) * 0.55 + (input.pitch < 0 ? 6 : 0)) * dt;
  plane.speed = Math.max(28, Math.min(PLANE.maxSpeed + 30, plane.speed));
  const rollTarget = input.roll * PLANE.maxRoll;
  plane.roll += (rollTarget - plane.roll) * Math.min(1, PLANE.rollRate * dt * 2.2);
  plane.bank = plane.roll;
  plane.heading += plane.roll * PLANE.turnRate * (0.45 + plane.speed / 320) * dt;
  plane.heading = ((plane.heading + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI;
  const pitchTarget = input.pitch * 0.55;
  plane.pitch += (pitchTarget - plane.pitch) * Math.min(1, 3 * dt);
  const stalled = plane.speed < 58;
  if (stalled) events.stalled = true;
  const climb = -plane.pitch * PLANE.climbRate * (plane.speed / PLANE.cruiseSpeed) - (stalled ? PLANE.sinkRate * 0.7 : 0);
  const prevAlt = plane.alt;
  plane.alt += climb * dt;
  plane.verticalSpeed = (plane.alt - prevAlt) / dt;
  plane.x += Math.sin(plane.heading) * plane.speed * dt * 1.15;
  plane.z += Math.cos(plane.heading) * plane.speed * dt;
  plane.x = Math.max(-WORLD.width, Math.min(WORLD.width, plane.x));
  const drain = PLANE.fuelDrain * (0.35 + plane.throttle * 1.1 + (input.boost ? 0.9 : 0)) * dt;
  plane.fuel = Math.max(0, plane.fuel - drain);
  if (plane.fuel <= 0) {
    events.outOfFuel = true;
    plane.throttle = Math.max(0, plane.throttle - dt * 0.4);
    plane.alt -= PLANE.sinkRate * 0.35 * dt;
  }
  const ground = terrain.groundHeight(plane.x, plane.z);
  if (plane.alt <= ground + 2) {
    const hard = Math.abs(plane.verticalSpeed) > 26 || plane.speed > 200;
    const gentle = Math.abs(plane.verticalSpeed) <= 14 && plane.speed < 165 && Math.abs(plane.roll) < 0.3;
    if (gentle && Math.abs(plane.x - terrain.runway.x) < terrain.runway.width && plane.z > terrain.runway.z - terrain.runway.length && plane.z < terrain.runway.z + 120) {
      plane.onGround = true;
      plane.landed = true;
      plane.alt = ground + 2;
    } else {
      events.crashed = true;
      plane.hull = 0;
      plane.alt = ground + 2;
    }
    if (hard && !gentle) events.scraped = true;
  }
  return events;
}

// Damage from a storm cloud or a mountain graze.
export function damageAircraft(plane, amount) {
  plane.hull = Math.max(0, plane.hull - amount);
  return plane.hull <= 0;
}

export function headingDegrees(plane) {
  const deg = ((plane.heading * 180) / Math.PI + 360) % 360;
  return Math.round(deg);
}

export function compassPoint(plane) {
  const points = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const deg = ((plane.heading * 180) / Math.PI + 360) % 360;
  return points[Math.round(deg / 45) % 8];
}
