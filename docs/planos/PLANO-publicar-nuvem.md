# Plano — "Publicar na nuvem" (editar no celular → escrever no louvai.json via GitHub) — v0.27.0

> **Como retomar:** abra o Claude Code nesta pasta e peça
> *"vamos executar o PLANO-publicar-nuvem.md"*.
> **Status: ✅ IMPLEMENTADO na v0.27.0** (commit/tag `v0.27.0`).
>
> **Entregue:** `bytesToB64` (fatorado), `ghRepoFromUrl`, `publishRepo` (GET sha → PUT, 404 cria,
> 409 rebusca+retry, erros tratados), `settings.ghToken`/`repoPublishedAt`, bloco "Publicar
> (líder)" na folha da nuvem (token oculto + "Publicar na nuvem" + "Remover token") e
> `repoStatus` mostrando baixou…/publicou… README ganhou o passo do token. **149 verificações**
> (incl. `publishRepo` com `fetch` **stubado** — sem rede real no CI).
>
> **Armadilhas/decisões registradas:**
> - GitHub quer **base64 padrão** (não url-safe) → `bytesToB64` separado do `bytesToB64url`.
> - Testar publish sem tocar a rede: **stub do `window.fetch`** no contexto da página (restaurado
>   num `finally`); sem-token / URL não-GitHub retornam **antes** do fetch.
> - 1ª publicação: GET dá **404** → publica **sem `sha`** (cria o arquivo). Depois, sempre manda o `sha`.
> - Token **só no `localStorage`** do aparelho, **fora do código público**; "Remover token" + revogar no GitHub.
>
> **Evolução v0.27.1 — diff ao publicar:** antes de escrever, o app lê o arquivo atual
> (`ghGetCurrent`) e mostra **+/− cifras/escalas** (`diffRepo`) numa **confirmação** — feedback e
> **rede de segurança** (publicar de aparelho desatualizado mostra "−N" e avisa antes de remover).
> `doPublish` separado da confirmação. **153 verificações**.
>
> *(Plano original abaixo; decisões mantidas.)* App estava na v0.26.0 ao planejar.

## O que é
Fecha o ciclo da nuvem: hoje a app **puxa** (v0.26.0). Aqui ela passa a **escrever** o
`louvai.json` **direto do celular**, sem servidor nosso, usando a **API do GitHub** (que aceita
escrita do navegador — manda CORS; o Drive não). Fluxo do líder vira **"editar → Publicar"**.

> **Verdade que define tudo:** escrever na nuvem **não é anônimo** — exige **credencial**.
> "Simplificado" = a autenticação é feita **uma vez** (um token), depois é um toque.

## Decisões confirmadas com o dono (2026-06)
- **Token do GitHub no app** (escolhido), não mini-backend nem Drive.
- **Um publicador (o líder)** tem o token; a equipe continua só **puxando**.
- O token fica **só no aparelho** (`localStorage`), **nunca no código** (que é público).

## Arquitetura

### Credencial e destino
- `settings.ghToken` — **fine-grained PAT**, guardado no `localStorage` (no aparelho).
- **Destino derivado da URL de pull** (`settings.repoUrl`): `ghRepoFromUrl()` extrai
  `https://OWNER.github.io/REPO/PATH` → `{owner, repo, path}` (site de projeto) ou
  `https://OWNER.github.io/PATH` → `repo = OWNER.github.io` (site de usuário). Não-GitHub → erro
  claro ("Publicar só funciona com URL do GitHub Pages"). Sem campos extras além do token.

### Publicar (`publishRepo()` async, API Contents do GitHub)
1. Sem token / URL não-GitHub → toast orientando (não chama a rede).
2. **GET sha:** `GET api.github.com/repos/{o}/{r}/contents/{path}` (`Authorization: Bearer`,
   `Accept: application/vnd.github+json`). 200 → pega `sha`; 404 → 1ª publicação (sem sha);
   401/403 → "Token inválido ou sem permissão".
3. **PUT:** `PUT .../contents/{path}` com `{message:"atualiza louvai.json (vX.Y.Z)",
   content: base64(JSON do fullEnvelope()), sha?}`.
   - 200/201 → "Publicado ✓" + `settings.repoPublishedAt=Date.now()`.
   - **409 (sha velho / mudou na nuvem):** re-GET do sha e **uma** nova tentativa; se falhar →
     "Mudou na nuvem — atualize e tente de novo".
   - rede caiu → "Não consegui publicar — sem internet?".
- **Base64 padrão:** `bytesToB64(new TextEncoder().encode(json))` — fatorar do `bytesToB64url`
  (que já faz btoa em blocos; a versão url-safe vira `bytesToB64`+replace). GitHub quer base64 padrão.

### UX (na folha "Repertório na nuvem", separando Baixar × Publicar)
- **Baixar** (já existe): URL + "Atualizar do link".
- **Publicar** (novo bloco): campo **token** (`#gh-token`, type=password) + botão
  **"Publicar na nuvem"** + linha "Última publicação: …". Uma linha de ajuda curta e um
  resumo do passo do token (e link pro README).
- Texto honesto: "O token fica só neste aparelho. Use um token **fino** (só este repositório,
  Contents: escrever). Você pode revogar quando quiser."

### Passo do token (vai no README + resumo na UI)
1. github.com → Settings → Developer settings → **Fine-grained tokens** → Generate new token.
2. **Repository access:** Only select repositories → o repo `louvai`.
3. **Permissions:** Repository → **Contents: Read and write**.
4. **Expiration:** definir (ex.: 90 dias) — é revogável a qualquer momento.
5. Gerar, copiar e colar no app (↥ → Repertório na nuvem → Publicar).

## Implementação (em `louvai.html`)
1. `bytesToB64` (fatorado), `ghRepoFromUrl(url)`, `publishRepo()` (+ `settings.ghToken`/`repoPublishedAt`).
2. Folha "Repertório na nuvem": bloco Publicar (token + botão), salvar token, status.
3. **Ritual** (recurso → **v0.27.0**): versão (html+package+lock); CHANGELOG; ROTEIRO
   (Tema E/A; capacidades; rodapé); README (seção do token); CLAUDE.md (anatomia: publish);
   `tests/smoke.mjs`; commit+tag; `index.html`/cópia.

## Testes (`tests/smoke.mjs`)
- **`ghRepoFromUrl`**: `…/louvai/louvai.json` → `{wesleywps,louvai,louvai.json}`; site de usuário;
  URL não-GitHub → null.
- **`bytesToB64`**: base64 padrão de uma string conhecida (round-trip com `atob`).
- **`publishRepo` (fetch stubado):** sobrescreve `window.fetch` no contexto da página, simula
  GET sha (200) + PUT (200); confere que o PUT foi chamado **com `Authorization: Bearer`** e
  **`content` em base64** do snapshot; e que `repoPublishedAt` foi gravado.
- **Sem token** → toast orientando, **sem** tocar a rede.
- **URL não-GitHub** → toast de erro, sem exceção.
- `npm test` verde.

## Segurança (cuidados honestos)
- Token **só no aparelho**, **fora do código** (público). Worst case se vazar: escrever no
  **único** repo (defacing do `louvai.json`/site), não catástrofe — e **revogável**.
- Mitigações: token **fino**, **single-repo**, **Contents only**, **com validade**.
- O app já escapa saída (`esc()`, v0.13.2); manter essa higiene (token + XSS seria o risco real).
- **Um publicador.** Espalhar o token pela equipe = risco e conflito. Equipe = pull.

## Limites / fora de escopo
- **Last-write-wins** (com retry no 409). Merge colaborativo real = fase online de verdade.
- Sem **login OAuth** (Google/GitHub App) — é o PAT, mais simples pro caso de um líder.
- Publicar de **dois aparelhos** do mesmo líder: o 409+retry resolve o caso comum; edições
  simultâneas de verdade não são o alvo.

## Arquivos
- `louvai.html` — `bytesToB64`, `ghRepoFromUrl`, `publishRepo`, bloco Publicar na folha da nuvem.
- `tests/smoke.mjs` — derivação da URL, base64, publish stubado, erros.
- `CHANGELOG.md`, `ROTEIRO-louvai.md`, `README.md`, `CLAUDE.md`, `package.json`, `package-lock.json`.
