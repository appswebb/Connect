import assert from "node:assert/strict";
import { createServer } from "node:http";
import { createReadStream, existsSync, statSync } from "node:fs";
import { extname, join, normalize, resolve, sep } from "node:path";
import { chromium } from "playwright";
import axe from "axe-core";

const output = resolve(process.cwd(), "out");
assert.ok(existsSync(join(output, "index.html")), "Next.js static export must contain out/index.html");

const mime = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".webp": "image/webp",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".woff2": "font/woff2",
};

const server = createServer((request, response) => {
  const pathname = decodeURIComponent(new URL(request.url ?? "/", "http://127.0.0.1").pathname);
  const withoutBasePath = pathname === "/Connect" ? "/" : pathname.replace(/^\/Connect(?=\/)/, "");
  const relative = normalize(withoutBasePath).replace(/^([/\\])+/, "");
  let file = resolve(output, relative || "index.html");
  if (!file.startsWith(output + sep) && file !== join(output, "index.html")) {
    response.writeHead(403).end("Forbidden");
    return;
  }
  try {
    if (statSync(file).isDirectory()) file = join(file, "index.html");
  } catch {
    if (!extname(file)) file = join(file, "index.html");
  }
  if (!existsSync(file)) {
    response.writeHead(404).end("Not found");
    return;
  }
  response.writeHead(200, { "content-type": mime[extname(file)] ?? "application/octet-stream" });
  createReadStream(file).pipe(response);
});

await new Promise((resolveListen, reject) => {
  server.once("error", reject);
  server.listen(4173, "127.0.0.1", resolveListen);
});

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const pageErrors = [];
page.on("pageerror", (error) => pageErrors.push(error.message));

try {
  const response = await page.goto("http://127.0.0.1:4173/Connect/", { waitUntil: "domcontentloaded" });
  assert.equal(response?.status(), 200, "Marketing homepage must return HTTP 200");
  await page.locator('[data-screen="marketing"]').waitFor();
  await page.getByRole("heading", { name: /Seu próximo/ }).waitFor();
  await page.addScriptTag({ content: axe.source });
  const auditAccessibility = async (label) => {
    const violations = await page.evaluate(async () => {
      const result = await window.axe.run(document, {
        runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] },
      });
      return result.violations.map((violation) => ({
        id: violation.id,
        impact: violation.impact,
        help: violation.help,
        targets: violation.nodes.map((node) => node.target),
      }));
    });
    assert.equal(violations.length, 0, `${label} accessibility violations: ${JSON.stringify(violations)}`);
  };
  await auditAccessibility("Landing desktop");

  const heroImage = page.locator(".landing-photo");
  await heroImage.waitFor();
  await page.waitForFunction(() => {
    const image = document.querySelector(".landing-photo");
    return image instanceof HTMLImageElement && image.complete && image.naturalWidth > 0;
  }, null, { timeout: 15000 });

  const viewports = [320, 360, 375, 390, 414, 430, 768, 1024, 1280, 1440, 1920];
  for (const width of viewports) {
    await page.setViewportSize({ width, height: 900 });
    await page.waitForTimeout(100);
    const metrics = await page.evaluate(() => ({
      viewport: window.innerWidth,
      document: document.documentElement.scrollWidth,
      body: document.body.scrollWidth,
    }));
    assert.ok(
      metrics.document <= metrics.viewport + 1 && metrics.body <= metrics.viewport + 1,
      `Horizontal overflow at ${width}px: ${JSON.stringify(metrics)}`,
    );
  }

  await page.setViewportSize({ width: 390, height: 844 });
  await auditAccessibility("Landing mobile");
  await page.getByRole("button", { name: "Entrar", exact: true }).first().click();
  await page.locator(".entry-form").waitFor();
  await page.getByRole("heading", { name: "Entre no CONNECT." }).waitFor();
  await page.setViewportSize({ width: 1440, height: 900 });
  await auditAccessibility("Sign-in desktop");

  for (const width of viewports) {
    await page.setViewportSize({ width, height: 900 });
    await page.waitForTimeout(80);
    const metrics = await page.evaluate(() => ({
      viewport: window.innerWidth,
      document: document.documentElement.scrollWidth,
      body: document.body.scrollWidth,
    }));
    assert.ok(
      metrics.document <= metrics.viewport + 1 && metrics.body <= metrics.viewport + 1,
      `Authentication horizontal overflow at ${width}px: ${JSON.stringify(metrics)}`,
    );
  }

  await page.setViewportSize({ width: 390, height: 844 });
  await auditAccessibility("Sign-in mobile");

  await page.getByRole("button", { name: "Criar conta", exact: true }).click();
  await page.getByRole("heading", { name: "Crie seu espaço." }).waitFor();
  await page.setViewportSize({ width: 1440, height: 900 });
  await auditAccessibility("Sign-up desktop");
  await page.setViewportSize({ width: 390, height: 844 });
  await auditAccessibility("Sign-up mobile");

  await page.getByRole("button", { name: "Voltar para o início" }).click();
  await page.getByRole("button", { name: /Conhecer por dentro/ }).click();
  await page.locator('[data-screen="authentication"]').waitFor();
  await page.getByRole("heading", { name: "Conheça por dentro." }).waitFor();
  await auditAccessibility("Demo entry");

  const downloadResponse = await page.goto("http://127.0.0.1:4173/Connect/download/", { waitUntil: "domcontentloaded" });
  assert.equal(downloadResponse?.status(), 200, "Download page must return HTTP 200");
  await page.locator(".app-download-hero").waitFor();
  await page.getByRole("heading", { name: /Baixe o CONNECT/ }).waitFor();
  await page.addScriptTag({ content: axe.source });
  await auditAccessibility("Download desktop");
  for (const width of viewports) {
    await page.setViewportSize({ width, height: 900 });
    await page.waitForTimeout(80);
    const metrics = await page.evaluate(() => ({
      viewport: window.innerWidth,
      document: document.documentElement.scrollWidth,
      body: document.body.scrollWidth,
    }));
    assert.ok(
      metrics.document <= metrics.viewport + 1 && metrics.body <= metrics.viewport + 1,
      `Download horizontal overflow at ${width}px: ${JSON.stringify(metrics)}`,
    );
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await auditAccessibility("Download mobile");
  assert.equal(pageErrors.length, 0, `Browser runtime errors: ${pageErrors.join(" | ")}`);

  process.stdout.write(`PASS: landing, sign-in, sign-up, demo entry, download hub, WCAG 2.2 AA and responsive overflow checks at ${viewports.join(", ")} px.\n`);
} finally {
  await browser.close();
  await new Promise((resolveClose) => server.close(resolveClose));
}
