# 1151 專利資訊｜外校生課程專區

這是一個獨立的多頁靜態網站，提供無法登入 TronClass 的外校生查看公告、取得補充教材及繳交作業。本站不依賴、修改或連結既有盲生無障礙教材網站。

## 本機使用

```powershell
npm run ci
npm run serve
```

本機預覽預設位於 `http://127.0.0.1:4173/`。`dist/` 是建置產物，不可直接編輯。

## 文件用途

- `AGENTS.md`：Codex 必須遵守的工作規則。
- `SPEC.md`：唯一權威需求規格。
- `IMPLEMENTATION_PLAN.md`：建議實作順序與完成條件。
- `CONTENT_GUIDE.md`：日後更新公告、教材、作業的方式。
- `content/*.json`：網站的正式內容資料；未知連結保留待補狀態。
- `content.seed.json`：最初交接資料，保留作為來源紀錄；網站實際內容以 `content/` 為準。
- `ACCEPTANCE_CHECKLIST.md`：交付前驗收清單。
- `HANDOFF_LOG.md`：每次修改、驗證結果與待補資料。

## 已確定的定位

- 本站服務外校生，不取代 TronClass。
- 與既有盲生網站分成不同 repository、不同網址、不同內容資料。
- GitHub Pages 只呈現頁面；教材仍在 Dropbox，作業使用 Dropbox File Request。
- 不設登入。使用 `noindex, nofollow` 降低被搜尋到的機率，但這不是真正的權限控制。
- 導覽固定為：首頁｜補充教材｜作業與繳交｜課程資訊。
