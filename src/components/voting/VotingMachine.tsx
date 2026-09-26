"use client";

import { useEffect } from "react";
import { useVotingSession } from "@/stores/voting-session";
import { FULL_OFFICES } from "@/domain/voting/rules";
import type { Candidate } from "@/domain/voting/types";
import { track } from "@/lib/analytics";
import { VotingScreen } from "./VotingScreen";
import { DisclaimerBanner } from "@/components/ui/Disclaimer";

export function VotingMachine({ stateCode, candidates, offices = FULL_OFFICES }: {
  stateCode: string;
  candidates: Candidate[];
  offices?: typeof FULL_OFFICES;
}) {
  const init = useVotingSession((s) => s.init);

  useEffect(() => {
    init(stateCode, candidates, offices, true);
    track("simulation_started", { state: stateCode, mode: "completo" });
  }, [init, stateCode, candidates, offices]);

  return (
    <>
      <DisclaimerBanner className="mx-auto mt-3 w-full max-w-md rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-center text-[0.65rem] font-semibold text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-200" />
      <VotingScreen />
    </>
  );
}
