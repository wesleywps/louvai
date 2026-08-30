# Plano — Botão "voltar" do celular navega dentro do app

> **Como retomar:** abra o Claude Code nesta pasta e peça
> *"vamos executar o PLANO-botao-voltar.md"* (ou *"vamos pro Incremento 1 do botão voltar"*).
>
> **Status: ✅ CONCLUÍDO na v0.57.0** (Inc. 1 e Inc. 2 juntos). _(Planejado com o app na v0.56.0.)_
> **Desenho validado adversarialmente ANTES de codar** (protótipo injetado no `louvai.html` e medido
> no Playwright: as **9 falhas** da seção "Validação adversarial" apareceram no protótipo e já
> nasceram corrigidas no código). Na entrega: **17 casos novos** na suíte (388 verificações no total),
> com clique real do controle e medição do render — inclusive `elementFromPoint` provando que o item
> da folha ficou clicável (a falha #2).

Pedido de campo: **no celular, o botão voltar sai do app.** Se a pessoa está com o ⚙ Ajustes aberto
no meio da Apresentação e toca em voltar (gesto reflexo no Android), o navegador **fecha o Louvai**
em vez de fechar o painel. Queremos que o voltar do sistema signifique **"voltar uma camada"**:
fecha a folha → sai do player → volta pra lista; e **só sai do app quando já está na lista**.

---

## Por que hoje ele sai
O app **nunca cria entradas de histórico**. `show(v)` (`louvai.html:1573`) só troca a classe `hidden`
das 5 views e as folhas só ganham/perdem a classe `.show` (`openS`/`closeS`, `louvai.html:3220`/`3225`).
Para o navegador **a página nunca mudou** — existe uma única entrada, então o voltar só tem uma coisa
a fazer: sair. Nada disso é bug: é o preço de uma SPA que não fala com o histórico.

## Princípio (a regra que evita o caos)
> **O `popstate` é a única fonte da verdade de "voltar".** Nenhum botão fecha camada direto: os ←
> pedem `history.back()`; quem realmente pinta a tela é o handler do `popstate`.

É a mesma disciplina da regra nº3 (`parseChord` como fonte única): **um só caminho** para uma decisão.
Sem isso, o ← da tela e o voltar do sistema divergem e o histórico infla — o clássico "preciso apertar
voltar duas vezes pra sair".

**Escolha de API:** `history.pushState` + `popstate` (clássico). A **Navigation API** virou Baseline em
jan/2026 (Chrome/Edge, Firefox 147, Safari 26.2) e o **CloseWatcher** resolveria os overlays sozinho,
mas nenhum dos dois cobre aparelho antigo nem WebView de app de mensagem — e a equipe usa celular
variado. Ficam como simplificação futura, não como base.

---

## Desenho (validado no app real)

### 1. O `history.state` guarda a PILHA INTEIRA
Cada entrada carrega `{louvai:{stack:[{t,id},…]}}` — uma lista pequena de tipos e ids
(`[{view,lib},{view,player},{sheet,#playersheet}]`). **Por quê:** com a pilha no state, o `popstate`
não precisa "adivinhar o delta" (voltou 1? 3? avançou?) — ele **renderiza a pilha de destino** e pronto.
Isso também sobrevive ao **reload** (medido) e cobre o botão *avançar* do navegador de graça.

### 2. `navRender(stack)` é idempotente
Aplica a pilha ao DOM: mostra a última view da pilha, abre as folhas que estão nela e fecha as que não
estão. Chamar duas vezes com a mesma pilha não faz nada. **Por quê:** fechar por código já mexeu no DOM
antes do histórico sincronizar; a reconciliação precisa poder rodar por cima sem estragar nada.

### 3. Quatro funções, três decisões
```
navSync(stack, "push"|"replace")   // escreve no histórico + guarda a pilha corrente
navOpen(entry)                     // abrir uma camada
navCloseTop(pred)                  // fechar a camada do topo POR CÓDIGO
navRender(stack)                   // pintar (idempotente)
```
`navOpen` decide entre três caminhos — e é aqui que mora quase toda a inteligência:

| Situação | O que faz | Por quê |
|---|---|---|
| A camada do topo é **a mesma** que está abrindo | `replace` | trocar de música na Apresentação não pode virar histórico |
| É uma **view que já está na pilha** | **volta até ela** (`history.go(-n)`) | `exitPlayer`→`openEscala` e `#e-cancel`→`openPlayer` são *voltares* escritos como *aberturas* |
| Qualquer outro caso | `push` | avançou de verdade |

`navCloseTop` remove a camada da pilha lógica **na hora**, marca `navPendingBack++` e agenda o
`history.go(-n)` para o **fim do tick** (microtask). Se uma abertura acontecer no mesmo tick, ela
**coalesce**: vira `replace` (reaproveita a entrada) em vez de back+push.

### 4. Pontos de enxerto no `louvai.html`
| Onde | O que entra |
|---|---|
| `show(v)` (1573) | `navOpen({t:"view",id:v})` no fim |
| `openS` (3220) | `navOpen({t:"sheet",id:sheetSel})` — **funil único das 5 folhas** |
| `closeS` (3225) | fecha o DOM e chama `navCloseTop` |
| `showChordDiagram`/`hideChordDiagram` (1041/1040) | camada própria (**não** passa por `openS`) |
| `setImmersive` (1853) | camada própria + sincronizar no `fullscreenchange` (1867) |
| `clearImpHash` (2802) | **preservar** `history.state` no `replaceState` |
| Boot (3308) | carimbar a raiz **antes** do `handleImportLink()` |
| novo | `addEventListener("popstate", …)` → `navRender` |

Os **38 `closeSheet()`** espalhados **não precisam ser reescritos** um a um: todos desembocam em
`closeS`. Idem `enableSheetDrag` (3232) e os 6 backdrops.

---

## Validação adversarial (o que quebrou de verdade)

Método: um protótipo do gerenciador foi **injetado sobre o `louvai.html` real** no Playwright e
submetido aos caminhos do app (clique real + medição do DOM). Cada falha abaixo **aconteceu**; a coluna
"correção" já está incorporada no desenho acima.

| # | Falha observada | Evidência | Correção obrigatória |
|---|---|---|---|
| 1 | **Raiz não carimbada** no boot: o 1º `push` virou `replace` e o 2º voltar **saiu do app** | URL foi para `about:blank` | `navSync([raiz],"replace")` no boot, **antes** de qualquer coisa |
| 2 | **Combo fechar+abrir no mesmo tick** (o `#p-share`/`#p-edit` recolhem o ⚙ desde a v0.51.2): o `back` assíncrono chegou **depois** do `push` e fechou a folha errada — o **⚙ ficou por cima** do shareSheet | o item "Editar cifra" virou **não-clicável** (timeout do Playwright = dedo do usuário não acerta) | coalescência: `navPendingBack` + `replace` |
| 3 | Coalescência ingênua **trunca a pilha** (`lib>#sheet`, sem o player) | pilha medida | ao coalescer é `[...pilha, nova]` com `replace` — **nunca** `slice(0,-1)` |
| 4 | `exitPlayer()`→`openEscala()` **empilharia a escala ao voltar** (back nunca sairia) | pilha `lib>escala` após `#pv-back` (correto só com a regra) | regra "view já na pilha = voltar até ela" |
| 5 | `#e-cancel`→`openPlayer()` e `#es-back`/`#ee-cancel` têm o mesmo formato de *voltar escrito como abertura* | pilha `lib>player` após cancelar | idem #4 (a regra cobre os quatro) |
| 6 | **Diagrama de acorde fora do funil** (`classList` direto): com o diagrama aberto, o voltar **sai do player** | medido: `lib=true, diag=true` | camada própria em `showChordDiagram`/`hideChordDiagram` |
| 7 | **Tela cheia fora da pilha** — e o `requestFullscreen` **é real** (ligou até em headless) | `fullscreen real=true`; pilha inalterada | camada própria + **sincronizar no `fullscreenchange`**: no Android o voltar é consumido pelo browser para sair do fullscreen e **não** dispara `popstate` — sem isso sobra entrada órfã |
| 8 | **`clearImpHash()` apaga o state** (`replaceState(null,…)`) — some a pilha inteira | `antes={"louvai":…}` → `depois=null` | `history.replaceState(history.state, …)` |
| 9 | **Reload** preserva o state mas o app volta pra lista → pilha e tela divergem (voltar vira entrada-fantasma) | state pós-reload com `#playersheet`, tela na lista | no boot: ler `history.state.louvai` e **normalizar** (`replaceState` da raiz) ou restaurar |

**Premissas confirmadas** (não são riscos): `pushState` **funciona em `file://`** (os testes rodam
assim) e **não lança**; o `popstate` é **same-document** (o app não recarrega, o `localStorage` e o
estado em memória continuam); e `pushState` sem mexer na URL **não dispara `hashchange`** — ou seja,
**não colide com o `#imp=`** nem com o `handleImportLink` (3311).

### Armadilhas de implementação registradas
- **`openS` aplica `.show` num `requestAnimationFrame`.** A instrumentação tem que ser **síncrona** na
  chamada, não dentro do rAF, senão a pilha atrasa em relação ao gesto.
- **Nada de "entrada sentinela" no boot.** O Chrome **pula** entradas criadas por `pushState` sem gesto
  do usuário (*history manipulation intervention*) e o `popstate` nem dispara. Empilhar **só em resposta
  a toque** — que é o caso natural aqui.
- **Folhas abertas SEM gesto** (a confirmação de `#imp=` no boot, a colisão de títulos vinda do
  auto-sync) caem nessa intervenção. Decisão: **não empilhar** essas — com elas o voltar continua saindo
  do app, exatamente como hoje. Marcar com um `navSuppress()` em volta da abertura.
- **O que NÃO empilha, por decisão:** virar página no Modo Página, o "livro" entre músicas, trocar de
  aba (`switchTab`, 3203) e o auto-scroll. Histórico é para camadas, não para leitura.
- **Fixture de teste:** item de escala só conta com `kind:"song"` (`songItems`, 2847) — sem isso o
  "Apresentar" não abre e o teste falha por motivo errado.

---

## Incrementos

**Inc. 1 — Núcleo + overlays.** As 4 funções, o `popstate`, a raiz no boot, o funil `openS`/`closeS`,
o `clearImpHash` preservando o state e o diagrama de acorde. Ganho imediato: **fechar folha com o
voltar** (o gesto mais frequente no palco). Nenhuma troca de tela envolvida — risco baixo.

**Inc. 2 — Views + camadas do player.** `show(v)`, a regra "view já na pilha = voltar até ela", a
tela cheia com sincronização no `fullscreenchange` e a normalização pós-reload. Fecha o comportamento.

*(Sugestão de ordem: entregar antes ou junto do **service worker** do `PLANO-pwa.md`. Em modo
standalone não há barra de endereço — o voltar do sistema vira a única saída, e um app instalado que
**fecha inteiro** quando você tenta fechar uma folha é bem pior do que na aba do Chrome.)*

## Testes (Playwright — clique real + render medido, regra do projeto)
Todos abaixo já rodaram contra o protótipo. Na entrega viram casos de `tests/smoke.mjs`:
1. ⚙ aberto no player → `goBack` **fecha o ⚙ e mantém o player** (contagem de `.show` + view visível).
2. Segundo `goBack` volta pra lista; terceiro deixa sair (pilha = 1, raiz).
3. **Regressão da falha #2:** `#p-settings` → `#p-share` → o `#playersheet` **não** pode estar visível
   sobre o `#sheet` (medir a sobreposição, não só o estado lógico) e o item da folha tem que ser clicável.
4. Apresentação: `#es-present` → `#pv-back` **desempilha** (não reempilha a escala); dois `goBack` chegam
   na lista.
5. `#pv-next` (trocar de música) **não** muda a profundidade da pilha.
6. Editor: `#p-edit` → `#e-cancel` volta ao player sem empilhar; `goBack` no editor idem.
7. Diagrama aberto → `goBack` **fecha o diagrama e mantém o player**.
8. Tela cheia → `goBack` sai da tela cheia e **mantém** a Apresentação (e o `fullscreenchange` não
   deixa entrada órfã).
9. `clearImpHash()` **preserva** `history.state.louvai`.
10. Reload no meio da navegação → sem entrada-fantasma (voltar não fica "sem efeito").
11. Regressão do `#imp=`: importar por link continua funcionando (a suíte já cobre; garantir verde).

## Riscos que os testes NÃO cobrem (honestidade)
- A **intervenção do Chrome** não se reproduz em headless — a mitigação (empilhar só com gesto) vem da
  documentação do Chromium, não de medição.
- **Android/PWA standalone** e o **swipe de borda do iOS** só se verificam no aparelho. O swipe do iOS
  usa o mesmo histórico (funciona de graça) e **não pode ser desabilitado** — vale conferir se ele
  briga com o toque nas laterais do Modo Página.
- `history.scrollRestoration`: ao voltar pro player o conteúdo é re-renderizado; se aparecer salto de
  rolagem, passar para `"manual"` e guardar a posição na entrada da pilha.

## Arquivos
- `louvai.html` — bloco novo "Navegação / botão voltar" + os 8 enxertos da tabela.
- `tests/smoke.mjs` — os 11 casos.
- Ritual normal na entrega: `APP_VERSION` + `package.json`, `CHANGELOG.md`, `ROTEIRO-louvai.md`,
  `README.md` e o status deste plano.
