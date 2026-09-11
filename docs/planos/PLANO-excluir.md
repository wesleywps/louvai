# Plano — Excluir cifra e escala (deslizar → ações → confirmação → desfazer)

> **Como retomar:** abra o Claude Code nesta pasta e peça *"vamos executar o PLANO-excluir.md"*
> (ou *"vamos pro Incremento 1 do excluir"*).
>
> **Status: ✅ CONCLUÍDO** _(planejado com o app na v0.58.3)._
> **Inc. 1 — v0.59.0:** deslize com Duplicar · Excluir, confirmação em diálogo do app (com as escalas
> em que a cifra está), Desfazer, voltar cancelando e a unificação dos caminhos (432 verificações,
> 26 novas; gesto medido pela geometria).
> **Inc. 2 — v0.60.0:** lápides `{id,k,at}` no snapshot, poda de 180 dias + teto de 500, propagação
> da exclusão para a equipe (443 verificações, 11 novas).
>
> **Decisões do dono (2026-09-11):** ① a ação nasce de um **deslize lateral no card**, revelando
> **duas ações** (Duplicar · Excluir); ② a exclusão **tem de valer para a equipe** — com **lápides**
> (marcas de exclusão) no snapshot da nuvem, mas **apagando de verdade o objeto do `louvai.json`**:
> a lápide é só `{id, at}`, nunca um registro inválido acumulado; ③ cifra dentro de escala **avisa
> quais** e deixa excluir; ④ **Desfazer** no toast depois de excluir.

---

## O pedido
Hoje não dá para tirar uma cifra ou uma escala do app pelo caminho natural — a lista. Queremos o
gesto de app de verdade: **deslizar o card para o lado**, ver **Excluir**, e uma **confirmação com
cara de Louvai** (a mesma linguagem do diálogo *"Sair do Louvai?"* da v0.58.2), não o `confirm()`
cinza do navegador.

## O que já existe hoje — e por que não conta
Excluir **existe**, escondida e frágil:

| caminho | onde | problema |
|---|---|---|
| `#e-delete` "Excluir esta cifra" | dentro do **editor** da cifra | a pessoa precisa entrar para editar só para apagar |
| `#ee-delete` "Excluir esta escala" | dentro do **editor** da escala | idem |
| item *Excluir* nas folhas Compartilhar | `shareSheet` / `shareEscalaSheet` | faz `openEditor(id)` + `$("#e-delete").click()`: se **cancelar**, a pessoa fica **largada dentro do editor** |
| a confirmação | `confirm()` nativo | destoa dos 3 temas, ignora o desenho do app e não diz **nada** sobre escalas nem sobre a nuvem |

E o furo que nenhum desenho de UI resolve sozinho: **`mergeSongs`/`mergeEscala` são união pura —
nunca removem**. Quem excluir uma cifra e depois sincronizar (`pullRepo`, auto-sync ao abrir/voltar)
**vê a música voltar**. Entregar só o gesto bonito seria entregar uma exclusão mentirosa. Por isso o
plano tem dois incrementos e o **Inc. 2 não é opcional**.

## Princípios que o desenho respeita
- **Nada destrutivo no escuro** (regra nº4, aplicada ao avesso): antes, confirmação com contexto;
  depois, **Desfazer**.
- **A cifra é do domingo de manhã:** o gesto tem de conviver com a rolagem da lista, dedo grande e
  pouca luz — alvo ≥44px, um card aberto por vez.
- **O voltar do celular navega** (v0.57.0–v0.58.3): a confirmação é **uma camada da pilha** — o
  voltar **cancela**, nunca sai do app.
- **Fonte única:** um `deleteSong(id)`/`deleteEscala(id)` por trás de **todos** os caminhos (deslize,
  folha Compartilhar, editor). Nada de fluxo que clica no botão de outra tela.

---

# Incremento 1 — o gesto, o diálogo e o desfazer (v0.59.0) ✅

## 1.1 Faixa de ações por deslize
**Markup.** Cada card da lista passa a nascer dentro de um `.swipewrap`
(`position:relative; overflow:hidden; touch-action:pan-y`), com a faixa de ações **atrás**
(`position:absolute; right:0; top:0; bottom:0`) e o `.songcard`/`.escard` por cima:

```
┌──────────────────────────────────────┐
│ [G] Deus é Fiel          ┆  ⧉  │  🗑  │
│     Fernandinho · há 2 s ┆ Dup │ Excl │
└──────────────────────────────────────┘
      ← desliza            72px   72px
```

**Ações (2, como decidido):** **Duplicar** (`dupSong`/`dupEscala`, já existem) e **Excluir**.
*Enviar/Editar continuam onde estão* (⚙ do player e folha Compartilhar) — três alvos de 72px numa
tela de 360px encostariam o 🗑 no polegar de quem só queria duplicar.

**Mecânica (uma função só, usada pelas duas listas):** `enableSwipeActions(wrap, {onDup, onDel})`.
- `pointerdown` guarda `x0/y0`; `pointermove` só assume o gesto quando `|dx| > |dy|` **e** `dx < 0`
  (o `touch-action:pan-y` já entrega o eixo horizontal ao JS e mantém a rolagem vertical nativa).
- Segue o dedo 1:1 até `-144px`; ao soltar, **abre** se passou de ~40% da faixa ou se a velocidade
  foi alta, senão **volta com mola** (transição do CSS → respeita `prefers-reduced-motion`).
- **Só um card aberto por vez**; rolar a lista ou tocar fora fecha. Card aberto: o toque no corpo
  **fecha** em vez de abrir a cifra.
- **Caminho sem gesto:** *toque e segure* (~500ms) abre a mesma faixa — serve ao desktop, a quem não
  descobre o deslize e ao teclado (o card já é `role="button"` via `clickable()`).
- **Descoberta:** na primeira pintura da lista (uma vez na vida, `settings.swipeHintSeen`), o
  primeiro card faz o *peek*: desliza ~28px e volta.

## 1.2 Diálogo de confirmação (a linguagem do "Sair do Louvai?")
Generalizar o `.exitdlg` da v0.58.2 num `confirmDialog({icon, title, sub, okLabel, danger, onOk})`
— mesmo cartão central, mesmo fundo escurecido, `role="dialog"`, foco inicial **no Cancelar**
(ação destrutiva não recebe foco), cores por token (funciona nos 3 temas).

```
            ┌──────────────────────┐
            │          🗑          │
            │  Excluir "Deus é     │
            │       Fiel"?         │
            │                      │
            │ Está em 2 escalas:   │
            │ Culto 12/07 · Ensaio.│
            │ Some deste aparelho  │
            │ e da ordem do culto. │
            │                      │
            │ [     Excluir     ]  │
            │ [    Cancelar     ]  │
            └──────────────────────┘
```

O subtítulo é **montado com o contexto real**:
- **em escalas** (decisão ③): `escalas.filter(e => (e.items||[]).some(it => it.songId===id))` →
  *"Está em N escalas: Culto 12/07 · Ensaio."* + *"O item sai da ordem do culto."* (nada bloqueia;
  o `openEscala` já pula item órfão). Nenhuma escala → a linha some.
- **nuvem:** no Inc. 1, *"Some deste aparelho. Para valer para a equipe, publique na nuvem."*
  **No Inc. 2 essa linha muda** para *"Vai sumir para a equipe no próximo sincronizar."*
- **escala:** *"Excluir a escala não apaga as cifras."* (medo legítimo de quem vai tocar no botão).

**Diferença crítica para o `#exitdlg`:** este diálogo **empilha** no histórico (camada em
`NAV_SHEETS`, pelo funil `openS`/`closeS`), porque o voltar aqui significa **cancelar**. O
`#exitdlg` deliberadamente **não** empilha — se o de exclusão copiasse isso, na lista o voltar
consumiria a guarda de saída e abriria *"Sair do Louvai?"* **por cima** da confirmação.

## 1.3 Desfazer
`deleteSong(id)` guarda o objeto inteiro em memória e chama `toastAction("Cifra excluída",
"DESFAZER", fn, 6000)` — o `toast()` de hoje só aceita texto, então ganha uma variante que monta um
`<button>` **por DOM** (`textContent`, nunca `innerHTML` com título do usuário). Desfazer devolve o
objeto na íntegra (e, no Inc. 2, **retira a lápide**). Passados os 6s, some — e a exclusão fica.

## 1.4 Unificar os caminhos
`deleteSong(id)`/`deleteEscala(id)` viram a **fonte única**: abrem o diálogo, aplicam, registram a
lápide (Inc. 2) e oferecem Desfazer. Passam a chamá-los: a faixa de deslize, `shareSheet` e
`shareEscalaSheet` (fim do `openEditor()+click()` que largava a pessoa no editor) e os botões
`#e-delete`/`#ee-delete` do editor. **Cancelar volta para onde a pessoa estava** — lista, player ou
editor. Excluir a cifra **aberta no player** sai para a lista (`exitPlayer`), inclusive com
`escalaCtx` ativo.

---

# Incremento 2 — a exclusão vale para a equipe (v0.60.0) ✅

## 2.1 Formato: lápide enxuta, objeto apagado de verdade
O snapshot `louvai-full` (`{songs, escalas}`) ganha **um** campo:

```js
deleted: [ {id:"a1b2", k:"s", at:1757…}, {id:"c3d4", k:"e", at:1757…} ]   // k: "s"ong | "e"scala
```

O objeto excluído **sai de `songs`/`escalas`** — nada de registro inválido, nada de "morto" com
corpo, título e tags ocupando o arquivo (decisão ②). A marca custa ~40 bytes: 100 exclusões ≈ 4 KB
num arquivo que já tem centenas de KB de cifra.

## 2.2 Precedência — quem ganha de quem
| situação | resultado | por quê |
|---|---|---|
| lápide local × item que chega no **pull** com `updatedAt <= at` | o item **não entra** | excluí depois da última edição: minha exclusão é a informação mais nova |
| lápide local × item que chega com `updatedAt > at` | o item **entra** e a lápide **cai** | alguém editou **depois** da exclusão: a música é querida |
| lápide que **chega** × item local com `updatedAt <= at` | o item local **é removido** | é assim que a exclusão do líder chega no celular da equipe |
| lápide que chega × item local com `updatedAt > at` | o item **fica**, lápide descartada | não apagar trabalho recente de ninguém |
| **importação explícita** (arquivo/link, confirmada) | **sempre vence**, apaga a lápide | o gesto do usuário manda (regra nº4 ao contrário: ele *pediu* aquilo) |

Regra em uma frase: **lápide vence por carimbo de tempo; gesto explícito vence sempre.**

## 2.3 Poda (o "não floodar" do dono)
`purgeTombstones()` roda no `load()` e **antes de publicar**: descarta lápide com mais de
**180 dias** (a equipe sincroniza toda semana; 6 meses é folga larga) e, como teto duro, mantém as
**500 mais recentes**. Uma lápide podada não ressuscita nada: a essa altura todo aparelho já
sincronizou a ausência.

## 2.4 Compatibilidade
Um app **antigo** (≤ v0.58.3) que puxe o snapshot novo **ignora** `deleted` — e como o objeto já
saiu de `songs`, ele simplesmente não recebe a música. O risco residual é o aparelho antigo que
**ainda tem a cifra** e publica: ele a ressuscitaria para todos. Mitiga-se sozinho — a equipe abre
sempre o app hospedado, que é a versão nova. Fica registrado aqui como limite conhecido.

---

## Armadilhas conhecidas (achadas lendo o código, antes de codar)
1. **`.songcard:active{transform:scale(.985)}` briga com o `translateX` do deslize.** O
   deslocamento vai por **style inline** (vence a regra CSS) e é removido ao fechar, devolvendo o
   `:active`. **Medir no teste** (`getBoundingClientRect().x`), não confiar no estado lógico.
2. **`staggerIn` procura `.songcard`/`.escard` entre os filhos diretos** de `#songlist`/`#escalalist`
   — com o `.swipewrap` no meio, a animação de entrada (M7) **morre em silêncio**. Atualizar a
   checagem (ou pôr a classe no wrapper) e cobrir com teste.
3. **`margin-bottom` mora no `.songcard`/`.escard`** — tem de migrar para o wrapper, senão a faixa
   vermelha vaza no vão entre cards.
4. **`touch-action`** no wrapper (`pan-y`) é o que impede o gesto de roubar a rolagem da lista —
   mesmo remédio que a `.cifra` usa desde a v0.50.0.
5. **Clique fantasma ao soltar o deslize** abriria a cifra. Repetir o padrão `pinchWasActive`
   (v0.50.0): flag `swipeWasActive` suprime o `onclick` seguinte.
6. **O diálogo TEM de empilhar** (ver 1.2) — e entrar em `NAV_SHEETS` para o `navRender` fechá-lo
   em qualquer navegação.
7. **Camadas:** folhas 50/51, diagrama 60/61, toast 60, saída 70/71 → a confirmação fica em **72/73**
   (pode ser aberta a partir de uma folha).
8. **Toast com botão:** o `toast()` usa `textContent`. O Desfazer monta o botão por DOM — título de
   música com `<` não pode virar HTML.
9. **Headless mente sobre gesto** (lição da v0.58.1): deslize e *toque e segure* são interação real.
   Além do Playwright, **conferir no aparelho** antes de publicar.
10. **Excluir sem rede:** tudo é local; a lápide sincroniza quando der. Nada do fluxo pode depender
    de `fetch` (regra nº2).

## Testes (Playwright — `tests/smoke.mjs`, gesto REAL + medição)
**Inc. 1:** deslizar com pointer events e **medir** o deslocamento do card · faixa revelada com alvo
≥44px · **rolagem vertical não abre** a faixa · soltar no meio volta · soltar passado o limiar abre ·
card aberto: toque no corpo fecha e **não** abre a cifra · *toque e segure* abre · abrir outro card
fecha o anterior · Excluir → diálogo com o **título certo** e a **linha das escalas** · Cancelar
mantém a cifra e **devolve à tela de origem** · o **voltar do celular cancela** (e, na lista, **não**
dispara "Sair do Louvai?") · Excluir tira do `localStorage` e da lista · **Desfazer restaura** ·
regressão do caminho antigo: Compartilhar → Excluir → Cancelar **não deixa no editor** · escala idem
(e a mensagem "não apaga as cifras").

**Inc. 2:** pull com a cifra ainda no snapshot **não ressuscita** · lápide que chega **remove local**
· item editado depois da lápide **sobrevive** · importação explícita por arquivo/link **vence** a
lápide · `exportFull` traz `deleted` **sem** o objeto · poda por idade e por teto · Desfazer **retira**
a lápide · `diffRepo` segue contando os removidos na confirmação de publicar.

## Ritual (por incremento, sem exceção)
`npm test` verde → `APP_VERSION` = `package.json` → CHANGELOG (o **porquê**) → ROTEIRO (linha do
tempo + rodapé + backlog) → README se a lista de recursos mudar → **este plano** (status) → commit +
tag → `npm run deploy`.

## O que a execução ensinou (além do planejado)
1. **Soltar o deslize dispara um `click`** — o card abria e era **recolhido no mesmo gesto**. A flag
   de supressão não pode **fechar** nada: só suprime o clique. E ela morre **no `pointerdown`
   seguinte**, nunca por relógio — um timeout de 400ms engolia o toque real logo depois do gesto.
2. **`closeSwipe()` só desfaz o card que estava aberto.** Um arraste curto deixa `transform` inline
   pendurado: a volta com mola precisa limpá-lo na mão.
3. **A armadilha nº2 (o `staggerIn`) aconteceu de verdade** — e quem a pegou foi o teste da v0.34.0,
   não o olho. Um wrapper novo entre a lista e o card quebra tudo que procura filho direto.
4. **O `opts` se perdia na folha de "título repetido"** (`importJSON` → `doImport`): um pull manual
   que caísse nesse aviso voltaria a ignorar as lápides. Caminho lateral é onde a regra vaza.
5. **`applyTombs` roda também na importação explícita de um snapshot completo** — decisão consciente:
   restaurar o snapshot da equipe é adotar o estado dela, exclusões inclusive. O "gesto explícito
   vence" vale para **trazer de volta** uma cifra específica (arquivo/link daquela cifra).

## Fora de escopo (registrado para não virar surpresa)
- Excluir **em lote** / modo de seleção múltipla.
- **Lixeira** com restauração tardia (o Desfazer de 6s cobre o arrependimento real).
- Deslizar **para a direita** com outra ação (ex.: marcar favorita) — a faixa está de um lado só.
- Excluir **item de dentro da escala** — isso já existe no editor da escala (`.rm`).
