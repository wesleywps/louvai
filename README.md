# 🎸 Louvai

App de cifras **offline-first** para ministério de música. Um único arquivo
HTML (`louvai.html`), sem build e sem servidor: roda no navegador do
celular/tablet, guarda tudo no aparelho e compartilha por arquivo.

> Até a v0.8.0 o projeto se chamava **Levita**. Arquivos `.json` exportados
> pelo nome antigo continuam importando normalmente.

## Usar
Abra `louvai.html` no navegador. No celular, use **"Adicionar à Tela de Início"**
para ter um ícone e abrir como app.

## Recursos (v0.20.1)
- **Interface moderna** (estilo Spotify/Deezer): tema escuro near-black com
  acento violeta, bottom nav, botão "+" contextual e player focado no palco.
- Repertório com busca e tags; criar/editar cifras; **importar colando do Cifra Club**.
- Player em **barra de uma linha** (prioriza a cifra): transposição com **grafia fiel
  ao tom** — preserva o que você escreveu e, ao subir/abaixar, escolhe ♯/♭ sozinho
  pelo tom de destino (Bb nunca vira A#, mesmo em acordes emprestados), capo, fonte,
  modo escuro/claro, só-letra, ocultar tablaturas (tudo no ⚙ Ajustes), **modos de
  leitura** (rolagem com auto-scroll opcional **ou** página, virando com
  toque/deslize), **navegação por estrutura** (☰) e **tela sempre acesa** (Wake Lock).
- **Escalas/Setlists**: ordem do culto, tom por escala, equipe, tempo total e
  **modo Apresentar** com **barra compacta** (mais cifra na tela ao vivo) e
  **virar de página como um livro** entre as músicas.
- Compartilhar e fazer backup por arquivo `.json`. Tudo offline.
- **Robusto e acessível:** importação à prova de arquivo malformado (sem XSS, sem
  travar a lista), botões com nome em leitor de tela e respeito ao "Reduzir movimento".

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
