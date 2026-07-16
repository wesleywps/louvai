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

> **Distribuição é pelo GitHub Pages** (não há mais cópia `louvai-vX.Y.Z.html`): a equipe abre/atualiza
> o app pelo endereço hospedado, e o `index.html` (passo 6) é o que carrega a versão nova. A versão de
> qualquer ponto continua recuperável por `git checkout vX.Y.Z` se um dia for preciso um snapshot avulso.

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
    (`#imp=`), **contagem ao sincronizar**, **detecção/validação de tom** e a
    compatibilidade com o nome antigo.
    Falhou = sai com código ≠ 0 e lista o que quebrou. (~329 verificações.)
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
- `docs/` — **toda a documentação de projeto** (não é carregada pelo app; mover/renomear não afeta o
  deploy). Organizada em `docs/planos/` (planos de execução), `docs/analises/` (insumos de UI) e
  `docs/mockups/` (mockups de decisão); `docs/PROMPT-icone.md` fica na raiz de `docs/`. **Em prosa, os
  docs são citados pelo nome** (`PLANO-ui.md`); o caminho canônico está aqui neste mapa.
- `docs/planos/PLANO-redesign-ui.md`, `docs/planos/PLANO-modos-leitura.md` — planos de execução já
  **concluídos** (registro histórico; status no topo de cada um).
- `docs/planos/PLANO-compartilhar-link.md` — plano de compartilhar por link auto-importável
  (serverless) + hospedar no GitHub Pages — **implementado na v0.21.0**.
- `docs/planos/PLANO-diagramas-acorde.md` — diagramas de acorde (híbrido curado + motor de templates;
  violão 6 cordas; toque no acorde → popover) — **implementado na v0.25.0**.
- `docs/planos/PLANO-repertorio-link.md` — repertório + escalas num snapshot único (`louvai.json`)
  hospedado, com "Atualizar do link" (pull, mão única) — **implementado na v0.26.0**.
- `docs/planos/PLANO-validacao-tom.md` — conferir o tom pelos acordes (detecção diatônica ponderada;
  teoria musical + calibragem dos pesos) — **implementado na v0.42.0**.
- `docs/planos/PLANO-publicar-nuvem.md` — "Publicar na nuvem" (escrever o `louvai.json` do celular via
  token fino do GitHub + API Contents) — **implementado na v0.27.0**.
- `docs/planos/PLANO-incrementos-ao-vivo.md` — bundle de 3 melhorias de uso ao vivo (dar o tom /
  escala como texto / duplicar) — **implementado na v0.49.0**.
- `docs/planos/PLANO-escala-texto.md` — escala como texto p/ WhatsApp **com a equipe escalada** (agrupada
  por função) + cabeçalho/momento/observações — **implementado na v0.51.0** (evolui o texto da v0.49.0).
- `docs/planos/PLANO-salvar-edicao-e-fonte.md` — salvar edição com escolha (sobrescrever/nova) + salvar o
  **tom transposto** no player + **acordes ~20% maiores** — **implementado (Inc.1 v0.52.0, Inc.2 v0.53.0)**,
  validado adversarialmente (3 lentes). Follow-up: salvar o tom **na escala** (`it.key`).
- `docs/planos/PLANO-ui.md` — polimento de UI/ícones em **ondas**, **concluído (v0.28.0→v0.36.1)**: Onda 1
  (ganhos rápidos + ícone do Backup, v0.28.0); Onda 2 (ícones SVG inline via `ICONS`/`icon()`,
  v0.29.0); Onda 3 = M2 ⚙ seções (v0.30.0) · M4 linguagem de card (v0.31.0) · M5 `#reposheet`
  cartões (v0.32.0) · M3 arrastar p/ fechar (v0.33.0) · M7 entrada da lista (v0.34.0) · M8 progresso
  na Apresentação (v0.35.0) · M6 skeleton de carregamento (v0.36.0). Insumo: `docs/analises/ANALISE-ui.md`
  (G1–G12, M1–M8) e `docs/analises/ANALISE-icones.md` (conjunto SVG, `archive`).
- `docs/planos/PLANO-pwa.md` — plano do **PWA instalável + offline 100%** (encerra a regra "arquivo único" — ver
  "Horizonte"). Ícone + `manifest.webmanifest` mínimo já saíram (v0.46.0); falta o **service worker**
  (Inc.1). **Status: 🟡 em andamento.**
- `docs/PROMPT-icone.md` — prompt p/ o Claude design **gerar o ícone do app** + passos pós-geração.
- `docs/mockups/` — **registros de decisões de UI** (mockups HTML versionados, abre no navegador).
  Ex.: `barra-tela-cheia-v0.48.1.html` (decisão da barra fina do modo tela cheia). Artefatos de
  histórico, não fazem parte do app.
- `index.html` — cópia **verbatim** do `louvai.html` que o **GitHub Pages serve na raiz** do site.
  Fora do git (regenerável); **sincronizar a cada entrega** (ver Ritual, passo 6).
- `manifest.webmanifest` — manifest mínimo do app (nome/cores/ícones) p/ instalar com ícone na tela
  inicial (Android); referenciado no `<head>` do `louvai.html` (v0.46.0). **Sem service worker ainda.**
- `louvai-icons/` — ícones do app (favicon/apple-touch/PWA): SVGs-fonte + PNGs (`icon-192/512`,
  `icon-maskable-192/512`, `apple-touch-180`). Os PNGs são **assets deployáveis** (destravados no `.gitignore`).
- `.gitignore` — ignora `node_modules/`, o `index.html`, o `COMMIT_MSG_tmp.txt` e `*.png`
  **exceto** `louvai-icons/*.png` (assets do ícone).
- `CLAUDE.md` — este guia.

## Anatomia do `louvai.html` (onde mexer)
- **Música/teoria:** `SHARP`/`FLAT`, `QUAL_RX`, `parseChord`, `transposeChord`,
  `transposeNote`, `isChord`, `isChordLine`, `isSectionLine`.
- **Detecção de tom (v0.42.0, calibrada na v0.42.1):** `detectKey(chords)` (contagem diatônica
  ponderada nas 24 tonalidades; tabelas `DIA_MAJ`/`DIA_MIN`=natural∪harmônica; pesos `KW_*`/`KB_*`
  ajustáveis + penalidade `KW_OFF` p/ acorde fora do tom — evita alarme falso em cifra terminando
  no IV/V; bônus de cadência decide relativas), `compareKey(informado,det)` (`ok|relative|mismatch|lowconf`
  — relativa e baixa confiança não alarmam), `songChords(body)`, `triadOf`/`isDomChord` (reusam
  `chordIntervals`). UI: toggle `#checkkey-toggle` (`settings.checkKey`, off) no ⚙ Afinação +
  aviso `#keycheck` pintado em `updateKeyCheck()` (no fim do `drawPlayer`). Reusa `parseChord`
  (regra nº3). Teoria + calibragem em `PLANO-validacao-tom.md`.
- **Rótulos de seção "pelados" na importação (v0.40.1):** `SECTION_WORDS_RE` (whitelist pt-BR,
  perto de `isSectionLine`) — usada **só** no cabeçalho do `parseImport` p/ um rótulo sem `[ ]`/`:`
  (`Intro`, `Verso 1`…) não virar artista; `isSectionLine`/exibição ficam **intactas**.
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
  - **Linguagem de card (M4 + compactação v0.43.0/0.43.1):** ambos usam `.c-ttl`/`.c-sub`. O **card de
    música** (`.songcard`) é **compacto** em 2 linhas: **tom no tile `.keytag` à ESQUERDA** (38px desde a
    v0.43.1, era 46) + `.meta` (título / `.c-sub` cinza com **artista · recência · tags**; a recência é
    `<span class="played">`/`.never`, da v0.24.0, agora inline). HTML pelo helper único
    **`songCardInner`/`songSub`** (usado na lista inicial **e** no seletor da escala). **Saíram:** o
    `playedPill`/faixa `.c-meta` empilhada no card de música (e o chip `.keypill` à direita que a v0.43.0
    chegou a usar). O **`.escard`** mantém `.c-ttl`/`.c-sub`/`.c-meta .pill` (contagem/duração/equipe).
    Não recriar `.estag`/`.ttl`/`.sub`/`.tags` antigos.
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
  Cifra Club: remove `Tom:`, `Capotraste`, `Cifra:`, `Favoritar`, URLs…). O cabeçalho para também
  num rótulo de seção pelado via `SECTION_WORDS_RE` (v0.40.1) e, sem `Tom:`, o palpite de tom usa
  `detectKey` (v0.42.0, fallback pro 1º acorde).
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
- **repoUrl padrão derivado do endereço (v0.45.0):** `deriveRepoUrl(href)` (pura) = `new URL("louvai.json",
  href)` se http(s), senão `""` (ignora `?query`/`#hash`; `file://` → `""`); `defaultRepoUrl()` =
  `deriveRepoUrl(location.href)`; `effectiveRepoUrl()` = `settings.repoUrl` colado (prioridade) **ou** o
  padrão derivado. `pullRepo`/`maybeAutoPull`/`publishRepo` usam `effectiveRepoUrl()` — o membro abre o app
  hospedado e puxa/sincroniza **sem colar link** (funciona em qualquer fork, sem URL cravada). `openRepoSheet`
  pré-preenche `#repo-url` com o padrão (transparência); `repoUrlFromField()` trata **campo == padrão como
  "sem override"** → `settings.repoUrl` fica `""` e a derivação não congela (fork-safe). **Auto-sync segue
  opt-in.** Reusa `ghRepoFromUrl` (o padrão derivado serve pro publish). Ver memória `default-repo-url`.
- **Tela cheia da Apresentação (v0.44.0; barra fina v0.48.1):** classe `.immersive` em `#view-player`;
  na v0.44.0 escondia tudo, agora mostra a barra **ULTRA-FINA** (Título · Tom · posição), **sem botões**.
  `setImmersive`/`toggleImmersive`/`applyFullBtn`; botão flutuante `#pv-exitfull` p/ sair (+ Fullscreen API
  best-effort). `curSounding` guarda o Tom soante; `refreshPresentPos()` monta `#pv-pos` = "X de Y" (normal)
  ou "Tom X · n/total" (tela cheia). CSS em `#view-player.immersive …`.
- **Ícone do app (v0.46.0/0.46.1):** no `<head>`, `<link rel=icon/apple-touch-icon/manifest>` apontam p/
  `louvai-icons/` e `manifest.webmanifest` (favicon na aba + tela inicial iOS/Android; **sem service worker**
  — só identidade). No cabeçalho da biblioteca, `.brandlogo` é o **SVG do logo inline** em `.brand` (não
  depende de arquivo externo).
- **Versão guia por música (v0.47.0):** `song.ref` (link do YouTube) **saneado por `safeUrl()`** (só
  http/https — fecha XSS por href). Editor: `#e-ref`. Player: linha `#p-guide-row` + botão `#p-guide` no ⚙
  "Esta música" (abre em nova aba só com link válido). **Sincroniza** (mora na música).
- **Observações da música (v0.48.0):** `song.notes` (texto livre, **compartilhado** — viaja na nuvem/escala).
  Editor: `#e-notes`. Player: `#p-notes`/`.songnote` (linha abaixo do título, **visível na Apresentação**);
  render via `textContent` (à prova de XSS). **Sincroniza** (mora na música).
- **Tamanho da fonte + pinça (v0.50.0):** `fontSize` (global, clamp `FONT_MIN/FONT_MAX` = 10–28) agora
  **persiste** em `settings.fontSize` (lido no `load`). Fonte única do ajuste: `clampFont`, `pinchFontSize(start,
  razão)` (→ passo inteiro) e `setFontSize(n)` (clampa→salva→`drawPlayer`); botões `#f-up`/`#f-down` e a pinça
  passam por aí. **Pinça** no `#p-body`: `pgPtrs` (Map de ponteiros) + `pinching`/`pinchWasActive` no
  `pointerdown/move/up/cancel` — 2 dedos mudam a fonte; 1 dedo (rolagem/virar-página/diagrama) intacto;
  `pinchWasActive` suprime virar-página/diagrama ao soltar a pinça. CSS `touch-action:pan-x pan-y` na `.cifra`
  desliga o pinch-zoom **nativo** só na cifra; iOS Safari ganha `preventDefault` em `gesturestart/change/end`
  (não disparam em Android/desktop). No Modo Página re-pagina por passo de px (mesmo caminho dos botões).
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
  **Abre no capo salvo (v0.51.3):** fora da Escala, `openPlayer` inicializa `capo = current.capo||0`
  (antes era `0` fixo — o capotraste só aparecia na edição). Aplica às formas (`shapeShift`) e exibe
  "Capo N (forma em …)" no `#p-sub`. **Na Escala o capo continua vindo do item** (`it.capo`).
- **Salvar edição com escolha + salvar o tom (v0.53.0):** `songChanged(stored,data)` (comparação
  **simétrica** dos 8 campos — `safeUrl`/`trim`/`tags` nos dois lados) e `cloneSong(src,over)` (fonte
  única de clone; `dupSong` passou a usá-la — não esquece `ref`/`notes`). No **editor** (`#e-save`),
  música existente com mudança → folha `openSheet` **Sobrescrever / Salvar como nova** (título ganha
  "(Tom X)" se o tom mudou, senão "(cópia)"). No **player**, `#p-savekey`/`#p-savekey-row` (⚙ "Esta
  música") aparece via `drawPlayer` quando `!escalaCtx && (transp%12!==0 || capo!==(current.capo||0))`
  — **`!==current.capo`, não `!==0`** (senão volta o bug do capo da v0.51.3). Assa por `transp` (mantém
  pitch/capo; `body` = acordes no tom soante) via **`transposeBody(body,semis,ctx)`** — gêmea do
  `renderCifra` (mesmos ramos e o **MESMO regex** `/(\S+)/g` p/ preservar espaços; reusa `isChord`/
  `transposeChord`, regra nº3). ⚠️ **"Sem salto visual" só com capo 0**; com capô a grafia enarmônica
  pode ser reescolhida (mesmo som — `Bb`↔`A#`). *Sobrescrever* muda o tom em escalas que herdam o tom;
  por isso o botão **some na Apresentação** (o tom por-culto é do `it.key` — *salvar na escala* é
  follow-up). **Acordes ~20% maiores (v0.52.0):** `.cifra .chord` ganhou `display:inline-block;
  transform:scale(var(--chord-scale,1.2));transform-origin:left bottom` — puramente visual (colunas e
  paginação intactas, provado empiricamente); `--chord-scale` ajusta a proporção.
- **Escalas/Setlists:** bloco "ESCALAS / SETLISTS" — lista, detalhe (`openEscala`),
  editor (`openEscalaEditor`), seletor de música (`openPicker`) e modo Apresentar
  (`escalaCtx`, `presentGo`). Equipe = `e.team` (lista de `{role,name}`, funções em `FUNCOES`).
- **Escala como texto p/ WhatsApp (v0.49.0; ampliado v0.51.0):** `escalaToText(id)` monta a
  mensagem do culto (item "Copiar como texto" do `shareEscalaSheet`, via `shareText`). Seções:
  cabeçalho `🎵 *título*` + `📅 data·hora·tipo` (`fmtDate`) → `👥 *Equipe*` agrupada por função
  (`teamByRole(team)` agrupa e ordena por `FUNCOES`, ignora sem nome) → `🎶 *Músicas*` numeradas
  (Tom `it.key||s.key` + `· _momento_`; detalhes ▶️ `safeUrl(s.ref)` / 📝 `it.note` / 💬 `s.notes`)
  → `📌 _e.notes_`. **Emoji só nos títulos** (sem emoji por função — colidiria 🎸); **toda
  seção/linha some quando vazia**; texto puro (sem DOM, sem XSS). Não usa campo/storage novo.
  Detalhe em `PLANO-escala-texto.md`.
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
commit atual** (API Contents, sem atraso do Pages, v0.39.0), **ordenar a lista** (v0.40.0),
**fix do "Intro" virando artista na importação** (v0.40.1), **contagem ao sincronizar**
(músicas/escalas no download e upload, v0.41.0), **conferir o tom pelos acordes** (opcional,
v0.42.0, calibrado/endurecido na v0.42.1–0.42.2), **lista de músicas compacta** (card em 2 linhas,
tom em tile menor à esquerda, v0.43.0–0.43.1), **acessibilidade** (foco por teclado, alvo de toque
da tag ≥44px, contraste no escuro, v0.43.2), **tela cheia na Apresentação** (v0.44.0) e **repositório já
configurado por padrão** (repoUrl derivado do endereço — membro puxa sem colar link, v0.45.0),
**ícone do app** (favicon/apple-touch/manifest + logo inline no cabeçalho, v0.46.0–0.46.1), **link da versão
guia** por música (v0.47.0), **observações da música** (v0.48.0), **barra fina no modo tela cheia** (v0.48.1),
**3 melhorias de uso ao vivo** (dar o tom / escala como texto / duplicar, v0.49.0), **pinça ajusta a fonte**
da cifra com tamanho persistido (v0.50.0) e **escala como texto p/ WhatsApp com a equipe escalada**
(agrupada por função + cabeçalho/momento/observações, v0.51.0).
**Correções de campo (v0.51.1–v0.51.3, primeiro feedback do ministério):** o ⚙ Ajustes ganhou teto
de altura + rolagem e não cobre mais a tela (v0.51.1); Editar/Enviar **recolhem** o painel antes de
abrir, sem sobrepor a cifra/o compartilhar (v0.51.2); e a cifra **abre no capotraste salvo** — o capo
aparece na exibição, não só na edição (v0.51.3). Depois: **acordes ~20% maiores** que a letra (escala
visual, sem desalinhar, v0.52.0) e **salvar edição com escolha** — sobrescrever/salvar como nova no
editor **e** salvar o tom transposto no player (`transposeBody`, v0.53.0). *Follow-up de campo aberto:*
salvar o tom **na escala** (`it.key`), o gesto do ensaio.
Ver os `PLANO-*.md`.
Ver `ROTEIRO-louvai.md` (seções 4 e 5). **Próximo passo imediato:**
1. ✅ **Validação visual no celular** (dark/light) — **concluída (2026-06-26)**; o app está **em teste de
   uso pelo ministério** (v0.49.0+). Feedback de campo pode pautar ajustes.
2. ✅ **Ordenar a lista** (alfabética/recência/menos tocadas — v0.40.0). **QR Code despriorizado**
   (decisão 2026-06-19): com o app hospedado + nuvem, rende pouco **online** (e o QR de link exige
   internet pra abrir o app); o valor real é **offline + broadcast** e **só** pra a **estrutura da
   escala** (ordem/tom/momentos — cifras inteiras não cabem no QR ~2–3 KB), pra quem já tem o
   repertório. Pro "abrir sem internet", o lever certo é o **PWA** (item 3), não o QR.
3. ✅ **Repositório já configurado por padrão** (combinado 2026-06-19, **entregue na v0.45.0**) — o
   `repoUrl` é derivado do próprio endereço (`new URL("louvai.json", location.href)`) quando não há link
   colado: o membro abre o app hospedado e já puxa/sincroniza **sem colar nada** (link explícito tem
   prioridade; auto-sync opt-in). `deriveRepoUrl`/`defaultRepoUrl`/`effectiveRepoUrl`/`repoUrlFromField`.
4. **PWA instalável** — fecha o offline do app hospedado e **encerra a regra "arquivo único"**
   (ver seção "Horizonte"). *(A acessibilidade contínua da análise — `:focus-visible`, `--muted` no
   dark, alvo da `.chip` ≥44px — foi **entregue na v0.43.2**.)*
