# AI Handoff Document — Dany Beats / Beat Lounge Pro

> **Read this entire document before making any changes.**
> Another AI coding agent will continue development from this repository.
> Phase 1 is complete. Do NOT implement Phase 2+ functionality without explicit instruction.

---

## 1. Project Overview

- **Project name:** Dany Beats / Beat Lounge Pro
- **Repository:** `Dany-beat-web-site`
- **Purpose:** A beat-selling website where visitors browse an instrumental catalog, preview audio, view beat details, like beats, leave comments, and inquire about purchasing via WhatsApp.

### Current Stack

| Technology | Role |
|---|---|
| TanStack Start | Full-stack React framework (SSR + SPA) |
| React 19 | UI library |
| TypeScript | Type safety |
| TanStack Router | File-based routing (type-safe) |
| TanStack Query | Server state / data fetching / caching |
| Supabase | Database (Postgres), Auth, Storage, RLS |
| Vite | Build tool / dev server |
| Bun | Package manager |
| Tailwind CSS v4 | Styling |
| Radix UI + shadcn/ui | Component primitives |
| Lucide React | Icons |
| Sonner | Toast notifications |

### Package Manager

The project uses **Bun** (`bun.lock`, `bunfig.toml`). Use `bun install` / `bun add` for dependencies, but `npm run build` / `npm run lint` also work.

---

## 2. Supabase

### Project Details

- **Project ref:** `lbzubswtoyfurfvkfxvh`
- **Project URL:** `https://lbzubswtoyfurfvkfxvh.supabase.co`
- **Status:** Already provisioned. **Do NOT recreate the Supabase project.**
- Credentials are pre-populated in `.env` (gitignored). Never commit `.env`.

### Existing Tables

| Table | Purpose | RLS |
|---|---|---|
| `profiles` | User display name, avatar, bio | Public read; users edit own |
| `user_roles` | Maps users to `admin` or `user` role | Users read own; admins read all |
| `beats` | Beat catalog (title, slug, genre, mood, BPM, key, price, licenses, tags, storage paths, status, featured) | Published beats public; admin-only CRUD |
| `likes` | User-beat like relationship (unique per user+beat) | Public read; users manage own |
| `comments` | User comments on beats (1-1000 chars) | Public read; users manage own; admins can delete |
| `analytics_events` | Event tracking (beat_view, beat_play, beat_like, beat_unlike, beat_comment, whatsapp_click, user_signup, user_login) | Anyone can insert; admins read |
| `site_settings` | Single-row producer config (name, bio, WhatsApp, social links) | Public read; admin-only write |

### Existing RPC Functions

| Function | Purpose | Access |
|---|---|---|
| `has_role(_user_id, _role)` | Check if user has a role | Used internally by RLS policies |
| `handle_new_user()` | Auto-creates profile on signup | Trigger on `auth.users` |
| `beat_public_stats()` | Returns likes/comments/plays/views per published beat | Public (`anon, authenticated`) |
| `admin_overview()` | Returns JSON summary of all metrics | Admin-only (checks `has_role`) |
| `admin_beat_stats(_beat_id)` | Per-beat stats including whatsapp clicks | Admin-only |
| `admin_events_daily(_days, _beat_id)` | Daily event counts grouped by type | Admin-only |
| `admin_users_overview()` | User list with engagement counts | Admin-only |

### Storage Buckets

| Bucket | Visibility | Purpose |
|---|---|---|
| `covers` | Public read | Beat cover art images |
| `previews` | Public read | Beat audio preview MP3s |
| `masters` | Private (admin-only) | High-quality master audio files |

### RLS Status

RLS is fully implemented on every table. **Do NOT disable RLS or weaken existing policies.** All admin-write policies check `public.has_role(auth.uid(),'admin')`.

### Migrations

Two migration files exist:
1. `supabase/migrations/20260824171737_*.sql` — Creates all tables, RLS policies, functions, triggers, and storage policies.
2. `supabase/migrations/20260824171753_*.sql` — Revokes excess grants on functions from `public` and `anon` roles.

**Do NOT create duplicate migrations for tables/functions that already exist.** Only create new migrations for schema changes (new tables, new columns, new functions).

---

## 3. Phase 1 — What Was Implemented

### Beat Detail Page (`/beats/$slug`)

A dedicated page for each beat showing:
- Cover art with featured badge
- Audio preview play/pause button (reuses the global `usePlayer` player)
- Beat title, producer name
- Live stats row (plays, views, likes, comments)
- Price and WhatsApp purchase/inquiry CTA
- Description
- Metadata grid (genre, mood, BPM, key)
- Tags
- License options (name, files, terms, price)
- Like button (with optimistic count)
- Comments section (form + list)

### Beat Slug Routing

- `src/routes/beats.tsx` — Layout route wrapping child routes in `SiteLayout` with an `<Outlet />`
- `src/routes/beats/index.tsx` — Catalog page (search, genre/mood filters, sort)
- `src/routes/beats/$slug.tsx` — Beat detail page

The route tree is auto-generated in `src/routeTree.gen.ts` by the TanStack Router Vite plugin. It correctly registers all three routes.

### Comments

- `src/lib/comments.ts` — Types, validation (1-1000 chars), `commentsByBeatQuery` (fetches comments with author profile via `profiles!inner` join)
- `src/components/site/CommentForm.tsx` — Textarea form with character counter, validation, optimistic posting, analytics tracking
- `src/components/site/CommentList.tsx` — Comment list with author avatar/name, relative timestamps, delete button (own comments or admin)

### Beat View Analytics

The detail page fires a `beat_view` analytics event once per visit using `track("beat_view", { beatId, once: true })`. The `track` function in `src/lib/analytics.ts` is fire-and-forget and never throws.

### LikeButton Optimistic Count Fix

The `LikeButton` component now displays an optimistic count that updates immediately on click:
```
optimisticCount = (count ?? 0) + (optimisticLiked ? 1 : 0) - (liked ? 1 : 0)
```
This adjusts the server-provided count by the pending like state, so the number updates instantly while the mutation is in flight.

### WhatsApp Purchase CTA

The detail page calls `startPurchase()` from `src/lib/purchase.ts`, which builds a pre-filled WhatsApp message with the beat title, price, license info, and producer name, then opens `https://wa.me/{phone}?text={message}` in a new tab. It also fires a `whatsapp_click` analytics event.

### Live Beat Statistics

The detail page queries `beatStatsByIdQuery(beatId)` which calls the `beat_public_stats()` RPC to get real-time play/view/like/comment counts.

### Audio Preview Integration

The detail page reuses the global `usePlayer()` hook from `src/lib/player.tsx`. The play button calls `toggle()` with the beat's info, and the existing `PlayerBar` at the bottom of the site shows the currently playing track with full controls.

### Files Created

| File | Purpose |
|---|---|
| `src/routes/beats/$slug.tsx` | Beat detail page route |
| `src/routes/beats/index.tsx` | Beat catalog page (extracted from old `beats.tsx`) |
| `src/lib/comments.ts` | Comment types, validation, query |
| `src/components/site/CommentForm.tsx` | Comment submission form |
| `src/components/site/CommentList.tsx` | Comment list with delete |

### Files Modified

| File | Change |
|---|---|
| `src/routes/beats.tsx` | Converted from full page to layout route with `<Outlet />` |
| `src/lib/beats.ts` | Added `beatBySlugQuery` and `beatStatsByIdQuery` |
| `src/components/site/LikeButton.tsx` | Fixed optimistic count display; added unauthenticated redirect to `/auth` |
| `src/routeTree.gen.ts` | Auto-regenerated by Vite plugin (do not edit manually) |

---

## 4. Current Routes

### Registered Routes

| Path | File | Purpose |
|---|---|---|
| `/` | `src/routes/index.tsx` | Landing/home page |
| `/about` | `src/routes/about.tsx` | About page |
| `/beats` | `src/routes/beats.tsx` | Layout route (wraps children in `SiteLayout`) |
| `/beats/` | `src/routes/beats/index.tsx` | Beat catalog with search, filters, sorting |
| `/beats/$slug` | `src/routes/beats/$slug.tsx` | Beat detail page |

### Missing Routes (Not Yet Implemented)

| Path | Phase | Purpose |
|---|---|---|
| `/auth` | Phase 2 | Signup, login, password reset |
| `/profile` | Phase 3 | Edit profile, liked beats, user's comments |
| `/admin` | Phase 4 | Admin dashboard |
| `/admin/beats` | Phase 4 | Beat CRUD management |
| `/admin/beats/new` | Phase 4 | Create new beat |
| `/admin/beats/$id/edit` | Phase 4 | Edit existing beat |
| `/admin/comments` | Phase 4 | Comment moderation |
| `/admin/users` | Phase 4 | User management |
| `/admin/settings` | Phase 4 | Site settings editor |
| `/admin/analytics` | Phase 5 | Analytics dashboard |

### Pre-existing TypeScript Errors

The following `tsc --noEmit` errors are **pre-existing** and expected — they reference routes that don't exist yet (Phase 2+):

- `src/components/site/Header.tsx` — Links to `/auth`, `/profile`, `/admin` (6 errors)
- These will resolve automatically when those routes are created in Phase 2+.

The production build (`npm run build`) passes because Vite uses esbuild (no type checking). Only `tsc --noEmit` reports these.

---

## 5. Remaining Implementation Roadmap

### Phase 2 — Authentication

- Create `/auth` route with signup, login, and password reset forms
- Use Supabase email/password auth (no magic links or social providers unless requested)
- Email confirmation stays OFF
- Track `user_signup` and `user_login` analytics events
- Redirect users back to their original page after auth (use the `redirect` query param already being passed by `CommentForm` and `LikeButton`)
- Once `/auth` route exists, remove the `as any` casts in `CommentForm.tsx` and `LikeButton.tsx`

### Phase 3 — User Profile

- Create `/profile` route
- Edit profile (display name, avatar, bio)
- Liked beats list
- User's comments list
- Protected route (redirect to `/auth` if not signed in)

### Phase 4 — Admin

- Admin shell layout (`/admin` with nested routes)
- Admin route protection: check `isAdmin` from `useAuth()` on client; RLS is the real enforcement layer
- Overview dashboard (use `admin_overview()` RPC)
- Beat CRUD: create, edit, delete beats
- Beat uploads: cover images to `covers` bucket, preview audio to `previews`, master audio to `masters`
- Publish/unpublish beats (toggle `status` between `draft` and `published`)
- Toggle `featured` flag
- Comment moderation (delete any comment — RLS already allows admin deletes)
- User management (use `admin_users_overview()` RPC)
- Settings editor (update `site_settings` row)

### Phase 5 — Analytics

- Admin analytics dashboard
- Per-beat analytics (use `admin_beat_stats()`)
- Daily analytics charts (use `admin_events_daily()`)
- Metrics: play rate, engagement rate, inquiry rate
- Time range selectors
- Charts using Recharts (already in dependencies)

### Phase 6 — Catalog Improvements

- BPM filter (range slider)
- Price filter (range slider)
- Pagination or server-side filtering if catalog grows large

### Phase 7 — Online Presence

- Supabase Realtime Presence to show currently active users on the site
- "X people viewing" indicator

### Final QA

- Security review (use the `security-review` skill)
- Responsive testing (mobile, tablet, desktop)
- Auth testing (signup, login, logout, password reset)
- Admin authorization testing (verify non-admins cannot access admin functions)
- Storage security testing (verify `masters` bucket is not publicly readable)
- Production build verification

---

## 6. Security Notes

- **Never expose `SUPABASE_SERVICE_ROLE_KEY` to the browser.** It is only for server-side code and edge functions.
- **Never commit `.env`.** It is gitignored and contains all API keys.
- **Never put secrets in GitHub.**
- **Never disable RLS.** Every table has RLS enabled with carefully scoped policies.
- **Never make the `masters` bucket publicly readable.** Only admins should have access.
- **Client-side `isAdmin` is only a UI convenience.** The database RLS policies are the real authorization layer. Never rely on client-side checks alone for security.
- **Do not recreate the Supabase project.** It is already provisioned with all tables, functions, RLS, and storage policies.
- **Do not create duplicate migrations** for tables/functions that already exist. Only create new migrations for new schema changes.
- The `has_role()` function is `SECURITY DEFINER` and is the backbone of admin authorization in RLS policies.
- `admin_overview()`, `admin_beat_stats()`, `admin_events_daily()`, and `admin_users_overview()` are all `SECURITY DEFINER` functions that check `has_role(auth.uid(),'admin')` internally — they are safe to call from the client because they enforce authorization server-side.

---

## 7. Architectural Decisions (Phase 1)

### Beat Lookup by Slug

`beatBySlugQuery(slug)` in `src/lib/beats.ts` queries the `beats` table filtered by `slug` and `status = 'published'` using `.maybeSingle()`. This ensures:
- Only published beats are accessible to the public
- Draft beats return null (triggering the "Beat not found" UI)
- The query is cached by TanStack Query under the key `["beat", slug]`

### Comments Query

`commentsByBeatQuery(beatId)` in `src/lib/comments.ts` selects from `comments` with a `profiles!inner(display_name, avatar_url)` join to fetch the author's display name and avatar in a single query. Since the `comments` table doesn't have a formal foreign key to `profiles` (only to `beats`), the Supabase TypeScript types don't recognize this join — the query result is cast through `unknown` to a local `CommentRow` type. This works correctly at runtime because `comments.user_id` matches `profiles.id`.

### Comment Validation

`validateComment(value)` checks that the trimmed content is 1-1000 characters. The database also enforces this with a `CHECK` constraint: `char_length(btrim(content)) between 1 and 1000`.

### Authentication State

`useAuth()` from `src/lib/auth.tsx` provides:
- `user` — the Supabase user object (null if not signed in)
- `profile` — the user's profile row from the `profiles` table
- `isAdmin` — boolean, true if the user has the `admin` role in `user_roles`

Components use `useAuth()` to show/hide UI elements (comment form, delete buttons, like button behavior). The actual authorization is enforced by RLS policies in the database.

### Analytics Tracking

`track(event, options)` in `src/lib/analytics.ts`:
- Fire-and-forget — never throws, never blocks UI
- Inserts a row into `analytics_events` with the event type, optional beat ID, user ID (from session), and a localStorage-based session ID
- Has an `once` option to prevent duplicate events (used for `beat_view` — one view per page visit per beat)
- Uses a module-level `Set` to deduplicate `once` events within a session

### Beat Statistics

Two approaches are used:
- `beatStatsQuery` — fetches all published beat stats at once (used by the catalog page)
- `beatStatsByIdQuery(beatId)` — fetches all stats then filters to one beat (used by the detail page)

Both call the `beat_public_stats()` RPC function. Stats are cached with a 30-second `staleTime`.

### WhatsApp Purchase

`startPurchase(intent)` in `src/lib/purchase.ts` builds a WhatsApp message with the beat title, license, price, and buyer name, then opens `https://wa.me/{phone}?text={encoded_message}` in a new tab. It also tracks a `whatsapp_click` analytics event. The `whatsappProvider` is the current `activeProvider` — a Stripe/Paddle provider can be added later by implementing the `PurchaseProvider` interface and swapping `activeProvider`.

### Audio Player

The global player is managed by `usePlayer()` from `src/lib/player.tsx`. It maintains the currently loaded track, play/pause state, loading state, and error state. The `PlayerBar` component at the bottom of the site renders the full player UI. The beat detail page calls `toggle()` to play/pause the beat's preview, which integrates seamlessly with the global player state.

---

## 8. Build & Verification Status

| Check | Status |
|---|---|
| Production build (`npm run build`) | Passing |
| TypeScript (`tsc --noEmit`) | 6 pre-existing errors in `Header.tsx` (references to unimplemented `/auth`, `/profile`, `/admin` routes) |
| Lint (`npm run lint`) | 433 auto-fixable prettier formatting issues (run `npm run format` to fix); 1 pre-existing `prefer-const` in `PlayerBar.tsx`; all other warnings are `react-refresh/only-export-components` (cosmetic, pre-existing) |
| Route `/beats` | Working — catalog page with search, filters, sort |
| Route `/beats/$slug` | Working — detail page with all features |
| `.env` in `.gitignore` | Yes — `.env` and `.env.*` are gitignored |

---

## 9. Recommended Next Step for the Next AI Agent

**Start with Phase 2 — Authentication.**

1. Create `src/routes/auth.tsx` with a layout that contains signup and login forms
2. Use Supabase email/password auth (no magic links, no social providers)
3. Keep email confirmation OFF
4. Track `user_signup` and `user_login` analytics events using the existing `track()` function
5. Read the `redirect` query param after auth and redirect the user back to their original page
6. Once `/auth` route exists, remove the `as any` casts from `navigate()` calls in `src/components/site/CommentForm.tsx` and `src/components/site/LikeButton.tsx`
7. The `Header.tsx` links to `/auth`, `/profile`, and `/admin` will automatically resolve their TypeScript errors once those routes are created

**Before starting, invoke the `bolt-database` skill** for Supabase auth patterns and migration templates.
