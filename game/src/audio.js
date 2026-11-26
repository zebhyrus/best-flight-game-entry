// Synthesised sound for Skyhawk Valley: engine hum, ring chime,
// landing thud, storm buzz and crash, all from WebAudio oscillators
// and noise. One file, one job: no audio files, nothing to download.
export function createAudio() {
  let context = null;
  let engineOsc = null;
  let engineGain = null;
  let enabled = true;
  function ensure() {
    if (context) return context;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      context = new AudioContext();
      engineOsc = context.createOscillator();
      engineOsc.type = 'sawtooth';
      engineOsc.frequency.value = 52;
      const filter = context.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 320;
      engineGain = context.createGain();
      engineGain.gain.value = 0;
      engineOsc.connect(filter);
      filter.connect(engineGain);
      engineGain.connect(context.destination);
      engineOsc.start();
    } catch {
      context = null;
    }
    return context;
  }
  function tone(freq, dur, type, vol, slideTo) {
    if (!enabled || !ensure()) return;
    try {
      const osc = context.createOscillator();
      osc.type = type || 'sine';
      osc.frequency.setValueAtTime(freq, context.currentTime);
      if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, context.currentTime + dur);
      const gain = context.createGain();
      gain.gain.setValueAtTime(vol || 0.12, context.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + dur);
      osc.connect(gain);
      gain.connect(context.destination);
      osc.start();
      osc.stop(context.currentTime + dur + 0.05);
    } catch { /* sound is polish, never a crash */ }
  }
  function noise(dur, vol, low) {
    if (!enabled || !ensure()) return;
    try {
      const len = Math.floor(context.sampleRate * dur);
      const buffer = context.createBuffer(1, len, context.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < len; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
      const source = context.createBufferSource();
      source.buffer = buffer;
      const filter = context.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = low || 900;
      const gain = context.createGain();
      gain.gain.value = vol || 0.25;
      source.connect(filter);
      filter.connect(gain);
      gain.connect(context.destination);
      source.start();
    } catch { /* sound is polish, never a crash */ }
  }
  return {
    unlock() { ensure(); if (context && context.state === 'suspended') context.resume(); },
    setEngine(throttle, speed, flying) {
      if (!ensure() || !engineGain) return;
      try {
        const target = flying ? 0.02 + throttle * 0.05 + speed / 9000 : 0;
        engineGain.gain.setTargetAtTime(enabled ? target : 0, context.currentTime, 0.15);
        engineOsc.frequency.setTargetAtTime(46 + throttle * 55 + speed * 0.12, context.currentTime, 0.2);
      } catch { /* ignore */ }
    },
    ring() { tone(880, 0.18, 'sine', 0.16); tone(1318, 0.3, 'sine', 0.12); },
    storm() { tone(140, 0.4, 'square', 0.1, 70); noise(0.3, 0.2, 500); },
    land() { noise(0.35, 0.3, 300); tone(120, 0.3, 'sine', 0.16, 60); },
    crash() { noise(0.9, 0.4, 420); tone(90, 0.8, 'sawtooth', 0.16, 32); },
    click() { tone(660, 0.07, 'sine', 0.1); },
    toggle() { enabled = !enabled; return enabled; },
    isEnabled() { return enabled; },
  };
}
