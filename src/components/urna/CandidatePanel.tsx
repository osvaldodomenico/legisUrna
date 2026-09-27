"use client";

import type { SyntheticEvent } from "react";
import type { Candidate, OfficeConfig } from "@/domain/voting/types";
import { runningMateLabel, runningMateShort } from "./screen-view";

function hideBroken(e: SyntheticEvent<HTMLImageElement>) {
  e.currentTarget.style.display = "none";
}

/** Linhas Nome/Partido/Vice ou Suplentes à esquerda; fotos à direita.
 *  Vice/suplente sem photoUrl aparece só em texto. */
export function CandidatePanel({ candidate, office }: { candidate: Candidate; office: OfficeConfig }) {
  const mates = candidate.runningMates
    .map((m) => ({ ...m, label: runningMateLabel(office.key, m.role) }))
    .filter((m): m is typeof m & { label: string } => m.label !== null)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  return (
    <div className="urna__candidate">
      <div className="urna__line">
        <div>Nome: {candidate.ballotName}</div>
        <div>Partido: {candidate.party.acronym}</div>
        {mates.map((m) => (
          <div key={m.role}>{m.label}: {m.ballotName}</div>
        ))}
      </div>
      <div className="urna__photos">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={candidate.photoUrl} alt="" className="urna__photo urna__photo--main" onError={hideBroken} />
        {mates.filter((m) => m.photoUrl).map((m) => (
          <div key={m.role}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={m.photoUrl} alt="" className="urna__photo urna__photo--mate" onError={hideBroken} />
            <div className="urna__photo-cap">{runningMateShort(m.role)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
