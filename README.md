# 🎸 Louvai

Cifras e escalas pro **ministério de louvor** — no celular, **offline**, sem conta e sem servidor.

> Até a v0.8.0 o projeto se chamava **Levita**. Arquivos `.json` exportados
> pelo nome antigo continuam importando normalmente.

## O que faz
Organiza o **repertório**, monta a **escala do culto** e mostra a **cifra no palco** —
tudo guardado no próprio aparelho. É um **único arquivo HTML** (`louvai.html`), sem build
e sem backend: abre no navegador do celular/tablet e compartilha por arquivo ou link.

## Principais recursos

- **🎤 No palco** — player numa barra só (prioriza a cifra), transposição com **grafia
  fiel ao tom** (Bb nunca vira A#, mesmo em acorde emprestado), **modo página** ou rolagem
  com **auto-scroll**, **diagramas de acorde** ao tocar no acorde (mostra a forma com capô),
  navegação pela **estrutura** da música e **tela sempre acesa** (Wake Lock).
- **📚 Repertório** — busca e tags, criar/editar/excluir, **importar colando do Cifra Club**,
  **"última vez que tocamos"** e **ordenar** por alfabética / recentes / **menos tocadas**
  (dá vez ao que está esquecido). Importar **avisa antes de duplicar** título repetido.
  **Link da versão guia** (YouTube) por música, que **sincroniza** com a equipe.
  E **observações da música** (cues de arranjo: "começa só voz", "tom da guia ≠ o que tocamos") que também sincronizam.
- **📅 Escalas / setlists** — ordem do culto, tom por escala, equipe e tempo total;
  **"Culto realizado"** alimenta a recência; **modo Apresentar** com barra compacta,
  **tela cheia** e **virar de página como um livro** entre as músicas.
- **☁️ Compartilhar & nuvem** — por **arquivo `.json`**, por **link auto-importável**
  (a pessoa toca o link e o app oferece importar, sem servidor) e por **"Repertório na
  nuvem"**: o líder publica um snapshot e a equipe **puxa de um link** — com **sincronizar
  ao abrir** (opcional) e **sem backend**.
- **🔒 Confiável** — **100% offline** (dados só no aparelho), **backup com lembrete**,
  conferência opcional do **tom pelos acordes**, importação à prova de arquivo malformado
  (sem XSS) e **acessível** (foco por teclado, contraste no escuro, alvos de toque grandes).

*Detalhe de cada recurso, versão a versão, no [`CHANGELOG.md`](CHANGELOG.md) — versão atual **v0.48.1**.*

## Usar
Abra `louvai.html` no navegador. No celular, use **"Adicionar à Tela de Início"** — desde a
v0.46.0 ele instala com o **ícone do Louvai** (na aba do navegador e na tela inicial).

## Publicar (hospedar)
Hospedar dá uma **URL fixa** ao app, e aí o **link de importação** (`…/#imp=…`) vira
tocável entre celulares. É **hospedagem estática** (o GitHub só entrega o arquivo
quando alguém abre o endereço) — **não é backend**: os dados das pessoas continuam
só no aparelho; o que fica público é o **código** do app (já era compartilhável). O
link é montado no celular e enviado direto (WhatsApp); o servidor nunca vê os dados.

**GitHub Pages (recomendado, ~10 min, uma vez):**
1. Crie um repositório **público** chamado `louvai` (a URL vira `usuario.github.io/louvai/`).
2. Suba o `louvai.html` mais recente **renomeado para `index.html`** (o Pages serve o
   `index.html` da raiz). *Add file → Upload files → Commit.*
3. **Settings → Pages**: *Source* = **Deploy from a branch**, *Branch* = **main** ·
   **/ (root)** → **Save**.
4. Aguarde ~1 min: aparece *"Your site is live at …"*. Esse é o endereço pra divulgar.
5. No celular: abra a URL → **"Adicionar à Tela de Início"**. Ao gerar **"Enviar link"**
   numa escala, o app já produz `…github.io/louvai/#imp=…` (a base vem da própria URL).

**Atualizar:** suba a cópia `louvai-vX.Y.Z.html` mais nova renomeada como `index.html`
e commite — em ~1 min todos pegam a versão nova ao reabrir, sem reenviar arquivo.

**Alternativa rápida — Netlify Drop:** arraste o `index.html` em
<https://app.netlify.com/drop> e receba uma URL na hora.

> **Offline (honesto):** sem *service worker*, o 1º acesso (e checar atualização)
> pede internet; depois o navegador costuma cachear. Offline 100% garantido +
> instalável "de verdade" é o **próximo passo** (PWA: manifest + service worker).

O passo a passo detalhado (com a conta do dono) está em `PLANO-compartilhar-link.md`.

### Repertório na nuvem (a equipe puxa de um link)
Depois de hospedar, dá pra ter um **repertório compartilhado** sem backend, **mão única**
(o líder publica, a equipe baixa):

1. **Líder publica:** no app, **Repertório → Repertório na nuvem → "Exportar tudo (pra publicar)"**
   gera um `louvai.json` (cifras **+** escalas). Suba esse arquivo no mesmo repositório do
   app (Add file → Upload files → Commit) — ele vira `https://<seu-site>/louvai.json`.
2. **Equipe abre e atualiza:** **Repertório → Repertório na nuvem → "Atualizar do link"**.
   Como o app e o `louvai.json` ficam no mesmo endereço, o campo do link **já vem preenchido
   sozinho** (derivado do endereço do app) — o membro **não precisa colar nada**, é só tocar
   "Atualizar". (Pra puxar de **outro** repositório, cole o link no campo: link explícito tem
   prioridade.) Baixa o repertório e as escalas e **mescla** no aparelho (cifras/escalas
   repetidas não duplicam; o app avisa se um título bater).
3. **Atualizar depois:** o líder repete o passo 1 (sobe o `louvai.json` novo); a equipe toca
   "Atualizar do link" de novo.

**Publicar do celular (líder):** em vez de subir o `louvai.json` à mão, o líder pode escrever
direto pelo app. Uma vez, crie um **token fino** no GitHub — link direto:
<https://github.com/settings/personal-access-tokens/new> (ou *Settings → Developer settings →
**Fine-grained tokens** → Generate new token*) → **Only select repositories** = o repo do app →
**Permissions → Contents: Read and write** → defina uma validade → Generate → copie. No app:
**Repertório → Repertório na nuvem → cole o token → "Publicar na nuvem"** (a 1ª publicação cria
o `louvai.json`). Use **um token por aparelho** (revogar um não afeta os outros). O token fica
**só no aparelho** e dá pra **revogar/gerenciar** a qualquer momento em
<https://github.com/settings/tokens?type=beta>; a equipe continua só puxando.

> **Mão única:** sincronização de duas vias (todos escreverem) exige login e é a fase futura.
> O arquivo é público — inclui os nomes da equipe das escalas. Apagar uma cifra/escala no
> arquivo **não** a remove dos aparelhos (a mescla só adiciona/atualiza). Detalhes e limites
> em `PLANO-repertorio-link.md`.

## Desenvolver
Requer [Node.js](https://nodejs.org) 18+.

```bash
npm install            # instala o Playwright (dev)
npm run test:install   # baixa o Chromium (uma vez)
npm test               # roda a suíte de validação
```

## Documentos
- `CLAUDE.md` — guia para desenvolver com o Claude Code (padrões e ritual).
- `CHANGELOG.md` — histórico por versão (semver).
- `ROTEIRO-louvai.md` — visão geral e próximos passos.

## Versionamento
Semântico (`vMAIOR.MENOR.CORREÇÃO`). A versão atual aparece dentro do app, ao
lado do nome, e está em `APP_VERSION` no `louvai.html`.
