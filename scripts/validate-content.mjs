import { loadAndValidateContent } from "./lib/content.mjs";

await loadAndValidateContent();
console.log("內容驗證通過：5 份內容資料符合 schema 與連結規則。");
