# Análise de UI — Louvai (pesquisa de melhorias)

> Pesquisa de design de produto/UI para o **Louvai** (app de cifras offline-first,
> arquivo único, usado no palco). **Não é código de produção** — é um relatório
> priorizado e acionável. Estado analisado: `louvai.html` na **v0.27.0**.
>
> **Regras respeitadas em TODAS as recomendações:** arquivo único, HTML+CSS+JS
> vanilla, sem build/framework/dependência em runtime, offline-first, fontes do
> Google só cosméticas (com fallback), paleta near-black `#121212` + violeta
> `#a78bfa`/`#8b5cf6` via tokens CSS, tema claro, alvos ≥48px, pt-BR, respeito ao
> "Reduzir movimento". Nada aqui exige rede, lib ou etapa de build.

---

## 1. Leitura do estado atual

### 1.1 O que já está bom (não mexer — é o alicerce)
- **Sistema de tokens maduro** (`:root` / `.light`): superfícies em camadas de brilho
  (`--bg`/`--bg2`/`--panel`/`--panel2`), acento como token único, e — o melhor detalhe —
  **acorde e letra em luminosidades diferentes** (`--chord`/`--lyric` + `--chord-bg`/`--chord-halo`)
  para ler de longe no escuro. Isso é exatamente a decisão certa para palco.
- **Atmosfera do fundo**: o `radial-gradient` violeta sutil no topo que dissolve no
  near-black (`body`) dá personalidade sem custo de performance. Não é "flat genérico".
- **Hierarquia de marca**: Fraunces só no wordmark da biblioteca, Inter no resto,
  JetBrains Mono para valores (tom, capo, keytag) — uso disciplinado e coerente.
- **Player de uma linha + sheet Ajustes**: a decisão de tirar cromo da tela ao vivo
  (v0.20.0) e a barra compacta da Apresentação (v0.18.x) estão alinhadas com o que
  OnSong/LivePrompter fazem de melhor ("mínimo de interação no palco").
- **Acessibilidade base**: `aria-label`/`aria-pressed` nos toggles, `prefers-reduced-motion`,
  `env(safe-area-inset-*)` em topbar/nav/sheets, `viewport-fit=cover`. Sólido.
- **Microinterações de toque**: `:active{transform:scale(.93~.985)}` consistente nos
  botões/cards — feedback tátil visual já existe e está calibrado.

### 1.2 Pontos fracos concretos (por tela/elemento)

**Topbar (`.topbar`, `.iconbtn`, `.brand .ver`)**
- O badge de versão (`.brand .ver`) compete visualmente com o wordmark. Num app
  "pronto", a versão é discreta (ou some da topbar e vai pro Backup/Sobre). Hoje ela
  ganha uma pílula com borda — muito peso para um detalhe técnico.
- Três `iconbtn` (◐ ↥ ↧) usam **glifos Unicode crus** com pesos/tamanhos ópticos
  diferentes. ↥/↧ são finos e "técnicos"; ◐ é um símbolo de lua. Falta unidade óptica —
  é o sinal nº1 de "protótipo" vs "produto". (Ver §3, ícones inline SVG.)

**Lista / cards (`.songcard`, `.keytag`, `.tagbar`, `.count`)**
- `.songcard` tem 4 níveis de texto possíveis (ttl/sub/tags/played) todos muito
  próximos em tamanho (16.5 / 13.5 / 11.5 / 11.5) e empilhados sem respiro — fica
  "denso" e sem ritmo claro. Tags e "played" disputam a mesma faixa de 11.5px.
- A `.keytag` é bonita, mas usa o mesmo raio/altura para tudo — não há diferenciação
  entre maior/menor, e ela some visualmente quando o tom é longo (ex.: "C#m").
- `.count` em caixa-alta tracking largo está ok, mas a `.tagbar` não tem indicação de
  scroll (corte/fade na borda) — no celular não fica claro que dá pra arrastar.
- Cards usam `margin-bottom:11px` — fora de qualquer grade de espaçamento (ver §3).

**Sheets (`.sheet`, `.sheetctrls`, `.grip`)**
- O `.sheetctrls` do ⚙ Ajustes é uma **lista vertical de 8 linhas** (Tom, Modo,
  Capo, Fonte, Só letra, Tabs, Auto-scroll, Música) todas com o mesmo peso visual.
  Não há agrupamento — "Tom/Capo/Fonte" (afinação) misturado com "Modo/Auto-scroll"
  (leitura) e "Editar/Enviar" (ações). Falta separadores ou títulos de grupo.
- O sheet não tem **gesto de arrastar para fechar** (o `.grip` sugere que tem, mas só
  fecha pelo backdrop) — é uma promessa de affordance não cumprida.
- `#reposheet` (Repertório na nuvem) é o sheet mais longo e mais "denso de texto" do
  app; mistura puxar/exportar/publicar/token num scroll só, sem hierarquia visual.

**Player (`.controls`, `.songhead`, `.cifra`, `.scrollbar-mini`)**
- A `.songhead` (`#p-sub`: artista · Tom · capo) usa 13px `--muted` — no palco, a
  informação **mais consultada de relance** (o Tom) fica apagada e do mesmo peso que o
  artista. O Tom merece destaque tipográfico (mono + cor de acento), não ser texto cinza.
- `.cifra` line-height 1.85 é bom; porém a fonte padrão (15px) pode ser pequena à
  distância de um pedestal. Não há preset rápido de "tamanho palco".
- A `.scrollbar-mini` ocupa uma faixa fixa inferior generosa quando ligada — ok — mas o
  botão play (▶) e o slider não têm estado visual de "rolando" diferente o suficiente
  (só troca o glifo).

**Editor (`.editor`, `.field`, `.lint`, `textarea`)**
- O foco violeta (`:focus{box-shadow:0 0 0 3px var(--accent-glow)}`) é ótimo. Mas o
  `.lint` aparece **sempre** abaixo da cifra mesmo vazio? (renderiza via `runLint`) —
  vale garantir que não há caixa vazia ocupando espaço.
- O botão "Salvar" (`.iconbtn.gold` com `padding:0 18px`) é um `iconbtn` esticado — fica
  com raio 14px e altura 48px, mas a label "Salvar" pede um botão de verdade (`.btn`),
  não um ícone deformado. Mesma observação para "＋ Adicionar função"/"＋ Música".

**Escalas (`.escard`, `.orow`, `.es-head`, `.es-team-grid`)**
- `.escard` mostra metadados como `.estag` (pílulas), mas a lista de cifras (`.songcard`)
  **não** usa o mesmo vocabulário de pílula para nada — duas telas "irmãs" com
  linguagens visuais diferentes. Falta consistência entre cards.
- `.orow .okey` repete o padrão da keytag mas com outro raio/tamanho (10px vs 13px) —
  inconsistência de raio (ver §3).
- O detalhe da escala tem 5+ blocos empilhados (título, presente, done, equipe, ordem,
  notas) sem ritmo de espaçamento consistente (`16px`, `10px`, `18px`, `4px` misturados).

**Estados vazios (`.empty`)**
- Existem, têm copy em pt-BR e um `♪` com glow — bom começo. Mas: (a) o da biblioteca e o
  de escalas têm o **mesmo ícone** `♪` (deviam diferenciar — um ▤ para escalas); (b) não
  há **botão de ação** dentro do estado vazio (só texto dizendo "toque em +"); (c) o
  estado de busca-sem-resultado **não existe** — uma busca sem hits cai no mesmo "Nada por
  aqui ainda" que sugere criar/importar, o que é a mensagem errada.

**Toasts (`.toast`, `toast()`)**
- O toast é único, centralizado, sem ícone de tipo (sucesso vs erro vs aviso). Muitas
  mensagens já trazem emoji na string (`✓`, `😕`, `🙂`) — inconsistente e dependente de
  emoji do sistema. Um toast com faixa de cor (sucesso/erro) e ícone fixo seria mais "app".
- Duração fixa de 2200ms para tudo; erros importantes ("Token inválido") somem igual a
  um "Salvo ✓".

**Tipografia & espaçamento (global)**
- Tamanhos de fonte são **muitos e arbitrários**: 11/11.5/12/12.5/13/13.5/14/14.5/15/15.5/
  16/16.5/17/19/20/24/25px. Não há uma escala tipográfica — cada componente escolheu o
  seu. Isso é o que mais "vaza" sensação de protótipo.
- Espaçamentos idem: 2/3/4/6/7/8/9/10/11/12/14/16/18px sem grade. Margens como `11px`,
  `14px`, `15px` não pertencem a nenhum sistema.
- Raios: `--r:16px`, `--r-lg:24px` existem como tokens, mas o CSS usa **valores soltos**
  por toda parte (`13px`, `14px`, `15px`, `9px`, `10px`, `11px`, `12px`) em vez dos tokens.

**Contraste no palco**
- No **dark**, `--muted:#b3b3b3` sobre `--panel:#1e1e1e` passa AA para texto normal, mas
  `.songcard .sub`/`.os`/`.es-meta` em 13px cinza ficam no limite de leitura a distância.
- No **light**, `--muted:#5f5a6e` sobre `--panel:#fff` é confortável. O ponto fraco do
  light é o **acorde**: `--chord:#6d28d9` sem chip nem halo sobre fundo claro pode sumir
  em luz forte de palco (sol pela janela da igreja de manhã).

**Microinterações**
- Há `:active` (toque) e fade de tela, mas faltam: feedback de **transposição** (o número
  do tom muda sem nenhum "pulso"), confirmação visual ao **marcar culto realizado** (só
  toast), e qualquer **animação de entrada de lista** (cards aparecem secos).

---

## 2. Recomendações priorizadas

> Esforço: **B**aixo (CSS/ajuste fino) · **M**édio (CSS+JS pontual) · **A**lto (refactor de várias telas).
> Risco sempre relativo a "quebrar layout/alinhamento mono da cifra".

### 2.1 Ganhos rápidos (CSS / ajuste fino — baixo risco)

| # | O quê | Por quê (benefício no domingo) | Esforço | Risco |
|---|---|---|---|---|
| G1 | **Escala tipográfica em tokens** (`--fs-xs:12 / --fs-sm:13 / --fs-md:15 / --fs-lg:17 / --fs-xl:20 / --fs-2xl:25`) e migrar os valores soltos para ela, mantendo a cifra mono intocada. | Ritmo tipográfico previsível = "cara de produto". Menos ruído visual cansa menos o olho no escuro. | M | Baixo (só troca números; a cifra usa `fontSize` próprio) |
| G2 | **Grade de espaçamento de 8pt** em tokens (`--sp-1:4 / --sp-2:8 / --sp-3:12 / --sp-4:16 / --sp-6:24`) e substituir `11/14/15/18px` por múltiplos. | Alinhamento neto e previsível entre cards, sheets e escalas. | M | Baixo |
| G3 | **Usar os tokens de raio existentes** (`--r`, e criar `--r-sm:12`, `--r-pill:999px`) no lugar de `13/14/10/9px` soltos. | Cantos coerentes = sinal forte de polish. Keytag e okey passam a combinar. | B | Baixo |
| G4 | **Destacar o Tom na `.songhead`/`#p-sub`**: render do "Tom: X" em mono + `--accent`, artista/capo em `--muted`. | No palco o Tom é a info mais olhada de relance; hoje está cinza igual ao resto. | B | Baixo (só muda markup do `bits` em `drawPlayer`) |
| G5 | **Fade lateral na `.tagbar`** (mask-image / gradiente nas bordas) indicando scroll horizontal. | Descoberta: a equipe percebe que há mais tags pra arrastar. | B | Baixo |
| G6 | **Toast tipado** (sucesso/erro/aviso) com faixa de acento à esquerda e ícone fixo; padronizar `toast(msg, tipo)` e remover os emojis das strings. | Erro ("Token inválido") deixa de parecer um "Salvo ✓". Menos dependência de emoji do SO. | M | Baixo |
| G7 | **Estado vazio de busca** distinto: quando `q` ou `activeTag` filtra para 0, mostrar "Nada encontrado para '…'" + botão "Limpar busca", em vez de "Nada por aqui ainda". | A mensagem certa no momento certo — hoje sugere "criar/importar" quando o usuário só filtrou demais. | B | Baixo (ramo no `if(!list.length)` de `renderLibrary`) |
| G8 | **Ícone diferente no vazio de escalas** (▤ em vez de ♪) e **botão de ação embutido** nos dois vazios ("＋ Nova cifra" / "＋ Nova escala" clicável que chama o handler do FAB). | Estado vazio com personalidade e caminho de saída claro — primeira impressão do app novo. | B | Baixo |
| G9 | **Acorde legível no tema claro**: dar um `--chord-bg`/`--chord-halo` suaves também no `.light` (chip violeta translúcido), não `transparent`. | Cifra legível com sol entrando na igreja de manhã — o caso real do "domingo". | B | Médio (testar nos dois temas) |
| G10 | **Pílula de versão mais discreta**: tirar borda/fundo do `.ver`, deixar só texto `--muted` pequeno colado ao wordmark. | Menos peso técnico na topbar; foco na marca. | B | Baixo |
| G11 | **Preset "Tamanho palco"** no Ajustes: além de A−/A+, um toque que pula a fonte para ~22px. | Ajuste de 1 toque na pressa antes de subir ao altar. | B | Baixo |
| G12 | **Pulso no valor do Tom/Capo** ao transpor (`@keyframes` curto de scale/cor no `.val`, atrás de `prefers-reduced-motion`). | Confirma a ação sem ler — feedback de microinteração que falta hoje. | B | Baixo |

### 2.2 Incrementos maiores (CSS + JS — médio/maior)

| # | O quê | Por quê | Esforço | Risco |
|---|---|---|---|---|
| M1 | **Ícones inline SVG unificados** (um pequeno set de paths no HTML, `currentColor`, `stroke-width` único) substituindo os glifos Unicode (◐ ↥ ↧ ☰ ⚙ ✎ ↗ ← ‹ › etc.). | Unidade óptica é o maior salto de "protótipo → produto". 100% offline, sem libs. | A | Médio (muitos pontos de uso; manter `aria-label`) |
| M2 | **Agrupar o ⚙ Ajustes** em seções com subtítulo: "Afinação" (Tom/Capo/Fonte), "Leitura" (Modo/Auto-scroll/Tabs/Só letra), "Esta música" (Editar/Enviar). | Encontrar o controle certo na penumbra fica mais rápido; hoje são 8 linhas iguais. | M | Baixo |
| M3 | **Arrastar para fechar sheets** (gesto no `.grip`/topo do sheet, com `touchstart/move/end` traduzindo em `translateY` e fechando após threshold). | Cumpre a promessa do grip; gesto esperado em apps mobile. Respeitar reduced-motion. | M | Médio |
| M4 | **Unificar a linguagem de card** entre `.songcard` e `.escard` (mesma estrutura: faixa de "tag/estag", mesmos pesos, mesmo respiro 8pt). | Duas telas irmãs com a mesma gramática visual = coesão de produto. | M | Baixo |
| M5 | **Reorganizar o `#reposheet`** em passos/abas internas (Puxar · Publicar) ou cartões com divisória clara, com o fluxo de token recolhido por padrão. | O sheet mais denso do app vira algo navegável; reduz medo de "mexer no token". | M | Baixo |
| M6 | **Skeleton/placeholder de cifra** ao abrir o player (2–3 linhas mono pulsando antes do `drawPlayer`), e no "Atualizar do link". | Percepção de velocidade; cobre o frame em que a paginação mede o DOM. | M | Médio (não atrapalhar a medição do Modo Página) |
| M7 | **Animação de entrada da lista** (stagger sutil de opacity/translateY nos cards, só na primeira pintura, atrás de reduced-motion). | Lista "viva" em vez de seca — detalhe de polish percebido. | B–M | Baixo |
| M8 | **Indicador de progresso na Apresentação** (barra fininha 2/5 → fração visual no topo da `.presentbar`). | Saber "onde estamos no culto" de relance, sem ler números. | B | Baixo |

---

## 3. Detalhes de polish que sinalizam "app pronto"

- **Ritmo de espaçamento (8pt).** Adotar `--sp-*` e aplicar a regra "espaço interno ≤ espaço
  externo" (padding do card menor que o gap entre cards). Hoje o `15px` interno e `11px`
  externo do `.songcard` violam isso (interno > externo) — por isso a lista "aperta".
- **Escala tipográfica modular.** ~6 degraus (12/13/15/17/20/25) cobrem tudo. Cada degrau
  com line-height múltiplo de 4 para vertical rhythm. A cifra mono fica fora da escala (ela
  tem seu próprio sizing por `fontSize`) — e deve mesmo ficar.
- **Profundidade coerente.** Hoje há um `--shadow` só, usado em sheet/toast, e sombras
  inline soltas (FAB, scrollbtn, chorddiag com valores próprios). Definir uma rampa curta:
  `--sh-1` (cards, quase nada), `--sh-2` (FAB/botões flutuantes), `--sh-3` (sheets/popovers).
  Elevação = superfície mais clara **+** sombra coerente (o app já faz a parte da cor).
- **Raios consistentes.** Mapear tudo para 3 raios: `--r-sm` (controles/chips internos ~12),
  `--r` (cards/botões 16), `--r-lg` (sheets 24), `--r-pill` (chips/tags 999). Eliminar os
  `9/10/11/13/14/15px` avulsos.
- **Foco/affordance.** O foco violeta dos campos é ótimo — **estendê-lo** a botões e cards
  navegáveis com `:focus-visible` (teclado/leitor), hoje ausente fora dos inputs.
- **Feedback de toque consistente.** `:active{scale(.97)}` já é padrão; faltam os **estados
  de seleção persistente** com o mesmo vocabulário (ex.: card "tocando agora" na Apresentação).
- **Estados vazios com personalidade.** Ícone próprio por contexto, uma frase curta de tom
  pastoral (já combina com o domínio) e **uma ação primária** embutida.
- **Densidade da informação.** Na `.songcard`, dar respiro de 4px entre ttl→sub e agrupar
  tags+recência numa única faixa de metadados (mesma cor/tamanho), reduzindo de 4 para 2
  níveis de leitura.

---

## 4. Acessibilidade & palco

- **Contraste AA nos dois temas.**
  - Dark: subir `--muted` de `#b3b3b3` para algo como `#c2c2c2` melhora `.sub`/`.os`/`.es-meta`
    a distância sem virar branco. (Mede ~ AA já em 13px; a margem ajuda no palco/penumbra.)
  - Light: o risco real é o **acorde** sumir com luz forte (G9). Garantir o chip translúcido.
- **Alvos de toque.** Já ≥48px nos principais (`.iconbtn` 48, `.btn` padding 16, slider thumb 26
  + trilha 34). Pontos a revisar: `.chip` da tagbar (7px vertical → fica < 48px de altura) e
  `.prow .rm`/`.move` (44px — ok, mas no limite). Subir a tagbar para ~44–48px de alvo.
- **Legibilidade da cifra à distância.** Manter o contraste acorde/letra (já excelente). Somar o
  preset "Tamanho palco" (G11). Considerar um leve aumento de `letter-spacing` negativo só nos
  títulos, não na mono.
- **Pouca luz.** O fundo near-black + glow já é confortável. Evitar branco puro em blocos grandes
  (a letra já usa `--lyric` abaixo do branco — manter). No light, o branco `#fff` de `--panel` em
  tela grande à noite é agressivo; o usuário deve usar dark — ok, mas vale um lembrete sutil.
- **Reduced motion.** Já respeitado globalmente — **toda** microinteração nova (G7/G12/M3/M6/M7)
  precisa cair na mesma media query. Já previsto nas recomendações.
- **Leitor de tela.** Manter `aria-label` ao trocar glifos por SVG (M1); usar `role="status"`/
  `aria-live="polite"` no `.toast` para anunciar "Salvo ✓"/erros (hoje o toast é mudo p/ leitor).

---

## 5. Referências (pesquisa)

- OnSong — modo palco/teleprompter, autoscroll, tap-to-turn: <https://onsongapp.com/> ·
  <https://onsongapp.com/docs/features/>
- SongbookPro — sets, ajuste rápido de tom/capo, dark theme, destaque de refrão/acordes:
  <https://songbook-pro.com/> · <https://songbook-pro.com/docs/manual/settings/general/>
- LivePrompter — "mínimo de interação no palco, sem menus/pop-ups/botõezinhos":
  <https://www.liveprompter.com/>
- Dark mode 2025 (hierarquia/contraste como sistema, cinzas suaves, acento criterioso):
  <https://www.uinkits.com/blog-post/best-dark-mode-ui-design-examples-and-best-practices-in-2025> ·
  <https://nighteye.app/dark-ui-design/> ·
  <https://medium.com/design-bootcamp/dark-mode-design-systems-a-practical-guide-13bc67e43774>
- Microinterações / feedback de toque / skeleton / estados vazios:
  <https://www.thedroidsonroids.com/blog/mobile-app-ui-design-guide> ·
  <https://natively.dev/blog/best-mobile-app-design-trends-2026>
- Grade 8pt, escala tipográfica e ritmo vertical:
  <https://uxplanet.org/everything-you-should-know-about-8-point-grid-system-in-ux-design-b69cb945b18d> ·
  <https://www.freecodecamp.org/news/8-point-grid-typography-on-the-web-be5dc97db6bc/> ·
  <https://www.designsystems.com/space-grids-and-layouts/>
- Rampa de elevação/sombra coerente (Fluent 2):
  <https://fluent2.microsoft.design/elevation>

---

## 6. Top 5 para começar (maior retorno / menor risco)

1. **G4 — Destacar o Tom na linha do player** (`#p-sub`/`.songhead`): mono + acento.
   A info mais olhada no palco para de se esconder em cinza. ~10 min, risco mínimo.
2. **G6 + leitor de tela no toast — Toast tipado (sucesso/erro/aviso)**, com `aria-live`,
   removendo emojis das strings. Eleva a sensação de feedback e a acessibilidade de uma vez.
3. **G1 + G2 + G3 — Tokens de tipografia, espaçamento (8pt) e raio**, migrando os valores
   soltos. É o ajuste que mais "tira a cara de protótipo" e destrava todo o resto.
4. **G7 + G8 — Estados vazios certos**: vazio de busca distinto, ícone por contexto e ação
   embutida. Primeira impressão e momento de frustração (busca sem hit) resolvidos.
5. **G9 — Acorde legível no tema claro** (chip/halo suaves no `.light`). É correção de
   legibilidade real do "domingo de manhã", não só estética.

> Sequência sugerida: começar pelo nº 3 (tokens) porque ele é a fundação que torna 1, 2, 4 e 5
> mais limpos de aplicar. Todos cabem no arquivo único, sem rede, sem build, e com
> `prefers-reduced-motion` respeitado nas partes animadas.
