import { access, readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { PROJECT_ROOT } from "./lib/content.mjs";

const distDir = path.join(PROJECT_ROOT, "dist");
const expectedPages = ["index.html", "supplements/index.html", "assignments/index.html", "course-info/index.html"];
const errors = [];

async function exists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

function headingLevels(html) {
  return [...html.matchAll(/<h([1-6])\b/gi)].map((match) => Number(match[1]));
}

function extractLinks(html) {
  return [...html.matchAll(/<a\b[^>]*\bhref="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi)].map((match) => ({
    href: match[1],
    text: match[2].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()
  }));
}

function hexToRgb(value) {
  const hex = value.replace("#", "");
  if (!/^[0-9a-f]{6}$/i.test(hex)) return null;
  return [0, 2, 4].map((offset) => Number.parseInt(hex.slice(offset, offset + 2), 16));
}

function luminance(rgb) {
  const values = rgb.map((channel) => {
    const normalized = channel / 255;
    return normalized <= 0.03928 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
  });
  return values[0] * 0.2126 + values[1] * 0.7152 + values[2] * 0.0722;
}

function contrastRatio(colorA, colorB) {
  const first = luminance(hexToRgb(colorA));
  const second = luminance(hexToRgb(colorB));
  return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
}

for (const page of expectedPages) {
  const filePath = path.join(distDir, page);
  if (!(await exists(filePath))) {
    errors.push(`${page} 不存在。`);
    continue;
  }

  const html = await readFile(filePath, "utf8");
  if (!html.includes('<meta name="robots" content="noindex, nofollow">')) errors.push(`${page} 缺少 noindex, nofollow。`);
  if (!html.includes('<meta name="viewport" content="width=device-width, initial-scale=1">')) errors.push(`${page} 缺少 responsive viewport。`);
  for (const landmark of ["<header", "<nav", "<main", "<footer"]) {
    if (!html.includes(landmark)) errors.push(`${page} 缺少 ${landmark.slice(1)} landmark。`);
  }
  if (!html.includes('class="skip-link"') || !html.includes('id="main-content"')) errors.push(`${page} 缺少可用的 skip link。`);

  const levels = headingLevels(html);
  if (levels.filter((level) => level === 1).length !== 1) errors.push(`${page} 必須且只能有一個 h1。`);
  for (let index = 1; index < levels.length; index += 1) {
    if (levels[index] - levels[index - 1] > 1) errors.push(`${page} 標題層級由 h${levels[index - 1]} 跳到 h${levels[index]}。`);
  }

  const navPositions = ["首頁", "補充教材", "作業與繳交", "課程資訊"].map((label) => html.indexOf(`>${label}</a>`));
  if (navPositions.some((position) => position < 0) || navPositions.some((position, index) => index > 0 && position <= navPositions[index - 1])) {
    errors.push(`${page} 的主要導覽文字或順序不符合規格。`);
  }

  for (const { href, text } of extractLinks(html)) {
    if (["點這裡", "下載", "檔案", "連結"].includes(text)) errors.push(`${page} 含有模糊連結文字「${text}」。`);
    if (/^javascript:/i.test(href)) errors.push(`${page} 含有 javascript: 連結。`);
    if (href.startsWith("/")) errors.push(`${page} 的站內連結必須使用相對路徑：${href}`);
    if (/^(?:https:|mailto:|tel:|#)/i.test(href)) continue;
    const target = href.split("#")[0];
    if (!target) continue;
    const resolved = path.resolve(path.dirname(filePath), target);
    if (!resolved.startsWith(distDir) || !(await exists(resolved))) errors.push(`${page} 的內部連結找不到目標：${href}`);
  }
}

for (const forbidden of ["sitemap.xml", "rss.xml", "atom.xml", "feed.xml"]) {
  if (await exists(path.join(distDir, forbidden))) errors.push(`不得產生 ${forbidden}。`);
}

for (const required of [".nojekyll", "robots.txt", "assets/styles.css", "favicon.svg"]) {
  if (!(await exists(path.join(distDir, required)))) errors.push(`dist/${required} 不存在。`);
}

const css = await readFile(path.join(distDir, "assets", "styles.css"), "utf8");
if (!css.includes(":focus-visible")) errors.push("CSS 缺少可見的 :focus-visible 樣式。");
if (!css.includes("@media (max-width: 48rem)")) errors.push("CSS 缺少手機 responsive 規則。");
if (!css.includes("overflow-wrap: anywhere")) errors.push("CSS 缺少長字串防水平溢位規則。");

const variables = Object.fromEntries([...css.matchAll(/--([\w-]+):\s*(#[0-9a-fA-F]{6})/g)].map((match) => [match[1], match[2]]));
for (const [foreground, background, label] of [
  ["ink", "surface", "主要文字"],
  ["muted", "surface", "次要文字"],
  ["accent", "surface", "一般連結"],
  ["on-accent", "accent", "主要按鈕"]
]) {
  if (!variables[foreground] || !variables[background]) {
    errors.push(`無法檢查 ${label} 對比。`);
  } else if (contrastRatio(variables[foreground], variables[background]) < 4.5) {
    errors.push(`${label} 對比低於 4.5:1。`);
  }
}

const workflowPath = path.join(PROJECT_ROOT, ".github", "workflows", "deploy-pages.yml");
const workflow = await readFile(workflowPath, "utf8");
for (const requiredText of ["pull_request:", "workflow_dispatch:", "npm run ci", "actions/upload-pages-artifact@v3", "actions/deploy-pages@v4", "vars.PUBLISH_PAGES == 'true'", "path: dist"]) {
  if (!workflow.includes(requiredText)) errors.push(`GitHub Actions workflow 缺少：${requiredText}`);
}

const distFiles = await readdir(distDir, { recursive: true });
if (distFiles.some((file) => /(?:sitemap|rss|atom|feed)/i.test(file))) errors.push("dist/ 不得含 sitemap 或 feed 檔案。");

if (errors.length > 0) {
  console.error(`網站檢查失敗：\n- ${errors.join("\n- ")}`);
  process.exitCode = 1;
} else {
  console.log("網站檢查通過：頁面、連結、標題、noindex、focus、對比、responsive 與發布 gate 均符合規格。");
}
