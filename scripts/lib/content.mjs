import { readFile } from "node:fs/promises";
import path from "node:path";

export const PROJECT_ROOT = path.resolve(import.meta.dirname, "..", "..");
export const CONTENT_DIR = path.join(PROJECT_ROOT, "content");

const FILES = {
  site: "site.json",
  announcements: "announcements.json",
  supplements: "supplements.json",
  assignments: "assignments.json",
  courseInfo: "course-info.json"
};

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const DATE_TIME_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:Z|[+-]\d{2}:\d{2})$/;
const DROPBOX_HOSTS = new Set(["dropbox.com", "www.dropbox.com"]);
const ASSIGNMENT_STATUSES = new Set(["planned", "upcoming", "open", "closed"]);

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function requireObject(value, location, errors) {
  if (!isObject(value)) errors.push(`${location} 必須是物件。`);
}

function requireArray(value, location, errors) {
  if (!Array.isArray(value)) errors.push(`${location} 必須是陣列。`);
}

function requireString(value, location, errors) {
  if (typeof value !== "string" || value.trim() === "") {
    errors.push(`${location} 必須是非空白文字。`);
  }
}

function validateSlug(value, location, errors) {
  requireString(value, location, errors);
  if (typeof value === "string" && !SLUG_PATTERN.test(value)) {
    errors.push(`${location} 必須使用小寫英數與單一連字號組成的 slug。`);
  }
}

function validateDate(value, location, errors) {
  if (typeof value !== "string" || !DATE_PATTERN.test(value) || Number.isNaN(Date.parse(`${value}T00:00:00Z`))) {
    errors.push(`${location} 必須是有效的 YYYY-MM-DD 日期。`);
  }
}

function validateDateTime(value, location, errors) {
  if (typeof value !== "string" || !DATE_TIME_PATTERN.test(value) || Number.isNaN(Date.parse(value))) {
    errors.push(`${location} 必須是包含時區的有效 ISO 8601 日期時間。`);
  }
}

function parseHttpsUrl(value, location, errors) {
  if (typeof value !== "string" || value.trim() === "") {
    errors.push(`${location} 必須是 HTTPS URL。`);
    return null;
  }

  try {
    const url = new URL(value);
    if (url.protocol !== "https:") errors.push(`${location} 必須使用 HTTPS。`);
    return url;
  } catch {
    errors.push(`${location} 不是有效 URL。`);
    return null;
  }
}

function validateDropboxFileUrl(value, location, errors) {
  const url = parseHttpsUrl(value, location, errors);
  if (!url) return;

  if (!DROPBOX_HOSTS.has(url.hostname)) {
    errors.push(`${location} 必須使用 dropbox.com 個別檔案分享網址。`);
  }
  if (url.pathname.startsWith("/sh/") || (!url.pathname.startsWith("/s/") && !url.pathname.startsWith("/scl/fi/"))) {
    errors.push(`${location} 必須是 Dropbox 個別檔案網址，不可使用共用資料夾網址。`);
  }
  if (url.searchParams.get("dl") !== "1") {
    errors.push(`${location} 必須包含 dl=1。`);
  }
}

function validateFileRequestUrl(value, location, errors) {
  const url = parseHttpsUrl(value, location, errors);
  if (!url) return;

  if (!DROPBOX_HOSTS.has(url.hostname) || !url.pathname.startsWith("/request/")) {
    errors.push(`${location} 必須是 Dropbox File Request URL（/request/），不可使用一般分享網址。`);
  }
}

function rejectPlannedUrls(item, location, errors) {
  if (item.status !== "planned") return;
  for (const key of ["url", "download_url", "submission_url", "href"]) {
    if (Object.hasOwn(item, key)) {
      errors.push(`${location} 為 planned 時不得設定 ${key}。`);
    }
  }
}

function validateSite(site, errors) {
  requireObject(site, "site", errors);
  if (!isObject(site)) return;

  for (const key of ["semester", "course_title", "site_title", "purpose", "official_source_notice", "access_notice", "timezone", "robots"]) {
    requireString(site[key], `site.${key}`, errors);
  }
  if (site.timezone !== "Asia/Taipei") errors.push("site.timezone 必須是 Asia/Taipei。");
  if (site.robots !== "noindex, nofollow") errors.push("site.robots 必須是 noindex, nofollow。");
}

function validateAnnouncements(items, errors) {
  requireArray(items, "announcements", errors);
  if (!Array.isArray(items)) return;

  const ids = new Set();
  items.forEach((item, index) => {
    const location = `announcements[${index}]`;
    requireObject(item, location, errors);
    if (!isObject(item)) return;
    validateSlug(item.id, `${location}.id`, errors);
    requireString(item.title, `${location}.title`, errors);
    requireString(item.body, `${location}.body`, errors);
    if (!["planned", "published"].includes(item.status)) errors.push(`${location}.status 必須是 planned 或 published。`);
    if (item.date !== undefined) validateDate(item.date, `${location}.date`, errors);
    if (item.status === "published" && item.date === undefined) errors.push(`${location}.date 在 published 時為必填。`);
    if (item.href !== undefined && (typeof item.href !== "string" || /^(?:[a-z]+:|\/\/|\/)/i.test(item.href))) {
      errors.push(`${location}.href 必須是本站相對路徑。`);
    }
    rejectPlannedUrls(item, location, errors);
    if (ids.has(item.id)) errors.push(`${location}.id 不可重複。`);
    ids.add(item.id);
  });
}

function validateSupplements(items, errors) {
  requireArray(items, "supplements", errors);
  if (!Array.isArray(items)) return;

  const ids = new Set();
  items.forEach((item, index) => {
    const location = `supplements[${index}]`;
    requireObject(item, location, errors);
    if (!isObject(item)) return;
    validateSlug(item.id, `${location}.id`, errors);
    requireString(item.title, `${location}.title`, errors);
    requireString(item.description, `${location}.description`, errors);
    requireString(item.file_type, `${location}.file_type`, errors);
    if (item.date !== undefined) validateDate(item.date, `${location}.date`, errors);
    if (item.updated_at !== undefined) validateDate(item.updated_at, `${location}.updated_at`, errors);
    if (!["planned", "available"].includes(item.status)) errors.push(`${location}.status 必須是 planned 或 available。`);
    rejectPlannedUrls(item, location, errors);
    if (item.status === "available") {
      validateDropboxFileUrl(item.url, `${location}.url`, errors);
      requireString(item.link_label, `${location}.link_label`, errors);
    }
    if (ids.has(item.id)) errors.push(`${location}.id 不可重複。`);
    ids.add(item.id);
  });
}

function validateResources(resources, location, errors) {
  if (resources === undefined) return;
  requireArray(resources, location, errors);
  if (!Array.isArray(resources)) return;

  resources.forEach((resource, index) => {
    const itemLocation = `${location}[${index}]`;
    requireObject(resource, itemLocation, errors);
    if (!isObject(resource)) return;
    requireString(resource.title, `${itemLocation}.title`, errors);
    if (!["planned", "available"].includes(resource.status)) errors.push(`${itemLocation}.status 必須是 planned 或 available。`);
    rejectPlannedUrls(resource, itemLocation, errors);
    if (resource.status === "available") {
      validateDropboxFileUrl(resource.url, `${itemLocation}.url`, errors);
      requireString(resource.link_label, `${itemLocation}.link_label`, errors);
    }
  });
}

function validateAssignments(data, errors) {
  requireObject(data, "assignments", errors);
  if (!isObject(data)) return;
  requireArray(data.items, "assignments.items", errors);
  requireArray(data.excluded_pending_confirmation, "assignments.excluded_pending_confirmation", errors);
  if (!Array.isArray(data.items)) return;

  const expectedIds = ["midterm-report", "final-proposal-ppt", "final-report", "final-oral-presentation"];
  const actualIds = [];
  const ids = new Set();

  data.items.forEach((item, index) => {
    const location = `assignments.items[${index}]`;
    requireObject(item, location, errors);
    if (!isObject(item)) return;
    validateSlug(item.id, `${location}.id`, errors);
    requireString(item.title, `${location}.title`, errors);
    actualIds.push(item.id);
    if (!ASSIGNMENT_STATUSES.has(item.status)) errors.push(`${location}.status 必須是 planned、upcoming、open 或 closed。`);
    for (const key of ["open_at", "deadline", "start_at", "end_at"]) {
      if (item[key] !== undefined) validateDateTime(item[key], `${location}.${key}`, errors);
    }
    if (item.submission_formats !== undefined) {
      requireArray(item.submission_formats, `${location}.submission_formats`, errors);
      if (Array.isArray(item.submission_formats)) {
        item.submission_formats.forEach((value, formatIndex) => requireString(value, `${location}.submission_formats[${formatIndex}]`, errors));
      }
    }
    rejectPlannedUrls(item, location, errors);
    if (item.submission_url !== undefined) {
      validateFileRequestUrl(item.submission_url, `${location}.submission_url`, errors);
      requireString(item.upload_label, `${location}.upload_label`, errors);
    }
    validateResources(item.resources, `${location}.resources`, errors);
    if (ids.has(item.id)) errors.push(`${location}.id 不可重複。`);
    ids.add(item.id);
  });

  if (JSON.stringify(actualIds) !== JSON.stringify(expectedIds)) {
    errors.push(`assignments.items 順序必須是 ${expectedIds.join("、")}。`);
  }

  if (Array.isArray(data.excluded_pending_confirmation)) {
    data.excluded_pending_confirmation.forEach((item, index) => {
      const location = `assignments.excluded_pending_confirmation[${index}]`;
      requireObject(item, location, errors);
      if (!isObject(item)) return;
      requireString(item.title, `${location}.title`, errors);
      requireString(item.reason, `${location}.reason`, errors);
    });
  }
}

function validateCourseInfo(items, errors) {
  requireArray(items, "courseInfo", errors);
  if (!Array.isArray(items)) return;
  const expectedIds = ["course-overview", "materials", "teacher", "grading", "leave", "screen-capture", "ai-policy"];
  const actualIds = [];

  items.forEach((item, index) => {
    const location = `courseInfo[${index}]`;
    requireObject(item, location, errors);
    if (!isObject(item)) return;
    validateSlug(item.id, `${location}.id`, errors);
    requireString(item.title, `${location}.title`, errors);
    actualIds.push(item.id);
    if (!["planned", "published"].includes(item.status)) errors.push(`${location}.status 必須是 planned 或 published。`);
    rejectPlannedUrls(item, location, errors);
    if (item.status === "published") validateCourseBlocks(item.blocks, `${location}.blocks`, errors);
    if (item.status === "planned") requireString(item.note, `${location}.note`, errors);
  });

  if (JSON.stringify(actualIds) !== JSON.stringify(expectedIds)) {
    errors.push(`courseInfo 順序必須是 ${expectedIds.join("、")}。`);
  }
}

function validateCourseBlocks(blocks, location, errors) {
  requireArray(blocks, location, errors);
  if (!Array.isArray(blocks) || blocks.length === 0) return;

  const textTypes = new Set(["paragraph", "heading", "callout", "quote"]);
  const listTypes = new Set(["list", "ordered-list"]);

  blocks.forEach((block, index) => {
    const blockLocation = `${location}[${index}]`;
    requireObject(block, blockLocation, errors);
    if (!isObject(block)) return;
    requireString(block.type, `${blockLocation}.type`, errors);

    if (textTypes.has(block.type)) {
      requireString(block.text, `${blockLocation}.text`, errors);
      return;
    }
    if (listTypes.has(block.type)) {
      requireArray(block.items, `${blockLocation}.items`, errors);
      if (Array.isArray(block.items)) block.items.forEach((item, itemIndex) => requireString(item, `${blockLocation}.items[${itemIndex}]`, errors));
      return;
    }
    if (block.type === "links") {
      requireArray(block.items, `${blockLocation}.items`, errors);
      if (Array.isArray(block.items)) {
        block.items.forEach((item, itemIndex) => {
          const itemLocation = `${blockLocation}.items[${itemIndex}]`;
          requireObject(item, itemLocation, errors);
          if (!isObject(item)) return;
          requireString(item.label, `${itemLocation}.label`, errors);
          parseHttpsUrl(item.url, `${itemLocation}.url`, errors);
        });
      }
      return;
    }
    errors.push(`${blockLocation}.type 不支援；可使用 paragraph、heading、callout、quote、list、ordered-list 或 links。`);
  });
}

export function validateContentData(data) {
  const errors = [];
  validateSite(data.site, errors);
  validateAnnouncements(data.announcements, errors);
  validateSupplements(data.supplements, errors);
  validateAssignments(data.assignments, errors);
  validateCourseInfo(data.courseInfo, errors);
  return errors;
}

export async function loadContent(contentDir = CONTENT_DIR) {
  const entries = await Promise.all(
    Object.entries(FILES).map(async ([key, filename]) => {
      const filePath = path.join(contentDir, filename);
      const source = await readFile(filePath, "utf8");
      try {
        return [key, JSON.parse(source)];
      } catch (error) {
        throw new Error(`${filename} 不是有效 JSON：${error.message}`);
      }
    })
  );
  return Object.fromEntries(entries);
}

export async function loadAndValidateContent(contentDir = CONTENT_DIR) {
  const data = await loadContent(contentDir);
  const errors = validateContentData(data);
  if (errors.length > 0) {
    throw new Error(`內容驗證失敗：\n- ${errors.join("\n- ")}`);
  }
  return data;
}

export const validators = {
  validateDate,
  validateDateTime,
  validateDropboxFileUrl,
  validateFileRequestUrl
};
