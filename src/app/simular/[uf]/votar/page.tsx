import { notFound } from "next/navigation";
import { STATES } from "@/data/states";
import { MOCK_CANDIDATES } from "@/data/mock-candidates";
import { VotingMachine } from "@/components/voting/VotingMachine";

export const metadata = {
  title: "Votando — LegisUrna",
  robots: { index: false, follow: false },
};

export default async function VotarPage({ params }: PageProps<"/simular/[uf]/votar">) {
  const { uf } = await params;
  const state = STATES.find((s) => s.code === uf.toUpperCase());
  if (!state) notFound();
  return <VotingMachine stateCode={state.code} candidates={MOCK_CANDIDATES} />;
}
