# Beyza Yıldır — Website Design

## Purpose

Build a bilingual, image-led artist website for **Beyza Yıldır**. It presents
visual work to a general audience, gives Beyza a straightforward way to publish
work and writing from a phone or computer, and feels like a colourful
independent art magazine rather than a storefront or a generic portfolio.

## Confirmed scope

- Public, responsive artist website published through GitHub Pages.
- Turkish and English versions of each public text entry.
- Work categories: **Photography**, **Collages**, **Drawings**, **Films**, and
  **Video art**.
- Work can optionally belong to a project/series; a project/series can contain
  several works.
- Blog, About, Exhibitions, Contact, and social links in the footer.
- A small, mobile-friendly admin studio for drafts, publishing, editing and
  unpublishing works, writing and exhibition announcements.
- E-mail one-time-code access for Beyza; an authenticator app is not required.

## Explicit non-goals for v1

- E-commerce, prices, shopping cart, payments, commissions, or an artwork
  marketplace.
- Public accounts, comments, likes, newsletters, or a multi-author workflow.
- Automatic machine translation. Turkish and English are authored separately.
- Video-file hosting. Film and Video art entries use a hosted video/embed URL
  plus an image cover; this keeps the first version affordable and quick.

## Public information architecture

Desktop navigation, in the confirmed order:

`About · Blog · Photography · Collages · Drawings · Films · Video art · Contact`

The **Beyza Yıldır** name/mark returns to the home page. On smaller desktop
widths and mobile, the same list appears in a full-height, touch-friendly menu.

### Home

1. A large artist-name masthead and one featured work.
2. Colourful linked category highlights, one for each of the five media.
3. Selected works drawn from across the archive.
4. Latest writing.
5. Current or upcoming exhibition/event.

### Category and work pages

Each category is a visual archive with artwork shown at its natural aspect
ratio. A work page has an image or video cover, a Turkish/English switch,
title, description, year, category and optional project/series link. A
multi-image work uses an accessible gallery; related work appears after the
main detail.

### Blog, About, Exhibitions, and Contact

Blog posts have a cover image, title, date and a deliberately limited rich-text
format (heading, paragraph, bold, italic, link and quote). About includes a
biography, practice and selected history. Exhibitions lists current/upcoming and
past events. Contact exposes chosen e-mail and social links only. The footer
repeats the social links on every page.

## Visual direction

The design is a **colourful independent art magazine / fanzine**, not an
all-black punk template. Warm cream provides breathing room; cobalt, coral red,
acid lime and black-ink accents establish energy. Large poster-like typography
is reserved for names and headings; long text uses a calm, readable companion
face. Subtle paper grain, halftone marks, labels and collage edges provide the
punk inflection without competing with artwork. The site is mobile-first:
large tap targets, single-column flow, responsive images and no hover-only
interaction.

## Admin studio

`/studio` is a protected, deliberately small publishing interface:

- Start screen: **New work**, **New writing**, **New exhibition**, followed by
  drafts and published content.
- Work editor: image upload(s), cover choice, category, optional series/project,
  Turkish title/description, English title/description, draft/publish state.
- Writing editor: cover image, Turkish and English title/summary/body, then
  draft/publish state.
- Exhibition editor: date range, location, optional link/image, and bilingual
  title/description.
- Existing items can be edited or unpublished. Destructive deletion requires a
  clear confirmation.

## Technical architecture

```text
Browser ── public pages ──> GitHub Pages
   │                              │
   └──── read-only content API ───┴──> Cloudflare Worker ──> D1
                                             │
                                             └──────────────> R2 images

Beyza ── e-mail one-time PIN ──> Cloudflare Access ──> /studio + /api/admin/*
```

- **GitHub Pages:** versioned static site source and public delivery.
- **Cloudflare Worker:** public read API, protected write API, image URL
  handling, validation and safe content transformations.
- **Cloudflare D1:** structured content records, ordering and publication
  states.
- **Cloudflare R2:** original uploads and generated web image variants; public
  pages receive optimized delivery URLs, never storage credentials.
- **Cloudflare Access:** restrict both `/studio/*` and `/api/admin/*` to
  Beyza's exact approved e-mail address using one-time-PIN sign-in. A valid
  Access JWT is verified by the Worker for every write. Cloudflare documents
  that OTPs are single-use, expire after ten minutes, and should be paired with
  an allow policy for specific e-mail addresses.

## Content rules and safety

- Every public record has `draft` or `published` status. Public endpoints never
  return drafts.
- Both language variants are required to publish; drafts may be incomplete.
- Upload validation accepts only safe image formats and size limits. The Worker
  creates web-friendly variants and strips unneeded source metadata before
  public delivery.
- A work uses `category`, `year`, optional `projectId`, tags, images and
  bilingual title/description. Category names begin as the fixed confirmed
  list; adding a new one later is an intentional admin change.
- Video data stores an allowlisted embed/link URL and cover image rather than
  accepting arbitrary video-file uploads.
- Admin mutations return clear, non-technical errors and preserve form input on
  failure. Failed uploads never publish a partial record.

## Reliability, scale, maintenance assumptions

- One administrator in v1; no role management required.
- Initial capacity targets a normal personal portfolio: hundreds to a few
  thousand images, a modest number of posts, and normal public traffic.
- Public pages remain readable from the static build if the content API is
  momentarily unavailable; content updates become visible when the site next
  fetches/revalidates its published feed.
- The studio does not silently retry or duplicate a publish action. It displays
  the result and allows Beyza to retry intentionally.
- No passwords or Cloudflare credentials are stored by the website. The owner
  keeps a recovery path for the authorized mailbox.

## Verification plan

1. Test each page and category in Turkish and English at phone, tablet and
   desktop widths.
2. Verify keyboard navigation, image alt-text workflow, visible focus states,
   language controls and colour contrast.
3. Test the complete studio journey on a phone: e-mail sign-in, create draft,
   add bilingual content/images, publish, edit and unpublish.
4. Confirm blocked e-mail addresses cannot access either studio pages or admin
   API routes; confirm public API never returns a draft.
5. Exercise oversized/invalid uploads, interrupted network, image-processing
   failure and expired sign-in handling.
6. Measure mobile page load and confirm responsive images avoid downloading
   desktop-sized media unnecessarily.

## Decision log

| Decision | Alternatives considered | Rationale |
| --- | --- | --- |
| Bilingual authored content | Turkish only; automatic translation | Art writing needs controlled voice in both languages. |
| Five fixed launch categories | Free-form categories; one generic Works archive | Clear public navigation and simple editorial control. |
| Optional projects/series | Only individual works; projects only | Supports both isolated and connected bodies of work. |
| Draft + publish workflow | Immediate publishing only | Lets Beyza prepare and review work before it is public. |
| E-mail one-time PIN | Password; required authenticator app | Least friction for one administrator while retaining protected access. |
| GitHub Pages + Cloudflare Worker/D1/R2/Access | Git CMS; Cloudflare Pages-only | Meets the GitHub publishing requirement while giving Beyza a code-free studio. |
| Embeds for video in v1 | Hosting original video files | Keeps cost, upload complexity and delivery risk low. |
