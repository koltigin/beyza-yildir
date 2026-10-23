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
