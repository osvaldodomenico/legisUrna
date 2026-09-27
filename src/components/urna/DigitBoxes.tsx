/** Caixas do número na tela da urna. As primeiras `digits.length` mostram o dígito;
 *  a próxima vazia recebe borda grossa (cursor). */
export function DigitBoxes({ digits, total }: { digits: string; total: number }) {
  return (
    <div className="urna__digits" role="group" aria-label={`Número: ${digits || "vazio"}`}>
      <span aria-hidden>Número:</span>
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          className={"urna__box" + (i === digits.length ? " urna__box--cursor" : "")}
          aria-hidden
        >
          {digits[i] ?? ""}
        </span>
      ))}
    </div>
  );
}
