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
ok((await page.locator("#t-key").textContent()) === "G", "Player abre no tom G");
await page.locator("#t-up").click(); await page.locator("#t-up").click(); await page.waitForTimeout(120);
ok((await page.locator("#t-key").textContent()) === "A", "Transpor +2 leva a A");

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

// 4c) v0.14.0: auto-scroll é OPCIONAL (oculto por padrão); Tom continua à vista
ok((await page.locator("#t-key").isVisible()) && !(await page.locator("#scroll-toggle").isVisible()),
   "Tom à vista e barra de auto-scroll oculta por padrão");
ok(await page.evaluate(() => document.getElementById("c-val").getBoundingClientRect().top >= window.innerHeight),
   "Capo fora da barra (guardado no sheet Ajustes)");
await page.locator("#p-settings").click(); await page.waitForTimeout(300);
ok(await page.evaluate(() => document.getElementById("playersheet").classList.contains("show")),
   "Sheet Ajustes abre");
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
await page.locator("#ee-save").click(); await page.waitForTimeout(200);
ok(await page.locator("#view-escala").isVisible(), "Escala salva e detalhe aberto");
await page.locator("#es-present").click(); await page.waitForTimeout(200);
ok(await page.locator("#presentbar").isVisible(), "Modo Apresentar abre com a barra de navegação");
ok((await page.locator("#t-key").textContent()) === "A", "Apresentar abre a música no tom da escala (A)");

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

// 9) Sem erros de JS em todo o fluxo
ok(jsErrors.length === 0, "Nenhum erro de JS" + (jsErrors.length ? ": " + jsErrors.join(" | ") : ""));

await browser.close();
console.log(`\nResultado: ${pass} ok, ${fail} falha(s).`);
process.exit(fail === 0 ? 0 : 1);
