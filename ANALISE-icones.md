# Análise de Ícones — Louvai

> Documento de **design/produto** (não é código de produção). Objetivo: tornar os
> ícones do app legíveis, inequívocos e com "cara de app pronto" — respeitando a
> regra de **arquivo único** (`louvai.html`), **offline-first**, sem build/CDN.
>
> Foco do dono: o botão **`↥` de "Backup e compartilhamento"** na topbar é
> ambíguo (parece só "upload"). Resolver esse primeiro; o resto é incremento.

---

## 1. Inventário atual

Os ícones de hoje são **glifos Unicode/emoji** embutidos no HTML. Tabela do que
está em uso, sua função e a ambiguidade observada.

### Topbar da Biblioteca

| Glifo | id | Função | Problema / ambiguidade |
|------|-----|--------|------------------------|
| `◐` | `#themeBtn` | Alternar tema claro/escuro | OK. Meia-lua é convenção razoável; podia ser ☀/☾ mas `◐` é neutro. |
| `↥` | `#backupBtn` | **Backup + compartilhar + restaurar + nuvem** | **Pior caso.** Seta-pra-cima-com-barra lê como "upload/enviar". Não comunica backup, nem "menu", nem nuvem. É a entrada de uma seção inteira (4 ações), mas parece uma ação única de upload. |
| `↧` | `#importBtn` | Importar arquivo (.json) | Quase idêntico ao `↥` (espelho vertical). No palco/pouca luz, `↥` e `↧` lado a lado são **fáceis de confundir**. |

### FAB e bottom nav

| Glifo | id | Função | Problema |
|------|-----|--------|----------|
| `＋` | `#newBtn` / `#newEscBtn` | Nova cifra / nova escala | OK, universal. |
| `♪` | `#tab-songs` | Aba Cifras | OK. |
| `▤` | `#tab-escalas` | Aba Escalas | Aceitável (lista/linhas), mas genérico. Concorre visualmente com `☰`. |

### Player (barra normal)

| Glifo | id | Função | Problema |
|------|-----|--------|----------|
| `←` | `#p-back` | Voltar | OK. |
| `☰` | `#p-struct` | Estrutura da música | OK como "lista de seções", mas é o mesmo "hambúrguer" que em outros apps = menu. Tolerável. |
| `⚙` | `#p-settings` | Ajustes da cifra | OK, universal. |
| `▶` | `#scroll-toggle` | Auto-scroll (play) | OK. Vira `❚❚` (pausa) ao rolar — bom feedback. |

### Player (barra Apresentação)

| Glifo | id | Função | Problema |
|------|-----|--------|----------|
| `←` `‹` `›` `⚙` | `pv-*` | Voltar / anterior / próxima / ajustes | OK. `‹ ›` finos contrastam bem com o `←` de "sair". |

### Editor / Escala

| Glifo | id | Função | Problema |
|------|-----|--------|----------|
| `✕` | `#e-cancel`/`#ee-cancel` | Cancelar/fechar | OK. |
| `✎` | `#es-edit` / `#p-edit` | Editar | OK, lápis é universal. |
| `↗` | `#es-share` / `#p-share` | Compartilhar (enviar arquivo) | Ambíguo: seta-diagonal lê como "abrir externo / link". Para "compartilhar" o padrão moderno é o nó de compartilhamento (share-nodes) ou a seta-saindo-da-caixa. |
| `▶` | `#es-present` | Apresentar | OK (play = apresentar). |
| `↑` `↓` | `.move` | Mover item na escala | OK. |

### Ajustes da cifra (sheet)

| Glifo | id | Função | Problema |
|------|-----|--------|----------|
| `♭` `♯` | `s-tdown`/`s-tup` | Tom abaixo/acima | Ótimo — fala a língua do músico. |
| `−` `＋` | `c-down`/`c-up` | Capo | OK. |
| `A−` `A＋` | `f-down`/`f-up` | Fonte | OK, rótulo textual é claro. |
| `𝄞` | `#lyr-toggle` | Só letra (esconde acordes) | **Confuso.** Clave de sol = "música/áudio", não "esconder acordes / mostrar só letra". Risco de render inconsistente em fontes. |
| `≣` | `#tabs-toggle` | Tablaturas | Genérico (linhas). Tolerável com o rótulo ao lado. |

### Sheets (itens com `.ic`) e botões da nuvem

| Glifo | Onde | Função | Problema |
|------|------|--------|----------|
| `🔗` | share sheets | Enviar **link** | OK — corrente = link. |
| `↗` | share sheets | Enviar **arquivo .json** | Mesmo `↗` de "compartilhar"; aqui significa "arquivo". Sobrecarga do mesmo glifo. |
| `↥` | backup sheet / `#repo-export` | Exportar tudo (.json) | Reforça a leitura "upload" — e é o **mesmo** glifo do botão da topbar que abre a seção. |
| `↧` | backup sheet | Restaurar de arquivo | OK no contexto, mas confunde com importar. |
| `☁` | backup sheet / `#repo-publish` | Nuvem / publicar | OK. |
| `⧉` | share sheet | Copiar texto | Aceitável (cópia). |
| `🗑` | excluir | Excluir | OK, universal. |
| `🎵` | item de música na escala | Marca música | OK. |

**Diagnóstico-chave:** o app mistura **emoji coloridos** (`🔗 ☁ 🗑 🎵 📋 🔍`) com
**glifos monocromáticos** (`↥ ↧ ↗ ✎ ☰ ⚙ ◐ 𝄞 ≣`). Isso quebra a coesão visual —
os emoji renderizam coloridos (e diferente em cada SO), os glifos herdam
`--text`/`--accent`. Some-se a isso a **família de setas quase idênticas**
(`↥ ↧ ↗ ↑ ↓ ←`) usada para significados diferentes (upload, import, share,
mover, voltar). É a maior fonte de ambiguidade do conjunto.

---

## 2. Decisão de abordagem: Unicode refinado vs SVG inline

Ambas respeitam o arquivo único. A questão é **coesão e controle**.

### Opção A — Unicode/emoji refinado (mexer pouco)
**Prós**
- Zero código novo; troca de um caractere por outro.
- Já é o padrão do projeto; risco baixíssimo.
- Peso zero no arquivo.

**Contras**
- **Sem controle de traço/peso/cor**: emoji vêm coloridos e mudam de desenho
  entre Android/iOS/Windows — impossível garantir o look violeta da marca.
- Vocabulário pobre: não existe glifo Unicode bom e inequívoco para "backup",
  "share-nodes", "restaurar", "nuvem-com-seta". Sempre acaba numa seta genérica.
- Legibilidade no palco sofre: muitos glifos têm traço fino e tamanho
  inconsistente entre si.

### Opção B — SVG inline, um set coeso (Lucide/Feather, MIT)
**Prós**
- **Coesão total**: todos com o mesmo peso de traço (Lucide = 2px,
  `stroke="currentColor"`), tamanho e cantos. Cara de app pronto.
- **Tema grátis**: `stroke="currentColor"` herda `--text`/`--accent` → funciona
  igual no claro e no escuro, sem emoji colorido fora de paleta.
- **Vocabulário rico e inequívoco**: existe `archive`, `cloud-upload`,
  `share-2`, `download`, `upload`, `list-music`, `sliders`, etc.
- Continua **offline-first**: o `<path>` vira texto dentro do `louvai.html`
  (igual a inlinar o set MIT — permitido pela regra).

**Contras**
- Mais verboso: cada ícone é `<svg>…<path/></svg>` (vs 1 caractere). ~10–20
  ícones × ~5 linhas = peso pequeno, mas o HTML cresce.
- Manutenção: trocar glifo por SVG exige um helper ou repetir markup. Mitiga-se
  com uma função `icon(name)` que devolve o `<svg>` (uma só fonte de paths).
- Esforço inicial maior (migrar ~18 pontos de uso e o `.iconbtn`/`.ic`).

### Recomendação
**Híbrido, em duas ondas:**
1. **Agora (baixo risco):** trocar só o `↥` da topbar por algo melhor (ver §3) —
   pode ser Unicode ou um único SVG. Resolve a dor do dono sem refatorar.
2. **Incremento (alto valor):** migrar o conjunto para **SVG inline (Lucide)**
   via um helper `icon(name)`, padronizando `.iconbtn` para um `<svg>` 22–24px
   com `stroke-width:2`. É o que dá "cara de app pronto" e mata a confusão das
   setas. Risco médio (toca muitos pontos), mas mecânico e testável.

> Por que Lucide: fork ativo do Feather, licença MIT (pode inlinar), traço 2px
> consistente, e tem exatamente os ícones que faltam (archive, cloud-upload,
> share-2, list-music, sliders-horizontal).

---

## 3. Ícone de Backup/compartilhamento (o pedido principal)

Antes do ícone, **a pergunta certa é o que essa entrada representa**. Hoje ela
agrupa 4 coisas heterogêneas: exportar arquivo (backup), enviar link, restaurar,
e repertório na nuvem. Isso é, na prática, um **menu de "Repertório / Dados"** —
não uma ação de "upload". O ícone deve comunicar **"meus dados / backup"**, não
um verbo único.

### Opções concretas

**Opção 1 — `archive` (Lucide) — caixa/arquivo.** *(recomendada)*
- SVG: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="5" x="2" y="3" rx="1"/><path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8"/><path d="M10 12h4"/></svg>`
- **Por quê:** "caixa de arquivamento" = guardar/backup do repertório. Não é um
  verbo de direção (não confunde com import/export). É um lar natural para as 4
  ações. Combina com renomear a entrada (ver abaixo).
- Trade-off: menos "compartilhar". Mitiga-se com o título do sheet.

**Opção 2 — `cloud-upload` / `cloud` (Lucide).**
- SVG (cloud): `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.5 19a4.5 4.5 0 0 0 0-9h-1.8A7 7 0 1 0 4 16.7"/><path d="M12 12v9"/><path d="m8 17 4-4 4 4"/></svg>`
- **Por quê:** o app está caminhando pra "repertório na nuvem / compartilhar por
  link" (ver `PLANO-compartilhar-link.md`). Nuvem comunica "guardar fora do
  aparelho + compartilhar".
- Trade-off: hoje o backup é **arquivo local**, não nuvem de verdade — pode
  prometer sincronização que ainda não existe. Melhor adotar quando o link/nuvem
  for o caminho primário.

**Opção 3 — `ellipsis` / "Mais" (três pontos `⋯` ou `more-vertical`).**
- Unicode: `⋯`. SVG (Lucide `ellipsis`): `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>`
- **Por quê:** é honesto — "menu de mais ações". Nunca está errado.
- Trade-off: pouco descritivo (não diz "dados/backup"); joga toda a comunicação
  pro título do sheet. Bom fallback, fraco como primeira escolha.

**Opção 4 — `share-nodes` / `share-2` (Lucide) — nó de compartilhar.**
- SVG: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" x2="15.42" y1="13.51" y2="17.49"/><line x1="15.41" x2="8.59" y1="6.51" y2="10.49"/></svg>`
- **Por quê:** se o foco for "compartilhar", esse é o glifo certo e moderno.
- Trade-off: enfraquece o lado "backup/restaurar/guardar". A seção é mais
  "dados" do que "compartilhar".

### Recomendação
**Trocar `↥` por `archive` (Opção 1) E renomear a entrada para "Repertório" (ou
"Backup").** Razão: a seção é sobre **os dados do repertório** (guardar,
restaurar, publicar, compartilhar), não sobre "upload". `archive` é inequívoco,
não colide com `↧` (importar) nem com `↗` (compartilhar) e tem cara de "lugar
onde meu repertório vive". O caráter de "compartilhar/link/nuvem" fica claro
**dentro** do sheet (título + itens com seus próprios ícones).

> Se/quando o "compartilhar por link + nuvem" virar o caminho primário, migrar
> para `cloud-upload` (Opção 2). Por ora, `archive` descreve melhor o que existe.

**Repensar o agrupamento (recomendado):** considere separar conceitos hoje
empilhados sob o mesmo glifo:
- **Importar (`↧`)** e **Restaurar de arquivo** são quase a mesma coisa para o
  usuário → unificar reduz a confusão `↥`/`↧`.
- Dentro do sheet, dar a cada item um ícone distinto (download para baixar,
  upload para publicar, link para link, nuvem para nuvem) — não reusar `↥`/`↗`.

---

## 4. Conjunto coeso v1 (proposta SVG — Lucide)

Um set único, traço 2px, `currentColor`. Tamanho sugerido: 22px dentro do
`.iconbtn` de 48px (alvo de toque preservado).

| Função | id atual | Hoje | Proposta (Lucide) | Notas |
|--------|----------|------|-------------------|-------|
| Voltar | `p-back`/`es-back` | `←` | `arrow-left` ou `chevron-left` | `chevron` é mais leve/elegante. |
| Estrutura (seções) | `p-struct` | `☰` | `list-music` | Diferencia de "menu". Path tem nota musical. |
| Ajustes | `p-settings`/`pv-settings` | `⚙` | `sliders-horizontal` | Mais "ajustes de leitura" que "config do sistema". `settings` (engrenagem) também serve. |
| **Backup/dados** | `backupBtn` | `↥` | **`archive`** | Ver §3. |
| Importar/Restaurar | `importBtn` | `↧` | `download` | Seta-pra-baixo-em-bandeja = "trazer pra cá". |
| Compartilhar | `es-share`/`p-share` | `↗` | `share-2` | Nó de compartilhar; some a ambiguidade de "abrir externo". |
| Enviar arquivo (.json) | sheet | `↗` | `file-down` / `file-json` | Distingue "arquivo" de "link". |
| Enviar link | sheet | `🔗` | `link` | Lucide monocromático no lugar do emoji. |
| Nuvem / publicar | `repo-*` | `☁` | `cloud` / `cloud-upload` | Monocromático coeso. |
| Editar | `es-edit`/`p-edit` | `✎` | `pencil` | |
| Apresentar | `es-present` | `▶` | `play` / `presentation` | `play` casa com o auto-scroll. |
| Auto-scroll play/pause | `scroll-toggle` | `▶`/`❚❚` | `play` / `pause` | |
| Tema | `themeBtn` | `◐` | `sun` ↔ `moon` (alterna) | Mais legível que meia-lua. |
| Excluir | sheet/editor | `🗑` | `trash-2` | Monocromático, herda `--danger`. |
| Novo | `newBtn` | `＋` | `plus` | Manter; já é ótimo. |
| Buscar | `.mag` | `🔍` | `search` | Emoji → SVG coeso. |
| Só letra | `lyr-toggle` | `𝄞` | `mic` (off?) ou `type` / texto | `𝄞` confunde; ver §1. Melhor um ícone de "texto/letra" ou rótulo. |
| Tablaturas | `tabs-toggle` | `≣` | `align-justify` / `guitar` | Manter rótulo ao lado. |
| Copiar | share sheet | `⧉` | `copy` | |
| Mover ↑/↓ | `.move` | `↑`/`↓` | `chevron-up`/`chevron-down` | |
| Tom +/− | `s-tup`/`s-tdown` | `♯`/`♭` | **manter** `♯`/`♭` | Língua do músico; não trocar por SVG. |
| Capo/Fonte | `c-*`/`f-*` | `−`/`＋`/`A` | **manter** texto | Rótulos textuais são claros. |

> Exceções deliberadas: `♯ ♭` (tom), `A− A＋` (fonte) e `−/＋` (capo) **ficam como
> texto** — são notação musical/rótulos, não ícones. Misturar SVG aqui pioraria.

**Implementação sugerida (sem violar arquivo único):** um helper
`icon(name, size)` que retorna a string `<svg>…</svg>` a partir de um objeto
`ICONS = { archive:'<path .../>', share2:'…', … }`. Os `<svg>` ficam todos no
`louvai.html`; o helper centraliza (uma fonte da verdade de ícones, como o
`parseChord` é para acordes). Botões passam a chamar `btn.innerHTML = icon('archive')`.

---

## 5. Acessibilidade

- **`aria-label` continua obrigatório** em todo `.iconbtn` (o projeto já faz
  isso). Ao migrar para SVG, o `<svg>` deve ter `aria-hidden="true"` e o
  `aria-label` fica no `<button>` — assim o leitor de tela lê o rótulo, não o
  path.
- **Contraste nos dois temas:** `stroke="currentColor"` resolve — herda
  `--text` (botão neutro) ou `--accent-ink` (botão `.gold`). Verificar que o
  traço de 2px tem contraste AA contra `--panel` no tema claro (`#17131f` sobre
  `#fff` = ótimo) e escuro (`#fff` sobre `#1e1e1e` = ótimo).
- **Alvo de toque ≥48px** já garantido pelo `.iconbtn` (48×48); o SVG menor
  dentro não reduz a área clicável.
- **Estados toggle** (`lyr-toggle`, `tabs-toggle`, `scrollbar-toggle`) usam
  `aria-pressed` — manter ao trocar o glifo.
- Evitar depender de **cor** para significado (ex.: `🗑` vermelho): manter o
  rótulo/`aria-label` e a classe `.danger`.

---

## 6. Recomendação final priorizada

**1. Primeiro (rápido, baixo risco) — resolver o `↥`:**
   - Trocar o glifo do `#backupBtn` por **`archive`** (1 SVG inline) e **renomear**
     a entrada/título para **"Repertório"** (ou "Backup").
   - Opcional barato: trocar também o `↧` de `#importBtn` por `download` para
     desfazer a confusão do par de setas.
   - **Esforço:** ~30 min. **Risco:** baixo (2 botões, sem refactor). **Teste:**
     ajustar o smoke se ele casar o texto do glifo; checar `aria-label`.

**2. Depois (médio, alto valor) — migrar tudo pra SVG inline (Lucide):**
   - Criar `ICONS` + helper `icon(name)`; converter `.iconbtn`, `.sheetitem .ic`,
     `.nic`, `.mag`, `.move` e os botões da nuvem.
   - Padroniza peso/cor/tema e elimina a mistura emoji+glifo. Dá "cara de app
     pronto".
   - **Esforço:** ~2–4 h (mecânico). **Risco:** médio (toca ~18 pontos; o smoke
     que valida por `textContent` de glifo precisa virar validação por
     `aria-label`/seletor). Fazer em um incremento próprio, testado.

**3. Polir os ambíguos restantes** (junto da onda 2): `𝄞` (só-letra) e `≣`
   (tabs) para ícones mais óbvios; `↗` vs `🔗` dentro dos sheets para
   `share-2`/`file`/`link` distintos.

> Não trocar `♯ ♭` (tom) nem os rótulos `A−/A＋`, `−/＋` (fonte/capo): já são a
> linguagem certa pro músico.
