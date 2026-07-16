#!/usr/bin/env bash
# Publicar o Louvai no GitHub Pages (uso: `npm run deploy` — depois de commitar o código pelo ritual).
#
# Regra do louvai.json: o REMOTO é a fonte da verdade (repertório e escalas são editados no celular
# ou no desktop e publicados na nuvem). Antes de subir, este script:
#   1) baixa o estado do remoto;
#   2) guarda um BACKUP local do louvai.json vivo (backups/, ignorado pelo git);
#   3) ADOTA esse louvai.json (nunca regride os dados da equipe);
#   4) faz o push. A GitHub Action gera o index.html e atualiza o Pages — não subimos o index à mão.
set -euo pipefail
cd "$(dirname "$0")/.."

echo "→ Buscando o estado atual do remoto…"
git fetch origin main

mkdir -p backups
STAMP="$(date +%Y%m%d-%H%M%S)"
git show origin/main:louvai.json > "backups/louvai-$STAMP.json"
echo "→ Backup do louvai.json vivo salvo em: backups/louvai-$STAMP.json"

# adota o louvai.json do remoto (dados vivos); só cria commit se de fato mudou
git checkout origin/main -- louvai.json
if ! git diff --cached --quiet -- louvai.json; then
  git commit -m "sync: louvai.json vivo do remoto (repertório/escalas atuais)"
  echo "→ louvai.json local atualizado a partir do remoto."
fi

cp louvai.html index.html   # cópia local só p/ abrir no navegador aqui (no deploy a Action gera)

echo "→ Publicando (git push)…"
git push origin main
echo "✓ Push feito. A GitHub Action gera o index.html e atualiza o Pages em ~1–2 min."
echo "  App: https://wesleywps.github.io/louvai/"
