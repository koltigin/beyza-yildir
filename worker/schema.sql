CREATE TABLE IF NOT EXISTS content (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('work', 'post', 'exhibition')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  category TEXT,
  project_id TEXT,
  title_tr TEXT NOT NULL,
  title_en TEXT NOT NULL,
  body_tr TEXT NOT NULL,
  body_en TEXT NOT NULL,
  cover_key TEXT,
  media_json TEXT NOT NULL DEFAULT '[]',
  event_start TEXT,
  event_end TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS content_public_index ON content (status, type, category, created_at DESC);

CREATE TABLE IF NOT EXISTS site_pages (
  slug TEXT PRIMARY KEY,
  title_tr TEXT NOT NULL,
  title_en TEXT NOT NULL,
  body_tr TEXT NOT NULL,
  body_en TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS awards (
  id TEXT PRIMARY KEY,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  title_tr TEXT NOT NULL,
  title_en TEXT NOT NULL,
  body_tr TEXT NOT NULL,
  body_en TEXT NOT NULL,
  award_year TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS awards_public_index ON awards (status, award_year DESC, created_at DESC);
