# Plano — Diagramas de acorde (pegada ao tocar no acorde) — v0.25.0

> **Como retomar:** abra o Claude Code nesta pasta e peça
> *"vamos executar o PLANO-diagramas-acorde.md"*.
> **Status: ✅ IMPLEMENTADO na v0.25.0** (commit/tag `v0.25.0`).
>
> **Entregue:** motor híbrido (`OPEN` curado + `TPL_E`/`TPL_A` móveis via `placeTemplate`),
> `chordIntervals`/`qualityFamily`, `fingering` (→ "sem diagrama" honesto), `chordSvg` (SVG
> tema-aware) e popover `showChordDiagram` (gatilho no `pointerup` do `#p-body`, toque parado
> no `.chord`, prioridade sobre virar-página). Capo-aware (usa a forma já exibida). **132
> verificações** — incluindo a **validação por notas** de todas as formas (curadas + geradas).
>
> **Armadilhas/decisões registradas:**
> - `7M` em pt-BR = **sétima maior** (não dominante) — tratado no `chordIntervals`.
> - Virar-página é `pointerup` (não `click`): o toque no acorde é resolvido **dentro** do
>   `pointerup` (antes do `goPage`), senão a página viraria junto.
> - O motor cobre só qualidades com forma móvel **confiável** (maj/m/7/m7/maj7/sus4/sus2);
>   `dim`/`aug`/`m7b5`/`6` ficam por `OPEN` ou "sem diagrama" — melhor que pegada errada.
>
> *(Histórico do plano abaixo; decisões originais mantidas.)* App estava na v0.24.0 ao planejar.

## Decisões confirmadas com o dono (2026-06)
- **Híbrido:** tabela **curada** das formas comuns (ficam idênticas ao que o violonista
  espera) + **motor por templates móveis** (CAGED: E-shape e A-shape) pro resto.
  Pro que nem o motor voicear bem: **"sem diagrama" honesto** (melhor que pegada errada).
- **Instrumento:** **violão 6 cordas**, afinação padrão **E-A-D-G-B-E**. Cavaco/ukulele depois.
- **Reusa a fonte da verdade:** `parseChord` (`{root, suffix, bass}`, louvai.html:705) e
  `NOTE_IDX` (nota→classe de altura, :646). Nada de segundo parser de acorde.
- **Capo-aware de graça:** no player o texto do `.chord` **já é o acorde de forma**
  (transposto por `ctxShape`). O diagrama lê o **texto exibido** → mostra a pegada que a
  pessoa realmente faz com o capô. Sem recalcular capô.
- **Render SVG** inline, tema-aware (usa `--accent`/`--line`…). **Toque no acorde → popover.**
- **Validação por NOTAS:** o teste confere que a pegada gerada **soa as classes de altura do
  acorde** (e contém a raiz / o baixo). Pega erro de dado automaticamente — pegada errada
  não passa no CI.

## Arquitetura

### Modelo do braço
- Cordas low→high (6→1), classes de altura das soltas: `OPEN_PC = [4,9,2,7,11,4]` (E A D G B E).
- `noteToPc(nota)` = `NOTE_IDX[nota]` (já trata `Bb`, `F#`, etc.).
- Nota soada por (corda, casa) = `(OPEN_PC[corda] + casa) % 12`.

### Qualidade → intervalos
`chordIntervals(suffix)` interpreta o `suffix` do `parseChord` num conjunto de semitons:
- maj `[0,4,7]` · m `[0,3,7]` · 7 `[0,4,7,10]` · maj7/M7 `[0,4,7,11]` · m7 `[0,3,7,10]` ·
  6 `[0,4,7,9]` · m6 `[0,3,7,9]` · sus2 `[0,2,7]` · sus4 `[0,5,7]` · dim `[0,3,6]` ·
  dim7 `[0,3,6,9]` · aug `[0,4,8]` · m7b5 `[0,3,6,10]` · add9 `[0,4,7,14]` · 9 `[0,4,7,10,14]`…
- **Fallback robusto** (gramática generosa): se não casar exato, detecta `m`/`min` → menor,
  senão maior; ignora extensões não mapeadas (toca a tríade). Sem base reconhecível → `null`.

### Pegadas (o "híbrido")
- **`OPEN`** — formas abertas canônicas, **verificadas à mão**: C, A, Am, G, E, Em, D, Dm,
  e os 7/m7/maj7/sus mais usados + slashes comuns (C/E, D/F#, G/B). Cada uma:
  `[s6..s1]` (-1 mudo, 0 solta) + pestana opcional.
- **Templates móveis** — E-shape (raiz na 6ª corda) e A-shape (raiz na 5ª) para
  maj/m/7/m7/maj7/sus4/dim/aug/m7b5/6. Para um acorde sem `OPEN`: acha a casa da raiz na
  corda-raiz e **desliza** o template; escolhe a posição mais baixa (≥1) e mais tocável;
  prefere E-shape vs A-shape conforme a casa.
- **`fingering(nome)`**: `parseChord` → se há `OPEN[nome]` usa; senão template pela qualidade;
  senão `null`. **Slash:** se `OPEN` tem a variante usa; senão mostra a forma base + **rótulo
  do baixo** (best-effort no MVP).

### Render e UX
- `chordSvg(fingering)`: grade 6×5, bolinhas nos dedos, `x`/`o` em cima, **pestana** como
  barra, número da casa-base quando fora da pestana do nó. Cores via variáveis de tema.
- **Gatilho:** delegação de clique nos `.chord` dentro do player (`renderCifra` já embrulha
  cada acorde em `<span class="chord">`). Tocar abre um **popover** `#chorddiag` perto do
  toque (fecha ao tocar fora / Esc). Alvo de toque grande (palco, pouca luz).
- `null` → popover mostra **"sem diagrama pra <acorde>"** (honesto).

## Implementação (em `louvai.html`)
1. **Engine** (perto de `parseChord`): `OPEN_PC`, `noteToPc`, `chordIntervals`, `OPEN`,
   `SHAPES` (templates), `fingering(nome)`.
2. **Render**: `chordSvg(fingering)` + CSS do popover/diagrama.
3. **UX**: handler delegado de clique no `.chord` (no `#p-body`/cifra do player);
   abrir/fechar popover; `aria-label`.
4. **Ritual** (recurso → **v0.25.0**): `APP_VERSION`+`package.json`+`package-lock.json`;
   CHANGELOG; ROTEIRO (Tema C: marcar diagramas; ordem/rodapé); README; CLAUDE.md (anatomia:
   engine de diagramas); `tests/smoke.mjs`; commit+tag; sincronizar `index.html`.

## Testes (`tests/smoke.mjs`)
- **`chordIntervals`**: amostras conferem os intervalos (m7, maj7, sus4, dim, m7b5…).
- **`fingering` por NOTAS (o teste forte):** para as formas geradas, as classes de altura
  soadas ⊆/= conjunto do acorde **e** contêm a raiz (e o baixo, em slash). Roda pros 12 roots
  × qualidades comuns — uma pegada com nota errada **falha o CI**.
- **`OPEN` conferidas:** C/G/D/Em/Am batem as casas conhecidas (regressão de dado).
- **"Sem diagrama" honesto:** qualidade não mapeada → `fingering` retorna `null` e a UI mostra
  a mensagem (sem inventar).
- **Toque:** clicar num `.chord` no player abre o popover com o acorde certo; tocar fora fecha.
- `npm test` verde.

## Limites honestos (MVP)
- **Uma posição** por acorde (a mais idiomática/baixa) — "outras posições" fica pra depois.
- **Slash exótico** → forma base + baixo anotado (não procura o baixo no braço ainda).
- **Só violão padrão** — cavaco/ukulele e afinações alternativas: incremento futuro.

## Arquivos
- `louvai.html` — engine (`fingering`/`chordIntervals`/`OPEN`/`SHAPES`), `chordSvg`, popover, UX.
- `tests/smoke.mjs` — intervalos, pegada-por-notas, OPEN, "sem diagrama", toque.
- `CHANGELOG.md`, `ROTEIRO-louvai.md`, `README.md`, `CLAUDE.md`, `package.json`, `package-lock.json`.
