import { STATES } from "@/data/states";
import { MOCK_CANDIDATES } from "@/data/mock-candidates";
import { VotingMachine } from "@/components/voting/VotingMachine";

export const metadata = {
  title: "Votando — LegisUrna",
  robots: { index: false, follow: false },
};

export default function VotarPage() {
  const state = STATES[0];
  return <VotingMachine stateCode={state.code} candidates={MOCK_CANDIDATES} />;
}
