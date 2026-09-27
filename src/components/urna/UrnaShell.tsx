"use client";

import type { ReactNode } from "react";
import { UrnaKeypad } from "./UrnaKeypad";

const noop = () => {};

interface Props {
  screen: ReactNode;
  /** Teclado interativo. Omitido → teclado decorativo (landing). */
  keypad?: ReactNode;
  size?: "full" | "display";
}

/** Corpo físico da urna: base bege, moldura da tela, painel do teclado e ranhuras.
 *  Não conhece estado de votação. */
export function UrnaShell({ screen, keypad, size = "full" }: Props) {
  return (
    <div className={"urna" + (size === "display" ? " urna--display" : "")} aria-hidden={size === "display" ? true : undefined}>
      {screen}
      {keypad ?? (
        <UrnaKeypad onDigit={noop} onBlank={noop} onCorrect={noop} onConfirm={noop} confirmEnabled decorative />
      )}
      <div className="urna__vents" aria-hidden>
        {Array.from({ length: 9 }, (_, n) => <i key={n} />)}
      </div>
    </div>
  );
}
