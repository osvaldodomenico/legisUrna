"use client";

import type { ReactNode, SyntheticEvent } from "react";
import type { Candidate, Office, OfficeConfig, RunningMate } from "@/domain/voting/types";
import { runningMateLabel, runningMateShort } from "./screen-view";

function hideBroken(e: SyntheticEvent<HTMLImageElement>) {
  e.currentTarget.style.display = "none";
}

/** Slots de foto que o cargo tem na urna real, mesmo sem vice/suplente cadastrado. */
function mateSlots(office: Office): RunningMate["role"][] {
  if (office === "governor" || office === "president") return ["vice"];
  if (office === "senator_1" || office === "senator_2") return ["first_alternate", "second_alternate"];
  return [];
}

/** Linhas Nome/Partido/Vice ou Suplentes à esquerda; fotos à direita.
 *  `children` (as caixas do número) entra no topo da coluna de texto, para as fotos
 *  ocuparem a altura de caixas + linhas, como na urna. Titular grande à direita com o cargo
 *  na legenda; vice/suplentes menores à esquerda dele, alinhados pela base — o slot aparece
 *  vazio quando ainda não há foto. Vice/suplente sem photoUrl aparece só em texto. */
export function CandidatePanel({
  candidate,
  office,
  children,
}: {
  candidate: Candidate;
  office: OfficeConfig;
  children?: ReactNode;
}) {
  const mates = candidate.runningMates
    .map((m) => ({ ...m, label: runningMateLabel(office.key, m.role) }))
    .filter((m): m is typeof m & { label: string } => m.label !== null)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const slots = mateSlots(office.key);

  return (
    <div className="urna__candidate">
      <div>
        {children}
        <div className="urna__line">
          <div>Nome: {candidate.ballotName}</div>
          <div>Partido: {candidate.party.acronym}</div>
          {mates.map((m) => (
            <div key={m.role}>{m.label}: {m.ballotName}</div>
          ))}
        </div>
      </div>
      <div className="urna__photos">
        {slots.length > 0 && (
          <div className="urna__mates">
            {slots.map((role) => {
              const photoUrl = mates.find((m) => m.role === role)?.photoUrl;
              return (
                <div key={role}>
                  {photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={photoUrl} alt="" className="urna__photo urna__photo--mate" onError={hideBroken} />
                  ) : (
                    <div className="urna__photo urna__photo--mate" aria-hidden="true" />
                  )}
                  <div className="urna__photo-cap">{runningMateShort(role)}</div>
                </div>
              );
            })}
          </div>
        )}
        <div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={candidate.photoUrl} alt="" className="urna__photo urna__photo--main" onError={hideBroken} />
          <div className="urna__photo-cap">{office.label.split(" — ")[0]}</div>
        </div>
      </div>
    </div>
  );
}
