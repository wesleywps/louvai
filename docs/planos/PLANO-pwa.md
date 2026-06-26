# Plano — PWA instalável e offline 100% (Tema A)

> **Como retomar:** abra o Claude Code nesta pasta e peça
> *"vamos executar o PLANO-pwa.md"* (ou *"vamos pro Incremento 1 do PWA"*).
>
> **Status: 🟡 EM ANDAMENTO.** App na **v0.45.0** ao planejar. **Ícone + `manifest.webmanifest`
> mínimo entregues na v0.46.0** (favicon + tela inicial iOS/Android, **sem service worker**); falta o
> **service worker** (instalável + offline 100%) — o Incremento 1 abaixo.
> **Revisado após validação adversarial** (4 lentes: técnica/APIs, fit do projeto,
> testabilidade, completude/risco — todas pediram mudanças; incorporadas abaixo).
> Este plano **encerra a regra "arquivo único"** (ver `CLAUDE.md`, seção "Horizonte"):
> a partir do Inc.1 o repositório passa a ter `manifest.webmanifest`, `sw.js` e ícones
> como **arquivos separados**. **O que NÃO muda:** offline-first, **JS vanilla**, **sem
> etapa de build**, **sem dependências em runtime** e **sem backend**.

---

## O que é
Transformar o Louvai num **PWA**: **instalável** na tela inicial com ícone próprio, **abrindo
offline** (depois do 1º acesso já visitado) e — onde o sistema suportar — recebendo conteúdo
**compartilhado** de outros apps. Hospedado no GitHub Pages (`usuario.github.io/louvai/`),
continua **estático, sem backend**.

**Por que agora:** fecha o último furo do app hospedado (offline de verdade), dá cara de app
nativo (instala, ícone, splash) e destrava a organização multi-arquivo.

---

## Decisões técnicas (consolidadas após a validação adversarial)
Estas decisões mudaram em relação ao 1º rascunho — registradas com o **porquê** pra não
repetir o erro.

1. **Estratégia de cache = cache-first do shell, a partir de um precache VERSIONADO.**
   **Descartamos `network-first` na navegação** (rascunho original): em **wifi cativo/ruim**
   (cenário clássico de palco) o `fetch` de navegação **fica pendente segundos** em vez de
   falhar → tela branca no domingo de manhã. Cache-first serve o shell **na hora** (offline-first
   de verdade) e a atualização vem pelo ciclo de vida do SW + toast (item 3). *(Alternativa
   considerada: stale-while-revalidate — vale só se o conteúdo mudar fora de release; como aqui
   o shell só muda **por versão**, cache-first + versão é mais simples e suficiente.)*

2. **A versão do cache é LITERAL no `sw.js` e entra no ritual (3º lugar de versão).**
   Sem etapa de build, **nada substitui** um placeholder `<APP_VERSION>` — então `sw.js` carrega
   `const SW_VERSION = "0.46.0"` **escrito à mão**, bumpado **junto** com `APP_VERSION` (louvai.html)
   e `version` (package.json). **Por quê:** o browser só reinstala o SW se o **byte** do `sw.js`
   mudar; se uma release não tocar o `sw.js`, o `activate` não roda, o cache não troca e o usuário
   **offline fica preso na versão velha**. ⚠️ **Isto altera o Ritual do `CLAUDE.md`** (passos 3 e 6
   e o checklist) — registrar ao implementar. Registrar o SW com
   **`register("sw.js", {updateViaCache:"none"})`** (o browser ignora o `Cache-Control`/CDN do
   Pages ao buscar o script) **e** chamar **`registration.update()` no boot** (checa atualização a
   cada abertura).

3. **Atualização controlada já no Inc.1 (sem troca a quente).** O SW **não** chama `skipWaiting()`
   automático — fica em `waiting`. O app detecta `registration.waiting` e mostra um **toast "Nova
   versão — atualizar"** (reusa o sistema de toast); só no toque ele faz `waiting.postMessage(...)`
   → `skipWaiting` → `controllerchange` → reload. **Por quê:** `skipWaiting`+`clients.claim`
   automáticos trocariam o shell **no meio da Apresentação**. *(Trazido do Inc.2 pro Inc.1 — senão
   o 1º SW já nasce com troca a quente.)* O `clients.claim()` no `activate` **é mantido** (a 1ª
   instalação assume a aba atual e o offline já vale).

4. **Bypass do SW por ORIGIN/PATHNAME (não por string).** No `fetch`:
   - **cross-origin** (`api.github.com`, Google Fonts) → **não intercepta** (`return;`). Cobre o
     pull autenticado (token `Authorization` nunca passa pelo cache).
   - **same-origin terminando em `.json`** → **rede pura** (`respondWith(fetch(req))`). Cobre o
     `louvai.json` (e forks com outro nome em path `.json`). O `?t=`/`cache:'no-store'` do app
     **não** impede o SW de servir do cache — por isso a regra explícita. **Sem essa exclusão, o
     `louvai.json` casaria na regra de estáticos e o pull serviria snapshot velho.**
   - **navegação** (`mode==="navigate"`) → `caches.match("./", {ignoreSearch:true})` (ignora
     `?query`/`#hash` — ex.: `#imp=`); se faltar, cai pra rede.
   - **estáticos same-origin** (ícones/manifest/fontes) → cache-first.
   - **Sem cache dinâmico:** o SW só faz `cache.put` da **lista fixa de precache**. Nunca cacheia
     resposta de dados nem request com `Authorization` (privacidade — snapshot pode ser de repo
     privado).

5. **Kill-switch / à prova de bala (a frota não pode ficar refém de um SW quebrado).** Um SW é
   pegajoso: removê-lo do HTML **não desinstala** os já ativos. Então:
   - todo `fetch`/`install`/`activate` em **try/catch**; em qualquer erro, **degrada pra rede pura**
     (`fetch(event.request)`), nunca serve lixo;
   - manter documentado um **`sw.js` de emergência** que só faz `self.registration.unregister()` +
     `caches.keys().then(ks=>ks.forEach(k=>caches.delete(k)))` + recarrega os clients — publicar
     esse conteúdo (com `SW_VERSION` novo) "desinstala" o PWA da frota na próxima visita.

6. **Chave canônica do shell = `"./"`.** Em produção o Pages serve `/louvai/` ⇒ `index.html`;
   `"./"` e `"index.html"` seriam **duas chaves** pro mesmo HTML. Precacheia-se **só `"./"`** e o
   fallback de navegação responde **sempre `caches.match("./")`**. *(O `louvai.html` "cru" —
   `/louvai/louvai.html`, usado em teste/dev — **não** fica offline-capaz, e isso é documentado;
   o que roda em produção é `/louvai/`.)*

7. **Precache resiliente (não-atômico).** `cache.addAll([...])` é **atômico**: um único 404 (ícone
   com caminho errado sob `/louvai/`) **derruba toda a instalação silenciosamente**. Então: `"./"`
   é **crítico** (`cache.add("./")` — sem ele não há offline), e os demais assets entram com
   `cache.add(u).catch(()=>{})` **individual** (um ícone faltante não mata o shell). O teste
   confere que **cada asset do precache responde 200**.

8. **Registro só em contexto seguro.** `if ("serviceWorker" in navigator && window.isSecureContext)
   { register(...).catch(()=>{}) }`. **Por quê:** em `file://` (a suíte `smoke.mjs` atual)
   `navigator.serviceWorker` existe mas `register` **rejeita** por contexto inseguro → viraria
   `unhandledrejection`/erro de console e **reprovaria os 274 testes**. `isSecureContext` é
   `false` em `file://` e `true` em https/localhost — gate exato do requisito do SW. O `.catch()`
   é cinto-e-suspensório.

9. **Caminhos relativos = fork-safe** (mesma filosofia do `defaultRepoUrl` v0.45.0):
   `manifest.webmanifest` com `"start_url":"./"`, `"scope":"./"`; `register("sw.js")` sem cravar
   `/louvai/`. Funciona em qualquer subpasta/fork sem URL fixa. Adicionar **`"id":"./"`** (ou
   `"/louvai/"`) ao manifest — identidade estável do PWA na instalação/atualização.

---

## Decisões a confirmar com o dono
| # | Decisão | Opções | Recomendação |
|---|---|---|---|
| D1 | **Fontes offline** | (a) manter **fallback de sistema** (Google Fonts é cosmética, com fallback; zero arquivos) · (b) **self-hostar** Inter/Fraunces (woff2 local) | **(a) no Inc.1**; **(b) opcional no Inc.2**. "Offline 100%" **não depende** da fonte (é cosmética; só a aparência muda offline). |
| D2 | **Ícone** | (a) **PNG** 192/512 + maskable + apple-touch-180 · (b) SVG único | **✅ FEITO (PNG, fora do app).** Gerado em **`louvai-icons/`** (`icon-192/512`, `icon-maskable-192/512`, `apple-touch-180` + SVG-fonte `louvai-icon.svg`/`louvai-icon-maskable.svg`) via o `PROMPT-icone.md` — sem build. *(Junto vem `louvai-icons/manifest.json`, rascunho do gerador com `start_url:"/"` — o Inc.1 cria o `manifest.webmanifest` correto na raiz, `./`.)* |
| D3 | **Integração com o SO (Inc.3)** | `share_target` (Android Chrome ✓) × `file_handlers`/`launchQueue` (**desktop Chromium apenas — NÃO dispara no Android**) | **`share_target` é o item de valor no celular** (público-alvo) e vira o **principal** do Inc.3; `file_handlers` é **bônus de desktop**. *(Correção da validação: o rascunho priorizava o item que no celular nem existe.)* |
| D4 | **Cache** | cache-first do shell + precache versionado + atualização controlada (toast) | **Confirmar** (decisão técnica nº1/nº3). |

---

## Incrementos

### Incremento 1 — Instalável + abre offline (MVP) → **v0.46.0**
**Entrega:** instala na tela inicial com ícone e **abre offline** (Android/Chromium garantido;
iOS best-effort, ver Limites), **com atualização controlada** (toast, sem troca a quente).

**Arquivos novos**
- `manifest.webmanifest`: `name`/`short_name` "Louvai", `id:"./"`, `start_url:"./"`, `scope:"./"`,
  `display:"standalone"`, `theme_color:"#121212"`, `background_color:"#121212"`, `lang:"pt-BR"`,
  `icons` (192, 512, **maskable** 512), `categories`.
- `sw.js` (vanilla, pequeno; **tudo em try/catch** — decisão nº5): `const SW_VERSION="0.46.0"`,
  `const CACHE="louvai-shell-"+SW_VERSION`. **install:** `cache.add("./")` crítico + demais assets
  com `.catch()` individual (decisão nº7); **não** chama `skipWaiting`. **activate:** apaga caches
  com prefixo `louvai-shell-` ≠ atual; `clients.claim()`. **message:** `SKIP_WAITING` → `skipWaiting()`.
  **fetch:** regra de bypass da decisão nº4.
- **Já gerados** em `louvai-icons/`: `icon-192.png`, `icon-512.png`, `icon-maskable-192.png`, `icon-maskable-512.png`, `apple-touch-180.png` (+ SVG-fonte).

**Mudanças em `louvai.html`** (reconhecendo o que JÁ existe — head linhas 5-8, `applyTheme` linha 2926)
- **Já existem, NÃO duplicar:** `theme-color #121212` (l.6, **mutado em runtime** por `applyTheme`
  na l.2926 → **manter essa tag única como fonte da verdade; NÃO introduzir `media`**),
  `apple-mobile-web-app-capable` (l.7), `apple-mobile-web-app-status-bar-style:black-translucent`
  (l.8, coerente com `viewport-fit=cover` da l.5 — conferir que o CSS já trata `env(safe-area-inset-*)`).
- **Adicionar o que falta:** `<link rel="manifest" href="manifest.webmanifest">`,
  `<meta name="mobile-web-app-capable" content="yes">` (a `apple-` está deprecada — manter ambas),
  `<meta name="apple-mobile-web-app-title" content="Louvai">`,
  `<link rel="apple-touch-icon" href="louvai-icons/apple-touch-180.png">`.
- **Registro do SW** (decisão nº8): após `load`, gated em `isSecureContext`, com `updateViaCache:"none"`
  + `registration.update()`; detectar `registration.waiting`/`updatefound` → **toast de atualização**
  (decisão nº3); ao tocar, `postMessage("SKIP_WAITING")` e recarregar em `controllerchange`.
- (Opcional) capturar `beforeinstallprompt` e oferecer botão **"Instalar"** discreto.

**Mudanças de repo**
- `.gitignore`: **`!louvai-icons/*.png`** (✅ já aplicado — destrava só os PNGs de `louvai-icons/`;
  não precisa `!louvai-icons/`, pois `*.png` casa arquivos, não a pasta).
- Ritual (`CLAUDE.md`): passo de versão passa a incluir **`SW_VERSION` no `sw.js`**; passo 6 inclui
  subir `manifest`/`sw.js`/`louvai-icons/` (1ª vez) e **re-subir `sw.js` com a versão nova a cada release**.

**Pronto quando (DoD):** manifest válido e instalável; SW `activated` com **scope `/louvai/`** (no
teste, sob subpath); **reload offline abre o app**; **`pullRepo()` offline FALHA limpo** (não serve
`.json` velho do cache); `#imp=` offline ainda importa; cada asset do precache responde 200; `sw.js`
em try/catch; **`smoke.mjs` (274) segue verde** (registro pulado em `file://`); ritual completo
(incl. `index.html` sincronizado e `SW_VERSION`=`APP_VERSION`).

### Incremento 2 — Offline 100% (fontes) + polir atualização → **v0.47.0**
- **Fontes (se D1=b):** woff2 de Inter/Fraunces em `fonts/`, trocar o `<link>` do Google por
  `@font-face` local, **adicionar ao precache** (com `.catch()` individual). Se D1=a, este item cai.
- **Polir atualização:** o toast já veio no Inc.1 (decisão nº3) — aqui refina UX (ex.: não cutucar
  durante a Apresentação; reusar `prefers-reduced-motion`).
- **Pronto quando:** sem rede, a fonte custom carrega (se D1=b); toast de atualização aparece quando
  há SW novo e atualiza **só a pedido**; `sw.js` muda de bytes por release (SW_VERSION bumpado).

### Incremento 3 — Integração com o SO (best-effort) → **v0.48.0**
- **`share_target` (PRINCIPAL — funciona no Android Chrome):** manifest `share_target` (POST,
  multipart, aceita arquivos/texto). Como o host é estático, **o SW intercepta o POST**. **Handshake
  (detalhado — não é trivial):** (1) SW no `fetch` da `action` faz `await event.request.formData()`,
  grava o conteúdo num **Cache/IndexedDB temporário** sob chave conhecida e responde
  `Response.redirect("./?share=1", 303)`; (2) no **boot**, o app detecta `?share=1`, lê o conteúdo
  guardado e chama **`importJSON`** (mesma confirmação "nada salvo no escuro"); (3) limpa o
  temporário e a query. **Definir prioridade vs `#imp=`** (o boot já trata `#imp=` — `share` deve ter
  ordem definida, sem conflito).
- **`file_handlers`/`launchQueue` (BÔNUS — DESKTOP Chromium apenas):** "Abrir com Louvai" pra `.json`
  → `window.launchQueue.setConsumer` roteia pro `importJSON`. **Não dispara no Android/iOS** — por
  isso é bônus de desktop, não o foco.
- **Share nativo no desktop:** `shareFile`/`shareLink` já usam Web Share; instalado, melhora de graça.
- **Pronto quando:** Android consegue compartilhar um `.json` de outro app pro Louvai (handshake →
  `importJSON`); desktop Chromium abre `.json` pelo `file_handlers`; iOS **degrada sem erro**.

---

## Testes (`tests/`)
**Por que uma suíte separada:** o SW exige **contexto seguro** (https/localhost), **não roda em
`file://`**. *(Correção da validação: NÃO é porque o `smoke.mjs` "depende de `file://`" — os testes
de `defaultRepoUrl` são função pura/stub e rodariam igual em http. Mantemos `smoke.mjs` em `file://`
por **zero risco**; o registro do SW é pulado lá via `isSecureContext`.)*

**`tests/pwa.mjs` (novo; sem dep nova — módulo `http` nativo do Node):**
- **Espelhar o subpath de produção:** copiar (`fs.copyFileSync`, portável — não `cp`) `louvai.html`→
  `<tmp>/louvai/index.html` + `manifest`/`sw.js`/`louvai-icons/` pra `<tmp>/louvai/`; servir `<tmp>` e abrir
  **`http://localhost:PORT/louvai/`**. Assim testa a **resolução de scope/registro sob `/louvai/`** —
  a armadilha nº1. **Não** sobrescrever o `index.html` do repo (usa tmp).
- **Servidor:** `server.listen(0)` (porta efêmera, sem colisão), `server.address().port`,
  `server.close()` no `finally`; **mapa de MIME** correto (`.webmanifest`→`application/manifest+json`,
  `.js`→`text/javascript`) — servidor ingênuo manda `text/plain` e **quebra** o registro/parse.
- **Isolamento:** context novo/limpo por execução; `unregister` + `caches.delete` entre casos (SW e
  Cache Storage **persistem** por perfil) — senão um caso contamina o outro.
- **Esperas por CONDIÇÃO, não `waitForTimeout`** (a suíte atual sofre flakiness com timeouts fixos):
  `navigator.serviceWorker.ready`, `controller != null`, `caches.match("./")` resolvido — só então
  `setOffline(true)`+reload.
- **Filtro de console PRÓPRIO** (não reusar o regex do `smoke.mjs`): tolerar o ruído **esperado** de
  offline (`net::`, registration no boot) **só** na fase em que é esperado; reprovar erro real (parse
  do manifest, exceção no consumer). 
- **Casos (Inc.1):** manifest linkado e **parseável** (campos + `scope`/`start_url`/`id` relativos);
  SW **`activated`** e **scope `/louvai/`**; **reload offline abre** (shell do cache); **`pullRepo()`
  offline FALHA limpo** (não serve `.json` do cache — protege a decisão nº4); **`http://localhost/
  louvai/#imp=<payload>` offline ainda importa**; **cada URL do precache responde 200**; sem erro de
  JS (filtro próprio).
- **Casos (Inc.2/Inc.3) — honestos sobre cobertura:** Inc.2 testa o **handler** do toast em
  isolamento (recebe o `postMessage`, mostra toast, só recarrega a pedido) — fluxo "SW novo assume"
  é **manual**. Inc.3 testa (a) manifest tem `share_target`/`file_handlers` válidos e (b) a função
  roteadora chama `importJSON` dado um `File` stub — registro real no SO é **best-effort manual**.
- **`smoke.mjs`:** continua em `file://`; **acrescentar** uma asserção de não-regressão de que o boot
  com o registro do SW (pulado por `isSecureContext`) **não** gera erro de console e a compat
  **`levita-*`** segue intacta.
- **`package.json`:** `test` roda os dois (`node tests/smoke.mjs && node tests/pwa.mjs`) + script
  extra `test:pwa` (iterar sem reexecutar os 274). `test:install` (Chromium) já cobre — sem dep nova.

---

## Limites honestos
- **iOS Safari:** sem prompt de instalação automático; o SW/cache só são confiáveis **após "Adicionar
  à Tela de Início"** (em aba normal o cache pode ser **expurgado** após dias sem uso — ITP) e
  re-popula online. iOS **ignora `theme_color`** do manifest (usa as metas). ⇒ critério de offline:
  **garantido no Android/Chromium instalado; iOS best-effort instalado**. Tudo **degrada sem erro**.
- **Cache é footgun:** mitigado por precache **versionado** + atualização **controlada** +
  `updateViaCache:"none"` + `registration.update()` no boot + try/catch (kill-switch). Qualquer
  mudança no `sw.js` exige o teste de atualização.
- **Deploy é manual** (o dono recusou automatizar): `manifest`/`icons` sobem **1 vez**; o **`sw.js`
  sobe a CADA release** (com `SW_VERSION` novo — senão a frota não atualiza) junto do `index.html`.
- **`/louvai/louvai.html`** (URL "crua") **não** é offline-capaz — só `/louvai/`. Documentado.
- **Não é app de loja** (PWA, não pacote nativo) — decisão do projeto.

## Arquivos
- **Novos:** `manifest.webmanifest`, `sw.js`, `tests/pwa.mjs` (ícones `louvai-icons/*` **já commitados**),
  (D2) `scripts/gen-icons.mjs` opcional, (Inc.2/D1=b) `fonts/*`.
- **Alterados:** `louvai.html` (link manifest + metas que faltam + registro/atualização do SW),
  `.gitignore` (`!louvai-icons/*.png`, ✅ feito), `package.json` (scripts de teste), `tests/smoke.mjs` (não-regressão
  do registro em `file://` + `levita-*`), `index.html` (cópia — sincronizar no ritual),
  **`CLAUDE.md`** (Ritual: `SW_VERSION` como 3º local de versão + subir `sw.js` por release),
  `README.md`/`ROTEIRO-louvai.md`/`CHANGELOG.md` (ritual).

## Fora de escopo (frentes futuras)
- **Split de JS/CSS** do `louvai.html` (refactor de organização — o PWA só **permite**, não exige).
- **Push notifications / Background Sync** (precisam de backend — não necessários).
- **Sync de duas vias** (login/OAuth — fase online).
