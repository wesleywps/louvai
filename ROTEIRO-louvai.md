# 🎸 Louvai — Roteiro do Projeto

App de cifras **offline-first** para ministério de música de igreja. Documento de
acompanhamento: liga o que já foi construído (ver `CHANGELOG.md`) ao que vem a
seguir. Atualizado até a **v0.38.0**.

> **Nome:** o projeto nasceu como **Levita** e foi renomeado para **Louvai** na
> v0.9.0 — "louvai" é convite a todos adorarem, sem remeter a uma classe
> separada de músicos. A compatibilidade com arquivos e dados antigos foi
> preservada.

> **Onde salvar:** mantenha esta pasta com o `CHANGELOG.md`, o
> `louvai-vX.Y.Z.html` mais recente e o zip do projeto (com o histórico git).

---

## 1. O que é e como foi pensado

Louvai é um **arquivo único HTML** que roda no navegador do celular/tablet,
guarda tudo no próprio aparelho e compartilha por arquivo. Zero servidor, zero
instalação complexa.

**Decisões de base (definições do projeto):**
- **Plataforma da v1:** celular/tablet, offline-first.
- **Compartilhamento:** por arquivo `.json` (cifra, repertório ou escala). A
  sincronização online fica para a "fase online".
- **Versionamento:** **semântico** (`vMAIOR.MENOR.CORREÇÃO`). CORREÇÃO = conserto,
  MENOR = recurso novo, MAIOR = mudança grande. A versão aparece dentro do app.
- **Qualidade:** cada incremento é validado em **navegador real** (Chromium via
  Playwright), com testes automatizados antes de entregar.

**Decisões de engenharia que valem lembrar:**
- **Fonte da verdade de acordes** (`parseChord`): uma única função define o que é
  um acorde válido, usada em exibição, transposição e validação.
- **Gramática generosa, não rígida:** na dúvida, tratar algo estranho como acorde
  (ele ainda renderiza/transpõe) em vez de jogá-lo para a letra silenciosamente.
- **Nada é salvo no escuro:** o importador de texto preenche um formulário
  editável para revisão antes de salvar.
- **Dados locais = responsabilidade de backup do usuário:** por isso existe o
  Backup; o histórico de verdade são os arquivos baixados (e o zip com git).
- **Compatibilidade com o nome antigo:** importação aceita `levita-*` e o boot
  migra as chaves antigas do `localStorage` (`migrateLevita`).

---

## 2. Linha do tempo (ligada ao CHANGELOG)

| Versão | Tipo | Entrega |
|---|---|---|
| **v0.1.0** | marco | Biblioteca + busca/tags; player com acordes sobre letra, transposição, capo, fonte, modo escuro/claro, "só letra", auto-scroll; editor (criar/editar/excluir); compartilhar por arquivo (cifra e repertório). |
| **v0.2.0** | correção | Bug crítico: camada invisível engolia todos os toques. Storage blindado. |
| **v0.3.0** | recurso | Fonte da verdade de acordes (`parseChord`) + corretor não-bloqueante no editor. |
| **v0.4.0** | recurso | **Escalas/Setlists:** ordem do culto (músicas + itens), tom/capo por escala, momento, duração e tempo total, equipe por função, modo Apresentar, compartilhar escala com as cifras juntas. |
| **v0.4.1** | correção | Compartilhamento à prova de falhas (sempre cai no download se o nativo falhar). |
| **v0.5.0** | recurso | Importar **colando texto** (Cifra Club): reconhece título, artista, tom e capotraste. |
| **v0.5.1** | correção | Colar: trata `[Seção] + acordes` na mesma linha (corrige `[Intro]` virando título). |
| **v0.6.0** | recurso+correção | Botão **ocultar tablaturas**; parser ignora linha `Cifra: … Favoritar` do Cifra Club. |
| **v0.7.0** | recurso | **Navegação por estrutura da música:** menu ☰ com as seções e rolagem até a seção escolhida. |
| **v0.7.1** | correção | Menu de estrutura com rolagem (músicas longas) e ignorando cabeçalhos `[Tab]`. |
| **v0.8.0** | recurso | **Wake Lock:** tela acesa enquanto o player está aberto; religa ao voltar pro app. |
| **v0.9.0** | mudança | **Renomeado para Louvai** (era Levita), com migração de dados e importação retrocompatível. |
| **v0.10.0** | recurso | **Redesign F1:** paleta near-black + acento violeta, Inter na UI, Fraunces só no logo, alvos ≥48px. |
| **v0.11.0** | recurso | **Redesign F2:** bottom nav fixa (Cifras\|Escalas), FAB "+" único contextual, Backup na topbar. |
| **v0.12.0** | recurso | **Redesign F3:** barra do player enxuta (só Tom + auto-scroll) e sheet "⚙ Ajustes". |
| **v0.13.0** | recurso | **Redesign F4:** foco violeta nos formulários, vidro fosco em sheets/toast, fade entre telas. |
| **v0.13.1** | correção | **Contraste da cifra no dark:** acorde com chip + halo, letra um tom abaixo do branco — leitura clara no palco. |
| **v0.13.2** | correção | **Robustez, segurança e acessibilidade:** `esc()` escapa aspas (fecha XSS por `.json` importado) e tolera não-string; re-importar escala atualiza em vez de duplicar; lint poupa palavras da letra; exemplo não ressuscita; `aria-label`/`aria-pressed`, "Reduzir movimento" e alvos de toque maiores. |
| **v0.14.0** | recurso | **Auto-scroll opcional** (modos de leitura, parte 1): a barra de auto-scroll fica oculta por padrão e liga num interruptor do ⚙ Ajustes; mais tela pra cifra. |
| **v0.15.0** | recurso | **Modo Página** (modos de leitura, parte 2): cifra em páginas horizontais (deslizar ou tocar nas laterais), fatiamento medido no DOM com unidades atômicas (acorde nunca se separa da letra). |
| **v0.15.1** | correção | **Modo Página no celular:** corrige paginação fragmentada (1 linha por página / centenas de páginas) — bug de sub-pixel na medição de overflow. Pego na validação em dispositivo. |
| **v0.16.0** | recurso | **Preservar a grafia original** dos acordes: `Bb` continua `Bb` (não vira `A#`) enquanto não há transposição; a preferência ♯/♭ só re-soletra ao transpor de verdade. Vale para cifra, cabeçalho "Tom:" e forma do capo. |
| **v0.17.0** | recurso | **Grafia fiel ao tom ao transpor:** a grafia vem do tom (não de um botão), via transposição que **preserva o intervalo** — `Bb` sobe pra `C`, vai pra `Eb` no tom de Fá, **nunca `A#`**, até em acordes emprestados. Tom de destino com nome legível; escala pode fixar a grafia. Botão ♯/♭ **removido** — só sobe/abaixa o tom. |
| **v0.18.0** | recurso | **Barra compacta no Modo Apresentação:** só na Apresentação, controles + título grande dão lugar a uma barra fina (← ‹ título·2/5 › ⚙) — mais cifra no palco. Player de cifra avulsa não muda. |
| **v0.18.1** | correção | **Apresentação enxuta de verdade:** o Tom saiu da barra e foi pro ⚙ Ajustes — barra de uma linha só, topo cai de ~100px para ~66px. |
| **v0.19.0** | recurso | **"Livro" na Apresentação:** no modo Página, virar a última página passa pra próxima música; voltar da 1ª página retoma a última página da anterior. As setas ‹ › de música seguem iguais. |
| **v0.20.0** | recurso | **Player normal em uma linha:** a tela de visualizar cifra vira `← · Título · ☰ · ⚙` (Tom, Editar e Compartilhar no ⚙ Ajustes; linha fininha com artista · Tom · capo). Mais cifra, menos cromo. |
| **v0.20.1** | correção | **Tom no topo da Apresentação:** mostra a mesma linha fininha (artista · Tom · capo) da visualização normal, em vez de esconder. |
| **v0.21.0** | recurso | **Compartilhar por link auto-importável (sem servidor):** envia escala/cifra/repertório num link `…/#imp=…` (envelope JSON gzipado em base64url no fragmento; decodifica 100% no aparelho). Quem recebe só toca — abre com confirmação antes de salvar. Código hosting-ready (GitHub Pages). |
| **v0.21.1** | correção | **Aviso de link longo:** apps de mensagem (WhatsApp) cortam URLs longas → "Link inválido" no destino. O aviso agora aparece **antes** de compartilhar (não só no clipboard) e com limite realista (~4 KB), oferecendo **mandar o arquivo** (sem o corte). Descoberto em campo com o repertório inteiro. |
| **v0.22.0** | recurso | **Aviso de título repetido ao importar:** quando a mesma música nasce em aparelhos diferentes (id distinto), importar avisa antes de mesclar — manter as minhas (sem duplicar, remapeando a escala) / importar como cópias / cancelar. Título inédito entra direto. |
| **v0.23.0** | recurso | **Backup com rede de segurança:** registra a data do último backup, marca "há mudanças desde então", cutuca quando está atrasado (pontinho no ↥ + toast leve ao abrir) e deixa o "restaurar de arquivo" claro. Tudo local (nuvem é fase online). |
| **v0.24.0** | recurso | **"Última vez que tocamos":** cada cifra mostra a recência (tocada há X / nunca tocada), na lista e no seletor de escala. Derivado só de escalas marcadas **"Culto realizado"** — porque a escala é plano, e o que rola se confirma no culto (não infla a recência). |
| **v0.25.0** | recurso | **Diagramas de acorde:** tocar num acorde no player abre a pegada no violão (popover SVG). Híbrido — formas abertas curadas + motor de pestanas móveis (E/A-shape) pros 12 tons; "sem diagrama" honesto pro resto. Capo-aware (mostra a forma). Validado por notas no CI. |
| **v0.26.0** | recurso | **Repertório + escalas por link (pull):** o líder publica um snapshot único `louvai.json` (cifras + escalas) no GitHub Pages; a equipe puxa com "Atualizar do link" e mescla (dedup por id/updatedAt). Mão única, sem backend. Complementa o link de WhatsApp da v0.21.0. |
| **v0.27.0** | recurso | **Publicar na nuvem:** o líder edita no celular e escreve o `louvai.json` direto, via API do GitHub (token fino, só no aparelho). 1ª publicação cria o arquivo; conflito (sha) tratado. Fecha o ciclo editar→Publicar / equipe→Atualizar, sem backend nosso. |
| **v0.27.1** | recurso | **Diff ao publicar:** antes de escrever, mostra **+/− cifras e escalas** (comparado à nuvem) numa confirmação — feedback e **rede de segurança** (publicar de um aparelho desatualizado mostra "−N" e avisa antes de remover itens da nuvem). |
| **v0.27.2** | recurso | **"Ver detalhes" no diff:** folha rolável com os **nomes** das cifras/escalas que entram (+) e saem (−, em vermelho) antes de publicar. |
| **v0.27.3** | correção | **Folha de publicar empilhava:** a confirmação abria atrás da folha "Repertório na nuvem" e o toast "Publicado" não aparecia. Agora a folha fecha antes da confirmação e o toast de sucesso fica visível. |
| **v0.28.0** | recurso | **Polimento de UI (Onda 1):** fundação de tokens (tipografia/8pt/raios), Tom em destaque no player, toast tipado + acessível, estados vazios certos (busca/ação embutida), acorde legível no tema claro, e ícone de Backup → "Repertório" (archive SVG). Ver `PLANO-ui.md`. |
| **v0.29.0** | recurso | **Polimento de UI (Onda 2):** ícones SVG inline unificados (Lucide) via fonte única `ICONS`/`icon()` + `paintIcons()` — some a mistura emoji+glifo e a família de setas ambíguas; herda o tema por `currentColor`. `♯/♭`, `A−/A＋`, `−/＋` e `＋` ficam texto (língua do músico). Ver `PLANO-ui.md`. |
| **v0.30.0** | recurso | **Polimento de UI (Onda 3 · M2):** sheet ⚙ Ajustes agrupado em três seções — **Afinação** / **Leitura** / **Esta música** — com subtítulos discretos; Editar/Enviar viram linha de ações. IDs preservados. Ver `PLANO-ui.md`. |
| **v0.31.0** | recurso | **Polimento de UI (Onda 3 · M4):** linguagem de card unificada entre cifras (`.songcard`) e escalas (`.escard`) — mesma gramática **título → subtítulo → faixa de pílulas** (`.c-ttl`/`.c-sub`/`.c-meta`/`.pill`), respiro 8pt, dois níveis de leitura. Ver `PLANO-ui.md`. |
| **v0.32.0** | recurso | **Polimento de UI (Onda 3 · M5):** `#reposheet` em dois cartões — **Baixar (equipe)** e **Publicar (líder)** recolhido por padrão (`<details>`; abre sozinho se há token). IDs preservados. Ver `PLANO-ui.md`. |
| **v0.33.0** | recurso | **Polimento de UI (Onda 3 · M3):** arrastar para fechar sheets (gesto no grip/cabeçalho, limiar ~90px, volta com mola); respeita `prefers-reduced-motion`. Ver `PLANO-ui.md`. |
| **v0.34.0** | recurso | **Polimento de UI (Onda 3 · M7):** entrada da lista com stagger sutil só na 1ª pintura (cifras/escalas); re-render por busca não re-anima; respeita `prefers-reduced-motion`. Ver `PLANO-ui.md`. |
| **v0.35.0** | recurso | **Polimento de UI (Onda 3 · M8):** barra fininha de progresso do culto no topo da Apresentação (fração música atual/total) — "onde estamos" de relance. Ver `PLANO-ui.md`. |
| **v0.36.0** | recurso | **Polimento de UI (Onda 3 · M6):** skeleton de carregamento no "Atualizar do link" (rede). Player abre síncrono, então o skeleton fica no pull. **Fecha a Onda 3** e o polimento em ondas. Ver `PLANO-ui.md`. |
| **v0.36.1** | correção | **Limpeza pós-auditoria:** os `.mag` (lupa) nascem vazios e são pintados só pelo `icon()` — fecha a coerência da fonte única de ícones. Sem mudança visual. |
| **v0.37.0** | recurso | **Sincronizar ao abrir (auto-sync):** opção habilitável (desligada por padrão) que puxa o repertório da nuvem ao abrir o app — cifras **e escalas** — com pull silencioso, não-interativo e idempotente; mão única preservada. Ver `PLANO-repertorio-link.md`. |
| **v0.38.0** | recurso | **Auto-sync ao voltar pro app:** o pull silencioso também roda no `visibilitychange` (app volta ao foco), com throttle de 1 min pra não martelar a rede. Ver `PLANO-repertorio-link.md`. |

> O detalhamento de cada versão está em `CHANGELOG.md`.

---

## 3. Onde o app está hoje (resumo de capacidades)

- **Repertório:** criar/editar/excluir cifras, busca, tags; importar colando do
  Cifra Club; importar/exportar arquivos; backup do repertório inteiro. Importação
  deduplica por `id` e **avisa antes de mesclar** quando o título repete com `id`
  diferente (manter as minhas / cópias / cancelar).
- **Player:** **barra de uma linha** (`← · Título · ☰ · ⚙`) que prioriza a cifra;
  transposição (subir/abaixar, no ⚙ Ajustes) com **grafia fiel ao tom** — preserva o
  que foi escrito e, ao transpor, escolhe ♯/♭ sozinho pelo tom (Bb nunca vira A#),
  capo, tamanho de fonte, modo escuro/claro, só letra, ocultar tabs, **modos de
  leitura** (rolagem com auto-scroll opcional **ou** página), navegação por
  estrutura (☰), **diagrama de acorde ao tocar no acorde** (pegada no violão, capo-aware)
  e tela sempre acesa (Wake Lock).
- **Escalas:** montar o culto (músicas + itens), tom por escala, equipe, tempo
  total, **"Culto realizado"** (confirma a escala → alimenta a recência "última vez que
  tocamos" nas cifras), modo Apresentar (música a música no tom do culto, com **barra compacta**
  que dá mais cifra na tela e **virar página como um livro** entre as músicas),
  compartilhar.
- **Compartilhar:** por **arquivo `.json`** (cifra, escala ou repertório), por **link
  auto-importável** (`…/#imp=…`, sem servidor — a pessoa toca e o app oferece importar) e por
  **"Atualizar do link"** (puxa um snapshot `louvai.json` com cifras + escalas publicado no
  GitHub Pages e mescla — ótimo pra celular novo / refresh da equipe) e por **"Publicar na
  nuvem"** (o líder escreve o `louvai.json` direto do celular, via token fino do GitHub).
- **Offline:** tudo salvo no aparelho (localStorage); funciona sem internet. **Rede de
  segurança do backup:** registra a data do último backup, avisa quando há mudanças não
  salvas (pontinho no ↥ + lembrete ao abrir) e tem "Restaurar de um arquivo" claro.
- **Robustez e acessibilidade:** importação à prova de arquivo malformado (sem XSS,
  sem travar a lista); botões com nome em leitor de tela, toggles com estado, respeito
  ao "Reduzir movimento" e alvos de toque grandes para o palco.

---

## 4. Próximos passos (para as próximas sessões)

Backlog organizado por tema. A **ordem sugerida** está logo abaixo.

### Tema F — Interface
- [x] **Redesign visual moderno** *(entregue nas v0.10.0–v0.13.0, 4 fases — ver
  `PLANO-redesign-ui.md`)*: paleta near-black + acento violeta, Inter na UI,
  bottom nav + FAB único, player de palco com sheet Ajustes, vidro fosco e
  microinterações. Falta apenas a **aprovação visual do dono** nas telas reais
  (celular) antes de distribuir.
- [x] **Polimento "cara de app pronto"** (`PLANO-ui.md`, em ondas) — **concluído (v0.28.0→v0.36.1)**:
  **Onda 1** (v0.28.0 — tokens, Tom em destaque, toast tipado, vazios, acorde no claro, ícone do
  Backup); **Onda 2** (v0.29.0 — ícones SVG inline unificados via `ICONS`/`icon()`); **Onda 3**
  (M2 seções do ⚙ Ajustes · M4 linguagem de card · M5 `#reposheet` em cartões · M3 arrastar p/
  fechar · M7 entrada da lista · M8 progresso na Apresentação · M6 skeleton de carregamento).
  **Falta apenas a validação visual no celular** (palco, dark/light) — ver ordem sugerida.

### Tema A — Segurança dos dados
- [ ] **PWA instalável de verdade** (ícone, 100% offline inclusive fontes;
  destrava o compartilhar nativo no desktop, e "Abrir com Louvai" pra importar
  arquivo em 1 toque). **Decisão registrada:** a migração para PWA **encerra a regra
  "arquivo único"** — a partir dela o critério passa a ser **qualidade de software e
  organização do repositório** (multi-arquivo ok), mantendo offline-first/vanilla/sem
  build/sem backend. Detalhe no `CLAUDE.md` (seção "Horizonte"). Antes do PWA, seguimos
  refinando em arquivo único.
- [x] **Backup com rede de segurança:** data do último backup, "há mudanças desde então",
  lembrete ativo (pontinho no ↥ + toast ao abrir quando atrasado) e "Restaurar de um
  arquivo" claro. *(entregue na v0.23.0 — backup local; nuvem é fase online)*
- [ ] **Migrar de localStorage para IndexedDB** (mais espaço e robustez).

### Tema B — Uso ao vivo / palco
- [x] **Wake Lock:** manter a tela acesa durante o player. *(entregue na v0.8.0)*
- [x] **Modos de leitura no player** *(concluído — ver `PLANO-modos-leitura.md`)*:
  - [x] **Auto-scroll opcional** no modo rolagem (oculto por padrão; liga no ⚙
    Ajustes). *(Incremento 1 — entregue na v0.14.0)*
  - [x] **Modo Página** (paginação horizontal: deslizar ou tocar nas laterais),
    fatiamento medido no DOM, unidades atômicas (acorde+letra). *(Incremento 2 —
    entregue na v0.15.0)*
- [x] **Apresentação enxuta:** barra compacta (controles + título num topo fino),
  mais cifra na tela ao vivo. *(entregue nas v0.18.0–v0.18.1; Tom no ⚙ Ajustes)*
- [x] **"Livro" entre músicas:** virar a última página passa pra próxima música;
  voltar retoma a última página da anterior. *(entregue na v0.19.0)*
- [ ] **Auto-scroll mais esperto:** lembrar velocidade por música; pausar ao tocar a tela.
- [ ] **Modo tela cheia** de apresentação (incluir ☰ estrutura na barra compacta).

### Tema C — Qualidade da cifra
- [x] **Preservar a grafia original** dos acordes (Bb continua Bb até transpor).
  *(entregue na v0.16.0 — correção na fonte da verdade `transposeNote`)*
- [x] **Grafia inteligente ao transpor** (sustenido/bemol conforme o tom de destino).
  *(entregue na v0.17.0 — transposição que preserva o intervalo; botão ♯/♭ removido)*
- [x] **Diagramas de acorde** (pegada) ao tocar no acorde. *(entregue na v0.25.0 — híbrido
  curado + motor de pestanas; capo-aware; validado por notas — ver `PLANO-diagramas-acorde.md`)*
  - [ ] *Evoluções:* outras posições por acorde; dim/aug/m7b5/6 no motor; cavaco/ukulele.
- [ ] **Resolver o modelo de capotraste** (cifra do Cifra Club já vem nas formas com capo).

### Tema D — Repertório e escalas
- [x] **"Última vez que tocamos"** (derivado das escalas **confirmadas** — "Culto realizado").
  *(entregue na v0.24.0 — recência na lista e no seletor; só conta culto confirmado)*
- [ ] **Ordenar por menos tocadas / mais recentes** (usa a recência da v0.24.0).
- [ ] **Duplicar escala** e **modelos de culto**.
- [ ] **Campos extras na música:** BPM, tema/categoria, andamento.
- [ ] **Itens não-musicais no modo Apresentar** (mostrar o card de aviso/oração na sequência).

### Tema E — Importar e compartilhar (sem servidor)
- [x] **Compartilhar por link auto-importável** (`…/#imp=…`, dados gzipados no fragmento,
  sem backend; recebe tocando o link, com confirmação). *(entregue na v0.21.0 — ver
  `PLANO-compartilhar-link.md`)*. Falta a tarefa operacional do dono: **hospedar** o app
  (GitHub Pages — passo a passo no `README` e no plano).
- [ ] **Transferência por QR Code** entre celulares (do link curto / via Drive) — entra
  depois de validar o link em campo.
- [x] **Importar de URL (repertório + escalas)** — `pullRepo`+`importJSON` de um snapshot
  `louvai.json` hospedado (GitHub Pages, CORS ok; o Drive não serve). Mão única (líder publica,
  equipe puxa). *(entregue na v0.26.0 — ver `PLANO-repertorio-link.md`)*
- [x] **Publicar na nuvem do celular** — o líder escreve o `louvai.json` direto via API do
  GitHub (token fino, só no aparelho); 1ª publicação cria o arquivo; **diff +/− cifras com
  confirmação** (e **"ver detalhes"** com os nomes) antes de escrever (rede de segurança).
  *(entregue na v0.27.0–v0.27.2 — ver `PLANO-publicar-nuvem.md`)*
  - [ ] *Evolução (fase online):* sync de duas vias com login/OAuth e merge de conflito real.
- [ ] **Compartilhar escala como texto formatado** para WhatsApp (além do `.json`).
- [ ] **Refinar o colar** com mais exemplos reais; **exportar para ChordPro**.

### Fase futura — Online
- [ ] Sincronização/escala compartilhada, notificações, indisponibilidade da equipe,
  chat — tudo que exige servidor. Planejar só depois de fechar o offline.

---

## 5. Ordem sugerida para a próxima sessão

1. **Hospedar o app + validar o link em campo** (tarefa do dono): publicar no
   GitHub Pages (passo a passo no `README` / `PLANO-compartilhar-link.md`), gerar
   "Enviar link" numa escala e mandar pra outro aparelho no WhatsApp → tocar → importar.
2. **Validação visual no celular** (dark e light): o redesign, o **Modo Página** e a
   **barra compacta da Apresentação** só se confirmam de verdade na tela real do palco.
3. **PWA instalável** — fecha o offline 100% do app hospedado (manifest + service worker)
   e destrava "Abrir com Louvai" pra importar arquivo em 1 toque. **Encerra a regra
   "arquivo único"** (ver `CLAUDE.md`, seção "Horizonte").
4. **Ordenar por menos tocadas** (usa a recência da v0.24.0) e **QR Code** — alto valor percebido.
5. **PWA instalável** (Tema A) — fecha o offline do app hospedado e encerra a regra "arquivo único".

> ✅ **Modos de leitura no player** (auto-scroll opcional + Modo Página) concluídos
> nas v0.14.0–v0.15.0 — ver `PLANO-modos-leitura.md`.
> ✅ **Grafia dos acordes** (preservar original + grafia fiel ao tom ao transpor)
> concluída nas v0.16.0–v0.17.0.
> ✅ **Apresentação enxuta** (barra compacta + Tom no Ajustes) concluída nas
> v0.18.0–v0.18.1; **"livro"** (virar página troca de música) na v0.19.0.
> ✅ **Compartilhar por link** (auto-importável, sem servidor) concluído na v0.21.0 —
> ver `PLANO-compartilhar-link.md` (resta a tarefa operacional de hospedar). A v0.21.1
> ajustou o **aviso de link longo** (apps de mensagem cortam a URL → mandar o arquivo).
> ✅ **Aviso de título duplicado** ao importar na v0.22.0; **backup com rede de
> segurança** (data, "mudanças desde então", lembrete, restaurar claro) na v0.23.0;
> **"última vez que tocamos"** (recência via escalas confirmadas) na v0.24.0;
> **diagramas de acorde** (pegada ao tocar, híbrido curado+motor) na v0.25.0 — fecha o Tema C;
> **repertório + escalas por link** (pull de um snapshot do GitHub Pages) na v0.26.0;
> **publicar na nuvem** (escrever o snapshot do celular via token do GitHub) na v0.27.0,
> com **diff +/− e confirmação** ao publicar na v0.27.1 (e **"ver detalhes"** com os nomes na v0.27.2);
> **sincronizar ao abrir** (auto-sync habilitável, pull silencioso de cifras+escalas) na v0.37.0,
> estendido para **puxar também ao voltar pro app** (visibilitychange, com throttle) na v0.38.0.
> ✅ **Polimento de UI em ondas** (`PLANO-ui.md`) **concluído** (v0.28.0→v0.36.1): Onda 1 (tokens,
> Tom, toast, vazios, acorde no claro), Onda 2 (ícones SVG inline via `ICONS`/`icon()`) e Onda 3
> (seções do ⚙ Ajustes, linguagem de card unificada, `#reposheet` em cartões, arrastar p/ fechar,
> entrada da lista, progresso na Apresentação, skeleton de carregamento). Auditado planejado×entregue.
> **Falta só a validação visual no celular** (palco, dark/light).

---

## 6. Como retomar na próxima sessão

**No Claude Code (terminal) — recomendado:**
1. Abra a pasta do projeto (o git já vem dentro).
2. `npm install` → `npm run test:install` (baixa o Chromium, uma vez).
3. Rode `claude` na pasta do projeto. Ele lê o `CLAUDE.md`, o `CHANGELOG.md` e
   este roteiro automaticamente.
4. Peça: "vamos continuar do redesign" (ou outro item da seção 4).
5. A cada incremento: `npm test` → atualizar CHANGELOG → subir `APP_VERSION` →
   `git commit` + `git tag`.

**No chat (claude.ai):** reenvie o zip mais recente e diga de onde continuar.

O ritual de versão é o mesmo nos dois: CHANGELOG → `APP_VERSION` → commit + tag →
(opcional) `louvai-vX.Y.Z.html`.

*Última atualização deste roteiro: v0.38.0.*
