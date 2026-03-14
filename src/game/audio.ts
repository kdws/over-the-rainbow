let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  return audioCtx;
}

function playTone(freq: number, duration: number, type: OscillatorType = 'square', volume = 0.15) {
  const ctx = getCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, ctx.currentTime);
  gain.gain.setValueAtTime(volume, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + duration);
}

export function playJump() {
  playTone(400, 0.1, 'square', 0.1);
  setTimeout(() => playTone(600, 0.1, 'square', 0.08), 50);
}

export function playHit() {
  playTone(150, 0.2, 'sawtooth', 0.15);
  setTimeout(() => playTone(100, 0.3, 'sawtooth', 0.1), 100);
}

export function playTreasure() {
  const notes = [523, 659, 784, 1047];
  notes.forEach((freq, i) => {
    setTimeout(() => playTone(freq, 0.3, 'square', 0.12), i * 120);
  });
}

export function playCoin() {
  playTone(880, 0.08, 'square', 0.08);
  setTimeout(() => playTone(1200, 0.1, 'square', 0.06), 60);
}

export function playStomp() {
  playTone(300, 0.1, 'square', 0.12);
  setTimeout(() => playTone(500, 0.15, 'square', 0.1), 50);
}

export function playGameOver() {
  const notes = [400, 350, 300, 200];
  notes.forEach((freq, i) => {
    setTimeout(() => playTone(freq, 0.3, 'sawtooth', 0.1), i * 200);
  });
}

export function initAudio() {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
}
