// Sons próprios (não copiar áudios oficiais da urna).
let ctx: AudioContext | null = null;
let muted = false;
const listeners = new Set<() => void>();

/** Única fonte de verdade do mudo. A UI assina via `subscribeMuted` (useSyncExternalStore). */
export function setMuted(value: boolean): void {
  if (muted === value) return;
  muted = value;
  listeners.forEach((l) => l());
}

export function isMuted(): boolean {
  return muted;
}

export function subscribeMuted(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function tone(freq: number, ms: number, startOffsetMs = 0): void {
  if (typeof window === "undefined" || muted) return;
  try {
    ctx ??= new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = freq;
    gain.gain.value = 0.08;
    osc.connect(gain).connect(ctx.destination);
    const start = ctx.currentTime + startOffsetMs / 1000;
    osc.start(start);
    osc.stop(start + ms / 1000);
  } catch {
    // áudio indisponível: seguir silenciosamente
  }
}

export const sfx = {
  digit: () => tone(880, 60),
  blank: () => tone(440, 120),
  correct: () => tone(330, 100),
  confirm: () => tone(660, 160),
  error: () => tone(220, 200),
  // Tom do FIM: dois estágios, ~700 ms no total.
  fim: () => {
    tone(523, 300);
    tone(784, 400, 300);
  },
};
