# 實作計畫

## Phase 1｜專案骨架與資料模型

1. 建立獨立資料夾與 Git repository（僅本機）。
2. 建立 `package.json` scripts：`validate`、`test`、`build`、`check`、`serve`、`ci`。
3. 將 `content.seed.json` 拆成正式的 `content/*.json`。
4. 建立 schema 驗證；planned 項目禁止帶入假 URL。

完成條件：內容驗證有清楚通過／失敗訊息，並有測試涵蓋 URL、日期與狀態。

## Phase 2｜頁面產生器

建立四頁：

- `/index.html`
- `/supplements/index.html`
- `/assignments/index.html`
- `/course-info/index.html`

作業頁可用同頁錨點；若內容未來變長，再以穩定 slug 產生獨立頁。不要一開始過度拆頁。

完成條件：核心內容在關閉 JavaScript 時仍可瀏覽；全部站內連結採相對路徑。

## Phase 3｜樣式與可存取性

- 建立共用 CSS、skip link、可見 focus、清楚的狀態文字。
- 頂端導覽順序完全依 SPEC。
- 手機與桌面版均保持單純閱讀流程。

完成條件：自動檢查標題、landmarks、noindex、focus、對比、responsive 與模糊連結文字。

## Phase 4｜部署流程

- 建立 GitHub Actions 品質 gate。
- Push 預設不發布；保留 workflow_dispatch 發布。
- 產出 `.nojekyll`，不產生 sitemap/feed。

完成條件：本機 `npm run ci` 通過；workflow 語法與 Pages artifact 路徑正確。

## Phase 5｜教師補資料與發布（需明確授權）

發布前向教師索取：

1. 所有 Dropbox 教材個別分享網址。
2. 各作業 Dropbox File Request 網址。
3. 作業說明、應繳格式與截止日確認。
4. 課程目標、評分方式、教師聯絡／Office Hour、請假與 AI 規範全文。
5. 新 repository 名稱與 GitHub Pages 發布授權。
6. 小組互評是否需要本站替代方案。

取得後先更新內容、執行完整驗證、提供本機預覽，再等待發布指示。
