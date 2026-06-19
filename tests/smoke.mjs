/* =========================================================================
   Louvai — suíte de validação (smoke/E2E)
   Abre o louvai.html num Chromium headless e valida os pontos críticos.
   Uso:  npm install && npm run test:install && npm test
   Sai com código ≠ 0 se algo falhar.
   ========================================================================= */
import { chromium } from "playwright";

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
}));
ok(dupSheet.shown && /Repetida/.test(dupSheet.title), "Título duplicado abre o aviso antes de mesclar");
ok(dupSheet.items === 3, "Aviso de duplicado oferece 3 opções (minhas / cópias / cancelar)");
// nada foi salvo ainda (aviso antes de mexer)
ok(await page.evaluate(() => songs.length === 1), "Antes de escolher, nada é importado (nada salvo no escuro)");
// "Importar como cópias" (2º item) → fica com as duas, escala aponta pra cifra importada
await page.locator("#sheet-body .sheetitem").nth(1).click();
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
ok(/Restaurar de um arquivo/.test(await page.evaluate(() => [...document.querySelectorAll("#sheet-body .sheetitem")].map(e => e.textContent).join("|"))),
   "Sheet de Backup tem 'Restaurar de um arquivo (.json)'");
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
ok(await page.evaluate(() => ["#themeBtn","#backupBtn","#importBtn","#p-back","#p-struct","#p-settings","#es-share","#es-edit"]
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
  const cards = [...document.querySelectorAll("#songlist .songcard")];
  const firstAnimated = cards[0].classList.contains("card-in");
  const hasDelay = !!cards[1].style.animationDelay;
  renderLibrary();                              // 2ª pintura (ex.: busca) NÃO re-anima
  const reanimated = [...document.querySelectorAll("#songlist .songcard")].some(c => c.classList.contains("card-in"));
  return { firstAnimated, hasDelay, n: cards.length, reanimated };
});
ok(m7.firstAnimated && m7.hasDelay && m7.n === 2, "Lista anima na 1ª pintura (.card-in + animation-delay escalonado)");
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

// ===== v0.44.0 — modo tela cheia na Apresentação =====
const full = await page.evaluate(async () => {
  songs.length=0; escalas.length=0;
  songs.push({id:"fz",title:"Cheia",key:"C",capo:0,tags:[],updatedAt:1,body:"C\nx"});
  const esc={id:"fe",title:"Culto",date:"2026-01-01",team:[],items:[{kind:"song",songId:"fz",key:"",capo:0}],updatedAt:1};
  escalas.push(esc); saveSongs(); saveEscalas();
  let req=0,exit=0;   // stub do Fullscreen API (headless não entra em fullscreen de verdade)
  document.documentElement.requestFullscreen = async()=>{ req++; };
  document.exitFullscreen = async()=>{ exit++; };
  openPlayer("fz",{id:"fe",idx:0,list:[{songId:"fz",key:"",capo:0}]});
  const vp=document.getElementById("view-player");
  const out={ present: vp.classList.contains("present"), hasBtn: !!document.getElementById("pv-full") };
  toggleImmersive(); await new Promise(r=>setTimeout(r,10));
  out.onImm = vp.classList.contains("immersive");
  out.barHidden = getComputedStyle(document.getElementById("presentbar")).display==="none";
  out.exitShown = getComputedStyle(document.getElementById("pv-exitfull")).display!=="none";
  out.req = req;
  document.getElementById("pv-exitfull").click(); await new Promise(r=>setTimeout(r,10));
  out.offImm = !vp.classList.contains("immersive");
  out.exit = exit;
  exitPlayer();
  return out;
});
ok(full.present && full.hasBtn, "Apresentação tem o botão de tela cheia (#pv-full)");
ok(full.onImm && full.barHidden && full.exitShown, "Tela cheia esconde a barra/cabeçalho e mostra o botão flutuante de sair (maximiza a cifra)");
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

// 9) Sem erros de JS em todo o fluxo
ok(jsErrors.length === 0, "Nenhum erro de JS" + (jsErrors.length ? ": " + jsErrors.join(" | ") : ""));

await browser.close();
console.log(`\nResultado: ${pass} ok, ${fail} falha(s).`);
process.exit(fail === 0 ? 0 : 1);
