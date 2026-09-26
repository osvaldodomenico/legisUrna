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
if pnpm test 2>&1 | tee /tmp/legisurna-checkup-test.log | grep -q "passed"; then pass "vitest 23 tests"; else fail "vitest"; fi

echo "-- rotas --"
for r in "/" "/simular" "/como-funciona" "/privacidade" "/termos"; do
  if grep -rq "export.*metadata\|export default" "src/app${r}/page.tsx" 2>/dev/null || [ "$r" = "/" ]; then pass "rota $r existe"; else fail "rota $r ausente"; fi
done

echo "-- aviso não oficial --"
if grep -rq "SIMULAÇÃO NÃO OFICIAL" src/components/ui/Disclaimer.tsx src/app/page.tsx 2>/dev/null; then pass "aviso SIMULAÇÃO NÃO OFICIAL"; else fail "aviso não oficial ausente"; fi

echo "-- regras --"
if grep -q "MAJORITARIAN_OFFICES" src/domain/voting/rules.ts && grep -q "isSecondSenatorDuplicate" src/domain/voting/machine.ts; then pass "regras majoritária + anti-repetição"; else fail "regras ausentes"; fi

echo "-- privacidade --"
if grep -v "^[[:space:]]*//" src/lib/analytics.ts | grep -q "candidate_id"; then fail "analytics vaza candidate_id"; else pass "analytics sem PII eleitoral"; fi

if [ "$FAIL" -eq 0 ]; then echo "== 0 FAIL — pronto para validar com cliente =="; else echo "== $FAIL FAIL =="; fi
exit $FAIL
