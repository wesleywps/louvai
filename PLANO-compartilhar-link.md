# Plano — Compartilhar repertório e escala por LINK (serverless) + hosting-ready (v0.21.0)

> **Status: ✅ IMPLEMENTADO na v0.21.0** (commit/tag `v0.21.0`). Falta só a tarefa
> **operacional do dono**: hospedar o app no GitHub Pages (Anexo abaixo) e validar o
> link entre celulares em campo. Plano aprovado pelo dono em 2026-06.
>
> **O que foi entregue (código, `louvai.html`):** helpers `bytesToB64url`/`b64urlToBytes`,
> `gzipBytes`/`gunzipBytes` (fallback `r.` sem compressão), `packData`/`unpackData`,
> `buildImportLink`, `shareLink`; ação **"Enviar link"** nas 3 folhas (cifra, escala+cifras,
> repertório com aviso >30 KB); recepção `describeImport`/`handleImportLink` (confirma antes
> de salvar, limpa o hash) ligada no boot e no `hashchange`. Testes no `tests/smoke.mjs`
> (round-trip, gerar link, receber+confirmar, cancelar, link inválido) — **96 verificações**.
>
> **Ajuste pós-campo (v0.21.1):** o dono mandou o **repertório inteiro** (~10 KB) por link
> no WhatsApp e deu "Link inválido" no celular — o **app decodifica certo** (abria no PC), mas
> o **WhatsApp cortou a URL longa**. O aviso de tamanho original (>30 KB, e só no caminho do
> clipboard) não pegou: no celular o Web Share pulava o aviso. Corrigido: aviso **antes** de
> enviar, limite `LINK_MAX≈4000`, e folha que oferece **mandar o arquivo** (sem corte). Lição
> de produto: **link = escala curta**; **repertório/escala grande = arquivo** (anexo, não cola).
>
> **Armadilhas aprendidas (p/ não repetir):**
> - `openSheet` só adiciona `.show` ao `#sheet` num `requestAnimationFrame` → ao testar a
>   confirmação, **espere** (waitForTimeout) antes de checar o `.show`.
> - `CompressionStream`/`DecompressionStream`: ao falhar (dado não-gzip), o **writer** rejeita
>   em paralelo ao `readable` → engolir a rejeição do writer (`.write().catch()`/`.close().catch()`)
>   pra não vazar "unhandled rejection"; o erro real continua saindo pelo `readable` (capturado).
> - Limpar o hash com `history.replaceState` (NÃO dispara `hashchange`, evita reentrada) e
>   **antes de qualquer `await`**; fallback `location.hash=""` p/ `file://`.

## Contexto

Hoje o app compartilha por **arquivo `.json`** (Web Share nativo + download de fallback) e
importa por seletor de arquivo (`importJSON`). Funciona, mas **receber** é trabalhoso
(baixar o arquivo, achar "importar"). O dono quer validar o app na comunidade **sem
backend** e pediu uma forma simples de a pessoa **receber** a escala e o repertório.

**Decisões confirmadas com o dono:**
- **Hospedar o app numa URL fixa** (hospedagem estática grátis, ex.: GitHub Pages —
  serve só o arquivo, **não é backend**; dados continuam só no aparelho). Isso torna
  os links tocáveis entre celulares.
- **Transportes desta rodada:** (1) **link auto-importável** (dados embutidos na URL,
  sem upload, funciona offline ao receber) — principal, ótimo pra **escala**;
  (2) **arquivo `.json`** (já existe) — plano B universal e o caminho do **repertório
  inteiro** (grande).
- **QR e "importar de URL (Drive)" ficam para depois** (entram após validar o link).
- Online/remoto com backend é fase futura — fora de escopo agora.

**Princípio que segura tudo:** `importJSON()` (louvai.html:~1478) já é o **sink universal**
— aceita `louvai-song`, `louvai-escala` (com cifras juntas) e `louvai-library`, dedup por
`id` com resolução por `updatedAt` (via `mergeSongs`, :~1462), e tolera `levita-*`. Então o
trabalho é só **levar o JSON até o `importJSON`** por um novo transporte (link), com uma
**confirmação antes de salvar** (respeita "nada salvo no escuro" e protege contra link malicioso).

Resultado: **v0.21.0** (recurso). Ritual completo, commit **sem `Co-Authored-By`**.

---

## Arquitetura

### O "link de importação"
`https://<host>/louvai/#imp=<scheme>.<base64url>` — onde o payload é o **mesmo envelope JSON**
de hoje (`{type, version, app, ...}`), comprimido e em base64url no fragmento (`#`). O `#`
nunca vai ao servidor e cabe payloads grandes; a decodificação é 100% no cliente (offline).

- **Empacotar/desempacotar** (novos helpers, no bloco de armazenamento/compart.):
  - `packData(obj)` → `"g."+b64url(gzip(json))` usando `CompressionStream("gzip")` quando
    existir; **fallback** `"r."+b64url(json)` (sem compressão) se indisponível.
  - `unpackData(payload)` → lê o tag (`g.`/`r.`), base64url→bytes, `DecompressionStream`
    se gzip, retorna a string JSON.
  - Helpers `bytesToB64url`/`b64urlToBytes` (btoa/atob sobre binstring, em blocos p/ não
    estourar a pilha). Tudo vanilla, sem dependência (mantém arquivo único).
- **Base da URL:** `location.origin+location.pathname` (funciona em qualquer host; em
  `file://` gera link `file://` — esperado até hospedar).

### Gerar o link (no compartilhamento)
Adicionar a opção **"Copiar/Enviar link"** nas folhas existentes, reusando os envelopes:
- `shareSheet(song)` (:~1426) → link de cifra (`louvai-song`).
- `shareEscalaSheet(id)` (:~1739) → link de escala + cifras (`louvai-escala`).
- Backup `#backupBtn` (:~1442) → link do repertório (`louvai-library`) **com aviso**: se o
  link passar de ~30 KB, avisar "ficou grande — melhor enviar o arquivo". (Arquivo segue
  como caminho primário do repertório.)
- Envio: `navigator.share({title, url})` quando houver; senão `navigator.clipboard.writeText`
  (já usado em :~1435) + toast "Link copiado". Mesmo espírito à prova de falha do `shareFile`.

### Receber (boot + hashchange)
- No boot, **após** `load()/render` (:~1809), chamar `handleImportLink()`; também ligar em
  `window.addEventListener("hashchange", ...)` (link tocado com o app já aberto).
- `handleImportLink()` (async): se `location.hash` começa com `#imp=`, `unpackData` →
  `JSON.parse` → `describeImport(data)` (rótulo: "Escala 'X' (N cifras)" / "Cifra 'Y'" /
  "Repertório (N cifras)") → **confirmação** via `openSheet` com ações **Importar / Cancelar**.
  - Confirmar → `importJSON(jsonText)` (reusa toda a lógica/merge atual) → toast.
  - Sempre **limpar o hash** (`history.replaceState`) pra um refresh não reimportar.
  - Link corrompido/inválido → toast "Link inválido 😕" (sem quebrar o boot).
- A confirmação é deliberada: importar dados vindos de um link é dado não confiável —
  o usuário revisa antes de mesclar (e o `esc()` da v0.13.2 já blinda XSS na exibição).

### Hosting-ready (sem quebrar arquivo único)
O **código** já fica pronto pra rodar em qualquer URL (boot lê o hash; link usa a base da
location). **Não** adicionar manifest/service worker nesta rodada — eles exigiriam arquivos
extras (conflito com a regra "arquivo único") e são um incremento próprio (PWA instalável +
offline garantido). **Atenção honesta:** hospedado **sem** service worker, o app depende do
cache do navegador (1º acesso e atualizações pedem internet). Para validação isso basta; o
**PWA offline/instalável fica como próximo passo** (a decidir junto com o trade-off do
arquivo único). Documentar o passo a passo de publicação no README.

### Fora de escopo (próximos passos, anotar no ROTEIRO)
- **QR Code** (do link curto / via Drive) — depois de validar o link.
- **Importar de URL (Drive/Dropbox/Gist)** — `fetch`+`importJSON`, para payloads grandes
  por link curto (atenção a CORS).
- **PWA instalável + offline garantido** (manifest + service worker; decidir arquivo único).

---

## Implementação (em `louvai.html`, salvo indicado)

1. **Helpers** (perto de `shareFile`/`download`): `bytesToB64url`, `b64urlToBytes`,
   `packData`, `unpackData`, `buildImportLink(envelopeObj)` (= base + `#imp=` + packData).
2. **Compartilhar link**: nova ação nas 3 folhas (`shareSheet`, `shareEscalaSheet`, backup);
   função única `shareLink(envelopeObj, title)` (Web Share `{url}` → fallback clipboard;
   aviso de tamanho).
3. **Receber**: `describeImport(data)`, `handleImportLink()` (async, confirma via `openSheet`),
   chamada no boot + listener `hashchange`, limpeza do hash.
4. **README.md**: seção **"Publicar (hospedar)"** — passo a passo GitHub Pages/Netlify Drop,
   nota de privacidade (código público, dados locais), e como o link de importação funciona.
5. **Ritual**: `APP_VERSION`+`package.json`+`package-lock.json` = 0.21.0; CHANGELOG; ROTEIRO
   (linha do tempo, Tema A/E backlog, ordem, rodapé); CLAUDE.md (anatomia: link import);
   `tests/smoke.mjs`; commit+tag; cópia de distribuição (apagar antigas).

## Testes (`tests/smoke.mjs`)
- **Round-trip dos helpers:** `packData`/`unpackData` de um envelope de escala devolve o
  JSON idêntico (testa gzip e o fallback).
- **Gerar link:** `buildImportLink({type:"louvai-escala",...})` começa com a base +
  `"#imp="` e o payload tem tag válido.
- **Receber por link (fluxo):** em page context, montar o payload de uma escala nova (com
  1 cifra), setar `location.hash="#imp=..."`, disparar `handleImportLink()`; conferir que
  abre a confirmação; clicar **Importar**; asserir que a escala entrou em `escalas` e a
  cifra em `songs` (reuso do `importJSON`), e que o hash foi limpo.
- **Cancelar não importa:** acionar o link e cancelar → `escalas`/`songs` inalterados.
- **Link inválido:** `#imp=` lixo → toast de erro, sem exceção (jsErrors==0).
- **Regressão:** os fluxos atuais de arquivo (`importJSON` de `louvai-song/escala/library`,
  `levita-*`) continuam passando.
- `npm test` verde (Chromium headless suporta Compression/DecompressionStream).

## Verificação ponta-a-ponta
1. `npm test` verde.
2. Manual: numa escala, "Compartilhar → Enviar link"; abrir o link gerado noutro contexto
   (ou colar o `#imp=` na URL) → confirmação correta → escala + cifras importadas; repetir
   cancelando. Conferir que repertório grande avisa pra usar o arquivo.
3. **Hospedar (o dono):** publicar no GitHub Pages/Netlify, abrir a URL no celular,
   gerar link numa escala e mandar no WhatsApp pra outro aparelho → tocar → importar.

## Arquivos
- `louvai.html` — helpers de pack/link, `shareLink` nas 3 folhas, `handleImportLink`/
  `describeImport` + boot/`hashchange`.
- `tests/smoke.mjs` — round-trip, geração de link, fluxo de receber, cancelar, link inválido.
- `README.md` — seção "Publicar (hospedar)".
- `CHANGELOG.md`, `ROTEIRO-louvai.md`, `CLAUDE.md`, `package.json`, `package-lock.json` — ritual.

---

## Anexo — Publicar no GitHub Pages (passo a passo, ~10 min, uma vez)

> Tarefa do **dono** (operacional, não é código). Hospedagem estática grátis: o GitHub
> só entrega o arquivo quando alguém abre o endereço — **sem backend**. Os dados das
> pessoas continuam só no aparelho; o que fica público é o **código** do app (já era
> compartilhável). O link de importação é montado no celular e enviado direto (WhatsApp);
> o GitHub nunca vê os dados.

**Conta do dono:** https://github.com/wesleywps (já existe). A URL final do app será
**`https://wesleywps.github.io/louvai/`**.

1. **Criar o repositório:** logado como `wesleywps`, abrir https://github.com/new.
   - *Repository name:* `louvai` (a URL do Pages vira `wesleywps.github.io/louvai/`).
   - Visibilidade: **Public** (o Pages grátis serve repositório público).
   - Marcar **Add a README** (opcional) e clicar **Create repository**.
2. **Subir o app como `index.html`:** o GitHub Pages serve o `index.html` na raiz da URL,
   então o arquivo do app vai com esse nome.
   - No repositório: **Add file → Upload files**.
   - Arrastar o `louvai.html` mais recente, mas **renomeado para `index.html`**
     (mesmo conteúdo; pode renomear no computador antes, ou após subir usar
     *Edit → rename* para `index.html`).
   - Escrever a mensagem (ex.: "publica vX.Y.Z") e **Commit changes**.
3. **Ativar o Pages:** no repositório, **Settings → Pages** (menu lateral).
   - *Source:* **Deploy from a branch**.
   - *Branch:* **main** · pasta **/ (root)** → **Save**.
4. **Pegar a URL:** aguardar ~1 min e recarregar a página de Pages; aparece
   **"Your site is live at `https://wesleywps.github.io/louvai/`"**.
   - Esse é o endereço pra compartilhar com a comunidade.
5. **No celular:** abrir `https://wesleywps.github.io/louvai/` → menu do navegador →
   **"Adicionar à Tela de Início"** (vira um ícone/app). Pronto: ao gerar "Enviar link"
   numa escala, o app já produz `https://wesleywps.github.io/louvai/#imp=…`
   (a base vem da própria URL).

**Atualizar pra uma versão nova:** repetir o passo 2 (Upload files / substituir o
`index.html`) e commitar — em ~1 min todos pegam a versão nova ao reabrir, **sem reenviar
arquivo**. (As cópias `louvai-vX.Y.Z.html` do ritual servem pra isso: subir a mais recente
renomeada como `index.html`.)

**Alternativa sem conta/git — Netlify Drop:** abrir https://app.netlify.com/drop e
**arrastar o `index.html`** → recebe uma URL na hora (criar conta grátis só pra fixar a URL).
Bom pra um teste rápido; o GitHub Pages é melhor pro uso contínuo (URL estável + atualizações).

**Limitação honesta (offline):** hospedado **sem** service worker, o 1º acesso (e checar
atualização) pede internet; depois o navegador costuma cachear. Offline 100% garantido +
instalável "de verdade" é o próximo passo (PWA: manifest + service worker — a decidir junto
com o trade-off do "arquivo único").
