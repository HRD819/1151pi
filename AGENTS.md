# AGENTS.md

## 最高優先規則

1. 任何修改前，必須完整閱讀 `SPEC.md`；若其他文件、既有程式或 Demo 與 `SPEC.md` 衝突，以 `SPEC.md` 為準。
2. 本專案是「外校生課程專區」，不得修改、搬入、合併或依賴既有盲生網站 `m8q2-resource-hub-2609` 的 repository、部署或內容。
3. 可沿用既有盲生網站已驗證的工程做法，但必須重新建立獨立專案；不得讓兩站共享同一份內容資料或發布流程。
4. 未經使用者明確同意，不得建立遠端 repository、推送、開啟 Pages、觸發正式發布或更改任何現有網站。
5. 不得猜測 Dropbox、Dropbox File Request、作業說明或教師聯絡資料網址。未知網址必須維持 `planned`／`待提供`，且不得產生可點擊的假連結。

## 工作方式

- 先盤點 workspace 與 Git 狀態，保留使用者既有修改。
- 內容資料與頁面樣板分離；不得手改 build output。
- 優先使用 Node.js 22 標準庫，不加入 framework、SPA、資料庫、CMS 或不必要的第三方套件。
- 所有內容、測試、建置及檢查成功後，才可回報完成。
- 若需求不明會導致內容、公開範圍或繳交方式不同，先停止並詢問，不可自行決定。

## 每次修改後必做

1. 執行內容 schema 驗證。
2. 執行單元測試。
3. 重建 production output。
4. 檢查內部連結、標題階層、`noindex`、鍵盤焦點、色彩對比與 responsive 規則。
5. 執行 `git diff --check`。
6. 在 `HANDOFF_LOG.md` 記錄修改、驗證結果與未完成事項。

## 禁止事項

- 不得把教材或學生作業加入 Git repository。
- 不得建立公開的作業資料夾分享網址；繳交只能使用 Dropbox File Request URL。
- 不得顯示其他學生姓名、作業或個人資料。
- 不得用「點這裡」「下載」「連結」作為脫離上下文後無意義的連結文字。
- 不得只以 `robots.txt` 取代頁面中的 `noindex`。
- 不得產生 sitemap、RSS 或 Atom feed。
- 不得聲稱 `noindex` 等於密碼保護。
