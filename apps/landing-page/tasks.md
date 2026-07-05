# Landing Page — Enterprise Tasks

_Single source of truth for the `apps/landing-page` (Next.js 16 + HeroUI v3 +
Tailwind v4) marketing surface. Everything shipped-or-planned lives here. Check
items off as they land._

_Owner: solo builder — priorities are ranked by conversion impact._

_Last snapshot: 2026-07-05._

---

## Wave 1 — Foundation ✅ SHIPPED

- [x] 1. HeroUI CLI scaffold moved into `frontend/apps/landing-page`
- [x] 2. Rewrite `package.json` with `catalog:` refs + workspace deps
      (`@academorix/ui`, `@academorix/typescript-config`,
      `@academorix/eslint-config`)
- [x] 3. `tsconfig.json` extends `@academorix/typescript-config/next-app.json`
- [x] 4. `eslint.config.mjs` extends `@academorix/eslint-config/react` + Next's
      recommended + core-web-vitals via `FlatCompat`
- [x] 5. `styles/globals.css` imports `tailwindcss` + `@heroui/styles` +
      `@academorix/ui/react/styles` + `@source` glob for the shared UI package
- [x] 6. `app/providers.tsx` mounts `NextThemesProvider` + `ToastProvider`
      (HeroUI v3 needs no `HeroUIProvider`)
- [x] 7. Delete CLI template stubs (counter, primitives, icons, navbar, types,
      about, blog, docs, pricing/layout)
- [x] 8. Add Next-related deps to `pnpm-workspace.yaml` catalog (`next 16.2`,
      `eslint-config-next 16.2`, `@next/eslint-plugin-next     16.2`,
      `next-themes 0.4.6`, `@tailwindcss/postcss 4.3.1`, `@eslint/compat 1.2.8`,
      `@eslint/eslintrc 3.3.1`, `clsx 2.1.1`, `intl-messageformat 10.7.16`,
      `@next/mdx 16.2`, `@types/mdx 2.0.13`)
- [x] 9. Add `packages/typescript-config/next-app.json` preset

## Wave 2 — Landing + pricing + onboarding port ✅ SHIPPED

- [x] 10. `config/fonts.ts` — Inter + Fira Code via `next/font/google`
      (surviving `config/*` file; site/nav/plans/products all moved to JSON —
      see Wave 3.5)
- [x] 11. `lib/env.ts` — `getAppUrl` / `getMarketingUrl` / `getBackendUrl`
- [x] 12. `components/theme-switch.tsx` — dark/light toggle with our shared icon
      set
- [x] 13. Landing sections built: - [x] `section-heading.tsx` - [x]
      `hero-section.tsx` (accepts `site: SiteData` prop) - [x]
      `logo-strip.tsx` - [x] `features-section.tsx` - [x] `sports-section.tsx` -
      [x] `how-it-works-section.tsx` - [x] `pricing-section.tsx` (teaser —
      3-card, accepts `plans: PlanTierData[]`) - [x]
      `testimonials-section.tsx` - [x] `cta-section.tsx` (accepts
      `site: SiteData` prop) - [x] `landing-header.tsx` (accepts `site` + `nav`
      props) - [x] `footer-section.tsx` (accepts `site` prop)
- [x] 14. Auth support components built: - [x] `components/auth-card.tsx`
      (accepts `site` prop) - [x] `components/password-checklist.tsx` (accepts
      compiled rules)
- [x] 15. Onboarding pages built: - [x] `app/create-workspace/page.tsx` (Server
      Component; awaits `getSite()` + `getBusinessTypes()` +
      `getPasswordRules()`) - [x]
      `components/onboarding/create-workspace-form.tsx` (accepts `site` +
      `businessTypes` + `passwordRules` props) - [x]
      `app/find-workspaces/page.tsx` (Server Component; awaits `getSite()`) -
      [x] `components/onboarding/find-workspaces-form.tsx` (accepts `site` prop)
- [x] 16. `app/layout.tsx` — async `generateMetadata()` reading `getSite()`;
      viewport; fonts; no width constraint on `<body>`
- [x] 17. `app/page.tsx` — Server Component; awaits `getSite()` + `getPlans()`;
      composes landing sections inside `<MarketingShell>`
- [x] 18. Pricing components built: - [x] `pricing-hero.tsx` — plan cards with
      billing-period toggle (accepts `plans` prop) - [x]
      `pricing-highlights.tsx` — spotlight cards (accepts `highlights` prop;
      renders SpendingChart + GrowthTiles decorations based on `illustration`
      field) - [x] `pricing-matrix.tsx` — sticky header with SearchField + plan
      columns + section groupings + tooltips + regional pricing links +
      per-column bottom CTAs (accepts `plans` + `sections` props) - [x]
      `pricing-bottom-cta.tsx` — "Can't decide?" band - [x] `faq-section.tsx` —
      Accordion-based FAQ (accepts `items` prop)
- [x] 19. `app/pricing/page.tsx` — Server Component; awaits all pricing data;
      full page composition inside `<MarketingShell>`
- [x] 20. Remove `asChild` (Radix-only) prop from every `<Button>` — use
      `onPress` + `window.location.href` / `router.push()`
- [x] 21. Switch FAQ from `Disclosure` → `Accordion` primitive

## Wave 3 — Layout & polish ✅ SHIPPED (major issues resolved)

- [x] 22. `.next` cache cleared; `pnpm install` at workspace root;
      `pnpm --filter @academorix/landing-page build` succeeds → 41 static pages
      generated
- [x] 23. Every section standardized on `max-w-6xl px-6` /
      `max-w-7xl     px-4 sm:px-6 lg:px-8` for consistent full-bleed feel
- [x] 24. Dark-mode + light-mode QA pass — every gradient, chip color,
      text-muted class reads correctly in both themes (using semantic tokens
      `bg-surface`, `text-muted`, etc.)
- [ ] 25. Add print styles — pricing page prints usefully
- [ ] 26. Add reduced-motion styles for the hero + spotlight animations
- [ ] 27. Add responsive QA for iPhone SE / iPad / desktop breakpoints

## Wave 3.5 — Content refactor: JSON fixtures + Server-Component reader ✅ SHIPPED

**Why:** Match `apps/web`'s mock-data-provider pattern so marketing content
lives in `public/data/*.json` rather than TypeScript config files. Server
Components read from the filesystem at build time via a tiny reader that
transparently unwraps `{ data: … }` envelopes.

- [x] 28. Delete every `config/*.ts` fixture (`site.ts`, `nav.ts`, `plans.ts`,
      `products.ts`), `lib/password-policy.ts`, and `lib/api.ts` — superseded by
      JSON + reader
- [x] 29. Create JSON fixtures under `public/data/`: - [x] `site.json` — brand
      metadata - [x] `nav.json` — top-nav mega-menu structure - [x]
      `products.json` — 10 products (athletes, teams, scheduling, payments,
      performance, reception, reports, safeguarding, ai, attribute-engine) - [x]
      `sports.json` — 6 sports (football, swimming, basketball, tennis,
      martial-arts, gymnastics) - [x] `legal.json` — 5 legal pages (privacy,
      terms, security, cookies, dpa) - [x] `enterprise.json` — 3 enterprise
      pages (security, onboarding, contracts) - [x] `plans.json` — 4 plan
      tiers - [x] `pricing-highlights.json` — 2 spotlight cards - [x]
      `pricing-compare.json` — feature-comparison matrix (6 sections ×
      subcategories × rows) - [x] `faq.json` — 11 FAQ items - [x]
      `business-types.json` — 6 options for create-workspace form - [x]
      `password-rules.json` — mirrors backend policy
- [x] 30. `lib/types.ts` — every shape (SiteData, NavData, MegaMenuPanel,
      ProductData, SportData, LegalData, EnterpriseData, PlanTierData,
      PricingHighlight, CompareSection, CompareCell discriminated union,
      FaqItem, BusinessTypeOption, PasswordRuleData, CtaDescriptor, RelatedLink,
      ProductFeature, CustomerQuote)
- [x] 31. `lib/api/read.ts` — `readJson<T>()`, `readCollection<T>()`,
      `readCollectionEntry<T>()`, `readCollectionSlugs()`; in-process cache;
      transparent envelope unwrap
- [x] 32. `lib/api/index.ts` — typed getters: `getSite()`, `getNav()`,
      `getProducts()`, `getProduct(slug)`, `getProductSlugs()`,
      `getProductOrNotFound(slug)`, same for sports/legal/enterprise;
      `getPlans()`, `getPricingHighlights()`, `getPricingCompare()`, `getFaq()`,
      `getBusinessTypes()`, `getPasswordRules()`
- [x] 33. `lib/icon-registry.ts` — string→IconType map; `resolveIcon(key)` with
      fallback to `InformationCircleIcon`; 41 icons registered
- [x] 34. `lib/marketing/cta.ts` — `resolveCta(descriptor)` maps intents
      (`signup` → SPA `/register`; `trial` → `/register?trial=1`;
      `contact_sales` → mailto; `link` → href) to concrete URLs;
      `isExternalHref(href)` helper
- [x] 35. `lib/marketing/password.ts` — `compilePasswordRules(rules)` turns JSON
      rules (`min_length` sentinel or regex source) into runtime predicates;
      `validatePassword(pwd, rules)`
- [x] 36. `lib/api-client/http.ts` — split from server API; contains
      `postJson<T>()` + `MarketingApiError` for client-side POSTs
      (create-workspace, find-workspaces)
- [x] 37. Rewire every consuming component to accept data as props:
      landing-header/footer/hero/cta/pricing-section, pricing-hero,
      pricing-highlights, pricing-matrix, faq-section, auth-card,
      password-checklist, create-workspace-form, find-workspaces-form,
      mega-menu, mega-menu-feature-card, mega-menu-banner, mega-menu-columns,
      mobile-nav

## Wave 4 — Enterprise navigation (mega menu) ✅ SHIPPED

- [x] 38. `nav.json` mega-menu data model with `layout` field (`columns-only` /
      `cards` / `cards-plus-banner`) — supports columns, feature cards,
      right-column banner
- [x] 39. Populate real content: - [x] **Products** panel — 8 products +
      featured banner - [x] **Sports** panel — 6 sports + banner - [x]
      **Resources** panel — Docs, Blog, Changelog, Customer stories, Newsletter,
      Community - [x] **Enterprise** panel — Security, Onboarding, Contracts +
      banner - [x] **Pricing** (plain link, no panel)
- [x] 40. `components/nav/mega-menu.tsx` — HeroUI Popover with panel grid; hover
      trigger on desktop
- [x] 41. `components/nav/mega-menu-columns.tsx` — column stack renderer
- [x] 42. `components/nav/mega-menu-feature-card.tsx` — icon + title +
      description + optional "New" chip (uses `resolveIcon`)
- [x] 43. `components/nav/mega-menu-banner.tsx` — right-column banner block
      (icon + title + description + CTA)
- [x] 44. `landing-header.tsx` — replaced simple nav with mega-menu structure;
      keyboard (Escape, focus trap) + ARIA (`aria-expanded`, `aria-controls`)
- [x] 45. `components/nav/mobile-nav.tsx` — full-width Drawer with collapsible
      sections per top-level nav item
- [x] 46. Sticky "on-scroll" state — `sticky top-0` + `backdrop-blur-md` when
      scrolled

## Wave 5 — Internationalization (i18n) ⏭ PLANNED

**Goal:** Multi-locale routing (`/en/*`, `/ar/*`) with full RTL for Arabic,
`next-intl` on the App Router.

- [ ] 47. Install `next-intl` (added to workspace catalog already)
- [ ] 48. Create `i18n/routing.ts` with
      `defineRouting({ locales:     ["en", "ar"], defaultLocale: "en", localePrefix: "always" })`
- [ ] 49. Create `i18n/request.ts` — server-side message loader
- [ ] 50. Create `i18n/navigation.ts` — typed `Link` + `redirect` +
      `useRouter` + `usePathname` locale-aware wrappers
- [ ] 51. Create `middleware.ts` — locale detection at the edge
- [ ] 52. Move every route into `app/[locale]/`
- [ ] 53. Extract every hardcoded string into `messages/en.json` +
      `messages/ar.json`
- [ ] 54. Wrap layout with `NextIntlClientProvider`
- [ ] 55. Use `useTranslations` in Client Components + `getTranslations` in
      Server Components
- [ ] 56. RTL support — set `<html dir={locale === "ar" ? "rtl" : "ltr"}>`
- [ ] 57. `components/nav/language-switcher.tsx` — HeroUI Dropdown, cookie
      persisted, preserves current route
- [ ] 58. Wire language switcher into `landing-header.tsx`
- [ ] 59. Verify RTL rendering (chevron directions, `flex-row` order)
- [ ] 60. Add locale-aware `<html lang={locale}>`
- [ ] 61. Add `hreflang` alternates in per-page metadata

## Wave 6 — Production Next.js config ✅ SHIPPED

- [x] 62. `next.config.mjs`: - [x]
      `experimental.optimizePackageImports: [@academorix/ui,           @academorix/ui/react, @academorix/ui/icons/…, @heroui/react,           @heroui-pro/react]` -
      [x] `typedRoutes: true` at the root (moved out of `experimental` in Next
      16.2) - [x] `images.remotePatterns` — allowlist for academorix.com/.app +
      heroui CDN + GitHub avatars - [x] `compiler.removeConsole` in production
      (keeps `error` + `warn`) - [x] `headers()` — HSTS, X-Frame-Options: DENY,
      X-Content-Type- Options: nosniff, Referrer-Policy, Permissions-Policy, CSP
      (strict but includes `'unsafe-inline'` for styles because HeroUI +
      Tailwind v4 inject inline `<style>` tags), Vercel Analytics allowed in
      script-src/connect-src/frame-src - [x] `redirects()` — `/help` → `/docs`,
      `/terms` → `/legal/terms`, `/privacy` → `/legal/privacy` - [x]
      `poweredByHeader: false` - [x] `productionBrowserSourceMaps: true` - [x]
      `reactStrictMode: true` - [x]
      `transpilePackages: [@academorix/ui, @academorix/eslint-config]` - [x]
      `turbopack.root = WORKSPACE_ROOT` (one level up from `apps/landing-page` —
      required in pnpm monorepo so Turbopack can resolve sibling workspace
      packages and shared node_modules)
- [x] 63. `@next/bundle-analyzer` wired via `ANALYZE=1`
- [x] 64. `app/sitemap.ts` — generates `sitemap.xml`
- [x] 65. `app/robots.ts` — production `robots.txt` referencing sitemap
- [x] 66. `app/error.tsx` — error boundary for the marketing shell
- [x] 67. `app/not-found.tsx` — 404 page with `<MarketingShell>` + brand +
      suggested links
- [ ] 68. `app/manifest.ts` — PWA manifest
- [ ] 69. `app/opengraph-image.tsx` — dynamic OG image generation
- [ ] 70. Nonce-based CSP for scripts (requires custom middleware)

## Wave 7 — Analytics + monitoring ⏭ PLANNED

- [ ] 71. Wire `@vercel/analytics` — free web-vitals + page-views
- [ ] 72. Wire `@vercel/speed-insights` — Core Web Vitals
- [ ] 73. Optional: PostHog for conversion funnels (Hero → Pricing → Register) —
      behind env-var flag
- [ ] 74. Sentry (free tier) for prod errors only
- [ ] 75. Add `<link rel="preload">` for the primary hero + LCP asset
- [ ] 76. Add uptime monitoring — Vercel-native or Checkly

## Wave 8 — Vercel deployment ✅ CONFIG SHIPPED

- [x] 77. `apps/landing-page/vercel.json` — root, framework, build command
      overrides scoped to this app
- [x] 78. `DEPLOY.md` — step-by-step Vercel project creation + root-directory +
      env-var guide
- [ ] 79. Actually create the Vercel project (needs user action): - Root
      directory: `apps/landing-page` - Build command:
      `pnpm turbo run build --filter=@academorix/landing-page` - Install
      command: `pnpm install --frozen-lockfile` - Output directory:
      `apps/landing-page/.next`
- [ ] 80. Wire the domain — `academorix.com` (or `.app`) → marketing project;
      `app.academorix.com` → SPA project; `{slug}.academorix.com` → SPA project
      via wildcard
- [ ] 81. Configure env vars in Vercel: -
      `NEXT_PUBLIC_APP_URL=https://app.academorix.com` -
      `NEXT_PUBLIC_MARKETING_URL=https://academorix.com` -
      `NEXT_PUBLIC_BACKEND_URL=https://api.academorix.com`
- [ ] 82. Wildcard TLS via Vercel's built-in cert provisioning
- [ ] 83. Preview deployments per-PR — verify branch previews
- [ ] 84. Add per-PR Playwright smoke test — screenshot the landing + a pricing
      page load, compare to baseline

## Wave 9 — Content pages (deep pages + placeholders) ✅ SHIPPED

**Deep pages** — every product, sport, legal doc, and enterprise page has its
own route with `generateStaticParams` at build time:

- [x] 85. Shared marketing components: - [x]
      `components/marketing/marketing-shell.tsx` — Server-Component wrapper
      (LandingHeader + main + FooterSection) every marketing route uses - [x]
      `components/marketing/marketing-hero.tsx` — deep-page hero (accepts
      `iconKey: string` — resolved internally to keep the Client-Component
      boundary clean) - [x] `components/marketing/feature-grid.tsx` — icon +
      title + description tiles grid (5–8 items) - [x]
      `components/marketing/quote-block.tsx` — mid-page customer testimonial -
      [x] `components/marketing/related-links.tsx` — bottom-of-page cross-link
      cards - [x] `components/marketing/cta-band.tsx` — end-of-page CTA band -
      [x] `components/marketing/coming-soon.tsx` — reusable branded empty state
      for unfinished routes
- [x] 86. Products deep pages: - [x] `app/products/page.tsx` — index grid - [x]
      `app/products/[slug]/page.tsx` — dynamic route, `generateStaticParams`
      from `getProductSlugs()`, MarketingHero + FeatureGrid + optional
      QuoteBlock (from `use_case`) + RelatedLinks + CtaBand
- [x] 87. Sports deep pages: - [x] `app/sports/page.tsx` — index - [x]
      `app/sports/[slug]/page.tsx` — dynamic, same shape as products but uses
      `testimonial` field for QuoteBlock; default "Get started" signup CTA
- [x] 88. Legal deep pages: - [x] `app/legal/page.tsx` — index - [x]
      `app/legal/[slug]/page.tsx` — prose-only layout, `renderParagraph()`
      supports inline `**bold**` markdown
- [x] 89. Enterprise deep pages: - [x] `app/enterprise/page.tsx` — index - [x]
      `app/enterprise/[slug]/page.tsx` — dynamic, uses "Talk to sales" primary
      CTA (never self-serve signup)
- [x] 90. Placeholder pages (branded "coming soon"): - [x] `app/blog/page.tsx` -
      [x] `app/docs/page.tsx` (links out to `site.docs_url`) - [x]
      `app/changelog/page.tsx` - [x] `app/customers/page.tsx` - [x]
      `app/customers/[slug]/page.tsx` (readable slug fallback) - [x]
      `app/newsletter/page.tsx`

**Real content** — nice-to-have as separate work:

- [ ] 91. Real customer testimonials — replace placeholders with real quotes as
      they come in
- [ ] 92. Real logos in the trust strip (`logo-strip.tsx`) — commission or
      collect from customers
- [ ] 93. OG image artwork — commission or generate via
      `app/opengraph-image.tsx`
- [ ] 94. Hero video / animation — replace the static gradient with a Lottie or
      MP4 hero, respecting reduced-motion
- [ ] 95. Blog scaffold — MDX pipeline (contentlayer or next-mdx-remote)
- [ ] 96. Changelog scaffold — same shape as blog
- [ ] 97. Docs scaffold — either link out to an external docs subdomain or embed
      MDX docs

## Wave 10 — Post-launch cleanup + apps/web reconciliation ⏭ PLANNED

- [ ] 98. Delete `apps/web/src/modules/landing/` (migrated to marketing app)
- [ ] 99. Delete `apps/web/src/modules/billing/pages/pricing-page.tsx` (public
      pricing — SPA keeps `/settings/billing`)
- [ ] 100. Delete
      `apps/web/src/modules/workspace/pages/create-workspace-page.tsx`
- [ ] 101. Delete
      `apps/web/src/modules/workspace/pages/find-workspaces-page.tsx`
- [ ] 102. Update `apps/web/src/modules/workspace/workspace.module.tsx` — remove
      create-workspace + find-workspaces routes
- [ ] 103. Update `apps/web/src/modules/billing/billing.module.tsx` — remove the
      public `/pricing` route
- [ ] 104. Update `apps/web/src/lib/module/routes.ts` — remove
      `createWorkspace` + `findWorkspaces` from `appRoutes`
- [ ] 105. Run all SPA gates (`typecheck`, `lint`, `knip`, `test`, `build`,
      `size`) — verify nothing broke after the deletes
- [ ] 106. Landing app gates — `typecheck` ✅ / `lint` ⚠ (pre-existing workspace
      eslint circular-reference issue) / `build` ✅
- [ ] 107. Add a per-PR CI step that builds BOTH apps in the monorepo
- [ ] 108. Investigate + fix the workspace-level eslint circular reference in
      the shared `@academorix/eslint-config/react` preset (blocks
      `pnpm --filter … lint`)

## Wave 11 — Optional polish ⏭ PLANNED

- [ ] 109. A/B test framework (Vercel Flags SDK or PostHog) — landing hero
      variants, pricing tier ordering
- [ ] 110. Localized pricing — currency detection via geo header, EUR/GBP
      alongside USD
- [ ] 111. Interactive pricing calculator — slider that shows dollar cost for X
      athletes across Y branches
- [ ] 112. Comparison-to-competitor page — Academorix vs TeamSnap / Playmetrics
      / Sportlyzer
- [ ] 113. Newsletter signup wired to Postmark / Resend / Loops
- [ ] 114. AI chat widget on `/docs` and `/pricing` — powered by our backend AI
      Assistant once G9 lands

---

## Cross-cutting standards

- Every file gets a docblock with `@file`, `@module`, `@description`
- Every exported type, hook, provider gets a JSDoc
- No `asChild` on HeroUI `<Button>` — use `onPress` + `router.push()` or
  `window.location.href`
- Cross-origin links (SPA) always use full absolute URLs from `getAppUrl()`
- Icons never cross the Server→Client boundary as components — pass string keys
  and resolve via `resolveIcon(key)` inside Client Components
- `MarketingShell` wraps every marketing route so header/footer + site data
  hydrate uniformly
- Content lives in `public/data/*.json`; Server Components consume it via
  `lib/api/*`
- All strings are keys into `messages/en.json` / `messages/ar.json` once Wave 5
  lands (backfill Waves 2-4 files as we go)
- Every interactive element supports keyboard nav (Tab, Enter, Escape)
- All images have `alt` (empty for purely decorative)
- Never `git add -A` — stage specific paths only
- Never commit `.next/`, `.turbo/`, `node_modules/`, or `.vercel/`
- Commit convention: `feat(landing): mega menu with hover panels`

## Progress

- **Waves 1-2:** ✅ Shipped (foundation + landing/pricing/onboarding port)
- **Wave 3:** ✅ Layout polish (build green, dark/light QA done)
- **Wave 3.5:** ✅ JSON content refactor + Server-Component readers
- **Wave 4:** ✅ Mega menu (desktop + mobile)
- **Wave 5:** ⏭ i18n (deps in catalog, implementation pending)
- **Wave 6:** ✅ Production next.config.mjs
- **Wave 7:** ⏭ Analytics
- **Wave 8:** ✅ Vercel config files shipped (project creation pending user
  action)
- **Wave 9:** ✅ Deep pages (products, sports, legal, enterprise) + placeholder
  pages (blog, docs, changelog, customers, newsletter)
- **Wave 10:** ⏭ apps/web cleanup (blocked on final production sign-off)
- **Wave 11:** ⏭ Optional polish

**Route inventory after this session:** 41 static + dynamic pages generated at
build time — `/`, `/pricing`, `/create-workspace`, `/find-workspaces`,
`/products` + 10 deep, `/sports` + 6 deep, `/legal` + 5 deep, `/enterprise` + 3
deep, `/blog`, `/docs`, `/changelog`, `/customers` + dynamic slug,
`/newsletter`, `/not-found`, `/robots.txt`, `/sitemap.xml`.
