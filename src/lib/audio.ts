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

function tone(freq: number, ms: number, startOffsetMs = 0, type: OscillatorType = "sine", volume = 0.08): void {
  if (typeof window === "undefined" || muted) return;
  try {
    ctx ??= new AudioContext();
    if (ctx.state === "suspended") void ctx.resume(); // iOS/Safari começam suspensos até um gesto
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.value = volume;
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
  // Jingle do FIM: arpejo ascendente em onda quadrada (timbre de buzzer), nota final sustentada. ~1,3 s.
  fim: () => {
    const notes: Array<[freq: number, ms: number]> = [
      [1047, 140], // C6
      [1319, 140], // E6
      [1568, 140], // G6
      [2093, 140], // C7
      [2637, 700], // E7 (sustentada)
    ];
    let at = 0;
    for (const [freq, ms] of notes) {
      tone(freq, ms, at, "square", 0.05);
      at += ms + 20;
    }
  },
};
