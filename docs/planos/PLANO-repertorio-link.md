# Plano — Repertório + escalas por LINK (pull do GitHub Pages) — v0.26.0

> **Como retomar:** abra o Claude Code nesta pasta e peça
> *"vamos executar o PLANO-repertorio-link.md"*.
> **Status: ✅ IMPLEMENTADO na v0.26.0** (commit/tag `v0.26.0`).
>
> **Entregue:** `fullEnvelope`/`exportFull` ("Exportar tudo" → `louvai-full`), `pullRepo`
> (`settings.repoUrl`/`repoPulledAt`, fura-cache em http(s), erros tratados), folha
> "Repertório na nuvem" (`openRepoSheet`/`#reposheet`), `mergeEscala` extraído e o ramo
> `louvai-full` no `importJSON`/`doImport` (mescla cifras + escalas). README ganhou a
> subseção "Repertório na nuvem". **138 verificações** (export-tudo, import full, pull por
> `data:` URL, erro tratado).
>
> **Extensão — auto-sync ao abrir (v0.37.0):** toggle `settings.autoPull` (cartão *Baixar*,
> desligado por padrão); no boot, `maybeAutoPull()` → `pullRepo({silent:true})`. O modo silencioso
> **não** mostra skeleton, **não** abre a folha de conflito de título (usa política "mine" =
> não duplica, remapeia a escala) e **não** mostra erro quando offline; toast discreto só quando
> há novidade. Idempotente (abrir várias vezes não cria cópias). Um link `#imp=` em importação
> tem prioridade. Confirma o caminho: o snapshot **sempre** levou cifras **e** escalas; o "não
> apareceu" do usuário era operacional (esquecer de puxar / cancelar a folha de conflito) — o
> auto-sync remove as duas armadilhas. **190 verificações.**
> **v0.38.0:** o pull silencioso também roda no `visibilitychange` (voltar pro app), com throttle
> de 1 min (`AUTO_SYNC_COOLDOWN`/`lastAutoSync`) — boot sem throttle, retorno com throttle. **192 verificações.**
> **v0.39.0:** `getRepoText(url)` lê o **commit atual** via API Contents (`api.github.com`, reusa
> `ghRepoFromUrl`/`ghGetCurrent`) quando a URL é do GitHub — elimina o atraso do rebuild/CDN do Pages
> (a causa do "sincronizei e veio velho"). Fallback p/ `fetch` do link em 403/erro/404/host não-GitHub.
> `doPublish` carimba `publishedAt`; o pull guarda `repoCloudApp`/`repoCloudAt` e o `repoStatus` mostra
> "nuvem vX · publicada há Y". **Armadilha de teste:** stubs que não implementam `.json()` forçam o
> fallback e, com promessa pendente (M6), travam o `await` num 2º fetch — por isso os testes de pull
> silencioso usam host **não-GitHub** e o caminho GitHub tem teste próprio (`commitPull`). **195 verificações.**
>
> **Extensão — repoUrl padrão derivado do endereço (v0.45.0):** o app **deriva o `repoUrl`** do próprio
> endereço, então o membro abre o app hospedado e **puxa/sincroniza sem colar link**. `deriveRepoUrl(href)`
> (pura) = `new URL("louvai.json", href)` em http(s), `""` em `file://` (ignora `?query`/`#hash`);
> `defaultRepoUrl()` = `deriveRepoUrl(location.href)`; `effectiveRepoUrl()` = link colado (prioridade) **ou**
> o derivado — usado em `pullRepo`/`maybeAutoPull`/`publishRepo`. `openRepoSheet` pré-preenche o campo com o
> padrão (transparência) e `repoUrlFromField()` trata **campo == padrão como "sem override"** (mantém
> `settings.repoUrl=""` → derivação não congela, **fork-safe**). **Auto-sync segue opt-in.** Sem URL cravada
> (qualquer fork funciona). **Armadilha de teste:** `deriveRepoUrl(href)` é pura **de propósito** — em
> `file://` (Playwright) `location` não dá um padrão; os testes de integração (folha/auto-sync) **stubam
> `window.defaultRepoUrl`** (script clássico, reassinável) com uma `data:`/URL fixa. **274 verificações.**
>
> **Decisão registrada (2026-06):** depois da v0.39.0, o **GitHub Pages deixou de ser essencial** para
> o sincronismo — publicar e puxar falam direto com a **API Contents** do repositório. **Decidimos
> MANTER o Pages assim mesmo** (custo zero; é o **fallback** quando a API falha/limita; é a **URL que
> o app entende hoje** — `ghRepoFromUrl` só parseia `owner.github.io/repo/path`; e dá pra inspecionar
> o arquivo no navegador). Para **largar** o Pages no futuro seria preciso: (a) estender `ghRepoFromUrl`
> p/ aceitar `github.com/owner/repo`; (b) manter o repo **público** (equipe puxa sem token); (c) abrir
> mão do fallback pelo link. Enquanto isso não for decidido, **o Pages fica**.
>
> **Armadilhas/decisões registradas:**
> - **Fura-cache só em http(s):** `data:`/`blob:` não aceitam query — o teste usa `data:` URL.
> - `pullRepo` valida que o conteúdo é um tipo de repertório **antes** do `importJSON` (link
>   que devolve HTML/lixo → "não tem um repertório válido", sem quebrar).
> - `importJSON` reusa o **aviso de título duplicado** (v0.22.0) também no `louvai-full`.
> - **Auto-sync não pode prompt nem duplicar** (roda a cada abertura): silencioso = política "mine",
>   idempotente; senão viraria explosão de cópias ou um prompt a cada boot.
>
> *(Plano original abaixo; decisões mantidas.)* App estava na v0.25.0 ao planejar.

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
