# Modos de leitura no player: paginação + auto-scroll opcional

> Plano aprovado pelo dono em 2026-06; decisões já tomadas (não reabrir).
> Status: **CONCLUÍDO** — Incremento 1 (auto-scroll opcional, v0.14.0) e Incremento 2
> (Modo Página, v0.15.0; correção de paginação no celular na v0.15.1) entregues e
> validados. Registro histórico — o app evoluiu desde então (ver `CHANGELOG.md`); a
> Apresentação ganhou barra compacta e "livro" entre músicas nas v0.18.0–v0.19.0.

## Contexto

Hoje o player do Louvai só tem **rolagem vertical** e a barra de **auto-scroll (▶ + velocidade) fica sempre na tela**. Tocando ao vivo, virar páginas costuma ser mais prático que rolar, e a barra fixa ocupa espaço quando não está em uso. Este recurso dá ao músico a escolha do **modo de leitura** e limpa a tela:

- **Modo Página (novo):** a cifra vira páginas horizontais "estilo livro". Avança **deslizando** ou com **um toque** (metade direita avança, metade esquerda volta). Sem auto-scroll nesse modo.
- **Modo Rolagem (atual):** rolagem vertical como hoje, mas a **barra de auto-scroll passa a ser opcional** (oculta por padrão; liga/desliga no ⚙ Ajustes).

**Decisões do dono (confirmadas — não reabrir):** paginação horizontal estilo livro com deslizar + toque nas laterais; preferências **globais** (salvas no aparelho, sem mexer nos `.json`); auto-scroll **oculto por padrão** no modo rolagem; no modo Apresentar (escala), trocar de **música** continua nos botões ‹ › da `#presentbar` e virar **página** é no corpo da cifra — sem conflito.

## Restrições invioláveis (do CLAUDE.md)

- Arquivo único `louvai.html`, JS vanilla, sem build. Offline-first.
- `renderCifra()` é a fonte única da verdade da cifra — **não reimplementar**; a paginação fatia a SAÍDA dele.
- Preservar IDs/fluxos e o contrato dos testes. Alinhamento monoespaçado acorde-sobre-letra é sagrado.

## Como o código de hoje funciona (âncoras)

- `renderCifra(body, semis, showChords, acc, hideTabs)` (louvai.html:~660–713) retorna HTML com uma **linha visual por elemento**, juntadas por `"\n"`; spans (`.sec/.chord/.lyr`) são sempre inline (nunca contêm `\n`) → **fatiar por `\n` é seguro**.
- `drawPlayer()` (~900–912) injeta tudo em `#p-body` (`.cifra`, `white-space:pre`, `overflow-x:auto`, `padding ...220px`).
- Auto-scroll (`startScroll/stopScroll/scrollRAF`, ~957–972) usa `window.scrollBy(0,px)` — **rola a janela**. Barra `.scrollbar-mini` (CSS ~190) é fixa e sempre visível.
- `scrollToSec(el)` (~938–943) usa `window.scrollY` + `offsetHeight` da `.controls`.
- `openPlayer(id,ctx)` (~861–875) reseta estado e chama `drawPlayer`; `escalaCtx`/`presentGo`/`#presentbar` = modo Apresentar.
- Settings: objeto `settings` (chaves `theme`, `hideTabs`), `saveSettings()` → `LS_SET` (~734–739). Sheet ⚙ Ajustes: `#playersheet`/`.sheetctrls` (HTML ~541–561).
- Wake Lock (`lockScreen`/`unlockScreen` + `visibilitychange`) — não é afetado.

## Abordagem da paginação (a parte difícil)

Montar páginas como **slides horizontais com scroll-snap nativo** (ganha o deslizar de graça); o toque chama `goPage(±1)`. O conteúdo vem de `renderCifra` (fonte única), fatiado por **medição real no DOM** e respeitando **unidades atômicas** (sem órfãs).

**1) Quebra em unidades atômicas (resolve a linha órfã).** `renderCifra(...).split("\n")` dá uma linha visual por item; classifico cada uma pelo HTML que ela já contém:
- tem `class="sec"` → **cabeçalho de seção** (cola na unidade seguinte);
- tem `class="chord"` e **não** `class="lyr"` → **linha só de acordes** (cola na linha seguinte = sua letra);
- começa com `<span class="lyr"` → **linha de letra** (auto-contida; pode ter acordes inline);
- vazia → espaçador (ponto de quebra natural).
Regra: **a quebra de página nunca ocorre logo após uma linha de acordes ou um cabeçalho** — o agrupador "gruda" acorde→letra e seção→conteúdo numa mesma unidade. Assim um acorde nunca termina a página sem a letra correspondente, nem vice-versa.

**2) Empacotamento por altura MEDIDA (resolve os tamanhos de tela).** Nada de estimar por `font-size × line-height`. Calculo `avail = innerHeight − topo(#p-body via getBoundingClientRect) − inset inferior seguro − folga` (reflete o aparelho/orientação reais, já descontando `.controls` e a `#presentbar` quando visível). Então monto as páginas medindo de verdade: para cada unidade, anexo suas linhas (como blocos `.ln`) à `.page` atual; se `page.scrollHeight > avail` **e** a página já tinha conteúdo, devolvo a unidade e abro nova `.page`. Como mede o DOM renderizado, lida automaticamente com a margem extra das seções, linhas em branco e qualquer fonte. Unidade isolada maior que `avail` (raro) ocupa a própria página e pode clipar — limitação documentada.

**3) DOM.** No modo página, `#p-body` ganha `.paged` e vira **track flex horizontal** (`display:flex; overflow-x:auto; scroll-snap-type:x mandatory`); filhos `.page` (`flex:0 0 100%; scroll-snap-align:start; overflow:hidden`) herdam a tipografia mono da `.cifra`. Cada linha vira `.ln` (`display:block; white-space:pre; min-height:1em` p/ preservar linhas em branco e permitir a medição). **Importante:** o `.ln` e a medição existem **só no modo página** — no modo rolagem, `#p-body` continua o bloco `pre` de hoje, intocado (a saída de `renderCifra` não muda). Estado p/ teste: `#p-body.dataset.page` / `.dataset.pages`.

**4) Recalcular** ao trocar de música, mudar fonte (#f-up/#f-down já chamam `drawPlayer`), alternar tabs/só-letra e em `resize`/orientação (handler com debounce); clampar a página atual após recalcular.

## Plano em 2 incrementos (cada um: implementar → `npm test` → CHANGELOG → APP_VERSION/package.json → commit + tag)

### Incremento 1 — Auto-scroll opcional no modo rolagem (v0.14.0) ✅ ENTREGUE
Menor e isolado; prepara o terreno de settings.
- `settings.showScrollbar` (bool, **default false**), persistido em `saveSettings`. `openPlayer`/`drawPlayer` aplicam: `.scrollbar-mini` só aparece quando `showScrollbar` for true. Ao ocultar, `stopScroll()`.
- Novo interruptor no ⚙ Ajustes (`#playersheet`): "Mostrar barra de auto-scroll" (ex.: `#scrollbar-toggle`), no padrão `.ctrl.toggle` já existente; alterna setting + salva + redesenha.
- **Atualizar o teste existente** "Tom e auto-scroll visíveis direto na tela": auto-scroll agora **oculto por padrão** → asserir que `.scrollbar-mini` começa oculta e que, após ligar o toggle, aparece. Tom continua visível.

### Incremento 2 — Modo Página (v0.15.0) ✅ ENTREGUE
- `settings.readMode` (`"scroll"` default | `"page"`), persistido. Seletor segmentado no ⚙ Ajustes ("Rolagem | Página", ex.: `#mode-scroll`/`#mode-page`).
- `drawPlayer` ramifica por `readMode`: rolagem = como hoje; página = pipeline de fatiamento acima. Em modo página: esconder `.scrollbar-mini` e o toggle de auto-scroll (não fazem sentido), `stopScroll()`.
- **Navegação:** `goPage(±1)` com `scrollTo({left, behavior:"smooth"})` + clamp; listener de `click` em `#p-body` no modo página (clientX vs meio da tela → avança/volta; guarda p/ não disparar logo após arraste); deslizar é nativo (scroll-snap) e atualiza o índice no `scrollend`.
- **Indicador** discreto "p / N" (ex.: `#p-pageind`) visível só no modo página.
- **`scrollToSec` no modo página:** em vez de `window.scrollTo`, achar `el.closest(".page")` e `goPage(índice)`. O handler do `#p-struct` (`#p-body .sec`) continua igual (seções ficam dentro das páginas).
- **Apresentar:** `openPlayer` reseta para a página 1; trocar de música pela `#presentbar` (sem conflito com o virar-página no corpo).
- **Testes novos:** alternar p/ página cria `#p-body.paged` + `.page` (≥1) e oculta auto-scroll; toque na direita avança (`dataset.page` sobe) e na esquerda volta; alternar de volta a um bloco único sem `.page`; cifra sem seções e cifra curta (1 página) não quebram; **nenhuma página termina numa linha de acordes "solta"** (verificar que a última `.ln` de cada `.page`, exceto a última, não é uma linha só-acordes — garante o anti-órfã); recalcular ao mudar a fonte muda `dataset.pages`.

## Armadilhas mapeadas

- **Não** introduzir `overflow-y:auto` em wrapper de view (auto-scroll do modo rolagem depende da janela rolar). O modo página NÃO rola a janela — ok, é clip horizontal.
- `padding-bottom:220px` da `.cifra` é p/ a barra fixa; no `.paged` o track zera padding e cada `.page` tem o seu (sem o 220px).
- Linhas muito longas (raras) ficam clipadas no modo página (sem scroll-x dentro do slide, que brigaria com o snap) — **limitação conhecida v1**, documentar.
- Não cortar par acorde/letra: garantido pelas **unidades atômicas** (acorde→letra, seção→conteúdo nunca se separam entre páginas).
- Medir a altura **depois** do layout aplicado (fonte/largura reais); a página de medição precisa estar com a largura final. Refazer no `resize`/rotação.
- `scroll-snap`/`behavior:smooth` é assíncrono — nos testes, asserir o índice (`dataset.page`) e dar `waitForTimeout` curto.
- **Overflow é inteiro, `avail` é fracionário** (corrigido na v0.15.1): `scrollHeight`/`clientHeight` voltam **arredondados**; comparar `scrollHeight > avail` (fracionário, ex.: 560,8px) quebrava a página cedo demais (1 linha/página → centenas de páginas) dependendo da fração de pixels do aparelho — passava no teste de desktop e falhava no celular. Compare **`scrollHeight > clientHeight`** (mesmo elemento, ambos inteiros).

## Arquivos

- `louvai.html` — CSS (`.scrollbar-mini`, `.cifra`, novo `.paged`/`.page`/indicador), HTML do `#playersheet` (controles novos) e do player, e JS (`settings`, `drawPlayer`, `openPlayer`, novo `paginate()/goPage()`, `scrollToSec`, handlers do ⚙, `resize`).
- `tests/smoke.mjs` — atualizar 1 assert (auto-scroll oculto) + asserts novos de paginação.
- `CHANGELOG.md`, `package.json`, `ROTEIRO-louvai.md` — ritual por incremento (marcar no Tema B do roteiro: "auto-scroll mais esperto" / modo de leitura).

## Verificação

- **Por incremento:** `npm test` verde (suíte atual + novos), zero erro de JS.
- **Manual (mobile viewport, dark e light):** modo rolagem com auto-scroll oculto→mostrar→rolar; alternar p/ página; virar com toque direita/esquerda e com deslize; mudar fonte e ver o re-fatiamento; abrir cifra longa (22 seções) e curta; estrutura (☰) saltando para a página certa; modo Apresentar trocando música pelos ‹ › sem conflito com o virar-página; girar o aparelho (recalcular).
- **Offline:** sem rede, tudo funciona (recurso é 100% local).
