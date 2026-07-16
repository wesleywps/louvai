# Plano — Quebra de linha automática na cifra (não esconder ao ampliar)

> **Status: ✅ CONCLUÍDO na v0.56.0.** Validado empiricamente no Playwright (rolagem fonte 26 sem
> transbordo; Modo Página 2→5 ao ampliar; `rewrapBody` puro sem cortar acorde; linha curta idêntica).
>
> _(Planejado com o app na v0.55.0.)_ Pedido de campo: ao ampliar a cifra (pinça)
> e a linha exceder a largura, **letra e acordes somem pro lado**. Queremos **quebra automática em
> blocos** que caibam na tela, refletindo na **paginação** (mais páginas) e na **rolagem** (mais linhas).
>
> **Decisão do dono (2026-07-16):** **manter o visual de colunas** — a linha longa é partida em
> **blocos** que cabem na largura; dentro de cada bloco os acordes seguem alinhados por cima da letra
> (estilo Cifra Club). *(Alternativa recusada: acorde colado na sílaba com refluxo natural.)*

---

## Restrição / princípio
A cifra é monoespaçada (`white-space:pre`) para o acorde cair na coluna certa. Quebra automática só
preserva o alinhamento se a **linha de acordes e a linha de letra dela** forem cortadas nos **MESMOS
limites de coluna**. Logo: quebrar = **partir o par (acorde, letra) por colunas que cabem na largura**.

## Desenho (isolado e de baixo risco)
Uma função **pura** `rewrapBody(texto, cols)` roda **antes** do `renderCifra` e devolve o corpo com as
linhas longas já partidas em blocos empilhados. O `renderCifra` **não muda** (regra nº3): ele só vê mais
linhas, mais curtas. Fluxo no `drawPlayer` (só quando o wrap está ligado):
1. `shaped = transposeBody(body, shapeShift(), ctxShape)` — texto já transposto (1 etapa; reusa a função
   da v0.53.0). *(Com `shapeShift()===0`, devolve o corpo original.)*
2. `wrapped = rewrapBody(shaped, cols)`.
3. `renderCifra(wrapped, 0, showChords, ctxShape, hideTabs)` — `semis=0` preserva (já transposto).
   **Equivale byte-a-byte** ao `renderCifra(body, shapeShift(), …)` de hoje quando nada é partido
   (transposição de 1 etapa; sem o problema enarmônico de 2 etapas). Wrap **off** = caminho atual intacto.

### `cols` (quantas colunas cabem) — `wrapCols(#p-body)`
Mede a largura de 1 caractere mono (probe `white-space:pre; font:inherit` → mede o **font real**, cobre
o fallback offline) e divide a largura útil (`clientWidth − padding`). **Reserva ~2 colunas** porque o
acorde tem `transform:scale(1.2)` (a largura VISUAL do acorde passa da largura de layout; cresce p/ a
direita). `overflow-x:auto` fica de rede de segurança pro caso extremo.

### `rewrapBody`
- **par acorde+letra** (linha `isChordLine` seguida de linha de letra): `chunkPair(chord, lyric, cols)`
  — corta os dois nas mesmas colunas; **prioriza não partir ACORDE** (acorde partido é ilegível), e
  entre as fronteiras de acorde escolhe a que também é **fim de palavra**; senão aceita corte de palavra
  (raro, legível). Pula espaços comuns no início do próximo bloco.
- **acorde sozinho** (sem letra abaixo): `chunkOne` (quebra nos espaços).
- **letra / `[Seção]+acordes` / outros**: `chunkOne` (quebra nos espaços; `[C]` inline segue junto).
- **seção sozinha, tablatura, linha em branco, linha que já cabe**: passam **intactas** (tab não quebra —
  fica com `overflow-x` se for larga; documentado).

### Paginação / rolagem
- `paginate` mede a **altura real** → mais blocos ⇒ mais páginas, sem tocar nele.
- `pageUnits` cola "acorde→letra" (par atômico) → cada bloco (acorde+letra) fica **junto** numa página.
- Rolagem: mais linhas, cada uma cabe na largura → **sem rolagem lateral**.

### Interruptor + resize
- `settings.wrapLines` (**padrão ligado**), toggle **"Quebrar linhas"** no ⚙ *Leitura*. Off = comportamento
  atual (rola pro lado). `openPlayer` seta o estado; handler alterna + `drawPlayer`.
- Estender o handler de `resize` (hoje só Modo Página) p/ também re-renderizar em **rolagem quando o wrap
  está ligado** (recalcula `cols`); preserva a fração de rolagem.

## Riscos e mitigação
- **Overflow visual do acorde 1.2×** → reservar ~2 colunas + `overflow-x` de segurança; **medir no Playwright**.
- **Fronteira acorde × palavra raramente coincide** → prioriza acorde intacto; palavra pode cortar (raro).
- **`cols` errado por padding/modo** → medir empiricamente (o teste falha se transbordar) e ajustar.
- **Regressão do render atual** → wrap off e "linha que cabe" devem sair **idênticos** a hoje (testar).
- **Acorde/palavra maior que a tela** (zoom extремo) → corte forçado + `overflow-x` (aceito, documentado).

## Testes (via Playwright — regra do projeto)
- **`rewrapBody` puro:** par acorde+letra corta nas mesmas colunas; não parte acorde; `[C]` inline segue;
  linha curta volta idêntica; seção/tab intactas.
- **Empírico (medição do render):** com fonte GRANDE, em **rolagem** → `#p-body.scrollWidth ≤ clientWidth`
  (não transborda); em **Página** → `dataset.pages` **aumenta** vs. fonte pequena; **alinhamento** (o
  `left` do 1º acorde do bloco bate com o início do bloco da letra); **wrap off** → sai idêntico a hoje.
- Espelhar o padrão da suíte; medir de verdade (não só `settings`).

## Arquivos
- `louvai.html` (funções `rewrapBody`/`chunkPair`/`chunkOne`/`wrapCols`; ramo no `drawPlayer`; toggle
  `#wrap-toggle` + `openPlayer` + handler; `resize`), `tests/smoke.mjs`, `index.html` (a Action gera),
  `CHANGELOG`/`ROTEIRO`/`README`/`CLAUDE.md`, `package.json`.
