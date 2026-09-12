/* =========================================================================
   Louvai — suíte de validação (smoke/E2E)
   Abre o louvai.html num Chromium headless e valida os pontos críticos.
   Uso:  npm install && npm run test:install && npm test
   Sai com código ≠ 0 se algo falhar.
   ========================================================================= */
import { chromium } from "playwright";
import { readFileSync } from "node:fs";

const APP_URL = new URL("../louvai.html", import.meta.url).href;

let pass = 0, fail = 0;
const ok = (cond, msg) => { if (cond) { pass++; console.log("✓ " + msg); }
                            else { fail++; console.log("✗ FALHOU  " + msg); } };

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 412, height: 915 } });
const page = await ctx.newPage();
const jsErrors = [];
page.on("pageerror", e => jsErrors.push(e.message));
page.on("console", m => { if (m.type() === "error" && !/403|fonts|net::/.test(m.text())) jsErrors.push("console: " + m.text()); });

// Stub do Wake Lock: conta pedidos/liberações sem depender do suporte do headless
await page.addInitScript(() => {
  window.__wl = { req: 0, rel: 0 };
  Object.defineProperty(navigator, "wakeLock", {
    configurable: true,
    value: { request: async () => {
      window.__wl.req++;
      return {
        _fn: null,
        addEventListener(t, fn) { if (t === "release") this._fn = fn; },
        release() { window.__wl.rel++; this._fn && this._fn(); return Promise.resolve(); },
      };
    } },
  });
});

await page.goto(APP_URL);
await page.waitForTimeout(400);

// 1) Boot
ok((await page.locator(".songcard").count()) >= 1, "App carrega com pelo menos a cifra de exemplo");

// 1b) Redesign (Fase 1): tokens novos aplicados — fundo near-black, não o marrom antigo
ok((await page.evaluate(() => getComputedStyle(document.body).backgroundColor)) === "rgb(18, 18, 18)",
   "Fundo usa a paleta nova (#121212)");

// 1c) Redesign (Fase 2): bottom nav e FAB "+" na biblioteca
ok(await page.locator(".bottomnav").isVisible(), "Bottom nav (Cifras|Escalas) visível na biblioteca");
ok(await page.locator("#newBtn").isVisible(), "FAB + (nova cifra) visível");
ok(await page.locator("#backupBtn").isVisible(), "Backup acessível na topbar");

// 2) Transposição (fonte da verdade) — funções puras, agora com grafia derivada do TOM
//    (v0.17.0): o contexto vem de spellCtx(tomOrigem, semis[, tomExplícito]).
const t = await page.evaluate(() => {
  const cD = spellCtx("C", 2);                 // Dó +2 → tom de Ré (lado ♯)
  return {
    a: transposeChord("C",    2, cD),
    b: transposeChord("C7M",  2, cD),
    c: transposeChord("Cm7b5",2, cD),
    d: transposeChord("C/E",  2, cD),
    e: transposeChord("C6/9", 2, cD),
  };
});
ok(t.a === "D", "C +2 = D (tom de Ré)");
ok(t.b === "D7M", "C7M +2 = D7M");
ok(t.c === "Dm7b5", "Cm7b5 +2 = Dm7b5");
ok(t.d === "D/F#", "C/E +2 = D/F# (baixo transpõe junto)");
ok(t.e === "D6/9", "C6/9 +2 = D6/9");

// 2b) v0.17.0: grafia FIEL ao tom de destino — o pedido do dono ("se no tom o
//     correto é Bb não deve aparecer A#"), inclusive em acordes emprestados.
const sm = await page.evaluate(() => {
  const cD  = spellCtx("C", 2);      // tom de Ré (♯)
  const cBb = spellCtx("C", -2);     // tom de Sib (♭)
  const cDm = spellCtx("Em", -2);    // Mim −2 → Rém (♭)
  const cCm = spellCtx("Am", 3);     // Lám +3 → Dóm (♭)
  return {
    borrowedUp:  transposeChord("Bb", 2, cD),    // bVII emprestado sobe pra C, NÃO B#
    fToEb:       transposeChord("F", -2, cBb),   // tom de Sib: F→Eb, nunca D#
    cToBb:       transposeChord("C", -2, cDm),   // <- "se o correto é Bb não aparece A#"
    minF:        transposeChord("F",  3, cCm),   // tom menor bemol: F→Ab, não G#
    minG:        transposeChord("G",  3, cCm),   // G→Bb, não A#
  };
});
ok(sm.borrowedUp === "C", "Bb (bVII no tom de Dó) +2 = C, não B#/A#");
ok(sm.fToEb === "Eb", "Tom de Sib: F −2 = Eb (nunca D#)");
ok(sm.cToBb === "Bb", "Tom de Rém: C −2 = Bb — o A# nunca aparece (pedido do dono)");
ok(sm.minF === "Ab" && sm.minG === "Bb", "Tom menor bemol (Dóm): F→Ab e G→Bb, não G#/A#");

// 2c) v0.17.0: legibilidade — origem bemol e origem "esquisita" são resgatadas
const lg = await page.evaluate(() => {
  const cDfromDb = spellCtx("Db", 1);   // Réb +1 → tom de Ré (legível)
  const cEbfromCs= spellCtx("C#", 2);   // Dó# +2 → tom de Mib (resgata o Dó#)
  return {
    db1:  transposeChord("Db", 1, cDfromDb),
    gb1:  transposeChord("Gb", 1, cDfromDb),
    cs2:  transposeChord("C#", 2, cEbfromCs),
    fs2:  transposeChord("F#", 2, cEbfromCs),
    keyDb: transposeKeyName("Db", 1),
    keyCs: transposeKeyName("C#", 2),
    keyAm: transposeKeyName("Am", 3),
  };
});
ok(lg.db1 === "D" && lg.gb1 === "G", "Origem bemol legível: Db+1→D, Gb+1→G");
ok(lg.cs2 === "Eb" && lg.fs2 === "Ab", "Origem esquisita resgatada: C#+2→Eb, F#+2→Ab (sem dobrados)");
ok(lg.keyDb === "D" && lg.keyCs === "Eb" && lg.keyAm === "Cm", "transposeKeyName escolhe tom legível (Db+1=D, C#+2=Eb, Am+3=Cm)");

// 2d) escala pode FIXAR a grafia (escolha do usuário vence a tabela automática)
const ex = await page.evaluate(() => {
  const cSharp = spellCtx("C", 10, "A#");   // usuário pediu A# explicitamente
  const cFlat  = spellCtx("C", 10, "Bb");   // usuário pediu Bb
  return { sharp: transposeChord("C", 10, cSharp), flat: transposeChord("C", 10, cFlat),
           flatF: transposeChord("F", 10, cFlat) };
});
ok(ex.sharp === "A#", "Escala com tom explícito A#: C+10 = A# (escolha do usuário vence)");
ok(ex.flat === "Bb" && ex.flatF === "Eb", "Escala com tom explícito Bb: C+10=Bb, F+10=Eb");

// 2e) regressão v0.16.0: sem transposição (e oitavas) preserva a grafia ESCRITA
const sp = await page.evaluate(() => {
  const z = spellCtx("C", 0);
  return {
    bb:    transposeChord("Bb", 0, z),     // Bb continua Bb (não vira A#)
    fs:    transposeChord("F#", 0, z),     // F# continua F#
    bass:  transposeChord("D/Bb", 0, z),   // baixo invertido preserva
    octave:transposeChord("Gb", 12, spellCtx("Gb", 12)),  // oitava não re-soletra
    note:  transposeNote("Eb", 0, z),      // direto na fonte da verdade
  };
});
ok(sp.bb === "Bb" && sp.fs === "F#", "Sem transpor: Bb continua Bb e F# continua F# (grafia escrita)");
ok(sp.bass === "D/Bb", "Sem transpor: baixo invertido preserva a grafia (D/Bb)");
ok(sp.octave === "Gb", "Transpor por oitava (12) preserva a grafia (Gb)");
ok(sp.note === "Eb", "transposeNote preserva a nota original quando semis=0 (Eb)");

// 3) parseChord aceita acorde e rejeita palavra de letra
const p = await page.evaluate(() => ({ chord: isChord("F#m7/C#"), word: isChord("Senhor") }));
ok(p.chord === true && p.word === false, "parseChord aceita acorde e rejeita palavra ('Senhor')");

// 4) Criar cifra no editor, salvar, abrir e transpor
await page.locator("#newBtn").click(); await page.waitForTimeout(120);
await page.fill("#e-title", "Teste Automático");
await page.selectOption("#e-key", "G");
await page.fill("#e-body", "[Intro]\nG  D  Em  C\n\nVerso:\nG            D\nLinha de teste");
await page.locator("#e-save").click(); await page.waitForTimeout(250);
ok(await page.locator("#view-player").isVisible(), "Salvar abre o player");
ok(!(await page.locator(".bottomnav").isVisible()), "Bottom nav some fora da biblioteca");
// v0.20.0: player normal em barra de UMA linha — título na barra, Tom na linha fininha
ok((await page.locator("#p-title").textContent()) === "Teste Automático", "Título aparece na barra de uma linha");
ok(/Tom:\s*G/.test(await page.locator("#p-sub").textContent()), "Tom atual (G) aparece na linha fininha");

// 4b) Wake Lock: pede a trava com o player aberto e solta ao sair
let wl = await page.evaluate(() => window.__wl);
ok(wl.req >= 1, "Player pede o Wake Lock (tela acesa)");

// 4b2) Leitura no escuro: acorde e letra não podem se confundir (modo dark padrão)
const cifraColors = await page.evaluate(() => {
  const c = getComputedStyle(document.querySelector("#p-body .chord"));
  const l = getComputedStyle(document.querySelector("#p-body .lyr"));
  return { chord: c.color, lyr: l.color, chordBg: c.backgroundColor };
});
ok(cifraColors.chord !== cifraColors.lyr && cifraColors.chordBg !== "rgba(0, 0, 0, 0)",
   "Acorde se destaca da letra no dark (cor própria + chip de fundo)");

// 4c) v0.20.0: barra de UMA linha — Tom/Editar/Compartilhar foram pro ⚙ Ajustes; auto-scroll oculto
ok((await page.locator("#t-up").count()) === 0 && !(await page.locator("#scroll-toggle").isVisible()),
   "Barra enxuta: sem Tom nem auto-scroll à vista (foram pro ⚙)");
ok(await page.evaluate(() => document.getElementById("c-val").getBoundingClientRect().top >= window.innerHeight),
   "Capo fora da barra (guardado no sheet Ajustes)");
await page.locator("#p-settings").click(); await page.waitForTimeout(300);
ok(await page.evaluate(() => document.getElementById("playersheet").classList.contains("show")),
   "Sheet Ajustes abre");
// v0.20.0: Tom transpõe pelo ⚙ Ajustes (+2 = A); Editar/Compartilhar moram aqui
await page.locator("#s-tup").click(); await page.locator("#s-tup").click(); await page.waitForTimeout(120);
ok((await page.locator("#s-tkey").textContent()) === "A", "Transpor pelo ⚙ Ajustes leva +2 a A");
ok(await page.locator("#p-edit").isVisible() && await page.locator("#p-share").isVisible(),
   "Editar e Compartilhar moram no ⚙ Ajustes");
// v0.14.0: ligar o interruptor no Ajustes faz a barra de auto-scroll aparecer
await page.locator("#scrollbar-toggle").click(); await page.waitForTimeout(120);
ok(await page.locator("#scroll-toggle").isVisible(), "Ligar o interruptor mostra a barra de auto-scroll");
await page.locator("#scrollbar-toggle").click(); await page.waitForTimeout(80);   // volta ao padrão (oculta)
await page.locator("#c-up").click(); await page.waitForTimeout(120);
ok((await page.locator("#c-val").textContent()) === "1", "Capo funciona dentro do sheet Ajustes");
await page.locator("#c-down").click(); await page.waitForTimeout(80);   // devolve capo 0
await page.locator("#playerbg").click({ position: { x: 10, y: 10 } }); await page.waitForTimeout(300);
ok(await page.evaluate(() => !document.getElementById("playersheet").classList.contains("show")),
   "Sheet Ajustes fecha ao tocar fora");

// 4d) v0.51.1 (regressão): o ⚙ Ajustes tem MUITAS opções; em tela baixa ele estourava a
//     viewport — grip/título saíam por cima, o backdrop sumia e não dava pra rolar nem fechar.
//     Deve ganhar teto de altura e rolar os controles, deixando a faixa do backdrop pra fechar.
await page.setViewportSize({ width: 412, height: 560 });   // celular com barra do navegador visível
await page.locator("#p-settings").click(); await page.waitForTimeout(300);
const ajustesFit = await page.evaluate(() => {
  const sh = document.getElementById("playersheet");
  const ctrls = sh.querySelector(".sheetctrls");
  return {
    within: sh.getBoundingClientRect().height <= window.innerHeight,   // não cobre a tela toda
    gripTop: sh.getBoundingClientRect().top,                           // >0 = sobra backdrop no topo (grip à mostra + área p/ fechar)
    overflowY: getComputedStyle(ctrls).overflowY,                      // "auto" = controles roláveis
    scrolls: ctrls.scrollHeight > ctrls.clientHeight + 1,              // e há mesmo o que rolar nesta tela baixa
  };
});
ok(ajustesFit.within && ajustesFit.gripTop > 0,
   "⚙ Ajustes cabe na tela baixa (não cobre tudo; sobra o backdrop no topo p/ fechar)");
ok(ajustesFit.overflowY === "auto" && ajustesFit.scrolls,
   "⚙ Ajustes rola os controles quando não cabem na tela");
await page.locator("#playerbg").click({ position: { x: 10, y: 10 } }); await page.waitForTimeout(250);
await page.setViewportSize({ width: 412, height: 915 });   // restaura o viewport padrão da suíte

// 4e) v0.51.2 (regressão): "Editar" e "Enviar" no ⚙ Ajustes precisam RECOLHER o painel —
//     senão ele (fixed, z-index 51) fica sobreposto à cifra em edição, ou por cima do próprio
//     sheet de compartilhar (que vem antes no DOM), escondendo o que a pessoa quer ver.
await page.locator("#p-settings").click(); await page.waitForTimeout(250);
await page.locator("#p-edit").click(); await page.waitForTimeout(250);
ok(await page.evaluate(() => !document.getElementById("playersheet").classList.contains("show")
     && !document.getElementById("view-editor").classList.contains("hidden")),
   "Editar recolhe o ⚙ Ajustes e mostra o editor (sem painel por cima da cifra)");
await page.locator("#e-cancel").click(); await page.waitForTimeout(200);   // cancela → volta ao player
await page.locator("#p-settings").click(); await page.waitForTimeout(250);
await page.locator("#p-share").click(); await page.waitForTimeout(250);
ok(await page.evaluate(() => !document.getElementById("playersheet").classList.contains("show")
     && document.getElementById("sheet").classList.contains("show")),
   "Enviar recolhe o ⚙ Ajustes e o sheet de compartilhar abre à mostra (não atrás)");
await page.locator("#sheetbg").click(); await page.waitForTimeout(200);   // fecha o compartilhar

// 4f) v0.51.3: o player normal (fora da Escala) deve ABRIR no capotraste salvo da música.
//     Antes o capo só valia na Escala; fora dela ficava 0 e o capo só aparecia na edição.
const capoOpen = await page.evaluate(() => {
  songs.push({ id: "capo-test", title: "Com Capô", artist: "Fulano", key: "G", capo: 2,
               tags: [], updatedAt: 1, body: "[Intro]\nG  C  D\n\nGrande é o Senhor" });
  saveSongs(); openPlayer("capo-test");
  return {
    cval: document.getElementById("c-val").textContent,                          // ⚙ Ajustes reflete o capo salvo
    sub: document.getElementById("p-sub").textContent,                           // linha de info mostra "Capo 2"
    firstChord: (document.querySelector("#p-body .chord") || {}).textContent || "",   // forma com capô (G soa, forma em F c/ capo 2)
  };
});
ok(capoOpen.cval === "2", "Player abre no capotraste salvo da música (⚙ Ajustes mostra 2)");
ok(/Capo 2/.test(capoOpen.sub), "Linha de info exibe o capotraste (Capo 2), junto do artista e do tom");
ok(capoOpen.firstChord === "F", "Acordes mostram a forma com o capô (G soa; forma em F com capo 2)");
await page.evaluate(() => {   // limpa a música de teste e reabre a 1ª (estado neutro p/ o próximo bloco)
  const i = songs.findIndex(s => s.id === "capo-test"); if (i >= 0) songs.splice(i, 1);
  saveSongs(); openPlayer(songs[0].id);
});
await page.waitForTimeout(150);

// 5) Importar colando texto estilo Cifra Club
await page.locator("#p-back").click(); await page.waitForTimeout(120);
wl = await page.evaluate(() => window.__wl);
ok(wl.rel >= 1, "Sair do player solta o Wake Lock");
await page.locator("#newBtn").click(); await page.waitForTimeout(120);
await page.locator("#e-paste").click(); await page.waitForTimeout(150);
await page.fill("#pastebox",
  "Cifra Club\nMusica Importada\nArtista X\nTom: D\nCapotraste na 2ª casa\n\n[Intro] D  A  Bm  G\n\n[Verso]\nD            A\nLinha colada");
await page.locator("#paste-go").click(); await page.waitForTimeout(250);
ok((await page.locator("#e-title").inputValue()) === "Musica Importada", "Colar reconhece o título");
ok((await page.locator("#e-key").inputValue()) === "D", "Colar reconhece o tom (D)");
ok((await page.locator("#e-capo").inputValue()) === "2", "Colar reconhece o capotraste (2)");
const importedBody = await page.locator("#e-body").inputValue();
ok(!/cifra ?club|Tom:|Capotraste/i.test(importedBody), "Colar remove o lixo (Cifra Club/Tom/Capotraste)");
ok(importedBody.startsWith("[Intro]"), "Corpo colado começa em [Intro]");
await page.locator("#e-save").click(); await page.waitForTimeout(200);

// 6) Estrutura da música
await page.locator("#p-struct").click(); await page.waitForTimeout(200);
ok(await page.locator("#sheet").isVisible(), "Menu de estrutura abre");
ok((await page.locator("#sheet-body .sheetitem").count()) >= 2, "Lista as seções");

// 6b) Redesign (Fase 4): sheets com vidro fosco (blur) e foco violeta nos inputs
ok((await page.evaluate(() => getComputedStyle(document.getElementById("sheet")).backdropFilter)).includes("blur"),
   "Sheets usam vidro fosco (backdrop blur)");
await page.locator("#sheetbg").click(); await page.waitForTimeout(200);

// 7) Escala: criar com 1 música e conferir o modo Apresentar no tom da escala
await page.locator("#p-back").click(); await page.waitForTimeout(120);
await page.locator("#tab-escalas").click(); await page.waitForTimeout(120);
await page.locator("#newEscBtn").click(); await page.waitForTimeout(120);
await page.fill("#ee-title", "Culto Teste");
await page.locator("#ee-add-song").click(); await page.waitForTimeout(200);
await page.locator("#picklist .songcard").first().click(); await page.waitForTimeout(150);
await page.locator("#ee-items .irow").first().locator(".f-key").selectOption("A");
await page.locator("#ee-add-song").click(); await page.waitForTimeout(200);   // 2ª música (p/ testar navegação)
await page.locator("#picklist .songcard").nth(1).click(); await page.waitForTimeout(150);
await page.locator("#ee-save").click(); await page.waitForTimeout(200);
ok(await page.locator("#view-escala").isVisible(), "Escala salva e detalhe aberto");
await page.locator("#es-present").click(); await page.waitForTimeout(200);
ok(await page.locator("#presentbar").isVisible(), "Modo Apresentar abre com a barra de navegação");
ok((await page.locator("#s-tkey").textContent()) === "A", "Apresentar abre a música no tom da escala (A)");

// 7b) v0.18.0: barra COMPACTA no modo Apresentar (mais cifra na tela)
ok(await page.evaluate(() => document.getElementById("view-player").classList.contains("present")),
   "Apresentar liga o layout compacto (.present)");
ok(!(await page.locator("#view-player .controls").isVisible()),
   "Compacto esconde a barra grande (.controls)");
// v0.20.1: a Apresentação também mostra o tom na linha fininha do topo (como no player normal)
ok(await page.locator(".songhead").isVisible() && /Tom:\s*A/.test(await page.locator("#p-sub").textContent()),
   "Apresentação mostra o tom (A) na linha fininha do topo");
ok((await page.locator("#pv-title").textContent()).length > 0 && (await page.locator("#pv-pos").textContent()) === "1 de 2",
   "Barra compacta mostra título e posição (1 de 2)");
// v0.18.1: o Tom saiu da barra (libera espaço) e foi pro ⚙ Ajustes
ok((await page.locator("#pv-tkey").count()) === 0, "Tom não fica mais na barra compacta (foi pro ⚙ Ajustes)");
// a cifra começa bem mais alto que o cromo antigo (~245px): prova objetiva do ganho (barra de 1 linha)
ok(await page.evaluate(() => document.getElementById("p-body").getBoundingClientRect().top < 140),
   "Compacto: a cifra começa no topo (barra de uma linha só)");
// Tom agora transpõe pelo ⚙ Ajustes (aberto pelo ⚙ da barra compacta)
await page.locator("#pv-settings").click(); await page.waitForTimeout(250);
ok(await page.evaluate(() => document.getElementById("playersheet").classList.contains("show")), "⚙ da barra compacta abre o Ajustes");
ok((await page.locator("#s-tkey").textContent()) === "A", "Tom (A) aparece no ⚙ Ajustes");
await page.locator("#s-tup").click(); await page.waitForTimeout(120);
ok((await page.locator("#s-tkey").textContent()) !== "A", "Transpor pelo ⚙ Ajustes muda o tom");
await page.locator("#playerbg").click({ position: { x: 10, y: 10 } }); await page.waitForTimeout(250);   // fecha o sheet
// navegação ‹ › pela barra compacta
await page.locator("#pv-next").click(); await page.waitForTimeout(200);
ok((await page.locator("#pv-pos").textContent()) === "2 de 2", "‹ › avança a música na escala (2 de 2)");
// v0.35.0 (M8): a barra de progresso enche na última música
ok(await page.evaluate(() => { const f = document.querySelector("#pv-progress span"), t = document.getElementById("pv-progress"); return f.getBoundingClientRect().width >= t.getBoundingClientRect().width - 1; }),
   "Progresso do culto fica cheio na última música (2 de 2)");
await page.locator("#pv-prev").click(); await page.waitForTimeout(200);
ok((await page.locator("#pv-pos").textContent()) === "1 de 2", "‹ › volta a música na escala (1 de 2)");
// v0.35.0 (M8): na 1ª de 2, a barra fica ~50%
ok(await page.evaluate(() => { const f = document.querySelector("#pv-progress span"), t = document.getElementById("pv-progress"); const r = f.getBoundingClientRect().width / t.getBoundingClientRect().width; return r > 0.4 && r < 0.6; }),
   "Progresso do culto fica ~50% na 1ª de 2 músicas");
// sair pela barra compacta volta pra escala e tira o .present
await page.locator("#pv-back").click(); await page.waitForTimeout(200);
ok(await page.locator("#view-escala").isVisible() &&
   !(await page.evaluate(() => document.getElementById("view-player").classList.contains("present"))),
   "← da barra compacta volta pra escala e desliga o .present");

// 7d) v0.19.0: "livro" — virar a última página avança de música; voltar retoma a última página da anterior
const book = await page.evaluate(async () => {
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const longBody = Array.from({ length: 30 }, (_, i) => `[P${i + 1}]\nC  G  Am  F\nLinha ${i + 1}`).join("\n");
  songs.push({ id: "bookA", title: "Livro A", key: "C", capo: 0, tags: [], updatedAt: 1, body: longBody });
  songs.push({ id: "bookB", title: "Livro B", key: "C", capo: 0, tags: [], updatedAt: 1, body: "C  G\nso uma linha" });
  saveSongs(); settings.readMode = "page";
  const ctx = { id: "bookEsc", idx: 0, list: [{ songId: "bookA", key: "", capo: 0 }, { songId: "bookB", key: "", capo: 0 }] };
  openPlayer("bookA", ctx); await sleep(250);
  const pagesA = pageCount();
  gotoPage(pagesA - 1, false); await sleep(80);          // vai pra última página da A
  goPage(1); await sleep(250);                            // virar além da última → próxima música
  const fwd = { idx: escalaCtx.idx, page: curPage() };
  goPage(-1); await sleep(250);                           // voltar da 1ª página da B → última página da A
  const back = { idx: escalaCtx.idx, page: curPage(), pages: pageCount() };
  setReadMode("scroll");                                  // restaura o padrão p/ os próximos testes
  return { pagesA, fwd, back };
});
ok(book.pagesA >= 2, "Setup: música A da escala tem várias páginas (" + book.pagesA + ")");
ok(book.fwd.idx === 1 && book.fwd.page === 0, "Virar a última página avança pra próxima música (na 1ª página)");
ok(book.back.idx === 0 && book.back.page === book.back.pages - 1,
   "Voltar da 1ª página retoma a ÚLTIMA página da música anterior (livro)");

// 8) Compatibilidade com o nome antigo (Levita)
ok(/Louvai/.test(await page.locator(".brand").first().textContent()), "Cabeçalho mostra o novo nome (Louvai)");
const compat = await page.evaluate(() => {
  importJSON(JSON.stringify({ type: "levita-song", version: 1,
    song: { title: "Música Era Levita", key: "C", body: "C  G\nLinha antiga" } }));
  return songs.some(s => s.title === "Música Era Levita");
});
ok(compat, "Importa arquivo antigo 'levita-song' (compatibilidade)");

// 8b) Migração do localStorage: dados gravados pelo Levita aparecem no Louvai
const ctx2 = await browser.newContext({ viewport: { width: 412, height: 915 } });
const page2 = await ctx2.newPage();
await page2.addInitScript(() => {
  localStorage.setItem("levita.songs.v1", JSON.stringify([
    { id: "old1", title: "Migrada do Levita", key: "D", capo: 0, tags: [], updatedAt: 1, body: "D  A\nTexto" }]));
});
await page2.goto(APP_URL);
await page2.waitForTimeout(300);
ok((await page2.locator(".songcard", { hasText: "Migrada do Levita" }).count()) === 1,
   "Migra o repertório das chaves antigas do localStorage");
await ctx2.close();

// ===== v0.13.2 — robustez, segurança e acessibilidade =====

// esc() escapa aspas (fecha XSS por atributo) e tolera valor não-string
const escq = await page.evaluate(() => ({ dq: esc('a"b'), sq: esc("x'y"), num: esc(123) }));
ok(escq.dq === "a&quot;b" && escq.sq === "x&#39;y", "esc() escapa aspas (fecha XSS por atributo na escala importada)");
ok(escq.num === "123", "esc() tolera valor não-string sem derrubar o render");

// lint poupa palavras da letra começadas por nota, mas ainda pega token com forma de acorde inválido
const lint = await page.evaluate(() => ({
  deus: lintCifra("C G Deus").length,
  gloria: lintCifra("D A Glória").length,
  bad: lintCifra("C G Cg").map(i => i.token).join(","),
}));
ok(lint.deus === 0 && lint.gloria === 0, "Lint não acusa palavra da letra (Deus/Glória) em linha com acordes");
ok(lint.bad === "Cg", "Lint ainda acusa token com forma de acorde inválido (Cg)");

// re-importar a mesma escala atualiza em vez de duplicar (dedup por id)
const escDup = await page.evaluate(() => {
  const e = { id: "esc-dup-1", title: "Escala Dup", date: "2026-06-01", type: "Culto", team: [], items: [], updatedAt: 5 };
  const json = JSON.stringify({ type: "louvai-escala", version: 1, escala: e, songs: [] });
  importJSON(json); importJSON(json);
  return escalas.filter(x => x.id === "esc-dup-1").length;
});
ok(escDup === 1, "Re-importar a mesma escala não duplica (dedup por id)");

// acessibilidade: botões só-ícone com nome acessível e toggle expondo estado
ok((await page.locator("#p-back").getAttribute("aria-label")) === "Voltar" &&
   (await page.locator("#lyr-toggle").getAttribute("aria-pressed")) === "false",
   "Acessibilidade: botão só-ícone tem nome e toggle expõe aria-pressed");

// repertório esvaziado de propósito não ressuscita o exemplo (flag settings.seeded)
const ctx3 = await browser.newContext({ viewport: { width: 412, height: 915 } });
const page3 = await ctx3.newPage();
await page3.addInitScript(() => {
  localStorage.setItem("louvai.settings.v1", JSON.stringify({ theme: "dark", seeded: true }));
  localStorage.setItem("louvai.songs.v1", JSON.stringify([]));
});
await page3.goto(APP_URL);
await page3.waitForTimeout(300);
ok((await page3.locator(".songcard").count()) === 0, "Repertório esvaziado de propósito não ressuscita o exemplo");
await ctx3.close();

// "Reduzir movimento" do sistema praticamente desliga o fade entre telas
const ctx4 = await browser.newContext({ viewport: { width: 412, height: 915 }, reducedMotion: "reduce" });
const page4 = await ctx4.newPage();
await page4.goto(APP_URL);
await page4.waitForTimeout(200);
const animDur = await page4.evaluate(() => getComputedStyle(document.getElementById("view-lib")).animationDuration);
ok(parseFloat(animDur) < 0.01, "Reduzir movimento: fade entre telas praticamente desligado");
await ctx4.close();

// ===== v0.15.0 — Modo Página =====
// cifra longa o bastante p/ render ≥2 páginas no viewport de teste (412x915)
const longBody = Array.from({ length: 16 }, (_, i) =>
  `[Parte ${i + 1}]\nC      G      Am     F\nLinha de letra numero ${i + 1} cantando ao vivo\n`).join("\n");
await page.evaluate((body) => {
  const ex = songs.find(s => s.id === "pagetest");
  if (ex) ex.body = body; else songs.push({ id: "pagetest", title: "Cifra Longa", artist: "", key: "C", capo: 0, tags: [], updatedAt: Date.now(), body });
  saveSongs(); openPlayer("pagetest");
}, longBody);
await page.waitForTimeout(200);
await page.locator("#p-settings").click(); await page.waitForTimeout(250);
await page.locator("#mode-page").click(); await page.waitForTimeout(300);
const pg = await page.evaluate(() => ({
  paged: document.getElementById("p-body").classList.contains("paged"),
  pages: +document.getElementById("p-body").dataset.pages,
  ind: !document.getElementById("p-pageind").classList.contains("hidden"),
  barHidden: document.getElementById("scrollbar-mini").classList.contains("hidden"),
}));
ok(pg.paged && pg.pages >= 2, "Modo Página fatia a cifra longa em ≥2 páginas (" + pg.pages + ")");
ok(pg.ind, "Indicador de página visível no modo página");
ok(pg.barHidden, "Barra de auto-scroll some no modo página");
// fonte recalcula a paginação: fonte maior → mais páginas
const pagesSmall = pg.pages;
for (let i = 0; i < 10; i++) await page.locator("#f-up").click();
await page.waitForTimeout(300);
const pagesBig = await page.evaluate(() => +document.getElementById("p-body").dataset.pages);
ok(pagesBig > pagesSmall, "Aumentar a fonte recalcula e gera mais páginas (" + pagesSmall + "→" + pagesBig + ")");
for (let i = 0; i < 10; i++) await page.locator("#f-down").click();   // restaura a fonte
await page.waitForTimeout(300);
// fecha o sheet e vira página por toque (direita avança, esquerda volta)
await page.locator("#playerbg").click({ position: { x: 10, y: 10 } }); await page.waitForTimeout(300);
await page.locator("#p-body").click({ position: { x: 350, y: 280 } }); await page.waitForTimeout(300);
ok((await page.evaluate(() => +document.getElementById("p-body").dataset.page)) === 1, "Toque na metade direita avança a página");
await page.locator("#p-body").click({ position: { x: 50, y: 280 } }); await page.waitForTimeout(300);
ok((await page.evaluate(() => +document.getElementById("p-body").dataset.page)) === 0, "Toque na metade esquerda volta a página");
// anti-órfã: nenhuma página (exceto a última) termina numa linha só de acordes
const noOrphan = await page.evaluate(() => {
  const pages = [...document.getElementById("p-body").children];
  for (let i = 0; i < pages.length - 1; i++) {
    const lns = [...pages[i].querySelectorAll(".ln")];
    const last = lns[lns.length - 1];
    if (last && last.querySelector(".chord") && !last.querySelector(".lyr")) return false;
  }
  return true;
});
ok(noOrphan, "Nenhuma página (exceto a última) termina em linha só de acordes");
// voltar pra Rolagem desfaz a paginação
await page.locator("#p-settings").click(); await page.waitForTimeout(250);
await page.locator("#mode-scroll").click(); await page.waitForTimeout(200);
ok(!(await page.evaluate(() => document.getElementById("p-body").classList.contains("paged"))), "Voltar pra Rolagem desfaz a paginação (.paged sai)");
await page.locator("#playerbg").click({ position: { x: 10, y: 10 } }); await page.waitForTimeout(200);
// instrumental SEM linhas em branco não pode colapsar numa unidade gigante (1 página que clipa)
await page.evaluate(() => {
  const body = Array.from({ length: 20 }, (_, i) => `[Trecho ${i + 1}]\nC  G  Am  F  Dm  E`).join("\n");
  const ex = songs.find(s => s.id === "instrtest");
  if (ex) ex.body = body; else songs.push({ id: "instrtest", title: "Instrumental", key: "C", capo: 0, tags: [], updatedAt: Date.now(), body });
  saveSongs(); settings.readMode = "page"; openPlayer("instrtest");
});
await page.waitForTimeout(300);
ok((await page.evaluate(() => +document.getElementById("p-body").dataset.pages)) >= 2,
  "Instrumental sem linhas em branco fatia em ≥2 páginas (não vira unidade gigante)");
await page.evaluate(() => { setReadMode("scroll"); });   // devolve ao padrão

// regressão (bug de sub-pixel): num viewport de celular cujo avail é fracionário
// (390x844 → 560.8125px), a paginação tem que EMPACOTAR várias linhas por página,
// não 1-2 (o que fazia uma cifra virar centenas de páginas).
const ctx5 = await browser.newContext({ viewport: { width: 390, height: 844 } });
const page5 = await ctx5.newPage();
await page5.goto(APP_URL); await page5.waitForTimeout(300);
const dense = await page5.evaluate(() => {
  const body = Array.from({ length: 12 }, (_, i) => `[Parte ${i + 1}]\nC      G      Am     F\nLinha de letra ${i + 1}`).join("\n");
  songs.push({ id: "densetest", title: "Densa", key: "C", capo: 0, tags: [], updatedAt: Date.now(), body });
  saveSongs(); settings.readMode = "page"; openPlayer("densetest");
  const pages = [...document.getElementById("p-body").children];
  return Math.max(...pages.map(pg => pg.querySelectorAll(".ln").length));
});
ok(dense >= 5, "Paginação empacota várias linhas por página no celular (máx " + dense + " linhas/página)");
await ctx5.close();

// ===== v0.21.0 — Compartilhar por link (auto-importável, serverless) =====
// round-trip dos helpers: packData→unpackData devolve o JSON idêntico (gzip ou fallback)
const rt = await page.evaluate(async () => {
  const env = { type: "louvai-escala", version: 1, app: "x",
    escala: { id: "e1", title: "Café com Deus", items: [] }, songs: [{ id: "s1", title: "Canção" }] };
  const packed = await packData(env);
  const back = await unpackData(packed);
  return { tag: packed.slice(0, 2), same: back === JSON.stringify(env) };
});
ok(rt.same, "packData→unpackData devolve o JSON idêntico (round-trip)");
ok(rt.tag === "g." || rt.tag === "r.", "Payload do link tem tag de compressão válido (" + rt.tag + ")");

// buildImportLink monta base da location + #imp= com o payload taggeado
const link = await page.evaluate(async () => {
  const url = await buildImportLink({ type: "louvai-song", version: 1, app: "x", song: { title: "T" } });
  const base = location.origin + location.pathname;
  return { ok: url.indexOf(base + "#imp=") === 0, tag: url.split("#imp=")[1].slice(0, 2) };
});
ok(link.ok, "buildImportLink monta base + #imp=");
ok(link.tag === "g." || link.tag === "r.", "Link gerado embute payload com tag de compressão");

// receber por link (fluxo): monta uma escala nova com 1 cifra, seta o hash, abre a confirmação
await page.evaluate(async () => {
  const escala = { id: "link-esc-1", title: "Escala por Link", date: "2026-06-01", type: "Culto",
    team: [], items: [{ type: "song", songId: "link-song-1" }], updatedAt: 10 };
  const song = { id: "link-song-1", title: "Cifra por Link", key: "G", capo: 0, tags: [], updatedAt: 10, body: "G  C\nLetra" };
  const url = await buildImportLink({ type: "louvai-escala", version: 1, app: "x", escala, songs: [song] });
  location.hash = url.split("#")[1];
  await handleImportLink();
});
await page.waitForTimeout(200);   // o #sheet ganha .show num requestAnimationFrame
const recv = await page.evaluate(() => ({
  shown: document.getElementById("sheet").classList.contains("show"),
  title: document.getElementById("sheet-title").textContent,
}));
ok(recv.shown && recv.title === "Importar deste link?", "Link de escala abre a confirmação antes de salvar (nada salvo no escuro)");
// confirma (primeiro item da folha = "Importar …")
await page.locator("#sheet-body .sheetitem").first().click();
await page.waitForTimeout(200);
const after = await page.evaluate(() => ({
  esc: escalas.some(e => e.id === "link-esc-1"),
  song: songs.some(s => s.id === "link-song-1"),
  hashImp: (location.hash || "").indexOf("#imp=") === 0,
}));
ok(after.esc && after.song, "Confirmar o link importa a escala E a cifra (reuso do importJSON)");
ok(!after.hashImp, "Hash #imp= é limpo após tratar o link (refresh não reimporta)");

// cancelar não importa nada
const cancelBefore = await page.evaluate(async () => {
  const escala = { id: "link-esc-2", title: "Não importar", type: "Culto", team: [], items: [], updatedAt: 1 };
  const url = await buildImportLink({ type: "louvai-escala", version: 1, app: "x", escala, songs: [] });
  location.hash = url.split("#")[1];
  await handleImportLink();
  return escalas.length;
});
await page.locator("#sheet-body .sheetitem").nth(1).click();   // "Cancelar"
await page.waitForTimeout(150);
ok(await page.evaluate(() => !escalas.some(e => e.id === "link-esc-2")), "Cancelar a confirmação não importa nada");

// link inválido: payload com tag gzip mas conteúdo que não é gzip → toast de erro, sem exceção
await page.evaluate(async () => { location.hash = "#imp=g.zzzzzzzz"; await handleImportLink(); });
await page.waitForTimeout(150);
ok((await page.locator("#toast").textContent()).includes("inválido"), "Link inválido mostra toast de erro (sem quebrar o boot)");

// ===== v0.21.1 — aviso de link longo (apps de mensagem cortam a URL) =====
// link grande (repertório) dispara a folha de aviso ANTES de compartilhar, com a opção arquivo
await page.evaluate(async () => {
  window.__fileCalled = false;
  const bigSongs = Array.from({ length: 60 }, (_, i) => ({
    id: "big" + i, title: "Música " + i, key: "C", capo: 0, tags: [], updatedAt: 1,
    body: Array.from({ length: 40 }, (_, j) => "C  G  Am  F  linha " + i + "-" + j).join("\n") }));
  await shareLink({ type: "louvai-library", version: 1, app: "x", songs: bigSongs },
    "Repertório", () => { window.__fileCalled = true; });
});
await page.waitForTimeout(200);   // o #sheet ganha .show num requestAnimationFrame
const warn = await page.evaluate(() => ({
  shown: document.getElementById("sheet").classList.contains("show"),
  title: document.getElementById("sheet-title").textContent,
  items: [...document.querySelectorAll("#sheet-body .sheetitem")].map(e => e.textContent),
}));
ok(warn.shown && /Link longo/.test(warn.title), "Link longo dispara a folha de aviso antes de enviar");
ok(warn.items.length === 3 && /arquivo/i.test(warn.items[0]), "Aviso oferece 'enviar como arquivo' como 1ª opção");
// escolher "arquivo" no aviso aciona o envio por arquivo (caminho que sobrevive ao WhatsApp)
await page.locator("#sheet-body .sheetitem").first().click();
await page.waitForTimeout(100);
ok(await page.evaluate(() => window.__fileCalled === true), "Escolher 'arquivo' no aviso chama o envio por arquivo");

// link curto (uma cifra) NÃO dispara o aviso de tamanho — vai direto
await page.evaluate(async () => {
  await shareLink({ type: "louvai-song", version: 1, app: "x", song: { title: "T", body: "C  G" } },
    "Cifra T", () => {});
});
await page.waitForTimeout(150);
ok(!(await page.evaluate(() => document.getElementById("sheet").classList.contains("show")
     && /Link longo/.test(document.getElementById("sheet-title").textContent))),
   "Link curto não dispara o aviso de tamanho (vai direto)");

// ===== v0.22.0 — aviso de título duplicado antes de mesclar =====
const dupEnv = {
  type: "louvai-escala", version: 1, app: "x",
  escala: { id: "esc-dup-t", title: "Escala T", type: "Culto", team: [], items: [{ type: "song", songId: "deles-1" }], updatedAt: 10 },
  songs: [{ id: "deles-1", title: "Repetida", key: "G", capo: 0, tags: [], updatedAt: 10, body: "G\nversao deles" }],
};
const setupDup = () => page.evaluate(() => {
  songs.length = 0; escalas.length = 0;
  songs.push({ id: "meu-1", title: "Repetida", key: "C", capo: 0, tags: [], updatedAt: 5, body: "C\nminha versao" });
  saveSongs(); saveEscalas();
});
// importar escala com cifra de MESMO título e id diferente → avisa antes de mesclar
await setupDup();
await page.evaluate((env) => { importJSON(JSON.stringify(env)); }, dupEnv);
await page.waitForTimeout(200);
const dupSheet = await page.evaluate(() => ({
  shown: document.getElementById("sheet").classList.contains("show"),
  title: document.getElementById("sheet-title").textContent,
  items: [...document.querySelectorAll("#sheet-body .sheetitem")].length,
  rotulos: [...document.querySelectorAll("#sheet-body .sheetitem")].map(e => e.textContent.trim()),
}));
ok(dupSheet.shown && /Repetida/.test(dupSheet.title), "Título duplicado abre o aviso antes de mesclar");
ok(dupSheet.items === 4 && /nuvem/i.test(dupSheet.rotulos[1] || ""),
  "Aviso de duplicado oferece 4 saídas (minhas / da nuvem / cópias / cancelar)");
// nada foi salvo ainda (aviso antes de mexer)
ok(await page.evaluate(() => songs.length === 1), "Antes de escolher, nada é importado (nada salvo no escuro)");
// "Importar como cópias" (3º item desde a v0.65.0) → fica com as duas, escala aponta pra cifra importada
await page.locator("#sheet-body .sheetitem").nth(2).click();
await page.waitForTimeout(150);
const both = await page.evaluate(() => ({
  count: songs.filter(s => s.title === "Repetida").length,
  escSong: escalas.find(e => e.id === "esc-dup-t").items[0].songId,
}));
ok(both.count === 2, "‘Importar como cópias’ mantém as duas cifras de mesmo título");
ok(both.escSong === "deles-1", "Cópias: a escala aponta pra cifra importada (deles-1)");
// "Manter as minhas" (1º item) → não duplica e remapeia a escala pra minha cifra
await setupDup();
await page.evaluate((env) => { importJSON(JSON.stringify(env)); }, dupEnv);
await page.waitForTimeout(200);
await page.locator("#sheet-body .sheetitem").first().click();
await page.waitForTimeout(150);
const mine = await page.evaluate(() => ({
  reps: songs.filter(s => s.title === "Repetida").map(s => s.id),
  escSong: escalas.find(e => e.id === "esc-dup-t").items[0].songId,
}));
ok(mine.reps.length === 1 && mine.reps[0] === "meu-1", "‘Manter as minhas’ não duplica (fica só a minha)");
ok(mine.escSong === "meu-1", "Manter as minhas: a escala é remapeada pra minha cifra (meu-1)");

// ===== v0.65.0 — "Usar as da nuvem": a terceira saída do conflito (pedido de campo) =====
// Aparelho do membro com versões próprias: ele quer ADOTAR as da equipe, não manter nem duplicar.
await page.evaluate(() => {
  songs.length = 0; escalas.length = 0;
  songs.push({ id: "meu-1", title: "Repetida", key: "C", capo: 0, tags: [], updatedAt: 5, body: "C linha\nminha versao" });
  songs.push({ id: "soh-minha", title: "So Minha", key: "A", capo: 0, tags: [], updatedAt: 5, body: "A linha\nminha" });
  escalas.push({ id: "esc-local", title: "Culto daqui", date: "2026-09-20", team: [],
    items: [{ kind: "song", songId: "meu-1" }, { kind: "song", songId: "soh-minha" }], updatedAt: 5 });
  saveSongs(); saveEscalas();
});
await page.evaluate((env) => { importJSON(JSON.stringify(env)); }, dupEnv);
await page.waitForTimeout(200);
await page.locator("#sheet-body .sheetitem").nth(1).click();   // "Usar as da nuvem"
await page.waitForTimeout(300);
const aviso = await page.evaluate(() => ({
  aberto: document.getElementById("confirmdlg").classList.contains("show"),
  titulo: document.getElementById("confirm-title").textContent,
  sub: document.getElementById("confirm-sub").textContent,
  ok: document.getElementById("confirm-ok").textContent,
  mexeu: songs.some(s => s.id === "deles-1"),
}));
ok(aviso.aberto && /Usar as cifras da nuvem\?/.test(aviso.titulo) && aviso.ok === "Substituir",
  "‘Usar as da nuvem’ confirma antes de trocar");
ok(/1 cifra/.test(aviso.sub) && /1 escala deste aparelho passa/.test(aviso.sub) && /Culto daqui/.test(aviso.sub),
  `O aviso diz o tamanho da troca: "${aviso.sub}"`);
ok(!aviso.mexeu, "Nada é trocado antes de confirmar");
await page.locator("#confirm-ok").click(); await page.waitForTimeout(350);
const trocou = await page.evaluate(() => ({
  reps: songs.filter(s => s.title === "Repetida").map(s => s.id),
  corpo: (songs.find(s => s.title === "Repetida") || {}).body,
  soMinha: songs.some(s => s.id === "soh-minha"),
  escItens: escalas.find(e => e.id === "esc-local").items.map(i => i.songId),
  desfazer: !!document.querySelector("#toast .toastact"),
}));
ok(trocou.reps.length === 1 && trocou.reps[0] === "deles-1" && /versao deles/.test(trocou.corpo || ""),
  "A cifra da nuvem toma o lugar da minha (inclusive o id, para o conflito não voltar no próximo sync)");
ok(trocou.escItens[0] === "deles-1", "A escala DESTE aparelho passa a apontar para a cifra adotada (sem item órfão)");
ok(trocou.soMinha && trocou.escItens[1] === "soh-minha",
  "O que só existe aqui não é tocado (substituir ≠ espelhar tudo)");
ok(trocou.desfazer, "Depois de substituir aparece o DESFAZER");
await page.locator("#toast .toastact").click(); await page.waitForTimeout(300);
const voltou = await page.evaluate(() => ({
  reps: songs.filter(s => s.title === "Repetida").map(s => s.id),
  escItens: escalas.find(e => e.id === "esc-local").items.map(i => i.songId),
}));
ok(voltou.reps.length === 1 && voltou.reps[0] === "meu-1" && voltou.escItens[0] === "meu-1",
  "DESFAZER devolve a minha versão e a escala junto");
// a lápide NÃO entra: adotar a da nuvem é decisão local, não uma exclusão para propagar à equipe
ok(await page.evaluate(() => !deleted.some(t => t.id === "meu-1")),
  "Adotar a da nuvem não cria lápide (não apaga a cifra de ninguém ao publicar)");

// importar cifra de título NOVO não dispara aviso — entra direto (comportamento de sempre)
await setupDup();
await page.evaluate(() => {
  importJSON(JSON.stringify({ type: "louvai-song", version: 1, song: { id: "nova-1", title: "Inédita", key: "D", body: "D\nx" } }));
});
await page.waitForTimeout(150);
ok(await page.evaluate(() => songs.some(s => s.id === "nova-1") &&
   !(document.getElementById("sheet").classList.contains("show") && /Você já tem/.test(document.getElementById("sheet-title").textContent))),
   "Título inédito importa direto, sem aviso de duplicado");

// ===== v0.23.0 — backup com rede de segurança =====
// com conteúdo real e sem backup: "devido" (pontinho no ↥); exportar registra e limpa
const bk = await page.evaluate(() => {
  songs.length = 0; escalas.length = 0;
  songs.push({ id: "a", title: "A", key: "C", capo: 0, tags: [], updatedAt: 1, body: "C" });
  songs.push({ id: "b", title: "B", key: "C", capo: 0, tags: [], updatedAt: 1, body: "C" });
  delete settings.lastBackup; settings.dirtySinceBackup = true; saveSettings(); updateBackupBadge();
  const dueNever = backupDue(), badgeNever = document.getElementById("backupBtn").classList.contains("due");
  recordBackup();
  return { dueNever, badgeNever, dueAfter: backupDue(),
    badgeAfter: document.getElementById("backupBtn").classList.contains("due"),
    hasLB: !!settings.lastBackup, dirty: settings.dirtySinceBackup };
});
ok(bk.dueNever && bk.badgeNever, "Com conteúdo e sem backup, o lembrete fica devido (pontinho no ↥)");
ok(bk.hasLB && bk.dirty === false, "Exportar registra a data do backup e limpa 'mudanças desde então'");
ok(!bk.dueAfter && !bk.badgeAfter, "Logo após o backup, o lembrete some");
// alterar o repertório volta a marcar pendente
ok(await page.evaluate(() => { songs.push({ id: "c", title: "C", key: "C", capo: 0, tags: [], updatedAt: 1, body: "C" }); saveSongs(); return settings.dirtySinceBackup; }),
   "Alterar o repertório marca 'há mudanças desde o último backup'");
// repertório mínimo (1 cifra) não enche o saco
ok(await page.evaluate(() => { songs.length = 0; escalas.length = 0; songs.push({ id: "só", title: "Só uma", key: "C", capo: 0, tags: [], updatedAt: 1, body: "C" }); delete settings.lastBackup; settings.dirtySinceBackup = true; saveSettings(); return backupDue(); }) === false,
   "Repertório mínimo (1 cifra) não pede backup");
// sheet de Backup: rótulo de restaurar + linha de status do backup
await page.evaluate(() => document.getElementById("backupBtn").click());
await page.waitForTimeout(200);
ok(/restaurar de um arquivo/i.test(await page.evaluate(() => [...document.querySelectorAll("#sheet-body .sheetitem")].map(e => e.textContent).join("|"))),
   "Sheet de Backup tem 'Importar/restaurar de um arquivo (.json)' (a porta única desde a v0.63.0)");
ok(/[Úú]ltimo backup/.test(await page.evaluate(() => document.getElementById("sheet-note").textContent)),
   "Sheet de Backup mostra a linha do último backup");
await page.evaluate(() => closeSheet());

// lembrete "ativo": abrir o app com backup atrasado mostra um toast (config do dono)
const ctxBk = await browser.newContext({ viewport: { width: 412, height: 915 } });
const pageBk = await ctxBk.newPage();
await pageBk.addInitScript(() => {
  localStorage.setItem("louvai.settings.v1", JSON.stringify({ theme: "dark", seeded: true, dirtySinceBackup: true }));
  localStorage.setItem("louvai.songs.v1", JSON.stringify([
    { id: "x1", title: "Um", key: "C", capo: 0, tags: [], updatedAt: 1, body: "C" },
    { id: "x2", title: "Dois", key: "C", capo: 0, tags: [], updatedAt: 1, body: "C" }]));
});
await pageBk.goto(APP_URL);
await pageBk.waitForTimeout(1200);   // espera o lembrete do boot (700ms) + folga
ok(/backup/i.test(await pageBk.locator("#toast").textContent()), "Ao abrir com backup atrasado, cutuca por backup (lembrete ativo)");
await ctxBk.close();

// ===== v0.24.0 — "última vez que tocamos" (só escalas confirmadas) =====
const lp = await page.evaluate(() => {
  songs.length = 0; escalas.length = 0;
  songs.push({ id: "sA", title: "Cantai ao Senhor", key: "C", capo: 0, tags: [], updatedAt: 1, body: "C" });
  songs.push({ id: "sB", title: "Aleluia", key: "G", capo: 0, tags: [], updatedAt: 1, body: "G" });
  // escala PLANEJADA (não confirmada) com a música A
  escalas.push({ id: "e1", title: "Plano", date: "2026-01-04", type: "Culto", team: [], items: [{ kind: "song", songId: "sA" }], updatedAt: 1 });
  saveSongs(); saveEscalas();
  const before = buildLastPlayed().sA || null;
  escalas[0].done = true; saveEscalas();          // confirma o culto
  const m = buildLastPlayed();
  return { before, afterA: m.sA || null, afterB: m.sB || null };
});
ok(lp.before === null, "Escala planejada (não confirmada) NÃO conta como tocada");
ok(lp.afterA === "2026-01-04", "Confirmar 'Culto realizado' faz a música contar (data da escala)");
ok(lp.afterB === null, "Música fora da escala confirmada não fica marcada como tocada");
// a lista de cifras mostra a recência e "nunca tocada" nas demais (há escala confirmada)
await page.evaluate(() => { switchTab("songs"); renderLibrary(); });
await page.waitForTimeout(100);
const cards = await page.evaluate(() => [...document.querySelectorAll("#songlist .songcard")].map(c => ({
  t: c.querySelector(".c-ttl").textContent, p: (c.querySelector(".played") || {}).textContent || "" })));
ok(/tocada/.test((cards.find(c => c.t === "Cantai ao Senhor") || {}).p), "Card mostra 'tocada há…' na música tocada");
ok(/nunca tocada/.test((cards.find(c => c.t === "Aleluia") || {}).p), "Card mostra 'nunca tocada' na que não tocou");
// botão "Culto realizado" no detalhe alterna o estado e atualiza
const tog = await page.evaluate(() => {
  escalas.length = 0;
  escalas.push({ id: "e2", title: "Domingo", date: "2026-02-01", type: "Culto", team: [], items: [{ kind: "song", songId: "sA" }], updatedAt: 1 });
  saveEscalas(); openEscala("e2");
  const before = !!escalas.find(e => e.id === "e2").done;
  document.getElementById("es-done").click();
  return { before, after: !!escalas.find(e => e.id === "e2").done, label: document.getElementById("es-done").textContent };
});
ok(tog.before === false && tog.after === true, "Botão 'Culto realizado' confirma a escala");
ok(/realizado/i.test(tog.label), "Botão reflete o estado confirmado (✓ Culto realizado)");

// ===== v0.25.0 — diagramas de acorde =====
const dia = await page.evaluate(() => {
  const iv = q => chordIntervals(q).join(",");
  // pegada por NOTAS: a forma só pode soar notas DO acorde e tem que conter a raiz
  function soundsOf(fr){ const s = new Set(); fr.forEach((f, i) => { if (f >= 0) s.add((STR_PC[i] + f) % 12); }); return s; }
  function check(name){
    const fg = fingering(name); if (!fg) return { name, none: true };
    const pc = parseChord(name), root = NOTE_IDX[pc.root];
    const need = new Set(chordIntervals(pc.suffix).map(x => (root + x) % 12));
    const got = soundsOf(fg.frets);
    let subset = true; got.forEach(p => { if (!need.has(p)) subset = false; });
    return { name, subset, hasRoot: got.has(root) };
  }
  const names = [];
  ["C", "D", "E", "F", "G", "A", "B", "C#", "Eb", "F#", "Ab", "Bb"].forEach(r =>
    ["", "m", "7", "m7", "7M", "sus4"].forEach(q => names.push(r + q)));
  Object.keys(OPEN).forEach(k => names.push(k));   // valida TODAS as formas curadas por notas
  const results = names.map(check);
  return {
    maj: iv(""), m: iv("m"), m7: iv("m7"), maj7: iv("7M"), dom7: iv("7"),
    sus4: iv("sus4"), m7b5: iv("m7b5"), dim: iv("dim"),
    results, none: fingering("Cxyz9") === null, openC: JSON.stringify(fingering("C").frets),
    barreF: fingering("F") && fingering("F").barre ? fingering("F").barre.fret : null,
  };
});
ok(dia.maj === "0,4,7" && dia.m === "0,3,7" && dia.m7 === "0,3,7,10" && dia.maj7 === "0,4,7,11" && dia.dom7 === "0,4,7,10",
   "chordIntervals: tríades e sétimas (incl. 7M = sétima maior pt-BR)");
ok(dia.sus4 === "0,5,7" && dia.m7b5 === "0,3,6,10" && dia.dim === "0,3,6", "chordIntervals: sus4 / m7b5 / dim");
const bad = dia.results.filter(r => !r.none && (!r.subset || !r.hasRoot)).map(r => r.name);
ok(bad.length === 0, "Toda pegada (curada + gerada) só soa notas do acorde e tem a raiz" + (bad.length ? ": " + bad.join(",") : ""));
ok(dia.openC === "[-1,3,2,0,1,0]", "Forma aberta de C confere (x32010)");
ok(dia.barreF === 1, "F vira pestana na 1ª casa (E-shape móvel)");
ok(dia.none === true, "Acorde sem forma confiável → fingering null (sem diagrama honesto)");
// toque no acorde abre o diagrama; tocar fora fecha
await page.evaluate(() => {
  songs.length = 0;
  songs.push({ id: "dx", title: "Diag", key: "C", capo: 0, tags: [], updatedAt: 1, body: "C  G  Am  F\nletra de teste" });
  saveSongs(); openPlayer("dx");
});
await page.waitForTimeout(200);
await page.locator("#p-body .chord").first().click();
await page.waitForTimeout(150);
const shown = await page.evaluate(() => ({
  open: !document.getElementById("chorddiag").classList.contains("hidden"),
  name: (document.querySelector("#chorddiag .cd-name") || {}).textContent,
  svg: !!document.querySelector("#chorddiag svg"),
}));
ok(shown.open && shown.svg, "Tocar no acorde abre o diagrama (SVG)");
ok(shown.name === "C", "Diagrama mostra o acorde tocado (C)");
await page.evaluate(() => document.getElementById("chorddiagbg").click());
await page.waitForTimeout(100);
ok(await page.evaluate(() => document.getElementById("chorddiag").classList.contains("hidden")), "Tocar fora fecha o diagrama");

// ===== v0.26.0 — repertório + escalas por link (pull do GitHub Pages) =====
// "Exportar tudo" gera um snapshot louvai-full com songs E escalas
const fullEnv = await page.evaluate(() => {
  songs.length = 0; escalas.length = 0;
  songs.push({ id: "fs1", title: "Snapshot", key: "C", capo: 0, tags: [], updatedAt: 1, body: "C" });
  escalas.push({ id: "fe1", title: "Culto", date: "2026-03-01", type: "Culto", team: [], items: [{ kind: "song", songId: "fs1" }], updatedAt: 1 });
  const env = fullEnvelope();
  return { type: env.type, hasSongs: Array.isArray(env.songs) && env.songs.length === 1, hasEscalas: Array.isArray(env.escalas) && env.escalas.length === 1 };
});
ok(fullEnv.type === "louvai-full" && fullEnv.hasSongs && fullEnv.hasEscalas, "Exportar tudo gera snapshot louvai-full com cifras E escalas");
// importJSON entende louvai-full e mescla cifras + escalas
const fullImp = await page.evaluate(() => {
  songs.length = 0; escalas.length = 0;
  const snap = { type: "louvai-full", version: 1, app: "x",
    songs: [{ id: "ns1", title: "Nuvem 1", key: "C", capo: 0, tags: [], updatedAt: 1, body: "C" }],
    escalas: [{ id: "ne1", title: "Culto Nuvem", date: "2026-03-08", type: "Culto", team: [{ role: "Vocal", name: "Ana" }], items: [{ kind: "song", songId: "ns1" }], updatedAt: 1 }] };
  importJSON(JSON.stringify(snap));
  return { song: songs.some(s => s.id === "ns1"), esc: escalas.some(e => e.id === "ne1"),
           team: (escalas.find(e => e.id === "ne1") || {}).team?.[0]?.name };
});
ok(fullImp.song && fullImp.esc, "importJSON louvai-full mescla cifras E escalas");
ok(fullImp.team === "Ana", "Snapshot leva a equipe junto (campo team)");
// pullRepo busca de uma data: URL e mescla (fura-cache desligado p/ data:)
const pull = await page.evaluate(async () => {
  songs.length = 0; escalas.length = 0;
  const snap = { type: "louvai-full", version: 1, app: "x",
    songs: [{ id: "p1", title: "Puxada", key: "G", capo: 0, tags: [], updatedAt: 1, body: "G" }],
    escalas: [{ id: "pe1", title: "Culto Link", date: "2026-03-15", type: "Culto", team: [], items: [{ kind: "song", songId: "p1" }], updatedAt: 1 }] };
  settings.repoUrl = "data:application/json," + encodeURIComponent(JSON.stringify(snap));
  await pullRepo();
  return { song: songs.some(s => s.id === "p1"), esc: escalas.some(e => e.id === "pe1"), at: !!settings.repoPulledAt };
});
ok(pull.song && pull.esc, "Atualizar do link (pullRepo) baixa e mescla cifras + escalas");
ok(pull.at, "Pull registra a data da última atualização do link");
// erro tratado: link sem JSON válido → toast de erro, sem exceção
await page.evaluate(async () => { settings.repoUrl = "data:text/plain,isto-nao-eh-json"; await pullRepo(); });
await page.waitForTimeout(120);
ok(/válido/.test(await page.locator("#toast").textContent()), "Link inválido no pull mostra erro (sem quebrar)");

// ===== v0.27.0 — Publicar na nuvem (token do GitHub + API Contents) =====
// derivação owner/repo/path a partir da URL de pull
const gh = await page.evaluate(() => ({
  proj: ghRepoFromUrl("https://wesleywps.github.io/louvai/louvai.json"),
  user: ghRepoFromUrl("https://wesleywps.github.io/louvai.json"),
  bad: ghRepoFromUrl("https://example.com/x.json"),
}));
ok(gh.proj && gh.proj.owner === "wesleywps" && gh.proj.repo === "louvai" && gh.proj.path === "louvai.json",
   "ghRepoFromUrl: site de projeto → owner/repo/path");
ok(gh.user && gh.user.repo === "wesleywps.github.io" && gh.user.path === "louvai.json", "ghRepoFromUrl: site de usuário");
ok(gh.bad === null, "ghRepoFromUrl: URL não-GitHub → null");
// base64 padrão (o que a API do GitHub espera)
const b64 = await page.evaluate(() => ({ s: bytesToB64(new TextEncoder().encode("Louvai")), dec: atob(bytesToB64(new TextEncoder().encode("Louvai"))) }));
ok(b64.s === btoa("Louvai") && b64.dec === "Louvai", "bytesToB64 produz base64 padrão (decodifica de volta)");
// publishRepo (fluxo real): abrir a folha da nuvem → tocar Publicar → ela FECHA e abre a confirmação
await page.evaluate(async () => {
  songs.length = 0; escalas.length = 0;
  songs.push({ id: "pubx", title: "Pub", key: "C", capo: 0, tags: [], updatedAt: 1, body: "C" });
  settings.repoUrl = "https://wesleywps.github.io/louvai/louvai.json"; settings.ghToken = "tok123";
  delete settings.repoPublishedAt;
  // a nuvem tem 1 cifra ("old1") que NÃO existe local → diff esperado: +1 (pubx) / −1 (old1)
  const cloud = { type: "louvai-full", songs: [{ id: "old1", title: "Velha", key: "C", capo: 0, tags: [], updatedAt: 1, body: "C" }], escalas: [] };
  const b64 = btoa(unescape(encodeURIComponent(JSON.stringify(cloud))));
  window.__calls = []; window.__real = window.fetch;
  window.fetch = async (url, opts) => { window.__calls.push({ url: String(url), opts: opts || {} });
    return ((opts && opts.method) === "PUT")
      ? { ok: true, status: 200, json: async () => ({ content: {} }) }
      : { ok: true, status: 200, json: async () => ({ sha: "deadbeef", content: b64 }) }; };
  openRepoSheet();                                   // abre a folha "Repertório na nuvem"
});
await page.waitForTimeout(150);                       // deixa a folha abrir de fato (fiel ao uso real)
await page.evaluate(() => document.getElementById("repo-publish").click());   // toca "Publicar na nuvem"
await page.waitForTimeout(220);
const conf = await page.evaluate(() => ({
  repoOpen: document.getElementById("reposheet").classList.contains("show"),
  shown: document.getElementById("sheet").classList.contains("show"),
  title: document.getElementById("sheet-title").textContent,
  note: document.getElementById("sheet-note").textContent,
  items: [...document.querySelectorAll("#sheet-body .sheetitem")].map(e => e.textContent).join("|"),
  published: !!settings.repoPublishedAt,
}));
ok(!conf.repoOpen, "A folha 'Repertório na nuvem' fecha ao abrir a confirmação (não empilha por cima)");
ok(conf.shown && /Publicar na nuvem\?/.test(conf.title), "Publicar abre confirmação ANTES de escrever");
ok(/\+1/.test(conf.items) && /−1/.test(conf.note), "Diff mostra +1 cifra nova e −1 removida (rede de segurança)");
ok(/REMOVER/.test(conf.note), "Aviso de remoção aparece quando o diff tira itens da nuvem");
ok(/detalhes/i.test(conf.items), "Confirmação oferece 'Ver detalhes (nomes)'");
ok(conf.published === false, "Nada é publicado antes de confirmar");
// "Ver detalhes" (2º item) → folha com os NOMES (Pub adicionada, Velha removida)
await page.locator("#sheet-body .sheetitem").nth(1).click();
await page.waitForTimeout(160);
const det = await page.evaluate(() => [...document.querySelectorAll("#sheet-body .sheetitem")].map(e => e.textContent).join("|"));
ok(/Pub/.test(det) && /Velha/.test(det), "Detalhes listam os nomes que entram (Pub) e saem (Velha)");
// confirma a partir dos detalhes → escreve (PUT com Authorization + snapshot em base64 + sha)
await page.locator("#sheet-body .sheetitem").first().click();
await page.waitForTimeout(150);
const pub = await page.evaluate(() => { const calls = window.__calls; window.fetch = window.__real;
  const put = calls.find(c => c.opts.method === "PUT"); let body = {}; try { body = JSON.parse(put.opts.body); } catch (e) {}
  return { get: calls.some(c => !c.opts.method || c.opts.method === "GET"), put: !!put,
    auth: put && put.opts.headers.Authorization, hasSha: !!body.sha,
    content: body.content ? atob(body.content) : "", at: !!settings.repoPublishedAt }; });
ok(pub.get && pub.put, "Confirmar publica: busca o sha (GET) e escreve (PUT)");
ok(pub.auth === "Bearer tok123", "PUT vai com Authorization: Bearer <token>");
ok(pub.hasSha && /"type":"louvai-full"/.test(pub.content), "PUT envia o snapshot (louvai-full) em base64, com o sha");
ok(pub.at, "Publicar registra a data da última publicação");
const pubToast = await page.locator("#toast").textContent();
ok(/Publicado: 1 música e 0 escalas/.test(pubToast) && /cifras \+1 −1/.test(pubToast), "Toast de publicar conta músicas/escalas + delta (v0.41.0)");
// sem token / URL não-GitHub: avisa sem tocar a rede
await page.evaluate(async () => { settings.ghToken = ""; settings.repoUrl = "https://wesleywps.github.io/louvai/louvai.json"; await publishRepo(); });
await page.waitForTimeout(80);
ok(/token/i.test(await page.locator("#toast").textContent()), "Publicar sem token avisa pra colar o token");
await page.evaluate(async () => { settings.ghToken = "t"; settings.repoUrl = "https://example.com/x.json"; await publishRepo(); });
await page.waitForTimeout(80);
ok(/GitHub Pages/.test(await page.locator("#toast").textContent()), "Publicar com URL não-GitHub avisa o limite");
// "Remover token" limpa do aparelho
ok(await page.evaluate(() => { settings.ghToken = "x"; saveSettings(); document.getElementById("repo-forget").click(); return !settings.ghToken; }),
   "Remover token apaga o token do aparelho");

// ===== v0.28.0 — Onda 1 de UI (tokens, Tom, toast tipado, vazios, ícones) =====
// Tom destacado no player (mono+acento) — o span .tomhi existe e contém "Tom:"
const tomhi = await page.evaluate(() => {
  songs.length = 0; escalas.length = 0;
  songs.push({ id: "u1", title: "UI", key: "G", capo: 0, tags: [], updatedAt: 1, body: "G  C\nx" });
  saveSongs(); openPlayer("u1");
  const el = document.querySelector("#p-sub .tomhi");
  return { has: !!el, txt: el ? el.textContent : "", accent: el ? getComputedStyle(el).color : "" };
});
ok(tomhi.has && /Tom:/.test(tomhi.txt), "Tom aparece em destaque (.tomhi) na linha do player");
await page.evaluate(() => exitPlayer());
// toast tipado: erro ganha a classe .err
const tt = await page.evaluate(() => { toast("teste de erro", "err"); return document.getElementById("toast").className; });
ok(/\berr\b/.test(tt), "toast(msg,'err') aplica a faixa de erro");
// estado vazio de busca distinto + limpar
await page.evaluate(() => { songs.length = 0; saveSongs(); switchTab("songs"); $("#search").value = "zzz-nao-existe"; renderLibrary(); });
await page.waitForTimeout(80);
ok(await page.evaluate(() => !!document.querySelector("#songlist .empty.search") && !!document.getElementById("empty-clear")),
   "Busca sem resultado mostra estado vazio próprio + Limpar");
await page.evaluate(() => { document.getElementById("empty-clear").click(); });
ok(await page.evaluate(() => $("#search").value === ""), "Limpar busca zera o filtro");
// ícone do Backup virou SVG e a entrada se chama "Repertório"
ok(await page.evaluate(() => !!document.querySelector("#backupBtn .ic-svg")), "Botão de Backup usa ícone SVG (archive)");
ok(await page.evaluate(() => document.getElementById("backupBtn").getAttribute("aria-label").includes("Repertório")), "Backup renomeado para 'Repertório' (aria-label)");

// ===== v0.29.0 — Onda 2: ícones SVG inline unificados (Lucide) via icon()/ICONS =====
// o helper icon() é a fonte única e devolve um <svg class="ic-svg">
ok(await page.evaluate(() => typeof icon === "function" && /^<svg class="ic-svg"/.test(icon("archive")) && icon("archive").length > 30),
   "icon(name) devolve um <svg class=ic-svg> a partir do ICONS");
// botões só-ícone foram pintados com SVG no boot (sem glifo de texto sobrando)
ok(await page.evaluate(() => ["#themeBtn","#backupBtn","#p-back","#p-struct","#p-settings","#es-share","#es-edit"]
     .every(s => { const e=document.querySelector(s); return e && e.querySelector(".ic-svg") && e.textContent.trim()===""; })),
   "Botões só-ícone usam SVG (sem glifo de texto)");
// botões ícone+rótulo mantêm o texto e ganham o SVG prefixado (.ic-tx)
ok(await page.evaluate(() => { const e=document.querySelector("#es-present"); return !!(e && e.querySelector(".ic-tx") && /Apresentar/.test(e.textContent)); }),
   "Botões ícone+rótulo prefixam SVG e preservam o texto (es-present)");
// abas inferiores e lupa da busca migraram pra SVG
ok(await page.evaluate(() => !!document.querySelector("#tab-songs .nic .ic-svg") && !!document.querySelector("#tab-escalas .nic .ic-svg")),
   "Abas inferiores (Cifras/Escalas) usam ícone SVG");
ok(await page.evaluate(() => [...document.querySelectorAll(".mag")].every(m => !!m.querySelector(".ic-svg"))),
   "Lupa da busca usa ícone SVG");
// itens de sheet renderizam o SVG dentro do .ic (label segue casando por texto)
ok(await page.evaluate(() => { openSheet("t", [{ ic: icon("link"), label: "Item de teste", fn(){} }]);
     return !!document.querySelector("#sheet-body .sheetitem .ic .ic-svg") && /Item de teste/.test(document.querySelector("#sheet-body .sheetitem").textContent); }),
   "Itens de sheet renderizam SVG no .ic (texto do label preservado)");
await page.evaluate(() => closeSheet());
// estado vazio injeta o ícone via icon() (não mais ::before)
await page.evaluate(() => { songs.length = 0; saveSongs(); switchTab("songs"); $("#search").value = ""; activeTag = null; renderLibrary(); });
await page.waitForTimeout(60);
ok(await page.evaluate(() => !!document.querySelector("#songlist .empty .eic .ic-svg")), "Estado vazio mostra ícone SVG (.eic)");

// ===== v0.30.0 — Onda 3 / M2: ⚙ Ajustes agrupado em seções =====
const sec = await page.evaluate(() => [...document.querySelectorAll("#playersheet .sheetsec")].map(e => e.textContent));
ok(sec.length === 3 && /Afina/.test(sec[0]) && /Leitura/.test(sec[1]) && /música/i.test(sec[2]),
   "⚙ Ajustes tem 3 seções (Afinação · Leitura · Esta música)");
// IDs dos controles preservados após reordenar
ok(await page.evaluate(() => ["#s-tkey","#c-val","#f-down","#mode-page","#lyr-toggle","#tabs-toggle","#scrollbar-toggle","#p-edit","#p-share"]
     .every(s => !!document.querySelector(s))),
   "Controles do Ajustes mantêm os IDs (Tom/Capo/Fonte/Modo/toggles/Editar/Enviar)");
// a linha de ações (Editar/Enviar) ocupa a largura
ok(await page.evaluate(() => !!document.querySelector("#playersheet .ctrl.actions #p-edit")),
   "Editar/Enviar ficam na seção 'Esta música' como linha de ações");

// ===== v0.31.0 — Onda 3 / M4: linguagem de card unificada (.songcard × .escard) =====
const m4 = await page.evaluate(() => {
  songs.length = 0; escalas.length = 0;
  songs.push({ id: "m4a", title: "Card Cifra", artist: "Artista X", key: "D", capo: 0, tags: ["lento", "ceia"], updatedAt: 1, body: "D\nx" });
  escalas.push({ id: "m4e", title: "Culto M4", date: "2026-01-01", time: "", type: "Culto", team: [{ role: "Voz", name: "A" }], items: [{ kind: "song", songId: "m4a", key: "", capo: 0 }], updatedAt: 1 });
  saveSongs(); saveEscalas();
  switchTab("songs"); $("#search").value = ""; activeTag = null; renderLibrary();
  const sc = document.querySelector("#songlist .songcard");
  switchTab("escalas"); renderEscalas();
  const ec = document.querySelector("#escalalist .escard");
  return {
    // v0.43.0/0.43.1: card de música compacto — tom no tile .keytag (esquerda, menor) + metadados na .c-sub
    scOk: !!(sc.querySelector(".c-ttl") && sc.querySelector(".keytag") && sc.querySelector(".c-sub")),
    scKey: (sc.querySelector(".keytag") || {}).textContent || "",
    scSub: (sc.querySelector(".c-sub") || {}).textContent || "",
    scNoMeta: !sc.querySelector(".c-meta"),
    ecOk: !!(ec.querySelector(".c-ttl") && ec.querySelector(".c-sub") && ec.querySelector(".c-meta .pill")),
    noEstag: !document.querySelector(".estag")
  };
});
ok(m4.scOk && m4.scKey === "D" && /Artista X/.test(m4.scSub) && /lento/.test(m4.scSub), "songcard: tom no tile .keytag ('D', à esquerda) + metadados foldados na .c-sub (artista, tags)");
ok(m4.scNoMeta, "songcard folda os metadados na .c-sub (sem a faixa de pílulas .c-meta empilhada)");
ok(m4.ecOk && m4.noEstag, "escard mantém .c-ttl/.c-sub/.c-meta .pill (sem .estag)");

// ===== v0.32.0 — Onda 3 / M5: #reposheet em cartões (Baixar × Publicar recolhido) =====
const m5 = await page.evaluate(() => {
  settings.ghToken = ""; saveSettings(); openRepoSheet();
  const pullCard = !!document.querySelector("#reposheet .repo-card .repo-h");
  const pub = document.querySelector("#reposheet details.repo-pub");
  const collapsedNoToken = !!(pub && !pub.open);
  const idsInside = !!(pub && pub.querySelector("#repo-export") && pub.querySelector("#gh-token") && pub.querySelector("#repo-publish"));
  closeRepoSheet();
  settings.ghToken = "tok"; saveSettings(); openRepoSheet();
  const openWithToken = document.querySelector("#reposheet details.repo-pub").open;
  closeRepoSheet(); settings.ghToken = ""; saveSettings();
  return { pullCard, collapsedNoToken, idsInside, openWithToken };
});
ok(m5.pullCard && m5.idsInside, "#reposheet tem cartão Baixar + bloco Publicar (export/token/publish dentro)");
ok(m5.collapsedNoToken, "Publicar fica recolhido por padrão (equipe sem token)");
ok(m5.openWithToken, "Publicar abre sozinho quando já há token salvo (líder)");

// ===== v0.33.0 — Onda 3 / M3: arrastar para fechar sheets =====
const m3 = await page.evaluate(() => {
  const drag = (dist) => {
    openSheet("Arraste", [{ ic: icon("x"), label: "x", fn() {} }]);
    const sheet = document.getElementById("sheet"), grip = sheet.querySelector(".grip");
    sheet.classList.add("show");   // openS adiciona .show via rAF (não dispara no evaluate síncrono)
    const r = grip.getBoundingClientRect();
    const ev = (type, y) => new PointerEvent(type, { bubbles: true, cancelable: true, pointerId: 1, clientX: r.x + 5, clientY: y });
    grip.dispatchEvent(ev("pointerdown", r.y));
    sheet.dispatchEvent(ev("pointermove", r.y + dist));
    sheet.dispatchEvent(ev("pointerup", r.y + dist));
    return sheet.classList.contains("show");
  };
  const closedAfterFar = !drag(140);   // arraste longo → fecha
  const stillOpenNear = drag(25);      // arraste curto → volta (mola), continua aberto
  closeSheet();
  return { closedAfterFar, stillOpenNear };
});
ok(m3.closedAfterFar, "Arrastar o sheet pra baixo além do limiar fecha");
ok(m3.stillOpenNear, "Arraste curto volta com mola (sheet continua aberto)");

// ===== v0.34.0 — Onda 3 / M7: animação de entrada da lista (stagger só na 1ª pintura) =====
const m7 = await page.evaluate(() => {
  songs.length = 0;
  songs.push({ id: "s7a", title: "A", key: "C", capo: 0, tags: [], updatedAt: 1, body: "C" });
  songs.push({ id: "s7b", title: "B", key: "D", capo: 0, tags: [], updatedAt: 1, body: "D" });
  saveSongs();
  staggered.lib = false;                       // simula a primeira pintura da lista
  switchTab("songs"); $("#search").value = ""; activeTag = null; renderLibrary();
  // v0.59.0: quem entra na lista agora é o .swipewrap (o card mora dentro dele)
  const cards = [...document.querySelectorAll("#songlist .swipewrap")];
  const firstAnimated = cards[0].classList.contains("card-in");
  const hasDelay = !!cards[1].style.animationDelay;
  const temCard = cards.every(w => !!w.querySelector(".songcard"));
  renderLibrary();                              // 2ª pintura (ex.: busca) NÃO re-anima
  const reanimated = [...document.querySelectorAll("#songlist .swipewrap")].some(c => c.classList.contains("card-in"));
  return { firstAnimated, hasDelay, n: cards.length, reanimated, temCard };
});
ok(m7.firstAnimated && m7.hasDelay && m7.n === 2 && m7.temCard, "Lista anima na 1ª pintura (.card-in + animation-delay escalonado, agora no .swipewrap)");
ok(!m7.reanimated, "Re-render (busca/filtro) não re-anima a lista");

// ===== v0.36.0 — Onda 3 / M6: skeleton de carregamento no "Atualizar do link" =====
const m6 = await page.evaluate(async () => {
  const real = window.fetch;
  let release;
  window.fetch = () => new Promise(r => { release = () => r({ ok: true, status: 200, text: async () => JSON.stringify({ type: "louvai-full", songs: [], escalas: [] }) }); });
  settings.repoUrl = "https://louvai-teste.example/louvai.json"; saveSettings();   // host não-GitHub: pull por fetch direto (stub sem .json())
  switchTab("songs");
  const p = pullRepo();                                  // não await: a rede fica pendente
  const hasSkel = !!document.querySelector("#songlist .skel .skel-card");
  release(); await p;                                    // resolve a rede → repinta a lista
  const skelGone = !document.querySelector("#songlist .skel");
  window.fetch = real;
  return { hasSkel, skelGone };
});
ok(m6.hasSkel, "Atualizar do link mostra skeleton de carregamento enquanto busca");
ok(m6.skelGone, "Skeleton some quando o repertório chega");

// ===== v0.37.0 — Auto-sync ao abrir (pull silencioso, habilitável; traz cifras E escalas) =====
const auto = await page.evaluate(async () => {
  history.replaceState(null, "", location.href.split("#")[0]);   // limpa #imp= deixado por teste anterior (guard do maybeAutoPull)
  closeSheet();                                                  // baseline limpo: o pull silencioso não pode abrir sheet
  const real = window.fetch;
  songs.length = 0; escalas.length = 0;
  songs.push({ id: "keep1", title: "Mesma Musica", key: "C", capo: 0, tags: [], updatedAt: 5, body: "C" }); // título que vai colidir
  saveSongs(); saveEscalas();
  const snap = { type: "louvai-full",
    songs: [{ id: "remote1", title: "Mesma Musica", key: "D", capo: 0, tags: [], updatedAt: 9, body: "D" }],
    escalas: [{ id: "e-remote", title: "Culto Nuvem", date: "2026-02-01", time: "", type: "Culto", team: [], items: [{ kind: "song", songId: "remote1", key: "", capo: 0 }], updatedAt: 9 }] };
  window.fetch = async () => ({ ok: true, status: 200, text: async () => JSON.stringify(snap) });
  settings.autoPull = true; settings.repoUrl = "https://louvai-teste.example/louvai.json"; saveSettings();   // host não-GitHub: fetch direto (stub sem .json())
  await maybeAutoPull();                                 // pull silencioso
  const noSheet = !document.getElementById("sheet").classList.contains("show");
  const escAdded = escalas.some(e => e.id === "e-remote");
  const songCount = songs.filter(s => s.title === "Mesma Musica").length;
  const esc = escalas.find(e => e.id === "e-remote");
  const remapped = esc && esc.items[0].songId === "keep1";  // referência da escala remapeada p/ a cifra local
  await maybeAutoPull();                                 // 2ª vez: idempotente (não duplica)
  const stillOne = songs.filter(s => s.title === "Mesma Musica").length === 1 && escalas.filter(e => e.id === "e-remote").length === 1;
  window.fetch = real; settings.autoPull = false; saveSettings();
  return { noSheet, escAdded, songCount, remapped, stillOne };
});
ok(auto.escAdded, "Auto-sync traz a escala da nuvem (cifras E escalas)");
ok(auto.noSheet && auto.songCount === 1 && auto.remapped, "Auto-sync é silencioso e não duplica (mantém a cifra local e remapeia a escala)");
ok(auto.stillOne, "Auto-sync é idempotente (abrir de novo não duplica)");
// o toggle persiste em settings.autoPull e o openRepoSheet reflete o estado
const autoTog = await page.evaluate(() => { settings.autoPull = true; saveSettings(); openRepoSheet();
  const checked = document.getElementById("auto-pull").checked; closeRepoSheet(); settings.autoPull = false; saveSettings(); return checked; });
ok(autoTog, "Toggle 'Sincronizar ao abrir' reflete settings.autoPull no sheet");

// ===== v0.38.0 — Auto-sync também ao VOLTAR pro app (visibilitychange, com throttle) =====
const vis = await page.evaluate(async () => {
  history.replaceState(null, "", location.href.split("#")[0]);   // sem #imp= (guard do maybeAutoPull)
  const real = window.fetch;
  songs.length = 0; escalas.length = 0; saveSongs(); saveEscalas();
  let snap = { type: "louvai-full", songs: [], escalas: [{ id: "e-vis", title: "Culto Visível", date: "2026-03-01", time: "", type: "Culto", team: [], items: [], updatedAt: 9 }] };
  window.fetch = async () => ({ ok: true, status: 200, text: async () => JSON.stringify(snap) });
  settings.autoPull = true; settings.repoUrl = "https://louvai-teste.example/louvai.json"; saveSettings();   // host não-GitHub: fetch direto (stub sem .json())
  lastAutoSync = 0;                                          // libera o throttle p/ o 1º retorno
  document.dispatchEvent(new Event("visibilitychange"));     // "voltou pro app"
  await new Promise(r => setTimeout(r, 40));
  const pulledOnReturn = escalas.some(e => e.id === "e-vis");
  // throttle: nova escala na nuvem, reabrir de novo logo em seguida → NÃO puxa (cooldown)
  snap = { type: "louvai-full", songs: [], escalas: [{ id: "e-vis2", title: "Outra", date: "2026-03-02", time: "", type: "Culto", team: [], items: [], updatedAt: 9 }] };
  document.dispatchEvent(new Event("visibilitychange"));
  await new Promise(r => setTimeout(r, 40));
  const throttled = !escalas.some(e => e.id === "e-vis2");
  window.fetch = real; settings.autoPull = false; saveSettings();
  return { pulledOnReturn, throttled };
});
ok(vis.pulledOnReturn, "Auto-sync puxa ao voltar pro app (visibilitychange)");
ok(vis.throttled, "Throttle: reabrir de novo logo em seguida não busca de novo");

// ===== v0.39.0 — pull lê o COMMIT ATUAL via Contents API (sem atraso do GitHub Pages) =====
const commitPull = await page.evaluate(async () => {
  const real = window.fetch;
  songs.length = 0; escalas.length = 0; saveSongs(); saveEscalas();
  history.replaceState(null, "", location.href.split("#")[0]);
  // snapshot "do commit" servido pela Contents API (content em base64 + carimbo publishedAt)
  const snap = { type: "louvai-full", app: "9.9.9", publishedAt: 1781000000000,
    songs: [{ id: "commit1", title: "Do Commit", key: "C", capo: 0, tags: [], updatedAt: 9, body: "C" }], escalas: [] };
  const b64 = btoa(unescape(encodeURIComponent(JSON.stringify(snap))));
  let calls = [];
  window.fetch = async (u) => {
    calls.push(String(u));
    if (/api\.github\.com\/repos\//.test(String(u))) return { ok: true, status: 200, json: async () => ({ sha: "s1", content: b64 }) };
    // o link do Pages devolveria algo VELHO — se for usado, o teste falha
    return { ok: true, status: 200, text: async () => JSON.stringify({ type: "louvai-full", app: "0.0.1", songs: [], escalas: [] }) };
  };
  settings.repoUrl = "https://x.github.io/louvai/louvai.json"; settings.ghToken = ""; saveSettings();
  await pullRepo({ silent: true });
  window.fetch = real;
  return { usedApi: calls.some(u => /api\.github\.com/.test(u)),
    got: songs.some(s => s.id === "commit1"), cloudApp: settings.repoCloudApp, cloudAt: settings.repoCloudAt };
});
ok(commitPull.usedApi && commitPull.got, "Pull lê o commit atual pela Contents API do GitHub (não o link do Pages)");
ok(commitPull.cloudApp === "9.9.9" && commitPull.cloudAt === 1781000000000, "Pull guarda versão/idade do snapshot da nuvem (repoStatus)");
// fallback: host NÃO-GitHub continua puxando pelo link direto
const fallbackPull = await page.evaluate(async () => {
  const real = window.fetch;
  songs.length = 0; escalas.length = 0; saveSongs(); saveEscalas();
  window.fetch = async (u) => /api\.github\.com/.test(String(u))
    ? { ok: false, status: 404, json: async () => ({}) }   // (não deve nem ser chamado p/ host não-GitHub)
    : { ok: true, status: 200, text: async () => JSON.stringify({ type: "louvai-full", app: "1.2.3", songs: [{ id: "viafile", title: "Via Link", key: "C", capo: 0, tags: [], updatedAt: 9, body: "C" }], escalas: [] }) };
  settings.repoUrl = "https://meusite.com/louvai.json"; saveSettings();
  await pullRepo({ silent: true });
  window.fetch = real; settings.repoUrl = ""; settings.repoCloudApp = ""; saveSettings();
  return songs.some(s => s.id === "viafile");
});
ok(fallbackPull, "Host não-GitHub continua puxando pelo link direto (fallback preservado)");

// ===== v0.40.0 — Ordenar por menos tocadas (usa a recência da v0.24.0) =====
const sortT = await page.evaluate(() => {
  songs.length = 0; escalas.length = 0;
  songs.push({ id: "z", title: "Zeta", key: "C", capo: 0, tags: [], updatedAt: 1, body: "C" });   // nunca tocada
  songs.push({ id: "a", title: "Alpha", key: "C", capo: 0, tags: [], updatedAt: 1, body: "C" });  // tocada há mais tempo
  songs.push({ id: "m", title: "Mega", key: "C", capo: 0, tags: [], updatedAt: 1, body: "C" });   // tocada recente
  escalas.push({ id: "e1", title: "E1", date: "2026-01-01", done: true, team: [], items: [{ kind: "song", songId: "a", key: "", capo: 0 }], updatedAt: 1 });
  escalas.push({ id: "e2", title: "E2", date: "2026-06-01", done: true, team: [], items: [{ kind: "song", songId: "m", key: "", capo: 0 }], updatedAt: 1 });
  saveSongs(); saveEscalas();
  switchTab("songs"); $("#search").value = ""; activeTag = null;
  const titles = () => [...document.querySelectorAll("#songlist .songcard .c-ttl")].map(e => e.textContent);
  settings.sortMode = "az"; saveSettings(); renderLibrary();
  const az = titles();
  settings.sortMode = "played"; saveSettings(); renderLibrary();
  const played = titles();
  settings.sortMode = "recent"; saveSettings(); renderLibrary();
  const recent = titles();
  const label = document.getElementById("sortBtn").textContent;
  // a folha de escolha abre e marca o modo atual; escolher um modo aplica e persiste
  document.getElementById("sortBtn").click();
  const sheetTitle = document.getElementById("sheet-title").textContent;
  const items = [...document.querySelectorAll("#sheet-body .sheetitem")].map(e => e.textContent);
  [...document.querySelectorAll("#sheet-body .sheetitem")].find(e => /Alfab/.test(e.textContent)).click();
  const persisted = settings.sortMode;
  settings.sortMode = "az"; saveSettings();
  return { az, played, recent, label, sheetTitle, items, persisted };
});
ok(JSON.stringify(sortT.az) === JSON.stringify(["Alpha", "Mega", "Zeta"]), "Ordem alfabética (A–Z)");
ok(JSON.stringify(sortT.played) === JSON.stringify(["Zeta", "Alpha", "Mega"]), "Menos tocadas: nunca tocada no topo, depois da mais antiga p/ a mais recente");
ok(JSON.stringify(sortT.recent) === JSON.stringify(["Mega", "Alpha", "Zeta"]), "Recentes: tocada há menos tempo no topo, nunca tocada por último");
ok(/Recentes/.test(sortT.label), "Botão mostra o modo atual");
ok(/Ordenar por/.test(sortT.sheetTitle) && sortT.items.length === 3, "Folha 'Ordenar por' oferece os 3 modos");
ok(sortT.persisted === "az", "Escolher na folha aplica e persiste em settings.sortMode");

// ===== v0.40.1 — "Intro" (e rótulos de seção pelados) não vira mais ARTISTA na importação =====
const introT = await page.evaluate(() => {
  const P = raw => parseImport(raw);
  return {
    introSolta:  P("Aquieta minh'alma\nIntro\nC  G  Am  F\nLetra aqui"),
    abrev:       P("Tua Graça\nIntrod.\nD  A  Bm  G\nLetra"),
    abrevColon:  P("Santo Espírito\nIntrod.:\nE  B  C#m  A\nLetra"),
    verso:       P("Grande é o Senhor\nVerso 1\nG  D  Em  C\nLetra"),
    tituloSecao: P("Introdução\nC  G  Am  F\nLetra"),
    artistaOk:   P("Cifra Club\nMusica Importada\nArtista X\nTom: D\n\n[Intro] D  A  Bm  G\nLinha"),
    soloDeo:     P("Eu Te Louvarei\nSolo Deo\nG  D  Em  C\nLetra"),   // "Solo Deo" NÃO é seção (sobra "Deo")
    // a correção NÃO mexe em isSectionLine (exibição): palavra pelada continua sem ser seção no render
    secBare:     isSectionLine("Intro"),
    secBracket:  isSectionLine("[Intro]"),
  };
});
ok(introT.introSolta.title === "Aquieta minh'alma" && introT.introSolta.artist === "", "'Intro' solta não vira artista (título preservado)");
ok(introT.abrev.artist === "", "Abreviação 'Introd.' pelada não vira artista");
ok(introT.abrevColon.artist === "", "'Introd.:' (com dois-pontos) continua sem virar artista");
ok(introT.verso.artist === "", "Rótulo pelado 'Verso 1' não vira artista");
ok(introT.tituloSecao.title === "Introdução", "Título que é palavra de seção ('Introdução') é preservado");
ok(introT.artistaOk.title === "Musica Importada" && introT.artistaOk.artist === "Artista X", "Artista legítimo continua capturado (sem regressão)");
ok(introT.soloDeo.artist === "Solo Deo", "Nome que só começa com palavra de seção ('Solo Deo') continua artista (regex ancora em $)");
ok(introT.secBare === false && introT.secBracket === true, "isSectionLine intacta: 'Intro' pelado não é seção na exibição, '[Intro]' é");

// ===== v0.41.0 — contagem ao sincronizar: DOWNLOAD (pull manual e silencioso) =====
const syncDl = await page.evaluate(async () => {
  const real = window.fetch;
  history.replaceState(null, "", location.href.split("#")[0]);   // sem #imp= (guard do maybeAutoPull)
  const T = () => document.getElementById("toast").textContent;
  const setSnap = snap => { window.fetch = async () => ({ ok: true, status: 200, text: async () => JSON.stringify(snap) }); };
  const reset = (s, e) => { songs.length = 0; escalas.length = 0; (s||[]).forEach(x=>songs.push(x)); (e||[]).forEach(x=>escalas.push(x)); saveSongs(); saveEscalas(); closeSheet(); };
  settings.repoUrl = "https://louvai-teste.example/louvai.json"; settings.autoPull = false; saveSettings();   // host não-GitHub: fetch direto
  const out = {};
  // 1) novidade: 2 músicas novas + 1 escala nova
  reset();
  setSnap({ type:"louvai-full", songs:[{id:"d1",title:"Um",key:"C",capo:0,tags:[],updatedAt:9,body:"C"},{id:"d2",title:"Dois",key:"C",capo:0,tags:[],updatedAt:9,body:"C"}], escalas:[{id:"de1",title:"Culto",date:"2026-01-01",team:[],items:[],updatedAt:9}] });
  await pullRepo(); out.novidade = T();
  // 2) singular: 1 música nova
  reset();
  setSnap({ type:"louvai-full", songs:[{id:"s1",title:"Só Uma",key:"C",capo:0,tags:[],updatedAt:9,body:"C"}], escalas:[] });
  await pullRepo(); out.singular = T();
  // 3) música atualizada (mesmo id, updatedAt maior)
  reset([{id:"a",title:"Atual",key:"C",capo:0,tags:[],updatedAt:1,body:"C"}]);
  setSnap({ type:"louvai-full", songs:[{id:"a",title:"Atual",key:"D",capo:0,tags:[],updatedAt:9,body:"D"}], escalas:[] });
  await pullRepo(); out.atualizada = T();
  // 4) escala atualizada (mergeEscala 'upd') + 1 música nova
  reset([], [{id:"e1",title:"E1",date:"2026-01-01",team:[],items:[],updatedAt:1}]);
  setSnap({ type:"louvai-full", songs:[{id:"n1",title:"Nova",key:"C",capo:0,tags:[],updatedAt:9,body:"C"}], escalas:[{id:"e1",title:"E1",date:"2026-01-01",team:[],items:[],updatedAt:9}] });
  await pullRepo(); out.escAtual = T();
  // 5) sem nada novo (nuvem mais antiga): "Já está tudo sincronizado"
  reset([{id:"x",title:"X",key:"C",capo:0,tags:[],updatedAt:9,body:"C"}]);
  setSnap({ type:"louvai-full", songs:[{id:"x",title:"X",key:"C",capo:0,tags:[],updatedAt:1,body:"C"}], escalas:[] });
  await pullRepo(); out.semNovidade = T();
  // 6) silencioso COM novidade → fala
  reset();
  setSnap({ type:"louvai-full", songs:[], escalas:[{id:"se",title:"Silenc",date:"2026-01-01",team:[],items:[],updatedAt:9}] });
  settings.autoPull = true; saveSettings(); lastAutoSync = 0;
  await maybeAutoPull(); out.silentNov = T();
  // 7) silencioso SEM novidade → cala (toast permanece na sentinela, sem 'show')
  reset([{id:"y",title:"Y",key:"C",capo:0,tags:[],updatedAt:9,body:"C"}]);
  setSnap({ type:"louvai-full", songs:[{id:"y",title:"Y",key:"C",capo:0,tags:[],updatedAt:1,body:"C"}], escalas:[] });
  const tEl = document.getElementById("toast"); tEl.classList.remove("show"); tEl.textContent = "SENTINELA";
  lastAutoSync = 0; await maybeAutoPull();
  out.silentNada = tEl.textContent; out.silentShown = tEl.classList.contains("show");
  window.fetch = real; settings.autoPull = false; settings.repoUrl = ""; saveSettings();
  return out;
});
ok(syncDl.novidade === "Sincronizado: +2 músicas, +1 escala", "Download conta músicas e escalas novas (plural)");
ok(/\+1 música(?!s)/.test(syncDl.singular), "Download usa o singular '+1 música'");
ok(/1 música atualizada/.test(syncDl.atualizada), "Download conta músicas atualizadas");
ok(/1 escala atualizada/.test(syncDl.escAtual) && /\+1 música/.test(syncDl.escAtual), "Download conta escala atualizada (mergeEscala 'upd')");
ok(syncDl.semNovidade === "Já está tudo sincronizado", "Pull manual sem novidade diz 'Já está tudo sincronizado'");
ok(/Sincronizado:/.test(syncDl.silentNov) && /\+1 escala/.test(syncDl.silentNov), "Pull silencioso com novidade anuncia a contagem");
ok(syncDl.silentNada === "SENTINELA" && !syncDl.silentShown, "Pull silencioso sem novidade não emite toast (silêncio preservado)");

// ===== v0.41.0 — contagem ao sincronizar: UPLOAD (pubLabel sobre o diff real) =====
const syncUp = await page.evaluate(() => {
  const S = (id) => ({ id, title:id, key:"C", capo:0, tags:[], updatedAt:1, body:"C" });
  const E = (id) => ({ id, title:id, date:"2026-01-01", team:[], items:[], updatedAt:1 });
  const D = (cloudS, cloudE, locS, locE) =>
    diffRepo(cloudS===null ? null : { songs: cloudS, escalas: cloudE||[] }, { songs: locS||[], escalas: locE||[] });
  return {
    first:   pubLabel(D(null, null, [S("a"),S("b"),S("c")], [E("e1"),E("e2")])),
    singular:pubLabel(D(null, null, [S("a")], [E("e1")])),
    delta:   pubLabel(D([S("old")], [E("e1")], [S("old"),S("new")], [E("e1")])),
    remove:  pubLabel(D([S("a"),S("b")], [], [S("a")], [])),
    soUpd:   pubLabel(D([S("a"),S("b")], [E("e1"),E("e2")], [S("a"),S("b")], [E("e1"),E("e2")])),
  };
});
ok(syncUp.first === "Publicado: 3 músicas e 2 escalas", "Upload 1ª publicação: total de músicas e escalas");
ok(syncUp.singular === "Publicado: 1 música e 1 escala", "Upload no singular (1 música e 1 escala)");
ok(/^Publicado: 2 músicas e 1 escala/.test(syncUp.delta) && /\(cifras \+1\)/.test(syncUp.delta), "Upload com delta: total + (cifras +1)");
ok(/^Publicado: 1 música e 0 escalas/.test(syncUp.remove) && /\(cifras −1\)/.test(syncUp.remove), "Upload com remoção: (cifras −1)");
ok(syncUp.soUpd === "Publicado: 2 músicas e 2 escalas", "Upload só com atualização (sem add/rem): sem parênteses de delta");

// ===== v0.42.0 — validação de tom pelos acordes (detectKey/compareKey + UI opcional) =====
const keyT = await page.evaluate(() => {
  const dk = arr => detectKey(arr).key;
  const cmp = (inf, arr) => compareKey(inf, detectKey(arr));
  return {
    cMajor:    dk(["C","F","G","C"]),
    aMinor:    dk(["Am","Dm","E7","Am"]),
    endsAm:    dk(["C","F","G","Am"]),
    endsC:     dk(["Am","F","G","C"]),
    susAdd:    dk(["Dsus4","D","Gadd9","A7","D"]),
    borrowed:  dk(["C","Bb","F","C"]),
    secondary: dk(["C","A7","Dm","G7","C"]),
    flatKey:   dk(["F","Bb","C7","F"]),
    okStatus:       cmp("C", ["C","F","G","C"]).status,
    relativeStatus: cmp("C", ["Am","Dm","E7","Am"]).status,
    mismatch:       cmp("G", ["D","G","A","D"]),
    lowconf:        cmp("C", ["C","E"]).status,
    songChordsSeq:  songChords("[Intro] C  G\nAm   F\nletra [C]aqui [G]ali\n[Verso]"),
  };
});
ok(keyT.cMajor === "C", "detectKey: maior canônica (C F G C) → C");
ok(keyT.aMinor === "Am", "detectKey: menor com V7 da harmônica (Am Dm E7 Am) → Am");
ok(keyT.endsAm === "Am" && keyT.endsC === "C", "detectKey: relativa decidida pela cadência (último acorde)");
ok(keyT.susAdd === "D", "detectKey: sus/add não mudam a função (→ D)");
ok(keyT.borrowed === "C", "detectKey: acorde emprestado (Bb) não derruba (→ C)");
ok(keyT.secondary === "C", "detectKey: dominante secundário (A7) não derruba (→ C)");
ok(keyT.flatKey === "F", "detectKey: tom bemol nomeado certo (→ F, não E#)");
ok(keyT.okStatus === "ok", "compareKey: informado bate com os acordes → ok");
ok(keyT.relativeStatus === "relative", "compareKey: relativa (C × Am) não alarma → relative");
ok(keyT.mismatch.status === "mismatch" && keyT.mismatch.probableName === "D", "compareKey: divergência real (G × acordes em D) → mismatch + provável D");
ok(keyT.lowconf === "lowconf", "compareKey: poucos acordes → lowconf (não alarma)");
ok(JSON.stringify(keyT.songChordsSeq) === JSON.stringify(["C","G","Am","F","C","G"]), "songChords extrai a sequência (linha, [Sec] acordes, [C] inline; ignora seção/letra)");

// UI: toggle off (padrão) não mostra; on mostra 'informado X · provável Y' e persiste; tom certo não alarma
const keyUI = await page.evaluate(() => {
  songs.length = 0; escalas.length = 0;
  songs.push({ id:"kc", title:"Tom Errado", key:"G", capo:0, tags:[], updatedAt:1, body:"D  G  A  D\nletra aqui" });
  saveSongs(); delete settings.checkKey; saveSettings();
  openPlayer("kc");
  const offHidden = document.getElementById("keycheck").classList.contains("hidden");
  document.getElementById("checkkey-toggle").click();                       // liga o recurso
  const el = document.getElementById("keycheck");
  const onShown = !el.classList.contains("hidden"), txt = el.textContent;
  const pressed = document.getElementById("checkkey-toggle").getAttribute("aria-pressed");
  const persisted = JSON.parse(localStorage.getItem(LS_SET)||"{}").checkKey;
  songs.push({ id:"kok", title:"Tom Certo", key:"C", capo:0, tags:[], updatedAt:1, body:"C  F  G  C" });
  saveSongs(); settings.checkKey = true; saveSettings(); openPlayer("kok");
  const okHidden = document.getElementById("keycheck").classList.contains("hidden");
  settings.checkKey = false; saveSettings(); exitPlayer();
  return { offHidden, onShown, txt, pressed, persisted, okHidden };
});
ok(keyUI.offHidden, "Conferir tom OFF (padrão): aviso de divergência não aparece");
ok(keyUI.onShown && /Tom informado: G/.test(keyUI.txt) && /provável pelos acordes: D/.test(keyUI.txt), "Conferir tom ON: mostra 'informado G · provável D'");
ok(keyUI.pressed === "true" && keyUI.persisted === true, "Toggle persiste em settings.checkKey (aria-pressed=true)");
ok(keyUI.okHidden, "Conferir tom ON mas tom certo (C, acordes em C): sem aviso");

// parseImport (sem 'Tom:') passa a usar detectKey: sugere a tônica, não o 1º acorde cru
const keyImport = await page.evaluate(() => parseImport("Minha Canção\n\nG  Am  F  C\nLetra\nG  C").key);
ok(keyImport === "C", "parseImport sem 'Tom:' usa detectKey: sugere a tônica C (não o 1º acorde G)");

// ===== v0.42.1 — correções pós-validação: alarme falso (IV/V terminal) + idempotência do sync =====
const noFalseAlarm = await page.evaluate(() => {
  // loops de louvor MUITO comuns, com o tom CORRETO informado, terminando no IV ou no V:
  // o recurso NÃO pode acusar mismatch (era o bug da v0.42.0 — KB_LAST elegia o IV/V como tônica).
  const cases = [
    ["C", ["C","G","Am","F"]],    // I–V–vi–IV (termina no IV)
    ["C", ["Am","F","C","G"]],    // vi–IV–I–V (termina no V)
    ["D", ["D","A","Bm","G"]],
    ["A", ["A","E","F#m","D"]],
    ["E", ["E","B","C#m","A"]],
    ["G", ["G","D","Em","C"]],
  ];
  const offenders = cases.filter(([k, prog]) => compareKey(k, detectKey(prog)).status === "mismatch")
                         .map(([k, prog]) => k + ": " + prog.join(" "));
  const real = compareKey("G", detectKey(["D","G","A","D"]));         // mismatch GENUÍNO (diz G, é D) ainda acusa
  const invalid = compareKey("", detectKey(["C","F","G","C"])).status;       // tom vazio não opina
  const garbage = compareKey("xyz", detectKey(["C","F","G","C"])).status;    // tom inválido não assume "C"
  const gibberish = compareKey("Gibberish", detectKey(["C","F","G","C"])).status;  // v0.42.2: lixo que começa com nota → lowconf
  return { offenders, realStatus: real.status, realProb: real.probableName, invalid, garbage, gibberish };
});
ok(noFalseAlarm.offenders.length === 0, "Sem alarme falso em loops terminando no IV/V com tom certo" + (noFalseAlarm.offenders.length ? ": " + noFalseAlarm.offenders.join(" | ") : ""));
ok(noFalseAlarm.realStatus === "mismatch" && noFalseAlarm.realProb === "D", "Mismatch genuíno (diz G, é D) ainda é sinalizado (recurso não cegou)");
ok(noFalseAlarm.invalid === "lowconf" && noFalseAlarm.garbage === "lowconf", "Tom informado vazio/inválido → lowconf (não assume C, não mascara mismatch)");
ok(noFalseAlarm.gibberish === "lowconf", "Tom string-lixo que começa com nota ('Gibberish') → lowconf (valida o token inteiro, v0.42.2)");

const syncIdem = await page.evaluate(async () => {
  const real = window.fetch;
  history.replaceState(null, "", location.href.split("#")[0]);
  const T = () => document.getElementById("toast").textContent;
  const snap = { type:"louvai-full",
    songs:[{id:"i1",title:"Idem",key:"C",capo:0,tags:[],updatedAt:5,body:"C"}],
    escalas:[{id:"ie1",title:"IdemE",date:"2026-01-01",team:[],items:[],updatedAt:5}] };
  window.fetch = async () => ({ ok:true, status:200, text: async () => JSON.stringify(snap) });
  settings.repoUrl = "https://louvai-teste.example/louvai.json"; settings.autoPull = false; saveSettings();
  songs.length = 0; escalas.length = 0; saveSongs(); saveEscalas(); closeSheet();
  await pullRepo(); const first = T();           // 1º pull: traz tudo
  await pullRepo(); const second = T();          // 2º pull do MESMO snapshot (updatedAt iguais) → nada novo
  const tEl = document.getElementById("toast"); tEl.classList.remove("show"); tEl.textContent = "SENTINELA";
  settings.autoPull = true; saveSettings(); lastAutoSync = 0;
  await maybeAutoPull();                          // auto-sync silencioso no estado estável
  const silentTxt = tEl.textContent, silentShown = tEl.classList.contains("show");
  window.fetch = real; settings.autoPull = false; settings.repoUrl = ""; saveSettings();
  return { first, second, silentTxt, silentShown };
});
ok(/Sincronizado: \+1 música, \+1 escala/.test(syncIdem.first), "1º pull traz a novidade (+1 música, +1 escala)");
ok(syncIdem.second === "Já está tudo sincronizado", "Re-pull idêntico (timestamps iguais) → 'Já está tudo sincronizado' (não 'atualizada')");
ok(syncIdem.silentTxt === "SENTINELA" && !syncIdem.silentShown, "Auto-sync silencioso no estado estável não emite toast (silêncio real)");

// ===== v0.43.0 — card de música compacto (mais discreto, cabe mais; tom num chip discreto) =====
const compact = await page.evaluate(() => {
  songs.length = 0; escalas.length = 0;
  songs.push({ id:"cz", title:"Compacta", artist:"Banda", key:"Bb", capo:0, tags:["ceia"], updatedAt:1, body:"Bb" });
  escalas.push({ id:"ce", title:"Culto", date:"2026-01-01", done:true, team:[], items:[{kind:"song",songId:"cz",key:"",capo:0}], updatedAt:1 });
  saveSongs(); saveEscalas();
  switchTab("songs"); $("#search").value=""; activeTag=null; settings.sortMode="az"; renderLibrary();
  const card=document.querySelector("#songlist .songcard");
  const kt=card.querySelector(".keytag"), sub=card.querySelector(".c-sub");
  return {
    hasTile: !!kt,
    key: kt ? kt.textContent : null,
    tileW: kt ? kt.getBoundingClientRect().width : 0,
    noMeta: !card.querySelector(".c-meta"),
    sub: sub ? sub.textContent : "",
    playedInSub: !!(sub && sub.querySelector(".played")),
    h: card.getBoundingClientRect().height,
  };
});
ok(compact.hasTile && compact.key === "Bb", "Tom no tile .keytag à esquerda (Bb) — como era, só menor");
ok(compact.tileW > 0 && compact.tileW <= 42, "Tile do tom MENOR que antes (≤42px; era 46). Largura=" + Math.round(compact.tileW));
ok(compact.noMeta && /Banda/.test(compact.sub) && /ceia/.test(compact.sub), "Metadados (artista, tag) na única linha cinza .c-sub (sem faixa de pílulas)");
ok(compact.playedInSub, "Recência fica inline na .c-sub (span .played) — sem faixa de pílulas separada");
ok(compact.h <= 70, "Card de música compacto (≤70px) — cabem mais na tela. Altura=" + Math.round(compact.h));

// ===== v0.43.2 — acessibilidade: foco por teclado (cards), alvo de toque da tagbar, contraste do --muted =====
const a11y = await page.evaluate(() => {
  songs.length = 0; escalas.length = 0;
  songs.push({ id:"a1", title:"Acessível", key:"C", capo:0, tags:["ceia"], updatedAt:1, body:"C\nx" });
  saveSongs(); saveEscalas();
  switchTab("songs"); $("#search").value=""; activeTag=null; renderLibrary();
  const card=document.querySelector("#songlist .songcard");
  const chip=document.querySelector("#tagbar .chip");
  return {
    cardRole: card.getAttribute("role"), cardTab: card.tabIndex,
    chipRole: chip ? chip.getAttribute("role") : null,
    chipH: chip ? Math.round(chip.getBoundingClientRect().height) : 0,
    muted: getComputedStyle(document.body).getPropertyValue("--muted").trim(),
  };
});
ok(a11y.cardRole === "button" && a11y.cardTab === 0, "Card de música é focável + role=button (acessível por teclado)");
ok(a11y.chipRole === "button" && a11y.chipH >= 44, "Tag da tagbar: botão com alvo de toque ≥44px (altura=" + a11y.chipH + ")");
ok(/c4c4c4/i.test(a11y.muted), "--muted no escuro mais claro p/ contraste. Lido: " + a11y.muted);
await page.locator("#songlist .songcard").first().focus();
await page.keyboard.press("Enter"); await page.waitForTimeout(150);
const kbdOpen = await page.evaluate(() => !document.getElementById("view-player").classList.contains("hidden") && document.getElementById("p-title").textContent.includes("Acess"));
ok(kbdOpen, "Enter no card focado abre o player (ativação por teclado)");
await page.evaluate(() => exitPlayer());

// ===== v0.44.0 / v0.48.1 — tela cheia na Apresentação: barra FINA (info + progresso, sem botões) =====
const full = await page.evaluate(async () => {
  songs.length=0; escalas.length=0;
  songs.push({id:"fz",title:"Cheia",key:"C",capo:0,tags:[],updatedAt:1,body:"C\nx"});
  const esc={id:"fe",title:"Culto",date:"2026-01-01",team:[],items:[{kind:"song",songId:"fz",key:"",capo:0}],updatedAt:1};
  escalas.push(esc); saveSongs(); saveEscalas();
  let req=0,exit=0;   // stub do Fullscreen API (headless não entra em fullscreen de verdade)
  document.documentElement.requestFullscreen = async()=>{ req++; };
  document.exitFullscreen = async()=>{ exit++; };
  openPlayer("fz",{id:"fe",idx:0,list:[{songId:"fz",key:"",capo:0}]});
  const vp=document.getElementById("view-player"), bar=document.getElementById("presentbar");
  const out={ present: vp.classList.contains("present"), hasBtn: !!document.getElementById("pv-full") };
  out.barFullH = bar.getBoundingClientRect().height;               // Apresentação normal (com botões)
  toggleImmersive(); await new Promise(r=>setTimeout(r,10));
  out.onImm = vp.classList.contains("immersive");
  out.barShown = getComputedStyle(bar).display!=="none";           // v0.48.1: a barra CONTINUA visível
  out.btnHidden = getComputedStyle(document.getElementById("pv-prev")).display==="none";   // sem botões
  out.songheadHidden = getComputedStyle(document.querySelector("#view-player .songhead")).display==="none";
  out.pos = document.getElementById("pv-pos").textContent;         // "Tom C · 1/1"
  out.barThinH = bar.getBoundingClientRect().height;
  out.exitShown = getComputedStyle(document.getElementById("pv-exitfull")).display!=="none";
  out.req = req;
  document.getElementById("pv-exitfull").click(); await new Promise(r=>setTimeout(r,10));
  out.offImm = !vp.classList.contains("immersive");
  out.exit = exit;
  exitPlayer();
  return out;
});
ok(full.present && full.hasBtn, "Apresentação tem o botão de tela cheia (#pv-full)");
ok(full.onImm && full.barShown && full.exitShown, "Tela cheia MANTÉM a barra (fina) + botão flutuante de sair");
ok(full.btnHidden && full.songheadHidden, "Tela cheia esconde os botões da barra e a songhead (Tom vai pra barra fina)");
ok(/Tom\s*C/.test(full.pos) && /1\/1/.test(full.pos), "Barra fina mostra Tom + posição (n/total): '"+full.pos+"'");
ok(full.barThinH>0 && full.barThinH < full.barFullH-15, "Barra de tela cheia é bem mais fina ("+Math.round(full.barFullH)+"px → "+Math.round(full.barThinH)+"px)");
ok(full.req >= 1, "Tela cheia pede o Fullscreen do navegador (best-effort)");
ok(full.offImm && full.exit >= 1, "Sair (botão flutuante) volta o layout e libera o fullscreen");

// ===== v0.44.1 — "culto realizado" usa a DATA da escala (sem data, usa o dia do clique) =====
const doneDate = await page.evaluate(() => {
  songs.length=0; escalas.length=0;
  songs.push({id:"sa",title:"A",key:"C",capo:0,tags:[],updatedAt:1,body:"C"});
  songs.push({id:"sb",title:"B",key:"C",capo:0,tags:[],updatedAt:1,body:"C"});
  escalas.push({id:"ed",title:"ComData",date:"2026-06-10",done:false,team:[],items:[{kind:"song",songId:"sa",key:"",capo:0}],updatedAt:1});
  escalas.push({id:"en",title:"SemData",date:"",done:false,team:[],items:[{kind:"song",songId:"sb",key:"",capo:0}],updatedAt:1});
  saveSongs(); saveEscalas();
  const today=new Date().toISOString().slice(0,10);
  openEscala("ed"); document.getElementById("es-done").click();   // marca realizado (dias depois)
  openEscala("en"); document.getElementById("es-done").click();
  const map=buildLastPlayed();
  return { dated:escalas.find(e=>e.id==="ed").date, undated:escalas.find(e=>e.id==="en").date, today, recA:map["sa"], recB:map["sb"] };
});
ok(doneDate.dated === "2026-06-10" && doneDate.recA === "2026-06-10", "Culto realizado usa a DATA da escala (dia 10), não o dia do clique");
ok(doneDate.undated === doneDate.today && doneDate.recB === doneDate.today, "Sem data na escala, usa o dia em que se sinalizou (clique) como execução");

// ===== v0.44.1 — importar: "Intro: <acordes>" não vira título/autor =====
const impSec = await page.evaluate(() => {
  const r=parseImport("Intro: Em  C  D  Em  -  Em  C  D  Em\n\nEm                    C\nPorque dEle e por Ele\n     D                 Em\nPara Ele todas as coisas");
  return { title:r.title, artist:r.artist, bodyKeepsIntro:/^Intro:/.test(r.body.trim()) };
});
ok(impSec.title === "" && impSec.artist === "", "Importar: 'Intro: <acordes>' não vira título/autor (cabeçalho fica vazio)");
ok(impSec.bodyKeepsIntro, "Importar: a linha 'Intro: …' segue no corpo (estrutura, não cabeçalho)");

// ===== v0.45.0 — repoUrl PADRÃO derivado do endereço do app (membro não cola link) =====
// deriveRepoUrl(href) é função pura (não depende de location) — testável em qualquer host
const defUrl = await page.evaluate(() => ({
  proj: deriveRepoUrl("https://wesleywps.github.io/louvai/index.html"),
  slash: deriveRepoUrl("https://wesleywps.github.io/louvai/"),
  dropsHash: deriveRepoUrl("https://x.github.io/louvai/index.html?a=1#imp=zzz"),
  file: deriveRepoUrl("file:///C:/app/louvai.html"),
}));
ok(defUrl.proj === "https://wesleywps.github.io/louvai/louvai.json", "deriveRepoUrl: app em /louvai/ → /louvai/louvai.json (sem URL cravada)");
ok(defUrl.slash === "https://wesleywps.github.io/louvai/louvai.json", "deriveRepoUrl: aceita endereço com barra final");
ok(defUrl.dropsHash === "https://x.github.io/louvai/louvai.json", "deriveRepoUrl: ignora ?query e #hash (#imp=) do endereço");
ok(defUrl.file === "", "deriveRepoUrl: file:// (teste local) não tem padrão derivável → vazio");

// effectiveRepoUrl: link colado tem PRIORIDADE; sem link, cai no padrão derivado
const effUrl = await page.evaluate(() => {
  const out = {};
  settings.repoUrl = "https://meu-link.example/r.json"; out.explicit = effectiveRepoUrl();
  settings.repoUrl = "   ";                              out.blank = effectiveRepoUrl(); out.def = defaultRepoUrl();
  settings.repoUrl = ""; saveSettings();
  return out;
});
ok(effUrl.explicit === "https://meu-link.example/r.json", "effectiveRepoUrl: link colado tem prioridade sobre o padrão");
ok(effUrl.blank === effUrl.def, "effectiveRepoUrl: sem link (ou só espaços) usa o padrão derivado");

// folha pré-preenche o campo com o padrão; campo == padrão = 'sem override' (mantém derivado, fork-safe)
const prefill = await page.evaluate(() => {
  const orig = window.defaultRepoUrl;
  window.defaultRepoUrl = () => "https://x.github.io/louvai/louvai.json";   // simula o app hospedado
  settings.repoUrl = ""; saveSettings();
  openRepoSheet();
  const filled = document.getElementById("repo-url").value;
  const keepDefault = repoUrlFromField();                          // não mexeu no campo → sem override
  document.getElementById("repo-url").value = "https://outro.example/x.json";
  const custom = repoUrlFromField();                               // colou outro → override
  closeRepoSheet();
  const ghOk = !!ghRepoFromUrl(effectiveRepoUrl());                // padrão derivado (GitHub) serve pro publish
  window.defaultRepoUrl = orig; settings.repoUrl = ""; saveSettings();
  return { filled, keepDefault, custom, ghOk };
});
ok(prefill.filled === "https://x.github.io/louvai/louvai.json", "openRepoSheet pré-preenche o campo com o padrão derivado (transparência)");
ok(prefill.keepDefault === "", "Campo igual ao padrão = sem override (settings.repoUrl fica vazio → derivado, fork-safe)");
ok(prefill.custom === "https://outro.example/x.json", "Colar um link diferente do padrão vira override explícito");
ok(prefill.ghOk, "Sem link colado, o padrão derivado (GitHub) serve pro publishRepo (ghRepoFromUrl resolve)");

// integração: autoPull + SEM link colado + padrão derivado (stub data:) → puxa e mescla sem colar nada
const autoDerived = await page.evaluate(async () => {
  history.replaceState(null, "", location.href.split("#")[0]);     // sem #imp= (guard do maybeAutoPull)
  songs.length = 0; escalas.length = 0; saveSongs(); saveEscalas();
  const snap = { type: "louvai-full", version: 1, app: "x",
    songs: [{ id: "dv", title: "Derivada", key: "C", capo: 0, tags: [], updatedAt: 1, body: "C" }], escalas: [] };
  const dataUrl = "data:application/json," + encodeURIComponent(JSON.stringify(snap));
  const orig = window.defaultRepoUrl;
  window.defaultRepoUrl = () => dataUrl;                            // simula o app hospedado (padrão derivado válido)
  settings.repoUrl = ""; settings.autoPull = true; saveSettings(); lastAutoSync = 0;
  await maybeAutoPull();                                            // auto-sync sem link colado → usa o padrão derivado
  const merged = songs.some(s => s.id === "dv");
  window.defaultRepoUrl = orig; settings.autoPull = false; settings.repoUrl = ""; saveSettings();
  return merged;
});
ok(autoDerived, "Auto-sync sem link colado puxa do padrão derivado (membro não precisa colar nada)");

// ===== v0.49.0 — dar o tom (Web Audio) + escala como texto + duplicar cifra/escala =====
const inc = await page.evaluate(() => {
  songs.length=0; escalas.length=0;
  songs.push({id:"a",title:"Aleluia",artist:"X",key:"D",capo:0,tags:["t"],updatedAt:1,body:"D",ref:"https://youtu.be/x",notes:"começa só voz"});
  escalas.push({id:"e",title:"Culto",date:"2026-01-01",team:[],items:[{kind:"song",songId:"a",key:"E",capo:0}],updatedAt:1});
  saveSongs(); saveEscalas();
  dupSong("a"); const sCopy=songs.find(s=>s.id!=="a"&&/cópia/.test(s.title));
  dupEscala("e"); const eCopy=escalas.find(x=>x.id!=="e"&&/cópia/.test(x.title));
  const fa=Math.round(noteFreq("A")), fc=Math.round(noteFreq("C"));
  const txt=escalaToText("e");
  return {
    sCopy: !!sCopy && sCopy.id!=="a" && sCopy.ref==="https://youtu.be/x",
    eCopy: !!eCopy && eCopy.id!=="e" && eCopy.items.length===1 && eCopy.done===false,
    fa, fc,
    txtOk: /Aleluia/.test(txt) && /Tom E/.test(txt) && /começa só voz/.test(txt) && /youtu\.be\/x/.test(txt),
  };
});
ok(inc.sCopy, "Duplicar cifra: cópia com id novo, '(cópia)' e campos carregados (ref)");
ok(inc.eCopy, "Duplicar escala: cópia com id novo, mantém items, done=false");
ok(inc.fa===440 && inc.fc===262, "noteFreq: A4=440Hz, C4≈262Hz (temperamento igual)");
ok(inc.txtOk, "Escala como texto inclui título, Tom (do item), observação e link guia");

// ===== v0.48.0 — observações da música (compartilhadas, song.notes) =====
const noteSave = await page.evaluate(() => {
  songs.length = 0; escalas.length = 0; saveSongs();
  openEditor();
  document.getElementById("e-title").value = "Com Nota";
  document.getElementById("e-body").value = "C";
  document.getElementById("e-notes").value = "começa só voz; tom da guia Ré, tocamos Dó";
  document.getElementById("e-save").click();
  const s = songs.find(x => x.title === "Com Nota");
  openEditor(s.id);
  const back = document.getElementById("e-notes").value;
  show("lib");
  return { onSong: s && s.notes, back };
});
ok(noteSave.onSong === "começa só voz; tom da guia Ré, tocamos Dó", "Editor salva as observações NA música (song.notes)");
ok(noteSave.back === "começa só voz; tom da guia Ré, tocamos Dó", "Reabrir o editor repõe as observações");

const notePlayer = await page.evaluate(() => {
  songs.length = 0;
  songs.push({ id:"n1", title:"ComNota", key:"C", capo:0, tags:[], updatedAt:1, body:"C", notes:"começa só voz" });
  songs.push({ id:"n2", title:"SemNota", key:"C", capo:0, tags:[], updatedAt:1, body:"C" });
  songs.push({ id:"n3", title:"NotaXSS", key:"C", capo:0, tags:[], updatedAt:1, body:"C", notes:"<b>x</b><img src=x onerror=alert(1)>" });
  saveSongs();
  openPlayer("n1");
  const shown = !document.getElementById("p-notes").classList.contains("hidden");
  const txt = document.getElementById("p-notes").textContent;
  openPlayer("n2");
  const hidden = document.getElementById("p-notes").classList.contains("hidden");
  openPlayer("n3");
  const pn = document.getElementById("p-notes");
  const noHtml = !pn.querySelector("b") && !pn.querySelector("img");
  const literal = pn.textContent.includes("<b>x</b>");
  exitPlayer();
  return { shown, txt, hidden, noHtml, literal };
});
ok(notePlayer.shown && notePlayer.txt === "começa só voz", "Player mostra a observação abaixo do título quando há nota");
ok(notePlayer.hidden, "Player esconde a área de observação quando não há nota");
ok(notePlayer.noHtml && notePlayer.literal, "Observação é renderizada como TEXTO (sem HTML/XSS) — via textContent");

const noteLive = await page.evaluate(() => {
  songs.length = 0; escalas.length = 0;
  songs.push({ id:"nl", title:"Live", key:"C", capo:0, tags:[], updatedAt:1, body:"C\nx", notes:"começa só voz" });
  escalas.push({ id:"el", title:"Culto", date:"2026-01-01", team:[], items:[{kind:"song",songId:"nl",key:"",capo:0}], updatedAt:1 });
  saveSongs(); saveEscalas();
  openPlayer("nl", { id:"el", idx:0, list:[{songId:"nl",key:"",capo:0}] });
  const present = document.getElementById("view-player").classList.contains("present");
  const visible = getComputedStyle(document.getElementById("p-notes")).display !== "none";
  exitPlayer();
  return { present, visible };
});
ok(noteLive.present && noteLive.visible, "Observação aparece também na Apresentação ao vivo (.present)");

const noteSync = await page.evaluate(() => {
  songs.length = 0; escalas.length = 0;
  songs.push({ id:"sn", title:"SyncN", key:"C", capo:0, tags:[], updatedAt:1, body:"C", notes:"observação da equipe" });
  return (fullEnvelope().songs.find(s => s.id === "sn") || {}).notes;
});
ok(noteSync === "observação da equipe", "A observação viaja no snapshot (fullEnvelope) — sincroniza com a equipe");

// ===== v0.47.0 — link de referência (versão guia, YouTube) por música, sincronizado =====
const refU = await page.evaluate(() => ({
  yt: safeUrl("https://youtu.be/abc123"),
  bare: safeUrl("youtube.com/watch?v=x"),
  xss: safeUrl("javascript:alert(1)"),
  data: safeUrl("data:text/html,<script>x</script>"),
  junk: safeUrl("isso não é link"),
  empty: safeUrl("   "),
}));
ok(refU.yt === "https://youtu.be/abc123", "safeUrl aceita URL https do YouTube");
ok(refU.bare === "https://youtube.com/watch?v=x", "safeUrl prepende https:// num link sem esquema");
ok(refU.xss === "" && refU.data === "" && refU.junk === "" && refU.empty === "",
   "safeUrl rejeita javascript:/data:/lixo/vazio (fecha XSS por href)");

const refSave = await page.evaluate(() => {
  songs.length = 0; escalas.length = 0; saveSongs();
  openEditor();                                          // nova cifra
  document.getElementById("e-title").value = "Com Ref";
  document.getElementById("e-body").value = "C";
  document.getElementById("e-ref").value = "https://youtu.be/guia";
  document.getElementById("e-save").click();
  const s = songs.find(x => x.title === "Com Ref");
  openEditor(s.id);                                      // reabre p/ editar
  const back = document.getElementById("e-ref").value;
  show("lib");
  return { onSong: s && s.ref, back };
});
ok(refSave.onSong === "https://youtu.be/guia", "Editor salva o link de referência NA própria música (song.ref)");
ok(refSave.back === "https://youtu.be/guia", "Reabrir o editor repõe o link salvo");

const refPlayer = await page.evaluate(() => {
  songs.length = 0;
  songs.push({ id:"g1", title:"Guia",    key:"C", capo:0, tags:[], updatedAt:1, body:"C", ref:"https://youtu.be/zzz" });
  songs.push({ id:"g2", title:"SemGuia", key:"C", capo:0, tags:[], updatedAt:1, body:"C" });
  songs.push({ id:"g3", title:"RefXSS",  key:"C", capo:0, tags:[], updatedAt:1, body:"C", ref:"javascript:alert(1)" });
  saveSongs();
  const vis = id => { openPlayer(id); return getComputedStyle(document.getElementById("p-guide-row")).display !== "none"; };
  const out = { g1: vis("g1"), g2: vis("g2"), g3: vis("g3") };
  exitPlayer();
  return out;
});
ok(refPlayer.g1, "Player mostra 'Versão guia' quando a música tem link válido");
ok(!refPlayer.g2, "Player esconde 'Versão guia' quando não há link");
ok(!refPlayer.g3, "Player esconde 'Versão guia' quando o link é perigoso (javascript:) — sem XSS");

const refSync = await page.evaluate(() => {
  songs.length = 0; escalas.length = 0;
  songs.push({ id:"sx", title:"Sync", key:"C", capo:0, tags:[], updatedAt:1, body:"C", ref:"https://youtu.be/sync" });
  return (fullEnvelope().songs.find(s => s.id === "sx") || {}).ref;
});
ok(refSync === "https://youtu.be/sync", "O link de referência viaja no snapshot (fullEnvelope) — sincroniza com a equipe");

// ===== v0.46.0 — ícone do app (favicon + apple-touch + manifest mínimo, SEM service worker) =====
const head = await page.evaluate(() => {
  const q = s => document.querySelector(s);
  const m = q('link[rel="manifest"]');
  return {
    appleTouch: !!q('link[rel="apple-touch-icon"][href*="apple-touch-180"]'),
    favSvg: !!q('link[rel="icon"][type="image/svg+xml"]'),
    favPng: !!q('link[rel="icon"][type="image/png"]'),
    manifest: m ? m.getAttribute("href") : null,
    noSW: !("serviceWorker" in navigator) || true,   // v0.46.0 não registra SW (offline fica pro Inc.1 do PWA)
  };
});
ok(await page.evaluate(() => !!document.querySelector('#view-lib .brand svg.brandlogo')),
   "Logo do app aparece no cabeçalho da biblioteca (SVG inline, v0.46.1)");
ok(head.appleTouch, "Head tem apple-touch-icon (ícone na tela inicial do iOS)");
ok(head.favSvg && head.favPng, "Head tem favicon (SVG + PNG fallback) — ícone na aba do navegador");
ok(head.manifest === "manifest.webmanifest", "Head linka o manifest.webmanifest (ícone na tela inicial do Android)");
// não há registro de service worker nesta versão (entrega só de ícone; offline/instalável = Inc.1)
ok(!/serviceWorker\.register/.test(readFileSync(new URL("../louvai.html", import.meta.url), "utf8")),
   "v0.46.0 NÃO registra service worker (offline/instalável fica pro Inc.1 do PWA)");
// manifest é JSON válido e fork-safe (relativo), apontando pros ícones reais de louvai-icons/
const mani = JSON.parse(readFileSync(new URL("../manifest.webmanifest", import.meta.url), "utf8"));
ok(mani.start_url === "./" && mani.scope === "./", "manifest: start_url/scope relativos './' (fork-safe; não quebra sob /louvai/)");
ok(Array.isArray(mani.icons) && mani.icons.length >= 3 && mani.icons.some(i => i.purpose === "maskable")
   && mani.icons.every(i => i.src.startsWith("louvai-icons/")), "manifest: ícones em louvai-icons/ com variante maskable");
ok(mani.theme_color === "#121212" && mani.background_color === "#121212", "manifest: cores casadas com o app (#121212)");

// ===== v0.50.0 — pinça ajusta a fonte (sem ir ao ⚙ Ajustes), com persistência =====
const pinchPure = await page.evaluate(() => ({
  grow: pinchFontSize(15, 1.6),
  shrinkClamp: pinchFontSize(20, 0.1),
  growClamp: pinchFontSize(20, 3),
  same: pinchFontSize(15, 1),
}));
ok(pinchPure.grow > 15 && pinchPure.grow <= 28, "pinchFontSize: afastar os dedos aumenta a fonte (15→" + pinchPure.grow + ")");
ok(pinchPure.shrinkClamp === 10, "pinchFontSize: aproximar muito trava no mínimo (10)");
ok(pinchPure.growClamp === 28, "pinchFontSize: afastar muito trava no máximo (28)");
ok(pinchPure.same === 15, "pinchFontSize: razão 1 mantém a fonte");
// touch-action desliga o pinch-zoom nativo na cifra (deixa a pinça mexer só na fonte)
ok(await page.evaluate(() => getComputedStyle(document.getElementById("p-body")).touchAction.includes("pan")),
   "Cifra usa touch-action pan-* (pinch-zoom nativo desligado p/ a pinça ajustar a fonte)");
// gesto real: 2 ponteiros afastando aumentam a fonte; aproximando diminuem
const pinchGesture = await page.evaluate(() => {
  songs.length = 0;
  songs.push({ id:"pz", title:"Pinça", artist:"", key:"C", capo:0, tags:[], updatedAt:1, body:"C  G  Am  F\nletra de teste pra pinça" });
  settings.readMode = "scroll"; saveSettings();
  saveSongs(); setFontSize(15); openPlayer("pz");
  const b = document.getElementById("p-body");
  const ev = (type,id,x) => b.dispatchEvent(new PointerEvent(type,{bubbles:true,cancelable:true,pointerId:id,clientX:x,clientY:300}));
  // afastar: |Δ| 100 → ~240
  ev("pointerdown",1,150); ev("pointerdown",2,250); ev("pointermove",1,80); ev("pointermove",2,320); ev("pointerup",1,80); ev("pointerup",2,320);
  const bigger = fontSize;
  // aproximar: |Δ| 260 → ~60
  setFontSize(20);
  ev("pointerdown",1,80); ev("pointerdown",2,340); ev("pointermove",1,190); ev("pointermove",2,250); ev("pointerup",1,190); ev("pointerup",2,250);
  const smaller = fontSize;
  return { bigger, smaller };
});
ok(pinchGesture.bigger > 15, "Pinça abrindo (2 dedos afastando) aumenta a fonte (15→" + pinchGesture.bigger + ")");
ok(pinchGesture.smaller < 20, "Pinça fechando (2 dedos aproximando) diminui a fonte (20→" + pinchGesture.smaller + ")");
// persistência: o tamanho escolhido é lembrado ao reabrir o app
await page.evaluate(() => setFontSize(22));
await page.reload(); await page.waitForTimeout(400);
ok((await page.evaluate(() => fontSize)) === 22, "Tamanho da fonte persiste ao reabrir o app (lembrado)");

// ===== v0.51.0 — escala como texto p/ WhatsApp: equipe + cabeçalho + momento + as duas obs =====
const txt51 = await page.evaluate(() => {
  songs.length = 0; escalas.length = 0;
  songs.push({ id:"m1", title:"Bondade de Deus", key:"C", capo:0, tags:[], updatedAt:1, body:"C", ref:"https://youtu.be/xxxx", notes:"começa só voz" });
  songs.push({ id:"m2", title:"Teu Santo Nome", key:"D", capo:0, tags:[], updatedAt:1, body:"D" });
  escalas.push({ id:"x51", title:"Culto de Domingo", date:"2026-06-29", time:"19h00", type:"Culto",
    team:[
      { role:"Vocal", name:"Beltrana" },     // Vocal aparece ANTES do Ministrante na lista crua…
      { role:"Ministrante", name:"Fulano" }, // …mas a saída agrupa e ordena por FUNCOES (Ministrante 1º)
      { role:"Vocal", name:"Cicrana" },
      { role:"Baixo", name:"Pedro" },
      { role:"Vocal", name:"" },             // sem nome → ignorado (não polui o "Vocal: …")
    ],
    items:[
      { kind:"song", songId:"m1", key:"G", capo:0, momento:"Adoração", note:"repetir o refrão 2x" }, // it.key=G vence s.key=C
      { kind:"item", title:"Oração", momento:"Ministração", note:"João conduz" },                    // item não-musical
      { kind:"song", songId:"m2", key:"", capo:0, momento:"", note:"" },                              // sem extras → sem detalhes
    ],
    notes:"Chegar 18h pra passagem de som", updatedAt:1 });
  escalas.push({ id:"x51b", title:"Simples", date:"", time:"", type:"", team:[],
    items:[{ kind:"song", songId:"m2", key:"", capo:0, momento:"", note:"" }], notes:"", updatedAt:1 });
  saveSongs(); saveEscalas();
  const full = escalaToText("x51"), lean = escalaToText("x51b");
  const L = full.split("\n"); const idx = s => L.findIndex(x => x.startsWith(s));
  const i3 = idx("3. Teu Santo Nome"); const afterSong3 = L[i3+1] || "";
  return {
    startsTitle: L[0] === "🎵 *Culto de Domingo*",
    headOk: /^📅 .*· 19h00 · Culto$/.test(L[1] || ""),
    teamHeader: full.includes("👥 *Equipe*"),
    vocalGrouped: full.includes("\nVocal: Beltrana, Cicrana\n"),
    noFuncEmoji: full.includes("\nMinistrante: Fulano\n"),        // linha começa pelo nome da função (sem emoji)
    order: idx("Ministrante:") < idx("Vocal:") && idx("Vocal:") < idx("Baixo:"),
    song1: full.includes("1. Bondade de Deus — Tom G · _Adoração_"),
    link: full.includes("   ▶️ https://youtu.be/xxxx"),
    itNote: full.includes("   📝 repetir o refrão 2x"),
    sNote: full.includes("   💬 começa só voz"),
    nonMusical: full.includes("2. Oração · _Ministração_") && full.includes("   📝 João conduz"),
    song3: full.includes("3. Teu Santo Nome — Tom D"),
    song3NoDetail: afterSong3 === "" || afterSong3.startsWith("📌"),
    escNotes: full.includes("📌 _Chegar 18h pra passagem de som_"),
    leanNoTeam: !lean.includes("👥"), leanNoHead: !lean.includes("📅"),
    leanNoDetails: !/▶️|💬|📝|📌/.test(lean), leanSong: lean.includes("1. Teu Santo Nome — Tom D"),
  };
});
ok(txt51.startsTitle && txt51.headOk, "Texto: cabeçalho com *título* e linha 📅 (data · hora · tipo)");
ok(txt51.teamHeader && txt51.vocalGrouped, "Texto: equipe agrupada por função (Vocal: Beltrana, Cicrana)");
ok(txt51.noFuncEmoji && txt51.order, "Texto: sem emoji por função; equipe na ordem de FUNCOES (Ministrante → Vocal → Baixo)");
ok(txt51.song1, "Texto: música com Tom (it.key vence s.key) + momento inline (· _Adoração_)");
ok(txt51.link && txt51.itNote && txt51.sNote, "Texto: as duas observações (📝 do culto + 💬 fixa) e o link guia (▶️)");
ok(txt51.nonMusical, "Texto: item não-musical entra na numeração (com momento e obs)");
ok(txt51.song3 && txt51.song3NoDetail, "Texto: música sem extras não gera linhas de detalhe (sem rótulo órfão)");
ok(txt51.escNotes, "Texto: observação geral da escala no rodapé (📌)");
ok(txt51.leanNoTeam && txt51.leanNoHead && txt51.leanNoDetails && txt51.leanSong,
   "Texto enxuto (só título + 1 música): sem seção Equipe, sem 📅 e sem detalhes");

// ===== v0.52.0 — Acordes ~20% maiores (Inc.1): visual, sem mexer no layout =====
await page.evaluate(() => {
  const body = Array.from({ length: 20 }, (_, i) => `[Trecho ${i + 1}]\nC  G  Am  F  Dm  E`).join("\n");
  const ex = songs.find(s => s.id === "chordscaletest");
  if (ex) ex.body = body;
  else songs.push({ id: "chordscaletest", title: "Escala do Acorde", key: "C", capo: 0, tags: [], updatedAt: Date.now(), body });
  saveSongs(); settings.readMode = "scroll"; openPlayer("chordscaletest");
});
await page.waitForTimeout(150);
const inc1 = await page.evaluate(() => {
  const c = document.querySelector("#p-body .chord");
  if (!c) return null;
  const cs = getComputedStyle(c);
  return { display: cs.display, transform: cs.transform };
});
ok(!!inc1 && inc1.display === "inline-block",
   "Inc.1: acorde renderiza como inline-block (necessário p/ o transform aplicar)");
ok(!!inc1 && inc1.transform !== "none" && inc1.transform.startsWith("matrix(1.2"),
   "Inc.1: acorde com transform scale ~1.2 (maior que a letra, sem font-size)");
// guarda anti-font-size: mudar --chord-scale (visual) NÃO pode mudar a paginação (layout)
const inc1pg = await page.evaluate(() => {
  settings.readMode = "page"; openPlayer("chordscaletest");
  const a = document.getElementById("p-body").dataset.pages;
  document.documentElement.style.setProperty("--chord-scale", "2.6"); drawPlayer();
  const b = document.getElementById("p-body").dataset.pages;
  document.documentElement.style.removeProperty("--chord-scale"); drawPlayer();
  setReadMode("scroll");
  return { a: +a, b: +b };
});
ok(inc1pg.a >= 2 && inc1pg.a === inc1pg.b,
   "Inc.1: mudar --chord-scale (2.6×) NÃO altera a paginação (transform é layout-neutro)");

// ===== v0.53.0 — Salvar edição com escolha + salvar o tom no player (Inc.2) =====

// A) transposeBody: prova de equivalência com renderCifra SEM os <span> (mesma classificação de
//    linha e mesma transposição) — cobre todos os ramos de uma vez (a armadilha do "renderer gêmeo").
const tbEquiv = await page.evaluate(() => {
  const body = [
    "[Intro] C  G  Am  F  |  x2",   // [Seção] + acordes (com token neutro)
    "Amei [C]porque [G]sim",        // letra com [C] inline
    "[G] E aí, tudo bem",           // [G] inline; o "E" solto NÃO pode ser transposto
    "E|--0--2--3--|",               // tablatura crua (fica intacta)
    "[Refrão]",                     // seção sozinha
    "C   G   D",                    // linha só de acordes
  ].join("\n");
  const ctx = spellCtx("C", 2);
  const strip = h => h.replace(/<span class="[^"]*">/g, "").replace(/<\/span>/g, "");
  return { r: strip(renderCifra(body, 2, true, ctx, false)), tb: transposeBody(body, 2, ctx) };
});
ok(tbEquiv.r === tbEquiv.tb,
   "transposeBody === renderCifra sem os <span> (mesmos ramos: seção+acordes, [C] inline, 'E' solto, tab)");
const tbMore = await page.evaluate(() => ({
  bare: transposeBody("[G] E aí", 2, spellCtx("C", 2)),
  ident: transposeBody("C  G  Am", 12, spellCtx("C", 12)),
  round: transposeBody(transposeBody("C  G  Am  F", 2, spellCtx("C", 2)), -2, spellCtx("D", -2)),
  spaces: transposeBody("C   G   D", 2, spellCtx("C", 2)),
}));
ok(tbMore.bare === "[A] E aí", "transposeBody: 'E' solto na letra fica intacto (só o [G] transpõe)");
ok(tbMore.ident === "C  G  Am", "transposeBody: múltiplo de 12 devolve o corpo idêntico (grafia preservada)");
ok(tbMore.round === "C  G  Am  F", "transposeBody: round-trip (+2 depois −2) volta ao equivalente");
ok(tbMore.spaces === "D   A   E", "transposeBody: transposição de mesma largura preserva o alinhamento");

// B) songChanged: normalização simétrica dos 2 lados
const chg = await page.evaluate(() => {
  const base = { title:"X", artist:"A", key:"G", capo:0, ref:"", notes:"n", body:"G  C", tags:["a","b"] };
  const chk = over => songChanged(base, Object.assign({}, base, over));
  return {
    none: songChanged(base, Object.assign({}, base)),
    all: chk({title:"Y"}) && chk({artist:"B"}) && chk({key:"D"}) && chk({capo:2})
         && chk({ref:"https://y.tube"}) && chk({notes:"m"}) && chk({body:"G  D"}) && chk({tags:["a"]}),
    normalized: songChanged(base, Object.assign({}, base, { tags:["a"," b "] })),  // ['a','b'] normalizado
  };
});
ok(chg.none === false, "songChanged: sem alteração → false (não abre folha à toa)");
ok(chg.all === true, "songChanged: detecta mudança em cada um dos 8 campos");
ok(chg.normalized === false, "songChanged: tags só com espaço extra → sem mudança (normalização simétrica)");

// C) cloneSong preserva TODOS os campos (ref/notes) — fonte única do clone
const clone = await page.evaluate(() => {
  const src = { id:"orig", title:"T", artist:"A", key:"G", capo:1, ref:"https://y.tube/x", notes:"obs", body:"G", tags:["t1"] };
  const c = cloneSong(src, { title:"T (cópia)" });
  return c.id!==src.id && c.title==="T (cópia)" && c.ref===src.ref && c.notes===src.notes
      && c.capo===src.capo && c.tags.join()==="t1" && c.tags!==src.tags;
});
ok(clone, "cloneSong: id novo + título sobrescrito; ref/notes/capo preservados; tags é cópia (não a mesma ref)");

// D) Fluxo B — visibilidade do "Salvar tom/capo"
const skVis = await page.evaluate(() => {
  const id = "savekeytest";
  const song = { id, title:"Salvar Tom", key:"G", capo:2, tags:[], updatedAt:1, body:"G  C  D\nletra" };
  const ex = songs.find(s => s.id===id); if (ex) Object.assign(ex, song); else songs.push(song);
  saveSongs();
  const disp = () => document.getElementById("p-savekey-row").style.display;
  openPlayer(id);            const onOpen = disp();      // abre no capo salvo (transp0/capo2) → escondido
  transposeBy(1);            const onTransp = disp();    // transpôs → visível
  transposeBy(-1);           const backToKey = disp();   // voltou ao tom (capo intacto) → escondido
  capo = 3; drawPlayer();    const onCapo = disp();       // só o capo mudou → visível
  capo = 2;
  openPlayer(id, { id:"e", idx:0, list:[{ songId:id, key:"A", capo:2 }] }); const inPresent = disp(); // escala → escondido
  openPlayer(id);            // limpa o estado de escala
  return { onOpen, onTransp, backToKey, onCapo, inPresent };
});
ok(skVis.onOpen === "none", "Fluxo B: música com capo salvo abre com 'Salvar tom/capo' ESCONDIDO (âncora v0.51.3)");
ok(skVis.onTransp !== "none", "Fluxo B: ao transpor, 'Salvar tom/capo' aparece");
ok(skVis.backToKey === "none", "Fluxo B: voltar ao tom salvo (capo intacto) esconde de novo");
ok(skVis.onCapo !== "none", "Fluxo B: mudar só o capo também mostra 'Salvar tom/capo'");
ok(skVis.inPresent === "none", "Fluxo B: na Apresentação (escalaCtx) o botão fica escondido");

// E) Fluxo B — "Sobrescrever" pelo HANDLER REAL (botão → folha → item), capo=0: corpo assado, sem salto
await page.evaluate(() => {
  const id = "baketest2";
  const song = { id, title:"Assar2", key:"C", capo:0, tags:[], updatedAt:1, body:"C  G  Am  F\nletra" };
  const ex = songs.find(s => s.id===id); if (ex) Object.assign(ex, song); else songs.push(song);
  saveSongs(); settings.readMode = "scroll"; openPlayer(id); transposeBy(2);
});
await page.waitForTimeout(120);
const beforeUI = await page.evaluate(() => document.getElementById("p-body").innerHTML);
await page.evaluate(() => $("#p-savekey").click());   // abre a folha de escolha
await page.waitForTimeout(200);
const sheetBcount = await page.locator("#sheet .sheetitem").count();
await page.locator("#sheet .sheetitem").first().click();   // Sobrescrever
await page.waitForTimeout(200);
const ovUI = await page.evaluate(() => {
  const s = songs.find(x => x.id==="baketest2");
  return { key:s.key, bodyOk:/D  A  Bm  G/.test(s.body), after:document.getElementById("p-body").innerHTML };
});
ok(sheetBcount >= 2, "Fluxo B: tocar 'Salvar tom/capo' abre a folha (Sobrescrever / Salvar como nova)");
ok(ovUI.key === "D" && ovUI.bodyOk, "Fluxo B Sobrescrever (handler real): key→D e o corpo é assado (C G Am F → D A Bm G)");
ok(ovUI.after === beforeUI, "Fluxo B Sobrescrever (capo=0): sem salto visual — #p-body idêntico antes/depois");

// F) Fluxo A (editor): mudar o corpo → folha; "Salvar como nova" cria 2ª música
await page.evaluate(() => {
  const id = "editchoicetest";
  const song = { id, title:"Editar Escolha", key:"G", capo:0, tags:[], ref:"", notes:"", updatedAt:1, body:"G  C" };
  const ex = songs.find(s => s.id===id); if (ex) Object.assign(ex, song); else songs.push(song);
  saveSongs(); openEditor(id);
});
await page.waitForTimeout(120);
await page.fill("#e-body", "G  C  D");
const beforeA = await page.evaluate(() => songs.filter(s => s.title.startsWith("Editar Escolha")).length);
await page.click("#e-save"); await page.waitForTimeout(200);
const sheetAcount = await page.locator("#sheet .sheetitem").count();
await page.locator("#sheet .sheetitem").nth(1).click();   // Salvar como nova
await page.waitForTimeout(200);
const afterA = await page.evaluate(() => {
  const list = songs.filter(s => s.title.startsWith("Editar Escolha"));
  return { n:list.length, hasCopy:list.some(s => /\(cópia\)$/.test(s.title)) };
});
ok(sheetAcount >= 2, "Fluxo A: editar o corpo e Salvar abre a folha (Sobrescrever / Salvar como nova)");
ok(afterA.n === beforeA + 1 && afterA.hasCopy, "Fluxo A 'Salvar como nova' (só corpo): cria 2ª música com sufixo '(cópia)'");

// F2) Fluxo A — tom mudado → sufixo "(Tom X)"
await page.evaluate(() => {
  const id = "editkeytest";
  const song = { id, title:"Tom Muda", key:"G", capo:0, tags:[], ref:"", notes:"", updatedAt:1, body:"G  C" };
  const ex = songs.find(s => s.id===id); if (ex) Object.assign(ex, song); else songs.push(song);
  saveSongs(); openEditor(id);
});
await page.waitForTimeout(100);
await page.selectOption("#e-key", "D");
await page.click("#e-save"); await page.waitForTimeout(200);
await page.locator("#sheet .sheetitem").nth(1).click();   // Salvar como nova
await page.waitForTimeout(200);
const tomNew = await page.evaluate(() => songs.some(s => s.title === "Tom Muda (Tom D)"));
ok(tomNew, "Fluxo A 'Salvar como nova' com tom mudado: título vira 'Tom Muda (Tom D)'");

// G) Fluxo A — salvar SEM mudar nada → sem folha, sem duplicata
await page.evaluate(() => {
  const id = "nochangetest";
  const song = { id, title:"Sem Mudança", key:"G", capo:0, tags:[], ref:"", notes:"", updatedAt:1, body:"G  C" };
  const ex = songs.find(s => s.id===id); if (ex) Object.assign(ex, song); else songs.push(song);
  saveSongs(); openEditor(id);
});
await page.waitForTimeout(100);
await page.click("#e-save"); await page.waitForTimeout(200);
const nochange = await page.evaluate(() => ({
  sheetShown: document.getElementById("sheet").classList.contains("show"),
  n: songs.filter(s => s.title.startsWith("Sem Mudança")).length,
}));
ok(!nochange.sheetShown && nochange.n === 1, "Fluxo A: salvar sem alterar nada → sem folha, sem duplicata");

// H) "Conferir tom": continua coerente após assar (detectKey é por pitch-class, insensível à grafia)
const ckCoh = await page.evaluate(() => {
  settings.checkKey = true;
  const id = "ckcohtest";
  const song = { id, title:"Coerência Tom", key:"C", capo:0, tags:[], updatedAt:1, body:"C  F  G  C" };
  const ex = songs.find(s => s.id===id); if (ex) Object.assign(ex, song); else songs.push(song);
  saveSongs(); openPlayer(id);
  const beforeAlarm = !document.getElementById("keycheck").classList.contains("hidden");
  transposeBy(2);
  const s = songs.find(x => x.id===id), ctx = spellCtx(s.key, transp);
  s.body = transposeBody(s.body, transp, ctx);
  s.key = transposeNote(keyRoot(s.key), transp, ctx) + (keyIsMinor(s.key) ? "m" : "");
  transp = 0; saveSongs(); drawPlayer();
  const afterAlarm = !document.getElementById("keycheck").classList.contains("hidden");
  settings.checkKey = false; drawPlayer();
  return { beforeAlarm, afterAlarm, key:s.key };
});
ok(ckCoh.beforeAlarm === false && ckCoh.afterAlarm === false && ckCoh.key === "D",
   "Conferir tom: coerente após assar (C→D não passa a alarmar; detecção por pitch-class)");

// ===== v0.54.0 — tema laranja + brilho (halo) dos acordes reduzido/desligável =====
const themeChk = await page.evaluate(() => {
  const read = () => getComputedStyle(document.body).getPropertyValue("--accent").trim();
  const dark = read();
  settings.theme = "orange"; applyTheme();
  const orangeClass = document.body.classList.contains("orange");
  const orangeAccent = read();
  settings.theme = "dark"; applyTheme();
  return { dark, orangeClass, orangeAccent, backToDark: read() };
});
ok(themeChk.orangeClass, "Tema laranja: body ganha a classe 'orange'");
ok(/#fb923c/i.test(themeChk.orangeAccent) && themeChk.orangeAccent !== themeChk.dark,
   "Tema laranja: --accent vira laranja (#fb923c), diferente do escuro");
ok(themeChk.backToDark === themeChk.dark, "Tema: voltar pro escuro restaura o acento");

// seletor de tema (folha com 3 opções: Escuro / Claro / Laranja)
await page.evaluate(() => { settings.theme = "dark"; applyTheme(); $("#themeBtn").click(); });
await page.waitForTimeout(200);
const themeSheetChk = await page.locator("#sheet .sheetitem").count();
await page.locator("#sheetbg").click({ position: { x: 10, y: 10 } });
await page.waitForTimeout(150);
ok(themeSheetChk === 3, "Seletor de tema: a folha abre com 3 opções (Escuro/Claro/Laranja)");

// halo/chip dos acordes: (a) chip de acordes EMPILHADOS não se sobrepõe; (b) o interruptor REAL
// (clique no #halo-toggle) remove o brilho E o chip. Mede a geometria (regressão da v0.52.0).
const haloChk = await page.evaluate(() => {
  const body = "C     G     D\nF     A     E\nMinha letra aqui";   // 2 linhas de acorde empilhadas
  const ex = songs.find(s => s.id === "halostack");
  const song = { id: "halostack", title: "Halo Stack", key: "C", capo: 0, tags: [], updatedAt: 1, body };
  if (ex) Object.assign(ex, song); else songs.push(song);
  delete settings.chordHalo; saveSongs(); settings.readMode = "scroll"; openPlayer("halostack");
  const ch = [...document.querySelectorAll("#p-body .chord")];
  const c = ch.find(x => x.textContent === "C"), f = ch.find(x => x.textContent === "F");
  const gap = f.getBoundingClientRect().top - c.getBoundingClientRect().bottom;
  const cs = getComputedStyle(c);
  return { gap, csOn: cs.textShadow, boxH: c.getBoundingClientRect().height };
});
ok(haloChk.gap > 0, "Acordes empilhados: o chip NÃO se sobrepõe verticalmente (gap " + haloChk.gap.toFixed(1) + "px > 0)");
ok(haloChk.csOn !== "none" && haloChk.csOn.includes("6px"), "Brilho dos acordes: ligado, halo ~6px (era 14px)");
// clica o INTERRUPTOR REAL (abre o ⚙ e clica no botão — caminho do usuário, não settings direto)
await page.evaluate(() => openPlayerSheet());
await page.waitForTimeout(200);
await page.locator("#halo-toggle").click();
await page.waitForTimeout(200);
const haloOff = await page.evaluate(() => {
  const c = [...document.querySelectorAll("#p-body .chord")].find(x => x.textContent === "C");
  const cs = getComputedStyle(c);
  return { noHalo: document.getElementById("p-body").classList.contains("no-halo"),
           shadow: cs.textShadow, bg: cs.backgroundColor, saved: settings.chordHalo };
});
await page.evaluate(() => closePlayerSheet());
ok(haloOff.noHalo && haloOff.shadow === "none", "Interruptor 'Brilho dos acordes' (clique REAL): remove o text-shadow");
ok(/rgba\(0, 0, 0, 0\)|transparent/.test(haloOff.bg), "Interruptor 'Brilho dos acordes' (clique REAL): remove também o chip de fundo");
ok(haloOff.saved === false, "Interruptor persiste settings.chordHalo=false");

// ===== v0.56.0 — Quebra de linha automática (não esconder ao ampliar) =====
// (a) rewrapBody puro: parte em blocos que cabem, sem partir acorde; curto e tab intactos
const wrapPure = await page.evaluate(() => {
  const chord = "C       G       Am      F       C       G";
  const lyric = "Aleluia ao Rei que vem reinar sobre toda a terra";
  const lines = rewrapBody(chord + "\n" + lyric, 20).split("\n");
  const chordLines = lines.filter((_, i) => i % 2 === 0);
  return {
    maxLen: Math.max(...lines.map(l => l.length)),
    noSplitChord: chordLines.every(l => l.trim().split(/\s+/).filter(Boolean).every(t => isChord(t))),
    shortUnchanged: rewrapBody("C   G\nabc def", 40) === "C   G\nabc def",
    tabUntouched: rewrapBody("E|--0--2--3--5--7--8--10--12--|", 10) === "E|--0--2--3--5--7--8--10--12--|",
  };
});
ok(wrapPure.maxLen <= 20, "rewrapBody: blocos cabem em cols (máx " + wrapPure.maxLen + " ≤ 20)");
ok(wrapPure.noSplitChord, "rewrapBody: nenhum acorde é partido entre blocos");
ok(wrapPure.shortUnchanged, "rewrapBody: linha que já cabe volta idêntica (sem regressão)");
ok(wrapPure.tabUntouched, "rewrapBody: tablatura passa intacta (não quebra)");

// (b) MEDIÇÃO real: fonte grande + rolagem → wrap ON não transborda pro lado
await page.evaluate(() => {
  const chord = "C       G       Am      F       C       G       D       Em      A";
  const lyric = "Aleluia ao Rei que vem reinar sobre toda a terra e por todo o sempre sim";
  const body = Array.from({ length: 8 }, () => chord + "\n" + lyric).join("\n\n");   // longo p/ forçar várias páginas
  const ex = songs.find(s => s.id === "wrapstage");
  const song = { id: "wrapstage", title: "Wrap Stage", key: "C", capo: 0, tags: [], updatedAt: 1, body };
  if (ex) Object.assign(ex, song); else songs.push(song);
  fontSize = 26; settings.wrapLines = true; settings.readMode = "scroll"; saveSongs(); openPlayer("wrapstage");
});
await page.waitForTimeout(200);
const wrapOn = await page.evaluate(() => { const b = document.getElementById("p-body"); return b.scrollWidth - b.clientWidth; });
ok(wrapOn <= 2, "Quebra ON (fonte 26, rolagem): a cifra NÃO transborda pro lado (overflowX " + wrapOn + "px ≈ 0)");

// (c) interruptor REAL desliga → volta a transbordar (prova o toggle + prova que a música transborda sem wrap)
await page.evaluate(() => openPlayerSheet());
await page.waitForTimeout(200);
await page.locator("#wrap-toggle").click();
await page.waitForTimeout(200);
const wrapOff = await page.evaluate(() => { const b = document.getElementById("p-body"); return { over: b.scrollWidth - b.clientWidth, saved: settings.wrapLines }; });
await page.evaluate(() => { closePlayerSheet(); settings.wrapLines = true; drawPlayer(); });
ok(wrapOff.saved === false, "Interruptor 'Quebrar linhas' (clique REAL) desliga e persiste");
ok(wrapOff.over > 100, "Quebra OFF: a cifra volta a transbordar pro lado (overflowX " + wrapOff.over + "px)");

// (d) Modo Página: ampliar a fonte AUMENTA a quantidade de páginas
const wrapPages = await page.evaluate(() => {
  fontSize = 14; settings.wrapLines = true; settings.readMode = "page"; openPlayer("wrapstage");
  const small = +document.getElementById("p-body").dataset.pages;
  fontSize = 26; drawPlayer();
  const big = +document.getElementById("p-body").dataset.pages;
  settings.readMode = "scroll"; fontSize = 15; drawPlayer();
  return { small, big };
});
ok(wrapPages.big > wrapPages.small, "Quebra + Modo Página: ampliar a fonte aumenta as páginas (" + wrapPages.small + "→" + wrapPages.big + ")");

// ===== v0.57.0 — o voltar do celular anda DENTRO do app =====
// Contexto próprio: o histórico precisa começar limpo p/ o goBack ser determinístico.
// Tudo aqui exercita o CAMINHO REAL (clique no controle) e mede o RENDER, não o estado lógico.
const ctxNav = await browser.newContext({ viewport: { width: 412, height: 915 } });
const pageNav = await ctxNav.newPage();
const navErrors = [];
pageNav.on("pageerror", e => navErrors.push(e.message));
await pageNav.addInitScript(() => {
  localStorage.setItem("louvai.settings.v1", JSON.stringify({ theme: "dark", seeded: true, lastBackup: Date.now(), dirtySinceBackup: false }));
  localStorage.setItem("louvai.songs.v1", JSON.stringify([
    { id: "n1", title: "Voltar Um", artist: "A", key: "C", body: "[Intro]\nC G\nprimeira letra", tags: [] },
    { id: "n2", title: "Voltar Dois", artist: "B", key: "D", body: "[Intro]\nD A\nsegunda letra", tags: [] }]));
  localStorage.setItem("louvai.escalas.v1", JSON.stringify([
    { id: "ne1", title: "Culto de teste", date: "2026-09-06", team: [],
      items: [{ kind: "song", songId: "n1" }, { kind: "song", songId: "n2" }] }]));
});
const navDepth = () => pageNav.evaluate(() => (history.state && history.state.louvai
  ? history.state.louvai.stack.filter(e => e.t !== "guard").length : -1));
const navVis = id => pageNav.locator(id).isVisible();
const navShown = async id => (await pageNav.locator(id + ".show").count()) === 1;
const navFresh = async () => { await pageNav.goto(APP_URL); await pageNav.waitForTimeout(300); };

// (a) o gesto mais comum no palco: ⚙ aberto no player, voltar fecha SÓ o painel
await navFresh();
ok((await navDepth()) === 1, "Voltar: a raiz é carimbada no boot (pilha = 1; na lista o voltar sai do app)");
await pageNav.locator(".songcard").first().click(); await pageNav.waitForTimeout(250);
await pageNav.locator("#p-settings").click(); await pageNav.waitForTimeout(300);
await pageNav.goBack(); await pageNav.waitForTimeout(350);
ok(!(await navShown("#playersheet")) && await navVis("#view-player"),
  "Voltar fecha o ⚙ Ajustes e MANTÉM a cifra aberta");
await pageNav.goBack(); await pageNav.waitForTimeout(350);
ok(await navVis("#view-lib") && !(await navVis("#view-player")) && (await navDepth()) === 1,
  "Voltar de novo sai da cifra para a lista (e a pilha volta à raiz)");

// (b) regressão: recolher o ⚙ e abrir outra folha no MESMO toque não pode sobrepor as duas
// (o back é assíncrono; sem coalescência o ⚙ ficava POR CIMA e o item virava inclicável)
await navFresh();
await pageNav.locator(".songcard").first().click(); await pageNav.waitForTimeout(220);
await pageNav.locator("#p-settings").click(); await pageNav.waitForTimeout(280);
await pageNav.locator("#p-share").click(); await pageNav.waitForTimeout(400);
const alvo = pageNav.locator("#sheet .sheetitem", { hasText: "Editar cifra" });
const noTopo = await alvo.evaluate(el => { const r = el.getBoundingClientRect();
  const t = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
  return !!t && (t === el || el.contains(t)); });
ok(await navShown("#sheet") && !(await navShown("#playersheet")) && noTopo,
  "Compartilhar recolhe o ⚙ sem sobrepor: o item da folha está clicável de fato (elementFromPoint)");
ok((await navDepth()) === 3, "Fechar-e-abrir no mesmo toque reaproveita a entrada (pilha lista>cifra>folha = 3)");
await alvo.click(); await pageNav.waitForTimeout(450);
ok(await navVis("#view-editor") && (await navDepth()) === 3,
  "Folha → editor: troca de tela fechando a folha mantém a pilha coerente");
await pageNav.goBack(); await pageNav.waitForTimeout(400);
ok(await navVis("#view-player") && !(await navVis("#view-editor")), "Voltar do editor retorna para a cifra");

// (b2) fechar a folha pelo fundo (ou arrastando) não pode deixar entrada órfã no histórico
await navFresh();
await pageNav.locator(".songcard").first().click(); await pageNav.waitForTimeout(220);
await pageNav.locator("#p-settings").click(); await pageNav.waitForTimeout(300);
await pageNav.locator("#playerbg").click({ position: { x: 10, y: 10 } }); await pageNav.waitForTimeout(400);
ok(!(await navShown("#playersheet")) && (await navDepth()) === 2,
  "Fechar o ⚙ pelo fundo desempilha junto (sem entrada órfã)");
await pageNav.goBack(); await pageNav.waitForTimeout(400);
ok(await navVis("#view-lib"), "Depois de fechar pelo fundo, UM voltar já sai da cifra");

// (c) editar e cancelar pelo caminho do app não pode empilhar (voltar escrito como abertura)
await navFresh();
await pageNav.locator(".songcard").first().click(); await pageNav.waitForTimeout(220);
await pageNav.locator("#p-settings").click(); await pageNav.waitForTimeout(280);
await pageNav.locator("#p-edit").click(); await pageNav.waitForTimeout(450);
const navDepEd = await navDepth();
await pageNav.locator("#e-cancel").click(); await pageNav.waitForTimeout(400);
ok(navDepEd === 3 && (await navDepth()) === 2 && await navVis("#view-player"),
  "Cancelar a edição volta pra cifra DESEMPILHANDO (não empilha o player de novo)");

// (d) Apresentação: sair volta pra escala desempilhando; trocar de música não vira histórico
await navFresh();
await pageNav.locator("#tab-escalas").click(); await pageNav.waitForTimeout(250);
await pageNav.locator(".escard").first().click(); await pageNav.waitForTimeout(280);
await pageNav.locator("#es-present").click(); await pageNav.waitForTimeout(400);
const navDepPres = await navDepth();
await pageNav.locator("#pv-next").click(); await pageNav.waitForTimeout(400);
ok(navDepPres === 3 && (await navDepth()) === 3, "Apresentação: trocar de música NÃO empilha histórico");
await pageNav.locator("#pv-back").click(); await pageNav.waitForTimeout(450);
ok((await navDepth()) === 2 && await navVis("#view-escala"),
  "Sair da Apresentação volta pra escala DESEMPILHANDO (o voltar continua saindo)");
await pageNav.goBack(); await pageNav.waitForTimeout(400);
ok(await navVis("#view-lib") && (await navDepth()) === 1, "Voltar na escala retorna à lista");

// (e) tela cheia é uma camada: o voltar sai dela sem sair da Apresentação
await navFresh();
await pageNav.locator("#tab-escalas").click(); await pageNav.waitForTimeout(250);
await pageNav.locator(".escard").first().click(); await pageNav.waitForTimeout(280);
await pageNav.locator("#es-present").click(); await pageNav.waitForTimeout(400);
await pageNav.locator("#pv-full").click(); await pageNav.waitForTimeout(400);
const navFullOn = await pageNav.evaluate(() => document.getElementById("view-player").classList.contains("immersive"));
await pageNav.goBack(); await pageNav.waitForTimeout(450);
const navFullOff = await pageNav.evaluate(() => document.getElementById("view-player").classList.contains("immersive"));
ok(navFullOn && !navFullOff && await navVis("#view-player"),
  "Tela cheia: o voltar sai da tela cheia e MANTÉM a Apresentação aberta");

// (f) diagrama de acorde (fora do funil das folhas) também é uma camada
await navFresh();
await pageNav.locator(".songcard").first().click(); await pageNav.waitForTimeout(280);
await pageNav.locator("#p-body .chord").first().click(); await pageNav.waitForTimeout(350);
const navDiagOn = await navVis("#chorddiag");
await pageNav.goBack(); await pageNav.waitForTimeout(400);
ok(navDiagOn && !(await navVis("#chorddiag")) && await navVis("#view-player"),
  "Diagrama de acorde: o voltar fecha o diagrama e MANTÉM a cifra (tocando no acorde de verdade)");

// (g) o link auto-importável limpa o hash SEM apagar a pilha de navegação
await navFresh();
await pageNav.locator(".songcard").first().click(); await pageNav.waitForTimeout(250);
const navHash = await pageNav.evaluate(() => { clearImpHash();
  return { stack: history.state && history.state.louvai
    ? history.state.louvai.stack.filter(e => e.t !== "guard").length : -1, hash: location.hash }; });
ok(navHash.stack === 2 && navHash.hash === "", "clearImpHash() limpa o #imp= preservando a pilha de navegação");
// (h) v0.58.0 — confirmação de intenção antes de sair do app.
// Página NOVA: aqui o histórico precisa ser só [em branco, app] p/ o 2º voltar poder sair de verdade.
// E o repertório entra com backup recente, senão o lembrete do boot ocupa o toast que vamos medir.
const pageExit = await ctxNav.newPage();
await pageExit.addInitScript(() => {
  localStorage.setItem("louvai.settings.v1", JSON.stringify({ theme: "dark", seeded: true, lastBackup: Date.now(), dirtySinceBackup: false }));
  localStorage.setItem("louvai.songs.v1", JSON.stringify([
    { id: "x1", title: "Sair Um", artist: "A", key: "C", body: "[Intro]\nC G\nletra", tags: [] }]));
});
await pageExit.goto(APP_URL);
await pageExit.waitForFunction(() => typeof navStack !== "undefined");   // espera o BOOT (não um sleep fixo)
await pageExit.waitForTimeout(150);
await pageExit.locator("#search").click();              // gesto real: é ele que arma a guarda
await pageExit.waitForTimeout(200);
await pageExit.goBack(); await pageExit.waitForTimeout(400);
// v0.61.0 — a REGRA em si, com o ambiente forjado: maxTouchPoints sozinho não decide (ele varia até
// entre execuções do mesmo Chromium, o que deixava este teste intermitente). O sinal é o ponteiro.
const heur = await pageExit.evaluate(() => {
  const orig = Object.getOwnPropertyDescriptor(Navigator.prototype, "maxTouchPoints");
  const mmOrig = window.matchMedia;
  const cenario = (pontos, coarse, fine) => {
    Object.defineProperty(navigator, "maxTouchPoints", { configurable: true, value: pontos });
    window.matchMedia = q => ({ matches: /coarse/.test(q) ? coarse : fine });
    return navUsaWatcher();
  };
  const r = { notebookTouch: cenario(10, false, true),   // notebook Windows com touchscreen
              celular:       cenario(5,  true,  false),
              toqueSemMedia: cenario(5,  false, false),  // celular que não se declara coarse
              desktopPuro:   cenario(0,  false, true) };
  window.matchMedia = mmOrig;
  if (orig) Object.defineProperty(Navigator.prototype, "maxTouchPoints", orig);
  else delete navigator.maxTouchPoints;
  return r;
});
ok(!heur.notebookTouch && !heur.desktopPuro, "Notebook com touchscreen (toque + ponteiro FINO) não é tratado como celular: fica com a entrada-guarda");
ok(heur.celular && heur.toqueSemMedia, "Celular (ponteiro grosso, ou toque sem ponteiro fino) continua no CloseWatcher");
const avisoSaida = await pageExit.evaluate(() => { const d = document.getElementById("exitdlg");
  return { visivel: !d.classList.contains("hidden"), texto: d.textContent.replace(/\s+/g, " ").trim(),
           fundo: !document.getElementById("exitbg").classList.contains("hidden") }; });
ok(await pageExit.locator("#view-lib").isVisible() && avisoSaida.visivel && avisoSaida.fundo && /Sair do Louvai/i.test(avisoSaida.texto),
  "Na lista, o primeiro voltar abre o DIÁLOGO de saída (fundo escurecido): \"" + avisoSaida.texto + "\"");
const urlAntesDeSair = pageExit.url();
await pageExit.goBack().catch(() => {}); await pageExit.waitForTimeout(400);
ok(pageExit.url() !== urlAntesDeSair,
  "O segundo voltar sai de verdade, não prende o usuário no app (saiu para " + pageExit.url() + ")");
await pageExit.close();

// (i) a guarda não pode virar um passo a mais na navegação normal
await navFresh();
await pageNav.locator(".songcard").first().click(); await pageNav.waitForTimeout(280);
ok(await navVis("#view-player") && (await navDepth()) === 2,
  "Com a guarda armada, abrir a cifra empilha POR CIMA dela (sem custar um voltar a mais)");
await pageNav.goBack(); await pageNav.waitForTimeout(400);
ok(await navVis("#view-lib"), "Um voltar sai da cifra direto para a lista (a guarda não atrapalha)");
await pageNav.goBack(); await pageNav.waitForTimeout(400);
const rearmou = await pageNav.evaluate(() => !document.getElementById("exitdlg").classList.contains("hidden"));
ok(await navVis("#view-lib") && rearmou,
  "Ao voltar pra lista a guarda REARMA: o próximo voltar avisa em vez de sair");

// (j) v0.58.1 — REGRESSÃO do reporte de campo: a guarda tem de sobreviver à ida-e-volta da cifra.
// O bug: ela era substituída ao abrir a cifra e depois recriada DENTRO do popstate — sem gesto do
// usuário, e o Chrome ignora entrada criada sem interação, então o voltar seguinte saía do app.
await navFresh();
await pageNav.locator(".songcard").first().click(); await pageNav.waitForTimeout(280);
const pilhaComCifra = await pageNav.evaluate(() => history.state.louvai.stack.map(e => e.t + (e.id ? ":" + e.id : "")).join(">"));
ok(pilhaComCifra === "view:lib>guard>view:player",
  "A guarda fica ABAIXO da cifra (nasce do toque real, não recriada no popstate): " + pilhaComCifra);
await pageNav.goBack(); await pageNav.waitForTimeout(400);   // sai da cifra — SEM tocar na tela
const naListaComGuarda = await pageNav.evaluate(() => ({
  guarda: history.state.louvai.stack.some(e => e.t === "guard"),
  dialogo: !document.getElementById("exitdlg").classList.contains("hidden") }));
ok(await navVis("#view-lib") && naListaComGuarda.guarda && !naListaComGuarda.dialogo,
  "Voltar da cifra cai na lista COM a guarda intacta (e sem aviso prematuro)");
await pageNav.goBack(); await pageNav.waitForTimeout(400);   // de novo, ainda sem tocar na tela
const avisoAposCifra = await pageNav.evaluate(() => !document.getElementById("exitdlg").classList.contains("hidden"));
ok(await navVis("#view-lib") && avisoAposCifra,
  "Depois de sair da cifra, o voltar seguinte AVISA em vez de fechar o app (o bug de campo)");

// (k) o ← do próprio app também não pode consumir a guarda em silêncio
await navFresh();
await pageNav.locator("#tab-escalas").click(); await pageNav.waitForTimeout(250);
await pageNav.locator(".escard").first().click(); await pageNav.waitForTimeout(280);
await pageNav.locator("#es-back").click(); await pageNav.waitForTimeout(450);
const guardaAposSeta = await pageNav.evaluate(() => history.state.louvai.stack.some(e => e.t === "guard"));
ok(await navVis("#view-lib") && guardaAposSeta,
  "Voltar pela seta do app (escala →  lista) preserva a guarda");

// (l) v0.58.2 — "Continuar no app" desfaz a saída e REARMA a proteção com toque real
await navFresh();
await pageNav.locator("#search").click(); await pageNav.waitForTimeout(200);
await pageNav.goBack(); await pageNav.waitForTimeout(400);
ok(!(await pageNav.locator("#exitdlg").evaluate(d => d.classList.contains("hidden"))),
  "Diálogo de saída aberto (pelo caminho real do usuário)");
const dlgAcess = await pageNav.evaluate(() => { const d = document.getElementById("exitdlg");
  return { papel: d.getAttribute("role"), modal: d.getAttribute("aria-modal"), icone: !!document.querySelector("#exit-ic .ic-svg"),
           foco: document.activeElement && document.activeElement.id }; });
ok(dlgAcess.papel === "dialog" && dlgAcess.modal === "true" && dlgAcess.icone && dlgAcess.foco === "exit-stay",
  "Diálogo: role/aria-modal, ícone pintado pelo ICONS e foco no botão (" + JSON.stringify(dlgAcess) + ")");
await pageNav.locator("#exit-stay").click(); await pageNav.waitForTimeout(300);
const aposFicar = await pageNav.evaluate(() => ({
  fechado: document.getElementById("exitdlg").classList.contains("hidden"),
  guarda: history.state.louvai.stack.some(e => e.t === "guard") }));
ok(aposFicar.fechado && aposFicar.guarda && await navVis("#view-lib"),
  "\"Continuar no app\" fecha o diálogo e REARMA a guarda (o toque no botão é o gesto que o Chrome exige)");
await pageNav.goBack(); await pageNav.waitForTimeout(400);
ok(!(await pageNav.locator("#exitdlg").evaluate(d => d.classList.contains("hidden"))),
  "Depois de continuar no app, o voltar volta a avisar (proteção viva)");

// (m) o diálogo não pode sobreviver a uma navegação
await navFresh();
await pageNav.locator("#search").click(); await pageNav.waitForTimeout(200);
await pageNav.goBack(); await pageNav.waitForTimeout(400);
await pageNav.locator("#exit-stay").click(); await pageNav.waitForTimeout(250);
await pageNav.locator(".songcard").first().click(); await pageNav.waitForTimeout(300);
ok(await navVis("#view-player") && await pageNav.locator("#exitdlg").evaluate(d => d.classList.contains("hidden")),
  "Abrir uma cifra depois do diálogo não deixa resto de diálogo na tela");

// (n) v0.58.3 — REGRESSÃO do reporte: abrir o app e voltar SEM TOCAR EM NADA tem de avisar.
// No celular isso passa a valer pelo CloseWatcher ("watcher grátis" do documento, que intercepta o
// voltar do Android sem exigir gesto). No Playwright o equivalente é o Esc — mesmo "close request".
const ctxTouch = await browser.newContext({ viewport: { width: 412, height: 915 }, hasTouch: true, isMobile: true });
const pageTouch = await ctxTouch.newPage();
await pageTouch.addInitScript(() => {
  localStorage.setItem("louvai.settings.v1", JSON.stringify({ theme: "dark", seeded: true, lastBackup: Date.now(), dirtySinceBackup: false }));
  localStorage.setItem("louvai.songs.v1", JSON.stringify([
    { id: "w1", title: "Watcher Um", artist: "A", key: "C", body: "[Intro]\nC G\nletra", tags: [] }]));
});
const dlgAberto = () => pageTouch.evaluate(() => !document.getElementById("exitdlg").classList.contains("hidden"));
await pageTouch.goto(APP_URL);
await pageTouch.waitForFunction(() => typeof navStack !== "undefined");
await pageTouch.waitForTimeout(150);
const temWatcher = await pageTouch.evaluate(() => typeof CloseWatcher === "function");
await pageTouch.keyboard.press("Escape"); await pageTouch.waitForTimeout(300);
ok(temWatcher && await dlgAberto(),
  "Recém-carregado e SEM interação nenhuma, o voltar já avisa antes de sair (CloseWatcher)");
await pageTouch.locator("#exit-stay").click(); await pageTouch.waitForTimeout(250);
await pageTouch.keyboard.press("Escape"); await pageTouch.waitForTimeout(300);
ok(await dlgAberto(), "Depois de \"Continuar no app\", a proteção rearma (avisa de novo)");
await pageTouch.locator("#exit-stay").click(); await pageTouch.waitForTimeout(250);

// dentro do app o watcher tem de estar DESARMADO: o voltar pertence à navegação, não à saída
await pageTouch.locator(".songcard").first().click(); await pageTouch.waitForTimeout(300);
await pageTouch.keyboard.press("Escape"); await pageTouch.waitForTimeout(300);
ok(await pageTouch.locator("#view-player").isVisible() && !(await dlgAberto()),
  "Dentro da cifra o aviso de saída NÃO aparece (o voltar é da navegação)");
await pageTouch.goBack(); await pageTouch.waitForTimeout(400);
ok(await pageTouch.locator("#view-lib").isVisible() && !(await dlgAberto()),
  "Voltar da cifra cai na lista sem aviso prematuro (mesmo no celular)");
await pageTouch.keyboard.press("Escape"); await pageTouch.waitForTimeout(300);
ok(await dlgAberto(), "De volta à lista, o watcher rearma e o próximo voltar avisa");
await ctxTouch.close();

ok(navErrors.length === 0, "Voltar: nenhum erro de JS no fluxo de navegação" + (navErrors.length ? ": " + navErrors.join(" | ") : ""));
await ctxNav.close();

// ===== v0.59.0 — excluir cifra/escala: deslize → ações → confirmação → desfazer =====
// Gesto REAL (pointer events + medição do render), nunca `settings` ou chamada de função por dentro.
const ctxDel = await browser.newContext({ viewport: { width: 412, height: 915 }, hasTouch: true });
const pageDel = await ctxDel.newPage();
const delErrors = [];
pageDel.on("pageerror", e => delErrors.push(e.message));
await pageDel.addInitScript(() => {
  localStorage.setItem("louvai.settings.v1", JSON.stringify({ theme: "dark", seeded: true, swipeHintSeen: true }));
  localStorage.setItem("louvai.songs.v1", JSON.stringify([
    { id: "d1", title: "Alfa", artist: "A", key: "C", capo: 0, tags: [], updatedAt: 1, body: "[Intro]\nC G\nletra" },
    { id: "d2", title: "Beta", artist: "B", key: "D", capo: 0, tags: [], updatedAt: 1, body: "[Intro]\nD A\nletra" }]));
  localStorage.setItem("louvai.escalas.v1", JSON.stringify([
    { id: "ed1", title: "Culto Domingo", date: "2026-07-12", items: [{ kind: "song", songId: "d1" }], updatedAt: 1 }]));
});
await pageDel.goto(APP_URL); await pageDel.waitForTimeout(400);

const listaSelDel = "#songlist .swipewrap";
// deslocamento REAL do card dentro do wrapper (não o estado lógico): é o que o usuário vê
const deslocDel = (lista, i) => pageDel.evaluate(([lista, i]) => {
  const w = document.querySelectorAll(lista)[i];
  const c = w.querySelector(".songcard,.escard,.orow");
  return Math.round(c.getBoundingClientRect().x - w.getBoundingClientRect().x);
}, [lista, i]);
async function arrastaDel(lista, i, dx, dy) {
  // traz a linha p/ a viewport ANTES do gesto: o clique seguinte no botão rolaria a página,
  // e rolar recolhe a faixa (comportamento do app) — o botão nunca chegaria a ficar visível
  await pageDel.locator(lista).nth(i).scrollIntoViewIfNeeded();
  await pageDel.waitForTimeout(120);
  const b = await pageDel.locator(lista).nth(i).boundingBox();
  const x0 = b.x + b.width - 24, y0 = b.y + b.height / 2;
  await pageDel.mouse.move(x0, y0);
  await pageDel.mouse.down();
  await pageDel.mouse.move(x0 + dx * .35, y0 + dy * .35, { steps: 3 });
  await pageDel.mouse.move(x0 + dx, y0 + dy, { steps: 6 });
  await pageDel.mouse.up();
  await pageDel.waitForTimeout(330);
}
async function seguraDedoDel(lista, i, ms) {
  const b = await pageDel.locator(lista).nth(i).boundingBox();
  await pageDel.mouse.move(b.x + b.width - 24, b.y + b.height / 2);
  await pageDel.mouse.down();
  await pageDel.waitForTimeout(ms);
  await pageDel.mouse.up();
  await pageDel.waitForTimeout(330);
}

// (a) o deslize revela a faixa — medindo a geometria, não a classe
await arrastaDel(listaSelDel, 0, -160, 0);
const dAbertoDel = await deslocDel(listaSelDel, 0);
ok(dAbertoDel <= -140 && dAbertoDel >= -150, `Deslizar o card revela a faixa de ações (deslocamento medido: ${dAbertoDel}px)`);
const alvoDel = await pageDel.evaluate(() => {
  const b = document.querySelector("#songlist .swipewrap .sa-del").getBoundingClientRect();
  const dup = document.querySelector("#songlist .swipewrap .sa-dup").getBoundingClientRect();
  return { w: Math.round(b.width), h: Math.round(b.height), visivel: b.width > 0 && b.right <= innerWidth + 1, dupW: Math.round(dup.width) };
});
ok(alvoDel.w >= 44 && alvoDel.h >= 44 && alvoDel.dupW >= 44 && alvoDel.visivel,
  `Alvos de toque grandes e dentro da tela (Excluir ${alvoDel.w}×${alvoDel.h}, Duplicar ${alvoDel.dupW})`);

// (b) tocar no card aberto FECHA e não abre a cifra
await pageDel.locator(`${listaSelDel} .songcard`).first().click();
await pageDel.waitForTimeout(320);
ok(await deslocDel(listaSelDel, 0) === 0 && await pageDel.locator("#view-lib").isVisible(),
  "Card aberto: o toque no corpo recolhe a faixa e NÃO abre a cifra");

// (c) arraste curto volta com mola
await arrastaDel(listaSelDel, 0, -30, 0);
ok(await deslocDel(listaSelDel, 0) === 0, "Arraste curto volta sozinho (não abre a faixa)");

// (d) rolagem vertical não abre a faixa (a regressão que mataria a lista)
await arrastaDel(listaSelDel, 0, -18, -120);
ok(await deslocDel(listaSelDel, 0) === 0, "Arrasto vertical é rolagem: a faixa NÃO abre");

// (e) toque e segure = caminho sem gesto
await seguraDedoDel(listaSelDel, 1, 620);
ok(await deslocDel(listaSelDel, 1) <= -140 && await pageDel.locator("#view-lib").isVisible(),
  "Toque e segure abre a faixa (caminho sem gesto) sem abrir a cifra");

// (f) só um card aberto por vez
await arrastaDel(listaSelDel, 0, -160, 0);
ok(await deslocDel(listaSelDel, 0) <= -140 && await deslocDel(listaSelDel, 1) === 0,
  "Abrir um card recolhe o outro (um aberto por vez)");

// (g) Excluir → confirmação com o contexto real (em quais escalas a cifra está)
await pageDel.locator(`${listaSelDel} .sa-del`).first().click();
await pageDel.waitForTimeout(330);
const confDel = await pageDel.evaluate(() => ({
  aberto: document.getElementById("confirmdlg").classList.contains("show"),
  titulo: document.getElementById("confirm-title").textContent,
  sub: document.getElementById("confirm-sub").textContent,
  papel: document.getElementById("confirmdlg").getAttribute("role"),
  foco: document.activeElement && document.activeElement.id,
  ok: document.getElementById("confirm-ok").textContent,
}));
ok(confDel.aberto && /Excluir “Alfa”\?/.test(confDel.titulo), "Excluir abre a confirmação do app (não o confirm() do navegador)");
ok(/Está em 1 escala: Culto Domingo/.test(confDel.sub) && /ordem do culto/.test(confDel.sub),
  "A confirmação diz em quais escalas a cifra está");
ok(confDel.papel === "dialog" && confDel.foco === "confirm-cancel" && confDel.ok === "Excluir",
  "Diálogo acessível e com o foco no Cancelar (ação destrutiva não recebe foco)");

// (h) o voltar do celular CANCELA (e não dispara "Sair do Louvai?")
await pageDel.goBack(); await pageDel.waitForTimeout(400);
const aposVoltarDel = await pageDel.evaluate(() => ({
  confDel: document.getElementById("confirmdlg").classList.contains("show"),
  saida: !document.getElementById("exitdlg").classList.contains("hidden"),
  temAlfa: songs.some(s => s.id === "d1"),
}));
ok(!aposVoltarDel.confDel && !aposVoltarDel.saida && aposVoltarDel.temAlfa,
  "O voltar do celular CANCELA a exclusão (sem abrir o aviso de saída e sem excluir nada)");

// (i) Cancelar mantém a cifra
await arrastaDel(listaSelDel, 0, -160, 0);
await pageDel.locator(`${listaSelDel} .sa-del`).first().click(); await pageDel.waitForTimeout(300);
await pageDel.locator("#confirm-cancel").click(); await pageDel.waitForTimeout(350);
ok(await pageDel.evaluate(() => songs.length === 2 && !document.getElementById("confirmdlg").classList.contains("show")),
  "Cancelar fecha o diálogo e mantém a cifra");

// (j) excluir de verdade: some da lista, do localStorage — e o DESFAZER traz de volta
await arrastaDel(listaSelDel, 0, -160, 0);
await pageDel.locator(`${listaSelDel} .sa-del`).first().click(); await pageDel.waitForTimeout(300);
await pageDel.locator("#confirm-ok").click(); await pageDel.waitForTimeout(400);
const excluidaDel = await pageDel.evaluate(() => ({
  mem: songs.some(s => s.id === "d1"),
  disco: (JSON.parse(localStorage.getItem("louvai.songs.v1")) || []).some(s => s.id === "d1"),
  naTela: [...document.querySelectorAll("#songlist .c-ttl")].map(e => e.textContent),
  desfazer: !!document.querySelector("#toast .toastact"),
}));
ok(!excluidaDel.mem && !excluidaDel.disco && !excluidaDel.naTela.includes("Alfa"),
  "Excluir tira a cifra da memória, do armazenamento e da lista");
ok(excluidaDel.desfazer, "Depois de excluir aparece o DESFAZER no toast");
await pageDel.locator("#toast .toastact").click(); await pageDel.waitForTimeout(350);
const restauradaDel = await pageDel.evaluate(() => ({
  mem: songs.some(s => s.id === "d1"),
  disco: (JSON.parse(localStorage.getItem("louvai.songs.v1")) || []).some(s => s.id === "d1"),
  naTela: [...document.querySelectorAll("#songlist .c-ttl")].map(e => e.textContent),
}));
ok(restauradaDel.mem && restauradaDel.disco && restauradaDel.naTela.includes("Alfa"),
  "DESFAZER restaura a cifra inteira (memória, armazenamento e lista)");

// (k) Duplicar pela mesma faixa
await arrastaDel(listaSelDel, 0, -160, 0);
await pageDel.locator(`${listaSelDel} .sa-dup`).first().click(); await pageDel.waitForTimeout(350);
ok(await pageDel.evaluate(() => songs.filter(s => /^Alfa/.test(s.title)).length === 2),
  "A faixa também duplica (Duplicar · Excluir)");
await pageDel.evaluate(() => { songs = songs.filter(s => s.title !== "Alfa (cópia)"); saveSongs(); renderLibrary(); });

// (l) regressão: Compartilhar → Excluir → Cancelar NÃO pode largar a pessoa no editor
await pageDel.locator(`${listaSelDel} .songcard`).first().click(); await pageDel.waitForTimeout(350);
await pageDel.locator("#p-settings").click(); await pageDel.waitForTimeout(300);
await pageDel.locator("#p-share").click(); await pageDel.waitForTimeout(350);
await pageDel.locator("#sheet-body .sheetitem.danger").click(); await pageDel.waitForTimeout(350);
const viaFolhaDel = await pageDel.evaluate(() => ({
  confDel: document.getElementById("confirmdlg").classList.contains("show"),
  titulo: document.getElementById("confirm-title").textContent,
}));
ok(viaFolhaDel.confDel && /Alfa/.test(viaFolhaDel.titulo), "Compartilhar → Excluir abre a MESMA confirmação");
await pageDel.locator("#confirm-cancel").click(); await pageDel.waitForTimeout(400);
ok(await pageDel.evaluate(() => view), "Cancelar devolve a pessoa à tela de origem");
ok(await pageDel.evaluate(() => view === "player") && !(await pageDel.locator("#view-editor").isVisible()),
  "Cancelar pela folha NÃO larga a pessoa dentro do editor (regressão do caminho antigo)");

// (m) excluir a cifra ABERTA no player sai para a lista
await pageDel.locator("#p-settings").click(); await pageDel.waitForTimeout(250);
await pageDel.locator("#p-share").click(); await pageDel.waitForTimeout(300);
await pageDel.locator("#sheet-body .sheetitem.danger").click(); await pageDel.waitForTimeout(300);
await pageDel.locator("#confirm-ok").click(); await pageDel.waitForTimeout(450);
ok(await pageDel.evaluate(() => view === "lib" && !songs.some(s => s.id === "d1")),
  "Excluir a cifra aberta no player devolve a pessoa à lista");
await pageDel.locator("#toast .toastact").click(); await pageDel.waitForTimeout(300);

// (n) escala: mesma faixa, mensagem própria, exclusão e desfazer
await pageDel.locator("#tab-escalas").click(); await pageDel.waitForTimeout(350);
const escSelDel = "#escalalist .swipewrap";
await arrastaDel(escSelDel, 0, -160, 0);
const dEscDel = await pageDel.evaluate(() => {
  const w = document.querySelector("#escalalist .swipewrap"), c = w.querySelector(".escard");
  return Math.round(c.getBoundingClientRect().x - w.getBoundingClientRect().x);
});
ok(dEscDel <= -140, `A lista de escalas tem a mesma faixa (deslocamento ${dEscDel}px)`);
await pageDel.locator(`${escSelDel} .sa-del`).first().click(); await pageDel.waitForTimeout(330);
ok(await pageDel.evaluate(() => /não apaga as cifras/.test(document.getElementById("confirm-sub").textContent)),
  "A confirmação da escala tranquiliza: excluir a escala não apaga as cifras");
await pageDel.locator("#confirm-ok").click(); await pageDel.waitForTimeout(400);
ok(await pageDel.evaluate(() => escalas.length === 0 && songs.length === 2),
  "Excluir a escala não leva as cifras junto");
await pageDel.locator("#toast .toastact").click(); await pageDel.waitForTimeout(350);
ok(await pageDel.evaluate(() => escalas.length === 1 && escalas[0].id === "ed1"),
  "DESFAZER restaura a escala");

// ===== v0.60.0 — lápides: a exclusão vale para a equipe (e o sync não a desfaz) =====
// O caminho REAL: excluir pelo gesto → tocar "Atualizar do link" com a nuvem ainda tendo a cifra.
await pageDel.evaluate(() => {
  deleted.length = 0; saveDeleted();
  window.__real = window.fetch;
  window.__snap = { type: "louvai-full", app: "0.60.0",
    songs: JSON.parse(JSON.stringify(songs)), escalas: JSON.parse(JSON.stringify(escalas)) };
  window.fetch = async () => ({ ok: true, status: 200, text: async () => JSON.stringify(window.__snap) });
  settings.repoUrl = "https://louvai-teste.example/louvai.json"; saveSettings();   // host não-GitHub: fetch direto
});
await pageDel.locator("#tab-songs").click(); await pageDel.waitForTimeout(300);
await arrastaDel(listaSelDel, 1, -160, 0);
await pageDel.locator(`${listaSelDel} .sa-del`).nth(1).click(); await pageDel.waitForTimeout(300);
await pageDel.locator("#confirm-ok").click(); await pageDel.waitForTimeout(400);
const marcou = await pageDel.evaluate(() => ({
  lapide: deleted.find(t => t.id === "d2"),
  sumiu: !songs.some(s => s.id === "d2"),
  nota: document.getElementById("confirm-sub") && true,
}));
ok(marcou.sumiu && marcou.lapide && marcou.lapide.k === "s" && marcou.lapide.at > 0,
  "Excluir deixa uma lápide enxuta {id,k,at} — e só ela (o objeto sai de verdade)");
// o caminho REAL de sincronizar (v0.64.0: o 1º item da folha já baixa), com a nuvem ainda
// trazendo a cifra excluída
await pageDel.locator("#backupBtn").click(); await pageDel.waitForTimeout(300);
await pageDel.locator("#sheet-body .sheetitem", { hasText: "Atualizar do repertório" }).click();
await pageDel.waitForTimeout(700);
ok(await pageDel.evaluate(() => !songs.some(s => s.id === "d2")),
  "Sincronizar NÃO ressuscita a cifra excluída (o furo que tornaria a exclusão mentirosa)");
await pageDel.waitForTimeout(200);

// a lápide que CHEGA remove aqui — é assim que a exclusão do líder some do celular da equipe
const chegando = await pageDel.evaluate(() => {
  songs.length = 0; escalas.length = 0; deleted.length = 0;
  songs.push({ id: "x1", title: "Some", key: "C", capo: 0, tags: [], updatedAt: 100, body: "C" });
  songs.push({ id: "x2", title: "Editada Depois", key: "C", capo: 0, tags: [], updatedAt: 900, body: "C" });
  escalas.push({ id: "xe1", title: "Escala Velha", date: "2026-01-01", items: [], updatedAt: 100 });
  saveSongs(); saveEscalas(); saveDeleted();
  importJSON(JSON.stringify({ type: "louvai-full", songs: [], escalas: [],
    deleted: [{ id: "x1", k: "s", at: 500 }, { id: "x2", k: "s", at: 500 }, { id: "xe1", k: "e", at: 500 }] }),
    { silent: true, sync: true });
  return { foi: !songs.some(s => s.id === "x1"), ficou: songs.some(s => s.id === "x2"),
           esc: !escalas.some(e => e.id === "xe1"),
           marcaDoX2: deleted.some(t => t.id === "x2") };
});
ok(chegando.foi && chegando.esc, "A lápide que chega da nuvem remove a cifra e a escala daqui");
ok(chegando.ficou && !chegando.marcaDoX2,
  "Item editado DEPOIS da exclusão sobrevive (não se apaga trabalho recente) e a lápide é descartada");

// importação explícita (arquivo/link) vence a lápide — o gesto do usuário manda
const explicita = await pageDel.evaluate(() => {
  songs.length = 0; deleted.length = 0; saveSongs(); saveDeleted();
  const cifra = { id: "y1", title: "Quero De Volta", key: "C", capo: 0, tags: [], updatedAt: 10, body: "C" };
  tomb("y1", "s", 50);                                          // excluída aqui DEPOIS da versão que vai chegar
  importJSON(JSON.stringify({ type: "louvai-full", songs: [cifra], escalas: [] }), { silent: true, sync: true });
  const bloqueou = !songs.some(s => s.id === "y1");
  importJSON(JSON.stringify({ type: "louvai-song", song: cifra }));   // arquivo/link: gesto explícito
  return { bloqueou, voltou: songs.some(s => s.id === "y1"), semMarca: !deleted.some(t => t.id === "y1") };
});
ok(explicita.bloqueou, "No sync, a lápide barra a versão antiga que insiste em voltar");
ok(explicita.voltou && explicita.semMarca,
  "Importar por arquivo/link VENCE a lápide (o gesto explícito manda) e apaga a marca");

// o snapshot publicado leva as marcas — e nenhum registro morto
const snapshot = await pageDel.evaluate(() => {
  songs.length = 0; escalas.length = 0; deleted.length = 0;
  songs.push({ id: "z1", title: "Fica", key: "C", capo: 0, tags: [], updatedAt: 1, body: "C" });
  saveSongs(); saveEscalas();
  tomb("z9", "s", Date.now());
  const env = fullEnvelope();
  return { temDeleted: Array.isArray(env.deleted) && env.deleted.length === 1,
           campos: Object.keys(env.deleted[0]).sort().join(","),
           semCorpo: !env.songs.some(s => s.id === "z9"),
           bytes: JSON.stringify(env.deleted).length };
});
ok(snapshot.temDeleted && snapshot.campos === "at,id,k" && snapshot.semCorpo,
  `O snapshot leva só a marca {at,id,k} — o objeto foi apagado de verdade (${snapshot.bytes} bytes)`);

// poda: por idade (180 dias) e por teto (500)
const poda = await pageDel.evaluate(() => {
  deleted.length = 0;
  deleted.push({ id: "velha", k: "s", at: Date.now() - 200 * 864e5 });
  deleted.push({ id: "nova", k: "s", at: Date.now() - 10 * 864e5 });
  purgeTombstones();
  const porIdade = !deleted.some(t => t.id === "velha") && deleted.some(t => t.id === "nova");
  deleted.length = 0;
  for (let i = 0; i < 620; i++) deleted.push({ id: "m" + i, k: "s", at: Date.now() - i * 1000 });
  purgeTombstones();
  return { porIdade, teto: deleted.length, guardouRecentes: deleted.some(t => t.id === "m0") && !deleted.some(t => t.id === "m600") };
});
ok(poda.porIdade, "Poda por idade: marca com mais de 180 dias some (não floodar o arquivo)");
ok(poda.teto === 500 && poda.guardouRecentes, `Teto duro de 500 marcas, mantendo as mais recentes (ficaram ${poda.teto})`);

// desfazer retira a lápide (senão o sync nunca mais traria a música de volta)
const desfazTomb = await pageDel.evaluate(() => {
  songs.length = 0; escalas.length = 0; deleted.length = 0;
  songs.push({ id: "u1", title: "Undo", key: "C", capo: 0, tags: [], updatedAt: 1, body: "C" });
  saveSongs(); saveDeleted(); renderLibrary();
  doDeleteSong("u1");
  const marcada = deleted.some(t => t.id === "u1");
  document.querySelector("#toast .toastact").click();
  return { marcada, semMarca: !deleted.some(t => t.id === "u1"), voltou: songs.some(s => s.id === "u1") };
});
ok(desfazTomb.marcada && desfazTomb.semMarca && desfazTomb.voltou,
  "DESFAZER retira a lápide junto (senão a cifra ficaria banida do sync)");

// a confirmação agora conta a verdade nova
await pageDel.evaluate(() => { deleted.length = 0; saveDeleted(); renderLibrary(); });
await arrastaDel(listaSelDel, 0, -160, 0);
await pageDel.locator(`${listaSelDel} .sa-del`).first().click(); await pageDel.waitForTimeout(300);
ok(await pageDel.evaluate(() => /Não volta ao sincronizar/.test(document.getElementById("confirm-sub").textContent)),
  "A confirmação diz o que passou a ser verdade: a exclusão não volta ao sincronizar");
await pageDel.locator("#confirm-cancel").click(); await pageDel.waitForTimeout(300);
await pageDel.evaluate(() => { if (window.__real) window.fetch = window.__real; });

// ===== v0.61.0 — tirar a música da ORDEM DO CULTO pelo mesmo gesto (dentro da escala) =====
await pageDel.evaluate(() => {
  songs.length = 0; escalas.length = 0; deleted.length = 0;
  songs.push({ id: "o1", title: "Primeira", key: "C", capo: 0, tags: [], updatedAt: 1, body: "[Intro]\nC\nletra" });
  songs.push({ id: "o2", title: "Segunda", key: "D", capo: 0, tags: [], updatedAt: 1, body: "[Intro]\nD\nletra" });
  escalas.push({ id: "oe", title: "Culto de Teste", date: "2026-07-12", time: "", type: "Culto", team: [], notes: "",
    items: [{ kind: "song", songId: "o1", key: "", capo: 0 },
            { kind: "song", songId: "o2", key: "", capo: 0 },
            { kind: "item", title: "Avisos" }], updatedAt: 1 });
  saveSongs(); saveEscalas(); renderLibrary(); renderEscalas();
});
// caminho real: aba Escalas → abrir a escala → deslizar a 2ª linha da ordem
await pageDel.locator("#tab-escalas").click(); await pageDel.waitForTimeout(300);
await pageDel.locator("#escalalist .escard").first().click(); await pageDel.waitForTimeout(400);
ok(await pageDel.locator("#view-escala").isVisible() && await pageDel.locator("#es-order .swipewrap").count() === 3,
  "A ordem do culto monta as linhas dentro da faixa deslizante");
const ordemSel = "#es-order .swipewrap";
await arrastaDel(ordemSel, 1, -160, 0);
const dOrdem = await pageDel.evaluate(() => {
  const w = document.querySelectorAll("#es-order .swipewrap")[1], r = w.querySelector(".orow");
  const bt = w.querySelector(".sa-del").getBoundingClientRect();
  return { desloc: Math.round(r.getBoundingClientRect().x - w.getBoundingClientRect().x),
           rotulo: w.querySelector(".sa-del").textContent.trim(), alvo: Math.round(bt.height) };
});
ok(dOrdem.desloc <= -140 && dOrdem.rotulo === "Tirar" && dOrdem.alvo >= 44,
  `Deslizar a música na escala revela "Tirar" (deslocamento ${dOrdem.desloc}px, alvo ${dOrdem.alvo}px)`);

// confirmação própria: aqui a cifra NÃO se perde
await pageDel.locator(`${ordemSel} .sa-del`).nth(1).click(); await pageDel.waitForTimeout(330);
const confOrdem = await pageDel.evaluate(() => ({
  titulo: document.getElementById("confirm-title").textContent,
  sub: document.getElementById("confirm-sub").textContent,
  ok: document.getElementById("confirm-ok").textContent,
}));
ok(/Tirar “Segunda” da escala\?/.test(confOrdem.titulo) && /A cifra continua no repertório/.test(confOrdem.sub) && confOrdem.ok === "Tirar",
  "Confirmação da ordem: fala em TIRAR da escala e tranquiliza que a cifra fica no repertório");

// cancelar não mexe na ordem
await pageDel.locator("#confirm-cancel").click(); await pageDel.waitForTimeout(350);
ok(await pageDel.evaluate(() => escalas[0].items.length === 3),
  "Cancelar mantém a ordem do culto intacta");

// tirar de verdade: sai da ordem, a cifra fica no repertório e a escala salva na hora
await arrastaDel(ordemSel, 1, -160, 0);
await pageDel.locator(`${ordemSel} .sa-del`).nth(1).click(); await pageDel.waitForTimeout(300);
await pageDel.locator("#confirm-ok").click(); await pageDel.waitForTimeout(450);
const tirou = await pageDel.evaluate(() => ({
  itens: escalas[0].items.map(it => it.kind === "song" ? it.songId : it.title),
  disco: JSON.parse(localStorage.getItem("louvai.escalas.v1"))[0].items.length,
  cifraFicou: songs.some(s => s.id === "o2"),
  naTela: [...document.querySelectorAll("#es-order .ot")].map(e => e.textContent),
  desfazer: !!document.querySelector("#toast .toastact"),
  naEscala: document.getElementById("view-escala").classList.contains("hidden") === false,
}));
ok(tirou.itens.length === 2 && !tirou.itens.includes("o2") && tirou.disco === 2,
  "Tirar remove o item da ordem e salva na hora (como o 'Culto realizado')");
ok(tirou.cifraFicou && !tirou.naTela.includes("Segunda") && tirou.naEscala,
  "A cifra continua no repertório e a pessoa segue na escala (a tela só se atualiza)");
ok(tirou.desfazer, "Aparece o DESFAZER");

// desfazer devolve na MESMA posição da ordem (não no fim)
await pageDel.locator("#toast .toastact").click(); await pageDel.waitForTimeout(400);
ok(await pageDel.evaluate(() => escalas[0].items.length === 3 && escalas[0].items[1].songId === "o2"),
  "DESFAZER devolve a música na mesma posição da ordem do culto");

// item não-musical (Avisos, Oração) usa a mesma faixa, com o texto certo
await arrastaDel(ordemSel, 2, -160, 0);
await pageDel.locator(`${ordemSel} .sa-del`).nth(2).click(); await pageDel.waitForTimeout(330);
ok(await pageDel.evaluate(() => /Tirar “Avisos” da escala\?/.test(document.getElementById("confirm-title").textContent)
    && !/repertório/.test(document.getElementById("confirm-sub").textContent)),
  "Item não-musical (Avisos) usa a mesma faixa — sem falar em repertório");
await pageDel.locator("#confirm-cancel").click(); await pageDel.waitForTimeout(350);

// o toque na linha continua abrindo a Apresentação (o gesto não roubou o clique)
await pageDel.locator("#es-order .orow").first().click(); await pageDel.waitForTimeout(450);
ok(await pageDel.locator("#view-player").isVisible() && await pageDel.evaluate(() => !!escalaCtx),
  "Tocar na linha continua abrindo a Apresentação (o deslize não roubou o toque)");
await pageDel.evaluate(() => exitPlayer()); await pageDel.waitForTimeout(350);

// ===== v0.62.0 — voltar do editor NÃO pode sair da Apresentação =====
// Sintoma de campo: no culto, mexer no Tom pelo ⚙ (onde ele mora na Apresentação), tocar em
// Editar e voltar matava o contexto da escala. A pessoa só percebia depois, ao tocar para virar
// a página e o "livro" não trocar mais de música.
await pageDel.evaluate(() => {
  songs.length = 0; escalas.length = 0; deleted.length = 0;
  songs.push({ id: "a1", title: "Abertura", key: "C", capo: 0, tags: [], updatedAt: 1, body: "[Intro]\nC G\nletra um" });
  songs.push({ id: "a2", title: "Adoração", key: "D", capo: 0, tags: [], updatedAt: 1, body: "[Intro]\nD A\nletra dois" });
  escalas.push({ id: "ae", title: "Culto da noite", date: "2026-09-13", team: [], items: [
    { kind: "song", songId: "a1" }, { kind: "song", songId: "a2" }], updatedAt: 1 });
  saveSongs(); saveEscalas(); show("lib"); switchTab("escalas"); renderEscalas();
});
await pageDel.waitForTimeout(300);
await pageDel.locator("#escalalist .escard").first().click(); await pageDel.waitForTimeout(400);
await pageDel.locator("#es-present").click(); await pageDel.waitForTimeout(500);
const naApresentacao = () => pageDel.evaluate(() => ({
  view, present: document.getElementById("view-player").classList.contains("present"),
  ctx: !!escalaCtx, idx: escalaCtx ? escalaCtx.idx : null,
  pos: document.getElementById("pv-pos").textContent,
  barra: !document.getElementById("presentbar").classList.contains("hidden"),
}));
ok((await naApresentacao()).present, "Apresentação aberta pelo caminho real (Escalas → escala → Apresentar)");

// ⚙ → Editar → Cancelar
await pageDel.locator("#pv-settings").click(); await pageDel.waitForTimeout(350);
await pageDel.locator("#p-edit").click(); await pageDel.waitForTimeout(450);
ok(await pageDel.evaluate(() => view === "editor"), "Do ⚙ da Apresentação dá pra editar a cifra");
await pageDel.locator("#e-cancel").click(); await pageDel.waitForTimeout(550);
const posCancel = await naApresentacao();
ok(posCancel.view === "player" && posCancel.present && posCancel.ctx && posCancel.barra && /1 de 2/.test(posCancel.pos),
  `Cancelar a edição volta para a APRESENTAÇÃO, não para o player solto (posição: "${posCancel.pos}")`);
// prova funcional: o "livro"/setas continuam vivos
await pageDel.locator("#pv-next").click(); await pageDel.waitForTimeout(450);
ok(await pageDel.evaluate(() => escalaCtx && escalaCtx.idx === 1 && current.id === "a2"),
  "Depois de voltar do editor, trocar de música na Apresentação ainda funciona");

// ⚙ → Editar → Salvar (sobrescrever)
await pageDel.locator("#pv-settings").click(); await pageDel.waitForTimeout(350);
await pageDel.locator("#p-edit").click(); await pageDel.waitForTimeout(450);
await pageDel.locator("#e-save").click(); await pageDel.waitForTimeout(650);
const posSave = await naApresentacao();
ok(posSave.view === "player" && posSave.present && posSave.ctx && posSave.idx === 1,
  "Salvar a edição também devolve à Apresentação, na música certa do culto");

// música NOVA não está no culto: abre como cifra avulsa (deliberado)
const nova = await pageDel.evaluate(() => {
  const ctxAntes = !!escalaCtx;
  const inventada = cloneSong(songs[0], { title: "Fora do culto" });
  songs.push(inventada); saveSongs();
  openPlayer(inventada.id, playerCtxFor(inventada.id));
  return { ctxAntes, ctxDepois: !!escalaCtx, view };
});
ok(nova.ctxAntes && !nova.ctxDepois && nova.view === "player",
  "Cifra que não está na escala abre fora da Apresentação (playerCtxFor devolve null)");

// ===== v0.62.0 — o logo leva para a home (lista de cifras) =====
await pageDel.evaluate(() => { exitPlayer(); });
await pageDel.waitForTimeout(350);
await pageDel.evaluate(() => { switchTab("escalas"); $("#search").value = "zzz"; activeTag = "qualquer"; });
await pageDel.waitForTimeout(200);
const logo = await pageDel.evaluate(() => {
  const b = document.getElementById("homeBtn");
  const st = getComputedStyle(b);
  return { existe: !!b, papel: b.getAttribute("role"), rotulo: b.getAttribute("aria-label"),
           semSelecao: st.userSelect === "none" || st.webkitUserSelect === "none",
           alvo: Math.round(b.getBoundingClientRect().height) };
});
ok(logo.existe && logo.papel === "button" && /cifras/i.test(logo.rotulo || "") && logo.alvo >= 28,
  "O logo é um botão de verdade (role + rótulo), não um texto solto");
ok(logo.semSelecao, "Tocar no logo não seleciona o texto (fim da 'área selecionada' no celular)");
await pageDel.locator("#homeBtn").click(); await pageDel.waitForTimeout(450);
const depoisLogo = await pageDel.evaluate(() => ({
  aba: document.getElementById("pane-songs").classList.contains("hidden") ? "escalas" : "songs",
  busca: $("#search").value, tag: activeTag, view,
  cards: document.querySelectorAll("#songlist .swipewrap").length,
}));
ok(depoisLogo.aba === "songs" && depoisLogo.view === "lib" && depoisLogo.cards > 0,
  "Tocar no logo volta para a lista de cifras");
ok(depoisLogo.busca === "" && !depoisLogo.tag,
  "O logo limpa a busca e a tag ativa (volta para a casa mesmo, não para um filtro)");

// ===== v0.62.1 — o "livro" em TELA CHEIA não pode sair da tela cheia ao trocar de música =====
// Reporte de campo: na última página de uma música, o toque que deveria levar à primeira página da
// próxima tirava da tela cheia. A troca de música reabre a MESMA tela (player) e o "voltar até a
// tela" derrubava a camada da tela cheia que estava por cima.
await pageDel.evaluate(() => {
  const corpo = n => "[Intro]\n" + Array.from({ length: 45 }, (_, i) => "C           G\nlinha " + i + " da musica " + n).join("\n");
  songs.length = 0; escalas.length = 0;
  songs.push({ id: "f1", title: "Livro Um", key: "C", capo: 0, tags: [], updatedAt: 1, body: corpo(1) });
  songs.push({ id: "f2", title: "Livro Dois", key: "D", capo: 0, tags: [], updatedAt: 1, body: corpo(2) });
  escalas.push({ id: "fe", title: "Culto tela cheia", date: "2026-09-13", team: [], items: [
    { kind: "song", songId: "f1" }, { kind: "song", songId: "f2" }], updatedAt: 1 });
  settings.readMode = "page"; saveSettings(); saveSongs(); saveEscalas();
  show("lib"); switchTab("escalas"); renderEscalas();
});
await pageDel.waitForTimeout(300);
await pageDel.locator("#escalalist .escard").first().click(); await pageDel.waitForTimeout(400);
await pageDel.locator("#es-present").click(); await pageDel.waitForTimeout(600);
await pageDel.locator("#pv-full").click(); await pageDel.waitForTimeout(600);
const cheia = () => pageDel.evaluate(() => ({
  immersive: document.getElementById("view-player").classList.contains("immersive"),
  idx: escalaCtx ? escalaCtx.idx : null, pag: +document.getElementById("p-body").dataset.page,
  pags: pageCount(), stack: navStack.map(e => e.t + ":" + (e.id || "")).join(">"),
}));
const antesLivro = await cheia();
ok(antesLivro.immersive && antesLivro.pags > 1 && /full/.test(antesLivro.stack),
  `Tela cheia ligada na Apresentação, no Modo Página (${antesLivro.pags} páginas)`);
// toca até a última página — sem sair da tela cheia no caminho
for (let i = 0; i < 12; i++) {
  const e = await pageDel.evaluate(() => ({ p: +document.getElementById("p-body").dataset.page, n: pageCount() }));
  if (e.p >= e.n - 1) break;
  await pageDel.touchscreen.tap(340, 500); await pageDel.waitForTimeout(320);
}
const naUltima = await cheia();
ok(naUltima.immersive && naUltima.pag === naUltima.pags - 1 && naUltima.idx === 0,
  "Virar páginas dentro da música mantém a tela cheia");
// o toque decisivo: última página → próxima música
await pageDel.touchscreen.tap(340, 500); await pageDel.waitForTimeout(700);
const depoisLivro = await cheia();
ok(depoisLivro.idx === 1 && depoisLivro.pag === 0, "O 'livro' passa para a primeira página da próxima música");
ok(depoisLivro.immersive && /full/.test(depoisLivro.stack),
  "…e CONTINUA em tela cheia (a troca de música não derruba a camada da tela cheia)");
// (em tela cheia a barra fica SEM botões — de propósito: ali só o "livro" troca de música)
// e o voltar do celular ainda sai da tela cheia: a camada continua na pilha, não vazou
await pageDel.goBack(); await pageDel.waitForTimeout(550);
const aposVoltarCheia = await cheia();
ok(!aposVoltarCheia.immersive && aposVoltarCheia.idx === 1 && await pageDel.locator("#view-player").isVisible(),
  "O voltar do celular continua saindo da tela cheia e mantendo a Apresentação (a camada não vazou)");
// e a Apresentação segue viva: a seta › troca de música normalmente
await pageDel.locator("#pv-prev").click(); await pageDel.waitForTimeout(500);
ok(await pageDel.evaluate(() => escalaCtx && escalaCtx.idx === 0),
  "Fora da tela cheia, as setas da barra seguem trocando de música");
await pageDel.evaluate(() => exitPlayer()); await pageDel.waitForTimeout(350);
await pageDel.evaluate(() => { show("lib"); switchTab("songs"); renderLibrary(); }); await pageDel.waitForTimeout(300);

// ===== v0.63.0 — o topo perdeu o botão redundante de importar (a ação mora na folha) =====
await pageDel.evaluate(() => { show("lib"); switchTab("songs"); renderLibrary(); });
await pageDel.waitForTimeout(300);
const topo = await pageDel.evaluate(() => ({
  importBtn: !!document.getElementById("importBtn"),
  botoes: [...document.querySelectorAll("#view-lib .topbar .iconbtn")].map(b => b.id),
  rotulo: document.getElementById("backupBtn").getAttribute("aria-label") || "",
}));
ok(!topo.importBtn && topo.botoes.length === 2 && topo.botoes.join(",") === "themeBtn,backupBtn",
  `O topo ficou com dois botões, um por assunto: aparência e dados (${topo.botoes.join(" · ")})`);
ok(/importar/i.test(topo.rotulo) && /nuvem/i.test(topo.rotulo),
  "O botão que ficou anuncia que também importa arquivo (leitor de tela)");

await pageDel.locator("#backupBtn").click(); await pageDel.waitForTimeout(400);
const folha = await pageDel.evaluate(() => ({
  titulo: document.getElementById("sheet-title").textContent,
  itens: [...document.querySelectorAll("#sheet-body .sheetitem")].map(e => e.textContent.trim()),
}));
ok(/atualizar/i.test(folha.itens[0] || "") && /nuvem/i.test(folha.itens[1] || ""),
  `A folha começa pelo dia a dia: "${folha.itens[0]}" (configurar a nuvem vem depois)`);
ok(folha.itens.length === 5 && /arquivo/i.test(folha.itens[4] || ""),
  "Importar/restaurar de arquivo é o último item (uso raro, mas alcançável e com rótulo em texto)");
// o caminho de importar continua funcionando de ponta a ponta (sem abrir o seletor nativo)
await pageDel.evaluate(() => { window.__abriu = false; document.getElementById("fileInput").click = () => { window.__abriu = true; }; });
await pageDel.locator("#sheet-body .sheetitem").nth(4).click(); await pageDel.waitForTimeout(400);
ok(await pageDel.evaluate(() => window.__abriu === true),
  "Tocar em 'Importar/restaurar de um arquivo' ainda abre o seletor de arquivo (nada se perdeu ao tirar o botão do topo)");
ok(await pageDel.evaluate(() => !document.getElementById("sheet").classList.contains("show")),
  "A folha fecha ao escolher importar (não fica por cima do seletor)");

// ===== v0.64.0 — puxar a lista para baixo atualiza (o líder publica, o membro puxa) =====
await pageDel.evaluate(() => {
  songs.length = 0; escalas.length = 0; deleted.length = 0;
  songs.push({ id: "q1", title: "Ja tinha", key: "C", capo: 0, tags: [], updatedAt: 1, body: "C" });
  saveSongs(); saveEscalas(); saveDeleted();
  settings.repoUrl = "https://louvai-teste.example/louvai.json"; saveSettings();
  show("lib"); switchTab("songs"); renderLibrary(); window.scrollTo(0, 0);
  window.__pulls = 0;
  window.fetch = async () => { window.__pulls++; return { ok: true, status: 200,
    text: async () => JSON.stringify({ type: "louvai-full", songs: [
      { id: "q2", title: "Cifra que o lider publicou", key: "G", capo: 0, tags: [], updatedAt: 9, body: "G" }], escalas: [] }) }; };
});
await pageDel.waitForTimeout(300);
const ptrEstado = () => pageDel.evaluate(() => {
  const el = document.getElementById("ptr");
  return { visivel: el.classList.contains("on"), texto: el.querySelector(".ptr-tx").textContent,
           y: Math.round(el.getBoundingClientRect().y), girando: el.classList.contains("spin"),
           pulls: window.__pulls, titulos: [...document.querySelectorAll("#songlist .c-ttl")].map(e => e.textContent) };
});
async function puxaLista(dy) {
  await pageDel.mouse.move(206, 220);
  await pageDel.mouse.down();
  for (let i = 1; i <= 6; i++) { await pageDel.mouse.move(206, 220 + dy * i / 6); await pageDel.waitForTimeout(30); }
  const meio = await ptrEstado();
  await pageDel.mouse.up(); await pageDel.waitForTimeout(800);
  return { meio, fim: await ptrEstado(), view: await pageDel.evaluate(() => view) };
}
// puxão curto: aparece o convite, mas nada é buscado
const curto = await puxaLista(40);
ok(curto.meio.visivel && /Puxe para atualizar/.test(curto.meio.texto),
  `Puxar a lista mostra o convite ("${curto.meio.texto}")`);
ok(curto.fim.pulls === 0 && !curto.fim.visivel,
  "Puxão curto volta sozinho e NÃO busca nada (não gasta rede por engano)");
ok(curto.view === "lib",
  "Puxar a lista NÃO abre a cifra que estava sob o dedo (o gesto termina em clique — precisa ser suprimido)");
// puxão além do limiar: busca e traz o que o líder publicou
const longo = await puxaLista(200);
ok(longo.meio.visivel && /Solte para atualizar/.test(longo.meio.texto) && longo.meio.y > 0,
  `Passando do limiar o puxador muda de recado ("${longo.meio.texto}") e fica visível na tela`);
ok(longo.fim.pulls === 1, "Soltar dispara a busca no repertório da nuvem");
ok(longo.fim.titulos.includes("Cifra que o lider publicou"),
  "A cifra publicada pelo líder chega na lista pelo gesto (sem abrir menu nenhum)");
ok(!longo.fim.visivel, "O puxador se recolhe quando termina");

// na cifra o gesto NÃO existe: ali puxar é rolagem
await pageDel.locator("#songlist .songcard").first().click(); await pageDel.waitForTimeout(400);
await pageDel.evaluate(() => { window.__pulls = 0; });
await pageDel.mouse.move(206, 300); await pageDel.mouse.down();
for (let i = 1; i <= 6; i++) { await pageDel.mouse.move(206, 300 + 200 * i / 6); await pageDel.waitForTimeout(25); }
await pageDel.mouse.up(); await pageDel.waitForTimeout(500);
ok(await pageDel.evaluate(() => window.__pulls === 0 && !document.getElementById("ptr").classList.contains("on")),
  "Dentro da cifra o gesto não existe (puxar é rolagem, não sincronismo)");
await pageDel.evaluate(() => exitPlayer()); await pageDel.waitForTimeout(350);

// sem link configurado o gesto nem começa (nada a buscar)
const semLink = await pageDel.evaluate(async () => {
  settings.repoUrl = ""; saveSettings();            // em file:// não há link derivado
  return { url: effectiveRepoUrl() };
});
await pageDel.waitForTimeout(200);
const semLinkPuxao = await puxaLista(200);
ok(semLink.url === "" && semLinkPuxao.fim.pulls === 0 && !semLinkPuxao.fim.visivel,
  "Sem link nenhum o gesto nem começa (nada a buscar, nada a prometer)");
await pageDel.evaluate(() => { settings.repoUrl = "https://louvai-teste.example/louvai.json"; saveSettings(); });

// ===== v0.64.0 — sincronizar ao abrir passa a nascer LIGADO =====
const autoSync = await pageDel.evaluate(() => {
  const guardado = settings.autoPull;
  delete settings.autoPull;                          // aparelho novo, nunca mexeu no interruptor
  const novo = autoPullOn();
  settings.autoPull = false;                         // quem desligou de propósito
  const desligado = autoPullOn();
  settings.autoPull = true;
  const ligado = autoPullOn();
  settings.autoPull = guardado;
  return { novo, desligado, ligado };
});
ok(autoSync.novo === true, "Aparelho novo já nasce sincronizando ao abrir (era opt-in escondido)");
ok(autoSync.desligado === false && autoSync.ligado === true,
  "Quem desligou de propósito continua desligado (só `false` explícito conta como não)");
await pageDel.locator("#backupBtn").click(); await pageDel.waitForTimeout(300);
await pageDel.locator("#sheet-body .sheetitem", { hasText: "Nuvem" }).click(); await pageDel.waitForTimeout(400);
ok(await pageDel.evaluate(() => document.getElementById("auto-pull").checked === true),
  "O interruptor na folha da nuvem reflete o novo padrão (ligado)");
await pageDel.evaluate(() => closeS("#repobg", "#reposheet")); await pageDel.waitForTimeout(300);

ok(delErrors.length === 0, "Excluir: nenhum erro de JS no fluxo" + (delErrors.length ? ": " + delErrors.join(" | ") : ""));
await ctxDel.close();

// 9) Sem erros de JS em todo o fluxo
ok(jsErrors.length === 0, "Nenhum erro de JS" + (jsErrors.length ? ": " + jsErrors.join(" | ") : ""));

await browser.close();
console.log(`\nResultado: ${pass} ok, ${fail} falha(s).`);
process.exit(fail === 0 ? 0 : 1);
