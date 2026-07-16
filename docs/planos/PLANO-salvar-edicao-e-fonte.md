# Plano — Salvar edição com escolha (sobrescrever / nova) + acordes maiores

> **Como retomar:** abra o Claude Code nesta pasta e peça
> *"vamos executar o PLANO-salvar-edicao-e-fonte.md"*.
>
> **Status: ✅ CONCLUÍDO.** Inc.1 entregue na **v0.52.0** (acordes ~20% maiores); Inc.2 na **v0.53.0**
> (salvar edição com escolha + salvar o tom transposto). Suíte: **354 verificações**, zero erro de JS.
> Follow-up em aberto: *salvar o tom **na escala*** (`it.key`) — ver "Fora de escopo".
>
> _(Planejado com app na v0.51.3.)_ Pedido de campo do ministério
> (culto de 2026-07-15): (1) ao editar uma cifra e mudar algo (tom, capo, anotações, corpo),
> um **modal de escolha** — *sobrescrever* a música ou *salvar como nova* (ex.: "musica1 Tom G" e
> "musica1 Tom D"); (2) **acordes pequenos** em relação à letra — aumentar a proporção.
>
> **Decisões do dono (2026-07-15):**
> - **D1** A escolha aparece **no editor E ao transpor no player** (o tom transposto é **gravado no
>   corpo** da cifra). Cobre o gesto ao vivo do exemplo — nível **repertório** (a música), não a escala.
> - **D2** Acordes **~20% maiores** (fixo), **mantendo o alinhamento** coluna a coluna.
>
> **Validado adversarialmente** (3 lentes céticas: correção técnica/CSS — com prova empírica em
> Chromium headless + força bruta na grafia · fit de domínio/palco · regressões/testes). Achados
> confirmados incorporados abaixo; a seção final resume o que mudou.

---

## O que é
Duas melhorias, entregues em **dois incrementos/versões** (isola risco e o teste de regressão):

- **Inc.1 → v0.52.0 — Acordes ~20% maiores.** Baixo risco, 100% CSS, independente.
- **Inc.2 → v0.53.0 — Salvar edição com escolha + salvar o tom transposto no player.** Núcleo do pedido.

---

## Restrição técnica que molda o desenho
A cifra usa **fonte monoespaçada** com `white-space:pre` (`.cifra`, l.262-273): a **linha de acordes
fica alinhada coluna a coluna** por cima da letra. `renderCifra` (l.1237) emite `<span class="chord">`
inline; o alinhamento é **posicional**. Aumentar o `font-size` real do acorde alarga o avanço →
**desloca as colunas**. Logo a proporção maior tem que ser **puramente visual (sem mudar o layout)**.

---

## Incremento 1 — Acordes ~20% maiores (v0.52.0)

### Desenho (empiricamente validado)
```css
.cifra .chord{
  /* ...existente: color/font-weight/background/border-radius/text-shadow... */
  display:inline-block;                      /* transform exige box; inline puro ignora scale */
  transform:scale(var(--chord-scale,1.2));   /* ~20% maior; variável facilita ajustar no campo */
  transform-origin:left bottom;              /* borda esq. fixa (coluna preservada); cresce p/ CIMA */
}
```

**Por que resiste (medido em Chromium headless):**
- **Alinhamento:** `offsetWidth` dos acordes idêntico com/sem a regra; `getBoundingClientRect().left`
  **byte-idêntico** (`[0, 72.03, 144.06, 216.09]`) — `transform` é visual, a caixa de layout continua
  1.0×; `transform-origin:left` fixa a borda esquerda. Só a largura **visual** cresce ×1.2.
- **Modo Página:** `paginate` mede `page.scrollHeight > clientHeight` (layout) e opera sobre
  `#p-body`/`#p-pageind` **não transformados** → paginação **idêntica** (fit 341/341, tight overflow
  nos dois). Trocar `inline`→`inline-block` **não** mexeu na altura da linha (sem "pulo" de baseline).
- **Toque no acorde / popover:** hit-test `closest(".chord")` usa a geometria transformada (alvo
  maior); `#chorddiag` é `position:fixed` no body (não filho do `.chord`) → `transform` não o prende.

**`transform-origin:left bottom`** (não `center`): cresce só para cima, evitando o **recorte cosmético**
da base do acorde na última linha de uma página (`.cifra.paged .page` tem `overflow:hidden`,
`padding-bottom:0`). A borda esquerda continua fixa (coluna preservada).

### Riscos (Inc.1)
- **Sobreposição real + toque no vizinho:** ao crescer 0.2×largura p/ a direita, em cifra Cifra Club
  com acordes colados (1 espaço) pode **sobrepor** (não só "aproximar"); no overlap, o acorde seguinte
  (à frente no DOM) pinta por cima → um toque na zona sobreposta pode abrir o diagrama do **vizinho**.
  Aceito pelo dono (D2); `--chord-scale` baixa rápido. **Validar no celular com cifra densa real.**

### Teste (Inc.1) — `tests/smoke.mjs`
- Computed style do `.cifra .chord`: `display:inline-block` **e** `transform` = matriz de escala ≈1.2
  (não `none`). *(Assertar o `inline-block` importa: em `inline` puro o `transform` computa `none`.)*
- **Não-regressão 100% CSS:** saída de `renderCifra` **byte-idêntica** (a mudança é só estilo).
- **Guarda anti-`font-size`:** `#p-body.dataset.pages` (Modo Página) **inalterado** com/sem a regra —
  troca acidental para `font-size` mudaria o layout e quebraria aqui.
- **NÃO** assertar `.left` em px (flaky em headless: fontes do Google não carregam, cai no fallback).

---

## Incremento 2 — Salvar edição com escolha + salvar o tom no player (v0.53.0)

### Peças novas
1. **`transposeBody(body, semis, ctx)`** — **gêmea de `renderCifra`**: mesmos ramos e **mesmo regex
   `/(\S+)/g`** (preserva TODA a whitespace — senão colapsa espaços e destrói o alinhamento do corpo
   **gravado**); só troca a emissão de `<span>` por **texto**. Reusa `isChord`/`transposeChord`
   (regra nº3). `semis%12===0` → devolve o corpo **intacto** (preserva a grafia). Ramos a espelhar
   **exatamente** (senão corrompe o corpo salvo):
   - seção sozinha (`isSectionLine`) → intacta;
   - `[Seção] + resto` → transpõe `sc[4]` **só se `isChordLine(sc[4])`** e `!isChord(label)`, preserva
     `sc[1]`/`sc[3]` (espaços) e o rótulo;
   - linha só de acordes (`isChordLine`) → transpõe via `replace(/(\S+)/g, isChord?tx:t)`;
   - letra → transpõe **só** `[C]` inline; **não** transpor token "pelado" (ex.: `"[G] E aí"` mantém o
     `"E"` solto como letra — `isChord("E")` é true, mas a linha **não** é `isChordLine`);
   - tokens neutros (`|`, `x2`, `:|`) e tab → intactos (só `isChord(t)` transpõe).
2. **`songChanged(stored, data)`** — compara os 8 campos com **normalização simétrica** dos DOIS
   lados: `safeUrl(ref)` em ambos, `(capo||0)`, `String(notes).trim()`, `tags.map(trim).filter(Boolean)
   .join("|")`. Senão uma música intacta (ref antiga não-saneada) aparece como "mudou" e abre a folha à toa.
3. **`cloneSong(src, over)`** — `Object.assign({}, src, over)` + `id` novo + `tags` copiadas +
   `updatedAt`. **Fonte única de clone**: `dupSong` passa a usá-la (preserva `ref`/`notes` de graça) e o
   Fluxo B também — evita clone "na mão" que esquece campos.
4. **Folha de escolha** reusando `openSheet(title, items, note)` (l.3064): itens *Sobrescrever* /
   *Salvar como nova*; **Cancelar = tocar fora** (backdrop fecha). O `note` carrega o aviso honesto.

### Fluxo A — Editor (`#e-save`, l.2099)
Se **música existente E `songChanged`** → folha:
- **Sobrescrever** → `Object.assign(stored, data)` (comportamento atual).
- **Salvar como nova** → `id` novo; se o **título não mudou**, desambigua: `+" (Tom "+key+")"` quando o
  tom mudou, senão `+" (cópia)"`. Vira `editingId`, abre no player.
Sem mudança, ou música nova → salva direto (sem folha). Título vazio/lint: inalterado.
*(Tensão aceita: o modal aparece em qualquer edição de música existente, como o dono pediu
["…anotações ou coisa parecida"]. **Sobrescrever é o 1º item, 1 toque.** Se no campo o toque extra
incomodar em correções triviais, dá pra escopar só ao "tom mudou".)*

### Fluxo B — Player transposto (novo controle no ⚙ "Esta música")
Botão **"Salvar tom/capo"** (`#p-savekey`), linha `#p-savekey-row` escondida por padrão. `drawPlayer`
a mostra **só** quando `!escalaCtx && (((transp%12)+12)%12!==0 || capo!==(current.capo||0))`.
> ⚠️ **Condição exata `capo!==(current.capo||0)` — não `capo!==0`.** Como `openPlayer` já abre no capo
> salvo (v0.51.3, l.1575), `capo!==0` faria o botão aparecer na abertura de **toda** música com capô,
> sem o usuário ter mexido — regressão que a v0.51.3 acabou de consertar.

Ao tocar: `closePlayerSheet()` (padrão v0.51.2) → assa e abre a folha. **Assar por `transp`** (mantém o
**pitch** e o **capo**; convenção do app: `body` = acordes no **tom soante**, display aplica `−capo`):
- `ctx=spellCtx(current.key, transp)`; `newKey=transposeNote(root,transp,ctx)+m?`;
  `newBody=transposeBody(current.body, transp, ctx)`; `newCapo=capo`.
- **Sobrescrever:** `current.body=newBody; current.key=newKey; current.capo=newCapo; transp=0` → salva
  → `drawPlayer`.
- **Salvar como nova:** `cloneSong(current,{body,key,capo, title:current.title+" (Tom "+newKey+")"})`,
  abre a nova no player.

> ⚠️ **NÃO é "sem salto visual" com capô.** Força bruta em `(tom×transp×capo×acorde)` achou **2968**
> divergências de **grafia** (mesmo pitch, letra diferente) entre o quadro antes e depois: assar por
> `transp` e reexibir por `−capo` não é homomorfismo (o fallback enarmônico de `transposeNote` troca a
> letra; ex.: `old=C, transp=1, capo=1` → `Bb` vira `A#`). **Garantia honesta:** *mesmo som*; **com
> `capo=0` a grafia também é idêntica** (redraw por `transp=0` é identidade); **com capô a grafia pode
> ser reescolhida** (enarmônica — mesma forma) e isso **persiste** no `body`. A confirmação avisa.

### Por que **só no player normal** (não na Apresentação) — e a honestidade sobre a mutação
`#p-savekey` some com `escalaCtx` setado. **Mas atenção (não é "território seguro"):** *Sobrescrever*
muda `current.key`/`body` da **música**, e **toda escala que herda o tom** (item com `it.key===""`)
passa a soar no tom novo — inclusive no player normal. Isso é o mesmo que o editor sempre permitiu ao
trocar o `key`. **A confirmação diz isso em texto claro** ("regrava os acordes nesta música e vale em
toda escala que herda o tom"). Esconder na Apresentação evita fazer isso **no meio do culto**.

### Riscos (Inc.2) e mitigação
- **Grafia enarmônica com capô** (acima) → afirmação rebaixada + confirmação honesta + teste por **pitch**.
- **Mutação compartilhada** (acima) → confirmação honesta; botão fora da Apresentação.
- **`transposeBody` divergir de `renderCifra`** → espelhar ramos/regex exatos + testar cada ramo.
- **"Salvar como nova" 2×** cria dois "(Tom X)" iguais (ids diferentes) → em import/sync futuro,
  `collidingTitles` alarma / `mergeSongs("mine")` deduplica. É o **mesmo padrão do `dupSong`** (aceito);
  documentado. (1ª vez **não** colide, pois o sufixo difere do original.)
- **Recência (v0.24.0):** a cópia nasce "nunca tocada" (correto — é música nova); pode subir no sort
  "menos tocadas". Inerente a criar item novo; aceito.
- **Vínculo de escala em "salvar como nova":** a escala continua no `id` **antigo** (esperado — "manter
  as duas"); a nova não entra em escala nenhuma → remap/`mergeEscala`/`buildLastPlayed` intactos.

### Teste (Inc.2) — `tests/smoke.mjs` (casos mínimos)
1. `transposeBody`: linha de acordes; `[C]` inline; **`[Seção]+acordes` na mesma linha**; **preservação
   de espaços** (transposição de mesma largura G→A sai idêntica no espaçamento); `"[G] E aí"` mantém o
   `"E"` como letra; `|`/`x2`/tab intactos; seção/letra intactas; `semis%12===0` idêntico; **round-trip**.
2. `songChanged`: muda em cada um dos 8 campos → true; **salvar sem mudar nada** → false (sem folha).
3. Fluxo A: editar corpo → folha; *Sobrescrever* mantém 1 música; *Salvar como nova* → 2 (sufixo
   `(Tom X)` quando tom mudou, `(cópia)` quando só corpo); música nova (sem id) salva **sem** folha.
4. Fluxo B — visibilidade: abrir `capo:2, transp=0` → `#p-savekey-row` **hidden** (âncora v0.51.3);
   transpor → **visível**; **capo-only** (transp%12===0, capo≠salvo) → visível; `escalaCtx` → **hidden**.
5. Fluxo B — *Sobrescrever* com **capo=0** → `#p-body` innerHTML **estável** (sem salto); reabrir a
   música mostra o `key` novo **e o corpo assado** (acordes trocados, não só o rótulo).
6. Fluxo B — capô: assertar **pitch** preservado (não string) — documenta a ressalva enarmônica.
7. `checkKey=true` + *Sobrescrever* → `#keycheck` **não** passa a alarmar (`detectKey`/`compareKey` são
   por pitch-class, insensíveis à grafia).
8. Cancelar a folha (tocar fora) → **nada** gravado.
9. `cloneSong`/`dupSong`: a cópia preserva `ref` e `notes`.
> Folhas usam `.show` via rAF → o teste precisa de `waitForTimeout` após abrir/tocar (padrão da suíte).

---

## Fora de escopo (follow-up recomendado)
- **Salvar o tom NA ESCALA (`it.key`)** — o gesto do **ensaio** ("essa vai em D neste domingo"), sem
  mutação compartilhada. Hoje só dá pra fazer pelo editor da escala (`.f-key`), **inalcançável pela
  Apresentação**. É provavelmente o encaixe de domínio mais forte; fica como próximo passo. O pedido
  atual do dono é nível-repertório (a música), então este plano entrega isso primeiro.

## Ritual (as duas versões)
Cada incremento fecha o ritual completo (`CLAUDE.md`): `APP_VERSION`=`package.json`; CHANGELOG; ROTEIRO
(linha do tempo + rodapé + backlog); README se a lista de recursos mudar; `npm test` verde;
**`index.html` sincronizado**; commit + tag. Sem `Co-Authored-By`.

## Limites honestos
- Proporção do acorde é **visual**; acordes longos/colados podem sobrepor — `--chord-scale` ajusta.
- Salvar o tom transposto **assa** o corpo: mesmo som, mas **com capô a grafia enarmônica pode mudar**
  (persistida). Vale **só no player normal**; *Sobrescrever* afeta escalas que herdam o tom (avisado).
- "Salvar como nova" desambigua o título automaticamente; renomear depois se quiser.

## Arquivos
- **Alterados:** `louvai.html` (CSS `.chord`; `transposeBody`/`songChanged`/`cloneSong`; `dupSong`
  refatorado; `#e-save`; HTML + handler de `#p-savekey`; toggle em `drawPlayer`), `tests/smoke.mjs`,
  `index.html` (sync), `CHANGELOG.md`, `ROTEIRO-louvai.md`, `README.md` (se recursos), `package.json`.

## Validação adversarial — o que mudou depois dos céticos
- **[técnico/empírico] Derrubada a promessa "sem salto visual" com capô** (2968 divergências de grafia):
  virou "mesmo som; grafia enarmônica pode mudar com capô". Teste por **pitch** (ou capo=0 p/ string).
- **[técnico] Inc.1 confirmado empiricamente** (alinhamento/paginação/hit-test/popover resistem);
  `transform-origin` → `left bottom` (recorte no rodapé); assertar `inline-block` no teste; nada de px.
- **[técnico] `transposeBody`**: regex `/(\S+)/g` obrigatório (espaços) + ramo da letra (`"[G] E aí"`);
  testar `[Seção]+acordes`, espaços, tokens neutros, tab.
- **[domínio] Mutação compartilhada não é exclusiva da Apresentação** → confirmação honesta.
- **[domínio] `cloneSong` único** (não esquecer `ref`/`notes`); **per-escala tom** vira follow-up.
- **[regressões] `songChanged` simétrico**; **âncora v0.51.3** (capo salvo → botão escondido);
  coerência do "conferir tom" (por pitch-class) testada; `openSheet` em `file://` OK com `waitForTimeout`.
