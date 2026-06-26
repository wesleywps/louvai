# Redesign visual do Louvai — moderno, fluido e usável (estilo Spotify/Deezer)

> Plano aprovado pelo dono em 2026-06; decisões já tomadas (não perguntar de novo).
> **Status: CONCLUÍDO** — as 4 fases foram entregues nas v0.10.0–v0.13.0 (mais os
> ajustes v0.13.1/v0.13.2 de contraste e robustez). Registro histórico; a anatomia
> atual do `louvai.html` está no `CLAUDE.md`. Falta só a **aprovação visual do dono**
> nas telas reais (celular) antes da distribuição — ver `ROTEIRO-louvai.md`, Tema F.

## Contexto

O Louvai (app de cifras offline-first, arquivo único `louvai.html`, ~1500 linhas, HTML+CSS+JS vanilla) está funcional, mas o dono considera o visual "antigo": paleta marrom/dourada pesada, background sem fluidez, e navegação confusa (abas dentro da tela + FAB com 3 botões + ações soltas no topo). O redesign acontece **antes da primeira distribuição** aos testadores do ministério — a primeira impressão conta. Referências aprovadas: **Spotify** (Encore) e **Deezer**. Uso real: palco, pouca luz, celular/tablet, alvos de toque grandes.

**Decisões do dono (confirmadas — não reabrir):**
1. **Acento: violeta worship** (vibrante, ~`#a78bfa`/`#8b5cf6`) — identidade própria.
2. **Tipografia: modernizar** — UI em **Inter**, cifra continua **JetBrains Mono**, **Fraunces fica SÓ no logo** "Louvai" (selo da marca, junto com o dot).
3. **Navegação: bottom nav** (Cifras | Escalas) + **FAB "+" único** contextual; Backup migra para o cabeçalho (1 linha de JS).
4. **Player: sheet "Ajustes"** — barra mostra só Tom + auto-scroll; Capo/Fonte/Só-letra/Tabs/♯♭ vão para um painel (~12 linhas de JS aditivas).

## Restrições invioláveis

- Arquivo único, vanilla, sem build. Google Fonts cosméticas com fallback (`Inter, ui-sans-serif, system-ui` / `JetBrains Mono, ui-monospace`). Offline-first.
- **Contrato com o JS/testes — preservar:**
  - Todos os IDs (`#view-*`, `#tab-songs/#tab-escalas`, `#newBtn/#newEscBtn/#backupBtn`, `#t-*/#c-*/#f-*`, `#p-*`, `#e-*`, `#es-*`, `#ee-*`, `#sheet*/#pick*/#paste*`, `#toast`, `#presentbar/#pv-*`, `#scroll-toggle/#scroll-speed`, `#appVer`, `#themeBtn`, `#importBtn`, `#search`, `#tagbar`, `#songlist/#escalalist` etc.).
  - Classes geradas/testadas: `.chord .sec .lyr .songcard .sheetitem .irow .f-key .escard .orow .keytag .chip .brand .controls`.
  - `.hidden{display:none!important}` continua vencendo tudo (o `show()`/`switchTab()` dependem disso).
  - **Não renomear `.controls`** — `scrollToSec()` mede `offsetHeight` dela.
  - **Sem `overflow-y:auto` em wrappers de view/cifra** — o auto-scroll usa `window.scrollBy` (a página rola no window).
  - `.brand` continua contendo "Louvai".
- Tema claro continua existindo: `.light` redefine os **mesmos tokens**; nenhum hex inline em componente.

## Mapa do alvo (`louvai.html`)

CSS linhas ~13–272 · HTML ~274–495 · JS ~497+. Pontos sensíveis: `:root` (14–20) e `.light` (21–26); `body` background (29–37); topbar (44–63); `.fab` (95–104); `.controls/.ctrlrow` (106–120, HTML 324–343); `.cifra` (124–130, padding-bottom 220px casa com `.scrollbar-mini` 131); sheets (256–272); `applyTheme()` (~1412, escreve `#171210/#f3ece1` no `<meta theme-color>` — únicos literais de cor no JS); `switchTab()` (~1374) já alterna tabs/panes/FABs por ID.

## Fases (cada uma: implementar → `npm test` → CHANGELOG → `APP_VERSION` → commit + tag)

> Na Fase 1, invocar a skill **`frontend-design:frontend-design`** para elevar a qualidade estética da execução (evitar "cara de design genérico").

### Fase 1 — Fundação: tokens + pele nova (v0.10.0)
- Reescrever `:root`: near-black em camadas de brilho — `--bg:#121212; --bg2:#181818; --panel:#1e1e1e; --panel2:#282828; --line:rgba(255,255,255,.09); --text:#fff; --muted:#b3b3b3`. Novos tokens: `--accent` (violeta), `--accent-ink` (tinta sobre o violeta — validar contraste; declarar por tema), `--accent-soft`, escala de espaçamento (4/8/12/16/24/32), `--r/--r-lg`, `--dur:.2s`.
- **Compat de nomes:** `--gold/--gold-soft/--chord/--section` viram aliases dos novos valores (evita caçar ~40 `var(--gold)`); tokenizar os hex hardcoded `#231603` (6 lugares: linhas 63, 76, 103, 120, 136, 169) → `var(--accent-ink)` e os `rgba(224,168,90,…)` de sombras/gradiente (31, 104, 137).
- `body`: remover o radial dourado; fundo neutro com gradiente vertical sutil (a "fluidez").
- Cores da cifra: `.chord` em violeta claro legível, `.sec` em tom complementar — testar contraste em pouca luz.
- Fontes: adicionar **Inter** ao `<link>` Google Fonts (manter fallbacks); `body` → Inter; títulos internos (`.songcard .ttl`, `.songhead .h`, `.es-title`, `.et`, `.sheet h3`, `.es-order-h`) → Inter 700; **Fraunces permanece só em `.brand`**; dot do logo recolorido violeta com glow.
- Cards/inputs/botões: `rgba(255,255,255,.04-.05)` + borda `--line`, active sobe brilho (elevação Spotify = brilho, não sombra). Touch targets: `.iconbtn` 42→48px, `.ctrl button` min-width 40→48px.
- Tema claro: `.light` re-derivado dos mesmos tokens (neutro claro + violeta mais escuro p/ contraste).
- JS (1 linha cosmética): literais do `<meta theme-color>` em `applyTheme` + linha 6 do HTML.
- **Teste novo:** fundo não é mais o marrom antigo (`getComputedStyle(document.body).backgroundColor !== "rgb(23,18,16)"`).

### Fase 2 — Navegação: bottom nav + FAB único (v0.11.0)
- Transformar `.tabs` (HTML 285–288) em **bottom nav fixa** (mesmos `#tab-songs/#tab-escalas` e handlers): movê-la para fora de `.lib` mas dentro de `#view-lib` (some sozinha nas telas de detalhe), `position:fixed`, glass (`backdrop-filter:blur(12px)` + fundo translúcido), ícones + rótulo, `env(safe-area-inset-bottom)`, alvos ≥48px.
- `.fab`: vira **FAB "+" circular único** acima da nav — `#newBtn` (aba Cifras) e `#newEscBtn` (aba Escalas) já alternados pelo `switchTab`.
- **Backup → topbar:** mover `<button id="backupBtn">` para a topbar como `.iconbtn`; remover a linha do `switchTab` que alternava sua visibilidade (a "1 linha de JS").
- Ajustes de colisão: `padding-bottom` da `.lib` (66) aumenta p/ nav+FAB; toast `bottom` (251) sobe acima da nav; z-index: nav ~25–28 < topbar 30 < sheets 50/51 < toast 60.
- **Teste novo:** bottom nav visível na biblioteca; fluxo existente de abas continua passando.

### Fase 3 — Player / modo palco (v0.12.0)
- Barra `.controls` enxuta: **Tom (− G +)** + botão **⚙ Ajustes** (novo `#p-settings`); auto-scroll permanece na `.scrollbar-mini` inferior.
- Novo **sheet `#playersheet`** (padrão de `openPaste`, ~976–982 — NÃO usar o `#sheet` genérico, pois `openSheet` reescreve `#sheet-body.innerHTML`): recebe os grupos Capo, Fonte, Só-letra, Tabs, ♯/♭ **movidos no HTML** (mesmos IDs; handlers ligados no boot continuam válidos). ~12 linhas de JS aditivas para abrir/fechar.
- Re-skin: chips/toggles violeta quando ativos; `.presentbar` modernizada (mesmos `#pv-*`); `.songhead` com hierarquia melhor; conferir que `.cifra` padding-bottom casa com a `.scrollbar-mini`.
- `scrollToSec` se auto-ajusta (lê `offsetHeight` da `.controls` — que ficará mais baixa).
- **Testes novos:** abrir `#playersheet` e acionar `#c-up` dentro dele (capo continua funcionando); Tom e `#scroll-toggle` visíveis sem abrir nada.
- Validação manual de palco: legibilidade a ~1m, pouca luz, alvos grandes.

### Fase 4 — Escalas, editor e polish (v0.13.0)
- Re-skin: `.field/.row2` (editor), `.prow/.irow` (editor escala), `.es-team-box/.orow/.okey` (detalhe), `.escard`, foco de input com borda violeta.
- Empty states com mais apelo (CSS; textos em JS só se necessário — nenhum teste casa esses textos).
- Microinterações: transições padronizadas em `--dur` (≤300ms), `:active` consistente.
- Toast/sheets com glass; opcional: `document.startViewTransition` como wrapper gracioso do `show()` (~5 linhas aditivas, com fallback) — só se não afetar os testes.
- Revisão final do tema claro em todas as telas.

## Arquivos

- `louvai.html` — todo o redesign (CSS + HTML mínimo + ~15 linhas de JS no total).
- `tests/smoke.mjs` — 1–2 asserts novos por fase.
- `CHANGELOG.md`, `package.json`, `ROTEIRO-louvai.md` — ritual por fase (marcar Tema F no roteiro ao final).

## Verificação

- **Por fase:** `npm test` (27 checks atuais + novos) — zero erro de JS, fluxos por ID intactos.
- **Manual por fase:** abrir `louvai.html` no navegador (mobile viewport): dark e light, biblioteca→player→editor→escala→apresentar, sheets, toast, auto-scroll, estrutura ☰.
- **Offline:** carregar sem rede (fontes caem no fallback) — nada essencial quebra.
- **Final:** screenshot das telas principais para o dono aprovar antes de distribuir.
