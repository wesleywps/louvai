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

// 2) Transposição (fonte da verdade) — funções puras
const t = await page.evaluate(() => ({
  a: transposeChord("C", 2, "sharp"),
  b: transposeChord("C7M", 2, "sharp"),
  c: transposeChord("Cm7b5", 2, "sharp"),
  d: transposeChord("C/E", 2, "sharp"),
  e: transposeChord("C6/9", 2, "sharp"),
  f: transposeChord("Bb", 1, "flat"),
}));
ok(t.a === "D", "C +2 = D");
ok(t.b === "D7M", "C7M +2 = D7M");
ok(t.c === "Dm7b5", "Cm7b5 +2 = Dm7b5");
ok(t.d === "D/F#", "C/E +2 = D/F#");
ok(t.e === "D6/9", "C6/9 +2 = D6/9");
ok(t.f === "B", "Bb +1 (bemol) = B");

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
ok((await page.locator("#t-key").textContent()) === "G", "Player abre no tom G");
await page.locator("#t-up").click(); await page.locator("#t-up").click(); await page.waitForTimeout(120);
ok((await page.locator("#t-key").textContent()) === "A", "Transpor +2 leva a A");

// 4b) Wake Lock: pede a trava com o player aberto e solta ao sair
let wl = await page.evaluate(() => window.__wl);
ok(wl.req >= 1, "Player pede o Wake Lock (tela acesa)");

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

// 9) Sem erros de JS em todo o fluxo
ok(jsErrors.length === 0, "Nenhum erro de JS" + (jsErrors.length ? ": " + jsErrors.join(" | ") : ""));

await browser.close();
console.log(`\nResultado: ${pass} ok, ${fail} falha(s).`);
process.exit(fail === 0 ? 0 : 1);
