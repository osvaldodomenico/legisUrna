import type { ScreenView } from "./screen-view";
import { DigitBoxes } from "./DigitBoxes";
import { CandidatePanel } from "./CandidatePanel";

const BAR_CONFIRM = "Aperte a tecla:\n  VERDE para CONFIRMAR este voto\n  LARANJA para REINICIAR este voto";
const BAR_TYPING = "Digite o número do candidato.\nPara votar em branco, aperte a tecla BRANCO.";
const BAR_IDLE = "Aperte a tecla VERDE (CONFIRMA) para começar.";
const BAR_INVALID = "Aperte a tecla LARANJA para corrigir.";

function Bar({ text, alert = false }: { text: string; alert?: boolean }) {
  return <div className={"urna__bar" + (alert ? " urna__bar--alert" : "")}>{text}</div>;
}

/** Tela 4:3 da urna. Apresentação pura: recebe a view já derivada e a mensagem de bloqueio. */
export function UrnaScreen({ view, message }: { view: ScreenView; message?: string | null }) {
  const bar = (fallback: string) =>
    message ? <Bar text={message} alert /> : <Bar text={fallback} />;

  return (
    <div className="urna__bezel">
      <div className="urna__screen">
        <div className="urna__screen-inner" key={view.kind}>
          {view.kind === "idle" && (
            <>
              <div className="urna__center urna__idle">
                SIMULADOR DE VOTAÇÃO
                <br />
                2026
                <div className="urna__idle-sub">
                  {view.stateName ? <>Estado: <b>{view.stateName}</b></> : "Escolha seu estado"}
                </div>
                <div className="urna__idle-cta">
                  PRESSIONE <span className="urna__idle-key">CONFIRMA</span> PARA COMEÇAR
                </div>
              </div>
              <Bar text={BAR_IDLE} />
            </>
          )}

          {view.kind === "typing" && (
            <>
              <div className="urna__title">SEU VOTO PARA</div>
              <div className="urna__office">{view.office.label}</div>
              <DigitBoxes digits={view.digits} total={view.office.digits} />
              {bar(BAR_TYPING)}
            </>
          )}

          {view.kind === "candidate" && (
            <>
              <div className="urna__title">SEU VOTO PARA</div>
              <div className="urna__office">{view.office.label}</div>
              <CandidatePanel candidate={view.candidate} office={view.office}>
                <DigitBoxes digits={view.digits} total={view.office.digits} />
              </CandidatePanel>
              {bar(BAR_CONFIRM)}
            </>
          )}

          {view.kind === "null" && (
            <>
              <div className="urna__title">SEU VOTO PARA</div>
              <div className="urna__office">{view.office.label}</div>
              <DigitBoxes digits={view.digits} total={view.office.digits} />
              {view.joke ? (
                <div className="urna__center urna__joke">{view.joke}</div>
              ) : (
                <div className="urna__center">
                  NÚMERO ERRADO
                  <br />
                  VOTO NULO
                </div>
              )}
              {bar(BAR_CONFIRM)}
            </>
          )}

          {view.kind === "invalid" && (
            <>
              <div className="urna__title">SEU VOTO PARA</div>
              <div className="urna__office">{view.office.label}</div>
              <DigitBoxes digits={view.digits} total={view.office.digits} />
              <div className="urna__center">NÚMERO NÃO CADASTRADO</div>
              {bar(BAR_INVALID)}
            </>
          )}

          {view.kind === "blank" && (
            <>
              <div className="urna__title">SEU VOTO PARA</div>
              <div className="urna__office">{view.office.label}</div>
              <div className="urna__center">VOTO EM BRANCO</div>
              {bar(BAR_CONFIRM)}
            </>
          )}

          {view.kind === "finished" && (
            <>
              <div className="urna__fim">FIM</div>
              <div className="urna__bar urna__bar--muted">
                Simulação encerrada. Nenhum voto foi gravado ou enviado.
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
