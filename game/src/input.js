// Input for Skyhawk Valley: keyboard, mouse and on screen touch
// buttons. One file, one job: turn every device into one small
// control object the physics reads each frame.
// v2 adds F for flaps and C to switch chase and cockpit view.
export const ACTION_CONFIRM = 1;
export const ACTION_PAUSE = 2;
export const ACTION_MUTE = 4;
export const ACTION_NEXT = 8;
export const ACTION_FLAPS = 16;
export const ACTION_VIEW = 32;

const KEYMAP = {
  ArrowUp: 'up', ArrowDown: 'down',
  ArrowLeft: 'left', KeyA: 'left',
  ArrowRight: 'right', KeyD: 'right',
  ShiftLeft: 'boost', ShiftRight: 'boost',
  Space: 'boost',
  ControlLeft: 'brake', ControlRight: 'brake',
};

export function createInput(canvas) {
  const keys = new Set();
  const touch = { up: false, down: false, left: false, right: false, boost: false, brake: false };
  let actions = 0;
  let mouseX = 0;
  let mouseActive = false;
  function onKeyDown(event) {
    if (event.code === 'Space' || event.code === 'Enter') {
      actions |= ACTION_CONFIRM;
      event.preventDefault();
    }
    if (event.code === 'KeyP' || event.code === 'Escape') actions |= ACTION_PAUSE;
    if (event.code === 'KeyM') actions |= ACTION_MUTE;
    if (event.code === 'KeyN') actions |= ACTION_NEXT;
    if (event.code === 'KeyF') actions |= ACTION_FLAPS;
    if (event.code === 'KeyC') actions |= ACTION_VIEW;
    if (KEYMAP[event.code]) {
      keys.add(KEYMAP[event.code]);
      if (event.code.startsWith('Arrow')) event.preventDefault();
    }
    if (event.code === 'KeyR') actions |= ACTION_CONFIRM;
    if (event.code === 'KeyW') keys.add('throttleUp');
    if (event.code === 'KeyS') keys.add('throttleDown');
  }
  function onKeyUp(event) {
    if (KEYMAP[event.code]) keys.delete(KEYMAP[event.code]);
    if (event.code === 'KeyW') keys.delete('throttleUp');
    if (event.code === 'KeyS') keys.delete('throttleDown');
  }
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  canvas.addEventListener('pointerdown', (event) => {
    mouseActive = true;
    mouseX = event.clientX / window.innerWidth - 0.5;
    actions |= ACTION_CONFIRM;
  });
  canvas.addEventListener('pointermove', (event) => {
    if (mouseActive) mouseX = event.clientX / window.innerWidth - 0.5;
  });
  window.addEventListener('pointerup', () => { mouseActive = false; });
  function bindTouch(id, name) {
    const el = document.getElementById(id);
    if (!el) return;
    const on = (event) => { event.preventDefault(); touch[name] = true; actions |= ACTION_CONFIRM; };
    const off = (event) => { event.preventDefault(); touch[name] = false; };
    el.addEventListener('pointerdown', on);
    el.addEventListener('pointerup', off);
    el.addEventListener('pointercancel', off);
    el.addEventListener('pointerleave', off);
  }
  bindTouch('btnUp', 'up');
  bindTouch('btnDown', 'down');
  bindTouch('btnLeft', 'left');
  bindTouch('btnRight', 'right');
  bindTouch('btnBoost', 'boost');
  bindTouch('btnBrake', 'brake');
  return {
    isTouch() { return 'ontouchstart' in window || navigator.maxTouchPoints > 0; },
    controls() {
      const down = (name) => keys.has(name) || touch[name];
      let pitch = 0;
      if (down('up')) pitch -= 1;
      if (down('down')) pitch += 1;
      let roll = 0;
      // v2.2 fix: left input now gives positive roll so heading grows toward screen left, right input gives negative roll. Before this the two were swapped and the plane turned the wrong way.
      if (down('left')) roll += 1;
      if (down('right')) roll -= 1;
      // v2.2 fix: mouse drag uses the same sign as the keys now. Dragging right gives negative roll so the plane turns right, dragging left gives positive roll so it turns left. Before this the drag steered the wrong way too.
      if (mouseActive && Math.abs(mouseX) > 0.08) roll -= Math.max(-1, Math.min(1, mouseX * 2));
      return {
        pitch: Math.max(-1, Math.min(1, pitch)),
        roll: Math.max(-1, Math.min(1, roll)),
        boost: down('boost'),
        brake: down('brake'),
        throttleUp: keys.has('throttleUp'),
        throttleDown: keys.has('throttleDown'),
      };
    },
    throttleKeys() {
      return { up: keys.has('throttleUp'), down: keys.has('throttleDown') };
    },
    takeActions() {
      const value = actions;
      actions = 0;
      return value;
    },
  };
}
