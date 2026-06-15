# Plano — Repertório + escalas por LINK (pull do GitHub Pages) — v0.26.0

> **Como retomar:** abra o Claude Code nesta pasta e peça
> *"vamos executar o PLANO-repertorio-link.md"*.
> **Status: DECIDIDO — AGUARDANDO OK PRA EXECUTAR.** App na v0.25.0.

## O que é
Um **retrato completo** do ministério (cifras + escalas) publicado num **arquivo único**
hospedado (GitHub Pages, que o dono já usa pro app). A app **busca esse link e mescla** no
aparelho — então **celular novo** pega tudo de um link, e a **equipe** atualiza repertório +
escalas de tempos em tempos. **Mão única:** o líder **publica**, a equipe **puxa** (escrever de
volta = fase online, com login — fora de escopo aqui).

> **Complementar, não concorrente:** o **link por WhatsApp** (v0.21.0) segue sendo o jeito de
> mandar **a escala deste domingo agora**. O **"Atualizar do link"** é o **todo** (novo aparelho,
> refresh periódico). Um empurra pontual; o outro puxa o retrato completo.

## Decisões confirmadas com o dono (2026-06)
- **Snapshot único:** um `louvai.json` = `{type:"louvai-full", songs:[...], escalas:[...]}`.
  Um link, um botão, uma publicação. Cifras aparecem **uma vez** em `songs`; escalas só
  **referenciam** por `id` (arquivo compacto mesmo com dezenas de escalas).
- **Publicar COM a equipe:** o snapshot leva o campo `team` (nomes). O dono ciente de que o
  arquivo é público (repo grátis = world-readable) e aceita publicar os nomes.
- **Hospedagem:** GitHub Pages (CORS liberado, confiável; **o Drive não serve** — CORS na
  leitura + OAuth na escrita). Arquivo ao lado do `index.html`:
  `https://wesleywps.github.io/louvai/louvai.json`.

## Arquitetura

### Publicar (lado do líder)
- **Novo "Exportar tudo (repertório + escalas)"** no Backup: gera o envelope
  `{type:"louvai-full",version:1,app:APP_VERSION,songs,escalas}` (hoje o export é só
  `louvai-library`, sem escalas). O líder sobe esse arquivo como `louvai.json` no repositório
  (mesmo gesto de subir o `index.html`). O git **versiona** o repertório de graça.

### Receber (lado da equipe)
- **Setting `settings.repoUrl`** (URL do snapshot), guardado no localStorage.
- **`pullRepo()`** (async): `fetch(url + (httpUrl?"?t="+Date.now():""))` — **fura-cache** pro
  CDN não servir versão velha (só em http(s); data:/blob: sem query) → `importJSON(texto)`.
  - Sucesso → reusa toda a mesclagem (abaixo) + toast com o resumo.
  - Sem internet / 404 → "Não consegui buscar — sem internet?" (não quebra nada).
  - Conteúdo inválido → "O link não tem um repertório válido".
- **`importJSON` entende `louvai-full`:** o pré-check de **título duplicado** (`collidingTitles`)
  usa `data.songs`; o `doImport` ganha um ramo `louvai-full` que **mescla cifras** (`mergeSongs`,
  com a política escolhida na folha de aviso) **e cada escala** (dedup por `id`, resolução por
  `updatedAt`; `done`/`team` viajam), depois `saveSongs`/`saveEscalas`/render + toast.

### UX (folha "Repertório na nuvem")
- Aberta a partir do Backup. Contém:
  - **campo de texto** com a URL (`#repo-url`) + **"Salvar link"**;
  - **"Atualizar agora"** (chama `pullRepo`);
  - **"Exportar tudo (pra publicar)"** (gera o `louvai.json`);
  - linha de status: último "atualizar do link" (reusa o estilo do `backupNote`).
- Mão única e honesta: a folha explica em uma linha que **puxa** (não escreve de volta).

### Mesclagem (já temos quase tudo)
- Cifras: `mergeSongs` (dedup `id` + `updatedAt`, **aviso de título duplicado** da v0.22.0).
- Escalas: dedup por `id`, sobrescreve só com `updatedAt` ≥ (igual ao ramo `louvai-escala`).
- **Sinergia:** como `done` viaja, a recência **"última vez que tocamos"** (v0.24.0) fica
  igual pra equipe quando o líder publica os cultos realizados.

## Implementação (em `louvai.html`)
1. **Exportar tudo:** item no Backup → `shareFile("louvai.json", JSON.stringify(envelopeFull), …)`.
2. **importJSON:** reconhecer `louvai-full` no pré-check e no `doImport` (mesclar songs + escalas).
3. **pullRepo + settings.repoUrl** + folha "Repertório na nuvem" (`openRepoSheet`), com fura-cache
   e erros tratados.
4. **Ritual** (recurso → **v0.26.0**): versão (html+package+lock); CHANGELOG; ROTEIRO
   (Tema E: marcar "importar de URL"; capacidades; rodapé); README (seção "Repertório na nuvem");
   CLAUDE.md (anatomia: pull/`louvai-full`); `tests/smoke.mjs`; commit+tag; `index.html`/cópia.

## Testes (`tests/smoke.mjs`)
- **Exportar tudo:** o envelope gerado é `louvai-full` e tem `songs` **e** `escalas`.
- **importJSON `louvai-full`:** mescla cifras E escalas (entram/atualizam por `id`/`updatedAt`).
- **pull (fluxo):** `settings.repoUrl` = uma **`data:` URL** com um snapshot; `pullRepo()` mescla
  no aparelho (cifra + escala entram). (Fura-cache desligado p/ `data:`.)
- **Erro tratado:** URL inválida → toast de erro, `jsErrors==0` (sem exceção).
- **Sem regressão:** os imports atuais (`louvai-song/escala/library`, `levita-*`, `#imp=` link,
  aviso de duplicado) continuam passando.
- `npm test` verde.

## Limites honestos (MVP)
- **Mão única** (pull). Escrever de volta (todos sincronizam) = **fase online**, com login.
- **Publicar é manual** (líder sobe o `louvai.json`). Automatizar = token do GitHub (futuro).
- **Apagar não propaga** (mescla só adiciona/atualiza). "Substituir tudo" = opção futura.
- **Arquivo público** com os nomes da equipe (escolha do dono).
- **`id` alinhado:** funciona melhor se a equipe **partir do snapshot do líder** (ids viajam);
  repertórios montados em separado podem gerar duplicatas de título (o aviso da v0.22.0 ameniza).

## Arquivos
- `louvai.html` — `louvai-full` (export + import), `pullRepo`, `settings.repoUrl`, folha da nuvem.
- `tests/smoke.mjs` — exportar tudo, importar full, pull por `data:` URL, erro.
- `CHANGELOG.md`, `ROTEIRO-louvai.md`, `README.md`, `CLAUDE.md`, `package.json`, `package-lock.json`.

## Fora de escopo (próximos)
- **Sync de duas vias** (login/OAuth ou token; resolução de conflito) — fase online.
- **"Substituir tudo"** (espelhar o arquivo, propagando remoções) — com confirmação forte.
- **Auto-atualizar ao abrir** (hoje é botão manual).
