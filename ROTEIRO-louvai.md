# 🎸 Louvai — Roteiro do Projeto

App de cifras **offline-first** para ministério de música de igreja. Documento de
acompanhamento: liga o que já foi construído (ver `CHANGELOG.md`) ao que vem a
seguir. Atualizado até a **v0.9.0**.

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

> O detalhamento de cada versão está em `CHANGELOG.md`.

---

## 3. Onde o app está hoje (resumo de capacidades)

- **Repertório:** criar/editar/excluir cifras, busca, tags; importar colando do
  Cifra Club; importar/exportar arquivos; backup do repertório inteiro.
- **Player:** transposição (♯/♭), capo, tamanho de fonte, modo escuro/claro, só
  letra, ocultar tabs, auto-scroll, navegação por estrutura (☰) e tela sempre
  acesa (Wake Lock).
- **Escalas:** montar o culto (músicas + itens), tom por escala, equipe, tempo
  total, modo Apresentar (música a música no tom do culto), compartilhar.
- **Offline:** tudo salvo no aparelho (localStorage); funciona sem internet.

---

## 4. Próximos passos (para as próximas sessões)

Backlog organizado por tema. A **ordem sugerida** está logo abaixo.

### Tema F — Interface (novo)
- [ ] **Redesign visual moderno:** repensar a interface com proposta atual e
  intuitiva (usar o plugin `frontend-design`), mantendo arquivo único, alvos de
  toque grandes e legibilidade no palco/pouca luz. Modo escuro continua padrão.

### Tema A — Segurança dos dados
- [ ] **PWA instalável de verdade** (ícone, 100% offline inclusive fontes;
  destrava o compartilhar nativo no desktop).
- [ ] **Backup com rede de segurança:** registrar data do último backup, lembrar
  de exportar, e uma tela clara de "restaurar de arquivo".
- [ ] **Migrar de localStorage para IndexedDB** (mais espaço e robustez).

### Tema B — Uso ao vivo / palco
- [x] **Wake Lock:** manter a tela acesa durante o player. *(entregue na v0.8.0)*
- [ ] **Auto-scroll mais esperto:** lembrar velocidade por música; pausar ao tocar a tela.
- [ ] **Modo tela cheia** de apresentação.

### Tema C — Qualidade da cifra
- [ ] **Preservar a grafia original** dos acordes (Bb continua Bb até transpor).
- [ ] **Grafia inteligente ao transpor** (sustenido/bemol conforme o tom de destino).
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

1. **Redesign da interface** — proposta moderna e intuitiva, antes dos primeiros
   testes com o ministério (primeira impressão conta).
2. **Preservar a grafia original** dos acordes — fecha um ponto que já incomodou.
3. **PWA + backup seguro** — blinda os dados do ministério.
4. **"Última vez que tocamos"** e **QR Code** — alto valor percebido.

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

*Última atualização deste roteiro: v0.9.0.*
