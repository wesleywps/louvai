# Plano — Polimento de UI + ícones ("cara de app pronto")

> **Como retomar:** abra o Claude Code nesta pasta e peça *"vamos executar a Onda 1 do PLANO-ui.md"*.
> **Status: PLANO EM ONDAS — AGUARDANDO OK PRA EXECUTAR A ONDA 1.** App na v0.27.0.
> Insumo (decidido, não reabrir): `ANALISE-ui.md` (itens **G1–G12**, **M1–M8**) e
> `ANALISE-icones.md` (inventário, abordagem, conjunto SVG). Este plano **prioriza e sequencia**.

## Princípio
Elevar a sensação de "app pronto" **sem quebrar** o que já é alicerce (tokens maduros, cifra
mono, contraste acorde/letra no palco, player enxuto) e **dentro das regras**: arquivo único,
vanilla, offline-first, dois temas, alvos ≥48px, `prefers-reduced-motion`, pt-BR. A cifra mono,
`♯/♭` e os rótulos `A−/A＋`, `−/＋` **não** mudam (linguagem do músico).

---

## Onda 1 — Ganhos rápidos + ícone do Backup  → **✅ ENTREGUE na v0.28.0**
> Tokens (fundação) + Tom destacado (G4) + toast tipado/acessível (G6) + estados vazios
> certos (G7/G8) + acorde no claro (G9) + ícone Backup→"Repertório" (archive SVG) e ↧→download.
> Opcionais (G5/G10/G11/G12) seguem disponíveis. **Próxima: Onda 2 (ícones SVG).**
Baixo risco, alto retorno. CSS/ajuste fino + 1–2 ícones. É o "Top 5" da análise + a dor do dono.

1. **Tokens de fundação (G1+G2+G3):** escala tipográfica (`--fs-*`), espaçamento 8pt (`--sp-*`) e
   raios (`--r-sm`/`--r`/`--r-lg`/`--r-pill`); migrar os valores soltos. **Fazer primeiro** — destrava
   o resto. A cifra (sizing por `fontSize`) fica intocada.
2. **Destacar o Tom no player (G4):** `#p-sub`/`.songhead` → "Tom: X" em mono + `--accent`;
   artista/capo em `--muted`. (mexe no `bits` do `drawPlayer`.)
3. **Toast tipado + acessível (G6):** `toast(msg, tipo)` com faixa de acento e ícone por tipo
   (sucesso/erro/aviso), `role="status"`/`aria-live="polite"`, e tirar os emojis das strings.
4. **Estados vazios certos (G7+G8):** ramo de **busca-sem-resultado** ("Nada encontrado para '…'"
   + Limpar busca); ícone próprio no vazio de escalas; **ação embutida** ("＋ Nova cifra/escala").
5. **Acorde legível no tema claro (G9):** `--chord-bg`/`--chord-halo` suaves no `.light` (chip
   violeta translúcido) — legibilidade real do domingo de manhã.
6. **Ícone do Backup (ANALISE-icones §3/§6):** trocar `↥` (`#backupBtn`) por **`archive`** (1 SVG
   inline) e **renomear a entrada/título para "Repertório"**; trocar `↧` (`#importBtn`) por
   `download`. Resolve a confusão do par de setas sem refatorar tudo.
- **Opcionais baratos se sobrar fôlego:** G10 (versão discreta na topbar), G11 (preset "Tamanho
  palco"), G12 (pulso no Tom/Capo ao transpor), G5 (fade lateral na `.tagbar`).
- **Testes:** estado de busca-vazia; toast com tipo + `aria-live`; Tom destacado no `#p-sub`;
  `#backupBtn` com `aria-label` e SVG; regressões dos fluxos atuais verdes.

## Onda 2 — Ícones SVG inline unificados (Lucide)  → **v0.29.0**
O maior salto "protótipo → produto" (ANALISE-icones §4, item **M1**). Risco médio (mecânico).

- Helper **`icon(name)`** + objeto `ICONS` (paths Lucide, MIT) — uma fonte da verdade de ícones,
  como o `parseChord` é dos acordes. `.iconbtn` passa a conter um `<svg>` 22px, `stroke-width:2`,
  `stroke="currentColor"` (herda tema), `aria-hidden` no svg + `aria-label` no botão.
- Converter `.iconbtn`, `.sheetitem .ic`, `.move`, busca, e os botões da nuvem; aplicar o
  **conjunto coeso** da tabela (voltar, estrutura `list-music`, ajustes `sliders`, compartilhar
  `share-2`, link, nuvem, editar, apresentar, tema sun/moon, excluir, etc.).
- **Polir os ambíguos:** `𝄞` (só-letra) e `≣` (tabs) → ícones óbvios; distinguir `↗`/`🔗` nos
  sheets (`file`/`link`). Eliminar a mistura emoji+glifo.
- **Atenção (armadilha de teste):** o `smoke` valida alguns botões por `textContent` de glifo →
  migrar essas asserções para `aria-label`/seletor. Fazer num incremento próprio, testado.

## Onda 3 — Incrementos de UI maiores  → **v0.30.0+** (um por vez)
Médio esforço; cada um vira sua própria versão.

- **M2** — Agrupar o ⚙ Ajustes em seções (Afinação / Leitura / Esta música).
- **M4** — Unificar a linguagem de card (`.songcard` × `.escard`), respiro 8pt, 2 níveis de leitura.
- **M5** — Reorganizar o `#reposheet` (Puxar × Publicar; token recolhido por padrão).
- **M3** — Arrastar para fechar sheets (gesto no `.grip`, threshold, reduced-motion).
- **M7** — Animação de entrada da lista (stagger sutil, 1ª pintura, reduced-motion).
- **M8** — Indicador de progresso na Apresentação. · **M6** — Skeleton de cifra (cuidar p/ não
  atrapalhar a medição do Modo Página).
- **Acessibilidade contínua:** subir `--muted` no dark p/ folga a distância; `:focus-visible` em
  botões/cards; alvo da `.chip` da tagbar ≥44–48px.

---

## Sequência recomendada
**Onda 1 inteira como v0.28.0** (começando pelos tokens), porque é o melhor retorno/risco e a
fundação que torna as ondas 2–3 mais limpas. Depois **Onda 2** (ícones SVG) e então **Onda 3**
item a item. Validação no **celular real** (palco, dark/light) após cada onda — UI só se confirma
na tela.

## Arquivos
- `louvai.html` — tokens, toast, estados vazios, Tom no player, ícone do Backup (Onda 1);
  `ICONS`/`icon()` + migração (Onda 2); sheets/cards/microinterações (Onda 3).
- `tests/smoke.mjs` — busca-vazia, toast tipado, Tom destacado, `aria-label` dos ícones.
- `CHANGELOG.md`, `ROTEIRO-louvai.md`, `README.md`, `CLAUDE.md`, `package.json`, `package-lock.json`.
- Insumo: `ANALISE-ui.md`, `ANALISE-icones.md` (detalhe de cada item).
