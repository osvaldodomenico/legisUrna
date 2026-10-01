#!/usr/bin/env bash
# Backup do banco do LegisUrna (container legisurna-db) na VPS BI — 2x ao dia.
#
#   instalado em /root/backup-legisurna-db.sh · cron: 0 3,15 * * *
#   log: /var/log/backup-legisurna-db.log
#
# 1. pg_dump (formato custom) com contagem das tabelas antes e depois.
# 2. RESTORE-TEST real: sobe um Postgres descartável, restaura e só aprova se as contagens
#    baterem com as da origem (entre o antes e o depois do dump).
# 3. Retenção de 30 dias na VPS e no Google Drive (off-host via rclone, mesmo remote do
#    backup mensal da VPS BI: $RCLONE_REMOTE/vps-bi/legisurna-db/).
# 4. E-mail (Resend) em qualquer falha; e-mail de OK só na rodada das 15h, para o silêncio
#    não ser ambíguo. Credenciais em /root/backup-mensal.env (600), nunca neste arquivo.
#
# O dump tem a tabela de contatos (nome + WhatsApp): arquivos 600, pasta 700.
set -uo pipefail

DEST=/root/backups/legisurna
LOG=/var/log/backup-legisurna-db.log
ENV_FILE=/root/backup-mensal.env
RETENCAO_DIAS=30
MARCA=$(date +%Y%m%d-%H%M%S)
CRIEI_ARQ=0
ARQ="$DEST/legisurna-$MARCA.dump"
TESTE="legisurna-restore-teste-$$"
PSQL=(docker exec legisurna-db psql -U legisurna -d legisurna -tA)

log() { echo "$(date '+%F %T') $*" | tee -a "$LOG"; }
[ -f "$ENV_FILE" ] && { set -a; . "$ENV_FILE"; set +a; }

alerta_email() { # $1=assunto $2=corpo
  if [ -z "${RESEND_KEY:-}" ] || [ -z "${ALERT_TO:-}" ]; then log "alerta: e-mail não configurado"; return; fi
  python3 -c 'import json,sys; print(json.dumps({"from": sys.argv[1], "to": [sys.argv[2]], "subject": sys.argv[3], "text": sys.argv[4]}))' \
    "$ALERT_FROM" "$ALERT_TO" "$1" "$2" |
    curl -s -X POST https://api.resend.com/emails -H "Authorization: Bearer $RESEND_KEY" -H "Content-Type: application/json" -d @- \
    >/dev/null && log "alerta: e-mail enviado" || log "alerta: FALHA ao enviar e-mail"
}

limpar_teste() { docker rm -f "$TESTE" >/dev/null 2>&1 || true; }
trap limpar_teste EXIT

falha() {
  log "FALHA: $1"
  # Só apaga o dump desta rodada (nunca o de outra rodada com nome parecido).
  [ "$CRIEI_ARQ" = 1 ] && rm -f "$ARQ"
  alerta_email "[VPS BI] BACKUP LegisUrna FALHOU — $MARCA" "O backup do banco do LegisUrna (legisurna-db) falhou.

Motivo: $1

Log: $LOG na VPS BI. Os backups anteriores continuam em $DEST e no Google Drive."
  exit 1
}

contar() { "${PSQL[@]}" -c "select (select count(*) from simulacoes)||' '||(select count(*) from votos)||' '||(select count(*) from contatos)"; }

log "== início $MARCA"
mkdir -p "$DEST" && chmod 700 "$DEST"

ANTES=$(contar) || falha "o banco não respondeu (container legisurna-db parado?)"
read -r S0 V0 C0 <<<"$ANTES"
[ -e "$ARQ" ] && falha "já existe $ARQ (duas rodadas no mesmo segundo?)"
CRIEI_ARQ=1
docker exec legisurna-db pg_dump -U legisurna -d legisurna -Fc >"$ARQ" 2>>"$LOG" || falha "pg_dump terminou com erro"
DEPOIS=$(contar) || falha "o banco parou de responder durante o dump"
read -r S1 V1 C1 <<<"$DEPOIS"
chmod 600 "$ARQ"
BYTES=$(stat -c %s "$ARQ")
[ "$BYTES" -gt 1000 ] || falha "dump vazio ou truncado ($BYTES bytes)"
log "dump: $ARQ ($BYTES bytes) · origem simulacoes=$S0..$S1 votos=$V0..$V1 contatos=$C0..$C1"

# -- restore-test real --
docker run -d --name "$TESTE" --memory 256m --network none -e POSTGRES_HOST_AUTH_METHOD=trust -e POSTGRES_DB=teste \
  postgres:16-alpine >/dev/null 2>>"$LOG" || falha "não subiu o Postgres de teste"
# Pronto = aceitar conexão TCP (o servidor temporário do initdb só escuta no socket).
for _ in $(seq 1 60); do
  docker exec "$TESTE" pg_isready -h 127.0.0.1 -U postgres -d teste >/dev/null 2>&1 && break
  sleep 1
done
docker exec "$TESTE" psql -h 127.0.0.1 -U postgres -d teste -tAc "select 1" 2>/dev/null | grep -q 1 || falha "Postgres de teste não ficou pronto"
docker exec -i "$TESTE" pg_restore -h 127.0.0.1 -U postgres -d teste --no-owner --exit-on-error <"$ARQ" 2>>"$LOG" ||
  falha "pg_restore no banco de teste falhou"
read -r S V C <<<"$(docker exec "$TESTE" psql -h 127.0.0.1 -U postgres -d teste -tAc \
  "select (select count(*) from simulacoes)||' '||(select count(*) from votos)||' '||(select count(*) from contatos)")"
entre() { [ -n "$1" ] && [ "$1" -ge "$2" ] && [ "$1" -le "$3" ]; }
entre "$S" "$S0" "$S1" && entre "$V" "$V0" "$V1" && entre "$C" "$C0" "$C1" ||
  falha "restore-test não bateu: restaurado simulacoes=$S votos=$V contatos=$C, origem $ANTES → $DEPOIS"
limpar_teste
log "restore-test OK: simulacoes=$S votos=$V contatos=$C"

# -- retenção local --
find "$DEST" -name 'legisurna-*.dump' -mtime +"$RETENCAO_DIAS" -delete
LOCAIS=$(find "$DEST" -name 'legisurna-*.dump' | wc -l)

# -- off-host --
OFFHOST="NÃO CONFIGURADO — a cópia existe só na VPS BI"
if command -v rclone >/dev/null 2>&1 && [ -n "${RCLONE_REMOTE:-}" ]; then
  if rclone copy "$ARQ" "$RCLONE_REMOTE/vps-bi/legisurna-db/" 2>>"$LOG"; then
    rclone delete "$RCLONE_REMOTE/vps-bi/legisurna-db/" --min-age "${RETENCAO_DIAS}d" 2>>"$LOG" || true
    OFFHOST="enviado ($RCLONE_REMOTE/vps-bi/legisurna-db/)"
  else
    falha "dump OK e restaurado, mas o envio ao Google Drive falhou"
  fi
fi
log "off-host: $OFFHOST · na VPS: $LOCAIS arquivos · fim OK"

if [ "$(date +%H)" = "15" ] || [ "${EMAIL_OK:-0}" = "1" ]; then
  alerta_email "[VPS BI] backup LegisUrna OK — $MARCA" "Backup do banco do LegisUrna concluído e restaurado com sucesso.

Arquivo      : $ARQ ($BYTES bytes)
Restore-test : simulacoes=$S votos=$V contatos=$C
Off-host     : $OFFHOST
Na VPS       : $LOCAIS arquivos (retenção de $RETENCAO_DIAS dias)

Roda às 03h e às 15h. Este e-mail vem só na rodada das 15h.
Se você NÃO receber este e-mail amanhã, o backup não rodou."
fi
