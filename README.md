# 🎸 Louvai

App de cifras **offline-first** para ministério de música. Um único arquivo
HTML (`louvai.html`), sem build e sem servidor: roda no navegador do
celular/tablet, guarda tudo no aparelho e compartilha por arquivo.

> Até a v0.8.0 o projeto se chamava **Levita**. Arquivos `.json` exportados
> pelo nome antigo continuam importando normalmente.

## Usar
Abra `louvai.html` no navegador. No celular, use **"Adicionar à Tela de Início"**
para ter um ícone e abrir como app.

## Recursos (v0.23.0)
- **Interface moderna** (estilo Spotify/Deezer): tema escuro near-black com
  acento violeta, bottom nav, botão "+" contextual e player focado no palco.
- Repertório com busca e tags; criar/editar cifras; **importar colando do Cifra Club**.
  Importar arquivo/link **avisa antes de mesclar** quando uma cifra tem título repetido
  (manter as suas sem duplicar, ficar com as duas, ou cancelar).
- **Rede de segurança do backup:** registra a data do último backup, marca quando há
  mudanças desde então, **lembra de exportar** (pontinho no ↥ + aviso ao abrir quando
  atrasado) e tem **"Restaurar de um arquivo"** claro. Tudo local (sem nuvem).
- Player em **barra de uma linha** (prioriza a cifra): transposição com **grafia fiel
  ao tom** — preserva o que você escreveu e, ao subir/abaixar, escolhe ♯/♭ sozinho
  pelo tom de destino (Bb nunca vira A#, mesmo em acordes emprestados), capo, fonte,
  modo escuro/claro, só-letra, ocultar tablaturas (tudo no ⚙ Ajustes), **modos de
  leitura** (rolagem com auto-scroll opcional **ou** página, virando com
  toque/deslize), **navegação por estrutura** (☰) e **tela sempre acesa** (Wake Lock).
- **Escalas/Setlists**: ordem do culto, tom por escala, equipe, tempo total e
  **modo Apresentar** com **barra compacta** (mais cifra na tela ao vivo) e
  **virar de página como um livro** entre as músicas.
- **Compartilhar** por **arquivo `.json`** e por **link auto-importável** (`…/#imp=…`,
  sem servidor): a pessoa só **toca o link** e o app abre oferecendo importar (com
  confirmação antes de salvar). Link longo (repertório/escala grande) avisa e oferece
  mandar o arquivo, que não é cortado por apps de mensagem. Tudo offline.
- **Robusto e acessível:** importação à prova de arquivo malformado (sem XSS, sem
  travar a lista), botões com nome em leitor de tela e respeito ao "Reduzir movimento".

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
