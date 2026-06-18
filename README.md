# 🎸 Louvai

App de cifras **offline-first** para ministério de música. Um único arquivo
HTML (`louvai.html`), sem build e sem servidor: roda no navegador do
celular/tablet, guarda tudo no aparelho e compartilha por arquivo.

> Até a v0.8.0 o projeto se chamava **Levita**. Arquivos `.json` exportados
> pelo nome antigo continuam importando normalmente.

## Usar
Abra `louvai.html` no navegador. No celular, use **"Adicionar à Tela de Início"**
para ter um ícone e abrir como app.

## Recursos (v0.42.1)
- **Interface moderna** (estilo Spotify/Deezer): tema escuro near-black com
  acento violeta, bottom nav, botão "+" contextual e player focado no palco.
  **Ícones SVG coesos** (traço único, herdam o tema nos dois modos) no lugar da
  mistura de emoji e setas parecidas. Sheets **arrastáveis para fechar**, ⚙ Ajustes
  **agrupado por seção** (Afinação / Leitura / Esta música), cards de cifras e escalas
  com a **mesma linguagem visual**, lista que **entra com leve animação** e
  **barra de progresso do culto** no modo Apresentar.
- Repertório com busca e tags; criar/editar cifras; **importar colando do Cifra Club**.
  Importar arquivo/link **avisa antes de mesclar** quando uma cifra tem título repetido
  (manter as suas sem duplicar, ficar com as duas, ou cancelar).
- **Rede de segurança do backup:** registra a data do último backup, marca quando há
  mudanças desde então, **lembra de exportar** (pontinho no botão **Repertório** + aviso ao
  abrir quando atrasado) e tem **"Restaurar de um arquivo"** claro. Tudo local (sem nuvem).
- **Repertório na nuvem (link):** o líder publica um snapshot `louvai.json` (cifras + escalas)
  no GitHub Pages e a equipe puxa com **"Atualizar do link"** — celular novo pega tudo de um
  link. O líder pode **"Publicar na nuvem"** direto do celular (escreve o `louvai.json` via API
  do GitHub, com um token fino que fica só no aparelho). Antes de publicar, mostra o **diff**
  (quantas cifras/escalas vão entrar/sair, com **"ver detalhes"** mostrando os nomes) — feedback
  e rede de segurança. Mão única (líder publica, equipe puxa), sem backend. Dá pra ligar
  **"Sincronizar ao abrir o app"**: a equipe pega as novidades (cifras e escalas) automaticamente
  na abertura **e ao voltar pro app**, em silêncio (não duplica nada, falha sem barulho se estiver
  offline; busca no máximo uma vez por minuto ao reabrir). O download lê o **commit atual** do
  GitHub (não o link do Pages), então reflete a publicação **na hora** — sem esperar o site
  reconstruir. O status mostra a versão e a idade do que está na nuvem. Ao **baixar** ou **publicar**,
  o app informa **quantas músicas e escalas** foram sincronizadas ("Sincronizado: +2 músicas, +1 escala"
  / "Publicado: 12 músicas e 3 escalas").
- Player em **barra de uma linha** (prioriza a cifra): transposição com **grafia fiel
  ao tom** — preserva o que você escreveu e, ao subir/abaixar, escolhe ♯/♭ sozinho
  pelo tom de destino (Bb nunca vira A#, mesmo em acordes emprestados), capo, fonte,
  modo escuro/claro, só-letra, ocultar tablaturas (tudo no Ajustes), **modos de
  leitura** (rolagem com auto-scroll opcional **ou** página, virando com
  toque/deslize), **navegação por estrutura**, **diagrama de acorde ao tocar no acorde**
  (pegada no violão, com pestana e casa-base; mostra a forma que você faz com o capô) e
  **tela sempre acesa** (Wake Lock). Opcionalmente, **confere se o tom informado bate com os
  acordes** da cifra e sugere o provável quando há divergência (sem alterar nada — só avisa).
- **Escalas/Setlists**: ordem do culto, tom por escala, equipe, tempo total,
  **"Culto realizado"** (confirma a escala) e **modo Apresentar** com **barra compacta**
  (mais cifra na tela ao vivo) e **virar de página como um livro** entre as músicas.
- **"Última vez que tocamos"**: cada cifra mostra a recência ("tocada há 2 semanas" /
  "nunca tocada"), na lista e ao montar a escala — pra não repetir música. Conta só
  escalas marcadas como **realizadas** (a escala é plano; o que rola se confirma no culto).
  A lista de cifras pode ser **ordenada** por **Alfabética**, **Tocadas recentemente** ou
  **Menos tocadas** (dá vez ao repertório esquecido) — a escolha fica salva.
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

### Repertório na nuvem (a equipe puxa de um link)
Depois de hospedar, dá pra ter um **repertório compartilhado** sem backend, **mão única**
(o líder publica, a equipe baixa):

1. **Líder publica:** no app, **Repertório → Repertório na nuvem → "Exportar tudo (pra publicar)"**
   gera um `louvai.json` (cifras **+** escalas). Suba esse arquivo no mesmo repositório do
   app (Add file → Upload files → Commit) — ele vira `https://<seu-site>/louvai.json`.
2. **Equipe configura uma vez:** **Repertório → Repertório na nuvem**, cola o link e toca
   **"Atualizar do link"**. Baixa o repertório e as escalas e **mescla** no aparelho
   (cifras/escalas repetidas não duplicam; o app avisa se um título bater).
3. **Atualizar depois:** o líder repete o passo 1 (sobe o `louvai.json` novo); a equipe toca
   "Atualizar do link" de novo.

**Publicar do celular (líder):** em vez de subir o `louvai.json` à mão, o líder pode escrever
direto pelo app. Uma vez, crie um **token fino** no GitHub:
*Settings → Developer settings → **Fine-grained tokens** → Generate new token* → **Only select
repositories** = o repo do app → **Permissions → Contents: Read and write** → defina uma
validade → Generate → copie. No app: **Repertório → Repertório na nuvem → cole o token → "Publicar na
nuvem"** (a 1ª publicação cria o `louvai.json`). O token fica **só no aparelho** (dá pra
**revogar** no GitHub quando quiser); a equipe continua só puxando.

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
