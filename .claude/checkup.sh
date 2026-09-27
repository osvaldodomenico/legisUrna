#!/bin/bash
set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
FAIL=0
pass() { echo "PASS: $1"; }
fail() { echo "FAIL: $1"; FAIL=1; }

echo "== LegisUrna checkup =="
echo "-- build --"
if pnpm build >/tmp/legisurna-checkup-build.log 2>&1; then pass "next build"; else fail "next build — ver /tmp/legisurna-checkup-build.log"; fi

echo "-- lint --"
if pnpm exec eslint src 2>&1 | tee /tmp/legisurna-checkup-lint.log | grep -q "error"; then fail "eslint"; else pass "eslint (sem errors)"; fi

echo "-- tests --"
if pnpm test 2>&1 | tee /tmp/legisurna-checkup-test.log | grep -qE "Tests +[0-9]+ passed" && ! grep -q "failed" /tmp/legisurna-checkup-test.log; then pass "vitest (todos passando)"; else fail "vitest"; fi

echo "-- rotas --"
for r in "/" "/simular" "/como-funciona" "/privacidade" "/termos"; do
  if grep -rq "export.*metadata\|export default" "src/app${r}/page.tsx" 2>/dev/null || [ "$r" = "/" ]; then pass "rota $r existe"; else fail "rota $r ausente"; fi
done

echo "-- urna --"
for c in UrnaShell UrnaScreen UrnaKeypad CandidatePanel DigitBoxes ProgressStrip SoundToggle UrnaVoting; do
  if [ -f "src/components/urna/$c.tsx" ]; then pass "componente urna/$c"; else fail "componente urna/$c ausente"; fi
done
[ -f src/components/urna/screen-view.ts ] && pass "screen-view.ts" || fail "screen-view.ts ausente"
for t in "SEU VOTO PARA" "NÚMERO ERRADO" "VOTO EM BRANCO" "FIM"; do
  if grep -q "$t" src/components/urna/UrnaScreen.tsx; then pass "tela contém '$t'"; else fail "tela sem '$t'"; fi
done
if [ -e "src/app/simular/[uf]/fim" ]; then fail "rota /simular/[uf]/fim ainda existe"; else pass "rota /fim removida (FIM dentro da urna)"; fi
if [ -d src/components/urna ] && ! grep -rwiq "TSE\|Justiça Eleitoral\|brasão" src/components/urna; then pass "urna sem marca da Justiça Eleitoral"; else fail "componentes da urna ausentes ou mencionam TSE/Justiça Eleitoral/brasão"; fi

echo "-- aviso não oficial --"
if grep -rq "SIMULAÇÃO NÃO OFICIAL" src/components/ui/Disclaimer.tsx src/app/page.tsx 2>/dev/null; then pass "aviso SIMULAÇÃO NÃO OFICIAL"; else fail "aviso não oficial ausente"; fi

echo "-- regras --"
if grep -q "MAJORITARIAN_OFFICES" src/domain/voting/rules.ts && grep -q "isSecondSenatorDuplicate" src/domain/voting/machine.ts; then pass "regras majoritária + anti-repetição"; else fail "regras ausentes"; fi

echo "-- privacidade --"
if grep -v "^[[:space:]]*//" src/lib/analytics.ts | grep -q "candidate_id"; then fail "analytics vaza candidate_id"; else pass "analytics sem PII eleitoral"; fi

if [ "$FAIL" -eq 0 ]; then echo "== 0 FAIL — pronto para validar com cliente =="; else echo "== $FAIL FAIL =="; fi
exit $FAIL
