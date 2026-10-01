# LegisUrna

Simulador de votação (urna eletrônica) para as eleições de 2026: simule seu voto,
confira o Effect 2009 da urna e veja a apuração agregada da simulação.

## Rodando

```bash
pnpm install
pnpm dev:db        # banco Postgres local (PGlite) — Ctrl-C encerra
pnpm dev           # http://localhost:3000
```

O `pnpm dev:db` imprime a `DATABASE_URL` para colar no `.env.local` (veja `.env.example`).
Para deixar o banco em background (um terminal só): `pnpm dev:db:bg`, e `pnpm dev:db:stop` para derrubar.

## Telas

| Rota         | O que é                                                            |
| ------------ | ------------------------------------------------------------------ |
| `/`          | Simulador: escolha o estado, os candidatos e vote                   |
| `/apuracao`  | Resultado agregado da simulação — uso interno, exige `APURACAO_SENHA` |
| `/como-funciona` | Como a urna real funciona (obrigatório, fonte do TSE)             |
| `/privacidade`, `/termos` | Texto de privacidade e termos                              |

## Banco

Postgres. Em desenvolvimento, `pnpm dev:db` sobe um PGlite (Postgres em WASM) num socket
TCP local e aplica `db/schema.sql` sozinho. Em produção use a URL do provedor e
aplique o schema com `psql "$DATABASE_URL" -f db/schema.sql`.

O PGlite atende uma conexão por vez: o pool fica com `DATABASE_MAX=1` (veja `.env.example`).

## Scripts

| Comando            | O que faz                                        |
| ------------------ | ------------------------------------------------ |
| `pnpm dev`         | servidor de desenvolvimento                       |
| `pnpm build`       | build de produção                                 |
| `pnpm lint`        | ESLint                                            |
| `pnpm test`        | Vitest (inclui testes de banco com PGlite)        |
| `pnpm dev:db[:bg]` | banco local; `pnpm dev:db:stop` derruba           |
