"use client";

import { useEffect } from "react";
import { useVotingSession } from "@/stores/voting-session";
import { FULL_OFFICES } from "@/domain/voting/rules";
import type { Candidate } from "@/domain/voting/types";
import { DisclaimerBanner } from "@/components/ui/Disclaimer";
import { UrnaVoting } from "@/components/urna/UrnaVoting";
import { SoundToggle } from "@/components/urna/SoundToggle";

export function VotingMachine({ stateCode, candidates, offices = FULL_OFFICES }: {
  stateCode: string;
  candidates: Candidate[];
  offices?: typeof FULL_OFFICES;
}) {
  const init = useVotingSession((s) => s.init);

  useEffect(() => {
    init(stateCode, candidates, offices, true);
  }, [init, stateCode, candidates, offices]);

  return (
    <>
      <DisclaimerBanner className="mx-auto mt-3 w-full max-w-[980px] rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-center text-[0.7rem] font-semibold text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-200" />
      <UrnaVoting stateCode={stateCode} />
      <div className="mx-auto mb-6 flex w-full max-w-[980px] justify-center px-4">
        <SoundToggle />
      </div>
    </>
  );
}
