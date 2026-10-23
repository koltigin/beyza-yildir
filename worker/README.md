# Cloudflare content API

This Worker is deliberately separated from the GitHub Pages artifact. It owns
published content data and media; the static site reads only the public API.

## Local and production configuration

1. Copy `.dev.vars.example` to `.dev.vars` and use the eventual public domain.
2. Create D1 and R2 resources in Cloudflare, then replace the placeholder D1
   ID in `wrangler.toml`.
3. Apply `schema.sql` to the D1 database.
4. Configure custom-domain Worker routes for `/api/*` and `/media/*`.
5. Create Cloudflare Access policies that allow Beyza's exact e-mail address
   and protect `/studio/*` and `/api/admin/*`.

The public routes never return draft content. Admin routes require the Access
policy before they reach the Worker.

## Routes

- `GET /api/public/works?category=` — published work archive
- `GET /api/public/posts` — published blog entries
- `GET /api/public/exhibitions` — published events
- `GET /api/public/content/:id` — one published work, post, or exhibition
- `GET|POST /api/admin/content` — protected content list/create
- `PATCH|DELETE /api/admin/content/:id` — protected publish state/delete
- `POST /api/admin/media` — protected image upload
