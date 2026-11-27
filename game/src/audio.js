// Synthesised sound for Zephyr Valley: engine hum, ring chime,
// landing thud, storm buzz and crash, all from WebAudio oscillators
// and noise. One file, one job: no audio files, nothing to download.
// v2 adds wind rush that grows with speed and a stall rattle.
// v2.3 adds a low fuel warning beep and a wind swell on boost, so
// boost is heard as well as seen through the wider camera view.
export function createAudio() {
  let context = null;
  let engineOsc = null;
  let engineGain = null;
  let windGain = null;
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
      const windLen = context.sampleRate;
      const windBuffer = context.createBuffer(1, windLen, context.sampleRate);
      const windData = windBuffer.getChannelData(0);
      for (let i = 0; i < windLen; i += 1) windData[i] = Math.random() * 2 - 1;
      const wind = context.createBufferSource();
      wind.buffer = windBuffer;
      wind.loop = true;
      const windFilter = context.createBiquadFilter();
      windFilter.type = 'bandpass';
      windFilter.frequency.value = 700;
      windGain = context.createGain();
      windGain.gain.value = 0;
      wind.connect(windFilter);
      windFilter.connect(windGain);
      windGain.connect(context.destination);
      wind.start();
    } catch {
      context = null;
    }
    return context;
  }
  function tone(freq, dur, type, vol, slideTo, delay) {
    if (!enabled || !ensure()) return;
    try {
      const start = context.currentTime + (delay || 0);
      const osc = context.createOscillator();
      osc.type = type || 'sine';
      osc.frequency.setValueAtTime(freq, start);
      if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, start + dur);
      const gain = context.createGain();
      gain.gain.setValueAtTime(vol || 0.12, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + dur);
      osc.connect(gain);
      gain.connect(context.destination);
      osc.start(start);
      osc.stop(start + dur + 0.05);
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
    setEngine(throttle, speed, flying, boost) {
      if (!ensure() || !engineGain) return;
      try {
        const target = flying ? 0.02 + throttle * 0.05 + speed / 9000 : 0;
        engineGain.gain.setTargetAtTime(enabled ? target : 0, context.currentTime, 0.15);
        engineOsc.frequency.setTargetAtTime(46 + throttle * 55 + speed * 0.12 + (boost ? 14 : 0), context.currentTime, 0.2);
        const windTarget = enabled && flying ? Math.max(0, speed - 60) / 4000 + (boost ? 0.045 : 0) : 0;
        if (windGain) windGain.gain.setTargetAtTime(windTarget, context.currentTime, 0.15);
      } catch { /* ignore */ }
    },
    ring() { tone(880, 0.18, 'sine', 0.16); tone(1318, 0.3, 'sine', 0.12); },
    storm() { tone(140, 0.4, 'square', 0.1, 70); noise(0.3, 0.2, 500); },
    land() { noise(0.35, 0.3, 300); tone(120, 0.3, 'sine', 0.16, 60); },
    crash() { noise(0.9, 0.4, 420); tone(90, 0.8, 'sawtooth', 0.16, 32); },
    click() { tone(660, 0.07, 'sine', 0.1); },
    lowFuel() { tone(980, 0.14, 'square', 0.1); tone(740, 0.18, 'square', 0.1, 0, 0.22); },
    gate() { tone(990, 0.14, 'sine', 0.14); tone(1480, 0.22, 'sine', 0.1); },
    toggle() { enabled = !enabled; return enabled; },
    isEnabled() { return enabled; },
  };
}
