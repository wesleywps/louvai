# 🎸 Louvai — Roteiro do Projeto

App de cifras **offline-first** para ministério de música de igreja. Documento de
acompanhamento: liga o que já foi construído (ver `CHANGELOG.md`) ao que vem a
seguir. Atualizado até a **v0.20.0**.

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

> O detalhamento de cada versão está em `CHANGELOG.md`.

---

## 3. Onde o app está hoje (resumo de capacidades)

- **Repertório:** criar/editar/excluir cifras, busca, tags; importar colando do
  Cifra Club; importar/exportar arquivos; backup do repertório inteiro.
- **Player:** **barra de uma linha** (`← · Título · ☰ · ⚙`) que prioriza a cifra;
  transposição (subir/abaixar, no ⚙ Ajustes) com **grafia fiel ao tom** — preserva o
  que foi escrito e, ao transpor, escolhe ♯/♭ sozinho pelo tom (Bb nunca vira A#),
  capo, tamanho de fonte, modo escuro/claro, só letra, ocultar tabs, **modos de
  leitura** (rolagem com auto-scroll opcional **ou** página), navegação por
  estrutura (☰) e tela sempre acesa (Wake Lock).
- **Escalas:** montar o culto (músicas + itens), tom por escala, equipe, tempo
  total, modo Apresentar (música a música no tom do culto, com **barra compacta**
  que dá mais cifra na tela e **virar página como um livro** entre as músicas),
  compartilhar.
- **Offline:** tudo salvo no aparelho (localStorage); funciona sem internet.
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

### Tema A — Segurança dos dados
- [ ] **PWA instalável de verdade** (ícone, 100% offline inclusive fontes;
  destrava o compartilhar nativo no desktop).
- [ ] **Backup com rede de segurança:** registrar data do último backup, lembrar
  de exportar, e uma tela clara de "restaurar de arquivo".
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
- [ ] **Diagramas de acorde** (pegada) ao tocar no acorde.
- [ ] **Resolver o modelo de capotraste** (cifra do Cifra Club já vem nas formas com capo).

### Tema D — Repertório e escalas
- [ ] **"Última vez que tocamos"** (derivado das escalas, evita repetir música).
- [ ] **Duplicar escala** e **modelos de culto**.
- [ ] **Campos extras na música:** BPM, tema/categoria, andamento; ordenar por mais tocadas/recentes.
- [ ] **Itens não-musicais no modo Apresentar** (mostrar o card de aviso/oração na sequência).

### Tema E — Importar e compartilhar (sem servidor)
- [ ] **Compartilhar escala como texto formatado** para WhatsApp (além do `.json`).
- [ ] **Transferência por QR Code** entre celulares (sincronização offline, sem servidor).
- [ ] **Refinar o colar** com mais exemplos reais; **exportar para ChordPro**.

### Fase futura — Online
- [ ] Sincronização/escala compartilhada, notificações, indisponibilidade da equipe,
  chat — tudo que exige servidor. Planejar só depois de fechar o offline.

---

## 5. Ordem sugerida para a próxima sessão

1. **Validação visual no celular** (dark e light) — agora com **prioridade**: o
   redesign, o **Modo Página** e a nova **barra compacta da Apresentação** só se
   confirmam de verdade na tela real do palco.
2. **PWA + backup seguro** — blinda os dados do ministério.
3. **"Última vez que tocamos"** e **QR Code** — alto valor percebido.
4. **Diagramas de acorde** (pegada ao tocar no acorde) — fecha o Tema C de qualidade.

> ✅ **Modos de leitura no player** (auto-scroll opcional + Modo Página) concluídos
> nas v0.14.0–v0.15.0 — ver `PLANO-modos-leitura.md`.
> ✅ **Grafia dos acordes** (preservar original + grafia fiel ao tom ao transpor)
> concluída nas v0.16.0–v0.17.0.
> ✅ **Apresentação enxuta** (barra compacta + Tom no Ajustes) concluída nas
> v0.18.0–v0.18.1; **"livro"** (virar página troca de música) na v0.19.0.

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

*Última atualização deste roteiro: v0.20.0.*
