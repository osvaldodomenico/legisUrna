// Analytics agregado apenas. NUNCA enviar candidate_id, candidate_number, party_id ou vote.
export type SafeEvent =
  | "simulation_started"
  | "office_started"
  | "invalid_number_shown"
  | "blank_flow_used"
  | "correction_used"
  | "office_completed"
  | "simulation_completed"
  | "simulation_abandoned"
  | "colinha_saved"
  | "colinha_shared";

export function track(event: SafeEvent, props: Record<string, string | number | boolean> = {}): void {
  if (process.env.NODE_ENV === "development") {
    console.info("[analytics]", event, props);
  }
}
