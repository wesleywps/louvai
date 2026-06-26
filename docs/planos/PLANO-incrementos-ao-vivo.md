# Plano — 3 incrementos pequenos de uso ao vivo (bundle v0.49.0)

> **Status:** ✅ **implementado na v0.49.0** (bundle único; ordem executada **3 → 1 → 2**).
> 305 verificações verdes. Ver CHANGELOG v0.49.0.

## Itens
1. **🎵 Dar o tom** — botão no player (⚙ "Esta música") que toca a **tônica do tom atual** via Web Audio
   (segurando = tríade). Usa `curSounding` (tom já calculado). `noteFreq(nota)` (A4=440, temperamento
   igual) + `playTone(freq,dur)` (oscilador + envelope). Sem dependência, offline.
2. **📲 Compartilhar escala como texto** — `escalaToText(esc)` monta a ordem do culto (data/tipo · por
   item: título · Tom · momento · observações · link guia). Botão no detalhe da escala; reusa o
   share/clipboard (`shareText` análogo ao `sendLink`: Web Share `{text}` → fallback clipboard).
3. **📋 Duplicar cifra/escala** — `dupSong(id)`/`dupEscala(id)`: clona, `uid()` novo, título + " (cópia)";
   item "Duplicar" nos menus de cifra e de escala. Escala clona os `items`.

## Ordem (3 → 1 → 2) — porquê
São **independentes**; otimização = de-riscar + ganhar ritmo + reaproveitar:
- **3 (Duplicar)** primeiro: trivial e isolado, valida o loop sem subsistema novo.
- **1 (Dar o tom)**: introduz o único subsistema novo (Web Audio), isolado.
- **2 (Texto)** por último: reaproveita song.ref + song.notes + o share existente; mais propenso a
  iterar no formato → por último com tudo no lugar.
- **Ritual batched:** `npm test` uma vez no fim, **um** release v0.49.0 (1 CHANGELOG/commit/tag/sync).

## Testes (smoke)
- Duplicar: `dupSong`/`dupEscala` criam cópia com id novo + "(cópia)"; escala mantém os items.
- Dar o tom: `noteFreq("A")≈440`, `noteFreq("A",1)` oitava etc.; botão `#p-tom` presente no ⚙.
- Texto: `escalaToText` inclui título, Tom e (quando houver) observação/link de cada item.

## Ritual (recurso → v0.49.0)
versão (html+package) · CHANGELOG · ROTEIRO (linha do tempo + capacidades + backlog) · README ·
smoke verde · `index.html` sync · commit + tag.
