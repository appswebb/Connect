// Conferência visual: abre o site exportado (out/) com Chromium, simula o Supabase
// com dados fictícios e salva capturas de tela em shots/. Não altera nenhum dado real.
import { chromium } from "playwright";
import http from "node:http";
import fs from "node:fs";
import path from "node:path";

const OUT = path.resolve("out");
const SHOTS = path.resolve(process.env.SHOTS_DIR || "shots");
fs.mkdirSync(SHOTS, { recursive: true });

const mime = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".png": "image/png", ".json": "application/json", ".webmanifest": "application/json", ".txt": "text/plain" };
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split("?")[0]).replace(/^\/Connect/, "") || "/";
  let f = path.join(OUT, p);
  if (fs.existsSync(f) && fs.statSync(f).isDirectory()) f = path.join(f, "index.html");
  if (!fs.existsSync(f)) { res.writeHead(404); return res.end("nf"); }
  res.writeHead(200, { "Content-Type": mime[path.extname(f)] || "application/octet-stream" });
  fs.createReadStream(f).pipe(res);
}).listen(4173);
const BASE = "http://localhost:4173/Connect/";

const ME = "00000000-0000-4000-8000-000000000001";
const mkProfile = (id, name, user, extra = {}) => ({
  id, created_at: "2026-01-01T00:00:00Z", is_demo: false, display_name: name, username: user, gender: "woman",
  gender_description: null, looking_for: ["any"], avatar_url: null, banner_url: null, bio: "Café, trilhas e boas conversas.",
  state_code: "MG", city: "Belo Horizonte", location_visible: true, ...extra,
});
const me = mkProfile(ME, "Lucas Demelo", "lucas", { gender: "man" });
const people = [
  mkProfile("00000000-0000-4000-8000-000000000002", "Marina Alves", "marina.alves"),
  mkProfile("00000000-0000-4000-8000-000000000003", "Rafael Nogueira", "rafa.nog", { gender: "man", state_code: "PE", city: "Recife" }),
  mkProfile("00000000-0000-4000-8000-000000000004", "Júlia Campos", "juliacampos", { state_code: "PR", city: "Curitiba" }),
  mkProfile("00000000-0000-4000-8000-000000000005", "Caio Ferraz", "caioferraz", { gender: "man", state_code: "RS", city: "Porto Alegre" }),
];
const now = Date.now();
const posts = [
  { id: "p1", author_id: people[0].id, body: "Primeira trilha do ano na Serra do Cipó. Quem anima a próxima?", image_url: null, created_at: new Date(now - 12 * 60e3).toISOString() },
  { id: "p2", author_id: people[2].id, body: "Alguém tem dica de livro para quem gostou de ficção científica leve?", image_url: null, created_at: new Date(now - 3600e3).toISOString() },
  { id: "p3", author_id: ME, body: "Testando o novo visual do CONNECT. Ficou muito mais organizado!", image_url: null, created_at: new Date(now - 3 * 3600e3).toISOString() },
];
const notifs = [
  { id: "n1", recipient_id: ME, actor_id: people[0].id, type: "message", title: "Nova mensagem", body: "Marina Alves enviou uma mensagem.", entity_type: null, entity_id: null, read_at: null, created_at: new Date(now - 60e3).toISOString() },
  { id: "n2", recipient_id: ME, actor_id: people[1].id, type: "new_follower", title: "Novo seguidor", body: "Rafael Nogueira começou a seguir você.", entity_type: null, entity_id: null, read_at: null, created_at: new Date(now - 8 * 60e3).toISOString() },
];
const b64 = o => Buffer.from(JSON.stringify(o)).toString("base64url");
const jwt = `${b64({ alg: "HS256", typ: "JWT" })}.${b64({ sub: ME, role: "authenticated", exp: 4102444800 })}.sig`;
const user = { id: ME, aud: "authenticated", role: "authenticated", email: "lucas@exemplo.com", app_metadata: {}, user_metadata: {}, created_at: "2026-01-01T00:00:00Z" };
const session = { access_token: jwt, refresh_token: "r", expires_in: 3600, expires_at: 4102444800, token_type: "bearer", user };

async function mockSupabase(ctx) {
  await ctx.route(/supabase\.co/, route => {
    const req = route.request(); const url = new URL(req.url()); const p = url.pathname; const q = url.search;
    const json = (body, status = 200, headers = {}) => route.fulfill({ status, contentType: "application/json", headers: { "access-control-allow-origin": "*", "content-range": "0-0/*", ...headers }, body: JSON.stringify(body) });
    if (req.method() === "OPTIONS") return route.fulfill({ status: 204, headers: { "access-control-allow-origin": "*", "access-control-allow-headers": "*", "access-control-allow-methods": "*" } });
    if (p.includes("/auth/v1/user")) return json(user);
    if (p.includes("/auth/v1/token")) return json(session);
    const single = (req.headers()["accept"] || "").includes("pgrst.object");
    const table = (p.match(/\/rest\/v1\/([a-z_]+)/) || [])[1];
    const pick = rows => (single ? (rows[0] || null) : rows);
    if (p.includes("/functions/v1/")) return json({});
    if (table === "profiles") {
      const m = q.match(/id=eq\.([0-9a-f-]+)/); const inn = q.match(/id=in\.\(([^)]*)\)/);
      const all = [me, ...people];
      if (m) return single ? (all.find(x => x.id === m[1]) ? json(all.find(x => x.id === m[1])) : json(null, 406)) : json(all.filter(x => x.id === m[1]));
      if (inn) { const ids = inn[1].replace(/"/g, "").split(","); return json(all.filter(x => ids.includes(x.id))); }
      return json(pick(people));
    }
    if (table === "posts") return json(pick(posts));
    if (table === "notifications") return json(pick(notifs));
    return json(single ? null : [], single ? 406 : 200);
  });
}

const sizes = { desktop: { width: 1440, height: 900 }, tablet: { width: 820, height: 1100 }, mobile: { width: 390, height: 844 } };
const browser = await chromium.launch();
const errors = [];

async function shot(page, name, full = true) {
  await page.waitForTimeout(700);
  await page.screenshot({ path: path.join(SHOTS, name + ".png"), fullPage: full });
}
async function newPage(size, theme, { logged = false } = {}) {
  const ctx = await browser.newContext({ viewport: sizes[size], deviceScaleFactor: 1, isMobile: size === "mobile", hasTouch: size === "mobile" });
  await ctx.addInitScript(([th, lg, ses]) => {
    try { localStorage.setItem("connect-theme", th); if (lg) localStorage.setItem("sb-trrakyybnvxpdhxwgjrz-auth-token", JSON.stringify(ses)); } catch {}
  }, [theme, logged, session]);
  await mockSupabase(ctx);
  const page = await ctx.newPage();
  page.on("pageerror", e => errors.push(`[${size}/${theme}] pageerror: ${e.message}`));
  page.on("console", m => { if (m.type() === "error" && !/supabase|WebSocket|Failed to load resource|net::ERR/.test(m.text())) errors.push(`[${size}/${theme}] console: ${m.text().slice(0, 200)}`); });
  return { ctx, page };
}
async function overflow(page, label) {
  const w = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
  if (w.sw > w.cw + 1) errors.push(`[${label}] scroll horizontal: ${w.sw} > ${w.cw}`);
}

const only = (process.env.ONLY || "public,auth,tour,app").split(",");

if (only.includes("public")) for (const size of ["desktop", "mobile"]) for (const theme of ["light", "dark"]) {
  const { ctx, page } = await newPage(size, theme);
  await page.goto(BASE); await page.waitForSelector(".pub"); await page.evaluate(() => document.querySelectorAll("[data-reveal]").forEach(e => e.classList.add("in")));
  await shot(page, `home-${size}-${theme}`); await overflow(page, `home ${size} ${theme}`); await ctx.close();
}
if (only.includes("auth")) for (const size of ["desktop", "mobile"]) for (const theme of ["light", "dark"]) {
  const { ctx, page } = await newPage(size, theme);
  await page.goto(BASE); await page.getByRole("button", { name: /Criar minha conta/i }).first().click(); await page.waitForSelector(".auth");
  await shot(page, `auth-signup-${size}-${theme}`, false); await overflow(page, `auth ${size} ${theme}`);
  await page.getByRole("tab", { name: "Entrar" }).click(); await shot(page, `auth-signin-${size}-${theme}`, false); await ctx.close();
}
if (only.includes("tour")) for (const size of ["desktop", "mobile"]) {
  const { ctx, page } = await newPage(size, "light");
  await page.goto(BASE); await page.getByRole("button", { name: /Ver por dentro/i }).first().click(); await page.waitForSelector(".tour");
  for (const [id, label] of [["feed", "Feed"], ["people", "Pessoas"], ["chat", "Conversas"], ["rooms", "Salas"], ["lives", "Ao vivo"], ["notifications", "Avisos"], ["plans", "Assinatura"]]) {
    await page.locator(size === "mobile" ? ".tour-tabbar" : ".tour-side nav").getByRole("button", { name: label }).first().click();
    await shot(page, `tour-${id}-${size}`, false); await overflow(page, `tour ${id} ${size}`);
  }
  await ctx.close();
}
if (only.includes("app")) for (const size of ["desktop", "tablet", "mobile"]) for (const theme of ["light", "dark"]) {
  const { ctx, page } = await newPage(size, theme, { logged: true });
  await page.goto(BASE);
  try { await page.waitForSelector(".app", { timeout: 15000 }); } catch { await shot(page, `app-FAILED-${size}-${theme}`, false); errors.push(`[app ${size} ${theme}] a área interna não abriu`); await ctx.close(); continue; }
  await shot(page, `app-feed-${size}-${theme}`, false); await overflow(page, `app feed ${size} ${theme}`);
  const tabs = ["Conectar", "Chat", "Pessoas", "Salas", "Ao vivo"];
  for (const label of tabs) {
    const btn = page.locator("nav button, .mobile-nav button, .bottom-nav button").filter({ hasText: new RegExp("^\\s*" + label + "\\s*$") }).first();
    if (await btn.count()) { await btn.click({ timeout: 4000 }).catch(() => {}); await shot(page, `app-${label.toLowerCase().replace(" ", "")}-${size}-${theme}`, false); await overflow(page, `app ${label} ${size} ${theme}`); }
  }
  await ctx.close();
}
await browser.close(); server.close();
fs.writeFileSync(path.join(SHOTS, "REPORT.txt"), errors.length ? errors.join("\n") : "sem erros de console/overflow detectados\n");
console.log(errors.length ? errors.join("\n") : "ok");
