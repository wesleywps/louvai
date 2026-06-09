# 🎸 Louvai

App de cifras **offline-first** para ministério de música. Um único arquivo
HTML (`louvai.html`), sem build e sem servidor: roda no navegador do
celular/tablet, guarda tudo no aparelho e compartilha por arquivo.

> Até a v0.8.0 o projeto se chamava **Levita**. Arquivos `.json` exportados
> pelo nome antigo continuam importando normalmente.

## Usar
Abra `louvai.html` no navegador. No celular, use **"Adicionar à Tela de Início"**
para ter um ícone e abrir como app.

## Recursos (v0.13.2)
- **Interface moderna** (estilo Spotify/Deezer): tema escuro near-black com
  acento violeta, bottom nav, botão "+" contextual e player focado no palco.
- Repertório com busca e tags; criar/editar cifras; **importar colando do Cifra Club**.
- Player: transposição (♯/♭), capo, fonte, modo escuro/claro, só-letra, ocultar
  tablaturas, auto-scroll, **navegação por estrutura** (☰) e **tela sempre
  acesa** (Wake Lock).
- **Escalas/Setlists**: ordem do culto, tom por escala, equipe, tempo total e
  **modo Apresentar**.
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
