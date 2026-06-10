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
1. **Arquivo único:** todo HTML + CSS + JS vive em `louvai.html`. JS puro
   (vanilla), sem framework, sem etapa de build, sem dependências em runtime.
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
6. (Opcional) salvar uma cópia `louvai-vX.Y.Z.html` para distribuição. **Ao gerar
   uma nova cópia, apague as cópias `louvai-v*.html` antigas da pasta** — manter só
   **o original (`louvai.html`) e a cópia de distribuição mais recente**. As cópias
   ficam fora do git (ver `.gitignore`) e são regeneráveis via `git checkout vX.Y.Z`.

**Checklist rápido antes do commit:** APP_VERSION = package.json · CHANGELOG tem a
versão · ROTEIRO (linha do tempo + rodapé + backlog) coerente · README na versão ·
PLANO atualizado se aplicável · `npm test` verde.

## Como testar
- **Automático (recomendado):**
  - `npm install`            (uma vez)
  - `npm run test:install`   (baixa o Chromium do Playwright, uma vez)
  - `npm test`               (roda `tests/smoke.mjs`)
  - O teste abre `louvai.html` num Chromium headless e valida transposição com
    **grafia fiel ao tom**, parser de acordes, importação por colagem, escalas e
    **modo Apresentar** (barra compacta, Tom no Ajustes, "livro" entre músicas),
    Modo Página, menu de estrutura, Wake Lock e a compatibilidade com o nome antigo.
    Falhou = sai com código ≠ 0 e lista o que quebrou. (~84 verificações.)
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
- `.gitignore` — ignora `node_modules/`, as cópias `louvai-v*.html` e o
  `COMMIT_MSG_tmp.txt`.
- `CLAUDE.md` — este guia.

## Anatomia do `louvai.html` (onde mexer)
- **Música/teoria:** `SHARP`/`FLAT`, `QUAL_RX`, `parseChord`, `transposeChord`,
  `transposeNote`, `isChord`, `isChordLine`, `isSectionLine`.
- **Grafia ao transpor (v0.17.0):** a grafia vem do TOM, não de um botão. A
  transposição preserva o intervalo: `noteParts`, `transposeKeyName` (nome de tom
  legível), `spellCtx(tomOrigem, semis[, tomExplícito])` → `{letterStep, destFlat}`,
  e `transposeNote(note, semis, ctx)`. Sem transpor (`semis%12===0`) preserva o
  original (v0.16.0). Acorde emprestado (`Bb` no tom de Dó) continua certo.
- **Render:** `renderCifra(body, semis, showChords, ctx, hideTabs)` — `ctx` é o
  contexto de grafia (`spellCtx`); trata seção sozinha, `[Seção] + acordes` na mesma
  linha, linha de acordes, letra com `[C]` inline, e ocultação de tablatura.
- **Corretor do editor:** `lintCifra` + `runLint`.
- **Importar texto colado:** `parseImport` e `isMeta` (regras de limpeza do
  Cifra Club: remove `Tom:`, `Capotraste`, `Cifra:`, `Favoritar`, URLs…).
- **Player:** `openPlayer`, `drawPlayer` (calcula `ctxSound`/`ctxShape`),
  `offsetToKey`, controles (tom, capo, fonte, só-letra, tabs, auto-scroll),
  navegação por estrutura (`#p-struct`)
  e Wake Lock (`lockScreen`/`unlockScreen`, religado no `visibilitychange`).
- **Escalas/Setlists:** bloco "ESCALAS / SETLISTS" — lista, detalhe (`openEscala`),
  editor (`openEscalaEditor`), seletor de música (`openPicker`) e modo Apresentar
  (`escalaCtx`, `presentGo`).
- **Apresentação compacta (v0.18.0/0.18.1):** classe `.present` em `#view-player`
  (ligada por `updatePresentBar` quando há `escalaCtx`) esconde `.controls`/`.songhead`
  e usa o `#presentbar` como barra fina de **uma linha** (`.pb-nav`: ← ‹ título·2/5 › ⚙).
  O **Tom mora no ⚙ Ajustes** (`#s-tdown`/`#s-tkey`/`#s-tup`), não na barra. Botões
  `pv-*`/`s-t*` reusam `transposeBy`/`exitPlayer`/`openPlayerSheet` — não duplicar lógica.
  **"Livro" (v0.19.0):** no modo Página, `goPage` nos extremos chama `presentGo(±1)`
  (virar a última página → próxima música; voltar da 1ª → anterior na última página,
  via `openPlayer(...,atLast)`). As setas ‹ › de música seguem indo pro início.
- **Armazenamento:** chaves `LS_SONGS`, `LS_ESC`, `LS_SET` (`louvai.*.v1`);
  funções `load`, `migrateLevita`, `saveSongs`, `saveEscalas`, `saveSettings`.

## Convenções
- **Idioma de tudo** (UI, comentários, mensagens de commit, CHANGELOG): pt-BR.
- Siga o estilo já existente (nomes curtos, `$()` como seletor, sem libs).
- Comentário explica o **porquê**, não o óbvio.
- Acessibilidade de toque: alvos grandes; o app é usado no palco, com pouca luz.

## Próximos passos
Já entregues: redesign visual (v0.10.0–v0.13.x), grafia dos acordes (v0.16.0–v0.17.0),
modos de leitura (v0.14.0–v0.15.x) e Apresentação enxuta + "livro" (v0.18.0–v0.19.0).
Ver `ROTEIRO-louvai.md` (seções 4 e 5). Ordem sugerida agora:
1. **Validação visual no celular** (dark/light) — redesign, Modo Página e a barra
   compacta da Apresentação só se confirmam de verdade na tela do palco.
2. **PWA instalável + backup seguro** (ícone, 100% offline; data do último backup,
   tela de restaurar).
3. **"Última vez que tocamos"** (derivado das escalas) e **transferência por QR Code**.
4. **Diagramas de acorde** (pegada ao tocar no acorde) — fecha o Tema C.
