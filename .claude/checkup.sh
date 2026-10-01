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
if [ -e "src/app/simular/[uf]" ]; then fail "rota /simular/[uf] ainda existe (só São Paulo)"; else pass "escolha de estado removida (só São Paulo)"; fi
if grep -q "etapas oficiais" src/components/voting/VotingMachine.tsx; then pass "orientações acima da urna"; else fail "orientações acima da urna ausentes"; fi
if [ -e "src/app/simular/[uf]/fim" ]; then fail "rota /simular/[uf]/fim ainda existe"; else pass "rota /fim removida (FIM dentro da urna)"; fi
if [ -d src/components/urna ] && ! grep -rwiq "TSE\|Justiça Eleitoral\|brasão" src/components/urna; then pass "urna sem marca da Justiça Eleitoral"; else fail "componentes da urna ausentes ou mencionam TSE/Justiça Eleitoral/brasão"; fi

echo "-- aviso não oficial --"
if grep -rq "SIMULAÇÃO NÃO OFICIAL" src/components/ui/Disclaimer.tsx src/app/page.tsx 2>/dev/null; then pass "aviso SIMULAÇÃO NÃO OFICIAL"; else fail "aviso não oficial ausente"; fi

echo "-- fotos --"
FOTOS_OK=1
for foto in $(grep -oE '"[a-z0-9-]+\.[a-z]+"\),$' src/data/mock-candidates.ts | tr -d '"),'); do
  arq="public/candidates/$foto"
  if [ ! -f "$arq" ]; then fail "foto ausente: $arq"; FOTOS_OK=0
  elif [ "${foto##*.}" != "webp" ] || [ "$(stat -f%z "$arq")" -gt 60000 ]; then fail "foto não otimizada (webp ≤ 60 KB): $arq"; FOTOS_OK=0; fi
done
[ "$FOTOS_OK" -eq 1 ] && pass "fotos dos candidatos presentes e otimizadas"

echo "-- google analytics --"
if grep -q 'G-NX4YQQ98PE' src/app/layout.tsx && grep -q "Google Analytics" src/app/privacidade/page.tsx; then pass "GA4 no layout e declarado na privacidade"; else fail "GA4 ausente ou não declarado na privacidade"; fi

echo "-- regras --"
if grep -q "MAJORITARIAN_OFFICES" src/domain/voting/rules.ts && grep -q "isSecondSenatorDuplicate" src/domain/voting/machine.ts; then pass "regras majoritária + anti-repetição"; else fail "regras ausentes"; fi

echo "-- privacidade --"
if grep -v "^[[:space:]]*//" src/lib/analytics.ts | grep -q "candidate_id"; then fail "analytics vaza candidate_id"; else pass "analytics sem PII eleitoral"; fi

echo "-- apuração + contatos --"
[ -f db/schema.sql ] && pass "db/schema.sql" || fail "db/schema.sql ausente"
if awk '/CREATE TABLE IF NOT EXISTS contatos/,/\);/' db/schema.sql | grep -qiE "simula|voto"; then fail "tabela contatos ligada à simulação"; else pass "contatos sem vínculo com a simulação"; fi
if grep -q "date_trunc('hour'" db/schema.sql; then pass "hora da simulação truncada"; else fail "hora da simulação não truncada"; fi
if grep -q '"/apuracao"' src/proxy.ts && grep -q "APURACAO_SENHA" src/proxy.ts; then pass "/apuracao protegida por senha"; else fail "/apuracao sem proteção"; fi
if grep -rq "ShiftLegis" src/app/privacidade/page.tsx && ! grep -rq "Nada do que você digita" src/app; then pass "privacidade descreve a coleta"; else fail "privacidade desatualizada"; fi
if grep -q "SAIR" src/lib/apuracao/consentimento.ts && grep -q "Não, obrigado" src/components/contato/ContatoCard.tsx; then pass "consentimento com opt-out e recusa visível"; else fail "consentimento incompleto"; fi
if grep -rhE "from \"(@/lib/apuracao|\.)/payload\"" src/components src/lib/apuracao/enviar.ts | grep -qv "^import type"; then fail "zod no bundle do cliente"; else pass "cliente não importa validação do servidor"; fi
if grep -rq "me quebra" src; then fail "brincadeira do 13 ainda presente"; else pass "brincadeira do 13 removida"; fi

# -- colinha (fim da votação) --
if grep -q "<ColinhaModal " src/components/urna/UrnaVoting.tsx && [ -f tests/colinha.test.ts ]; then pass "colinha em modal no fim da votação, com teste"; else fail "colinha ausente no fim da votação"; fi
if grep -q "SIMULAÇÃO NÃO OFICIAL" src/components/colinha/Colinha.tsx; then pass "imagem da colinha leva o aviso NÃO OFICIAL"; else fail "imagem da colinha sem aviso NÃO OFICIAL"; fi
if grep -qE "fetch\(|enviar" src/components/colinha/Colinha.tsx; then fail "colinha envia dados ao servidor"; else pass "colinha só no aparelho (sem envio)"; fi

if grep -q "ondevotar.shiftlegis.com.br" src/components/colinha/Colinha.tsx; then pass "colinha leva ao Onde Votar"; else fail "botão Onde Votar ausente na colinha"; fi

# -- candidatos do TSE + busca por nome --
N=$(grep -o '"sq"' src/data/candidatos-sp.json | wc -l | tr -d ' ')
if [ "$N" -gt 2000 ]; then pass "candidatos do TSE importados ($N)"; else fail "candidatos do TSE ausentes ($N)"; fi
if grep -qE '"(cpf|email|titulo|nascimento|NR_CPF|DS_EMAIL)' src/data/candidatos-sp.json; then fail "candidatos-sp.json com dado pessoal"; else pass "candidatos-sp.json sem dado pessoal"; fi
FALTA=$(python3 -c "import json,os;print(sum(1 for c in json.load(open('src/data/candidatos-sp.json')) if c['foto'] and not os.path.exists('public/candidates/tse/'+c['sq']+'.webp')))")
if [ "$FALTA" -eq 0 ]; then pass "fotos do TSE presentes"; else fail "$FALTA fotos do TSE ausentes"; fi
if grep -q "CANDIDATOS" src/app/simular/page.tsx src/app/api/simulacoes/route.ts src/app/apuracao/page.tsx && ! grep -q "MOCK_CANDIDATES" src/app/simular/page.tsx src/app/api/simulacoes/route.ts src/app/apuracao/page.tsx; then pass "urna, gravação e apuração usam a lista do TSE"; else fail "algum ponto do app ainda usa MOCK_CANDIDATES"; fi
if grep -q "<BuscaCandidato " src/components/urna/UrnaVoting.tsx && [ -f tests/busca.test.ts ]; then pass "busca por nome na urna, com teste"; else fail "busca por nome ausente"; fi

# -- divulga (client TSE, Fase 3) --
[ -f src/lib/divulgacand/client.ts ] && pass "client divulgacand/client.ts" || fail "client divulgacand/client.ts ausente"
[ -f src/lib/divulgacand/types.ts ] && pass "client divulgacand/types.ts" || fail "client divulgacand/types.ts ausente"
[ -f tests/divulgacand-client.test.ts ] && pass "testes do client divulgacand" || fail "testes do client divulgacand ausentes"
if grep -q "divulgacandcontas.tse.jus.br" src/lib/divulgacand/client.ts; then pass "host do DivulgaCand correto"; else fail "host do DivulgaCand incorreto"; fi
if grep -q "MIN_INTERVAL_MS = 1000" src/lib/divulgacand/client.ts; then pass "intervalo mínimo entre consultas (1 s)"; else fail "intervalo entre consultas não definido"; fi
if grep -rEq "^[[:space:]]*(cpf|tituloEleitor|dataDeNascimento)[?]?:" src/lib/divulgacand/types.ts; then fail "tipos do TSE declaram PII (cpf/titulo/dataDeNascimento)"; else pass "tipos do TSE sem PII declarada"; fi
if grep -rqE "\b(cpf|tituloEleitor)\b" src/lib/divulgacand/client.ts; then fail "client referencia PII do TSE"; else pass "client não referencia PII do TSE"; fi
if [ "$FAIL" -eq 0 ]; then echo "== 0 FAIL — pronto para validar com cliente =="; else echo "== $FAIL FAIL =="; fi
exit $FAIL
