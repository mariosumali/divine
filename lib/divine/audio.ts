export type SoundCue = 'enter' | 'tick' | 'shuffle' | 'deal' | 'reveal' | 'liquid' | 'crack' | 'resolve';

let context: AudioContext | null = null;
let enabled = false;

function audio(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  context ??= new AudioContext();
  return context;
}

function tone(ctx: AudioContext, frequency: number, duration: number, gainValue = 0.05, delay = 0) {
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(frequency, ctx.currentTime + delay);
  gain.gain.setValueAtTime(0.0001, ctx.currentTime + delay);
  gain.gain.exponentialRampToValueAtTime(gainValue, ctx.currentTime + delay + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + delay + duration);
  oscillator.connect(gain).connect(ctx.destination);
  oscillator.start(ctx.currentTime + delay);
  oscillator.stop(ctx.currentTime + delay + duration + 0.02);
}

function noise(ctx: AudioContext, duration: number, gainValue: number, frequency: number) {
  const length = Math.max(1, Math.floor(ctx.sampleRate * duration));
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const channel = buffer.getChannelData(0);
  for (let i = 0; i < length; i += 1) channel[i] = Math.random() * 2 - 1;
  const source = ctx.createBufferSource();
  const filter = ctx.createBiquadFilter();
  const gain = ctx.createGain();
  filter.type = 'bandpass';
  filter.frequency.value = frequency;
  filter.Q.value = 0.9;
  gain.gain.setValueAtTime(gainValue, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
  source.buffer = buffer;
  source.connect(filter).connect(gain).connect(ctx.destination);
  source.start();
}

export async function setSoundEnabled(value: boolean) {
  enabled = value;
  if (value) {
    const ctx = audio();
    if (ctx?.state === 'suspended') await ctx.resume();
  } else if (context?.state === 'running') {
    await context.suspend();
  }
}

export function playSound(cue: SoundCue) {
  const ctx = enabled ? audio() : null;
  if (!ctx || ctx.state !== 'running') return;
  if (cue === 'enter') { tone(ctx, 82, 1.2, 0.055); tone(ctx, 246, 1.1, 0.025, 0.08); }
  if (cue === 'tick') tone(ctx, 880, 0.07, 0.025);
  if (cue === 'shuffle') { noise(ctx, 0.34, 0.06, 1300); tone(ctx, 120, 0.28, 0.018); }
  if (cue === 'deal') { noise(ctx, 0.1, 0.045, 900); tone(ctx, 164, 0.12, 0.018); }
  if (cue === 'reveal') { noise(ctx, 0.08, 0.025, 1800); tone(ctx, 523, 0.55, 0.04); tone(ctx, 784, 0.5, 0.018, 0.05); }
  if (cue === 'liquid') { noise(ctx, 0.55, 0.05, 280); tone(ctx, 95, 0.5, 0.04); }
  if (cue === 'crack') { noise(ctx, 0.18, 0.09, 2400); tone(ctx, 196, 0.22, 0.035, 0.1); }
  if (cue === 'resolve') { tone(ctx, 392, 0.8, 0.04); tone(ctx, 587, 0.9, 0.025, 0.08); tone(ctx, 784, 1, 0.015, 0.16); }
}

export function suspendSound() {
  if (context?.state === 'running') void context.suspend();
}
