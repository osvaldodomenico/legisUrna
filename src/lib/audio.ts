// Sons próprios (não copiar áudios oficiais da urna). Habilitar só se enable_audio.
let ctx: AudioContext | null = null;

function beep(freq: number, ms: number): void {
  if (typeof window === "undefined") return;
  try {
    ctx ??= new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = freq;
    gain.gain.value = 0.08;
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + ms / 1000);
  } catch {
    // áudio indisponível: seguir silenciosamente
  }
}

export const sfx = {
  digit: () => beep(880, 60),
  blank: () => beep(440, 120),
  correct: () => beep(330, 100),
  confirm: () => beep(660, 160),
  error: () => beep(220, 200),
};
