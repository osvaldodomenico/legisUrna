import type { Office, OfficeConfig } from "./types";

export const MAJORITARIAN_OFFICES: OfficeConfig[] = [
  { key: "senator_1", label: "Senador — 1ª vaga", digits: 3, order: 1, enabled: true },
  { key: "senator_2", label: "Senador — 2ª vaga", digits: 3, order: 2, enabled: true },
  { key: "governor", label: "Governador", digits: 2, order: 3, enabled: true },
  { key: "president", label: "Presidente", digits: 2, order: 4, enabled: true },
];

// Ordem oficial completa 2026 (TSE): Dep. Federal, Dep. Estadual/Distrital,
// Senador 1ª, Senador 2ª, Governador, Presidente.
export const FULL_OFFICES: OfficeConfig[] = [
  { key: "federal_deputy", label: "Deputado Federal", digits: 4, order: 1, enabled: true },
  { key: "state_deputy", label: "Deputado Estadual ou Distrital", digits: 5, order: 2, enabled: true },
  { key: "senator_1", label: "Senador — 1ª vaga", digits: 3, order: 3, enabled: true },
  { key: "senator_2", label: "Senador — 2ª vaga", digits: 3, order: 4, enabled: true },
  { key: "governor", label: "Governador", digits: 2, order: 5, enabled: true },
  { key: "president", label: "Presidente", digits: 2, order: 6, enabled: true },
];

export function getOfficeConfig(offices: OfficeConfig[], key: Office): OfficeConfig | undefined {
  return offices.find((o) => o.key === key);
}

export function currentOffice(offices: OfficeConfig[], index: number): OfficeConfig | null {
  return offices[index] ?? null;
}

export function isSenatorOffice(key: Office): boolean {
  return key === "senator_1" || key === "senator_2";
}

export function canConfirmBlank(digits: string): boolean {
  return digits.length === 0;
}

export function isSecondSenatorDuplicate(candidateId: string, senator1Id: string | null): boolean {
  return senator1Id !== null && candidateId === senator1Id;
}

export function nextOfficeIndex(offices: OfficeConfig[], index: number): number | null {
  const next = index + 1;
  return next < offices.length ? next : null;
}
