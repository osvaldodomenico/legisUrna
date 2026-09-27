"use client";

import { useEffect, useSyncExternalStore } from "react";
import { isMuted, setMuted, subscribeMuted } from "@/lib/audio";

const KEY = "legisurna:muted";
const serverSnapshot = () => false;

/** Botão de mudo. O módulo de áudio é a única fonte de verdade (useSyncExternalStore);
 *  o localStorage é lido só depois da hidratação. */
export function SoundToggle() {
  const muted = useSyncExternalStore(subscribeMuted, isMuted, serverSnapshot);

  useEffect(() => {
    try {
      setMuted(window.localStorage.getItem(KEY) === "1");
    } catch {
      // localStorage indisponível: fica desmutado
    }
  }, []);

  function toggle() {
    const next = !muted;
    setMuted(next);
    try {
      window.localStorage.setItem(KEY, next ? "1" : "0");
    } catch {
      // sem persistência, sem erro
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={muted}
      className="min-h-12 rounded-full border border-slate-400/60 bg-white/70 px-4 text-sm font-medium text-slate-800 backdrop-blur hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-700 dark:border-slate-600 dark:bg-slate-800/70 dark:text-slate-100 dark:hover:bg-slate-800"
    >
      {muted ? "Som: desligado" : "Som: ligado"}
    </button>
  );
}
