const NAV_ITEMS = [
  ["home", "首頁", "index.html"],
  ["supplements", "補充教材", "supplements/index.html"],
  ["assignments", "作業與繳交", "assignments/index.html"],
  ["course-info", "課程資訊", "course-info/index.html"]
];

const STATUS_LABELS = {
  planned: "資料待提供",
  upcoming: "尚未開放",
  open: "開放繳交",
  closed: "已截止",
  available: "已提供",
  published: "已發布"
};

export function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatDate(value) {
  if (!value) return "日期待提供";
  const [year, month, day] = value.split("-").map(Number);
  return `${year} 年 ${month} 月 ${day} 日`;
}

function statusBadge(status) {
  return `<span class="status status--${escapeHtml(status)}">狀態：${escapeHtml(STATUS_LABELS[status] ?? status)}</span>`;
}

function pageShell({ site, current, pageTitle, description, lead, body, depth }) {
  const prefix = depth === 0 ? "./" : "../";
  const fullTitle = current === "home" ? site.site_title : `${pageTitle}｜${site.site_title}`;
  const nav = NAV_ITEMS.map(([key, label, route]) => {
    const currentAttr = key === current ? ' aria-current="page"' : "";
    return `<li><a href="${prefix}${route}"${currentAttr}>${label}</a></li>`;
  }).join("");

  return `<!doctype html>
<html lang="zh-Hant">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="${escapeHtml(site.robots)}">
  <meta name="description" content="${escapeHtml(description)}">
  <title>${escapeHtml(fullTitle)}</title>
  <link rel="icon" type="image/svg+xml" href="${prefix}favicon.svg">
  <link rel="stylesheet" href="${prefix}assets/styles.css">
</head>
<body>
  <a class="skip-link" href="#main-content">跳至主要內容</a>
  <header class="site-header">
    <div class="header-inner">
      <a class="site-mark" href="${prefix}index.html" aria-label="回到 ${escapeHtml(site.site_title)}首頁">
        <span class="semester-mark" aria-hidden="true">1151</span>
        <span>${escapeHtml(site.course_title)}<small>外校生課程專區</small></span>
      </a>
      <nav aria-label="主要導覽">
        <ul>${nav}</ul>
      </nav>
    </div>
  </header>
  <main id="main-content" tabindex="-1">
    <div class="page-heading">
      <p class="eyebrow">輔仁大學｜${escapeHtml(site.semester)} 學期</p>
      <h1>${escapeHtml(pageTitle)}</h1>
      ${lead ? `<p class="lead">${escapeHtml(lead)}</p>` : ""}
    </div>
    ${body}
  </main>
  <footer>
    <div class="footer-inner">
      <p><strong>正式資訊來源：</strong>${escapeHtml(site.official_source_notice)}</p>
      <p>${escapeHtml(site.access_notice)}</p>
    </div>
  </footer>
</body>
</html>
`;
}

export function renderHome(data) {
  const announcements = [...data.announcements]
    .filter((item) => item.status === "published")
    .sort((a, b) => b.date.localeCompare(a.date));

  const announcementMarkup = announcements.length === 0
    ? `<div class="empty-state"><h2>目前沒有新公告</h2><p>課程更新會依日期由新到舊顯示在這裡。</p></div>`
    : `<div class="stack">${announcements.map((item) => `
        <article class="card announcement-card" id="${escapeHtml(item.id)}">
          <p class="meta"><time datetime="${escapeHtml(item.date)}">${formatDate(item.date)}</time></p>
          <h2>${escapeHtml(item.title)}</h2>
          <p>${escapeHtml(item.body)}</p>
          ${item.href ? `<p><a class="text-link" href="${escapeHtml(item.href)}">${escapeHtml(item.link_label)}</a></p>` : ""}
        </article>`).join("")}</div>`;

  const body = `
    <section class="notice notice--official" aria-labelledby="official-source-title">
      <h2 id="official-source-title">使用前請先確認</h2>
      <p>${escapeHtml(data.site.official_source_notice)}</p>
      <p>本站提供外校生需要的課程公告、補充教材及作業繳交資訊，不取代 TronClass。</p>
    </section>
    <section class="section-block" aria-labelledby="latest-announcements-title">
      <div class="section-heading">
        <p class="section-number" aria-hidden="true">01</p>
        <div><h2 id="latest-announcements-title">最新公告</h2><p>依日期由新到舊排列。</p></div>
      </div>
      ${announcementMarkup}
    </section>`;

  return pageShell({
    site: data.site,
    current: "home",
    pageTitle: data.site.site_title,
    description: data.site.purpose,
    lead: data.site.purpose,
    body,
    depth: 0
  });
}

export function renderSupplements(data) {
  const items = [...data.supplements].sort((a, b) => (a.date ? 0 : 1) - (b.date ? 0 : 1) || (a.date ?? "").localeCompare(b.date ?? ""));
  const cards = items.map((item) => `
      <article class="card resource-card" id="${escapeHtml(item.id)}">
        <div class="card-topline">
          <p class="meta"><span>${formatDate(item.date)}</span><span>檔案格式：${escapeHtml(item.file_type)}</span></p>
          ${statusBadge(item.status)}
        </div>
        <h2>${escapeHtml(item.title)}</h2>
        <p>${escapeHtml(item.description)}</p>
        ${item.updated_at ? `<p class="meta">更新日期：<time datetime="${escapeHtml(item.updated_at)}">${formatDate(item.updated_at)}</time></p>` : ""}
        ${item.status === "available" ? `<p><a class="button" href="${escapeHtml(item.url)}">${escapeHtml(item.link_label)}</a></p>` : item.note ? `<p class="pending-note">${escapeHtml(item.note)}</p>` : ""}
      </article>`).join("");

  const body = `
    <section class="section-block" aria-label="補充教材清單">
      <div class="stack">${cards}</div>
    </section>`;

  return pageShell({
    site: data.site,
    current: "supplements",
    pageTitle: "補充教材",
    description: `查看 ${data.site.course_title} 課程的補充教材與更新資訊。`,
    lead: "依上課日期與主題排列；可用的教材會提供明確的個別檔案下載文字。",
    body,
    depth: 1
  });
}

function assignmentResources(resources = []) {
  if (resources.length === 0) return "";
  return `<div class="nested-panel"><h3>參考資料與範例</h3>${resources.map((resource) => `
    <div class="resource-row">
      <p><strong>${escapeHtml(resource.title)}</strong></p>
      ${resource.status === "available" ? `<p><a class="text-link" href="${escapeHtml(resource.url)}">${escapeHtml(resource.link_label)}</a></p>` : `<p class="pending-note">${escapeHtml(resource.note)}</p>`}
    </div>`).join("")}</div>`;
}

export function renderAssignments(data) {
  const cards = data.assignments.items.map((item, index) => `
      <article class="card assignment-card" id="${escapeHtml(item.id)}">
        <div class="card-topline">
          <p class="step-label">作業 ${String(index + 1).padStart(2, "0")}</p>
          ${statusBadge(item.status)}
        </div>
        <h2>${escapeHtml(item.title)}</h2>
        ${item.mode ? `<p class="assignment-mode">形式：${escapeHtml(item.mode)}</p>` : ""}
        ${item.description ? `<p>${escapeHtml(item.description)}</p>` : ""}
        ${item.submission_formats?.length ? `<div class="formats"><h3>應繳格式</h3><ul>${item.submission_formats.map((format) => `<li>${escapeHtml(format)}</li>`).join("")}</ul></div>` : `<p class="pending-note">應繳格式待教師確認。</p>`}
        ${assignmentResources(item.resources)}
        ${item.submission_url ? `<p><a class="button" href="${escapeHtml(item.submission_url)}">${escapeHtml(item.upload_label)}</a></p>` : `<p class="pending-note">${escapeHtml(item.note)}</p>`}
      </article>`).join("");

  const body = `
    <section class="section-block" aria-label="作業清單">
      <div class="stack">${cards}</div>
    </section>`;

  return pageShell({
    site: data.site,
    current: "assignments",
    pageTitle: "作業與繳交",
    description: `查看 ${data.site.course_title} 的作業說明與繳交資訊。`,
    lead: "",
    body,
    depth: 1
  });
}

export function renderCourseInfo(data) {
  const renderBlock = (block) => {
    if (block.type === "paragraph") return `<p>${escapeHtml(block.text)}</p>`;
    if (block.type === "heading") return `<h3>${escapeHtml(block.text)}</h3>`;
    if (block.type === "callout") return `<p class="course-callout">${escapeHtml(block.text)}</p>`;
    if (block.type === "quote") return `<blockquote>${escapeHtml(block.text)}</blockquote>`;
    if (block.type === "list" || block.type === "ordered-list") {
      const tag = block.type === "ordered-list" ? "ol" : "ul";
      return `<${tag} class="course-list">${block.items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</${tag}>`;
    }
    if (block.type === "links") {
      return `<ul class="course-link-list">${block.items.map((item) => `<li><a href="${escapeHtml(item.url)}">${escapeHtml(item.label)}</a></li>`).join("")}</ul>`;
    }
    return "";
  };

  const sections = data.courseInfo.map((item, index) => `
      <section class="card info-card" id="${escapeHtml(item.id)}" aria-labelledby="${escapeHtml(item.id)}-title">
        <div class="card-topline"><p class="step-label">${String(index + 1).padStart(2, "0")}</p></div>
        <h2 id="${escapeHtml(item.id)}-title">${escapeHtml(item.title)}</h2>
        ${item.status === "published" ? `<div class="course-content">${item.blocks.map(renderBlock).join("")}</div>` : `<p class="pending-note">${escapeHtml(item.note)}</p>`}
      </section>`).join("");

  const body = `<div class="section-block stack">${sections}</div>`;

  return pageShell({
    site: data.site,
    current: "course-info",
    pageTitle: "課程資訊",
    description: `查看 ${data.site.course_title} 的課程簡介、教材、教師資訊、評分、請假與 AI 使用規範。`,
    lead: "課程簡介、教材、教師資訊、評分依據、請假說明與 AI 使用規範。",
    body,
    depth: 1
  });
}
