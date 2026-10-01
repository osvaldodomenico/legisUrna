# Paleta de marca "MINHA COLINHA" (base: public/cabecalho.png)

Cores extraidas da faixa preta do cabecalho `public/cabecalho.png` (1920×587).
Frequencia medida na imagem: preto 64%, branco 10%, amarelo 8%, verde 3%.

## Tokens (fixos em ambos os projetos)

| token | hex | origem |
|---|---|---|
| `--mc-preto` | `#000000` | fundo da faixa |
| `--mc-branco` | `#ffffff` | titulo "MINHA COLINHA" |
| `--mc-escuro` | `#141414` | preto suave (cards, urna, banners) |
| `--mc-cinza` | `#2a2a2a` | superficies elevadas |
| `--mc-borda` | `#3d3d3d` | bordas |
| `--mc-texto` | `#f5f5f5` | texto sobre escuro |
| `--mc-apagado` | `#a3a3a3` | texto secundario sobre escuro |
| `--mc-amarelo` | `#fce454` | simbolo amarelo |
| `--mc-verde` | `#44a138` | simbolo verde |
| `--mc-teal` | `#2d8892` | "ELEICOES 2026" no cabecalho |
| `--mc-fundo` | `#f7f7f5` | fundo claro |
| `--mc-superficie` | `#ffffff` | cards claros |

## Uso por contexto

- **Fundo do site (claro):** `--mc-fundo`. Cards: `--mc-superficie` com borda `--mc-borda`.
- **Fundo do site (escuro):** `--mc-preto`. Cards: `--mc-escuro` com borda `#262626`.
- **Marca / destaque principal:** `--mc-teal` (mesma cor de "ELEICOES 2026"). Nao usar teal do Tailwind (`teal-600` = #0d9488) nem o azul-marinho da colinha 1080x1920.
- **Marca / destaque secundario:** `--mc-amarelo` (`#fce454`), exclusivamente sobre preto. Nao usar em texto pequeno sobre fundo claro.
- **Sucesso / confirmacao:** `--mc-verde`.
- **Aviso / alerta:** `--mc-amarelo` com texto `--mc-escuro`.
- **Erro:** `#ff5c5c` (derivado, nao ha vermelho na paleta).
- **Link:** `--mc-teal` no claro; no escuro tambem `--mc-teal` (contraste 4.5:1 sobre `#000`).
- **Botao primario:** fundo `--mc-escuro` com texto branco; hover `#2a2a2a`.
- **Botao de destaque (votar/simular):** fundo `--mc-teal` com texto branco.
- **Foco de teclado:** `outline: 2px solid var(--mc-amarelo); outline-offset: 2px` em todos os elementos focaveis.

## Regra para a urna (LegisUrna)

O *hardware* (bocarra, gabinete, teclas BRANCO/CORRIGE/CONFIRMA) **nao** muda: cinza-claro realista.
A *tela* da urna usa a paleta: fundo `--mc-escuro`, texto `--mc-texto`, selecao `--mc-amarelo`,
numero confirmado `--mc-teal`, branco/voto nulo em `--mc-apagado`.

## Regra para o mapa (LegisOndeVotar)

Tile do Leaflet mantido. Pinos, polyline e controles usam `--mc-teal` / `--mc-amarelo` / `--mc-escuro`.

## Proibido

- Cores de partido. A paleta e civica por construcao.
- Marca ou brasao do TSE.
- `amber-50`, `slate-*`, `teal-600`, `emerald-*` do Tailwind em qualquer tela (fora da urna e do mapa).

## Aplicação (2026-10-01)

Tokens e classes `mc-*` gravados em `src/app/globals.css` dos dois projetos.
Tailwind v4.3.3 confirmado: `@theme inline` + `--color-mc-*` geram `text-mc-txt`, `bg-mc-card`, `border-mc-borda`.
Urna: só a TELA recebe a paleta (`--urna-screen: var(--mc-escuro)`, `--urna-ink: var(--mc-texto)`); hardware intacto.
