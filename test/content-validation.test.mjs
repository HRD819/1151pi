import assert from "node:assert/strict";
import { test } from "node:test";
import { loadContent, validateContentData } from "../scripts/lib/content.mjs";

function clone(value) {
  return structuredClone(value);
}

test("目前內容資料通過 schema 驗證", async () => {
  const data = await loadContent();
  assert.deepEqual(validateContentData(data), []);
});

test("planned 項目不得夾帶假網址", async () => {
  const data = clone(await loadContent());
  data.supplements[0].url = "https://www.dropbox.com/scl/fi/example/file.pdf?dl=1";
  assert.match(validateContentData(data).join("\n"), /planned 時不得設定 url/);
});

test("教材網址必須是 Dropbox 個別檔案且包含 dl=1", async () => {
  const data = clone(await loadContent());
  data.supplements[0].status = "available";
  data.supplements[0].url = "https://www.dropbox.com/sh/folder/example?dl=0";
  data.supplements[0].link_label = "下載 Ch3 專利文獻與專利分類講義 PDF";
  const message = validateContentData(data).join("\n");
  assert.match(message, /個別檔案網址/);
  assert.match(message, /dl=1/);
});

test("作業繳交必須使用 Dropbox File Request", async () => {
  const data = clone(await loadContent());
  data.assignments.items[0].status = "open";
  data.assignments.items[0].submission_url = "https://www.dropbox.com/scl/fo/example";
  data.assignments.items[0].upload_label = "上傳期中報告檔案";
  assert.match(validateContentData(data).join("\n"), /Dropbox File Request URL/);
});

test("作業日期時間必須明確包含時區", async () => {
  const data = clone(await loadContent());
  data.assignments.items[0].deadline = "2026-12-08T15:03:00";
  assert.match(validateContentData(data).join("\n"), /包含時區/);
});

test("id 必須是穩定 slug", async () => {
  const data = clone(await loadContent());
  data.courseInfo[0].id = "課程目標";
  assert.match(validateContentData(data).join("\n"), /slug/);
});

test("課程資訊的外部資源必須使用 HTTPS", async () => {
  const data = clone(await loadContent());
  data.courseInfo[1].blocks[4].items[0].url = "http://example.com";
  assert.match(validateContentData(data).join("\n"), /必須使用 HTTPS/);
});
