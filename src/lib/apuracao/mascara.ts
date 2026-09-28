/** Máscara do WhatsApp enquanto digita: (11) 91234-5678 ou (11) 3456-7890. */
export function mascaraWhatsapp(raw: string): string {
  const d = raw.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : "";
  const ddd = `(${d.slice(0, 2)}) `;
  const resto = d.slice(2);
  const corte = d.length === 11 ? 5 : 4;
  return resto.length <= corte ? ddd + resto : `${ddd}${resto.slice(0, corte)}-${resto.slice(corte)}`;
}
