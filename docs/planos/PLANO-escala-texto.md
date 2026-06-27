# PLANO — Escala como texto para WhatsApp (com equipe)

> **Status: ✅ entregue na v0.51.0.**
> Evolução do "Copiar como texto (WhatsApp)" entregue na v0.49.0
> (ver `PLANO-incrementos-ao-vivo.md`).

## Problema / objetivo
Ao montar uma escala, o líder quer **colar no grupo do WhatsApp** uma mensagem
pronta com **quem está escalado (nome + função)** e a **ordem das músicas**. Hoje
o `escalaToText` (v0.49.0) já gera a ordem das músicas com tom, link guia e a
observação fixa da música — mas **não inclui a equipe** nem outros dados da escala
que ajudam o grupo (data/hora, momento, observações do culto).

Este plano **estende** `escalaToText`; **não** cria botão novo — continua no item
"Copiar como texto (WhatsApp)" da folha `shareEscalaSheet`.

## Decisões fechadas (com o dono, 2026-06-27)
- **Estilo:** com emojis, mas **só nos títulos de seção** (🎵 📅 👥 🎶 📌). **Sem
  emoji por função** (evita a colisão 🎸 de Violão/Guitarra/Baixo e 🥁 de Cajon).
  Usa a formatação do WhatsApp: `*negrito*` nos títulos e `_itálico_` nas obs.
- **Equipe agrupada por função:** uma linha por função, `Função: nome1, nome2`,
  na **ordem de `FUNCOES`** (Ministrante primeiro).
- **Momento inline:** ` · _Momento_` ao lado da música, mantendo **uma única lista
  numerada** = ordem do culto.
- **As duas observações** aparecem quando existirem: 📝 a do culto (`it.note`) e
  💬 a fixa da música (`s.notes`). Só uma existindo, mostra só ela.
- **Campos extras (todos ligados):** cabeçalho (data · hora · tipo), momento por
  música, observação geral da escala (`e.notes`), observação da música no culto
  (`it.note`).

## Formato final (mockup canônico)
```
🎵 *Culto de Domingo*
📅 29/06/2026 · 19h00 · Culto

👥 *Equipe*
Ministrante: Fulano
Vocal: Beltrana, Cicrana
Violão: João
Baixo: Pedro
Bateria: Tiago
Mídia/Projeção: Ana

🎶 *Músicas*
1. Bondade de Deus — Tom G · _Adoração_
   ▶️ https://youtu.be/xxxx
   📝 repetir o refrão 2x
   💬 começa só voz
2. Teu Santo Nome — Tom D · _Ministração_

📌 _Chegar 18h pra passagem de som_
```

## Especificação do texto (regras)
Seções separadas por **uma linha em branco**; toda seção/linha **sai do texto
quando vazia** (sem rótulo órfão). Ordem fixa: cabeçalho → equipe → músicas → obs.

1. **Cabeçalho**
   - Linha 1: `🎵 *{e.title || "Escala"}*`.
   - Linha 2: `📅 ` + `[fmtDate(e.date), e.time, e.type]` (só os preenchidos,
     juntos por ` · `). Omitir a linha inteira se nada preenchido.

2. **Equipe** (só se houver alguém com nome)
   - Título: `👥 *Equipe*`.
   - Agrupar `e.team` por `role`, **iterando na ordem de `FUNCOES`**; para cada
     função com ≥1 nome: `{função}: {nomes.join(", ")}`.
   - Pessoas **sem nome** são ignoradas. Função fora da lista `FUNCOES` (dado
     legado) entra ao final, na ordem de aparição.

3. **Músicas** (só se houver itens)
   - Título: `🎶 *Músicas*`.
   - Lista numerada sobre **todos** os `e.items` (o contador `n` conta música e
     item não-musical igual — é a ordem do culto).
   - **Item música** (`it.kind === "song"`):
     - Linha: `{n}. {título} — Tom {tom}{ · _momento_}`
       - `tom = it.key || s.key`; sem tom, omitir o trecho `— Tom …`.
       - momento: ` · _{it.momento}_` só se houver.
       - título: `s.title` (ou `(cifra)` se a cifra não existir mais).
     - Linhas de detalhe indentadas (3 espaços), nesta ordem, cada uma só se houver:
       - `   ▶️ {safeUrl(s.ref)}` (só URL http/https válida).
       - `   📝 {it.note}` (obs. da música **neste culto**).
       - `   💬 {s.notes}` (obs. **fixa** da música).
   - **Item não-musical** (`it.kind !== "song"`):
     - Linha: `{n}. {it.title || "(item)"}{ · _momento_}`.
     - `   📝 {it.note}` se houver.

4. **Observação geral da escala**
   - `📌 _{e.notes}_` só se `e.notes` preenchido.

## Implementação
- **Arquivo:** `louvai.html`, função `escalaToText(id)` (reescrita). Reusa
  `escalas.find`, `songs.find`/`songById`, `fmtDate`, `safeUrl`, `FUNCOES`.
- **Helper de equipe:** montar `Map<função, nomes[]>` e percorrer `FUNCOES` para
  a ordem; extrair como função pequena (ex.: `teamByRole(team)`) ou inline.
- **Sem novos dados nem storage:** tudo já existe na escala/música. Sem migração.
- **Sem mexer** em `shareText`, `shareEscalaSheet` (só o texto muda) nem no
  compartilhamento por `.json`/link.
- **XSS/segurança:** texto puro (não vai pra DOM via innerHTML); `safeUrl` no
  link mantém o filtro http(s) que já existe.

## Testes (regressão — `tests/smoke.mjs`)
> Correção do plano original: **já havia** um teste mínimo de `escalaToText` no bloco
> da v0.49.0 (título/Tom/obs/link) — ele continua verde (as substrings seguem no novo
> formato). A v0.51.0 **acrescenta** um bloco próprio que monta no `localStorage` uma
> escala completa e chama `escalaToText(id)` via `page.evaluate`, conferindo no texto:
- cabeçalho com `*título*` e a linha `📅` com data/hora/tipo;
- `👥 *Equipe*` e a **agregação por função** (`Vocal: Beltrana, Cicrana`) na
  ordem de `FUNCOES` (Ministrante antes de Vocal);
- **ausência** de emoji por função (a linha começa pelo nome da função);
- `🎶 *Músicas*` com `1. … — Tom G · _Adoração_`;
- as três linhas de detalhe: `▶️` (link), `📝` (it.note) e `💬` (s.notes);
- `📌` com `e.notes`;
- **caso enxuto:** escala só com título + 1 música sem extras → sem seção Equipe,
  sem linhas de detalhe (nenhum rótulo órfão);
- item **não-musical** entra na numeração.

> Atenção: o editor cria item com `kind:"song"` (não `type`). O teste deve usar
> `kind:"song"` pra exercitar o caminho de música.

## Ritual de entrega (v0.51.0)
1. Implementar em `louvai.html`. 2. `npm test` verde (com o teste novo).
3. Subir `APP_VERSION` + `package.json` → `0.51.0`. 4. `CHANGELOG.md` (entrada
nova), `ROTEIRO-louvai.md` (linha do tempo + rodapé + Tema E/D), `README.md`,
este plano (status → entregue), `CLAUDE.md` (anatomia: o que `escalaToText` passa
a montar). 5. `git commit` + `git tag v0.51.0`. 6. Sincronizar `index.html`.

## Fora de escopo (mencionados, deixados de fora)
Capo e duração por música, assinatura "enviado pelo Louvai", agrupar músicas por
momento (subtítulos), emoji por função. Reabrir se o uso de campo pedir.
