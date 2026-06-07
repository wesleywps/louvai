# 🎸 Levita

App de cifras **offline-first** para ministério de música. Um único arquivo
HTML (`levita.html`), sem build e sem servidor: roda no navegador do
celular/tablet, guarda tudo no aparelho e compartilha por arquivo.

## Usar
Abra `levita.html` no navegador. No celular, use **"Adicionar à Tela de Início"**
para ter um ícone e abrir como app.

## Recursos (v0.7.1)
- Repertório com busca e tags; criar/editar cifras; **importar colando do Cifra Club**.
- Player: transposição (♯/♭), capo, fonte, modo escuro/claro, só-letra, ocultar
  tablaturas, auto-scroll e **navegação por estrutura** (☰).
- **Escalas/Setlists**: ordem do culto, tom por escala, equipe, tempo total e
  **modo Apresentar**.
- Compartilhar e fazer backup por arquivo `.json`. Tudo offline.

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
- `ROTEIRO-levita.md` — visão geral e próximos passos.

## Versionamento
Semântico (`vMAIOR.MENOR.CORREÇÃO`). A versão atual aparece dentro do app, ao
lado do nome, e está em `APP_VERSION` no `levita.html`.
