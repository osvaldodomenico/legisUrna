"use client";

export type KeyId = "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "BRANCO" | "CORRIGE" | "CONFIRMA";

const DIGITS: KeyId[] = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"];

interface Props {
  onDigit: (d: string) => void;
  onBlank: () => void;
  onCorrect: () => void;
  onConfirm: () => void;
  confirmEnabled: boolean;
  /** Tecla a destacar como pressionada (usada quando o teclado físico é acionado). */
  pressedKey?: KeyId | null;
  /** Só para o modo exibição da landing: sem foco, sem clique, invisível para leitor de tela. */
  decorative?: boolean;
}

/** Painel preto com teclas em relevo. Controlado: não guarda estado. */
export function UrnaKeypad({ onDigit, onBlank, onCorrect, onConfirm, confirmEnabled, pressedKey = null, decorative = false }: Props) {
  const common = decorative ? { tabIndex: -1, "aria-hidden": true as const } : {};
  const cls = (id: KeyId, extra = "") =>
    "urna-key" + extra + (pressedKey === id ? " urna-key--pressed" : "");

  return (
    <div className="urna__panel" role={decorative ? undefined : "group"} aria-label={decorative ? undefined : "Teclado da urna"}>
      <div className="urna__panel-label">SIMULADOR</div>
      <div className="urna__keys">
        {DIGITS.map((d) => (
          <button
            key={d}
            type="button"
            className={cls(d, d === "0" ? " urna-key--zero" : "")}
            aria-label={`Tecla ${d}`}
            onClick={() => onDigit(d)}
            onPointerDown={(e) => e.preventDefault()}
            {...common}
          >
            {d}
          </button>
        ))}
      </div>
      <div className="urna__fn">
        <button type="button" className={cls("BRANCO", " urna-key--fn urna-key--branco")} aria-label="Branco" onClick={onBlank} onPointerDown={(e) => e.preventDefault()} {...common}>
          BRANCO
        </button>
        <button type="button" className={cls("CORRIGE", " urna-key--fn urna-key--corrige")} aria-label="Corrige" onClick={onCorrect} onPointerDown={(e) => e.preventDefault()} {...common}>
          CORRIGE
        </button>
        <button
          type="button"
          className={cls("CONFIRMA", " urna-key--fn urna-key--confirma")}
          aria-label="Confirma"
          aria-disabled={!confirmEnabled}
          onClick={onConfirm}
          onPointerDown={(e) => e.preventDefault()}
          {...common}
        >
          CONFIRMA
        </button>
      </div>
    </div>
  );
}
