# Deploying `@academorix/landing-page` to Vercel

The marketing surface deploys as its own Vercel project so it stays independent
of the tenant SPA (`apps/dashboard`). Deploys are triggered from the same
monorepo but the two apps have separate Vercel project IDs, separate environment
variables, and separate domains.

## One-time setup

1. **Create the Vercel project.** From the monorepo root:

   ```bash
   cd apps/landing-page
   vercel link      # answer "y" to link, pick your team, name the project
                    # `academorix-marketing` (or similar)
   ```

2. **Set the project's root directory** in Vercel dashboard to
   `apps/landing-page`. Vercel picks up `vercel.json` from there and uses:

   - `installCommand`: `pnpm install --frozen-lockfile`
   - `buildCommand`: `pnpm turbo run build --filter=@academorix/landing-page`
   - `outputDirectory`: `.next`
   - `framework`: `nextjs`

3. **Set environment variables** in Vercel (Settings → Environment Variables):

   | Variable                    | Production                   | Preview                              | Local                   |
   | --------------------------- | ---------------------------- | ------------------------------------ | ----------------------- |
   | `NEXT_PUBLIC_APP_URL`       | `https://app.academorix.com` | `https://app-preview.academorix.com` | `http://localhost:3000` |
   | `NEXT_PUBLIC_MARKETING_URL` | `https://academorix.com`     | Vercel-provided                      | `http://localhost:3001` |
   | `NEXT_PUBLIC_BACKEND_URL`   | `https://api.academorix.com` | `https://api-preview.academorix.com` | `http://localhost:8000` |

4. **Attach the domain** (Settings → Domains):

   - Primary: `academorix.com` (or your chosen apex — this app owns the apex
     domain)
   - Redirect: `www.academorix.com` → `academorix.com` (301)

5. **Wildcard TLS.** Vercel auto-provisions Let's Encrypt certs for the apex +
   `www` subdomain. Tenant subdomains (`{slug}.academorix.com`) route to the SPA
   project, not this one.

## Deploy flow

- **Push to `main`** — Vercel builds + deploys to production.
- **Push to any branch / open a PR** — Vercel builds + deploys to a preview URL.
  Preview URLs use the `preview` env-var set.
- **Manual deploy** — from `apps/landing-page`: `vercel --prod`.

## Rolling back

Every deploy has a permanent URL. Roll back from Vercel dashboard → Deployments
→ pick a previous deployment → Promote to Production.

## Regions

Configured in `vercel.json`:

- `cdg1` (Paris) — primary for EU / Middle East (matches Academorix's initial
  GTM markets)
- `iad1` (Washington DC) — secondary for the Americas

Marketing is static-first (Server Components + `generateStaticParams` where
applicable), so region choice affects only the small runtime layer (image
optimizer + potential future middleware).

## What NOT to deploy to Vercel

- **Never** deploy this app to the SPA's Vercel project (`apps/dashboard`) —
  they must stay separate so each can scale + roll back independently.
- **Never** commit `.vercel/` from this directory — the linkage file contains
  the Vercel org ID and should stay local.

## Domain layout reference

| URL                               | Vercel project              | Deployed from       |
| --------------------------------- | --------------------------- | ------------------- |
| `academorix.com`                  | `academorix-marketing`      | `apps/landing-page` |
| `academorix.com/pricing`          | `academorix-marketing`      | `apps/landing-page` |
| `academorix.com/create-workspace` | `academorix-marketing`      | `apps/landing-page` |
| `app.academorix.com`              | `academorix-frontend` (SPA) | `apps/dashboard`    |
| `app.academorix.com/login`        | `academorix-frontend` (SPA) | `apps/dashboard`    |
| `app.academorix.com/dashboard`    | `academorix-frontend` (SPA) | `apps/dashboard`    |
| `{slug}.academorix.com/*`         | `academorix-frontend` (SPA) | `apps/dashboard`    |
| `admin.academorix.com`            | `academorix-frontend` (SPA) | `apps/dashboard`    |

Add a tenant subdomain to the SPA project's wildcard config once G6
(Organization module) ships and tenants can self-serve.

## Post-deploy smoke test

Run these from a browser once the deploy goes live:

- [ ] `academorix.com/` — landing renders full-bleed at desktop widths
- [ ] `academorix.com/pricing` — plan cards render, monthly/yearly toggle works,
      feature-comparison matrix scrolls, FAQ accordion expands
- [ ] `academorix.com/create-workspace` — form renders, submission opens the SPA
      subdomain login
- [ ] `academorix.com/find-workspaces` — form renders, submission shows the
      anti-enumeration success state
- [ ] View source: verify `<meta name="description">` +
      `<meta property="og:title">` are populated per page
- [ ] `academorix.com/sitemap.xml` — returns valid XML with 4 URLs
- [ ] `academorix.com/robots.txt` — allows `/`, disallows onboarding routes
- [ ] Dark mode toggle persists across page navigations
- [ ] Mega-menu opens on hover (desktop) + expands as accordion (mobile)
- [ ] Security headers present (test with securityheaders.com)
- [ ] Lighthouse: LCP < 2.5s, CLS < 0.1, TBT < 200ms
