import { cp, mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { loadAndValidateContent, PROJECT_ROOT } from "./lib/content.mjs";
import { renderAssignments, renderCourseInfo, renderHome, renderSupplements } from "./lib/render.mjs";

const data = await loadAndValidateContent();
const distDir = path.join(PROJECT_ROOT, "dist");

await rm(distDir, { recursive: true, force: true });
await mkdir(path.join(distDir, "assets"), { recursive: true });
await mkdir(path.join(distDir, "supplements"), { recursive: true });
await mkdir(path.join(distDir, "assignments"), { recursive: true });
await mkdir(path.join(distDir, "course-info"), { recursive: true });

await Promise.all([
  cp(path.join(PROJECT_ROOT, "src", "styles.css"), path.join(distDir, "assets", "styles.css")),
  cp(path.join(PROJECT_ROOT, "src", "favicon.svg"), path.join(distDir, "favicon.svg")),
  writeFile(path.join(distDir, "index.html"), renderHome(data), "utf8"),
  writeFile(path.join(distDir, "supplements", "index.html"), renderSupplements(data), "utf8"),
  writeFile(path.join(distDir, "assignments", "index.html"), renderAssignments(data), "utf8"),
  writeFile(path.join(distDir, "course-info", "index.html"), renderCourseInfo(data), "utf8"),
  writeFile(path.join(distDir, ".nojekyll"), "", "utf8"),
  writeFile(path.join(distDir, "robots.txt"), "User-agent: *\nDisallow: /\n", "utf8")
]);

console.log("Production output 已建立：4 個 HTML 頁面與共用資產已寫入 dist/。");
