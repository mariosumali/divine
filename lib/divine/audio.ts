export type SoundCue =
  | 'enter'
  | 'tick'
  | 'turn'
  | 'shuffle'
  | 'deal'
  | 'peel'
  | 'reveal'
  | 'liquid'
  | 'crack'
  | 'resolve';

type SampleName =
  | 'slide'
  | 'shuffle'
  | 'turn'
  | 'slice'
  | 'crinkle'
  | 'crumple';

const samplePaths: Record<SampleName, string> = {
  slide: '/audio/paper-slide.mp3',
  shuffle: '/audio/paper-shuffle.mp3',
  turn: '/audio/paper-turn.mp3',
  slice: '/audio/paper-slice.mp3',
  crinkle: '/audio/paper-crinkle.mp3',
  crumple: '/audio/paper-crumple.mp3',
};

let context: AudioContext | null = null;
let enabled = false;
let master: GainNode | null = null;
const buffers = new Map<SampleName, AudioBuffer>();
const pendingBuffers = new Map<SampleName, Promise<AudioBuffer | null>>();

function audio(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  context ??= new AudioContext();
  return context;
}

function output(ctx: AudioContext) {
  if (master) return master;
  const compressor = ctx.createDynamicsCompressor();
  master = ctx.createGain();
  compressor.threshold.value = -18;
  compressor.knee.value = 14;
  compressor.ratio.value = 4;
  compressor.attack.value = 0.004;
  compressor.release.value = 0.16;
  master.gain.value = 0.82;
  master.connect(compressor).connect(ctx.destination);
  return master;
}

function tone(
  ctx: AudioContext,
  frequency: number,
  duration: number,
  gainValue = 0.05,
  delay = 0,
  type: OscillatorType = 'sine',
) {
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, ctx.currentTime + delay);
  gain.gain.setValueAtTime(0.0001, ctx.currentTime + delay);
  gain.gain.exponentialRampToValueAtTime(
    gainValue,
    ctx.currentTime + delay + 0.015,
  );
  gain.gain.exponentialRampToValueAtTime(
    0.0001,
    ctx.currentTime + delay + duration,
  );
  oscillator.connect(gain).connect(output(ctx));
  oscillator.start(ctx.currentTime + delay);
  oscillator.stop(ctx.currentTime + delay + duration + 0.02);
}

function noise(
  ctx: AudioContext,
  duration: number,
  gainValue: number,
  frequency: number,
  delay = 0,
) {
  const length = Math.max(1, Math.floor(ctx.sampleRate * duration));
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const channel = buffer.getChannelData(0);
  for (let index = 0; index < length; index += 1)
    channel[index] = Math.random() * 2 - 1;
  const source = ctx.createBufferSource();
  const filter = ctx.createBiquadFilter();
  const gain = ctx.createGain();
  filter.type = 'bandpass';
  filter.frequency.value = frequency;
  filter.Q.value = 0.9;
  gain.gain.setValueAtTime(0.0001, ctx.currentTime + delay);
  gain.gain.exponentialRampToValueAtTime(
    gainValue,
    ctx.currentTime + delay + 0.008,
  );
  gain.gain.exponentialRampToValueAtTime(
    0.0001,
    ctx.currentTime + delay + duration,
  );
  source.buffer = buffer;
  source.connect(filter).connect(gain).connect(output(ctx));
  source.start(ctx.currentTime + delay);
}

function loadSample(ctx: AudioContext, name: SampleName) {
  const available = buffers.get(name);
  if (available) return Promise.resolve(available);
  const pending = pendingBuffers.get(name);
  if (pending) return pending;
  const request = fetch(samplePaths[name])
    .then((response) => {
      if (!response.ok) throw new Error(`Unable to load ${name}`);
      return response.arrayBuffer();
    })
    .then((data) => ctx.decodeAudioData(data))
    .then((buffer) => {
      buffers.set(name, buffer);
      return buffer;
    })
    .catch(() => null);
  pendingBuffers.set(name, request);
  return request;
}

function sample(
  ctx: AudioContext,
  name: SampleName,
  options: {
    gain?: number;
    rate?: number;
    delay?: number;
    offset?: number;
    duration?: number;
    filter?: BiquadFilterType;
    frequency?: number;
  } = {},
) {
  void loadSample(ctx, name).then((buffer) => {
    if (!buffer || !enabled || ctx.state !== 'running') return;
    const source = ctx.createBufferSource();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();
    const delay = options.delay ?? 0;
    const start = ctx.currentTime + delay;
    const offset = Math.min(
      options.offset ?? 0,
      Math.max(0, buffer.duration - 0.05),
    );
    const duration = Math.min(
      options.duration ?? buffer.duration - offset,
      buffer.duration - offset,
    );
    const rate = options.rate ?? 1;
    const audibleDuration = duration / rate;
    source.buffer = buffer;
    source.playbackRate.value = rate;
    filter.type = options.filter ?? 'lowpass';
    filter.frequency.value = options.frequency ?? 12000;
    filter.Q.value = 0.35;
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(options.gain ?? 0.2, start + 0.012);
    gain.gain.setValueAtTime(
      options.gain ?? 0.2,
      Math.max(start + 0.013, start + audibleDuration - 0.055),
    );
    gain.gain.exponentialRampToValueAtTime(0.0001, start + audibleDuration);
    source.connect(filter).connect(gain).connect(output(ctx));
    source.start(start, offset, duration);
  });
}

function preload(ctx: AudioContext) {
  (Object.keys(samplePaths) as SampleName[]).forEach((name) => {
    void loadSample(ctx, name);
  });
}

export async function setSoundEnabled(value: boolean) {
  enabled = value;
  const ctx = value ? audio() : context;
  if (!ctx) return;
  if (value) {
    if (ctx.state === 'suspended') {
      try {
        await ctx.resume();
      } catch {
        /* The next user gesture will unlock audio. */
      }
    }
    preload(ctx);
  } else if (ctx.state === 'running') {
    try {
      await ctx.suspend();
    } catch {
      /* Audio may already be closing. */
    }
  }
}

export function playSound(cue: SoundCue) {
  const ctx = enabled ? audio() : null;
  if (!ctx) return;
  if (ctx.state === 'suspended') {
    void ctx
      .resume()
      .then(() => playSound(cue))
      .catch(() => undefined);
    return;
  }
  if (ctx.state !== 'running') return;

  if (cue === 'enter') {
    sample(ctx, 'slide', {
      gain: 0.09,
      rate: 0.84,
      duration: 0.7,
      filter: 'highpass',
      frequency: 120,
    });
    tone(ctx, 82, 1.2, 0.055);
    tone(ctx, 246, 1.1, 0.025, 0.08);
  }
  if (cue === 'tick') {
    sample(ctx, 'slice', {
      gain: 0.075,
      rate: 1.35,
      offset: 0.15,
      duration: 0.075,
      filter: 'highpass',
      frequency: 1100,
    });
    tone(ctx, 720, 0.045, 0.009);
  }
  if (cue === 'turn') {
    sample(ctx, 'turn', {
      gain: 0.2,
      rate: 0.96 + Math.random() * 0.08,
      filter: 'highpass',
      frequency: 170,
    });
    sample(ctx, 'slide', {
      gain: 0.07,
      rate: 1.18,
      delay: 0.05,
      duration: 0.24,
      filter: 'highpass',
      frequency: 300,
    });
  }
  if (cue === 'shuffle') {
    sample(ctx, 'shuffle', {
      gain: 0.31,
      rate: 0.94 + Math.random() * 0.1,
      offset: 1 + Math.random() * 5.6,
      duration: 0.82,
      filter: 'highpass',
      frequency: 90,
    });
    sample(ctx, 'crinkle', {
      gain: 0.12,
      rate: 1.22,
      offset: 0.2 + Math.random() * 1.4,
      duration: 0.4,
      delay: 0.13,
      filter: 'highpass',
      frequency: 420,
    });
    tone(ctx, 112, 0.46, 0.015);
  }
  if (cue === 'deal') {
    sample(ctx, 'slide', {
      gain: 0.24,
      rate: 0.95 + Math.random() * 0.13,
      duration: 0.48,
      filter: 'highpass',
      frequency: 140,
    });
    sample(ctx, 'turn', {
      gain: 0.065,
      rate: 1.28,
      delay: 0.075,
      duration: 0.2,
      filter: 'highpass',
      frequency: 700,
    });
    tone(ctx, 136, 0.15, 0.012, 0.04);
  }
  if (cue === 'peel') {
    sample(ctx, 'crinkle', {
      gain: 0.27,
      rate: 1.02 + Math.random() * 0.12,
      offset: 0.25 + Math.random() * 1.35,
      duration: 0.62,
      filter: 'highpass',
      frequency: 320,
    });
    sample(ctx, 'slice', {
      gain: 0.08,
      rate: 0.78,
      delay: 0.1,
      duration: 0.3,
      filter: 'highpass',
      frequency: 650,
    });
    tone(ctx, 148, 0.28, 0.012);
  }
  if (cue === 'reveal') {
    sample(ctx, 'turn', {
      gain: 0.32,
      rate: 0.91 + Math.random() * 0.08,
      filter: 'highpass',
      frequency: 130,
    });
    sample(ctx, 'slice', {
      gain: 0.13,
      rate: 1.1,
      delay: 0.08,
      duration: 0.28,
      filter: 'highpass',
      frequency: 520,
    });
    tone(ctx, 523, 0.55, 0.03, 0.12);
    tone(ctx, 784, 0.5, 0.014, 0.17);
  }
  if (cue === 'liquid') {
    noise(ctx, 0.55, 0.05, 280);
    tone(ctx, 95, 0.5, 0.04);
    tone(ctx, 61, 0.7, 0.018, 0.04, 'triangle');
  }
  if (cue === 'crack') {
    sample(ctx, 'crumple', {
      gain: 0.31,
      rate: 1.04 + Math.random() * 0.1,
      duration: 1.05,
      filter: 'highpass',
      frequency: 180,
    });
    sample(ctx, 'slice', {
      gain: 0.25,
      rate: 1.24,
      delay: 0.08,
      offset: 0.08,
      duration: 0.22,
      filter: 'highpass',
      frequency: 640,
    });
    noise(ctx, 0.11, 0.035, 2700, 0.05);
    tone(ctx, 178, 0.25, 0.024, 0.1);
  }
  if (cue === 'resolve') {
    sample(ctx, 'slide', {
      gain: 0.08,
      rate: 0.72,
      duration: 0.72,
      filter: 'highpass',
      frequency: 110,
    });
    tone(ctx, 392, 0.8, 0.04);
    tone(ctx, 587, 0.9, 0.025, 0.08);
    tone(ctx, 784, 1, 0.015, 0.16);
  }
}

export function suspendSound() {
  if (context?.state === 'running') void context.suspend();
}
