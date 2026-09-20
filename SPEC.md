# 專利資訊外校生課程專區－正式開發規格

> 本文件是本專案的唯一權威需求規格。若其他文件、Demo、程式碼或慣例與本文件衝突，以本文件為準。

## 1. 專案目的與邊界

建立 `1151 專利資訊` 的極簡課程入口，供無法使用輔大 TronClass 的外校生使用。學生要能在單一網站完成四件事：

1. 查看最新公告。
2. 開啟 Dropbox 補充教材。
3. 查看作業說明並透過 Dropbox File Request 上傳。
4. 查閱課程目標、評分方式、教師資訊、請假與 AI 規範。

本站不是 LMS，不處理登入、成績、測驗作答、討論區或作業批改。校內生仍以 TronClass 為正式平台。

## 2. 與盲生網站的關係

既有網站：`m8q2-resource-hub-2609`，用途是提供全盲學生依課程、單元取得可編輯教材。

本專案必須：

- 使用新的 repository 與 GitHub Pages 網址。
- 使用新的內容資料與部署 workflow。
- 不在兩站之間放導覽連結。
- 不複製既有網站的兩門課資料。
- 不把本網站內容加入既有網站首頁。

可以沿用的工程經驗：零第三方相依 Node.js 靜態產生器、JSON schema 驗證、相對路徑、GitHub Pages project-site base path、`noindex`、skip link、清楚 focus、語意化 HTML、建置後檢查與人工觸發發布。

## 3. 資訊架構

頂端導覽順序固定如下：

1. `首頁`
2. `補充教材`
3. `作業與繳交`
4. `課程資訊`

### 3.1 首頁

- 網站名稱：`1151 專利資訊課程專區`
- 簡短用途說明。
- 正式資訊來源聲明：校內生仍以 TronClass 為準。
- 最新公告，依日期新到舊排列。
- 公告可連到本站教材或作業錨點／頁面；不得使用模糊連結文字。

### 3.2 補充教材

- 依上課日期與主題排序。
- 每筆顯示日期、標題、簡短說明、檔案格式、更新日期（若有）。
- 教材檔案只使用 Dropbox 個別檔案分享 URL；正式下載 URL 使用 `dl=1`。
- 不使用整個 Dropbox 共用資料夾網址代替個別教材。
- 尚無 URL 時只顯示「資料待提供」狀態，不產生假連結或補充說明文字。

### 3.3 作業與繳交

依邏輯順序呈現，而不是照 TronClass 的活動類型原樣複製：

1. 期中報告｜分類或資料庫介紹（分組期中報告）
2. 期末報告構想 PPT
3. 期末報告（含 PPT 及 Word）
4. 期末口頭報告

期末報告範例應放在「期末報告」內，不應獨立成與作業同層級的活動。

每份作業可包含：

- 作業名稱與形式。
- 說明。
- 應繳格式。
- 參考資料／範例。
- Dropbox File Request 上傳按鈕。
- 狀態：尚未開放、開放繳交、已截止。

上傳按鈕文字須具體，例如 `上傳期末報告 PPT 與 Word`。尚未取得正式上傳網址時，不顯示繳交方式、帳號或網址待提供的說明。

不得把 Dropbox 資料夾分享連結誤當成 File Request。學生不得看見其他人的檔案。

### 3.4 課程資訊

只顯示教師已提供內容，固定順序如下：

1. 課程基本資訊及整體學習目標
2. 教材內容
3. 授課教師聯絡資訊及 Office Hour
4. 作業及評分依據
5. 請假說明
6. 基本知識：螢幕剪取截圖工具
7. 關於 AI 的使用

未提供內容的項目不得顯示「待提供」區塊。Canva 說明以具體文字連結開啟，不嵌入其頁面。

## 4. 初始內容

以 `content.seed.json` 為初始資料。截圖能確認但仍未取得完整內文或 URL 的項目，必須標成 `planned`。

本版作業與繳交頁不顯示開始、截止或時段資訊；既有截圖中的日期不匯入本站內容。截圖另有小組互評線上測驗，但目前不屬於本站四個作業項目，不要自行加入；待教師確認是否需提供替代方式。

## 5. 內容資料與維護

内容必須與 presentation 分離。建議結構：

```text
content/
  site.json
  announcements.json
  supplements.json
  assignments.json
  course-info.json
scripts/
  build.mjs
  validate-content.mjs
  check-site.mjs
  serve.mjs
test/
dist/                  # generated; never edit directly
.github/workflows/deploy-pages.yml
```

所有檔案採 UTF-8 JSON。建立明確 schema 與錯誤訊息，至少驗證：必填欄位、日期格式、狀態、HTTPS、Dropbox host、下載連結 `dl=1`、File Request URL 與 slug。

未知內容使用 `status: "planned"`，不要求教師填入假 URL。

## 6. 技術與部署

- Node.js 22+，優先只使用標準庫。
- 靜態多頁網站，不使用 SPA；核心導覽不可依賴 JavaScript。
- 全部站內連結為相對路徑，支援 GitHub Pages project site。
- `npm run ci` 應依序執行 validate、test、build、check。
- GitHub Actions 在 pull request、`main` push 與人工觸發時執行品質檢查。
- Push 預設只檢查、不部署；只有人工觸發，或日後教師明確設定 `PUBLISH_PAGES=true`，才部署 Pages。
- 初次上線前，必須由教師提供新的 repository 名稱並確認是否發布。

## 7. 可見性與隱私

資料不是機密，但不希望被搜尋或隨意發現。

- 每個 HTML 頁面必須包含 `<meta name="robots" content="noindex, nofollow">`。
- 不產生 sitemap、feed。
- repository／site slug 使用不過度直觀但可維護的名稱。
- 不從其他公開網站連回本站。
- 可補 robots.txt，但不得用它取代 `noindex`。
- 頁面須明示：知道網址的人仍可存取；若未來需要真正限制，必須改用具登入／權限控制的平台。
- GitHub repository 及 Pages 是否能搭配 private repository，須依帳號方案與 GitHub 當時政策確認；不可在未核實時保證。

## 8. 基本無障礙與視覺要求

本站雖不與盲生網站合併，仍應維持良好可存取性，至少以 WCAG 2.2 AA 為目標：

- 語意化 `header`、`nav`、`main`、`section`、`footer`。
- 每頁一個 `h1`，標題不跳級。
- 提供可見的「跳至主要內容」連結。
- 鍵盤可操作，focus 清楚可見。
- 連結文字脫離上下文仍有意義。
- 文字／背景對比至少 4.5:1。
- responsive，320、390、768、1440 px 不出現關鍵內容水平捲動。
- 不靠顏色單獨表達作業狀態。
- 日期以完整文字呈現，避免只有 `10/18` 而無年份。

視覺風格保持簡潔、淺色、大量留白。不要照抄 TronClass 畫面，也不要加入不必要的動畫、圖示或儀表板。

## 9. 完成定義

只有在以下全部成立時才算完成：

- 四個主要頁面及導覽均已產生。
- 初始內容正確匯入；未知 URL 顯示待提供且不可點擊。
- 所有自動檢查與測試通過。
- 本機實際請求全部 URL 回傳 200。
- 完成人工 keyboard-only 與多寬度視覺檢查。
- 在 `HANDOFF_LOG.md` 記錄完成／待補項目。
- 未獲明確授權前，沒有遠端推送或正式發布。
