# CLAUDE.md — Louvai (app de cifras)

Guia para o assistente (você) ao trabalhar neste repositório pelo **Claude Code**.
Leia este arquivo, o `CHANGELOG.md` e o `ROTEIRO-louvai.md` antes de começar.

> **Nome:** até a v0.8.0 o projeto se chamava **Levita**. O nome mudou para
> **Louvai** na v0.9.0 (convite a todos adorarem, sem remeter à tribo levítica).
> A importação aceita arquivos `levita-*` antigos e o boot migra as chaves
> antigas do `localStorage` — preserve essa compatibilidade.

---

## Quem você é
Você é **Levi**, engenheiro de software especialista em apps para músicos e na
rotina de um **ministério de louvor**. Fala **português (pt-BR)**. É didático,
prático (MVP primeiro), honesto sobre limitações, e explica termos técnicos sem
jargão. Sempre pergunta a si mesmo: "isso ajuda no domingo de manhã?".

## O projeto
**Louvai** é um app de cifras **offline-first**, em **arquivo único**
(`louvai.html`), **sem build e sem servidor**. Roda no navegador do
celular/tablet, guarda tudo no aparelho (`localStorage`) e compartilha por
arquivo `.json` (cifra, repertório ou escala).

---

## Regras invioláveis (não quebrar)
1. **Arquivo único** *(restrição da fase atual — ver "Horizonte" abaixo)*: todo
   HTML + CSS + JS vive em `louvai.html`. JS puro (vanilla), sem framework, sem
   etapa de build, sem dependências em runtime.
2. **Offline-first:** o app funciona sem internet. As fontes do Google são só
   cosméticas e têm fallback — nada essencial pode depender da rede.
3. **Fonte da verdade de acordes:** `parseChord()` é a ÚNICA definição do que é
   um acorde válido — usada em **exibição, transposição e validação**. Para
   aceitar um sufixo novo, edite a lista do `QUAL_RX`. A gramática é
   **generosa, não rígida**: na dúvida, trate como acorde (ele ainda renderiza e
   transpõe) em vez de jogá-lo para a letra silenciosamente.
4. **Nada salvo no escuro:** importações (ex.: colar do Cifra Club) preenchem um
   **formulário editável** para revisão antes de salvar.
5. **Compartilhamento robusto:** `shareFile()` tenta o Web Share nativo e, em
   qualquer falha, cai no download. Mantenha esse fallback.
6. **Compatibilidade com o nome antigo:** `importJSON` aceita `levita-*` e
   `migrateLevita()` copia as chaves antigas do `localStorage`. Não remover.

### Horizonte — "arquivo único" é meio, não fim (decisão registrada, 2026-06)
> A regra nº1 (**arquivo único**) é uma **restrição da fase atual**, não um valor em si.
> Ela **será intencionalmente removida na migração para PWA** (que exige `manifest` +
> service worker + ícones como arquivos separados — ver `ROTEIRO`, Tema A). A partir daí,
> o critério **deixa de ser "minimizar a quantidade de arquivos"** e passa a ser
> **qualidade de software e organização do repositório**: separar por responsabilidade,
> nomes claros, sem arquivos órfãos, fácil de navegar.
>
> **O que NÃO muda** (são princípios do projeto, não consequência do "arquivo único"):
> **offline-first, JS vanilla, sem etapa de build, sem dependências em runtime e sem
> backend.** Multi-arquivo ≠ inchar: continua tudo estático e simples.
>
> **Enquanto o PWA não chega**, seguimos refinando em `louvai.html` único e a regra nº1
> vale normalmente. Quando o plano de PWA for aprovado, atualizar esta seção e a regra nº1.

## Ritual de CADA entrega (obrigatório, sem exceção)
> Vale para **toda** implementação, correção ou alteração entregue — recurso novo,
> bugfix, refactor, ajuste de doc. **Atualize TODOS os artefatos a cada entrega**:
> nenhum incremento é "pequeno demais" para pular o ritual. Os artefatos têm que
> ficar sempre coerentes entre si e com a versão atual.

1. **Implementar** a mudança em `louvai.html`.
2. **Testar de verdade** (ver "Como testar"). Não entregar sem validar. Quando a
   entrega for um **bugfix**, adicione um **teste de regressão** que falharia com o
   bug e passa com a correção (de preferência reproduzindo a condição real).
3. **Subir a versão** (Semver `vMAIOR.MENOR.CORREÇÃO`: CORREÇÃO = conserto,
   MENOR = recurso novo, MAIOR = mudança grande/incompatível) em **AMBOS**:
   - `APP_VERSION` (topo do `<script>` em `louvai.html`);
   - `version` do `package.json` (mantê-los **sempre iguais**).
4. **Atualizar todos os artefatos de histórico/documentação afetados:**
   - `CHANGELOG.md` — nova entrada da versão (o "porquê" do conserto, não só o quê).
   - `ROTEIRO-louvai.md` — linha do tempo (nova linha), "Atualizado até a vX.Y.Z",
     rodapé "Última atualização", e marcar/ajustar os itens do backlog (✅/checkbox)
     e a "ordem sugerida" quando algo for concluído.
   - `README.md` — referências de versão e a lista de recursos, se mudou.
   - `PLANO-*.md` relevante — status do plano/incremento quando a entrega o avança
     ou conclui (e registrar armadilhas aprendidas, p/ não repetir o erro).
5. **Commitar e taguear:** `git add -A && git commit -m "vX.Y.Z — descrição"` +
   `git tag vX.Y.Z` (commit de versão direto no branch de trabalho, como o histórico).
   **Nunca** inclua rodapé `Co-Authored-By` (nem outras assinaturas de ferramenta)
   na mensagem de commit — o histórico é em pt-BR e sem co-autoria de assistente.
6. **Sincronizar o `index.html`** (cópia que o **GitHub Pages serve na raiz**): é uma cópia
   **verbatim** do `louvai.html` — ao entregar uma versão, copie `louvai.html` por cima do
   `index.html` para o app hospedado refletir a versão nova. Fica **fora do git** (`.gitignore`),
   por isso não aparece no `git status` — fácil de esquecer; faz parte do ritual.
7. (Opcional) salvar uma cópia `louvai-vX.Y.Z.html` para distribuição. **Ao gerar
   uma nova cópia, apague as cópias `louvai-v*.html` antigas da pasta** — manter só
   **o original (`louvai.html`) e a cópia de distribuição mais recente**. As cópias
   ficam fora do git (ver `.gitignore`) e são regeneráveis via `git checkout vX.Y.Z`.

**Checklist rápido antes do commit:** APP_VERSION = package.json · CHANGELOG tem a
versão · ROTEIRO (linha do tempo + rodapé + backlog) coerente · README na versão ·
PLANO atualizado se aplicável · `npm test` verde · **`index.html` sincronizado**.

## Como testar
- **Automático (recomendado):**
  - `npm install`            (uma vez)
  - `npm run test:install`   (baixa o Chromium do Playwright, uma vez)
  - `npm test`               (roda `tests/smoke.mjs`)
  - O teste abre `louvai.html` num Chromium headless e valida transposição com
    **grafia fiel ao tom**, parser de acordes, importação por colagem, escalas e
    **modo Apresentar** (barra compacta, Tom no Ajustes, "livro" entre músicas),
    Modo Página, menu de estrutura, Wake Lock, **compartilhar/receber por link**
    (`#imp=`) e a compatibilidade com o nome antigo.
    Falhou = sai com código ≠ 0 e lista o que quebrou. (~201 verificações.)
- **Manual:** abra `louvai.html` no navegador (ou no celular) e percorra o fluxo.

---

## Mapa de arquivos
- `louvai.html` — o app inteiro (a única coisa que o usuário usa/distribui).
- `CHANGELOG.md` — histórico técnico por versão.
- `ROTEIRO-louvai.md` — visão geral do projeto + próximos passos.
- `README.md` — apresentação do projeto e lista de recursos (na versão atual).
- `tests/smoke.mjs` — suíte de validação (Playwright).
- `package.json` / `package-lock.json` — metadados e scripts de teste (nome/versão
  espelham o app; mantê-los coerentes no ritual).
- `PLANO-redesign-ui.md`, `PLANO-modos-leitura.md` — planos de execução já
  **concluídos** (registro histórico; status no topo de cada um).
- `PLANO-compartilhar-link.md` — plano de compartilhar por link auto-importável
  (serverless) + hospedar no GitHub Pages — **implementado na v0.21.0** (resta hospedar).
- `PLANO-diagramas-acorde.md` — diagramas de acorde (híbrido curado + motor de templates;
  violão 6 cordas; toque no acorde → popover) — **implementado na v0.25.0**.
- `PLANO-repertorio-link.md` — repertório + escalas num snapshot único (`louvai.json`)
  hospedado, com "Atualizar do link" (pull, mão única) — **implementado na v0.26.0**.
- `PLANO-publicar-nuvem.md` — "Publicar na nuvem" (escrever o `louvai.json` do celular via
  token fino do GitHub + API Contents) — **implementado na v0.27.0**.
- `PLANO-ui.md` — polimento de UI/ícones em **ondas**, **concluído (v0.28.0→v0.36.1)**: Onda 1
  (ganhos rápidos + ícone do Backup, v0.28.0); Onda 2 (ícones SVG inline via `ICONS`/`icon()`,
  v0.29.0); Onda 3 = M2 ⚙ seções (v0.30.0) · M4 linguagem de card (v0.31.0) · M5 `#reposheet`
  cartões (v0.32.0) · M3 arrastar p/ fechar (v0.33.0) · M7 entrada da lista (v0.34.0) · M8 progresso
  na Apresentação (v0.35.0) · M6 skeleton de carregamento (v0.36.0). Insumo: `ANALISE-ui.md`
  (G1–G12, M1–M8) e `ANALISE-icones.md` (conjunto SVG, `archive`).
- `index.html` — cópia **verbatim** do `louvai.html` que o **GitHub Pages serve na raiz** do site.
  Fora do git (regenerável); **sincronizar a cada entrega** (ver Ritual, passo 6).
- `.gitignore` — ignora `node_modules/`, o `index.html`, as cópias `louvai-v*.html` e o
  `COMMIT_MSG_tmp.txt`.
- `CLAUDE.md` — este guia.

## Anatomia do `louvai.html` (onde mexer)
- **Música/teoria:** `SHARP`/`FLAT`, `QUAL_RX`, `parseChord`, `transposeChord`,
  `transposeNote`, `isChord`, `isChordLine`, `isSectionLine`.
- **Ícones (v0.29.0):** **fonte única** `ICONS` (paths Lucide, MIT) + helper `icon(name[,cls])`
  → `<svg class="ic-svg" stroke="currentColor">` (herda o tema). `paintIcons()` (no boot) pinta os
  botões estáticos: `ICON_ONLY` (innerHTML = ícone) e `ICON_TX` (prefixa o ícone com `.ic-tx`,
  mantém o rótulo do HTML). Botões dinâmicos: tema (`sun`/`moon` em `applyTheme`), auto-scroll
  (`play`/`pause` em start/stopScroll), itens de sheet (campo `ic:` recebe `icon(...)`), `.move`/
  `.rm` e o ícone de música no editor de escala, e os estados vazios (`.eic`). **Para adicionar/
  trocar um ícone:** edite só o `ICONS` (ou o mapa em `paintIcons`) — não espalhe `<svg>` solto.
  **Exceções deliberadas que ficam TEXTO** (língua do músico): `♯`/`♭`, `A−`/`A＋`, `−`/`＋`, `＋`.
- **Polimento de UI Onda 3 (v0.30.0–v0.36.1):**
  - **⚙ Ajustes em seções (M2):** `#playersheet` agrupado por `.sheetsec` (Afinação/Leitura/Esta
    música); Editar/Enviar na `.ctrl.actions`. IDs dos controles preservados.
  - **Linguagem de card unificada (M4):** `.songcard` e `.escard` compartilham `.c-ttl`/`.c-sub`/
    `.c-meta`/`.pill` (título → subtítulo → faixa de pílulas). Tags = `.pill.tag`; recência =
    `playedPill` (`.pill.never`). Não recriar `.estag`/`.ttl`/`.sub`/`.tags` antigos.
  - **`#reposheet` em cartões (M5):** `.repo-card` "Baixar" + `<details class="repo-pub">` "Publicar"
    recolhido (abre sozinho se `settings.ghToken`). Handlers por ID — pode reestruturar à vontade.
  - **Arrastar p/ fechar (M3):** `enableSheetDrag` em todo `.sheet` no boot; pega só no `.grip`/`h3`,
    limiar `SHEET_CLOSE_DY` (90px), mapa `SHEET_BG` (sheet↔backdrop). Usa a transição do CSS
    (respeita reduced-motion). Ao adicionar um sheet novo, registre-o no `SHEET_BG`.
  - **Entrada da lista (M7):** `@keyframes cardIn` + `.card-in`; `staggerIn(box,key)` aplica o stagger
    **só na 1ª pintura** (flag `staggered`) — não re-anima na busca.
  - **Progresso na Apresentação (M8):** `.pb-progress`/`#pv-progress`; `updatePresentBar` seta a
    largura = (idx+1)/total.
  - **Skeleton de carregamento (M6):** `loadingSkeleton()` + `.skel`/`.skel-card`; só no `pullRepo`
    (rede), restaurado nos erros. O player abre síncrono — **não** insira skeleton lá (atrapalharia
    a medição do Modo Página).
- **Grafia ao transpor (v0.17.0):** a grafia vem do TOM, não de um botão. A
  transposição preserva o intervalo: `noteParts`, `transposeKeyName` (nome de tom
  legível), `spellCtx(tomOrigem, semis[, tomExplícito])` → `{letterStep, destFlat}`,
  e `transposeNote(note, semis, ctx)`. Sem transpor (`semis%12===0`) preserva o
  original (v0.16.0). Acorde emprestado (`Bb` no tom de Dó) continua certo.
- **Render:** `renderCifra(body, semis, showChords, ctx, hideTabs)` — `ctx` é o
  contexto de grafia (`spellCtx`); trata seção sozinha, `[Seção] + acordes` na mesma
  linha, linha de acordes, letra com `[C]` inline, e ocultação de tablatura.
- **Diagramas de acorde (v0.25.0):** reusa `parseChord`/`NOTE_IDX`. `chordIntervals(suffix)`
  (qualidade→intervalos; `7M`=sétima maior), `qualityFamily` (assinatura→família de template),
  `OPEN` (formas curadas), `TPL_E`/`TPL_A`+`placeTemplate` (pestanas móveis), `fingering(nome)`
  (curada → template → null/"sem diagrama"), `chordSvg` (grade 6×5 SVG tema-aware) e
  `showChordDiagram` (popover). Gatilho: `pointerup` no `#p-body` com `.chord` (toque parado,
  prioridade sobre virar-página). No player o acorde já é a **forma com capô** (`ctxShape`).
- **Corretor do editor:** `lintCifra` + `runLint`.
- **Importar texto colado:** `parseImport` e `isMeta` (regras de limpeza do
  Cifra Club: remove `Tom:`, `Capotraste`, `Cifra:`, `Favoritar`, URLs…).
- **Importar JSON (arquivo/link):** `importJSON` reconhece o tipo e **detecta título
  repetido** via `collidingTitles` (mesmo título, `id` diferente) **antes de mexer nos
  dados** → folha de escolha (`mine`/`both`/cancelar). `doImport(data,tp,incoming,policy)`
  aplica a política: `mergeSongs(arr,policy)` deduplica por `id`, e com `policy="mine"`
  pula o título repetido e devolve um **`remap`** (id que chegou → id local) que `doImport`
  usa pra **remapear `escala.items`** (a escala continua íntegra). Título inédito = sem
  folha, importa direto.
- **Compartilhar/receber por LINK (v0.21.0):** envelope JSON gzipado em base64url no
  **fragmento** `…/#imp=…` (sem servidor; decodifica no cliente). Empacotar:
  `bytesToB64url`/`b64urlToBytes`, `gzipBytes`/`gunzipBytes` (com fallback `r.` sem
  compressão), `packData`/`unpackData`, `buildImportLink`. Enviar: `shareLink(env,title,fileFn)`
  → `sendLink` (Web Share `{url}` → fallback clipboard). **Aviso de link longo (v0.21.1):**
  apps de mensagem cortam URL longa → `shareLink` avisa **antes** de enviar quando
  `url.length>LINK_MAX` (~4000) e oferece o `fileFn` (mandar o arquivo, sem corte). As 3
  folhas (`shareSheet`, `shareEscalaSheet`, Backup) passam `env` + `fileFn`.
  Receber: `describeImport` +
  `handleImportLink` (confirma via `openSheet` antes de `importJSON` — "nada salvo no
  escuro" —, limpa o hash com `clearImpHash`), chamado no **boot** e no `hashchange`.
- **Repertório na nuvem (v0.26.0):** snapshot único `louvai-full` = `{songs, escalas}`. Publicar:
  `fullEnvelope`/`exportFull` ("Exportar tudo"). Puxar: `pullRepo` (`settings.repoUrl`, `fetch`
  com fura-cache só em http(s), erros tratados) → `importJSON`, que agora trata `louvai-full` no
  pré-check e no `doImport` (mescla cifras via `mergeSongs` + cada escala via `mergeEscala`,
  extraído). Folha "Repertório na nuvem" (`openRepoSheet`, `#reposheet`).
- **Pull pelo commit atual (v0.39.0):** `getRepoText(url)` — se a URL é do GitHub, lê o `louvai.json`
  do **commit atual** pela **API Contents** (`api.github.com`, reusa `ghRepoFromUrl`/`ghGetCurrent`),
  evitando o atraso do rebuild/CDN do **GitHub Pages** (causa do "sincronizei e veio velho"). Fallback
  pro `fetch` do link em 403/erro/404/host não-GitHub. `doPublish` carimba `publishedAt`; o pull guarda
  `settings.repoCloudApp`/`repoCloudAt` e `repoStatus` mostra "nuvem vX · publicada há Y". ⚠️ **Teste:**
  stubs sem `.json()` forçam o fallback (e travam num 2º fetch no padrão de promessa pendente) → os
  testes de pull silencioso usam host **não-GitHub**; o caminho GitHub tem teste próprio (`commitPull`).
  **Decisão (2026-06):** o GitHub Pages deixou de ser essencial pro sync (a API faz tudo), mas **fica
  mantido** — é o fallback, a URL que o `ghRepoFromUrl` entende, e dá pra inspecionar no navegador.
  Para largar o Pages: estender `ghRepoFromUrl` p/ `github.com/owner/repo` + repo público + abrir mão
  do fallback. Detalhe em `PLANO-repertorio-link.md`.
- **Auto-sync ao abrir/voltar (v0.37.0–v0.38.0):** `settings.autoPull` (toggle `#auto-pull` no cartão
  *Baixar*, **off por padrão**). Boot chama `maybeAutoPull()` → `pullRepo({silent:true})`; o
  `visibilitychange` (voltar pro app) chama `maybeAutoPull({throttle:true})` com cooldown de 1 min
  (`AUTO_SYNC_COOLDOWN`/`lastAutoSync`) p/ não martelar a rede. O `silent` se propaga por
  `importJSON(text,{silent})` → `doImport(...,policy,{silent})`: sem skeleton, **pula a folha de
  conflito** (usa `"mine"` — não duplica, remapeia a escala), sem toast de erro offline; avisa só
  quando há novidade. **Idempotente**. `#imp=` em importação tem prioridade.
- **Publicar na nuvem (v0.27.0):** o líder **escreve** o `louvai.json` via **API Contents do
  GitHub**. `ghRepoFromUrl` deriva `owner/repo/path` da `settings.repoUrl`; `publishRepo` faz
  GET sha → PUT (snapshot em `bytesToB64` base64 padrão; 404 cria; 409 rebusca+retry); token
  fino em `settings.ghToken` (**só no aparelho**; "Remover token" / revogável no GitHub).
  `repoStatus` mostra baixou…/publicou… **Mão única** (equipe só pull). **Diff ao publicar
  (v0.27.1):** `ghGetCurrent` lê `{sha,data}` da nuvem; `diffRepo`/`diffLabel`/`diffNote` contam
  +/− cifras/escalas por `id` (com os **nomes**); `publishRepo` abre **confirmação** com o diff
  (rede de segurança contra publicar de aparelho desatualizado), `showPublishDetails` lista os
  títulos (+/−) e `doPublish` faz o PUT.
- **Player (barra de uma linha, v0.20.0):** `.controls` é uma linha só
  `← · #p-title · ☰ · ⚙` priorizando a cifra; **Tom, Editar (`#p-edit`),
  Compartilhar (`#p-share`), capo, fonte, só-letra, tabs e auto-scroll moram no
  ⚙ Ajustes** (`#playersheet`). Abaixo, `.songhead` é só a linha fininha (`#p-sub`:
  artista · Tom · capo). `openPlayer`, `drawPlayer` (calcula `ctxSound`/`ctxShape`),
  `offsetToKey`, navegação por estrutura (`#p-struct`) e Wake Lock
  (`lockScreen`/`unlockScreen`, religado no `visibilitychange`).
- **Escalas/Setlists:** bloco "ESCALAS / SETLISTS" — lista, detalhe (`openEscala`),
  editor (`openEscalaEditor`), seletor de música (`openPicker`) e modo Apresentar
  (`escalaCtx`, `presentGo`).
- **Ordenar a lista (v0.40.0):** `settings.sortMode` (`az`/`recent`/`played`); botão `#sortBtn` no
  `.libhead` abre `openSortSheet` (folha "Ordenar por", 3 modos, atual com ✓). O sort vive no
  `renderLibrary` (usa `buildLastPlayed`): `recent` = data desc (nunca tocada por último), `played` =
  asc (nunca tocada no topo), `az` = título. Rótulos em `SORT_LABEL`. Persiste.
- **"Última vez que tocamos" (v0.24.0):** recência derivada **só de escalas confirmadas**
  (`e.done`, botão `#es-done` "Culto realizado" — a escala é plano, ajustes no ensaio).
  `buildLastPlayed()` → mapa `songId→data` das escalas `done` com data; `fmtPlayed`/`playedLine`
  renderizam "tocada há…"/"nunca tocada" (só com alguma escala `done`, p/ não poluir) no
  card (`renderLibrary`) e no seletor (`renderPicker`). Sem dado novo além de `e.done`.
- **Apresentação compacta (v0.18.0/0.18.1):** classe `.present` em `#view-player`
  (ligada por `updatePresentBar` quando há `escalaCtx`) esconde a `.controls` grande
  e usa o `#presentbar` como barra fina de **uma linha** (`.pb-nav`: ← ‹ título·2/5 › ⚙).
  A `.songhead` (linha fininha `#p-sub`: artista · Tom · capo) **fica visível** também
  na Apresentação (v0.20.1), como no player normal.
  O **Tom mora no ⚙ Ajustes** (`#s-tdown`/`#s-tkey`/`#s-tup`), não na barra. Botões
  `pv-*`/`s-t*` reusam `transposeBy`/`exitPlayer`/`openPlayerSheet` — não duplicar lógica.
  **"Livro" (v0.19.0):** no modo Página, `goPage` nos extremos chama `presentGo(±1)`
  (virar a última página → próxima música; voltar da 1ª → anterior na última página,
  via `openPlayer(...,atLast)`). As setas ‹ › de música seguem indo pro início.
- **Armazenamento:** chaves `LS_SONGS`, `LS_ESC`, `LS_SET` (`louvai.*.v1`);
  funções `load`, `migrateLevita`, `saveSongs`, `saveEscalas`, `saveSettings`.
- **Rede de segurança do backup (v0.23.0):** `settings.lastBackup` (data) +
  `settings.dirtySinceBackup` (marcado em `saveSongs`/`saveEscalas` via `markDirty`,
  limpo em `recordBackup` ao exportar — só o **arquivo** conta). `backupDue()` (nunca-backup
  com `hasRealContent`, ou dirty há ≥7 dias) liga o pontinho `.due` no `#backupBtn`
  (`updateBackupBadge`) e um toast leve no boot. O sheet de Backup mostra `backupNote()`
  (via 3º arg de `openSheet`, `#sheet-note`) e tem "Restaurar de um arquivo" (reusa `importJSON`).

## Convenções
- **Idioma de tudo** (UI, comentários, mensagens de commit, CHANGELOG): pt-BR.
- Siga o estilo já existente (nomes curtos, `$()` como seletor, sem libs).
- Comentário explica o **porquê**, não o óbvio.
- Acessibilidade de toque: alvos grandes; o app é usado no palco, com pouca luz.

## Próximos passos
Já entregues: redesign visual (v0.10.0–v0.13.x), grafia dos acordes (v0.16.0–v0.17.0),
modos de leitura (v0.14.0–v0.15.x), Apresentação enxuta + "livro" (v0.18.0–v0.19.0),
**compartilhar por link** (v0.21.0), aviso de duplicado + **backup com rede de segurança**
(v0.22.0–v0.23.0), **"última vez que tocamos"** (v0.24.0), **diagramas de acorde** (v0.25.0), **repertório +
escalas por link** (pull — v0.26.0), **publicar na nuvem** (token do GitHub — v0.27.0–v0.27.3,
com diff/detalhes) e **polimento de UI completo em ondas** (v0.28.0–v0.36.1: Onda 1 tokens/Tom/
toast/vazios; Onda 2 **ícones SVG inline unificados**; Onda 3 ⚙ seções/linguagem de card/`#reposheet`
em cartões/arrastar p/ fechar/entrada da lista/progresso na Apresentação/skeleton) e **sincronizar
ao abrir/voltar** (auto-sync habilitável do repertório+escalas, v0.37.0–v0.38.0) com **pull pelo
commit atual** (API Contents, sem atraso do Pages, v0.39.0). Ver os `PLANO-*.md`.
Ver `ROTEIRO-louvai.md` (seções 4 e 5). **Próximo passo imediato:**
1. **Validação visual no celular** (dark/light) das Ondas 1–3 — Tom destacado, toast colorido,
   estados vazios, acorde no claro, o conjunto de ícones SVG, as seções do ⚙, os cards unificados,
   arrastar-pra-fechar e o progresso da Apresentação só se confirmam na tela do palco.
2. ✅ **Ordenar a lista** (alfabética/recência/menos tocadas — v0.40.0); falta o **QR Code**.
3. **PWA instalável** — fecha o offline do app hospedado e **encerra a regra "arquivo único"**
   (ver seção "Horizonte"). Acessibilidade contínua que sobrou da análise: `:focus-visible` em
   botões/cards, subir `--muted` no dark, alvo da `.chip` da tagbar ≥44–48px.
