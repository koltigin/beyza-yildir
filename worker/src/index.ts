interface Env {
  DB: D1Database;
  MEDIA: R2Bucket;
  PUBLIC_ORIGIN: string;
  RESEND_API_KEY?: string;
  RESEND_FROM?: string;
}

const allowedCategories = new Set(["Photography", "Collages", "Drawings", "Films", "Video art"]);
const publicHeaders = { "content-type": "application/json; charset=UTF-8", "access-control-allow-origin": "*", "cache-control": "public, max-age=60" };
const adminHeaders = { "content-type": "application/json; charset=UTF-8", "cache-control": "no-store" };

function json(body: unknown, status = 200, headers = publicHeaders) {
  return new Response(JSON.stringify(body), { status, headers });
}
function requireAccess(request: Request) {
  // Cloudflare Access must protect the /api/admin/* route. This header is
  // injected after a successful Access policy evaluation, never by the studio.
  // Some Access configurations forward the authenticated email header instead
  // of the JWT assertion to Worker routes, so accept either verified signal.
  return Boolean(request.headers.get("Cf-Access-Jwt-Assertion") || request.headers.get("Cf-Access-Authenticated-User-Email"));
}
function contentId() { return crypto.randomUUID(); }
function isSafeImage(request: Request) {
  return ["image/jpeg", "image/png", "image/webp"].includes(request.headers.get("content-type") || "");
}
function validEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}
function escapeHtml(value: unknown) {
  return String(value || "").replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[character] || character));
}
function plainText(value: unknown, limit = 180) {
  const text = String(value || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  return text.length > limit ? `${text.slice(0, limit).trimEnd()}…` : text;
}
function publicContentPath(type: unknown, id: unknown) {
  const prefix = type === "work" ? "w" : type === "exhibition" ? "e" : "p";
  return `/${prefix}/${id}`;
}
function sharePage(item: Record<string, unknown>, env: Env, locale = "tr") {
  const path = `/${locale}${publicContentPath(item.type, item.id)}`;
  const canonical = `${env.PUBLIC_ORIGIN}${path}`;
  const title = String((locale === "en" ? (item.title_en || item.title_tr) : (item.title_tr || item.title_en)) || "Beyza Yıldır");
  const titleEn = String(item.title_en || item.title_tr || "Beyza Yıldır");
  const description = plainText(locale === "en" ? (item.body_en || item.body_tr) : (item.body_tr || item.body_en));
  const fallback = item.type === "post" ? "blog" : item.type === "exhibition" ? "exhibitions" : "works";
  const image = item.cover_key ? `${env.PUBLIC_ORIGIN}/media/${String(item.cover_key).split("/").map(encodeURIComponent).join("/")}` : `${env.PUBLIC_ORIGIN}/og/${fallback}.png`;
  const viewer = item.type === "work" ? `/${locale}/work/?id=${encodeURIComponent(String(item.id))}` : item.type === "exhibition" ? `/${locale}/event/?id=${encodeURIComponent(String(item.id))}` : `/${locale}/post/?id=${encodeURIComponent(String(item.id))}`;
  return new Response(`<!doctype html><html lang="${locale}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(title)} — Beyza Yıldır</title><meta name="description" content="${escapeHtml(description)}"><link rel="canonical" href="${canonical}"><meta property="og:type" content="article"><meta property="og:site_name" content="Beyza Yıldır"><meta property="og:locale" content="${locale === "en" ? "en_GB" : "tr_TR"}"><meta property="og:title" content="${escapeHtml(title)}"><meta property="og:description" content="${escapeHtml(description)}"><meta property="og:url" content="${canonical}"><meta property="og:image" content="${image}"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${escapeHtml(titleEn)}"><meta name="twitter:description" content="${escapeHtml(plainText(item.body_en || item.body_tr))}"><meta name="twitter:image" content="${image}"></head><body><main><h1>${escapeHtml(title)}</h1><p>${escapeHtml(description)}</p><p><a href="${viewer}">Beyza Yıldır — view content</a></p></main><script>location.replace(${JSON.stringify(viewer)})</script></body></html>`, { headers: { "content-type": "text/html; charset=UTF-8", "cache-control": "public, max-age=300" } });
}
async function readJson(request: Request) {
  try { return await request.json<Record<string, unknown>>(); } catch { return null; }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (request.method === "OPTIONS") return new Response(null, { headers: { ...publicHeaders, "access-control-allow-methods": "GET, POST, PATCH, PUT, DELETE, OPTIONS", "access-control-allow-headers": "content-type, Cf-Access-Jwt-Assertion" } });

    const localizedContentMatch = url.pathname.match(/^\/(tr|en)\/(p|w|e)\/([0-9a-f-]+)\/?$/i);
    if (localizedContentMatch && request.method === "GET") {
      const expectedType = localizedContentMatch[2] === "w" ? "work" : localizedContentMatch[2] === "e" ? "exhibition" : "post";
      const item = await env.DB.prepare("SELECT id, type, title_tr, title_en, body_tr, body_en, cover_key FROM content WHERE id = ? AND type = ? AND status = 'published'").bind(localizedContentMatch[3], expectedType).first<Record<string, unknown>>();
      return item ? sharePage(item, env, localizedContentMatch[1].toLowerCase()) : new Response("Not found", { status: 404 });
    }

    const sharedContentMatch = url.pathname.match(/^\/(p|w|e)\/([0-9a-f-]+)\/?$/i);
    if (sharedContentMatch && request.method === "GET") {
      const expectedType = sharedContentMatch[1] === "w" ? "work" : sharedContentMatch[1] === "e" ? "exhibition" : "post";
      const item = await env.DB.prepare("SELECT id, type, title_tr, title_en, body_tr, body_en, cover_key FROM content WHERE id = ? AND type = ? AND status = 'published'").bind(sharedContentMatch[2], expectedType).first<Record<string, unknown>>();
      return item ? sharePage(item, env) : new Response("Not found", { status: 404 });
    }

    const localeMatch = url.pathname.match(/^\/(tr|en)(\/.*)?$/i);
    if (localeMatch && request.method === "GET") {
      const locale = localeMatch[1].toLowerCase();
      const originPath = localeMatch[2] || "/";
      const originUrl = new URL(originPath, url.origin);
      originUrl.search = url.search;
      const response = await fetch(new Request(originUrl, request));
      if (!response.headers.get("content-type")?.includes("text/html")) return response;
      const base = originPath.endsWith("/") ? originPath : `${originPath}/`;
      return new HTMLRewriter()
        .on("head", { element(element) { element.prepend(`<base href="${base}">`, { html: true }); } })
        .on('link[rel="canonical"]', { element(element) { element.setAttribute("href", `${env.PUBLIC_ORIGIN}/${locale}${originPath}`); } })
        .on('meta[property="og:url"]', { element(element) { element.setAttribute("content", `${env.PUBLIC_ORIGIN}/${locale}${originPath}`); } })
        .transform(response);
    }

    if (url.pathname === "/sitemap-content.xml" && request.method === "GET") {
      const { results } = await env.DB.prepare("SELECT id, type, updated_at FROM content WHERE status = 'published' ORDER BY updated_at DESC").all<Record<string, unknown>>();
      const urls = results.flatMap((item) => ["tr", "en"].map((locale) => `<url><loc>${env.PUBLIC_ORIGIN}/${locale}${publicContentPath(item.type, item.id)}</loc><lastmod>${escapeHtml(String(item.updated_at || "").slice(0, 10))}</lastmod></url>`)).join("");
      return new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`, { headers: { "content-type": "application/xml; charset=UTF-8", "cache-control": "public, max-age=3600" } });
    }

    if (url.pathname === "/api/public/works" && request.method === "GET") {
      const category = url.searchParams.get("category");
      if (category && !allowedCategories.has(category)) return json({ error: "Unknown category" }, 400);
      const statement = category
        ? env.DB.prepare("SELECT id, category, title_tr, title_en, body_tr, body_en, cover_key, created_at FROM content WHERE status = 'published' AND type = 'work' AND category = ? ORDER BY created_at DESC").bind(category)
        : env.DB.prepare("SELECT id, category, title_tr, title_en, body_tr, body_en, cover_key, created_at FROM content WHERE status = 'published' AND type = 'work' ORDER BY created_at DESC");
      const { results } = await statement.all();
      return json({ works: results });
    }

    if (url.pathname === "/api/public/posts" && request.method === "GET") {
      const { results } = await env.DB.prepare("SELECT id, title_tr, title_en, body_tr, body_en, cover_key, created_at FROM content WHERE status = 'published' AND type = 'post' ORDER BY created_at DESC LIMIT 12").all();
      return json({ posts: results });
    }

    if (url.pathname === "/api/public/exhibitions" && request.method === "GET") {
      const { results } = await env.DB.prepare("SELECT id, title_tr, title_en, body_tr, body_en, cover_key, event_start, event_end, created_at FROM content WHERE status = 'published' AND type = 'exhibition' ORDER BY event_start DESC, created_at DESC").all();
      return json({ exhibitions: results });
    }

    if (url.pathname === "/api/public/page/about" && request.method === "GET") {
      const page = await env.DB.prepare("SELECT title_tr, title_en, body_tr, body_en, updated_at FROM site_pages WHERE slug = 'about'").first();
      return page ? json({ page }) : json({ error: "Not found" }, 404);
    }

    if (url.pathname === "/api/public/awards" && request.method === "GET") {
      const { results } = await env.DB.prepare("SELECT id, title_tr, title_en, body_tr, body_en, award_year, created_at FROM awards WHERE status = 'published' ORDER BY award_year DESC, created_at DESC").all();
      return json({ awards: results });
    }

    if (url.pathname === "/api/contact" && request.method === "POST") {
      const origin = request.headers.get("origin");
      if (origin && origin !== env.PUBLIC_ORIGIN) return json({ error: "Origin not allowed" }, 403, adminHeaders);
      const payload = await readJson(request);
      if (!payload) return json({ error: "Invalid message" }, 400, adminHeaders);
      if (String(payload.website || "").trim()) return json({ ok: true }, 200, adminHeaders);
      const name = String(payload.name || "").trim();
      const email = String(payload.email || "").trim();
      const message = String(payload.message || "").trim();
      if (!name || !validEmail(email) || !message || name.length > 100 || message.length > 5000) return json({ error: "Lütfen tüm alanları geçerli biçimde doldurun." }, 400, adminHeaders);
      if (!env.RESEND_API_KEY) return json({ error: "Mesaj servisi henüz yapılandırılmadı." }, 503, adminHeaders);
      const sent = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { authorization: `Bearer ${env.RESEND_API_KEY}`, "content-type": "application/json" },
        body: JSON.stringify({
          from: env.RESEND_FROM || "Beyza Yıldır <contact@yildirbeyza.com>",
          to: ["yildirbeyza@gmail.com"],
          reply_to: email,
          subject: `Yeni web mesajı — ${name}`,
          text: `Ad: ${name}\nE-posta: ${email}\n\n${message}`
        })
      });
      if (!sent.ok) return json({ error: "Mesaj şu anda gönderilemedi. Lütfen daha sonra tekrar deneyin." }, 502, adminHeaders);
      return json({ ok: true }, 200, adminHeaders);
    }

    const publicContentMatch = url.pathname.match(/^\/api\/public\/content\/([0-9a-f-]+)$/i);
    if (publicContentMatch && request.method === "GET") {
      const item = await env.DB.prepare("SELECT id, type, category, project_id, title_tr, title_en, body_tr, body_en, cover_key, media_json, event_start, event_end, created_at FROM content WHERE id = ? AND status = 'published'").bind(publicContentMatch[1]).first();
      return item ? json({ content: item }) : json({ error: "Not found" }, 404);
    }

    if (url.pathname.startsWith("/media/") && request.method === "GET") {
      const object = await env.MEDIA.get(url.pathname.slice("/media/".length));
      if (!object) return new Response("Not found", { status: 404 });
      return new Response(object.body, { headers: { "content-type": object.httpMetadata?.contentType || "application/octet-stream", "cache-control": "public, max-age=31536000, immutable", etag: object.httpEtag } });
    }

    if (!url.pathname.startsWith("/api/admin/")) return json({ error: "Not found" }, 404);
    if (!requireAccess(request)) return json({ error: "Unauthorized" }, 401, adminHeaders);

    if (url.pathname === "/api/admin/content" && request.method === "GET") {
      const { results } = await env.DB.prepare("SELECT * FROM content ORDER BY updated_at DESC").all();
      return json({ content: results }, 200, adminHeaders);
    }

    if (url.pathname === "/api/admin/page/about" && request.method === "GET") {
      const page = await env.DB.prepare("SELECT title_tr, title_en, body_tr, body_en, updated_at FROM site_pages WHERE slug = 'about'").first();
      return page ? json({ page }, 200, adminHeaders) : json({ page: null }, 200, adminHeaders);
    }

    if (url.pathname === "/api/admin/page/about" && request.method === "PUT") {
      const payload = await readJson(request);
      if (!payload || !String(payload.titleTr || "").trim() || !String(payload.titleEn || "").trim() || !String(payload.bodyTr || "").trim() || !String(payload.bodyEn || "").trim()) return json({ error: "Türkçe ve İngilizce içerik gereklidir" }, 400, adminHeaders);
      await env.DB.prepare("INSERT INTO site_pages (slug, title_tr, title_en, body_tr, body_en, updated_at) VALUES ('about', ?, ?, ?, ?, CURRENT_TIMESTAMP) ON CONFLICT(slug) DO UPDATE SET title_tr = excluded.title_tr, title_en = excluded.title_en, body_tr = excluded.body_tr, body_en = excluded.body_en, updated_at = CURRENT_TIMESTAMP")
        .bind(String(payload.titleTr).trim(), String(payload.titleEn).trim(), String(payload.bodyTr).trim(), String(payload.bodyEn).trim()).run();
      return json({ ok: true }, 200, adminHeaders);
    }

    if (url.pathname === "/api/admin/awards" && request.method === "GET") {
      const { results } = await env.DB.prepare("SELECT * FROM awards ORDER BY award_year DESC, updated_at DESC").all();
      return json({ awards: results }, 200, adminHeaders);
    }

    if (url.pathname === "/api/admin/awards" && request.method === "POST") {
      const payload = await readJson(request);
      if (!payload || !["draft", "published"].includes(String(payload.status)) || !String(payload.titleTr || "").trim() || !String(payload.titleEn || "").trim() || !String(payload.bodyTr || "").trim() || !String(payload.bodyEn || "").trim()) return json({ error: "Ödülün iki dilde başlığı ve açıklaması gereklidir" }, 400, adminHeaders);
      const id = contentId();
      await env.DB.prepare("INSERT INTO awards (id, status, title_tr, title_en, body_tr, body_en, award_year) VALUES (?, ?, ?, ?, ?, ?, ?)")
        .bind(id, String(payload.status), String(payload.titleTr).trim(), String(payload.titleEn).trim(), String(payload.bodyTr).trim(), String(payload.bodyEn).trim(), String(payload.awardYear || "").trim() || null).run();
      return json({ id }, 201, adminHeaders);
    }

    const awardMatch = url.pathname.match(/^\/api\/admin\/awards\/([0-9a-f-]+)$/i);
    if (awardMatch && request.method === "PATCH") {
      const payload = await readJson(request);
      if (!payload) return json({ error: "Invalid update" }, 400, adminHeaders);
      const existing = await env.DB.prepare("SELECT * FROM awards WHERE id = ?").bind(awardMatch[1]).first<Record<string, unknown>>();
      if (!existing) return json({ error: "Not found" }, 404, adminHeaders);
      const status = payload.status ?? existing.status;
      const titleTr = String(payload.titleTr ?? existing.title_tr).trim();
      const titleEn = String(payload.titleEn ?? existing.title_en).trim();
      const bodyTr = String(payload.bodyTr ?? existing.body_tr).trim();
      const bodyEn = String(payload.bodyEn ?? existing.body_en).trim();
      if (!["draft", "published"].includes(String(status)) || !titleTr || !titleEn || !bodyTr || !bodyEn) return json({ error: "Invalid award update" }, 400, adminHeaders);
      const result = await env.DB.prepare("UPDATE awards SET status = ?, title_tr = ?, title_en = ?, body_tr = ?, body_en = ?, award_year = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?")
        .bind(String(status), titleTr, titleEn, bodyTr, bodyEn, String((payload.awardYear ?? existing.award_year) || "").trim() || null, awardMatch[1]).run();
      return result.meta.changes ? json({ ok: true }, 200, adminHeaders) : json({ error: "Not found" }, 404, adminHeaders);
    }

    if (awardMatch && request.method === "DELETE") {
      const result = await env.DB.prepare("DELETE FROM awards WHERE id = ?").bind(awardMatch[1]).run();
      return result.meta.changes ? json({ ok: true }, 200, adminHeaders) : json({ error: "Not found" }, 404, adminHeaders);
    }

    if (url.pathname === "/api/admin/content" && request.method === "POST") {
      const payload = await readJson(request);
      if (!payload || !["work", "post", "exhibition"].includes(String(payload.type)) || !["draft", "published"].includes(String(payload.status))) return json({ error: "Invalid content type or status" }, 400, adminHeaders);
      if (!String(payload.titleTr || "").trim() || !String(payload.titleEn || "").trim() || !String(payload.bodyTr || "").trim() || !String(payload.bodyEn || "").trim()) return json({ error: "Both Turkish and English content are required" }, 400, adminHeaders);
      if (payload.type === "work" && !allowedCategories.has(String(payload.category))) return json({ error: "Invalid category" }, 400, adminHeaders);
      const id = contentId();
      const media = Array.isArray(payload.media) ? payload.media : [];
      const coverKey = String(payload.coverKey || media[0]?.key || "") || null;
      await env.DB.prepare("INSERT INTO content (id, type, status, category, project_id, title_tr, title_en, body_tr, body_en, cover_key, media_json, event_start, event_end) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
        .bind(id, payload.type, payload.status, payload.category || null, payload.projectId || null, String(payload.titleTr).trim(), String(payload.titleEn).trim(), String(payload.bodyTr).trim(), String(payload.bodyEn).trim(), coverKey, JSON.stringify(media), payload.eventStart || null, payload.eventEnd || null).run();
      return json({ id }, 201, adminHeaders);
    }

    const contentMatch = url.pathname.match(/^\/api\/admin\/content\/([0-9a-f-]+)$/i);
    if (contentMatch && request.method === "PATCH") {
      const payload = await readJson(request);
      if (!payload) return json({ error: "Invalid update" }, 400, adminHeaders);
      const existing = await env.DB.prepare("SELECT * FROM content WHERE id = ?").bind(contentMatch[1]).first<Record<string, unknown>>();
      if (!existing) return json({ error: "Not found" }, 404, adminHeaders);
      const status = payload.status ?? existing.status;
      if (!["draft", "published"].includes(String(status))) return json({ error: "Invalid status" }, 400, adminHeaders);
      const category = payload.category ?? existing.category;
      if (existing.type === "work" && !allowedCategories.has(String(category))) return json({ error: "Invalid category" }, 400, adminHeaders);
      const titleTr = String(payload.titleTr ?? existing.title_tr).trim();
      const titleEn = String(payload.titleEn ?? existing.title_en).trim();
      const bodyTr = String(payload.bodyTr ?? existing.body_tr).trim();
      const bodyEn = String(payload.bodyEn ?? existing.body_en).trim();
      if (!titleTr || !titleEn || !bodyTr || !bodyEn) return json({ error: "Both Turkish and English content are required" }, 400, adminHeaders);
      const media = Array.isArray(payload.media) ? payload.media : JSON.parse(String(existing.media_json || "[]"));
      const coverKey = Array.isArray(payload.media) ? (String(payload.coverKey || media[0]?.key || "") || null) : existing.cover_key;
      const result = await env.DB.prepare("UPDATE content SET status = ?, category = ?, project_id = ?, title_tr = ?, title_en = ?, body_tr = ?, body_en = ?, cover_key = ?, media_json = ?, event_start = ?, event_end = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?")
        .bind(status, category, payload.projectId ?? existing.project_id, titleTr, titleEn, bodyTr, bodyEn, coverKey, JSON.stringify(media), payload.eventStart ?? existing.event_start, payload.eventEnd ?? existing.event_end, contentMatch[1]).run();
      return result.meta.changes ? json({ ok: true }, 200, adminHeaders) : json({ error: "Not found" }, 404, adminHeaders);
    }

    if (contentMatch && request.method === "DELETE") {
      const existing = await env.DB.prepare("SELECT cover_key, media_json FROM content WHERE id = ?").bind(contentMatch[1]).first<{ cover_key: string | null; media_json: string }>();
      if (!existing) return json({ error: "Not found" }, 404, adminHeaders);
      const media = JSON.parse(existing.media_json || "[]") as Array<{ key?: string }>;
      const keys = [...new Set([existing.cover_key, ...media.map((item) => item.key)].filter(Boolean))] as string[];
      if (keys.length) await env.MEDIA.delete(keys);
      await env.DB.prepare("DELETE FROM content WHERE id = ?").bind(contentMatch[1]).run();
      return json({ ok: true }, 200, adminHeaders);
    }

    if (url.pathname === "/api/admin/media" && request.method === "POST") {
      if (!isSafeImage(request)) return json({ error: "Only JPEG, PNG and WebP images are accepted" }, 415, adminHeaders);
      const maxBytes = 12 * 1024 * 1024;
      const contentLength = Number(request.headers.get("content-length") || 0);
      if (contentLength > maxBytes) return json({ error: "Image exceeds 12 MB limit" }, 413, adminHeaders);
      const body = await request.arrayBuffer();
      if (body.byteLength > maxBytes) return json({ error: "Image exceeds 12 MB limit" }, 413, adminHeaders);
      const extension = request.headers.get("content-type")?.split("/")[1] || "jpg";
      const key = `uploads/${new Date().toISOString().slice(0, 10)}/${contentId()}.${extension}`;
      await env.MEDIA.put(key, body, { httpMetadata: { contentType: request.headers.get("content-type") || "image/jpeg" } });
      return json({ key, url: `${env.PUBLIC_ORIGIN}/media/${key}` }, 201, adminHeaders);
    }
    return json({ error: "Not found" }, 404, adminHeaders);
  }
};
