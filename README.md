# Beyza Yıldır website

A bilingual, image-led artist portfolio and publishing studio. The public site
is plain static HTML/CSS/JavaScript for GitHub Pages. The `worker/` directory
contains the Cloudflare Worker/D1/R2 foundation that will replace the preview
content once the Cloudflare resources are configured.

## Preview locally

```sh
npm run start
```

Open `http://localhost:4173`. The publishing studio preview is at
`http://localhost:4173/studio/`.

## Before production

1. Create an R2 bucket named `beyza-yildir-media` and a D1 database named
   `beyza-yildir-content` in Cloudflare.
2. Insert the D1 ID in `worker/wrangler.toml`; add the public domain as the
   `PUBLIC_ORIGIN` Worker variable.
3. Run `wrangler d1 execute beyza-yildir-content --file=worker/schema.sql`.
4. Deploy the Worker on a custom-domain route. Do not expose a `workers.dev`
   URL for the admin API.
5. In Cloudflare Access, enable One-time PIN and create an **allow policy for
   Beyza's exact e-mail address**. Protect both `/studio/*` and `/api/admin/*`.
6. Replace the three `#` social links and the preview text/artwork with
   Beyza's real material before publishing.

## GitHub Pages

The `.github/workflows/deploy-pages.yml` workflow publishes `public/` whenever
`main` is pushed. In the repository settings, select **Settings → Pages →
Source: GitHub Actions** before the first push. A custom domain can be added
after the first successful Pages deployment; Cloudflare should then proxy the
domain and route `/api/*` to the Worker.

The studio screen currently presents its final content form but deliberately
does not submit to the Worker until the protected Cloudflare routes exist.
