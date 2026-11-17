// A small synthesized score: a dusk drone, a lance tick, and a chord when a ring seals.
export function createAudio() {
  let ctx = null;
  let master = null;
  let noise = null;
  let started = false;

  function ensure() {
    if (started) return true;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return false;
    ctx = new AudioCtx();
    master = ctx.createGain();
    master.gain.value = 0.22;
    master.connect(ctx.destination);
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 220;
    const drone = ctx.createGain();
    drone.gain.value = 0.07;
    filter.connect(drone);
    drone.connect(master);
    const low = ctx.createOscillator();
    low.type = 'sine';
    low.frequency.value = 55;
    const fifth = ctx.createOscillator();
    fifth.type = 'sine';
    fifth.frequency.value = 82.4;
    low.connect(filter);
    fifth.connect(filter);
    low.start();
    fifth.start();
    const samples = ctx.sampleRate * 0.25;
    noise = ctx.createBuffer(1, samples, ctx.sampleRate);
    const data = noise.getChannelData(0);
    for (let i = 0; i < data.length; i += 1) data[i] = Math.random() * 2 - 1;
    started = true;
    return true;
  }

  function tone(freq, when, dur, type, gain) {
    const osc = ctx.createOscillator();
    const amp = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    amp.gain.setValueAtTime(gain, when);
    amp.gain.exponentialRampToValueAtTime(0.0001, when + dur);
    osc.connect(amp);
    amp.connect(master);
    osc.start(when);
    osc.stop(when + dur + 0.02);
  }

  function crack(when, dur, gain) {
    const src = ctx.createBufferSource();
    src.buffer = noise;
    const amp = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 900;
    amp.gain.setValueAtTime(gain, when);
    amp.gain.exponentialRampToValueAtTime(0.0001, when + dur);
    src.connect(filter);
    filter.connect(amp);
    amp.connect(master);
    src.start(when);
    src.stop(when + dur);
  }

  return {
    unlock() {
      if (!ensure()) return;
      if (ctx.state === 'suspended') ctx.resume();
    },
    play(name, chorus) {
      if (!started) return;
      const now = ctx.currentTime;
      if (name === 'shot') tone(880, now, 0.05, 'square', 0.04);
      else if (name === 'tick') tone(320, now, 0.04, 'triangle', 0.03);
      else if (name === 'crack') crack(now, 0.08, 0.08);
      else if (name === 'hurt') {
        crack(now, 0.16, 0.16);
        tone(90, now, 0.2, 'sine', 0.08);
      } else if (name === 'seal' || name === 'win') {
        const chord = [523.25, 659.25, 783.99, 1046.5, 1318.5];
        const notes = name === 'win' ? 5 : 3 + Math.min(2, Math.floor((chorus || 1) / 2));
        for (let i = 0; i < notes; i += 1) tone(chord[i], now + i * 0.045, 0.28, 'triangle', 0.07);
      } else if (name === 'wave' || name === 'start') {
        tone(392, now, 0.12, 'triangle', 0.05);
        tone(523.25, now + 0.08, 0.16, 'triangle', 0.05);
      } else if (name === 'lose') {
        tone(196, now, 0.3, 'sine', 0.06);
        tone(130, now + 0.12, 0.4, 'sine', 0.06);
      }
    },
  };
}
