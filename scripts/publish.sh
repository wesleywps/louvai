#!/usr/bin/env bash
# Publicar o Louvai no GitHub Pages (uso: `npm run deploy` — depois de commitar o código pelo ritual).
#
# louvai.json (repertório/escalas): o REMOTO é a FONTE DA VERDADE — só o app o edita (celular/desktop,
# via "Publicar na nuvem"). Este script NUNCA sobe uma versão local do louvai.json:
#   1) busca o remoto e guarda um BACKUP local do louvai.json vivo (em backups/, ignorado pelo git);
#   2) se o remoto tiver novidades (ex.: a equipe publicou), INTEGRA por rebase (traz o louvai.json vivo
#      e põe nossos commits de código por cima) — nós nunca editamos o louvai.json, então não há conflito;
#   3) faz o push. A GitHub Action gera o index.html e atualiza o Pages.
set -euo pipefail
cd "$(dirname "$0")/.."

echo "→ Buscando o estado do remoto…"
git fetch origin main

mkdir -p backups
STAMP="$(date +%Y%m%d-%H%M%S)"
git show origin/main:louvai.json > "backups/louvai-$STAMP.json"
echo "→ Backup do louvai.json vivo (remoto): backups/louvai-$STAMP.json"

if git merge-base --is-ancestor origin/main HEAD; then
  echo "→ Remoto sem novidades; push será fast-forward."
else
  echo "→ O remoto tem novidades (ex.: louvai.json publicado pela equipe). Integrando por rebase…"
  git rebase origin/main
fi

cp louvai.html index.html   # cópia local só p/ abrir no navegador aqui (no deploy a Action gera)

echo "→ Publicando (git push)…"
git push origin main
echo "✓ Push feito. A GitHub Action gera o index.html e atualiza o Pages em ~1–2 min."
echo "  App: https://wesleywps.github.io/louvai/"
