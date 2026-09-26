"use client";

import type { Candidate, OfficeConfig } from "@/domain/voting/types";

export function CandidateCard({ candidate, office }: { candidate: Candidate; office: OfficeConfig }) {
  const mate = candidate.runningMates.find((m) => m.role === "vice");
  return (
    <section aria-live="polite" className="w-full rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <p className="text-xs uppercase tracking-wide text-slate-500">{office.label}</p>
      <div className="mt-3 flex items-center gap-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={candidate.photoUrl} alt="" className="h-20 w-20 shrink-0 rounded-full object-cover" />
        <div className="min-w-0">
          <p className="text-2xl font-bold tracking-widest text-slate-900 dark:text-slate-50">{candidate.number}</p>
          <p className="truncate text-lg font-semibold text-slate-900 dark:text-slate-50">{candidate.ballotName}</p>
          <p className="truncate text-sm text-slate-600 dark:text-slate-400">
            {candidate.party.acronym} — {candidate.party.name}
          </p>
          {mate && <p className="truncate text-xs text-slate-500 dark:text-slate-400">Vice: {mate.ballotName}</p>}
        </div>
      </div>
    </section>
  );
}
