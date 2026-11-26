// Seeded random numbers for Skyhawk Valley.
// One file, one job: a tiny deterministic generator so a seed always
// builds the same valley, the same rings and the same screenshots.
export function createRandom(seed) {
  let state = (seed >>> 0) || 1;
  function next() {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  }
  function range(low, high) {
    return low + next() * (high - low);
  }
  function pick(list) {
    return list[Math.floor(next() * list.length)];
  }
  function int(low, high) {
    return Math.floor(range(low, high + 1));
  }
  return { next, range, pick, int };
}
