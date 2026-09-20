import assert from "node:assert/strict";
import { test } from "node:test";
import { loadAndValidateContent } from "../scripts/lib/content.mjs";
import { renderAssignments, renderCourseInfo, renderHome, renderSupplements } from "../scripts/lib/render.mjs";

const data = await loadAndValidateContent();
const pages = {
  home: renderHome(data),
  supplements: renderSupplements(data),
  assignments: renderAssignments(data),
  courseInfo: renderCourseInfo(data)
};

test("每頁都有 noindex、skip link、landmarks 與單一 h1", () => {
  for (const [name, html] of Object.entries(pages)) {
    assert.match(html, /<meta name="robots" content="noindex, nofollow">/, name);
    assert.match(html, /class="skip-link"/, name);
    for (const landmark of ["header", "nav", "main", "footer"]) assert.match(html, new RegExp(`<${landmark}\\b`), name);
    assert.equal((html.match(/<h1\b/g) ?? []).length, 1, name);
  }
});

test("四個導覽項目依規格固定排序", () => {
  for (const html of Object.values(pages)) {
    const positions = ["首頁", "補充教材", "作業與繳交", "課程資訊"].map((label) => html.indexOf(`>${label}</a>`));
    assert.ok(positions.every((position, index) => index === 0 || position > positions[index - 1]));
  }
});

test("教材不產生假連結，四項作業共用已確認的上傳連結", () => {
  assert.doesNotMatch(pages.supplements, /href="https:\/\/www\.dropbox\.com/);
  const fileRequestUrl = "https://www.dropbox.com/request/x53x1jd4w5s5fgl7p0cz";
  assert.equal((pages.assignments.match(new RegExp(`href="${fileRequestUrl}"`, "g")) ?? []).length, 4);
  for (const label of ["上傳期中報告檔案", "上傳期末報告構想 PPT", "上傳期末報告 PPT 與 Word", "上傳期末口頭報告資料"]) {
    assert.match(pages.assignments, new RegExp(`>${label}</a>`));
  }
  assert.match(pages.supplements, /狀態：資料待提供/);
  assert.doesNotMatch(pages.supplements, /教材取得方式|日期、格式及 Dropbox 個別檔案連結待提供/);
  assert.doesNotMatch(pages.assignments, /Dropbox File Request|依繳交流程排列四項作業；作業說明與繳交方式會在教師確認後更新/);
});

test("作業頁不顯示開始或截止時間", () => {
  assert.doesNotMatch(pages.assignments, /開放時間|截止時間|開始時間|結束時間|Asia\/Taipei/);
});

test("期末報告範例位於期末報告卡片內", () => {
  const reportStart = pages.assignments.indexOf('id="final-report"');
  const reportEnd = pages.assignments.indexOf('id="final-oral-presentation"');
  const example = pages.assignments.indexOf("期末報告範例－金融科技產業趨勢分析");
  assert.ok(reportStart < example && example < reportEnd);
});

test("課程資訊只顯示已提供內容與具體資源連結", () => {
  assert.match(pages.courseInfo, /課程基本資訊及整體學習目標/);
  assert.match(pages.courseInfo, /開啟全球專利檢索系統 GPSS/);
  assert.match(pages.courseInfo, /查看授課教師聯絡資訊與 Office Hour（Canva）/);
  assert.doesNotMatch(pages.courseInfo, /資料待提供|完整內容待教師提供/);
  assert.doesNotMatch(pages.courseInfo, /以下整理本學期已提供的課程資料與參考資源/);
});
