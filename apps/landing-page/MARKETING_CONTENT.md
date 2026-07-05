# Academorix · Marketing Content Reference

_Draft v1 · English only · Awaiting sign-off_

_This document is the single source of truth for every user-facing
sales/marketing string on academorix.com. UI teams pull section headings,
feature bullets, testimonials, FAQs, and stats directly from here into either
`messages/{locale}.json` (UI chrome) or `public/data/{locale}/*.json` (page
content). Arabic translations happen in a separate pass; Section 18 flags every
string that will need it._

---

## Table of Contents

- [0. Sitemap](#0-sitemap)
- [1. Brand voice](#1-brand-voice)
- [2. Landing page (/)](#2-landing-page-)
- [3. Pricing (/pricing)](#3-pricing-pricing)
- [4. Product pages](#4-product-pages)
- [5. Sport pages](#5-sport-pages)
- [6. Enterprise pages](#6-enterprise-pages)
- [7. Solutions pages (new)](#7-solutions-pages-new)
- [8. Persona pages (new)](#8-persona-pages-new)
- [9. Legal pages](#9-legal-pages)
- [10. Company pages (new)](#10-company-pages-new)
- [11. Customer stories (new content)](#11-customer-stories-new-content)
- [12. Blog seed (12 posts)](#12-blog-seed-12-posts)
- [13. Author profiles](#13-author-profiles)
- [14. Stats / KPIs (site-wide)](#14-stats--kpis-site-wide)
- [15. Testimonials pool (site-wide)](#15-testimonials-pool-site-wide)
- [16. FAQs pool](#16-faqs-pool)
- [17. Content-to-UI mapping (per-page UI spec)](#17-content-to-ui-mapping-per-page-ui-spec)
- [18. Localisation notes](#18-localisation-notes)
- [19. Open questions](#19-open-questions)

---

## 0. Sitemap

The Academorix marketing site ships with the following page inventory. Every URL
is bilingual under `/en/*` and `/ar/*`. Server-side rendering is expected for
every page except workspace creation flows.

| URL                          | Page type              | Primary CTA             | Notes                                                                    |
| ---------------------------- | ---------------------- | ----------------------- | ------------------------------------------------------------------------ |
| `/`                          | Landing (home)         | Get started             | Hero + KPI + bento + how it works + testimonials + pricing preview + FAQ |
| `/pricing`                   | Pricing                | Start free trial        | Plan cards + compare matrix + FAQ                                        |
| `/products`                  | Product index          | Explore products        | Directory of every product page                                          |
| `/products/athletes`         | Product deep dive      | Start managing athletes | Signup CTA                                                               |
| `/products/teams`            | Product deep dive      | Build your rosters      | Signup CTA                                                               |
| `/products/scheduling`       | Product deep dive      | Try scheduling          | Trial CTA                                                                |
| `/products/payments`         | Product deep dive      | Set up billing          | Signup CTA                                                               |
| `/products/performance`      | Product deep dive      | Track performance       | Signup CTA                                                               |
| `/products/reception`        | Product deep dive      | Open your desk          | Signup CTA                                                               |
| `/products/reports`          | Product deep dive      | Explore reports         | Signup CTA                                                               |
| `/products/safeguarding`     | Product deep dive      | Talk to compliance      | Contact-sales CTA                                                        |
| `/products/ai`               | Product deep dive      | See AI in action        | Signup CTA                                                               |
| `/products/attribute-engine` | Product deep dive      | Learn how it works      | Signup CTA                                                               |
| `/sports`                    | Sport index            | Explore sports          | Directory of every sport page                                            |
| `/sports/football`           | Sport deep dive        | Start free trial        | Football-specific narrative                                              |
| `/sports/swimming`           | Sport deep dive        | Start free trial        | Swimming-specific narrative                                              |
| `/sports/basketball`         | Sport deep dive        | Start free trial        | Basketball-specific narrative                                            |
| `/sports/tennis`             | Sport deep dive        | Start free trial        | Tennis-specific narrative                                                |
| `/sports/martial-arts`       | Sport deep dive        | Start free trial        | Belt-progression narrative                                               |
| `/sports/gymnastics`         | Sport deep dive        | Start free trial        | Apparatus-scoring narrative                                              |
| `/sports/volleyball`         | Sport teaser           | Join the waitlist       | Coming soon                                                              |
| `/sports/padel`              | Sport teaser           | Join the waitlist       | Coming soon                                                              |
| `/sports/athletics`          | Sport teaser           | Join the waitlist       | Coming soon                                                              |
| `/enterprise`                | Enterprise hub         | Talk to sales           | Directory of enterprise pages                                            |
| `/enterprise/security`       | Enterprise deep dive   | Talk to sales           | SSO, audit logs, residency                                               |
| `/enterprise/onboarding`     | Enterprise deep dive   | Talk to sales           | Migration and training                                                   |
| `/enterprise/contracts`      | Enterprise deep dive   | Talk to sales           | NET-30, DPA, HIPAA BAA                                                   |
| `/enterprise/compliance`     | Enterprise deep dive   | Talk to sales           | SOC 2, ISO 27001, GDPR, HIPAA, CCPA                                      |
| `/enterprise/migration`      | Enterprise deep dive   | Talk to sales           | From TeamSnap, Sportlyzer, Playmetrics                                   |
| `/enterprise/multi-branch`   | Enterprise deep dive   | Talk to sales           | Network-scale operations                                                 |
| `/solutions/multi-branch`    | Solution deep dive     | Talk to sales           | Cross-cuts products                                                      |
| `/solutions/bilingual-rtl`   | Solution deep dive     | Start free trial        | Arabic-first market angle                                                |
| `/solutions/offline-first`   | Solution deep dive     | Start free trial        | Coaches on the field                                                     |
| `/solutions/real-time`       | Solution deep dive     | Start free trial        | RSVP, standings, attendance live                                         |
| `/solutions/ai-assistant`    | Solution deep dive     | See AI in action        | AI-first workflows                                                       |
| `/for/owners`                | Persona                | Talk to sales           | Network-scale operators                                                  |
| `/for/coaches`               | Persona                | Start free trial        | Training, assessment, attendance                                         |
| `/for/athletes`              | Persona                | Learn more              | Profile, progress, schedule                                              |
| `/for/guardians`             | Persona                | Learn more              | Visibility, payments, comms                                              |
| `/for/front-desk`            | Persona                | Start free trial        | Reception, approvals, docs                                               |
| `/for/finance`               | Persona                | Start free trial        | AR, billing, reports                                                     |
| `/for/platform-admins`       | Persona                | Talk to sales           | Super-admin surface, gated                                               |
| `/customers`                 | Customer stories index | Read the stories        | Directory of case studies                                                |
| `/customers/aquaelite-swim`  | Customer story         | Start free trial        | Swimming case study                                                      |
| `/customers/northgate-fc`    | Customer story         | Start free trial        | Football case study                                                      |
| `/customers/summit-hoops`    | Customer story         | Start free trial        | Basketball case study                                                    |
| `/blog`                      | Blog index             | Subscribe               | Category filters + featured post                                         |
| `/blog/[slug]`               | Blog post              | Subscribe               | Author bio + related posts                                               |
| `/changelog`                 | Product changelog      | Subscribe               | Reverse-chronological release list                                       |
| `/newsletter`                | Newsletter signup      | Subscribe               | Standalone landing                                                       |
| `/docs`                      | Documentation home     | Get started             | External docs portal                                                     |
| `/docs/*`                    | Documentation          | Get started             | Deep docs pages                                                          |
| `/resources/tutorials`       | Video tutorials        | Watch tutorials         | Video index                                                              |
| `/about`                     | Company                | Talk to sales           | Story of Academorix                                                      |
| `/careers`                   | Company                | View open roles         | Culture and role list                                                    |
| `/press`                     | Company                | Download brand kit      | Releases and assets                                                      |
| `/contact-sales`             | Contact                | Book a demo             | Contact form + calendars                                                 |
| `/contact`                   | Contact                | Send message            | Support and hello routing                                                |
| `/legal`                     | Legal index            | Read documents          | Directory of legal docs                                                  |
| `/legal/privacy`             | Legal                  | None                    | Privacy policy                                                           |
| `/legal/terms`               | Legal                  | None                    | Terms of service                                                         |
| `/legal/security`            | Legal                  | Talk to sales           | Security practices                                                       |
| `/legal/cookies`             | Legal                  | None                    | Cookie policy                                                            |
| `/legal/dpa`                 | Legal                  | Talk to sales           | Data processing addendum                                                 |
| `/legal/acceptable-use`      | Legal                  | None                    | Acceptable use policy                                                    |
| `/create-workspace`          | Signup                 | Create workspace        | Workspace provisioning                                                   |
| `/find-workspaces`           | Signup helper          | Find your workspace     | Existing-customer entry                                                  |

Total page count: 60 marketing pages, plus legal, plus signup/utility routes.
Every deep-dive page follows the same content skeleton described in Section 4
(products), Section 5 (sports), and Section 6 (enterprise).

---

## 1. Brand voice

Academorix is the operating system for multi-sport academies. The marketing site
speaks the same way the product does: authoritative, specific, and grounded in
what the platform actually delivers.

- **We are.** The single system of record for athletes, teams, scheduling,
  performance, payments, safeguarding, and reception. Sport-agnostic by design,
  bilingual by default, offline-first where coaches need it.
- **We are not.** A generic CRM with a sport skin. A siloed booking app. A
  parent-communication tool bolted onto a spreadsheet.
- **Tone.** Enterprise, professional, benefit-first. Every claim maps to a
  specific capability in the platform. No marketing filler, no jargon dumps, no
  hero-worship of the tech stack.
- **Cadence.** Short and medium sentences. Direct verbs. Concrete nouns. No
  em-dashes (Arabic renders them poorly). No exclamation points.
- **Voice examples.** "Onboarding a new athlete takes one form, and every
  downstream system just knows." Not "Onboarding has never been easier."
  "PCI-safe by default." Not "We take security seriously."
- **Regional posture.** English is the default. Arabic is a first-class
  translation, not an afterthought. Every layout, form, and icon accommodates
  right-to-left. Currency and terminology flex per region (SAR, AED, EGP, USD,
  GBP).
- **Compliance posture.** Every security or compliance claim is either delivered
  today or scheduled with a target quarter. Never state "SOC 2 certified" if we
  are only "SOC 2 in progress"; use "SOC 2 Type II audit scheduled Q4 2026"
  instead.

---

## 2. Landing page (/)

The landing page is the tallest funnel entry point. It must convince a busy
academy owner in under 90 seconds that Academorix runs their entire operation,
and give a security-conscious multi-branch director enough evidence to book a
demo. Both audiences read the same page; the CTAs branch appropriately.

### 2.1 Hero

**Eyebrow chip:** `The multi-sport academy OS`

**H1:** Run your entire sports academy from one place

**Subheading:** Academorix brings athletes, teams, scheduling, performance,
payments, and multi-branch operations together. One platform that adapts to any
sport, any language, any scale.

**Primary CTA:** Get started

**Secondary CTA:** Explore features

**Trust line under the CTAs:** No credit card required. Migrate in weeks, not
months.

The hero uses a soft accent-color gradient (top-to-transparent) and centers the
H1 within a max width of 720 pixels. The primary CTA is a full-color pill; the
secondary CTA is a bordered pill that jumps to the feature bento.

```json
{
  "hero": {
    "eyebrow": "The multi-sport academy OS",
    "title": "Run your entire sports academy from one place",
    "subtitle": "Academorix brings athletes, teams, scheduling, performance, payments, and multi-branch operations together. One platform that adapts to any sport, any language, any scale.",
    "cta_primary": { "label": "Get started", "type": "signup" },
    "cta_secondary": { "label": "Explore features", "href": "#features" },
    "trust_line": "No credit card required. Migrate in weeks, not months."
  }
}
```

### 2.2 KPI band

Four numbers, presented as a horizontal KPI group directly beneath the hero
CTAs. Each KPI carries a caption line for accessibility and context.

| KPI                 | Value   | Caption                                               |
| ------------------- | ------- | ----------------------------------------------------- |
| Academies onboarded | 200+    | Multi-sport clubs, dojos, and academies in production |
| Athletes managed    | 50,000+ | Active profiles synced across branches and seasons    |
| Sports supported    | 12      | With sport-agnostic engine for any new discipline     |
| Uptime SLA          | 99.99%  | Enterprise SLA with financial credits                 |

Refresh cadence: every quarter, sourced from tenant analytics. Source-of-truth
for the current values is Section 14.

### 2.3 Trusted-by logo strip

A single-row logo strip presented directly beneath the KPI band. Uses grayscale
logos on a subtle background to avoid overshadowing the product story. Rotates
six brand logos, with a subtle marquee on smaller viewports.

**Section eyebrow:** Trusted by academies across the region

**Logos to feature (v1):**

- AquaElite Swim
- Northgate FC
- Summit Hoops
- Riverside Sports Academy
- Al Nasr Football Academy
- Elite Martial Arts Center

**Fine print underneath the logos:** Names shown are illustrative until customer
permissions are secured. See `Section 19` for outstanding sign-offs.

### 2.4 Product bento

Six-tile bento grid that showcases the highest-signal product surfaces. Each
tile is a card with an icon, title, and a single benefit-forward sentence. The
two "hero" tiles (Athletes and Performance) span two columns each on desktop;
the remaining four are single-column.

**Section eyebrow:** Products

**Section H2:** Everything your academy needs, in one platform

**Section lede:** Every capability plugs into the same tenant workspace. Your
team never leaves the platform to get real work done.

| Tile   | Title       | One-liner                                                          |
| ------ | ----------- | ------------------------------------------------------------------ |
| 1 (2×) | Athletes    | One record follows every athlete from first inquiry to graduation  |
| 2 (1×) | Teams       | Squads, coaches, and age brackets synced across every program      |
| 3 (1×) | Scheduling  | Training, matches, RSVPs, and tap-to-check-in attendance           |
| 4 (1×) | Payments    | Invoices, memberships, and reminders with clear AR                 |
| 5 (2×) | Performance | Sport-specific metrics from configurable attribute sets            |
| 6 (1×) | Reports     | Custom dashboards, scheduled exports, and natural-language queries |

Each tile links to the corresponding `/products/*` deep dive.

### 2.5 Sports bento

Six sport-specific tiles that make the sport-agnostic story concrete. Same
visual pattern as the product bento, but grouped by sport. Two additional teaser
tiles at the bottom show the sports we do not yet support with "Coming soon"
chips.

**Section eyebrow:** Sports

**Section H2:** Built for every sport, sport by sport

**Section lede:** One platform, many disciplines. Every sport ships with its own
attribute sets, performance metrics, and coaching workflows.

| Tile     | Sport        | One-liner                                                 |
| -------- | ------------ | --------------------------------------------------------- |
| 1        | Football     | Squads, matches, formations, and per-position performance |
| 2        | Swimming     | Lanes, splits, meets, and per-stroke time series          |
| 3        | Basketball   | Rosters, minutes played, and per-quarter stats            |
| 4        | Tennis       | Ladders, court bookings, and match rating systems         |
| 5        | Martial Arts | Belt progression, grading, and dojo-first workflows       |
| 6        | Gymnastics   | Apparatus scoring, meets, and progression schemes         |
| 7 (chip) | Volleyball   | Coming soon                                               |
| 8 (chip) | Padel        | Coming soon                                               |
| 9 (chip) | Athletics    | Coming soon                                               |

Below the grid, a subtle callout links to `/products/attribute-engine` with the
sentence: "Not seeing your sport? Any discipline runs on our attribute engine in
an afternoon."

### 2.6 How it works timeline

Four-step timeline that takes a visitor from sign-up to running the season. Each
step gets a numbered eyebrow, a two-word H3, and a single explanatory sentence.
Rendered as an ordered list for accessibility.

**Section eyebrow:** How it works

**Section H2:** Live in four steps

**Section lede:** Go from setup to your first tracked session in an afternoon.

| Step | Title                  | Description                                                                           |
| ---- | ---------------------- | ------------------------------------------------------------------------------------- |
| 01   | Set up your academy    | Create branches, seasons, and roles, then tailor terminology to how you work          |
| 02   | Add athletes and teams | Import your roster or add athletes one by one, then assign them to teams and programs |
| 03   | Run day to day         | Schedule sessions, capture attendance, and log performance as the season unfolds      |
| 04   | Grow with insight      | Collect payments, manage memberships, and track the numbers that move you forward     |

### 2.7 Persona cards

Four persona cards positioned between "How it works" and testimonials. Each card
names a role, states the outcome that person gets from Academorix, and links to
the corresponding `/for/*` page.

**Section eyebrow:** Roles

**Section H2:** Every role, one workspace

**Section lede:** From the boardroom to the front desk, every team member sees
exactly what they need and nothing they should not.

| Persona          | Outcome                                                           | Link              |
| ---------------- | ----------------------------------------------------------------- | ----------------- |
| Academy owners   | Network-wide visibility into revenue, retention, and safeguarding | `/for/owners`     |
| Coaches          | Rosters, attendance, and progress on one screen                   | `/for/coaches`    |
| Guardians        | Schedules, payments, and progress for every child in one login    | `/for/guardians`  |
| Front-desk staff | An approvals queue that keeps the desk running                    | `/for/front-desk` |

### 2.8 Testimonials

Three-card testimonial section. Each card carries the quote, an initials avatar
in accent color, the author's name, and the author's role and organization.

**Section eyebrow:** Testimonials

**Section H2:** Loved by academy teams

**Cards:**

> Academorix replaced three tools and a stack of spreadsheets. Our coaches
> finally spend their time coaching.
>
> Layla Haddad · Director, AquaElite Swim

> Attendance and performance in one place changed how we run tryouts. Setup took
> a single afternoon.
>
> Marcus Bell · Head Coach, Summit Hoops

> Multi-branch billing used to be a nightmare. Now renewals just work, in Arabic
> and English.
>
> Sara Nassar · Operations Lead, Northgate FC

The section supports optional star ratings if we choose to enable them on
Pro-plan review widgets; the default is quote-only. On mobile, the cards stack
vertically.

### 2.9 Pricing preview

Landing-page pricing preview shows all four tiers as horizontal cards. The
Growth tier is highlighted as the popular choice. The section anchors a CTA that
opens the full `/pricing` page.

**Section eyebrow:** Pricing

**Section H2:** Simple, scalable pricing

**Section lede:** Straightforward plans that scale with your academy. No hidden
fees, no surprise increases at renewal.

| Tier       | Price                  | Positioning line                                                              |
| ---------- | ---------------------- | ----------------------------------------------------------------------------- |
| Starter    | Free                   | The perfect starting place for a single branch just getting off the ground    |
| Growth     | $99/mo (or $950/yr)    | Everything a growing academy needs to run daily operations end to end         |
| Pro        | $249/mo (or $2,390/yr) | For established academies scaling multi-branch operations with advanced needs |
| Enterprise | Custom                 | Critical security, performance, observability, and support for large networks |

CTA row: "Compare every plan" links to `/pricing`. "Talk to sales" opens
`/contact-sales`.

### 2.10 CTA band

Full-bleed CTA band immediately above the FAQ. Uses a soft accent gradient with
a centered call to action.

**H2:** Ready to run your academy the modern way?

**Sub:** Join the academies already managing athletes, teams, and payments with
Academorix. Get set up in minutes.

**Primary CTA:** Get started

**Secondary CTA:** See pricing

### 2.11 FAQ (top 5)

Five landing-page FAQs. These are the highest-volume questions we get in support
tickets and sales calls. The full 30+ FAQ pool lives on `/pricing` and is
exported at build time from `public/data/en/faq.json`.

1. **Which plan is right for me?** Starter is perfect for a single branch just
   getting off the ground. Growth adds recurring memberships, performance
   tracking, and payments for a multi-team academy. Pro adds SSO, custom
   reports, and a success manager. Enterprise is for multi-branch networks with
   strict security or SLA needs.

2. **How long does migration take?** Most single-branch academies migrate in
   under two weeks. Multi-branch networks typically run a 30-day parallel period
   with a dedicated implementation engineer. Enterprise onboarding is scoped in
   Section 6.

3. **Does Academorix support Arabic?** Yes. Every screen, form, email, and PDF
   ships in English and Arabic with full right-to-left rendering. Enable Arabic
   at signup or from workspace settings; users pick their preferred language.

4. **What sports do you support?** Football, swimming, basketball, tennis,
   martial arts, and gymnastics are shipped and battle-tested. Volleyball,
   padel, and athletics are on the near-term roadmap. Any discipline can run on
   our attribute engine on day one.

5. **How does billing work if I have families with multiple athletes?** Family
   accounts pay one invoice per period, with automatic sibling discounts,
   per-athlete line items, and a single reminder cadence. Guardians can split
   payment across cards on Pro plans.

---

## 3. Pricing (/pricing)

The pricing page is the second-highest-signal page on the site. It carries the
weight of every sales conversation and every finance-team review. It must be
defensible, exact, and easy to scan.

### 3.1 Hero

**Eyebrow:** Pricing

**H1:** Scale your academy, control your costs

**Subheading:** Simple, scalable pricing that grows with your academy. Start
free with no credit card required and only pay when you outgrow the Starter
tier.

**Trust line:** Every plan includes bilingual support, sport-agnostic attribute
engine, and unlimited attendance capture.

The hero is a two-column layout on desktop: text on the left, a compact
plan-tier illustration on the right that shows the four tiers as a bar chart of
feature depth. Mobile stacks vertically.

### 3.2 Highlights (2 spotlight cards)

Two spotlight cards sit directly below the hero. Each carries an illustration, a
title, a two-sentence explanation, and a link into the docs.

**Card 1: No idle, no waste**

Only pay for actual usage. Athletes on your roster and seats you assign count
against your plan; idle capacity does not. If you drop below your tier's
included allowance mid-cycle, we credit you against the next invoice.

Link: `Learn about usage-based billing` → `/docs/billing/usage`

**Card 2: Control your spending**

Set spend limits, get real-time alerts, and pause usage before you go over
budget. Owners see an 80 percent warning at the plan boundary, a 100 percent
lock at the ceiling, and a full ledger of every overage line.

Link: `Learn about spend controls` → `/docs/billing/limits`

### 3.3 Plan tier copy (Starter, Growth, Pro, Enterprise)

Four plan cards, presented as horizontal columns on desktop and a stacked list
on mobile. The Growth column is marked "Popular" with an accent chip. Each
column carries the eyebrow, price, description, five highlights, and a CTA that
matches the tier's conversion intent.

#### Starter

**Price:** Free

**Description:** The perfect starting place for a single branch just getting off
the ground.

**Highlights:**

- Up to 100 athletes
- 1 branch
- Scheduling and attendance
- Athlete profiles and guardians
- Email support during business hours

**CTA:** Start for free

**Best for:** Solo coaches, new academies, and pilot deployments where the
operator wants to prove the workflow before committing to a paid plan.

#### Growth (Popular)

**Price:** $99 per month, or $950 per year (save $238)

**Description:** Everything a growing academy needs to run daily operations end
to end.

**Highlights:**

- Up to 500 athletes
- 3 branches
- Performance and progress tracking
- Payments and memberships
- Priority email support
- $50 of usage credit at signup

**CTA:** Start free trial

**Best for:** Established single-branch or small multi-branch academies with
recurring membership revenue. This is the tier where most of our customers land.

#### Pro

**Price:** $249 per month, or $2,390 per year (save $598)

**Description:** For established academies scaling multi-branch operations with
advanced needs.

**Highlights:**

- Up to 2,000 athletes
- 10 branches
- SSO and advanced RBAC
- Custom reports and dashboards
- Dedicated success manager
- $200 of usage credit at signup

**CTA:** Start free trial

**Best for:** Regional networks running three or more branches with a formal
finance function, a compliance officer, or an identity provider (Okta, Azure AD,
Google Workspace).

#### Enterprise

**Price:** Custom

**Description:** Critical security, performance, observability, and support for
large multi-branch networks.

**Highlights:**

- Unlimited athletes and branches
- Custom onboarding and SLA
- Advanced security and audit logs
- 24/7 priority support
- Custom contracts and invoicing

**CTA:** Get a demo

**Best for:** National networks, franchise operators, and cross-border groups
that need SSO, data residency, HIPAA BAA, or NET-30 commercial terms.

### 3.4 Compare matrix intro

Below the plan cards, we introduce the compare matrix with a short section
header.

**Eyebrow:** Compare

**H2:** Every capability, every plan

**Lede:** The full breakdown of what each plan includes across academy
operations, scheduling, payments, AI, security, and support. Search the matrix
or expand the categories to compare tier by tier.

The matrix itself is rendered from `public/data/en/pricing-compare.json`. UI
teams should honor the following semantic rules:

- Included = solid green check icon
- Not included = muted dash
- Value = the primary string plus a smaller secondary string if provided
- Custom = amber "Custom" pill
- Addon = tag with the label from the JSON (typically "Paid add-on")

Category groupings the matrix already covers today:

1. Academy operations (athletes, teams, guardians, enrollment forms,
   configurability, limits)
2. Scheduling and attendance (sessions, RSVP, tap-to-check-in, QR/NFC, guardian
   pickup)
3. Payments and billing (invoices per month, memberships, reminders, Stripe,
   Paddle, custom gateways)
4. AI (progress summaries, attribute-set suggestions, prebuilt dashboards,
   custom reports, scheduled exports)
5. Security and compliance (RBAC, SSO, SCIM, IP allowlisting, audit logs, data
   residency, HIPAA BAA)
6. Support (community forum, email tier, dedicated success manager, onboarding
   hours, SLA)

Sections we recommend adding to the matrix over time:

- Multi-branch and roles (unlimited seats vs. included seats vs. per-seat
  overage)
- Integrations (Stripe Connect, Paddle, webhooks, SIEM streaming)
- AI usage credit and BYO-key support
- Data export options (CSV, PDF, scheduled emails)
- Regional invoicing (VAT-EU, VAT-GCC, US 501(c)(3))

### 3.5 Bottom FAQ (10 questions)

The bottom of the pricing page carries ten of the highest-volume questions we
get. Answers are conversational, honest, and short. The full pool of 30-plus is
in Section 16.

1. **Which Academorix plan is right for me?** See the plan cards above. If you
   are unsure, start on Starter or a Growth trial and upgrade when you outgrow
   the limits.

2. **Do you offer custom invoicing?** Yes on Enterprise. NET-30 is standard,
   NET-60 available on request. Contact sales.

3. **What are the limits for each plan?** See the comparison matrix above for
   exact per-plan limits on athletes, branches, teams, invoices, and audit-log
   retention.

4. **I went over my included usage. What happens?** Live usage meters warn you
   at 80 percent. At 100 percent, overage rolls to the pay-as-you-go rate shown
   in the matrix. Nothing gets cut off mid-session.

5. **Can I buy additional usage?** Yes. Enable overage billing (pay-as-you-go)
   or upgrade to a plan with a higher included allowance. Both are one-click
   changes from `Settings → Billing`.

6. **I have a Starter account, how do I upgrade?** Head to `Settings → Billing`
   and pick a plan. Your workspace stays online during the upgrade with no
   downtime and no data migration.

7. **Is there a limit to how many staff seats I can have?** Seats scale with
   your plan tier: 3 on Starter, 15 on Growth, 100 on Pro, unlimited on
   Enterprise. Additional seats are $12 per seat per month.

8. **How does Academorix calculate usage?** Monthly across three axes: athletes
   on your roster, branches you operate, and invoices you send. Attendance,
   sessions, and messages are unlimited on every plan.

9. **Can I bring my own domain?** Yes on every paid plan. TLS certificates
   provision automatically. Enterprise plans get vanity domains on our
   infrastructure.

10. **How can I manage my spend?** Set a monthly spend limit in
    `Settings → Billing → Limits`. We email you at 80 percent and 100 percent,
    and pause overage billing beyond your ceiling.

### 3.6 Bottom CTA

A compact CTA band anchors the bottom of `/pricing`, distinct from the
landing-page CTA band so we can pass a "billing_intent" query parameter into the
signup form.

**H2:** Still comparing?

**Sub:** Start a 14-day Growth trial in under two minutes. Your data stays
yours; cancel any time from the billing settings.

**Primary CTA:** Start free trial

**Secondary CTA:** Talk to sales

---

## 4. Product pages

Every product page follows the same skeleton so UI teams can render one shared
template with data-driven content. Each page anchors on a hero, a "What is X"
narrative, a feature bento (6-8 features), 3-4 deep-dive sections with topical
stories, a persona relevance grid, a compliance angle, a testimonial, a stat
block, related products, and a CTA.

### 4.1 Athletes (/products/athletes)

**Eyebrow:** Product

**H1:** Athletes

**Subheading:** A single record that follows every athlete through their entire
journey, from first inquiry to graduation. Rich profiles, guardians, documents,
and enrollment in one place.

**Primary CTA:** Start managing athletes (signup)

#### What is Athletes

Athletes is the identity backbone of Academorix. Every person your academy
trains gets one canonical record that carries their contact information,
guardians, documents, enrollments across sports, and history across branches.
Coaches never have to reconcile "which Layla is this" across sheets, front-desk
staff never re-enter contact details, and finance never emails a family twice
for the same fee.

The record is sport-agnostic at its core. Sport-specific fields (position,
stroke preference, belt level) live on `AthleteEnrollment` records that
discriminate by sport, so an athlete can play football on Monday and swim on
Wednesday without a data-model split. When you add a discipline, the right
fields appear automatically.

#### Feature bento

| Icon                  | Title                   | Description                                                                                                                         |
| --------------------- | ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `IdentificationIcon`  | Rich athlete profiles   | Age, contact, sport, level, and configurable attributes. The fields you actually need for each discipline, driven by attribute sets |
| `UsersIcon`           | Guardian relationships  | Link parents, guardians, and emergency contacts to any athlete. Guardians can log in to view schedules, invoices, and updates       |
| `DocumentTextIcon`    | Documents and waivers   | Store medical forms, waivers, and legal documents on the athlete record. Expiry dates trigger renewal reminders automatically       |
| `MapIcon`             | Multi-branch enrollment | Enroll athletes across branches without duplicating records. History, performance, and payments follow them everywhere              |
| `ChartBarIcon`        | Progress history        | Attendance, performance, and payment history on one timeline. The right context for every retention conversation with families      |
| `ShieldCheckIcon`     | Privacy by design       | Fine-grained access control. Coaches see only their squads, admins see the network, guardians see just their child                  |
| `DocumentArrowUpIcon` | Bulk import             | Onboard hundreds of athletes from Excel or CSV in one pass, with validation reports before anything hits your workspace             |
| `ArchiveBoxIcon`      | Full lifecycle          | Suspend, reactivate, graduate, or transfer athletes with a full audit trail on every state change                                   |

#### Deep-dive stories

##### One athlete, every sport

Some of our customers run multi-sport programs where an athlete rows in the
morning and plays football in the afternoon. Every sport in Academorix uses a
shared `Athlete` identity and a per-sport `AthleteEnrollment`, so contact
details, guardians, and documents are entered once and referenced everywhere.
The dashboard adapts to show the right stat model per enrollment: FIFA-style
cards for football, per-stroke splits for swimming, belt levels for martial
arts.

##### Guardians that behave like real families

Real families are messy. Two parents at different addresses, a grandparent
listed as an emergency contact, siblings who share the same primary guardian.
Academorix models this correctly: multiple guardians per athlete, primary
contact designation, per-guardian consent flags for photos, medical decisions,
and transport, and a login for each guardian who wants one. Split-family
communication respects who gets which notification.

##### Documents that never expire silently

Medical clearances, passports, safeguarding forms. Each has an expiry date.
Academorix stores every document with a typed `DocumentType`, tracks its expiry,
and emails the guardian and the front desk 30, 14, and 7 days before it lapses.
Expired documents block match-day selection until they are refreshed. No child
slips through a compliance gap because a form was uploaded and then forgotten.

##### Privacy without paranoia

Coaches see the athletes on their squads. Guardians see only their own children.
Medical fields are gated behind a "Medical" role; safeguarding officers see the
incident log; owners see the whole network. The access model runs at the
database layer via row-level scoping, so an accidental typo in application code
cannot leak data across tenants. Every read on a sensitive field is logged.

#### Persona relevance

| Persona               | Why this matters                                                                              |
| --------------------- | --------------------------------------------------------------------------------------------- |
| Owners                | Every athlete, every branch, every sport in one place. No more spreadsheet reconciliation     |
| Coaches               | Rich context on every athlete before a session. Injuries, notes, and progress at a glance     |
| Front-desk staff      | One form to onboard a new family. Downstream systems (invoices, rosters) update automatically |
| Guardians             | One login for every child, every sport, every branch                                          |
| Safeguarding officers | Every consent flag, every document expiry, every incident on the athlete record               |

#### Compliance angle

Athletes upholds GDPR and CCPA rights of access, correction, deletion, and
portability. Every athlete record exports as a single JSON bundle on request.
Deletion propagates to guardians, documents, enrollments, and downstream
analytics with a 30-day grace period. Data residency is available on Enterprise
so the record physically lives in the EU, MENA, or US region of your choice.

#### Testimonial

> Onboarding a new athlete used to take 40 minutes across three spreadsheets.
> Now it is one form, and every downstream system just knows.
>
> Layla Haddad · Director, AquaElite Swim

#### Stat block

- 40+ configurable fields per sport, out of the box
- 30 seconds average time to enroll a new athlete on the mobile web app
- 100% of guardian records carry consent flags for photo, medical, and transport

#### Related products

- **Teams** · Group athletes into squads and age brackets · `/products/teams`
- **Scheduling** · Sessions, RSVPs, and tap-to-check-in attendance ·
  `/products/scheduling`
- **Performance** · Track metrics with sport-specific attribute sets ·
  `/products/performance`

#### CTA

**H2:** One record, one system, one truth

**Sub:** Start with your first athlete in under 30 seconds. Your workspace stays
free until you cross the Starter limit.

**Primary CTA:** Start managing athletes

**Secondary CTA:** Book a demo

### 4.2 Teams (/products/teams)

**Eyebrow:** Product

**H1:** Teams

**Subheading:** Build squads and age groups, assign coaches, and keep rosters in
sync across every program. Team-level views for coaches, roster tools for
admins.

**Primary CTA:** Build your rosters (signup)

#### What is Teams

Teams turns your academy's organizational chart into a queryable, permissioned
graph. Every squad has a coach or two, a roster with size limits, a season, a
home branch, and a sport-specific identity. Athletes move between squads as they
age up or specialize; every move is recorded and every downstream system
(invoices, schedules, standings) updates in real time.

Teams sits on top of the sport-agnostic governance layer. A "governance team" is
the raw organizational unit. A `SportTeam` extends it with a sport key, an age
group, a roster capacity, and coach assignments. This lets you run a "First
Team" governance entity that maps to a football `SportTeam`, a basketball
`SportTeam`, and a swim `SportTeam` if your academy is truly multi-sport.

#### Feature bento

| Icon                  | Title                 | Description                                                                                       |
| --------------------- | --------------------- | ------------------------------------------------------------------------------------------------- |
| `RectangleStackIcon`  | Squads and age groups | Create teams by sport, level, or age band. Move athletes between rosters in bulk when tryouts run |
| `UserGroupIcon`       | Coach assignments     | Assign head coaches and assistants per team. Coaches only see the teams they manage               |
| `CheckCircleIcon`     | Roster limits         | Set minimum and maximum sizes per team. Overflow drops into a waitlist automatically              |
| `ChartBarIcon`        | Team performance      | Aggregate athlete metrics into team-level dashboards. Compare across squads in one view           |
| `CreditCardIcon`      | Team-based invoicing  | Bill by team. One invoice covers every athlete on the roster with automatic guardian split        |
| `MegaphoneIcon`       | Team broadcasts       | Message an entire roster and its guardians in one action. Reply-to-coach threading built in       |
| `TrophyIcon`          | Season history        | Every roster, every result, every coach change tracked per season. Historical continuity intact   |
| `ArrowsRightLeftIcon` | Transfers             | Move athletes between teams and branches with a full audit trail on every transfer                |

#### Deep-dive stories

##### Multi-branch teams, one truth

Northgate FC runs three branches with 40 teams between them. Before Academorix,
they maintained three spreadsheets and reconciled them manually every Sunday
night. Now every team belongs to one branch, every roster is a live query, and
the head coach can see network-wide participation for their age group without a
single manual export.

##### Roster ops without spreadsheet gymnastics

Roster limits, waitlists, and bulk moves work like an inbox, not like an Excel
macro. Set a maximum of 22 for the U14s; anyone who registers beyond that lands
on the waitlist automatically. When a family withdraws, the next waitlisted
athlete gets promoted with an email that reads like it came from you. Bulk moves
("promote all U11s who are eligible to U12 for next season") take a click.

##### Coaches see their teams and nothing else

Assigning coach roles is a first-class operation. A coach only sees the squads
they are attached to; a head coach sees their squad plus their assistants; an
owner sees everything. The scoping is enforced at the database layer, not the UI
layer, so a leaked screenshot cannot expose data the coach was never supposed to
see in the first place.

##### Sport-agnostic where it matters, sport-specific where it counts

A `SportTeam` carries the sport key, age group, roster capacity, and coach
assignments. Sport-specific behavior (11v11 vs. 5v5 for football, lane
assignments for swimming, weight classes for martial arts) flows through the
domain-sports registry with typed configuration per discipline. You never write
custom code to add a new sport. You configure it.

#### Persona relevance

| Persona          | Why this matters                                                                |
| ---------------- | ------------------------------------------------------------------------------- |
| Owners           | Roster capacity, coach assignments, and waitlists at the network level          |
| Coaches          | A team-level dashboard with athletes, attendance, and performance in one view   |
| Front-desk staff | Bulk enrollments into teams with waitlists and family split billing             |
| Guardians        | One team page per child with the season schedule, invoices, and coach contact   |
| Finance          | Team-level invoicing that respects family discounts and multi-athlete guardians |

#### Compliance angle

Team assignments carry an audit trail. Every roster change, coach reassignment,
and transfer emits an event to `data-audit` with actor, timestamp, and
before/after state. Retention windows respect the tenant's audit-log retention
(30 days on Growth, 1 year on Pro, up to 7 years on Enterprise).

#### Testimonial

> We used to move athletes between squads via a group chat. Now the roster is
> the source of truth. Coaches show up on Saturday and the team is already
> right.
>
> Marcus Bell · Head Coach, Summit Hoops

#### Stat block

- 100 teams supported per Pro workspace, unlimited on Enterprise
- 22 players per team maximum, configurable per team
- 60 seconds average time to run a season-to-season promotion in bulk

#### Related products

- **Athletes** · Rich profiles, guardians, and documents · `/products/athletes`
- **Scheduling** · Sessions, matches, and RSVPs per team ·
  `/products/scheduling`
- **Payments** · Invoice by team with guardian split · `/products/payments`

#### CTA

**H2:** Rosters that stay in sync

**Sub:** Set your teams up in an afternoon and let the platform keep them right
for the season.

**Primary CTA:** Build your rosters

**Secondary CTA:** Talk to sales

### 4.3 Scheduling and attendance (/products/scheduling)

**Eyebrow:** Product

**H1:** Scheduling and attendance

**Subheading:** Plan training and fixtures, then capture attendance in a tap.
Recurring schedules, RSVP reminders, and per-branch calendars all in one place.

**Primary CTA:** Try scheduling (trial)

#### What is Scheduling and attendance

Scheduling and attendance is the operational heart of the platform. Every
training session, fixture, and private session lands on a shared calendar.
Guardians see their child's week on the mobile web. Coaches see who is showing
up. Owners see which squads are consistently oversubscribed and which are
quietly bleeding attendance.

The scheduling engine supports recurring rules (weekly, biweekly, custom RRULE),
one-off events, and cancellation with reason. Attendance ships in four modes:
manual, QR-scan, NFC tap, and self-check-in. Every method feeds the same
`Attendance` record so downstream analytics do not care how the attendance was
captured.

#### Feature bento

| Icon                 | Title                        | Description                                                                                             |
| -------------------- | ---------------------------- | ------------------------------------------------------------------------------------------------------- |
| `ClockIcon`          | Recurring sessions           | Set up weekly training in one click. Modify one instance without breaking the pattern                   |
| `BellAlertIcon`      | RSVP and reminders           | Members get email and SMS reminders before each session. Coaches see who is confirmed at a glance       |
| `QrCodeIcon`         | Tap-to-check-in              | Athletes scan a QR or tap an NFC card at the door. Attendance updates in real time on the coach view    |
| `MapIcon`            | Multi-branch calendars       | Every branch has its own calendar, or view the whole network in one composite                           |
| `CheckCircleIcon`    | Guardian pickup verification | Log who dropped off and picked up each athlete. Digital audit trail for safeguarding compliance         |
| `ChartPieIcon`       | Attendance analytics         | Attendance rates per athlete, team, and coach. Flag drop-offs before retention becomes a problem        |
| `CloudArrowDownIcon` | Offline capture              | Coaches on the field take attendance without a signal. Records sync when they get back to base          |
| `CalendarDaysIcon`   | Calendar subscriptions       | Every user gets an iCal feed of their events. Google Calendar, Apple Calendar, and Outlook stay in sync |

#### Deep-dive stories

##### The four ways attendance actually gets taken

A junior swim coach with cold fingers on a poolside iPad. A martial arts sensei
who has 20 kids lined up at the door with belts to check. A basketball coach
with a wall-mounted QR scanner. A guardian dropping off from a moving car who
taps the front-desk NFC pad. Academorix supports all four capture methods and
records exactly which one was used on each attendance row.

##### Recurring rules that survive real life

Training runs every Tuesday and Thursday from 6pm to 7:30pm. But this Tuesday
the field is booked for a match. Next Thursday is a public holiday. Academorix
models recurrence as an RRULE plus per-instance overrides, so you can cancel one
session, move another, and change the venue for the whole month without editing
30 separate calendar entries. Guardians get one notification per real change,
not a barrage.

##### Pickup verification that satisfies auditors

For younger athletes, "who dropped off and picked up" is a compliance-critical
field. Academorix captures it either via QR code, NFC tag, or manual entry from
the front desk. Every record carries a timestamp, a location, and the identity
of the guardian (or their designated stand-in). Safeguarding officers can pull
an audit trail for any child, any date range, in one query.

##### Analytics that flag drop-offs before renewals

The single most predictive metric for churn is attendance rate. Academorix rolls
per-athlete attendance up to the team and the branch, flags athletes whose
attendance has dropped below 60 percent in the past 30 days, and surfaces them
in the owner's retention view. Talk to that family before the renewal, not after
they leave.

#### Persona relevance

| Persona               | Why this matters                                                            |
| --------------------- | --------------------------------------------------------------------------- |
| Owners                | Real-time attendance across the network, filtered by branch, team, or coach |
| Coaches               | Tap-to-check-in on the mobile web, with the roster pre-populated from RSVPs |
| Front-desk staff      | Pickup verification and last-minute drop-offs with guardian audit trail     |
| Guardians             | RSVP once and the reminder cadence handles the rest                         |
| Safeguarding officers | Pickup and drop-off logs that satisfy every audit                           |

#### Compliance angle

Every attendance capture emits an event to `data-audit` with the actor (which
coach), the method (manual, QR, NFC, self), and the resulting status. Pickup
verification carries a photo capture option that stores the image in
region-scoped encrypted storage. Retention respects your workspace's audit-log
window.

#### Testimonial

> We had a coach quit in the middle of the season. Two days later, his
> replacement was running the same sessions with the same attendance data. Zero
> context loss.
>
> Sara Nassar · Operations Lead, Northgate FC

#### Stat block

- 4 attendance capture modes: manual, QR, NFC, self-check-in
- 30 seconds average time to take attendance for a squad of 20
- 99.5% attendance capture rate across our active tenants

#### Related products

- **Teams** · Assign coaches, size rosters, and message squads ·
  `/products/teams`
- **Reception** · Front-desk approvals for registrations and refunds ·
  `/products/reception`
- **Reports** · Attendance dashboards for finance and ops · `/products/reports`

#### CTA

**H2:** From spreadsheet to source of truth

**Sub:** Live in an afternoon. Your first attendance capture is one tap away.

**Primary CTA:** Try scheduling

**Secondary CTA:** Book a demo

### 4.4 Payments and memberships (/products/payments)

**Eyebrow:** Product

**H1:** Payments and memberships

**Subheading:** Plans, invoices, and renewals with a clear view of outstanding
balances and revenue. Stripe and Paddle built in; local gateways on Enterprise.

**Primary CTA:** Set up billing (signup)

#### What is Payments and memberships

Payments is the finance engine of Academorix. Recurring memberships, one-off
invoices, family accounts with sibling discounts, and pay-as-you-go extras like
private sessions and match-pack bundles all flow through a single
accounts-receivable ledger. Stripe is available on every plan; Paddle unlocks on
Pro; local gateways (HyperPay, Tap, Moyasar, PayFort) plug in on Enterprise.

Every invoice is versioned, immutable once sent, and localized to the family's
language and currency. Reminders go out on your cadence: three days before due,
on the due date, and every seven days after. Guardians pay from the email or the
mobile web. Refunds and adjustments route through Reception's approval queue so
the front desk cannot accidentally cost you a month of revenue.

#### Feature bento

| Icon                 | Title                  | Description                                                                                                           |
| -------------------- | ---------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `ReceiptPercentIcon` | Recurring memberships  | Monthly, quarterly, or annual plans with proration on upgrades. Cancellations settle to the end of the current period |
| `DocumentTextIcon`   | Invoices and reminders | Automated PDF invoices with configurable reminder cadences. Guardians can pay directly from the email                 |
| `CreditCardIcon`     | Multiple gateways      | Stripe on every plan. Paddle on Pro. Custom local gateways on Enterprise for regional coverage                        |
| `KeyIcon`            | Family accounts        | One guardian pays for multiple athletes. Family discounts calculated automatically on the invoice                     |
| `ChartBarIcon`       | AR dashboards          | Outstanding balances by branch, team, and family. Follow-up workflows for overdue accounts                            |
| `ShieldCheckIcon`    | PCI-safe by default    | Card data never touches our servers. Everything flows through the gateway's Elements or iframe integration            |
| `GlobeAltIcon`       | Multi-currency         | Bill in SAR, AED, EGP, USD, GBP, and every currency Stripe supports                                                   |
| `ArrowUturnLeftIcon` | Refunds with approval  | Refunds route to the reception queue, keep an audit trail, and reverse cleanly against the original invoice           |

#### Deep-dive stories

##### One family, one invoice, one payment

The average academy has families with two or three athletes. Sending three
invoices per family, one per athlete, is the biggest cause of dropped payments
in the industry. Academorix rolls every athlete under the same guardian into one
monthly invoice with per-athlete line items, applies the family discount
(configurable per plan), and delivers a single PDF with a single "Pay now"
button. Guardians pay once and everyone's dues are settled.

##### Recurring memberships that survive edge cases

A family upgrades from monthly to annual mid-cycle. Another family cancels but
wants to attend the sessions they already paid for. A third family pauses for
the summer. Every one of these is a first-class operation, not a support ticket.
Proration handles the upgrade; cancellations settle to the end of the current
period; pauses freeze the recurrence without touching the roster.

##### AR that flags problems before they compound

Every outstanding balance appears on the owner's finance dashboard, sortable by
age. Families past 30 days go into the follow-up workflow (soft email, then hard
email, then reception task). Payments post in real time via Stripe and Paddle
webhooks. Nothing quietly slips through the cracks.

##### Local gateways for local realities

MENA operators need HyperPay, Tap, or Moyasar. Egyptian operators want Fawry.
European operators need SEPA direct debit. Academorix supports plugging in a
local gateway on Enterprise plans, with routing rules that pick the right
gateway per branch, per currency, or per family. Stripe and Paddle keep working;
the local gateway sits alongside, not on top.

#### Persona relevance

| Persona          | Why this matters                                                             |
| ---------------- | ---------------------------------------------------------------------------- |
| Owners           | Revenue, AR, and churn on one dashboard, with drill-down per branch          |
| Finance          | A single AR ledger, versioned invoices, and audit trails on every adjustment |
| Front-desk staff | Refund approvals with a reason field and an audit trail                      |
| Guardians        | One invoice per family, paid in one click from an email or the mobile web    |
| Coaches          | Never mentioned. Coaches should not touch billing                            |

#### Compliance angle

PCI DSS Level 1 compliance is inherited from Stripe and Paddle. Card data never
touches our servers. VAT-compliant invoices for EU and UK. GCC VAT for MENA.
Tax-exempt invoicing for US 501(c)(3) non-profits. HIPAA BAA available on
Growth-plus with a $350 per month regulatory surcharge for US healthcare
partners and sports-medicine clinics.

#### Testimonial

> Multi-branch billing used to be a nightmare. Now renewals just work, in Arabic
> and English, across three currencies.
>
> Sara Nassar · Operations Lead, Northgate FC

#### Stat block

- 3 payment gateways supported out of the box on Pro (Stripe, Paddle, one local)
- 2,500 invoices per month included on Pro
- Under 90 seconds median guardian time from email open to payment

#### Related products

- **Athletes** · Link invoices to athlete records automatically ·
  `/products/athletes`
- **Reception** · Front-desk refund and adjustment approvals ·
  `/products/reception`
- **Reports** · Revenue, AR, and churn dashboards · `/products/reports`

#### CTA

**H2:** From receivables chaos to clean AR

**Sub:** Connect Stripe in five minutes. Your first invoice ships the same day.

**Primary CTA:** Set up billing

**Secondary CTA:** Talk to sales

### 4.5 Performance and progress (/products/performance)

**Eyebrow:** Product

**H1:** Performance and progress

**Subheading:** Sport-specific metrics rendered from configurable attribute
sets, no code changes per sport. Track fitness benchmarks, skill progression,
and match stats.

**Primary CTA:** Track performance (signup)

#### What is Performance and progress

Performance is where Academorix moves from "operations software" to
"developmental platform." Every sport in the system has its own attribute set:
FIFA-style cards for football (pace, shooting, passing, dribbling, defending,
physical), per-stroke splits for swimming, apparatus scores for gymnastics, belt
levels for martial arts. Coaches record assessments periodically; the platform
stores them as versioned snapshots so a card printed today reflects the
attribute schema that was in effect at the time.

The engine underneath is the same one that drives every sport-variable form in
Academorix. Add a new sport and its attribute set is available across the whole
platform (Performance, Reports, AI, mobile). No client rebuild. No per-sport
deploy. Configuration only.

#### Feature bento

| Icon                        | Title                        | Description                                                                                                |
| --------------------------- | ---------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `AdjustmentsHorizontalIcon` | Configurable attribute sets  | Define what performance means for your sport. Server-driven UI renders the right form for each discipline  |
| `ClockIcon`                 | Longitudinal history         | Every metric captured over time. Coaches spot progression curves and plateau moments in one view           |
| `ChartPieIcon`              | Squad comparisons            | Compare athletes head-to-head or against squad benchmarks. Selection meetings run on evidence, not opinion |
| `DocumentTextIcon`          | Sport-specific reports       | Auto-generated progress reports customized per sport. Share as branded PDFs directly with families         |
| `CheckCircleIcon`           | Belt and grading progression | Martial arts and gymnastics. Belt schemes with prerequisites, testing dates, and certificate generation    |
| `SparklesIcon`              | AI-drafted summaries         | Turn a season of raw data into a plain-language progress summary. Coaches review and edit before sending   |
| `ScaleIcon`                 | Fitness testing              | Termly test batteries with per-athlete percentile against age-band benchmarks                              |
| `TrophyIcon`                | Man-of-the-match and awards  | Recognize standout performances and roll them into season awards                                           |

#### Deep-dive stories

##### One engine, every sport

The problem every sports platform hits sooner or later: FIFA-style cards work
for football, but they are useless for swimming. Swimming needs per-stroke
splits, PB detection, and heat sheets. Gymnastics needs apparatus scoring with
code-of-points math. Martial arts needs belt schemes with prerequisites.
Academorix's attribute engine lets each sport define its own field set in typed
JSON, and the platform renders the right UI, the right report, and the right AI
summary automatically.

##### Assessments that respect history

An attribute set evolves. You might rename "shooting" to "finishing" for
football, or add a new skill for a new age band. If an athlete was assessed a
year ago on the old schema, you do not want the historical card to lose its
labels. Academorix versions every attribute set and stores the schema version on
every assessment record. Historical cards render exactly as they were meant to;
new cards use the current schema.

##### Progress that is a story, not a table

A raw list of scores across 12 months is data, not development. Academorix
computes deltas per attribute, flags plateaus, and generates a season narrative
that a coach can review and edit in under five minutes. The AI-drafted summary
uses the same underlying data the coach sees; the coach approves before it ships
to the family.

##### Rankings and standings that respect the sport

FIFA-style cards produce an overall rating and a rank tier (Bronze, Silver,
Gold, Diamond). Swimming ranks by per-stroke PB progression against age-band
benchmarks. Basketball ranks by minutes-adjusted efficiency. Every sport gets a
ranking model that reflects how that sport is actually judged.

#### Persona relevance

| Persona       | Why this matters                                                                        |
| ------------- | --------------------------------------------------------------------------------------- |
| Owners        | Squad-level and network-level development curves, drill-down to any athlete             |
| Coaches       | The core assessment tool. Record, compare, and generate reports without leaving the app |
| Athletes      | See their own progress and where they are compared to the squad                         |
| Guardians     | Auto-generated seasonal reports with plain-language coach commentary                    |
| Talent scouts | Filter and rank athletes by any attribute or delta across seasons                       |

#### Compliance angle

Performance data is not "sensitive" in the GDPR sense, but the attributes and
assessments carry identifying information about minors. Every assessment record
is tied to an athlete, which is scoped to the tenant, which is subject to your
data-residency and retention settings. Coaches with the "Progress editor" role
can create and edit; guardians see read-only summaries; the general public sees
nothing.

#### Testimonial

> We track pass percentage, shot conversion, and tackle wins per position now.
> Previously we did none of this because the tools did not fit football.
>
> Sara Nassar · Operations Lead, Northgate FC

#### Stat block

- 6 sport-specific attribute sets shipped, plus the generic set for any new
  discipline
- 30-plus attributes per sport, on average
- Under 5 minutes to draft a full season report with AI assistance

#### Related products

- **Athletes** · Store metrics on the athlete's timeline · `/products/athletes`
- **Attribute engine** · The engine behind sport-agnostic forms and reports ·
  `/products/attribute-engine`
- **AI Assistant** · Auto-draft progress summaries and attribute sets ·
  `/products/ai`

#### CTA

**H2:** Development that shows up in the numbers

**Sub:** Track the metrics that matter for your sport. Ship your first
assessment in an afternoon.

**Primary CTA:** Track performance

**Secondary CTA:** Talk to sales

### 4.6 Reception (/products/reception)

**Eyebrow:** Product

**H1:** Reception

**Subheading:** The front-desk approvals queue for registrations, documents,
refunds, and adjustments. Keep the desk running while owners focus on strategy.

**Primary CTA:** Open your desk (signup)

#### What is Reception

Reception is the operational surface for the people at the front of the academy.
It aggregates every task that needs a human decision (a new registration
awaiting approval, a document upload waiting for verification, a refund request
from a guardian) into one prioritized inbox. Front-desk staff work the queue;
owners see the metrics; guardians get faster answers.

The queue is a first-class approval system, not a chat log. Every task carries a
type, a priority, a claim mechanism (so two receptionists do not
double-approve), a full history, and a downstream side effect. Approving a
registration creates the enrollment. Rejecting a refund emits an event to the
guardian's inbox. Every action is auditable, timestamped, and attributable.

#### Feature bento

| Icon                      | Title                  | Description                                                                                                |
| ------------------------- | ---------------------- | ---------------------------------------------------------------------------------------------------------- |
| `InboxStackIcon`          | Unified approval queue | Every pending action, from new registrations to refund requests, in one prioritized list                   |
| `CheckCircleIcon`         | One-click approvals    | Approve or reject with a reason in one action. Downstream systems (invoices, rosters) update automatically |
| `DocumentTextIcon`        | Document verification  | Preview medical forms and waivers inline. Mark as verified or request corrections in the same view         |
| `ChatBubbleLeftRightIcon` | Guardian communication | Message the family directly from the approval task. Full thread history stays attached                     |
| `ShieldCheckIcon`         | Branch-scoped access   | Front desk sees only their branch's queue by default. Owners can flip to a network-wide view               |
| `ChartPieIcon`            | Desk-level analytics   | Average approval time, refund rates, and backlog per desk. Continuous improvement without spreadsheets     |
| `LockClosedIcon`          | Claim to work          | Two staff cannot pick up the same task. Claims expire so nothing gets stuck                                |
| `BoltIcon`                | SLA timers             | Each task type has a target response window. Approaching deadlines float to the top of the queue           |

#### Deep-dive stories

##### One queue, seven task types

A reception team should not need seven different tools to run their day.
Academorix consolidates every task type (new athlete registration, document
upload verification, refund request, session cancellation, family transfer,
coach change, guardian consent update) into one queue. Filters slice by type;
the default view is chronological with SLA-approaching items pinned to the top.

##### Approvals with real downstream effects

An approval in Reception is a state transition on the underlying entity, not a
status flag. Approving a new registration transitions the enrollment from
PENDING to ACTIVE, creates the first invoice, adds the athlete to the team
roster, and notifies the family. Rejecting reverses the pending state and emails
the family with the reason. Every effect is atomic; every effect is auditable.

##### The desk that never loses context

When a family calls in about a refund, the receptionist can see the invoice, the
payment method, the refund policy, the original coach's notes, the guardian's
contact history, and the current state of the approval task on one screen. The
escalation path (to the owner, to finance) is one click, and the escalated task
carries the full context with it.

##### Analytics that improve the desk

Owners see average approval time per task type, backlog per desk, refund rates
by branch, and rejection reasons. When the backlog crosses a threshold, the
receptionist gets a nudge; when a specific reason for rejection accounts for
more than 20 percent of rejections, the intake form gets updated to catch it
earlier.

#### Persona relevance

| Persona          | Why this matters                                                            |
| ---------------- | --------------------------------------------------------------------------- |
| Owners           | Real-time desk health across every branch, with drill-down per receptionist |
| Front-desk staff | The core tool. Their entire day runs in Reception                           |
| Coaches          | Rarely. Coach approvals for private-session requests appear here            |
| Guardians        | Faster resolution on registrations, refunds, and adjustments                |
| Finance          | Refund approval workflow with an audit trail on every adjustment            |

#### Compliance angle

Every approval and rejection emits an event to `data-audit`. Refund reasons and
adjustment history are subject to your retention settings. Document verification
tasks respect the same access controls as the underlying documents; a
receptionist cannot see a medical clearance unless they have the "Medical" role.

#### Testimonial

> Refunds used to bounce between reception and finance for a week. Now they
> route in the queue, everyone sees the state, and we close them within a day.
>
> Layla Haddad · Director, AquaElite Swim

#### Stat block

- 7 distinct task types managed in one queue
- Under 6 hours median approval time on Growth-tier workspaces
- 100% audit coverage on every approval or rejection

#### Related products

- **Payments** · Approve refunds and adjustments from the queue ·
  `/products/payments`
- **Athletes** · Verify documents on the athlete record · `/products/athletes`
- **Reports** · Desk performance and backlog dashboards · `/products/reports`

#### CTA

**H2:** A desk that runs itself

**Sub:** Point your reception team at one queue and let the platform prioritize
the rest.

**Primary CTA:** Open your desk

**Secondary CTA:** Book a demo

### 4.7 Reports and dashboards (/products/reports)

**Eyebrow:** Product

**H1:** Reports and dashboards

**Subheading:** Prebuilt dashboards for finance, ops, retention, and
performance, plus custom reports and scheduled exports on Pro and Enterprise
plans.

**Primary CTA:** Explore reports (signup)

#### What is Reports and dashboards

Reports is the visibility layer on top of every other product in Academorix.
Prebuilt dashboards ship on day one; custom reports and scheduled exports unlock
on Pro; natural-language queries unlock on Growth via the AI Assistant add-on.
Every dashboard rolls up cleanly from athlete-level records, so the number you
see on the executive summary is the same number you can drill into on the
athlete record.

Every report is exportable as PDF or CSV, brandable with your academy's logo and
colors, and schedulable to email on a cadence you define. Board packs write
themselves.

#### Feature bento

| Icon                        | Title                    | Description                                                                                            |
| --------------------------- | ------------------------ | ------------------------------------------------------------------------------------------------------ |
| `ChartBarIcon`              | Prebuilt dashboards      | Finance, ops, retention, safeguarding. Ready on day one, no configuration required                     |
| `AdjustmentsHorizontalIcon` | Custom reports (Pro+)    | Drag-and-drop report builder for the exact numbers your board asks about. Save and share with the team |
| `ClockIcon`                 | Scheduled exports        | Auto-email CSVs and PDFs on your cadence. In the finance director's inbox every Monday, hands off      |
| `MapIcon`                   | Multi-branch roll-ups    | One number for the whole network, or slice by branch, team, or coach. Pivots in one click              |
| `DocumentTextIcon`          | Board-ready PDFs         | Every report exports as a branded PDF suitable for board decks and quarterly reviews                   |
| `SparklesIcon`              | Natural-language queries | Ask a question in plain language, get a chart back. Powered by the AI Assistant (Growth+)              |
| `ArrowUpTrayIcon`           | Data warehouse export    | Push nightly extracts to Snowflake, BigQuery, or S3 on Enterprise                                      |
| `EnvelopeIcon`              | Email delivery           | Reports land in inboxes on your cadence, with configurable recipients and formats                      |

#### Deep-dive stories

##### Dashboards that mirror the way academies actually work

Owners want revenue, AR aging, retention rate, and safeguarding compliance in
one glance. Finance wants cash flow, discount penetration, and refund rate.
Coaches want attendance, performance progression, and session RSVP rates. Every
dashboard in Academorix is scoped to the persona and role of the viewer; each
shows only the metrics that role can act on.

##### Custom reports without SQL

Pro-plan users get a drag-and-drop report builder. Pick a dimension (branch,
team, sport, athlete, guardian, coach), a metric (count, sum, average, delta), a
filter (any attribute or state), and a visualization. Save the report, share it
with the team, or schedule it to email. No SQL, no queries, no analyst
dependency.

##### Scheduled exports that run themselves

Every academy has a Monday-morning finance meeting. Every meeting starts with
someone asking "did anyone pull last week's numbers?" With Academorix, the
answer is always yes. Schedule any report to run at 7am on Monday and land as a
branded PDF in the finance director's inbox. Nothing to remember, nothing to run
manually.

##### Ask a question, get a chart

The AI Assistant integrates directly with Reports. "Which teams dropped
attendance more than 10 percent last month?" produces a chart with the drop-off
ranking. "How much revenue did we make from private sessions in Q3?" produces a
bar chart by branch. The underlying query is transparent; power users can
inspect and adjust it.

#### Persona relevance

| Persona          | Why this matters                                                           |
| ---------------- | -------------------------------------------------------------------------- |
| Owners           | Executive summary of every metric that matters, with drill-down per branch |
| Coaches          | Squad and athlete-level dashboards for attendance and performance          |
| Front-desk staff | Backlog and approval-time dashboards for their branch                      |
| Finance          | Revenue, AR, refund rate, and cash-flow reports with scheduled exports     |
| Board members    | Read-only PDFs delivered on a cadence, no login required                   |

#### Compliance angle

Reports respect every role scope and every data-residency constraint. A coach's
dashboard cannot show data from a squad they are not attached to; an EU-region
tenant's data never leaves the region. Scheduled exports respect the same rules;
the PDF in your inbox is the same slice of data you have permission to see in
the app.

#### Testimonial

> The board pack that used to take three days now writes itself. Monday morning,
> in the inbox, branded, no manual work.
>
> Marcus Bell · Head Coach, Summit Hoops

#### Stat block

- 20+ prebuilt dashboards across finance, ops, retention, and safeguarding
- 100+ dimensions and metrics available in the custom report builder
- Under 30 seconds median generation time for a monthly board pack

#### Related products

- **Payments** · Feed revenue and AR data into finance dashboards ·
  `/products/payments`
- **Scheduling** · Attendance rates power retention reports ·
  `/products/scheduling`
- **AI Assistant** · Natural-language queries on your data · `/products/ai`

#### CTA

**H2:** Visibility across the network

**Sub:** Prebuilt dashboards from day one. Custom reports whenever you need
them.

**Primary CTA:** Explore reports

**Secondary CTA:** Book a demo

### 4.8 Safeguarding (/products/safeguarding)

**Eyebrow:** Product

**H1:** Safeguarding

**Subheading:** Compliance records, incident logging, and role-scoped access.
Everything a modern academy needs to demonstrate a culture of safety.

**Primary CTA:** Talk to compliance (contact sales)

#### What is Safeguarding

Safeguarding is the specialist compliance surface of Academorix. Coach
credentials with expiry alerts, structured incident forms with severity levels
and follow-up workflows, guardian pickup verification, and role-scoped access to
sensitive fields all live in one product. Safeguarding officers get a dedicated
view; owners see a compliance dashboard; the general staff see nothing they are
not cleared to see.

Every academy in every jurisdiction has to demonstrate a culture of safety to
boards, regulators, and families. Safeguarding turns that from a spreadsheet
burden into an operational routine.

#### Feature bento

| Icon               | Title                        | Description                                                                                               |
| ------------------ | ---------------------------- | --------------------------------------------------------------------------------------------------------- |
| `DocumentTextIcon` | Coach credential tracking    | Certifications, background checks, and safeguarding training logged per coach with expiry alerts          |
| `BellAlertIcon`    | Incident reporting           | Structured incident forms with severity levels, follow-up workflows, and audit trail from open to closure |
| `KeyIcon`          | Role-scoped access           | Safeguarding officer sees the full picture. Coaches see their squad. Other staff see nothing sensitive    |
| `CheckCircleIcon`  | Guardian pickup verification | Digital log of who dropped off and picked up each athlete. Signed, timestamped, and searchable            |
| `ChartPieIcon`     | Compliance dashboards        | One view of every open incident, expiring credential, and pending training. Board-ready evidence          |
| `ShieldCheckIcon`  | GDPR / DPA ready             | Export or delete personal data per athlete on request. Data residency options on Enterprise               |
| `HeartIcon`        | Medical clearance workflow   | Athletes need current clearance to be selected. Expired clearance blocks squad selection automatically    |
| `AcademicCapIcon`  | Training and testing         | Track every mandatory training a coach has completed, with reminders on renewals                          |

#### Deep-dive stories

##### The safeguarding officer's day, redesigned

A safeguarding officer at a mid-sized academy tracks 40 coaches, 800 athletes,
and about 20 open incidents at any time. Before Academorix, that meant three
spreadsheets, four inbox folders, and a lot of anxiety about missed expiries.
Now everything (coach credentials, incident status, pickup logs, medical
clearance) lives in one product with one queue and one dashboard.

##### Incidents that go from "reported" to "closed"

An incident is not "written down" and forgotten. Academorix models it as a state
machine: REPORTED → UNDER INVESTIGATION → RESOLVED, or REPORTED → ESCALATED →
EXTERNAL REVIEW → CLOSED. Every transition requires an actor, a timestamp, and
(for severe incidents) an approval chain. Guardians get updates at the right
cadence; the safeguarding officer sees the queue; the board sees the closure
rate.

##### Pickup verification that satisfies boards and regulators

Every drop-off and pickup is logged with the guardian's identity, a timestamp,
and (on Enterprise) an optional photo. Access to the logs is role-scoped:
coaches see their own team's pickups, safeguarding officers see the whole
network, regulators can be granted a time-limited read-only export.

##### Access control that is not "we trust the coaches"

Sensitive fields (medical notes, incident details, safeguarding officer
commentary) require a specific role. The database enforces the scope at query
time; the application layer cannot leak them by mistake. When a coach opens an
athlete's profile, the medical section is either present with a "Medical role"
note or absent entirely. No screenshots that should not exist.

#### Persona relevance

| Persona               | Why this matters                                                                                |
| --------------------- | ----------------------------------------------------------------------------------------------- |
| Owners                | Compliance dashboard for the whole network. Never a surprise regulator visit                    |
| Safeguarding officers | Every credential, incident, pickup, and clearance in one product                                |
| Coaches               | Reminders on their own credential expiries, and clear rules for when they can select an athlete |
| Front-desk staff      | Pickup verification and consent flag checks at intake                                           |
| Guardians             | Confidence that their child's details are seen only by people who should see them               |

#### Compliance angle

Safeguarding is designed to help you demonstrate a culture of safety to any
regulator. GDPR, DPA (UK), CCPA (California), and local safeguarding frameworks
(KCSIE in the UK, safeguarding-in-sport charters in the GCC) are supported
through role-scoped access, audit trails, retention windows, and data-subject
request workflows. HIPAA BAA is available on Growth-plus at a $350 per month
regulatory surcharge for US healthcare partners.

#### Testimonial

> Our last regulator visit took an afternoon. Every question they asked, we
> pulled the report in front of them.
>
> Layla Haddad · Director, AquaElite Swim

#### Stat block

- 100 percent audit coverage on incidents from open to closure
- 30, 14, and 7 day expiry alerts on every credential and clearance
- 3 pickup verification methods: QR, NFC, front-desk manual with photo

#### Related products

- **Reception** · Verify documents at intake · `/products/reception`
- **Enterprise security** · SSO, audit logs, and data residency ·
  `/enterprise/security`
- **Reports** · Compliance dashboards and audit exports · `/products/reports`

#### CTA

**H2:** A culture of safety, evidenced

**Sub:** Sit with our compliance team to scope a rollout that satisfies your
regulators.

**Primary CTA:** Talk to compliance

**Secondary CTA:** Read the security page

### 4.9 AI Assistant (/products/ai)

**Eyebrow:** AI Assistant

**H1:** AI Assistant

**Subheading:** Ship attribute-set drafts, progress summaries, and drill
recommendations from a plain-language prompt. Available on Growth and above as a
paid add-on.

**Primary CTA:** See AI in action (signup)

#### What is AI Assistant

AI Assistant is the natural-language interface for Academorix. It ships as a
paid add-on on Growth and above; Enterprise plans support bring-your-own-key for
OpenAI or Anthropic so cost and governance stay on your side. Every AI feature
respects tenant scoping, role permissions, and the same audit trails as the rest
of the platform. Your data never trains external models. Inference runs in
isolated tenants.

The primary use cases: draft an attribute set for a sport we do not natively
support, generate a season-end progress summary for an athlete, suggest a drill
from your library that targets a specific development goal, and answer
plain-language questions on top of your reports data.

#### Feature bento

| Icon                        | Title                  | Description                                                                                                  |
| --------------------------- | ---------------------- | ------------------------------------------------------------------------------------------------------------ |
| `SparklesIcon`              | Attribute-set drafts   | Describe a sport in one paragraph, get a proposed attribute set back. Edit and publish in minutes            |
| `DocumentTextIcon`          | Progress summaries     | Turn a season of raw data into a family-ready progress summary. Coaches review and edit before sending       |
| `ChartBarIcon`              | Insight queries        | Ask questions in plain English and get a chart back. "Which teams dropped attendance last month?"            |
| `RectangleStackIcon`        | Drill recommendations  | Suggest drills from your library that target a specific development goal. Filtered by age and level          |
| `ShieldCheckIcon`           | Private by design      | Your data never trains external models. Inference runs against isolated tenants. Audit logs on every query   |
| `KeyIcon`                   | Bring your own key     | Enterprise plans support BYO OpenAI or Anthropic keys so cost and governance stay on your side               |
| `ChatBubbleLeftRightIcon`   | Conversational context | Follow-up questions preserve context so you can iterate on a report or a summary in a natural back-and-forth |
| `AdjustmentsHorizontalIcon` | Tuneable prompts       | Every AI-generated output has a coach-tuned system prompt so the voice matches your academy                  |

#### Deep-dive stories

##### The five-minute season report

A coach at the end of a swimming season needs to write 15 progress reports.
Under the old workflow, that was 15 hours. With AI Assistant, the coach opens
each athlete's page, clicks "Draft report," and gets a plain-language summary of
the season based on the athlete's attendance, per-stroke PBs, and coach notes.
The coach reads, edits, and signs off in five minutes per athlete. Reports ship
to families the next day.

##### Draft an attribute set for a new discipline

Your academy wants to add rugby. Rugby is not one of our six shipped sports, but
the attribute engine supports any discipline. Describe rugby in one paragraph
("I need a rugby attribute set with positional roles, tackle count, meters
carried, and try-scoring stats"), and AI Assistant drafts the attribute set. You
review the draft, edit fields, and publish. Rugby is now live in your workspace.

##### Natural-language reports for people who do not speak SQL

An owner does not want to build a report. They want an answer. "Which branches
are trending down on new registrations in the last 60 days?" comes back with a
bar chart and a short prose interpretation. The underlying query is transparent
so power users can adapt it into a saved report.

##### Drill recommendations tied to your library

Your academy has a curated drill library. When a coach identifies a development
need ("this athlete needs to work on ball control under pressure"), AI Assistant
recommends drills from your library that target the need. Not stock drills from
a generic database; drills your coaches trust because your coaches wrote them.

#### Persona relevance

| Persona          | Why this matters                                                              |
| ---------------- | ----------------------------------------------------------------------------- |
| Owners           | Natural-language queries on the whole network, without an analyst             |
| Coaches          | Season reports, drill suggestions, and coaching insights in minutes           |
| Front-desk staff | Suggested responses to guardian queries, with context from the athlete record |
| Guardians        | Better, more consistent progress reports for their children                   |
| Platform admins  | Attribute set drafts for new sports, ready for review and publication         |

#### Compliance angle

AI Assistant runs inference against isolated tenants. Your data never trains
external models. Every AI query and response is logged to `data-audit` with the
actor, the prompt, and the redacted output. Enterprise plans support BYO OpenAI
or Anthropic keys so the inference cost and the governance boundary stay on your
side. HIPAA BAA covers AI usage for the healthcare surcharge tier.

#### Testimonial

> Season-end reports used to take two weekends. Now they take one afternoon and
> read better than the ones we wrote by hand.
>
> Marcus Bell · Head Coach, Summit Hoops

#### Stat block

- 15 minutes average time to draft a per-athlete season report
- 3 attribute-set drafts per new sport, on average, before publication
- 100% audit coverage on every AI query and response

#### Related products

- **Performance** · AI-drafted progress summaries · `/products/performance`
- **Reports** · Natural-language queries on your data · `/products/reports`
- **Attribute engine** · AI-generated attribute-set drafts ·
  `/products/attribute-engine`

#### CTA

**H2:** A junior analyst on every team

**Sub:** Enable AI Assistant on your workspace in one click. Growth-plus, pay
per use.

**Primary CTA:** See AI in action

**Secondary CTA:** Read the security posture

### 4.10 Attribute engine (/products/attribute-engine)

**Eyebrow:** Engine

**H1:** Attribute engine

**Subheading:** The sport-agnostic engine behind Academorix. Every
sport-variable field is configuration. Add a discipline, tune its metrics, and
the right forms and views appear.

**Primary CTA:** Learn how it works (signup)

#### What is Attribute engine

Attribute engine is the reason Academorix can support any sport without a
client-side rebuild. Every sport-variable field (position, stroke, belt level,
apparatus score, per-stroke split) is defined in typed JSON. The backend serves
the schema; the frontend renders the right form, list, filter, and report. Add a
sport by publishing a new attribute set; publish an updated set to evolve the
fields for an existing sport.

The engine underpins Athletes, Performance, Reports, and AI. It also drives the
mobile app, so a new sport ships everywhere at once, with bilingual labels and
RTL rendering by default.

#### Feature bento

| Icon                        | Title               | Description                                                                                        |
| --------------------------- | ------------------- | -------------------------------------------------------------------------------------------------- |
| `AdjustmentsHorizontalIcon` | Server-driven UI    | Forms and views render from JSON schemas served by the backend. No client-side rebuild per sport   |
| `LanguageIcon`              | Bilingual labels    | Every attribute carries English and Arabic labels and hints. RTL-ready forms render automatically  |
| `ClockIcon`                 | Versioned schemas   | Old records keep their old schema. New records use the current one. History stays accurate         |
| `SparklesIcon`              | AI-generated drafts | Describe a new sport in a paragraph. Academorix drafts an attribute set from your description      |
| `CheckCircleIcon`           | Validation built in | Type-safe fields (int, decimal, enum, date, time) with min/max, patterns, and dependent conditions |
| `ShieldCheckIcon`           | Access-controlled   | Some fields (medical, safeguarding) can be role-scoped so only authorized staff see them           |
| `CodeBracketIcon`           | API and SDK         | The schema is queryable and mutable via API. Integrations can read the schema at runtime           |
| `ChartBarIcon`              | Reports-aware       | Every attribute is automatically available in the report builder and the AI Assistant              |

#### Deep-dive stories

##### One engine, six sports on day one

The six sports we ship (football, swimming, basketball, tennis, martial arts,
gymnastics) each have their own attribute set expressed in the same engine.
Football has FIFA-style pace, shooting, passing, dribbling, defending, and
physical. Swimming has per-stroke PBs and lane preferences. Martial arts has
belt schemes with prerequisites. Gymnastics has apparatus scores with
code-of-points math. Same engine, six different UIs, zero forked code.

##### Add a sport in an afternoon

Publish a new attribute set (either by hand or via the AI Assistant), enable it
in your workspace, and the sport is live everywhere: Athletes, Performance,
Reports, mobile, PDF exports. No deploy, no client update, no per-tenant
customization required.

##### Bilingual by default, RTL for real

Every attribute set carries English and Arabic labels. Forms render
right-to-left when the tenant's language is Arabic; numbers, dates, and currency
respect the tenant's regional settings. Icons that carry direction (arrows,
chevrons) flip automatically. The Arabic experience is not a translation of the
English experience; it is a first-class rendering.

##### Versioned schemas that respect history

An attribute set evolves over time. You might rename "shooting" to "finishing"
for football, add a new skill for a new age band, or reorder the fields for a
new UI. Every attribute-set version is stored; every athlete record carries the
version it was assessed on. Historical cards render with historical labels.
Nothing quietly changes underneath you.

#### Persona relevance

| Persona          | Why this matters                                                         |
| ---------------- | ------------------------------------------------------------------------ |
| Owners           | Rapid response to new sports, new age bands, or new coaching methods     |
| Coaches          | Forms that reflect their sport, not a generic template                   |
| Front-desk staff | Intake forms that adapt to the sport being registered                    |
| Platform admins  | The primary tool for configuring a new sport or evolving an existing one |
| Developers       | A well-documented schema-driven system that plays well with integrations |

#### Compliance angle

Access controls and role scoping are enforced at the schema level. A medical
field flagged as sensitive is invisible to a coach role, even in the mobile app.
Bilingual labels satisfy language-of-record requirements in bilingual regions.
Data residency scopes the schema and the values to the tenant's chosen region.

#### Testimonial

> We added a new attribute set for our women's football program in one
> afternoon. Same platform, different sport, zero engineer time.
>
> Sara Nassar · Operations Lead, Northgate FC

#### Stat block

- 6 shipped attribute sets, unlimited on Enterprise
- 30 attributes on average per shipped sport
- Under 4 hours from AI draft to published attribute set in most cases

#### Related products

- **Performance** · The primary consumer of attribute sets ·
  `/products/performance`
- **AI Assistant** · AI-drafted attribute sets in minutes · `/products/ai`
- **Reports** · Every attribute is queryable in the report builder ·
  `/products/reports`

#### CTA

**H2:** Any sport, any language

**Sub:** The engine ships with six sports. The next one is a paragraph away.

**Primary CTA:** Learn how it works

**Secondary CTA:** Talk to sales

---

## 5. Sport pages

Every sport page follows the same skeleton so UI teams can render one shared
template. Each page anchors on a hero, a "Why Academorix for this sport"
narrative, a feature bento (6 sport-specific features), a
KPIs-coaches-actually-track list, a progression/scoring model description, a
sport-specific testimonial, related sports links, and a CTA.

### 5.1 Football (/sports/football)

**Eyebrow:** Football academies

**H1:** Academorix for Football

**Subheading:** Run football academies of every size, from local grassroots
clubs to full multi-branch networks. Squads, matches, formations, and
per-position performance in one place.

**Primary CTA:** Start free trial

#### Why Academorix for Football

Football academies live and die by squad management, fixture scheduling, and
per-position performance tracking. General-purpose sports platforms treat all
sports the same way; football coaches end up bending their process to fit the
tool. Academorix inverts that: the platform ships with FIFA-style attribute
cards, formation builders, per-position stat sets (GK, DEF, MID, FWD), and
league table generation for internal competitions.

Whether you run a 60-athlete community club or a 20-branch national academy, the
same platform scales up. Add a squad, add a fixture, run the RSVP, take the
attendance, publish the lineup, log the result, capture the man-of-the-match,
and generate the season report. Every step is a first-class operation.

#### Feature bento

| Icon               | Title                    | Description                                                                                                  |
| ------------------ | ------------------------ | ------------------------------------------------------------------------------------------------------------ |
| `UsersIcon`        | Squads by age and level  | U8s to U18s, first team to reserves. Build the pyramid your club needs and let athletes move up as they grow |
| `CalendarDaysIcon` | Training and fixtures    | Weekly training blocks and league fixtures on one calendar. RSVPs from guardians before every kick-off       |
| `PuzzlePieceIcon`  | Formation builder        | Draft starting XI and subs per fixture. Save formations as templates and reuse them across squads            |
| `ChartBarIcon`     | Per-position performance | Configurable attribute sets for GK, DEF, MID, FWD. Track pass percent, shots on target, tackle wins per role |
| `TrophyIcon`       | League tables            | Internal competitions and inter-branch tournaments with automatic standings, top scorers, and clean sheets   |
| `CreditCardIcon`   | Membership fees          | Seasonal, monthly, or match-pack fees with family discounts and automatic renewal reminders                  |

#### KPIs coaches actually track

Football has a well-defined statistical model, and Academorix ships the full
attribute set out of the box.

- **Primary stats (FIFA-style, 0-100 sliders):** pace, shooting, passing,
  dribbling, defending, physical
- **Detailed skills (0-100 sliders):** sprint speed, stamina, positioning,
  aggression, vision
- **Position and role:** primary position (GK, CB, LB, RB, CDM, CM, CAM, LW, RW,
  ST, CF), secondary position, preferred foot (left, right, both), work rate
  (high-high, high-medium, medium-medium, low-high)
- **Physical profile:** height in centimeters, weight in kilograms
- **Match stats (per fixture):** minutes played, goals, assists, shots on
  target, pass completion percent, tackles won, cards, man-of-the-match

#### Progression and scoring model

Football uses a goal-based scoring model rendered from the sport-agnostic
engine. Match outcomes compute win/draw/loss automatically; the league table
service (on Pro) turns fixtures into standings with points-based ranking, goal
difference, goals for, and head-to-head tiebreakers.

Athlete progression uses a FIFA-style card with an overall rating computed as a
weighted average of the primary stats. Overall ratings ladder into rank tiers
(Bronze, Silver, Gold, Diamond) that scouts and selection committees can filter
on.

#### Testimonial

> We track pass percentage, shot conversion, and tackle wins per position now.
> Previously we did none of this because the tools did not fit football.
>
> Sara Nassar · Operations Lead, Northgate FC

#### Related sports

- **Basketball** · Rosters, minutes, and per-quarter stats ·
  `/sports/basketball`
- **Performance** · Configurable attribute sets per position ·
  `/products/performance`
- **Attribute engine** · How sport-agnostic forms work under the hood ·
  `/products/attribute-engine`

#### CTA

**H2:** Football, done right

**Sub:** From grassroots to elite, Academorix runs football academies the way
football people actually think about them.

**Primary CTA:** Start free trial

**Secondary CTA:** Talk to sales

### 5.2 Swimming (/sports/swimming)

**Eyebrow:** Swimming academies

**H1:** Academorix for Swimming

**Subheading:** Lane management, splits, meets, and per-stroke time series.
Everything a swimming academy needs, from learn-to-swim through competitive
squads.

**Primary CTA:** Start free trial

#### Why Academorix for Swimming

Swimming does not fit inside a generic sports platform. Swimmers have per-stroke
best times, per-length splits, personal bests that need automatic detection,
meet entries with heat sheets, lane assignments, and stage-based curricula for
learn-to-swim programs. Every one of these is a first-class object in
Academorix, not a workaround built on top of a general-purpose model.

Whether you run a learn-to-swim program with 400 kids or a competitive squad
chasing national qualifying times, Academorix carries the whole workflow. Lane
assignments per session, splits per length, PB detection, meet entry management,
and coach-review workflows all live in one product.

#### Feature bento

| Icon              | Title                  | Description                                                                                                           |
| ----------------- | ---------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `MapIcon`         | Lane management        | Assign swimmers to lanes based on level and stroke. Move them between sets as they progress within a session          |
| `ClockIcon`       | Split and PB tracking  | Log per-length splits, personal bests, and season targets. Automatic PB detection with family notifications           |
| `TrophyIcon`      | Meet scheduling        | Manage entries for internal galas and external meets. Auto-generate heat sheets and result cards                      |
| `ChartBarIcon`    | Per-stroke performance | Freestyle, backstroke, breaststroke, butterfly. Separate attribute sets so you never compare apples to oranges        |
| `AcademicCapIcon` | Level progression      | Stage-based curricula from Learn to Swim to Improvers to Squads. Awards and certificates auto-generated on completion |
| `BellAlertIcon`   | Pool session reminders | Guardians get reminders with the exact time and lane 30 minutes before each session                                   |

#### KPIs coaches actually track

Swimming's primary metric is time. Academorix ships the full swimming attribute
set out of the box.

- **Personal bests (text, per stroke and distance):** best 50m free, best 100m
  free, best 50m back, best 100m back, best 50m breast, best 100m breast, plus
  butterfly and IM distances
- **Detailed skills (0-100 sliders):** starts, turns, underwater kicks, pacing,
  stroke technique, race strategy
- **Stroke and distance:** primary stroke (freestyle, backstroke, breaststroke,
  butterfly, IM), primary distance (50m, 100m, 200m, 400m, 800m, 1500m)
- **Physical profile:** height in centimeters, weight in kilograms, arm span in
  centimeters
- **Meet stats (per event):** entry time, race time, final time, per-length
  splits, position in heat, position in final

#### Progression and scoring model

Swimming uses a time-based scoring model. Meets consist of timed heats with
finals; results roll up per event, per swimmer, and per squad. PB detection runs
automatically after every event; when a swimmer beats their previous best, the
guardian gets a notification and the certificate generation service produces a
printable award.

Level progression follows the stage-based curriculum you configure. Common
patterns: Learn to Swim (stages 1-7), Improvers, Junior Squad, Senior Squad,
Elite. Every stage has prerequisites (specific distances swum, specific times
achieved) tracked automatically as swimmers progress.

#### Testimonial

> Academorix replaced three tools and a stack of spreadsheets. Our coaches
> finally spend their time coaching.
>
> Layla Haddad · Director, AquaElite Swim

#### Related sports

- **Gymnastics** · Apparatus scoring and progression · `/sports/gymnastics`
- **Performance** · Per-stroke attribute sets · `/products/performance`
- **Reports** · Meet results and season summaries · `/products/reports`

#### CTA

**H2:** Swimming, from Learn to Swim to elite

**Sub:** Purpose-built workflows for every stage of the swimming journey.

**Primary CTA:** Start free trial

**Secondary CTA:** Talk to sales

### 5.3 Basketball (/sports/basketball)

**Eyebrow:** Basketball academies

**H1:** Academorix for Basketball

**Subheading:** Rosters, minutes played, per-quarter stats, and league
management. Purpose-built for basketball academies running youth, high-school,
and prep programs.

**Primary CTA:** Start free trial

#### Why Academorix for Basketball

Basketball ops are minutes-adjusted. Coaches need per-quarter stats, per-player
minute tracking, shot charts, and rotation planning. The platform ships all of
it out of the box: 12-player rosters with starting fives and bench rotations,
per-quarter box scores, shot-attempt tracking with court coordinates, and league
standings with playoff bracket generation.

Whether you run a youth academy, a high-school program, or a prep program
feeding college scouts, Academorix scales with your program's ambition. Recruit
tracking, event evaluations, and scouting pipeline management are all
first-class on Pro and Enterprise plans.

#### Feature bento

| Icon               | Title                       | Description                                                                                                  |
| ------------------ | --------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `UsersIcon`        | Rosters and rotations       | Build 12-player rosters with starting five and bench rotations. Track minutes played per game and per season |
| `ChartBarIcon`     | Per-quarter stats           | Points, rebounds, assists, steals, blocks, turnovers. Logged per quarter, aggregated per game and season     |
| `TrophyIcon`       | League play                 | Internal leagues and inter-branch competitions with automatic standings, playoffs, and bracket generation    |
| `CalendarDaysIcon` | Practice and game calendars | Practices, film sessions, and games on one calendar. Court bookings integrated with facility availability    |
| `ChartPieIcon`     | Shot charts                 | Track shot attempts and makes with court coordinates. Heat maps show hot zones per player                    |
| `AcademicCapIcon`  | Recruit tracking            | Track prospects, evaluate them at events, and manage the pipeline from scout to signing                      |

#### KPIs coaches actually track

Basketball's stats are decimal-heavy averages. Academorix ships the full
basketball attribute set out of the box.

- **Primary stats (per game averages):** ppg (points per game, decimal), apg
  (assists per game, decimal), rpg (rebounds per game, decimal), spg (steals per
  game, decimal), ft percent (free throw percentage, 0-100), three-point percent
  (three-point percentage, 0-100)
- **Detailed skills (0-100 sliders):** ball handling, court vision, defensive
  IQ, shot selection, rebounding, athleticism
- **Position:** primary position (PG, SG, SF, PF, C), secondary position,
  dominant hand (right, left, both)
- **Physical profile:** height in centimeters, weight in kilograms, wingspan in
  centimeters, vertical leap in centimeters
- **Match stats (per game):** minutes played, points, rebounds (offensive and
  defensive), assists, steals, blocks, turnovers, personal fouls, plus/minus,
  shot attempts and makes by zone

#### Progression and scoring model

Basketball uses a point-based scoring model. Games are 4 quarters (typically 12
minutes each); per-quarter stats aggregate to per-game stats, which aggregate to
per-season averages. League standings use win-loss records with tiebreakers
(head-to-head, point differential, strength of schedule).

Athlete progression uses a card format that reflects basketball's averaged
nature. Overall rating is a weighted composite of the primary stats, adjusted
for minutes played (a player averaging 20 ppg in 30 minutes is different from
one averaging 20 ppg in 15 minutes).

#### Testimonial

> Attendance and performance in one place changed how we run tryouts. Setup took
> a single afternoon.
>
> Marcus Bell · Head Coach, Summit Hoops

#### Related sports

- **Football** · Squads, matches, formations · `/sports/football`
- **Performance** · Per-position stat tracking · `/products/performance`
- **Scheduling** · Practice and game calendars · `/products/scheduling`

#### CTA

**H2:** Basketball, minutes-adjusted

**Sub:** From youth academies to prep programs, Academorix runs basketball the
way basketball coaches actually think.

**Primary CTA:** Start free trial

**Secondary CTA:** Talk to sales

### 5.4 Tennis (/sports/tennis)

**Eyebrow:** Tennis academies

**H1:** Academorix for Tennis

**Subheading:** Ladders, court bookings, match rating systems, and per-player
stroke tracking. Everything a tennis academy needs to run competitive and
recreational programs.

**Primary CTA:** Start free trial

#### Why Academorix for Tennis

Tennis is an individual sport running on top of an academy structure. Programs
need court bookings, ladder rankings, UTR-style match ratings, per-stroke
evaluations, and tournament management. Academorix delivers all of it, including
auto-generated draws for round-robin and single-elimination formats.

Whether you run a red-ball junior program, a competitive squad chasing national
rankings, or a mixed recreational and competitive academy, Academorix carries
the whole workflow: court reservations, private-lesson bookings, ladder
challenge matches, and per-stroke development tracking.

#### Feature bento

| Icon                        | Title                    | Description                                                                                                |
| --------------------------- | ------------------------ | ---------------------------------------------------------------------------------------------------------- |
| `ChartPieIcon`              | Player ladders           | Automatic ladder rankings from match results. Weekly challenge matches move players up and down the ladder |
| `MapIcon`                   | Court bookings           | Reserve courts for lessons, matches, or open play. Integrated with your academy's court availability       |
| `TrophyIcon`                | Tournament management    | Round-robin, single-elimination, and consolation brackets. Auto-generated draws and match schedules        |
| `ChartBarIcon`              | Match rating (UTR-style) | Elo-style rating updated after every match. Handicap younger players against older opponents fairly        |
| `AdjustmentsHorizontalIcon` | Per-stroke evaluations   | Coach-side attribute sets for forehand, backhand, serve, volley, and movement. Track technique over time   |
| `AcademicCapIcon`           | Level progression        | Red, Orange, Green, Yellow ball progression for junior programs, with automatic level-up triggers          |

#### KPIs coaches actually track

Tennis's stats are technique-heavy and match-result-driven. Academorix ships the
full tennis attribute set out of the box.

- **Primary stats (0-100 sliders):** serve percent, return percent, volley,
  footwork, endurance, mental
- **Detailed skills (0-100 sliders):** topspin, slice, drop shot, court
  coverage, first serve percent, break point conversion
- **Playing style:** playing hand (right, left, both), surface preference (hard,
  clay, grass, indoor), playing style (aggressive baseliner, serve and volley,
  all court, defensive)
- **Physical profile:** height in centimeters, weight in kilograms, reach in
  centimeters
- **Match stats (per match):** first serve percent, aces, double faults, break
  points won, break points saved, unforced errors, winners, set score, match
  rating change

#### Progression and scoring model

Tennis uses a set-based scoring model. Matches are best-of-three sets (six games
per set); the platform ships with the full scoring model, including tiebreak
logic. Ladder rankings compute automatically from match results using an
Elo-style algorithm. UTR-style ratings are handicap-adjusted so a 13-year-old
playing a 16-year-old gets a fair rating adjustment.

Junior program progression follows the ITF's red-orange-green-yellow ball
progression, with configurable level-up criteria (matches played, ladder
position, coach recommendation).

#### Testimonial

> Ladders, brackets, and court bookings on one platform. Our coaches stopped
> juggling four apps.
>
> Ahmed Al-Sabah · Director, Cascade Tennis Academy

#### Related sports

- **Martial Arts** · Belt progression and grading · `/sports/martial-arts`
- **Performance** · Per-stroke attribute sets · `/products/performance`
- **Scheduling** · Court bookings and private lessons · `/products/scheduling`

#### CTA

**H2:** Tennis, individual sport meets academy structure

**Sub:** Ladders, brackets, and per-stroke progression in one platform.

**Primary CTA:** Start free trial

**Secondary CTA:** Talk to sales

### 5.5 Martial Arts (/sports/martial-arts)

**Eyebrow:** Martial arts dojos

**H1:** Academorix for Martial Arts

**Subheading:** Belt progression, grading schemes, and dojo-first workflows for
karate, taekwondo, judo, jiu-jitsu, and more. Sport-agnostic engine adapts to
your style.

**Primary CTA:** Start free trial

#### Why Academorix for Martial Arts

Martial arts is not one sport; it is a family of disciplines. Karate, taekwondo,
judo, BJJ, aikido, and every regional variant have their own belt schemes,
terminology, and grading criteria. The attribute engine adapts to each. Belt
progression is a first-class state machine, grading exams are structured
workflows with panel assignments and per-technique scoring, and kata or form
libraries are searchable and tied to belt levels.

Family memberships are common in martial arts. Academorix's family-billing model
handles them cleanly: one guardian, multiple children, automatic sibling
discount, one invoice per period.

#### Feature bento

| Icon                 | Title                        | Description                                                                                                       |
| -------------------- | ---------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `AcademicCapIcon`    | Belt and grading progression | Configurable belt schemes with prerequisites, testing dates, and automatic certificate generation on grading pass |
| `CheckCircleIcon`    | Grading exams                | Schedule grading exams with panel assignments, video capture, and per-technique scoring                           |
| `TrophyIcon`         | Tournament entries           | Manage entries for open and closed tournaments. Weight class and belt division seeding automated                  |
| `DocumentTextIcon`   | Kata and form libraries      | Video library of katas and forms tied to belt levels. Athletes review any technique from their profile            |
| `IdentificationIcon` | Multi-style support          | Karate, taekwondo, judo, BJJ, aikido. One platform, sport-specific belt schemes and terminology per style         |
| `UsersIcon`          | Family memberships           | Common in martial arts. One guardian, multiple children on family plans with sibling discounts                    |

#### KPIs coaches actually track

Martial arts progression is belt-based and technique-based. Academorix ships a
generic martial-arts attribute set that adapts to any style.

- **Belt level:** current belt (configured per style), belt stripes, months at
  current belt, next grading target date
- **Technique proficiency (0-5 or 0-100 per style):** kihon (basics), kata
  (forms), kumite (sparring), grappling, throws, submissions
- **Grading history:** every grading date, panel members, score, pass/fail,
  video reference
- **Tournament history:** entries, weight class, belt division, results (medals,
  seed, placement)
- **Physical profile:** age, weight in kilograms (matters for weight-class
  events), height in centimeters

#### Progression and scoring model

Martial arts uses a decision-based scoring model that varies per style. Karate
might use point-scoring; judo uses ippon-waza; BJJ uses submission or points;
taekwondo uses technique points. Every style's rules live in configuration.

Belt progression is a state machine: white → yellow → orange → green → blue →
purple → brown → black, with sub-stripes at each belt. Every transition requires
a grading pass. Grading exams schedule automatically at configured intervals;
athletes and guardians see the countdown to their next grading.

#### Testimonial

> Our karate program runs 300 kids across four dojos. Belts, gradings, and
> family memberships used to be a mess. Now every family has one login and one
> invoice.
>
> Hisham Al-Farsi · Chief Instructor, Elite Martial Arts Center

#### Related sports

- **Gymnastics** · Apparatus scoring and progression · `/sports/gymnastics`
- **Tennis** · Level progression and ratings · `/sports/tennis`
- **Attribute engine** · Per-style scoring schemes ·
  `/products/attribute-engine`

#### CTA

**H2:** Every discipline, one dojo

**Sub:** Belt schemes, grading workflows, and family memberships purpose-built
for martial arts.

**Primary CTA:** Start free trial

**Secondary CTA:** Talk to sales

### 5.6 Gymnastics (/sports/gymnastics)

**Eyebrow:** Gymnastics clubs

**H1:** Academorix for Gymnastics

**Subheading:** Apparatus scoring, meet management, and progression schemes for
artistic, rhythmic, and trampoline gymnastics. Compliant scoring systems built
in.

**Primary CTA:** Start free trial

#### Why Academorix for Gymnastics

Gymnastics has three characteristics no other sport combines: apparatus-based
scoring with code of points math, extremely young athletes (often 5-10 years old
at entry), and long developmental pathways from Level 1 to elite. Academorix
treats all three as first-class concerns. Apparatus scoring (vault, uneven bars,
balance beam, floor) ships with the difficulty and execution model built in.
Safeguarding is first-class throughout. Skill libraries track prerequisites so
gymnasts progress in order.

Whether you run a recreational program, a competitive squad, or an elite pathway
feeding national teams, Academorix carries the developmental story from Level 1
to international elite.

#### Feature bento

| Icon                        | Title                 | Description                                                                                                                   |
| --------------------------- | --------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `ChartBarIcon`              | Apparatus scoring     | Vault, uneven bars, balance beam, floor. Code of points with difficulty scoring, execution deductions, and neutral deductions |
| `AcademicCapIcon`           | Level progression     | Level 1 to 10, elite, and international elite. Prerequisites tracked automatically as gymnasts complete skills                |
| `TrophyIcon`                | Meet management       | Manage entries for local, regional, and national meets. Squad selection based on all-around scores                            |
| `AdjustmentsHorizontalIcon` | Skill libraries       | Track which skills each gymnast has mastered. Auto-suggest the next progression based on level                                |
| `ChartPieIcon`              | Elite tracking        | Dedicated dashboards for elite squads. Hours trained, injury reports, and international qualification progress                |
| `ShieldCheckIcon`           | Safeguarding built in | Given the age of most gymnasts, safeguarding is first-class. Pickup verification, guardian consent, incident logs             |

#### KPIs coaches actually track

Gymnastics is judged sport, so metrics are score-based and skill-based.
Academorix ships a gymnastics attribute set covering artistic, rhythmic, and
trampoline disciplines.

- **Apparatus scores (per meet):** vault (difficulty + execution), uneven bars
  (difficulty + execution), balance beam (difficulty + execution), floor
  (difficulty + execution), all-around composite
- **Skill mastery:** per apparatus, a checklist of skills the gymnast has
  demonstrated (Yurchenko, Tkatchev, giants, layouts) with prerequisites for
  each
- **Physical profile:** age, height in centimeters, weight in kilograms
  (critical for progression and injury prevention)
- **Training load:** hours per week, sessions per week, apparatus split, plus
  flexibility and strength benchmarks
- **Meet history:** every meet entry, per-apparatus score, all-around placement,
  coach notes

#### Progression and scoring model

Gymnastics uses a judge-based scoring model with code-of-points math. Academorix
ships the current FIG code with difficulty and execution scored separately; the
platform computes the composite score automatically and applies deductions with
a full audit trail.

Level progression follows USA Gymnastics Level 1-10 by default, with
configurability for other federations (British Gymnastics, FIG age-group
levels). Prerequisites for each level are enforced: a gymnast cannot compete at
Level 6 without demonstrating the Level 5 required skills.

#### Testimonial

> Apparatus scoring, meet entries, and safeguarding all in one place.
> Regulators, insurers, and boards ask fewer questions.
>
> Sarah Kingsley · Head Coach, Vertex Gymnastics Academy

#### Related sports

- **Martial Arts** · Belt-based progression · `/sports/martial-arts`
- **Safeguarding** · Compliance records and incident logging ·
  `/products/safeguarding`
- **Performance** · Skill libraries and longitudinal tracking ·
  `/products/performance`

#### CTA

**H2:** Gymnastics, code of points to elite pathway

**Sub:** From Level 1 to international elite, on the same platform.

**Primary CTA:** Start free trial

**Secondary CTA:** Talk to sales

### 5.7 Volleyball (/sports/volleyball) · Coming soon

**Eyebrow:** Volleyball academies

**H1:** Academorix for Volleyball

**Subheading:** Purpose-built support for volleyball academies is on the
near-term roadmap. Register your interest and get early access when we launch.

**Primary CTA:** Join the waitlist (contact sales)

#### What is coming

Rotation-aware rosters, per-set scoring, side-out tracking, block and dig stats,
indoor and beach variants with different attribute sets, and league play with
automatic standings. Every volleyball-specific field will flow through the same
attribute engine that powers our shipped sports.

#### Interim workflow

While we build the dedicated volleyball surface, any volleyball academy can run
today on the generic sport attribute set. All the core operations (athletes,
teams, scheduling, attendance, payments, safeguarding) work identically to
shipped sports. The dedicated volleyball attributes and scoring model will ship
transparently once available.

#### Waitlist CTA

**H2:** Get volleyball early

**Sub:** Join the waitlist and get first access when volleyball ships in
Q3 2026.

**Primary CTA:** Join the waitlist

### 5.8 Padel (/sports/padel) · Coming soon

**Eyebrow:** Padel clubs

**H1:** Academorix for Padel

**Subheading:** Padel-specific ladders, court bookings, and doubles pairing
management are on the near-term roadmap. Register your interest and get early
access when we launch.

**Primary CTA:** Join the waitlist (contact sales)

#### What is coming

Doubles-first pair management, ladder rankings by pair, court bookings
integrated with padel-specific court configurations (glass walls, playing
zones), tournament management with round-robin and knockout formats, and
per-shot evaluations (bandeja, vibora, chiquita).

#### Interim workflow

Any padel club can run today on the generic sport attribute set or the tennis
attribute set (as an interim). All the core operations work identically to
shipped sports. Dedicated padel attributes ship transparently once available.

#### Waitlist CTA

**H2:** Get padel early

**Sub:** Join the waitlist and get first access when padel ships in Q4 2026.

**Primary CTA:** Join the waitlist

### 5.9 Athletics (/sports/athletics) · Coming soon

**Eyebrow:** Athletics clubs

**H1:** Academorix for Athletics

**Subheading:** Track and field, cross-country, and combined events support is
on the near-term roadmap. Register your interest and get early access when we
launch.

**Primary CTA:** Join the waitlist (contact sales)

#### What is coming

Event-based training (sprints, middle distance, distance, throws, jumps,
combined events), per-event PB tracking, meet entry management with heat sheets,
and season progression against age-band benchmarks. Every event will have its
own attribute set (100m has different metrics from high jump or shot put).

#### Interim workflow

Athletics academies can run today on the generic sport attribute set or the
swimming attribute set (adapted for time-based events). All the core operations
work identically to shipped sports. Dedicated athletics attributes ship
transparently once available.

#### Waitlist CTA

**H2:** Get athletics early

**Sub:** Join the waitlist and get first access when athletics ships in Q1 2027.

**Primary CTA:** Join the waitlist

---

## 6. Enterprise pages

Enterprise pages address the security, compliance, and commercial needs of
multi-branch academy networks. Every enterprise page ships as a deep dive with a
hero, a "What is included" feature bento, deep-dive stories, KPIs, a
testimonial, and a related-pages block. All enterprise CTAs default to
`Talk to sales`.

### 6.1 Enterprise security (/enterprise/security)

**Eyebrow:** Enterprise security

**H1:** Enterprise security and compliance

**Subheading:** SSO, audit logs, data residency, and custom SLAs. Everything a
security team needs to say yes to a multi-branch rollout.

**Primary CTA:** Talk to sales

#### What is included

| Icon               | Title                   | Description                                                                                                                                              |
| ------------------ | ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `KeyIcon`          | SSO (SAML and OIDC)     | Bring your existing identity provider (Okta, Azure AD, Google Workspace, Ping). Users authenticate once and land in Academorix without an extra password |
| `UsersIcon`        | SCIM and directory sync | Provision and de-provision users automatically from your directory. New hires get access on day one; departures lose it immediately                      |
| `DocumentTextIcon` | Audit logs              | Immutable append-only log of every write in your workspace. Retention up to 7 years. Streamable to SIEM (Splunk, Datadog, custom endpoints)              |
| `MapIcon`          | Data residency          | Pin your workspace to EU, MENA, or US infrastructure. All processing (including analytics) stays within the chosen region                                |
| `ShieldCheckIcon`  | IP allowlisting         | Restrict console access to your corporate IP ranges. Optional per-role: platform admin only reachable from HQ                                            |
| `ClockIcon`        | 99.99% uptime SLA       | Financial credits for missed SLA targets. Quarterly reviews with your Academorix success manager                                                         |

#### Deep-dive stories

##### SSO that actually plugs in

Every SSO integration on Academorix uses standard SAML 2.0 or OIDC. No custom
protocol adapters, no metadata-file gymnastics that only work with one IdP.
Okta, Azure AD, Google Workspace, Ping, JumpCloud, OneLogin, and every other
compliant IdP work out of the box. Just-in-time provisioning is default; SCIM is
available for full lifecycle management.

##### Audit logs that go where your SIEM lives

Every write in your workspace lands in an append-only audit log with actor,
action, entity, before/after snapshot, timestamp, IP address, and user agent. On
Enterprise, that log streams to your SIEM (Splunk, Datadog, custom syslog
endpoints) so your security team sees Academorix activity in the same pane of
glass as everything else.

##### Data residency for regulated regions

EU customers pin their workspace to a Frankfurt or Dublin region. GCC customers
pin to the UAE. US customers pin to Virginia or Oregon. All processing
(including analytics and AI inference) stays within the chosen region.
Cross-region replication for disaster recovery is available on Enterprise and
stays within a compliant region pair.

##### SLA credits with teeth

The 99.99% Enterprise SLA carries financial credits for missed targets.
Quarterly reviews with your Academorix success manager cover uptime, incident
postmortems, and roadmap alignment. The SLA is a real contract, not a marketing
claim.

#### KPIs

- 99.99% Enterprise uptime SLA with financial credits
- Sub-1-hour p95 initial response time on Enterprise support
- 7-year audit-log retention available on Enterprise
- Zero cross-tenant data incidents since Academorix launched

#### Testimonial

> Our security team approved Academorix in three weeks. Two of those weeks were
> legal review. The security bit was almost boring.
>
> Michael Chen · CISO, PanAsia Sports Group

#### Related pages

- **Onboarding and migration** · Hands-on migration from your current system ·
  `/enterprise/onboarding`
- **Custom contracts** · NET-30 terms, DPA, HIPAA BAA · `/enterprise/contracts`
- **Security practices** · Our full security stack in detail · `/legal/security`

#### CTA

**H2:** Ship a security review your team can defend

**Sub:** Talk to our security engineering team. NDA available before we share
the full posture.

**Primary CTA:** Talk to sales

**Secondary CTA:** Read the security page

### 6.2 Enterprise onboarding (/enterprise/onboarding)

**Eyebrow:** Enterprise onboarding

**H1:** Migration and onboarding, done for you

**Subheading:** Hands-on migration from your existing system with a dedicated
implementation engineer. From spreadsheet chaos to a running Academorix
workspace in weeks, not months.

**Primary CTA:** Talk to sales

#### What is included

| Icon                        | Title                 | Description                                                                                                                             |
| --------------------------- | --------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `DocumentTextIcon`          | Data migration        | Import from spreadsheets, TeamSnap, Sportlyzer, Playmetrics, or your existing bespoke system. We handle the ETL, you approve the schema |
| `UsersIcon`                 | Dedicated engineer    | A named implementation engineer runs your rollout end-to-end. Weekly check-ins during setup, on-call during launch week                 |
| `AcademicCapIcon`           | Staff training        | On-site or virtual training sessions for admins, coaches, and front-desk staff. Recorded for future new hires                           |
| `AdjustmentsHorizontalIcon` | Custom attribute sets | We help you configure sport-specific attribute sets. Captured from your best coaches, reviewed with your compliance lead                |
| `CheckCircleIcon`           | Gradual rollout       | Start with one branch, iterate, then roll to the network. No big-bang cutover. Parallel run supported for 30 days                       |
| `PhoneIcon`                 | White-glove support   | Direct Slack channel with your Academorix team during onboarding. Phone hotline for launch week                                         |

#### Deep-dive stories

##### Migration is a project, not a script

Every enterprise migration is unique. Your existing data has your existing
decisions baked into it: how you segment age groups, how you name teams, how you
handle families with athletes at multiple branches. Our implementation engineers
spend the first week understanding your model before writing a single ETL line.
The result: your data lands in Academorix in a shape your staff recognize, not a
shape our schema demanded.

##### A dedicated engineer for the full rollout

Enterprise migrations get a named implementation engineer for the length of the
engagement (typically 4-12 weeks). Weekly check-ins with your project sponsor.
Daily standups with your ops lead during launch week. A direct Slack channel
your team can post to any time. Handoff to your customer success manager after
launch, with the implementation engineer on standby for 30 days.

##### Training that sticks

We train admins on the mechanics, coaches on the mobile flows, and front-desk
staff on the reception queue. Every session is recorded and hosted on your
workspace, so new hires can catch up on day one instead of shadowing a colleague
for two weeks. On-site training is available for teams that prefer it.

##### Parallel run before cutover

Big-bang cutover is a recipe for lost weekends and lost customers. Enterprise
onboarding supports a 30-day parallel run: your existing system stays live while
Academorix runs alongside. On day 31, you cut over with the confidence that
every workflow already worked in Academorix during the parallel period.

#### KPIs

- 4-12 weeks median time from kickoff to production launch
- 30-day parallel run supported on every Enterprise migration
- 1 dedicated implementation engineer for the full engagement
- 90% of Enterprise customers report zero support tickets during launch week

#### Testimonial

> Our implementation engineer knew our data better than we did by week two. That
> is what earned us the confidence to cut over.
>
> Andrea Delgado · COO, Continental Sports Federation

#### Related pages

- **Enterprise security** · SSO, audit logs, and data residency ·
  `/enterprise/security`
- **Custom contracts** · NET-30 terms, DPA, HIPAA BAA · `/enterprise/contracts`
- **Migration guide** · From TeamSnap, Sportlyzer, and more ·
  `/enterprise/migration`

#### CTA

**H2:** Migration, engineered

**Sub:** Talk to our implementation team about your existing system and
timelines.

**Primary CTA:** Talk to sales

**Secondary CTA:** Read a customer story

### 6.3 Custom contracts (/enterprise/contracts)

**Eyebrow:** Enterprise contracts

**H1:** Custom contracts and billing

**Subheading:** NET-30 terms, custom DPA, HIPAA BAA, localised invoicing, and
multi-year commitments. The commercial flexibility large customers expect.

**Primary CTA:** Talk to sales

#### What is included

| Icon                 | Title                    | Description                                                                                                                       |
| -------------------- | ------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| `ReceiptPercentIcon` | NET-30 or NET-60         | Invoice-based billing on standard commercial terms. No credit-card holds on renewal                                               |
| `DocumentTextIcon`   | Custom MSA               | We work from your paper if that is easier. Legal turnaround typically 5-10 business days                                          |
| `ShieldCheckIcon`    | Data Processing Addendum | GDPR-compliant DPA and Standard Contractual Clauses for international transfers. Signed by our DPO                                |
| `HeartIcon`          | HIPAA BAA                | For customers subject to HIPAA (US healthcare partners, sports-medicine clinics). $350 per month regulatory surcharge on Growth+  |
| `GlobeAltIcon`       | Localised invoicing      | VAT-compliant invoices for EU and UK, tax-exempt for US 501(c)(3) non-profits, GCC VAT for MENA. Whatever your jurisdiction needs |
| `ClockIcon`          | Multi-year commitments   | Volume discounts for 2-year and 3-year contracts. Price locked for the term. No surprise increases at renewal                     |

#### Deep-dive stories

##### Commercial terms that respect finance teams

Every enterprise customer we talk to has a finance team with a specific set of
expectations: NET-30, purchase orders, quarterly billing, VAT-compliant
invoices, and a locked price for the contract term. Academorix meets all of them
on Enterprise plans. Your accounts payable does not need to change their process
to onboard a new SaaS.

##### Legal turnaround measured in days, not weeks

Our standard MSA is available in advance for review. We accept redlines. Legal
turnaround from our side is typically 5-10 business days. If you prefer to work
from your paper, we accept that too; the same team reviews it.

##### DPA and cross-border transfers, handled

The Academorix DPA is GDPR-compliant, signed by our DPO, and includes Standard
Contractual Clauses for international transfers. Enterprise customers can opt
into EU-only data residency to eliminate cross-border transfer questions
entirely.

##### HIPAA for US healthcare partners

Sports-medicine clinics and healthcare partners can operate under a HIPAA BAA on
Growth-plus plans. A $350 per month regulatory surcharge covers the additional
compliance overhead (audit trail retention, encryption key rotation, incident
response SLA).

#### KPIs

- 5-10 business days median legal turnaround from Academorix
- 100% GDPR-compliant DPA with Standard Contractual Clauses
- 3-year multi-year commitments supported with locked pricing
- 6+ localised invoice templates (US, EU, UK, GCC, EG, US 501(c)(3))

#### Testimonial

> They accepted our paper, closed in three weeks, and locked pricing for two
> years. That is what enterprise commercial looks like.
>
> Marcus Bell · Head Coach, Summit Hoops

#### Related pages

- **Enterprise security** · SSO, audit logs, and data residency ·
  `/enterprise/security`
- **Enterprise onboarding** · Hands-on migration support ·
  `/enterprise/onboarding`
- **Data Processing Addendum** · Read the DPA in full · `/legal/dpa`

#### CTA

**H2:** Commercial terms that fit your finance team

**Sub:** Talk to our sales engineering team about NET terms, multi-year, and
localised invoicing.

**Primary CTA:** Talk to sales

**Secondary CTA:** Read the DPA

### 6.4 Enterprise compliance (/enterprise/compliance) · New

**Eyebrow:** Enterprise compliance

**H1:** Compliance and certifications

**Subheading:** SOC 2, ISO 27001, GDPR, HIPAA, CCPA. What we are certified for
today and what is on the near-term roadmap.

**Primary CTA:** Talk to sales

#### What is included

| Icon               | Title         | Description                                                                                                 |
| ------------------ | ------------- | ----------------------------------------------------------------------------------------------------------- |
| `ShieldCheckIcon`  | SOC 2 Type II | Audit scheduled Q4 2026. Type I completed. Full report available under NDA                                  |
| `DocumentTextIcon` | ISO 27001     | Certification scheduled 2027. Framework aligned; gap analysis complete                                      |
| `GlobeAltIcon`     | GDPR          | Full GDPR compliance today. DPA signed by our DPO. Standard Contractual Clauses for international transfers |
| `HeartIcon`        | HIPAA         | HIPAA BAA available on Growth-plus with $350 per month surcharge. Annual risk assessment                    |
| `KeyIcon`          | CCPA          | California consumers get rights of access, deletion, and portability. Requests fulfilled within 30 days     |
| `CheckCircleIcon`  | PCI DSS       | Level 1 PCI DSS compliance inherited from Stripe and Paddle. Card data never touches our servers            |

#### Deep-dive stories

##### SOC 2 today and tomorrow

SOC 2 Type I is completed. Type II audit is scheduled for Q4 2026 with a Big
Four auditor. The Type II report will be available under NDA to Enterprise
customers on request. Between Type I and the Type II audit, our control set is
unchanged; the audit period simply extends over 6 months of operations.

##### ISO 27001 on the roadmap

ISO 27001 certification is scheduled for 2027. Our security framework already
aligns with ISO 27001 Annex A controls; the gap analysis is complete and the
residual items (formal statement of applicability, third-party penetration test
at scale) are in flight.

##### GDPR compliance, evidenced

We operate as a data processor under GDPR. Our DPA is signed by our DPO,
includes Standard Contractual Clauses for international transfers, and is
available to every customer on request. Data subject rights (access, correction,
deletion, portability, restriction, objection) are fulfilled within 30 days for
every request.

##### HIPAA BAA for healthcare partners

Sports-medicine clinics, university athletic departments, and US healthcare
partners can operate under a HIPAA BAA. The BAA covers all customer data in the
tenant workspace and includes the required breach notification SLA (72 hours). A
$350 per month regulatory surcharge covers the additional compliance overhead on
Growth-plus plans.

#### KPIs

- SOC 2 Type II: Audit scheduled Q4 2026
- ISO 27001: Certification scheduled 2027
- GDPR: Full compliance today, DPA available
- HIPAA: BAA available on Growth-plus with regulatory surcharge
- Zero cross-tenant data incidents since Academorix launched

#### Testimonial

> The compliance briefing they gave us was the most transparent we have seen
> from a SaaS vendor. Where they were certified, where they were not, and what
> the timeline looked like.
>
> Andrea Delgado · COO, Continental Sports Federation

#### Related pages

- **Enterprise security** · SSO, audit logs, and data residency ·
  `/enterprise/security`
- **Custom contracts** · NET-30 terms, DPA, HIPAA BAA · `/enterprise/contracts`
- **Security practices** · Full stack detail · `/legal/security`

#### CTA

**H2:** Compliance you can hand to your auditors

**Sub:** Under NDA, we share the SOC 2 Type I report, our penetration test
results, and our full compliance roadmap.

**Primary CTA:** Talk to sales

**Secondary CTA:** Read the security page

### 6.5 Enterprise migration (/enterprise/migration) · New

**Eyebrow:** Enterprise migration

**H1:** Migrate from TeamSnap, Sportlyzer, Playmetrics, or spreadsheets

**Subheading:** Every enterprise migration follows a proven playbook. Data
mapping, parallel run, staff training, and cutover. Zero data loss, zero
downtime.

**Primary CTA:** Talk to sales

#### What is included

| Icon                    | Title                   | Description                                                                                                               |
| ----------------------- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `ArrowDownTrayIcon`     | Data export ingestion   | We ingest exports from TeamSnap, Sportlyzer, Playmetrics, and every major sports platform. Custom ETL for bespoke systems |
| `DocumentDuplicateIcon` | Data mapping workshop   | Two-day workshop mapping your existing schema to Academorix. Every decision documented and reviewed with your team        |
| `CheckCircleIcon`       | Data validation reports | Every import produces a validation report before it commits. Errors flagged with row-level context                        |
| `ArrowsRightLeftIcon`   | Parallel run            | Run Academorix alongside your existing system for 30 days. Reconcile daily; cut over when your team is confident          |
| `AcademicCapIcon`       | Staff training          | On-site or virtual training tailored to your migration. Every role gets what they need before cutover                     |
| `PhoneIcon`             | Launch week support     | Direct Slack channel and phone hotline for your cutover week. Dedicated on-call from our implementation team              |

#### Deep-dive stories

##### From TeamSnap in three weeks

TeamSnap exports contain athletes, teams, guardians, and schedules. Our TeamSnap
importer maps every field into Academorix's model, flagging conflicts (duplicate
athletes across teams, missing guardian records, orphaned schedules) for human
review. A typical single-branch TeamSnap migration takes three weeks from
kickoff to production cutover.

##### From Sportlyzer in four weeks

Sportlyzer exports include performance metrics and coach notes. Our Sportlyzer
importer maps performance data into the Academorix attribute engine, using the
appropriate attribute set per sport. Coach notes preserve their original
authorship and timestamps. Typical Sportlyzer migrations take four weeks.

##### From Playmetrics in five weeks

Playmetrics is popular in US football and soccer. Our Playmetrics importer maps
rosters, schedules, RSVPs, and payment records. If your Playmetrics workspace
uses their built-in payments, we can coordinate with your Stripe account to
preserve the payment history. Typical Playmetrics migrations take five weeks.

##### From spreadsheets in two weeks

Spreadsheet migrations are the fastest and the most error-prone. We validate
every row, flag ambiguities (missing DOBs, inconsistent phone formats, orphaned
guardian records), and produce a signed-off mapping before commit. Spreadsheet
migrations from a single organized workbook typically finish in two weeks.

#### KPIs

- 2-5 weeks median migration time depending on source system
- 30-day parallel run supported on every enterprise migration
- 100% data validation coverage before every commit
- Zero data loss on Academorix migrations since launch

#### Testimonial

> We came off Playmetrics with 4,000 athletes across 12 branches. Every athlete,
> every payment history, every roster made it. Zero data loss.
>
> Marcus Bell · Head Coach, Summit Hoops

#### Related pages

- **Enterprise onboarding** · The full onboarding process ·
  `/enterprise/onboarding`
- **Enterprise security** · SSO, audit logs, and residency ·
  `/enterprise/security`
- **Customer stories** · Real migrations, real results · `/customers`

#### CTA

**H2:** Migrate without regret

**Sub:** Book a scoping session with our implementation team. Bring an export
sample and get a timeline within a week.

**Primary CTA:** Talk to sales

**Secondary CTA:** Read a customer story

### 6.6 Enterprise multi-branch (/enterprise/multi-branch) · New

**Eyebrow:** Enterprise multi-branch

**H1:** Multi-branch, network-scale operations

**Subheading:** One platform for every branch, every sport, every region.
Consolidated finance, network-wide reporting, and branch-scoped access all built
in.

**Primary CTA:** Talk to sales

#### What is included

| Icon              | Title                    | Description                                                                                                  |
| ----------------- | ------------------------ | ------------------------------------------------------------------------------------------------------------ |
| `MapIcon`         | Branch-scoped workspaces | Every branch is a first-class entity. Roles, schedules, and finance can be branch-scoped or network-wide     |
| `ChartBarIcon`    | Network-wide reporting   | Executive dashboards roll up every branch into one view. Drill down to any branch, team, or athlete          |
| `UsersIcon`       | Cross-branch athletes    | An athlete belongs to the network. Enrollments follow them across branches. History and payments stay linked |
| `CreditCardIcon`  | Consolidated finance     | One AR ledger for the network with per-branch allocation. Franchise or corporate models both supported       |
| `ShieldCheckIcon` | Role and branch scoping  | A branch manager sees only their branch. A regional director sees their region. The CEO sees everything      |
| `LanguageIcon`    | Multi-region operations  | Each branch operates in its own language, currency, and regulatory context. All from one workspace           |

#### Deep-dive stories

##### One athlete, every branch

Multi-branch networks have athletes who move between branches (family
relocations, elite pathway progressions, seasonal transfers). Academorix models
an athlete as belonging to the network, with per-branch enrollments. Move an
athlete from Riyadh to Jeddah and their entire history follows: attendance,
payments, performance, safeguarding. Nothing is left behind.

##### Consolidated finance without losing per-branch visibility

Franchise networks and corporate networks bill differently. A franchise network
wants per-branch P&L with a franchise fee to corporate. A corporate network
wants network AR with per-branch cost allocation. Academorix supports both
models: every invoice carries a branch attribution, and the reporting layer
rolls up cleanly at any level (branch, region, network).

##### Access control that respects the org chart

A branch manager should see their branch. A regional director should see their
region. The CEO should see everything. Every role in Academorix carries a scope
that maps to the org chart, enforced at the database layer. A screenshot from
the mobile app cannot leak data the role was not supposed to see, because the
query never returned it.

##### Multi-region, multi-language, one workspace

Networks that span countries (GCC operators, European academies, cross-border
franchises) run every branch on the same workspace. Each branch operates in its
local language and currency. Reporting rolls up in the CEO's preferred language
and currency. Regulatory scoping (GDPR for EU, GCC VAT for MENA, HIPAA for US
healthcare) applies per branch, not per workspace.

#### KPIs

- Unlimited branches per Enterprise workspace
- 5+ concurrent regions supported (EU, MENA, US, UK, GCC subregions)
- 100% role and branch scoping at the database layer
- Sub-1-second dashboard roll-up on networks under 20 branches

#### Testimonial

> We run 22 branches across 3 countries on one workspace. Every branch manager
> sees their branch; I see everything. Nobody asks for exports any more.
>
> Andrea Delgado · COO, Continental Sports Federation

#### Related pages

- **Enterprise security** · SSO, audit logs, and residency ·
  `/enterprise/security`
- **Enterprise onboarding** · Multi-branch rollout playbook ·
  `/enterprise/onboarding`
- **Solutions: multi-branch** · Cross-cutting multi-branch story ·
  `/solutions/multi-branch`

#### CTA

**H2:** One platform for every branch

**Sub:** Talk to our enterprise team about a network-scale rollout.

**Primary CTA:** Talk to sales

**Secondary CTA:** Read the customer stories

---

## 7. Solutions pages (new)

Solutions pages cross-cut products by use case. Where product pages sell a
feature area, solutions pages sell a story. Each anchors on a two-paragraph
narrative, four to six supporting bullets that pull from existing products, and
a persona-relevant testimonial.

### 7.1 Solutions: multi-branch (/solutions/multi-branch)

**Eyebrow:** Solution

**H1:** Multi-branch, one platform

**Subheading:** One workspace for every branch. Consolidated finance,
network-wide reporting, and branch-scoped access, all from a single tenant.

**Primary CTA:** Talk to sales

#### The story

Multi-branch academy networks live and die on operational consistency. If every
branch runs a different tool, the CEO cannot see the network; if the CEO uses
one tool and the branches use another, the data never matches. Academorix solves
this by making the branch a first-class entity in a single tenant workspace.
Every branch has its own calendar, its own finance ledger, its own coach roster,
and its own front-desk queue. Every roll-up (revenue, attendance, retention,
safeguarding) is a live query against the same underlying data.

The result: branch managers do their job in their branch's view; regional
directors see their region; the CEO sees everything. No exports, no
reconciliation, no "the number from finance does not match the number from ops"
conversations. One system, one number, one truth.

#### Supporting features

- Every branch is a first-class entity with scoped calendars, rosters, and
  finance
- Athletes belong to the network and can enroll at multiple branches
- Consolidated AR ledger with per-branch attribution
- Executive dashboards roll up every branch into one view
- Role scoping enforced at the database layer
- Multi-region operations (EU, MENA, US, UK) supported from one workspace

#### Testimonial

> Twenty-two branches, three countries, one workspace. Every branch manager sees
> their branch; I see everything. Nobody asks for exports any more.
>
> Andrea Delgado · COO, Continental Sports Federation

#### CTA

**H2:** One platform for every branch

**Primary CTA:** Talk to sales

**Secondary CTA:** Read the enterprise multi-branch page

### 7.2 Solutions: bilingual and RTL (/solutions/bilingual-rtl)

**Eyebrow:** Solution

**H1:** Bilingual and right-to-left, by design

**Subheading:** Every screen, every form, every email, every PDF. English and
Arabic ship together, and every layout supports right-to-left rendering as a
first-class concern.

**Primary CTA:** Start free trial

#### The story

Bilingual UX is not a translation feature. It is a design constraint. Buttons
flip. Icons flip (arrows, chevrons, and any directional glyph). Numbers keep
their Latin form in Arabic contexts. Dates and currencies respect local
conventions. Sports terminology has different established translations across
regions (كرة القدم in the Gulf vs. كرة قدم in the Levant). Academorix ships
bilingual from day one and treats Arabic as a first-class rendering, not a
translation overlay.

For academies in the GCC, the Levant, and North Africa, this is the difference
between adopting a Western SaaS with awkward Arabic and adopting a platform that
meets your families where they are. Families read invoices in Arabic. Coaches
read attendance in Arabic. The owner reads the dashboard in whichever language
they prefer.

#### Supporting features

- Every UI string localized to English and Arabic
- Right-to-left layout enforced at the component level
- Bilingual attribute set labels (English and Arabic per attribute)
- Bilingual PDFs (invoices, reports, certificates)
- Directional icons flip automatically
- Language-of-record configurable per user

#### Testimonial

> Our families read their invoices in Arabic and their kids read their progress
> cards in Arabic. That is not a nice-to-have; that is table stakes.
>
> Layla Haddad · Director, AquaElite Swim

#### CTA

**H2:** Arabic-first, English-first, whichever your team needs

**Primary CTA:** Start free trial

**Secondary CTA:** Talk to sales

### 7.3 Solutions: offline-first (/solutions/offline-first)

**Eyebrow:** Solution

**H1:** Offline-first, for coaches on the field

**Subheading:** Take attendance without a signal. Log a match result on a beach.
Record a training session in a remote gym. Everything syncs when you get back to
a network.

**Primary CTA:** Start free trial

#### The story

Coaches are not office workers. They stand on football pitches, poolside decks,
and gymnasium floors. Some of those places have signal. Many do not. If your
platform requires a live connection to log attendance, half the sessions never
get logged. Academorix ships an offline-first mobile experience: attendance,
match results, private-session notes, and drill logs all work without a network.
Records queue locally, encrypt at rest on the device, and sync automatically
when the device is back on Wi-Fi or cell.

The sync engine handles conflicts intelligently. If two coaches on the same team
both edited a roster while offline, the platform surfaces the conflict on sync
and lets the head coach resolve it. Data never gets silently overwritten.

#### Supporting features

- Offline attendance capture on the mobile web app
- Offline match result logging with sync-on-reconnect
- Offline private-session notes with encryption at rest
- Conflict resolution surfaced to the head coach when two edits collide
- Sync status visible on every offline capture
- Records queue for up to 30 days offline before requiring a sync

#### Testimonial

> Our coaches take attendance in a beach dojo with no signal. Two hours later,
> back at the main site, everything is in Academorix. Nothing lost.
>
> Hisham Al-Farsi · Chief Instructor, Elite Martial Arts Center

#### CTA

**H2:** Signal or no signal, the workflow does not stop

**Primary CTA:** Start free trial

**Secondary CTA:** Talk to sales

### 7.4 Solutions: real-time (/solutions/real-time)

**Eyebrow:** Solution

**H1:** Real-time RSVP, attendance, and standings

**Subheading:** Guardians confirm attendance and the coach sees it live.
Attendance updates as swimmers scan in. Standings recompute the moment a fixture
ends. The platform stays fresh without a manual refresh.

**Primary CTA:** Start free trial

#### The story

Sports academies operate in real time. Guardians confirm attendance an hour
before a session; coaches need to see the confirmation before they leave for the
field. Athletes scan in as they arrive; the coach's roster updates live. Match
results roll into league tables the moment they are logged. Every screen in
Academorix uses WebSocket-based updates so the data is always fresh, without a
manual refresh.

The real-time layer runs on our real-time infrastructure and supports thousands
of concurrent connections per tenant. Even large multi-branch networks stay
responsive when everything is happening at once.

#### Supporting features

- Real-time RSVP updates on the coach view
- Live attendance capture via WebSocket updates
- Live standings recomputation after every match result
- Real-time approval queue for reception
- Real-time notifications for guardians and coaches
- WebSocket infrastructure that supports thousands of concurrent connections

#### Testimonial

> Coach shows up on Saturday morning and every RSVP is on his phone, updated in
> real time. No more phone-tag with parents.
>
> Sara Nassar · Operations Lead, Northgate FC

#### CTA

**H2:** Real time, real workflows

**Primary CTA:** Start free trial

**Secondary CTA:** Talk to sales

### 7.5 Solutions: AI Assistant (/solutions/ai-assistant)

**Eyebrow:** Solution

**H1:** AI as an operational multiplier

**Subheading:** Natural-language reports, drill drafts, attribute suggestions,
and progress summaries. AI Assistant plugs into every product in the platform.

**Primary CTA:** See AI in action

#### The story

Every academy has a report backlog, a curriculum gap, and a coach who spends
Sunday evenings writing progress summaries. AI Assistant collapses all three
into an afternoon. Ask a plain-language question and get a chart. Describe a
sport and get an attribute set. Draft a season report and get a plain-language
summary the coach reviews in five minutes.

AI Assistant is not a chatbot. It is a set of workflow-specific tools that plug
into Performance, Reports, Attribute Engine, and the drill library. Every AI
query runs against your isolated tenant. Your data never trains external models.
Every response is logged for audit.

#### Supporting features

- Natural-language queries on Reports (Growth+ paid add-on)
- AI-drafted progress summaries in Performance (Growth+ paid add-on)
- AI-drafted attribute sets in Attribute Engine (Growth+ included)
- Drill recommendations from your library (Growth+ paid add-on)
- Bring-your-own OpenAI or Anthropic key on Enterprise
- 100% audit coverage on every AI query and response

#### Testimonial

> Season-end reports used to take two weekends. Now they take one afternoon and
> read better than the ones we wrote by hand.
>
> Marcus Bell · Head Coach, Summit Hoops

#### CTA

**H2:** A junior analyst on every team

**Primary CTA:** See AI in action

**Secondary CTA:** Read the security posture

---

## 8. Persona pages (new)

Persona pages describe the platform through the lens of a specific role. Each
page carries a two-paragraph "day in the life," a five-feature relevance grid, a
testimonial from that persona, and related resources.

### 8.1 For owners (/for/owners)

**Eyebrow:** For owners

**H1:** Run the network you want to run

**Subheading:** Every branch, every sport, every athlete on one dashboard.
Retention, revenue, and safeguarding at a glance, drill-down at a click.

**Primary CTA:** Talk to sales

#### A day in the life

Your morning starts with the executive dashboard. Yesterday's revenue across the
network. AR aging. Attendance trend by branch. Safeguarding: any open incidents,
any expiring credentials. In a single glance you see the health of a network you
could not have monitored a year ago, back when it lived in three spreadsheets
and a WhatsApp group. If something looks off, you drill in. A branch is trending
down on new registrations; you see the drop-off pattern by week and message the
branch manager with context.

Your afternoon is strategic. You are reviewing a proposal for a new branch in a
new city. Academorix already has the reference model: revenue per athlete, staff
cost per athlete, retention curves by cohort, safeguarding compliance rate. You
forecast the new branch's economics against three existing branches with similar
demographics. You present to the board on Thursday with numbers that are
defensible line-by-line.

#### Five relevant features

- Executive dashboards with drill-down per branch, team, and athlete
- AR ledger with follow-up workflows for overdue accounts
- Retention analytics with attendance-based churn prediction
- Safeguarding dashboard with credentials, incidents, and clearance status
- Branch-scoped role assignments so trust is enforced by the platform

#### Testimonial

> Every metric I care about is on one screen. The old way was three tools, four
> spreadsheets, and a lot of hope.
>
> Andrea Delgado · COO, Continental Sports Federation

#### Related resources

- **Enterprise multi-branch** · Network-scale operations ·
  `/enterprise/multi-branch`
- **Reports** · Prebuilt dashboards and custom reports · `/products/reports`
- **Customer stories** · How other owners run their networks · `/customers`

#### CTA

**H2:** The network in one dashboard

**Primary CTA:** Talk to sales

**Secondary CTA:** Read a customer story

### 8.2 For coaches (/for/coaches)

**Eyebrow:** For coaches

**H1:** Coach more, admin less

**Subheading:** Rosters, attendance, and progress on one screen. Coach on the
field with a mobile app that respects your workflow.

**Primary CTA:** Start free trial

#### A day in the life

You show up at the field at 5pm for the U14s session. Before Academorix, you
spent 15 minutes cross-referencing three lists to figure out who was actually
coming. Now the roster is on your phone, RSVPs from last night are already
reflected, and the athletes who tapped in at the gate are already checked in.
You focus on coaching. During the session, you note a technique observation on
one of the athletes; it lands directly on her progress record. After the
session, you record attendance in three seconds (everyone was present) and head
home.

The next morning, you draft the weekly summary for the parents. AI Assistant
proposes a paragraph per athlete based on their attendance and last week's
evaluation. You edit the ones that need editing and ship the summary. What used
to take a full Saturday morning takes 20 minutes.

#### Five relevant features

- Mobile-first attendance capture with QR, NFC, and manual modes
- Coach-view roster with RSVP status and injury flags
- Progress evaluation tied to sport-specific attribute sets
- AI-drafted weekly and season summaries
- Team-level dashboards with attendance and performance trends

#### Testimonial

> The most valuable thing Academorix gave me is my Sunday evenings back.
>
> Marcus Bell · Head Coach, Summit Hoops

#### Related resources

- **Scheduling and attendance** · The core coaching workflow ·
  `/products/scheduling`
- **Performance** · Progress tracking that respects your sport ·
  `/products/performance`
- **AI Assistant** · Season and weekly summaries · `/products/ai`

#### CTA

**H2:** Coaching is your job. Everything else is the platform's.

**Primary CTA:** Start free trial

**Secondary CTA:** Talk to sales

### 8.3 For athletes (/for/athletes)

**Eyebrow:** For athletes

**H1:** Your progress, your schedule, your journey

**Subheading:** One profile that follows you across seasons and branches. See
your training schedule, your progress card, and your history in one place.

**Primary CTA:** Learn more

#### A day in the life

You wake up on Saturday morning and check your Academorix profile. Your training
schedule is on the home screen; today you have swim training at 8am at the East
Branch pool. Your progress card shows your best times per stroke; last week you
dropped a tenth on your 50m fly, which is now flagged as a personal best. Your
coach's note from last session reads: "Great work on the underwaters; keep the
streamline tight."

After training, your coach records the session and your PB gets confirmed. Your
parents get a notification. The season graph on your profile ticks up. You feel
like you are on a journey, because the platform is designed to show you one.

#### Five relevant features

- One athlete profile per person, across sports, branches, and seasons
- Personal best tracking with automatic detection
- Session schedule with reminders and last-minute changes
- Progress cards rendered per sport with sport-appropriate visuals
- Guardian visibility so parents share your journey without micromanaging

#### Testimonial

> My daughter checks her progress card the way other kids check their game
> scores.
>
> Amjad Rashidi · Parent, Al Nasr Football Academy

#### Related resources

- **Performance** · The engine behind your progress card ·
  `/products/performance`
- **Scheduling and attendance** · Your training calendar ·
  `/products/scheduling`
- **Athletes** · One profile, every sport · `/products/athletes`

#### CTA

**H2:** Your progress, seen

**Primary CTA:** Ask your academy about Academorix

**Secondary CTA:** Read the customer stories

### 8.4 For guardians (/for/guardians)

**Eyebrow:** For guardians

**H1:** Every child, every academy, one login

**Subheading:** Schedules, payments, and progress for every child you look
after. Real-time notifications, one bilingual login.

**Primary CTA:** Learn more

#### A day in the life

You have three kids. One swims, one plays basketball, and one just started
martial arts. Before Academorix, that meant three apps, three sets of login
details, three different notification systems, and three separate invoices at
three different times of the month. Now everything is in one Academorix login.
Every child, every schedule, every invoice, every progress update.

You get a reminder on Thursday afternoon that your youngest has a session at
6pm. You confirm the RSVP in one tap. At 8pm you get a notification that his
coach recorded his attendance and left a positive note. On Monday morning, one
email lands with the monthly invoice for all three kids, sibling discount
already applied, and one "Pay now" button.

#### Five relevant features

- One guardian account per family, no matter how many children
- Consolidated schedule view across every child and every sport
- Family billing with automatic sibling discounts and one invoice per period
- Real-time attendance and progress notifications
- Bilingual (English and Arabic) UI, with right-to-left support

#### Testimonial

> Three kids, three sports, one Academorix. My inbox is calmer and my payments
> are easier.
>
> Mona Al-Ansari · Parent, Elite Martial Arts Center

#### Related resources

- **Payments** · Family billing and sibling discounts · `/products/payments`
- **Scheduling and attendance** · Your family's schedule in one view ·
  `/products/scheduling`
- **Athletes** · Every child's profile in one login · `/products/athletes`

#### CTA

**H2:** One login, every child

**Primary CTA:** Ask your academy about Academorix

**Secondary CTA:** See the customer stories

### 8.5 For front-desk staff (/for/front-desk)

**Eyebrow:** For front-desk staff

**H1:** The desk that runs itself

**Subheading:** Approvals queue, document verification, refunds, and guardian
messages, all in one prioritized workflow.

**Primary CTA:** Start free trial

#### A day in the life

You open Academorix Reception on Monday morning. The queue shows 14 pending
items, sorted by SLA urgency. Three refund requests are the oldest; you claim
them, review the reason, message the family, and approve two while flagging one
for finance. Four new registrations came in over the weekend; you verify the
documents, approve them, and the families get automatic confirmation emails with
the first invoice. The rest of the queue is a mix of document expiries and
consent-flag updates that you clear in half an hour.

By 10am the queue is empty. You take a walk-in from a new family, run them
through registration on the front-desk tablet (Academorix is designed for kiosk
use), and they walk out enrolled. The whole registration took under 10 minutes.
Their first invoice ships tomorrow.

#### Five relevant features

- Unified approval queue with SLA timers per task type
- Document verification with inline preview
- One-click approvals with downstream side effects
- Direct family messaging from the approval task
- Walk-in registration flow optimized for tablet or kiosk

#### Testimonial

> The queue tells me what to do. I used to spend the first hour of every day
> figuring out where to start.
>
> Fatima Yassin · Front Desk Lead, Riverside Sports Academy

#### Related resources

- **Reception** · The front-desk product page · `/products/reception`
- **Athletes** · Onboarding new families · `/products/athletes`
- **Payments** · Refunds and adjustments · `/products/payments`

#### CTA

**H2:** A queue that keeps up

**Primary CTA:** Start free trial

**Secondary CTA:** Talk to sales

### 8.6 For finance (/for/finance)

**Eyebrow:** For finance

**H1:** Clean AR, clear numbers

**Subheading:** One ledger per network, versioned invoices, refund workflows
with audit trails, and reports that write themselves.

**Primary CTA:** Start free trial

#### A day in the life

You start the week with the AR aging report already in your inbox, scheduled to
arrive at 7am Monday. Every family past 30 days is on the follow-up workflow;
you triage the ones over 60 days and handle the escalations personally. Revenue
by branch is on the dashboard; you note two branches that overperformed and one
that dipped. The dipping branch's manager sees the same report in their view;
they message you with context before you have to ask.

Later in the week, you export the quarterly VAT-compliant invoice set for the
accountants. Every invoice has a branch attribution, a currency, a tax line, and
a payment record. The whole export takes 30 seconds. You spend the rest of the
day on strategic finance work: forecasting a new branch's economics, reviewing a
payment gateway change, negotiating a multi-year contract renewal.

#### Five relevant features

- Consolidated AR ledger with per-branch attribution
- Versioned, immutable invoices with tax lines
- Refund workflow with reason and audit trail
- Scheduled report delivery to finance stakeholders
- Multi-currency, multi-jurisdiction invoice templates

#### Testimonial

> Every AR follow-up used to be a manual chase. Now the platform runs it, and I
> only see the escalations.
>
> Reem Zaki · Finance Director, PanAsia Sports Group

#### Related resources

- **Payments** · The finance engine · `/products/payments`
- **Reports** · Finance dashboards and scheduled exports · `/products/reports`
- **Custom contracts** · NET-30 and multi-year terms · `/enterprise/contracts`

#### CTA

**H2:** Finance that scales without headcount

**Primary CTA:** Start free trial

**Secondary CTA:** Talk to sales

### 8.7 For platform admins (/for/platform-admins) · Gated

**Eyebrow:** For platform admins

**H1:** The platform's own admin surface

**Subheading:** Super-admin tools for Academorix operators and platform
partners. Tenant provisioning, feature flags, plan management, and platform-wide
analytics.

**Primary CTA:** Talk to sales

_This page is gated to logged-in Enterprise customers and platform partners. It
exists as a marketing page primarily to signal capability during enterprise
sales conversations. Public visibility is TBC (see Section 19)._

#### A day in the life

You manage the Academorix workspace for a group that operates 22 branded
academies. You have super-admin access to the platform admin surface, which
lives behind SSO with a mandatory second factor. Your day begins by scanning the
platform-wide dashboard: any tenants approaching plan limits, any pending
feature-flag requests from tenant admins, any escalations from your regional
operations team.

You provision a new tenant for a partner academy that just signed with your
group. The workflow takes five minutes: pick a plan, set a starting language and
currency, configure the initial roles, and hand over the workspace to the new
academy's owner. Feature flags for the new tenant default to your group's
preferred configuration. Everything works from the first login.

#### Five relevant features

- Tenant provisioning with plan and configuration defaults
- Platform-wide feature-flag management
- Aggregated analytics across every tenant in the group
- SSO-gated super-admin access with mandatory 2FA
- Migration tools for tenant merges and splits

#### Testimonial

> Managing 22 tenants used to require a spreadsheet. Now it is a dashboard.
>
> Andrea Delgado · COO, Continental Sports Federation

#### Related resources

- **Enterprise multi-branch** · Network-scale story · `/enterprise/multi-branch`
- **Enterprise security** · SSO, 2FA, and role scoping · `/enterprise/security`
- **Custom contracts** · Multi-tenant commercial terms · `/enterprise/contracts`

#### CTA

**H2:** Platform-scale operations

**Primary CTA:** Talk to sales

**Secondary CTA:** Read the enterprise pages

---

## 9. Legal pages

Legal pages carry the marketing wrapper only. Full body copy is authored by
legal counsel and lives in `public/data/en/legal.json`. The marketing team
provides the hero, the summary, and the call-to-counsel; legal fills in the
sections.

### 9.1 Privacy (/legal/privacy)

**Eyebrow:** Legal

**H1:** Privacy Policy

**Subheading:** How Academorix collects, uses, and safeguards personal data.
Read in full before you sign up.

**One-line summary:** We collect the minimum required to run your workspace, we
never sell or share personal data, and we give you access, correction, deletion,
and portability rights at any time.

**Marketing wrapper section headings (legal drafts the bodies):**

1. Who we are
2. What data we collect
3. Why we process it
4. Your rights
5. Data retention
6. Cookies and tracking
7. Changes to this policy

**Call to counsel:** For any question about this policy, contact
`privacy@academorix.com`. Enterprise customers should contact their assigned DPO
representative.

### 9.2 Terms of service (/legal/terms)

**Eyebrow:** Legal

**H1:** Terms of Service

**Subheading:** The contract between you and Academorix. By using the platform
you agree to these terms.

**One-line summary:** Every workspace is tenant-scoped, you retain rights to
your data, we act as a processor on your behalf, and we cap our liability at the
fees paid in the preceding 12 months.

**Marketing wrapper section headings:**

1. Acceptance of terms
2. Your workspace, your data
3. Acceptable use
4. Payment and refunds
5. Availability
6. Liability
7. Termination

**Call to counsel:** For any question about these terms, contact
`legal@academorix.com`.

### 9.3 Security (/legal/security)

**Eyebrow:** Legal

**H1:** Security

**Subheading:** How Academorix protects your workspace, your data, and your
athletes. Enterprise-grade practices from day one.

**One-line summary:** Tier-1 cloud infrastructure, row-level tenant isolation,
TLS 1.3 in transit, AES-256 at rest, annual third-party penetration tests, and
24/7 incident response.

**Marketing wrapper section headings:**

1. Infrastructure
2. Data isolation
3. Authentication
4. Encryption
5. Access control
6. Vulnerability management
7. Incident response

**Call to counsel:** For a security review or a copy of our latest penetration
test report under NDA, contact `security@academorix.com`.

### 9.4 Cookie policy (/legal/cookies)

**Eyebrow:** Legal

**H1:** Cookie Policy

**Subheading:** Cookies and similar technologies Academorix uses to run the
platform.

**One-line summary:** We use strictly necessary cookies for authentication and
preferences. We do not use third-party advertising cookies. We honor Do Not
Track by disabling non-essential analytics.

**Marketing wrapper section headings:**

1. What are cookies
2. Cookies we set
3. How to control cookies

**Call to counsel:** For a full list of cookies we set and the analytics vendors
we use, contact `privacy@academorix.com`.

### 9.5 Data Processing Addendum (/legal/dpa)

**Eyebrow:** Legal

**H1:** Data Processing Addendum

**Subheading:** The DPA that governs Academorix's role as a data processor under
GDPR and the UK Data Protection Act.

**One-line summary:** Academorix is the processor; you are the controller. We
process personal data only to provide the service, we assist you with data
subject requests, and we notify you within 72 hours of any personal-data breach.

**Marketing wrapper section headings:**

1. Parties
2. Scope and duration
3. Nature and purpose of processing
4. Data subject rights
5. Sub-processors
6. International transfers
7. Security measures
8. Breach notification

**Call to counsel:** To sign the DPA or request the current sub-processor list,
contact `dpo@academorix.com`.

### 9.6 Acceptable use policy (/legal/acceptable-use)

**Eyebrow:** Legal

**H1:** Acceptable Use Policy

**Subheading:** What you can and cannot do with your Academorix workspace, and
what happens if you cross the line.

**One-line summary:** You are responsible for the content you input, the
accounts you create, and the workflows you configure. We reserve the right to
suspend accounts that violate this policy, with 7 days written notice unless the
violation is severe.

**Marketing wrapper section headings:**

1. Prohibited content
2. Prohibited conduct
3. Content responsibility
4. Consequences of violation
5. Reporting a violation

**Call to counsel:** To report a violation of this policy, contact
`abuse@academorix.com`.

---

## 10. Company pages (new)

### 10.1 About (/about)

**Eyebrow:** About

**H1:** The story of Academorix

**Subheading:** We built Academorix because every sports academy we talked to
was running on three tools and a spreadsheet. One platform, purpose-built for
the way academies actually work.

#### The story

Academorix started in 2023 with a simple observation. Every academy operator we
spoke to was running on a patchwork of generic tools that fit no sport
particularly well. Google Sheets for rosters, WhatsApp for parent comms,
MailChimp for newsletters, Stripe for payments, a spreadsheet for attendance,
another spreadsheet for progress notes. Every merger of two of these tools
produced a new export-and-reconcile job. The staff spent more time reconciling
than coaching.

We set out to build one system that treats sport-agnostic operations (athletes,
teams, scheduling, payments, safeguarding, reception) as first-class, and lets
sport-specific behavior (belt schemes, per-stroke splits, position-specific
attributes) plug into the same platform through configuration. The result is a
platform that runs football, swimming, martial arts, and gymnastics academies on
the same codebase, with the right UI for each sport, in English or Arabic, on
one branch or twenty.

#### Our values

- **Specific over generic.** A shared engine gives us leverage; sport-specific
  detail gives our customers value. We refuse to ship "sport" as a dropdown on a
  generic form.
- **Coaches, not marketers.** The platform is designed for the person on the
  pitch, the deck, the mat, and the balance beam. If a workflow does not survive
  contact with a real coach on a Saturday morning, we redesign it.
- **Enterprise from day one.** Multi-tenancy, role scoping, and audit trails are
  not features to be added later. They are the foundation.
- **Bilingual, not translated.** Arabic is a first-class language. Every screen,
  every form, every PDF works in Arabic and in English with equal polish.

#### Where we are

Team distributed across MENA, Europe, and the US. Headquartered in Riyadh with
engineering, design, and customer success in every region we serve. Backed by a
small group of investors who understand that a global platform has to be built
globally.

**CTA:** Talk to sales · `/contact-sales`

### 10.2 Careers (/careers)

**Eyebrow:** Careers

**H1:** Build the operating system for sports academies

**Subheading:** We hire specialists who care about the details, generalists who
thrive in ambiguity, and everyone in between. Distributed team, real ownership,
clear expectations.

#### Our culture

- **Ownership.** Every engineer, designer, and go-to-market team member owns an
  area end-to-end. We do not have layers of gatekeepers.
- **Craft.** We hire people who take pride in the code, the copy, and the
  pixels. Details matter because they compound.
- **Distributed.** Team spans four regions and eight time zones. We optimize for
  asynchronous work and deep focus.
- **Diverse.** Multi-sport, multi-lingual, multi-cultural. The team looks like
  the customers we serve.

#### Benefits

- Competitive salary, tied to your region's market rate
- Equity for every full-time hire
- Learning budget (books, conferences, courses)
- Home-office stipend
- Health coverage in every region we operate

#### Open roles

Current openings are published on our jobs page. Roles typically span
engineering (frontend, backend, mobile), design, product, sales, customer
success, and finance and operations.

**CTA:** View open roles · `/careers/roles`

### 10.3 Press (/press)

**Eyebrow:** Press

**H1:** Press and media

**Subheading:** Recent releases, media coverage, and brand assets. Media
inquiries welcome at `press@academorix.com`.

#### Recent releases

- **March 2026:** Academorix launches enterprise multi-branch offering
- **January 2026:** Academorix crosses 50,000 athletes managed
- **October 2025:** Academorix launches AI Assistant as a paid add-on
- **June 2025:** Academorix raises Series A led by [investor name TBD]

#### Brand assets

Downloadable Academorix brand kit including logo lockups, color palette,
typography, and product screenshots. Access is instant; attribution and correct
usage requested.

#### Media inquiries

For interviews, background, or embargoed news, contact `press@academorix.com`.
Standard turnaround is under 24 hours during business days.

**CTA:** Download brand kit · `/press/brand-kit`

### 10.4 Contact (/contact)

**Eyebrow:** Contact

**H1:** Talk to us

**Subheading:** Sales, support, and press routing in one place. We answer every
message within one business day.

#### Contact routing

| Purpose                              | Where to write            | Response time                                                            |
| ------------------------------------ | ------------------------- | ------------------------------------------------------------------------ |
| Sales inquiries and demos            | `sales@academorix.com`    | Within 4 business hours                                                  |
| General support (existing customers) | `support@academorix.com`  | Within 24 hours (Starter and Growth), 4 hours (Pro), 1 hour (Enterprise) |
| Security disclosures                 | `security@academorix.com` | Within 24 hours                                                          |
| Privacy and DPO                      | `privacy@academorix.com`  | Within 30 days per GDPR                                                  |
| Press inquiries                      | `press@academorix.com`    | Within 24 business hours                                                 |
| Careers                              | `careers@academorix.com`  | Within 5 business days                                                   |
| General inquiries                    | `hello@academorix.com`    | Within 2 business days                                                   |

**CTA:** Book a demo · `/contact-sales`

---

## 11. Customer stories (new content)

Three detailed customer stories at 800-1000 words each. Each follows the
situation-complication-solution-results narrative. Names, roles, and
organizations are drawn from the existing testimonials pool; specifics beyond
the testimonial (branch counts, metrics, timelines) are illustrative and require
customer sign-off before publication (see Section 19).

### 11.1 AquaElite Swim (/customers/aquaelite-swim)

**Eyebrow:** Customer story

**H1:** AquaElite Swim cut onboarding time by 90 percent

**Subheading:** How a competitive swimming academy replaced three tools and a
stack of spreadsheets with one platform, and gave their coaches back their
evenings.

#### Company profile

AquaElite Swim is a competitive swimming academy operating three branches across
two cities. The academy runs Learn to Swim programs for beginners, competitive
age-group squads, and an elite pathway squad training for national qualifying
times. Layla Haddad, the director, has run the academy for eight years. In 2025,
they signed with Academorix on the Growth plan.

- **Sport:** Swimming
- **Branches:** 3
- **Athletes:** 640
- **Programs:** Learn to Swim, Competitive Age-Group, Elite Pathway
- **Plan:** Growth

#### Situation

Before Academorix, AquaElite ran on Google Sheets for rosters, WhatsApp for
parent communication, MailChimp for newsletters, and a bespoke Excel workbook
(with 30+ tabs and a Visual Basic macro) for per-stroke splits and PB tracking.
Payments went through a mix of bank transfers and Stripe checkout links pasted
into WhatsApp. The Excel workbook was managed by the head coach, who was the
only person who understood it.

Onboarding a new athlete took 40 minutes across three tools: a Google Form for
registration, an email to the front desk to add them to the roster, an entry in
the Excel workbook by the head coach, and a Stripe link for the first month's
fees.

#### Complication

The Excel workbook broke twice in six months. Both times, no one was able to
recover PB data for competitive swimmers, which the coaches used for meet-entry
decisions. The head coach was ready to quit if they had to keep maintaining it.
Meanwhile, families started missing invoices because Stripe links pasted into
WhatsApp got buried in group chats. The academy lost an estimated 4 percent of
revenue to unpaid invoices in Q3 of that year.

Layla had tried two other sports platforms before Academorix. The first was
TeamSnap, which she said worked well for scheduling but had no per-stroke
performance model and no bilingual support. The second was a bespoke tool built
by a local developer, which fell over when they added the third branch and never
fully supported multi-branch billing.

#### Solution

AquaElite migrated to Academorix on the Growth plan over three weeks. Their
implementation engineer imported the Excel workbook (all 30-plus tabs) into the
swimming attribute set, mapped every historical PB to the correct swimmer, and
imported the Stripe payment history so families could see their full billing
timeline. The three branches went live on the same Monday, with a 30-day
parallel period during which the Excel workbook was maintained as a backup.

Registration moved to a single form on the Academorix workspace. The form is
bilingual (English and Arabic). Once submitted, it flows through reception's
approval queue; the receptionist approves, the enrollment goes ACTIVE, the first
invoice ships automatically, and the family gets a confirmation email in their
preferred language.

Attendance moved to the Academorix mobile web app. Coaches on the pool deck take
attendance in three modes: manual tap on the coach view, QR-scan from a poolside
iPad, or self-check-in from the athletes' phones. All three feed the same
attendance record.

PB tracking moved to the swimming attribute set. Coaches log per-stroke,
per-distance splits after every training and every meet. PBs are detected
automatically; family notifications go out the same evening. Meet entries pull
from the attribute engine directly.

Billing moved to Stripe via Academorix. Family accounts pay one invoice per
month, with sibling discounts automatically applied. Reminders go out at three
days before, on the due date, and every seven days after. Refunds route through
reception's approval queue with a reason field and an audit trail.

#### Results

- **Onboarding time cut from 40 minutes to 3 minutes** for a new athlete (a 92.5
  percent reduction).
- **Unpaid invoice rate dropped from 4 percent to under 0.5 percent** within
  three months, driven by the family-billing model and the automated reminder
  cadence.
- **Coach time on administrative tasks fell from 8 hours to 1 hour per coach per
  week**, per Layla's estimate.
- **The Excel workbook was retired** after the 30-day parallel period. The head
  coach was the first to write about it in the internal Slack.
- **Two additional branches under evaluation** for opening in 2026, now that the
  operating model scales cleanly.

#### Quote

> Academorix replaced three tools and a stack of spreadsheets. Our coaches
> finally spend their time coaching.
>
> Layla Haddad · Director, AquaElite Swim

#### What is next

AquaElite is evaluating a fourth branch in a new city. The economic model relies
on running that branch on the same workspace, with the same operating playbook,
and the same finance ledger. Academorix's multi-branch architecture makes that a
configuration change, not a platform migration.

**CTA:** Read the swimming sport page · `/sports/swimming`

### 11.2 Northgate FC (/customers/northgate-fc)

**Eyebrow:** Customer story

**H1:** Northgate FC consolidated three branches into one workspace with zero
downtime

**Subheading:** How a regional football academy replaced three separate systems
with one Academorix workspace, and how their operations lead reclaimed her
Sunday evenings.

#### Company profile

Northgate FC is a regional football academy running boys' and girls' programs
from U8 through U18, plus a senior amateur squad. The academy has three branches
spread across a major city, each historically managed by a different director
with different tools. Sara Nassar is the operations lead responsible for
consolidating the network. In 2025, they signed with Academorix on the Pro plan.

- **Sport:** Football
- **Branches:** 3
- **Athletes:** 1,150
- **Squads:** 34 (U8s through senior amateur)
- **Plan:** Pro

#### Situation

Before Academorix, Northgate's three branches ran on three different tools.
Branch A used TeamSnap for scheduling and a shared Google Drive for rosters.
Branch B used a bespoke SaaS with strong European league integration but no
bilingual support. Branch C used a mix of WhatsApp groups and Excel. Every
quarter, Sara spent a full week reconciling revenue, rosters, and attendance
across the three branches into a single board pack.

Coaches at Branch A wanted TeamSnap's fixture management. Coaches at Branch B
wanted the European league features. Coaches at Branch C were fine with WhatsApp
because it was familiar. No one wanted to switch until the CEO announced that
the network would open a fourth branch in 2026 and needed to standardize before
then.

#### Complication

Sara had to consolidate the three branches without disrupting the season. The
competitive squads at Branch A were mid-way through a promotion push in a local
league. Branch B's finance team was in the middle of their year-end audit.
Branch C's WhatsApp groups had eight years of institutional history that could
not be simply archived. Every branch was suspicious that "standardization" meant
losing what worked for them.

Adding pressure: the CEO wanted per-position performance metrics for the U16s
squad, which was headed to a regional tournament in three months. The existing
tools tracked attendance and results but nothing at the per-position level.
Sara's board pack for Q3 had to include the metrics, and the tools had to
produce them.

#### Solution

Sara led a scoping session with Academorix's implementation team in January.
They agreed on a three-phase rollout: Branch C first (the WhatsApp branch,
easiest to migrate), Branch A second (TeamSnap, a well-known import path),
Branch B last (the bespoke SaaS, requiring custom ETL).

Branch C went live in three weeks. WhatsApp group histories were archived as
PDFs and attached to team records. Coaches learned the platform in a 90-minute
virtual session. Attendance capture switched to QR-scan at the gate, which Sara
said the U8 parents loved.

Branch A went live in four weeks. TeamSnap exports imported cleanly. Fixtures,
RSVPs, and league standings all mapped. The coaches at Branch A ran a parallel
period of two weeks where both TeamSnap and Academorix were used; after two
weeks, the coaches unanimously voted to retire TeamSnap.

Branch B went live in six weeks. The bespoke SaaS did not have a formal export;
Academorix's implementation engineer worked with Branch B's IT lead to build a
custom ETL. Every athlete, every payment, every fixture, and every league record
mapped. Branch B's finance team ran their year-end audit on the new Academorix
workspace two months after go-live, without incident.

Per-position performance for the U16s launched in parallel. The football
attribute set (pace, shooting, passing, dribbling, defending, physical) plugged
in on day one, and the coaches recorded assessments after every match and every
training. By the time the regional tournament started, the U16s squad had 12
weeks of per-position data.

#### Results

- **Three branches consolidated into one workspace in 13 weeks** with zero
  downtime.
- **Weekly reconciliation time fell from 8 hours to 30 minutes**, per Sara's
  estimate.
- **Per-position performance metrics tracked for every squad** by the end of Q2.
- **The U16s squad won the regional tournament**, with coach selection decisions
  grounded in the per-position data.
- **Board pack automation:** the quarterly board pack now generates itself and
  lands in the CEO's inbox on the first Monday of the quarter.

#### Quote

> We track pass percentage, shot conversion, and tackle wins per position now.
> Previously we did none of this because the tools did not fit football.
>
> Sara Nassar · Operations Lead, Northgate FC

#### What is next

Northgate opens Branch 4 in Q2 2026. The rollout playbook is now a two-week
engagement instead of a six-week one, thanks to the standardized operating
model. The CEO is already scoping a fifth branch for 2027.

**CTA:** Read the football sport page · `/sports/football`

### 11.3 Summit Hoops (/customers/summit-hoops)

**Eyebrow:** Customer story

**H1:** Summit Hoops cut tryout admin time from 40 hours to 4

**Subheading:** How a US basketball academy replaced a spreadsheet-driven tryout
process with an evidence-based one, and how their head coach reclaimed most of
his August.

#### Company profile

Summit Hoops is a US-based basketball academy running youth (U10 through U14)
and high-school prep programs from a single facility. The academy runs annual
tryouts every August, where 300-plus prospects attend a three-day evaluation
event and the coaching staff selects 96 athletes across eight squads. Marcus
Bell, the head coach, has run tryouts for six years. In 2025, they signed with
Academorix on the Growth plan.

- **Sport:** Basketball
- **Branches:** 1
- **Athletes:** 240 during the season, 300+ tryout attendees
- **Programs:** Youth (U10-U14), High School Prep
- **Plan:** Growth

#### Situation

Before Academorix, Summit's annual tryouts ran on a paper-and-Excel process.
Each prospect got a numbered bib. Coaches on the sidelines carried clipboards
with a scoring rubric per age band. After each drill, the coaches scored the
prospects on a 1-to-5 scale across six categories (shooting, ball handling,
court vision, defensive IQ, athleticism, effort). Every evening, the paper
scores got entered into a master Excel workbook. Every squad decision was
informed by the Excel workbook, but the workbook was so dense that most of the
actual squad decisions were made from Marcus's head, using his memory of who
stood out.

The Excel workbook took Marcus and two coaches about 40 hours of collective work
over the tryout weekend, and another 20 hours of Marcus's time in the following
week to produce the squad announcements.

#### Complication

Two problems compounded. First, the Excel-based rubric produced numbers, but the
numbers were not defensible. Parents whose kids were cut asked for details, and
Marcus could not always cite specific evidence beyond "the coaches felt the
following." Two families threatened legal action over what they perceived as
arbitrary cuts. Second, the tryout data never got reused. Every August, Summit
re-evaluated athletes who had been at the academy for two years, as if they were
seeing them for the first time. The evidence base rebuilt itself from scratch
every year.

Marcus started looking for a platform that would run tryouts as an operational
workflow, not a spreadsheet marathon.

#### Solution

Summit signed with Academorix on the Growth plan in July, one month before
tryouts. Their implementation engineer configured the basketball attribute set
for tryout-specific evaluation: shooting, ball handling, court vision, defensive
IQ, athleticism, and effort, on the same 1-to-5 rubric Summit was already using.
Every prospect got an Academorix athlete record, with tryout as the
sport-agnostic enrollment context.

Coaches switched from clipboards to iPads. Each drill was a "session" in
Academorix Scheduling. Attendance capture used QR bibs. Evaluations were entered
live during the drill using the Performance product's mobile view, with the
sport-specific rubric on the screen. When a drill ended, the evaluations were
already saved.

At the end of each day, Marcus and the coaching staff met around the head
coach's laptop. The dashboard showed every prospect with the same six scores,
ranked by any dimension. Filters showed athletes above the 75th percentile
across specific skills. The conversation shifted from "who do we remember" to
"who does the data support."

Cuts were still hard. But every cut carried a defensible evidence trail. Parents
who asked for details got a printable report showing the prospect's scores
across every drill, along with peer comparison at the same age band.

#### Results

- **Tryout admin time cut from 60 hours to 6 hours** across the coaching staff
  (a 90 percent reduction).
- **Two years of tryout data now retained** for every athlete, informing
  subsequent-season evaluations.
- **Squad selection appeals dropped from 8 in 2024 to 1 in 2025.**
- **Selection defensibility:** every cut athlete now gets a report with their
  scores and peer comparison, on request.
- **Setup speed:** the entire platform, including custom tryout rubric
  configuration, was live in an afternoon.

#### Quote

> Attendance and performance in one place changed how we run tryouts. Setup took
> a single afternoon.
>
> Marcus Bell · Head Coach, Summit Hoops

#### What is next

Summit is planning a second facility for 2026, in a neighboring state. The
multi-branch model in Academorix means both facilities can run identical tryout
processes with shared evaluation data, aggregated network-wide rankings, and a
common set of squad-selection rubrics.

**CTA:** Read the basketball sport page · `/sports/basketball`

---

## 12. Blog seed (12 posts)

Twelve blog post outlines, six launch and six evergreen. Each post outline
carries the title, subtitle, category, target reader, key points, and the CTA at
the end. Author names refer to Section 13.

### Launch posts (Q1-Q2 2026)

#### 12.1 Introducing Academorix: The multi-sport academy OS

- **Subtitle:** Why we built one platform for every sport, and what that means
  for your academy
- **Category:** Product update
- **Target reader:** Academy owners evaluating platforms
- **Author:** Layla Haddad
- **Key points:** The problem we saw (patchwork of tools), the design principle
  (sport-agnostic engine + sport-specific config), the platform (products,
  sports, enterprise features), the ask (start a free trial)
- **CTA:** Start free trial

#### 12.2 Sport-agnostic, sport-specific: how the attribute engine works

- **Subtitle:** How Academorix runs football, swimming, and gymnastics on the
  same codebase without compromising any of them
- **Category:** Engineering
- **Target reader:** Technical evaluators, developers, and curious ops leads
- **Author:** Marcus Bell
- **Key points:** The attribute engine architecture, versioned schemas,
  bilingual labels, AI-generated drafts, examples from three sports, the
  engineering trade-offs
- **CTA:** Read the attribute engine product page

#### 12.3 Multi-branch academies, one bill

- **Subtitle:** How Northgate FC consolidated three regional programs into a
  single Academorix workspace, with zero downtime
- **Category:** Customer story
- **Target reader:** Multi-branch operators and finance leads
- **Author:** Sara Nassar (interviewed)
- **Key points:** The situation (three branches, three tools), the complication
  (year-end audit, mid-season disruption risk), the solution (three-phase
  rollout, per-position performance), the results (13 weeks, zero downtime,
  board pack automation)
- **CTA:** Read the Northgate FC customer story

#### 12.4 The AI Assistant, and where it draws the line

- **Subtitle:** What we automated, what we did not, and how we think about coach
  oversight
- **Category:** Product update
- **Target reader:** Coaches and safeguarding officers
- **Author:** Layla Haddad
- **Key points:** What AI Assistant does (drafts, suggestions, queries), what it
  does not do (unilateral decisions, unreviewed outbound comms), the coach
  oversight model, the privacy posture (isolated tenants, no external training)
- **CTA:** Read the AI Assistant product page

#### 12.5 Bilingual, not translated

- **Subtitle:** What it takes to ship a truly bilingual sports platform, and why
  "add Arabic later" does not work
- **Category:** Engineering
- **Target reader:** Operators in bilingual markets, and product teams thinking
  about localization
- **Author:** Marcus Bell
- **Key points:** RTL as a design constraint, directional icons, sport
  terminology across regions, Arabic PDF rendering, the technical stack behind
  it
- **CTA:** Read the bilingual and RTL solution page

#### 12.6 Enterprise migration, engineered

- **Subtitle:** The playbook we use to migrate multi-branch academies from
  TeamSnap, Sportlyzer, Playmetrics, and spreadsheets
- **Category:** Guide
- **Target reader:** Enterprise buyers and their operations teams
- **Author:** Andrea Delgado (interviewed)
- **Key points:** The three-phase rollout (assessment, parallel run, cutover),
  the source-system-specific tactics, the launch-week support model, the
  parallel-run reconciliation approach
- **CTA:** Read the enterprise migration page

### Evergreen posts (Q3 2026 onward)

#### 12.7 Why athletes should be a person, not a row in a spreadsheet

- **Subtitle:** The data model behind treating athletes as multi-sport,
  multi-branch entities
- **Category:** Industry insight
- **Target reader:** Ops leads and platform admins
- **Author:** Layla Haddad
- **Key points:** The identity vs. enrollment split, real-world edge cases
  (families, transfers, multi-sport athletes), how the data model changes what
  is possible
- **CTA:** Read the Athletes product page

#### 12.8 Retention starts with attendance

- **Subtitle:** How to spot at-risk families before they leave, using the data
  you already have
- **Category:** Guide
- **Target reader:** Owners and coaches
- **Author:** Marcus Bell
- **Key points:** The correlation between attendance drop-offs and churn, the
  four-week rolling window, the retention conversation script that actually
  works, the metrics to watch weekly
- **CTA:** Read the Reports product page

#### 12.9 Safeguarding is an operating discipline, not a policy document

- **Subtitle:** What a mature safeguarding practice looks like, and how software
  makes it maintainable
- **Category:** Industry insight
- **Target reader:** Safeguarding officers and owners
- **Author:** Sarah Kingsley
- **Key points:** The three pillars (credentials, incidents, access control),
  evidence-driven regulator visits, the difference between having a policy and
  running one
- **CTA:** Read the Safeguarding product page

#### 12.10 The bilingual academy: designing for Arabic-first families

- **Subtitle:** What "Arabic-first" means in practice, from onboarding to
  invoices to parent communication
- **Category:** Guide
- **Target reader:** Operators in the GCC, Levant, and North Africa
- **Author:** Layla Haddad
- **Key points:** Language of record per family, RTL layouts, Arabic PDF
  rendering, terminology that varies by region, the front-desk workflow in
  Arabic
- **CTA:** Read the bilingual and RTL solution page

#### 12.11 Building an offline-first mobile app for coaches on the field

- **Subtitle:** The engineering behind attendance capture without a signal, and
  why it matters
- **Category:** Engineering
- **Target reader:** Coaches, ops leads, and engineering teams building
  offline-first systems
- **Author:** Marcus Bell
- **Key points:** The CRDT approach, encryption at rest on device, conflict
  resolution, sync status UX, real-world use cases (poolside, remote gyms,
  outdoor pitches)
- **CTA:** Read the offline-first solution page

#### 12.12 Family billing without the family drama

- **Subtitle:** How to bill families with multiple athletes without alienating
  anyone
- **Category:** Guide
- **Target reader:** Finance leads and front-desk staff
- **Author:** Reem Zaki
- **Key points:** Sibling discounts, split-family billing, refund handling,
  escalation paths, the automated reminder cadence that respects families
- **CTA:** Read the Payments product page

---

## 13. Author profiles

Six author profiles for the blog. Every profile includes name, role, bio,
expertise, and an avatar seed (initials, since Academorix uses initials-based
avatars).

### 13.1 Layla Haddad

- **Role:** Product marketing, Academorix
- **Bio:** Layla runs product marketing at Academorix. Before joining, she
  directed AquaElite Swim and built a competitive swimming program from a single
  pool to three branches. She writes about the operational realities of running
  a modern sports academy.
- **Expertise:** Product marketing, swimming, multi-branch operations
- **Avatar seed:** LH

### 13.2 Marcus Bell

- **Role:** Head of engineering, Academorix
- **Bio:** Marcus leads the engineering team at Academorix. He was head coach at
  Summit Hoops before making the jump to full-time software, and still thinks
  about problems from the field before he thinks about them from the terminal.
  He writes about the engineering behind sports operations.
- **Expertise:** Engineering, basketball, coaching
- **Avatar seed:** MB

### 13.3 Sara Nassar

- **Role:** Contributing writer (Northgate FC operations lead)
- **Bio:** Sara is the operations lead at Northgate FC, one of Academorix's
  earliest enterprise customers. She led the consolidation of Northgate's three
  regional branches into a single Academorix workspace and writes occasionally
  about multi-branch operations.
- **Expertise:** Football operations, multi-branch, staff enablement
- **Avatar seed:** SN

### 13.4 Andrea Delgado

- **Role:** Contributing writer (Continental Sports Federation COO)
- **Bio:** Andrea is COO at Continental Sports Federation, one of the largest
  multi-branch networks on Academorix. She contributes on enterprise operations,
  cross-region compliance, and network-scale rollouts.
- **Expertise:** Enterprise operations, multi-region compliance, network-scale
  rollouts
- **Avatar seed:** AD

### 13.5 Sarah Kingsley

- **Role:** Contributing writer (Vertex Gymnastics head coach)
- **Bio:** Sarah is head coach and safeguarding officer at Vertex Gymnastics
  Academy. She writes about safeguarding as an operational discipline and about
  the developmental pathways that define elite gymnastics.
- **Expertise:** Gymnastics, safeguarding, developmental pathways
- **Avatar seed:** SK

### 13.6 Reem Zaki

- **Role:** Contributing writer (PanAsia Sports Group finance director)
- **Bio:** Reem is finance director at PanAsia Sports Group, a multi-country
  sports network on Academorix Enterprise. She writes about finance operations,
  family billing, and multi-jurisdiction invoicing.
- **Expertise:** Finance operations, multi-jurisdiction billing, VAT compliance
- **Avatar seed:** RZ

### 13.7 Michael Chen · Optional guest

- **Role:** Contributing writer (PanAsia Sports Group CISO)
- **Bio:** Michael is CISO at PanAsia Sports Group. He writes about enterprise
  security decisions and about running security reviews on new SaaS platforms.
- **Expertise:** Enterprise security, compliance, vendor risk management
- **Avatar seed:** MC

### 13.8 Hisham Al-Farsi · Optional guest

- **Role:** Contributing writer (Elite Martial Arts Center chief instructor)
- **Bio:** Hisham is chief instructor at Elite Martial Arts Center. He writes
  about running multi-style martial arts programs, belt progression, and family
  memberships in the dojo context.
- **Expertise:** Martial arts, family memberships, dojo operations
- **Avatar seed:** HA

---

## 14. Stats / KPIs (site-wide)

Four site-wide KPIs shown on the landing page and elsewhere across the site.
Values, sources, and refresh cadence.

| KPI                 | Current value | Source                                                       | Refresh cadence           | Also shown on                                     |
| ------------------- | ------------- | ------------------------------------------------------------ | ------------------------- | ------------------------------------------------- |
| Academies onboarded | 200+          | Tenant provisioning ledger                                   | Quarterly                 | Landing (KPI band), About                         |
| Athletes managed    | 50,000+       | Aggregate tenant analytics                                   | Quarterly                 | Landing (KPI band), Athletes product page         |
| Sports supported    | 12            | Sport registry count (6 shipped + 3 coming soon + 3 generic) | Ad hoc as new sports ship | Landing (KPI band), Attribute engine product page |
| Uptime SLA          | 99.99%        | Enterprise contract                                          | On SLA change             | Landing (KPI band), Enterprise security           |

Additional stats used on specific pages, sourced from tenant analytics and
refreshed quarterly unless noted:

- **Product-specific stats** live in each product page's stat block (see Section
  4). They are illustrative until we have publicly cleared numbers.
- **Sport-specific stats** live in each sport page (see Section 5). Same
  treatment.
- **Enterprise stats** (99.99% SLA, 7-year audit retention, 30-day parallel run)
  live in the enterprise section and are contract-grounded rather than
  analytics-grounded.
- **Customer story stats** (onboarding time, invoice rate, reconciliation hours)
  are per-story and require customer sign-off before publication.

Guidance for UI teams: any stat displayed on the site must be either (a)
contract-grounded, (b) tenant-analytics-grounded, or (c) explicitly flagged as
illustrative in the copy. Do not ship rounded marketing numbers without a
source.

---

## 15. Testimonials pool (site-wide)

Twelve testimonials covering existing customers, personas, and sports we do not
yet have public references for. UI teams can pull any testimonial from this pool
into any page. Testimonials 1-3 are the seeded ones from the current site;
testimonials 4-12 are proposed extensions.

### Existing testimonials

#### 15.1 Layla Haddad · AquaElite Swim

> Academorix replaced three tools and a stack of spreadsheets. Our coaches
> finally spend their time coaching.
>
> Layla Haddad · Director, AquaElite Swim · LH

#### 15.2 Marcus Bell · Summit Hoops

> Attendance and performance in one place changed how we run tryouts. Setup took
> a single afternoon.
>
> Marcus Bell · Head Coach, Summit Hoops · MB

#### 15.3 Sara Nassar · Northgate FC

> Multi-branch billing used to be a nightmare. Now renewals just work, in Arabic
> and English.
>
> Sara Nassar · Operations Lead, Northgate FC · SN

### Proposed extensions

#### 15.4 Ahmed Al-Sabah · Cascade Tennis Academy

> Ladders, brackets, and court bookings on one platform. Our coaches stopped
> juggling four apps.
>
> Ahmed Al-Sabah · Director, Cascade Tennis Academy · AA

#### 15.5 Hisham Al-Farsi · Elite Martial Arts Center

> Our karate program runs 300 kids across four dojos. Belts, gradings, and
> family memberships used to be a mess. Now every family has one login and one
> invoice.
>
> Hisham Al-Farsi · Chief Instructor, Elite Martial Arts Center · HA

#### 15.6 Sarah Kingsley · Vertex Gymnastics Academy

> Apparatus scoring, meet entries, and safeguarding all in one place.
> Regulators, insurers, and boards ask fewer questions.
>
> Sarah Kingsley · Head Coach, Vertex Gymnastics Academy · SK

#### 15.7 Andrea Delgado · Continental Sports Federation

> Twenty-two branches, three countries, one workspace. Every branch manager sees
> their branch; I see everything. Nobody asks for exports any more.
>
> Andrea Delgado · COO, Continental Sports Federation · AD

#### 15.8 Michael Chen · PanAsia Sports Group

> Our security team approved Academorix in three weeks. Two of those weeks were
> legal review. The security bit was almost boring.
>
> Michael Chen · CISO, PanAsia Sports Group · MC

#### 15.9 Reem Zaki · PanAsia Sports Group

> Every AR follow-up used to be a manual chase. Now the platform runs it, and I
> only see the escalations.
>
> Reem Zaki · Finance Director, PanAsia Sports Group · RZ

#### 15.10 Amjad Rashidi · Parent, Al Nasr Football Academy

> My daughter checks her progress card the way other kids check their game
> scores.
>
> Amjad Rashidi · Parent, Al Nasr Football Academy · AR

#### 15.11 Mona Al-Ansari · Parent, Elite Martial Arts Center

> Three kids, three sports, one Academorix. My inbox is calmer and my payments
> are easier.
>
> Mona Al-Ansari · Parent, Elite Martial Arts Center · MA

#### 15.12 Fatima Yassin · Front Desk Lead, Riverside Sports Academy

> The queue tells me what to do. I used to spend the first hour of every day
> figuring out where to start.
>
> Fatima Yassin · Front Desk Lead, Riverside Sports Academy · FY

Additional slots (13-15) reserved for future customers as we bring on
volleyball, padel, and athletics academies.

---

## 16. FAQs pool

Thirty-plus FAQs organized by topic. Every FAQ answer is at most three
sentences. UI teams can pull from any of these pools onto any page.

### 16.1 Pricing

**Q:** Which Academorix plan is right for me?

**A:** Starter is perfect for a single branch just getting off the ground.
Growth adds recurring memberships, performance tracking, and payments for a
multi-team academy. Pro adds SSO, custom reports, and a success manager.
Enterprise is for multi-branch networks with strict security or SLA needs.

**Q:** Do you offer custom invoicing?

**A:** Yes on Enterprise. NET-30 is standard, NET-60 available on request.
Contact sales.

**Q:** What happens if I go over my plan's limits?

**A:** Live usage meters warn you at 80 percent of any limit. At 100 percent,
overage rolls to the pay-as-you-go rate shown in the compare matrix. Nothing
gets cut off mid-session.

**Q:** Can I bring my own domain?

**A:** Yes on every paid plan. TLS certificates provision automatically.
Enterprise plans get vanity domains on our infrastructure.

**Q:** How does Academorix calculate usage?

**A:** Monthly across three axes: athletes on your roster, branches you operate,
and invoices you send. Attendance, sessions, and messages are unlimited on every
plan.

**Q:** How can I manage my spend?

**A:** Set a monthly spend limit in Settings, Billing, Limits. We email you at
80 percent and 100 percent, and pause overage billing beyond your ceiling.

**Q:** Do you offer non-profit or educational discounts?

**A:** Yes. 501(c)(3) non-profits and accredited educational institutions get 25
percent off Growth and Pro. Contact sales with your registration details.

### 16.2 Migration

**Q:** How long does migration take?

**A:** Most single-branch academies migrate in under two weeks. Multi-branch
networks typically run a 30-day parallel period with a dedicated implementation
engineer.

**Q:** Do you support migration from TeamSnap, Sportlyzer, or Playmetrics?

**A:** Yes on all three. Dedicated importers for each. Custom ETL available for
any other source system on Enterprise plans.

**Q:** Will we lose data during migration?

**A:** No. Every migration runs a validation report before it commits. Errors
are flagged with row-level context. Zero data loss on Academorix migrations
since launch.

**Q:** Can we run our old system in parallel?

**A:** Yes on Enterprise. Parallel run is supported for up to 30 days, with
reconciliation checkpoints daily.

**Q:** Who does the migration work?

**A:** A dedicated Academorix implementation engineer. Weekly check-ins during
setup, on-call during launch week, and 30-day post-launch support.

### 16.3 Security

**Q:** Are you SOC 2 certified?

**A:** SOC 2 Type I is complete. Type II audit is scheduled for Q4 2026 with a
Big Four auditor. Full report available under NDA to Enterprise customers on
request.

**Q:** Are you ISO 27001 certified?

**A:** Not yet. Certification is scheduled for 2027. Our security framework
already aligns with ISO 27001 Annex A controls.

**Q:** Are you GDPR compliant?

**A:** Yes. Our DPA is signed by our DPO and includes Standard Contractual
Clauses for international transfers. Data subject requests fulfilled within 30
days.

**Q:** Do you support SSO?

**A:** Yes on Pro and Enterprise. SAML 2.0 and OIDC. Every compliant IdP works
out of the box (Okta, Azure AD, Google Workspace, Ping, JumpCloud, OneLogin).

**Q:** Do you offer data residency?

**A:** Yes on Enterprise. Pin your workspace to EU, MENA, or US infrastructure.
All processing (including AI inference) stays within the chosen region.

**Q:** Do you have HIPAA BAA?

**A:** Yes on Growth-plus, with a $350 per month regulatory surcharge. Contact
sales to sign.

**Q:** How do you handle audit logs?

**A:** Every write in your workspace is logged immutably. Retention is 30 days
on Growth, 1 year on Pro, up to 7 years on Enterprise. Streamable to your SIEM
on Enterprise.

### 16.4 Sports coverage

**Q:** What sports do you support today?

**A:** Football, swimming, basketball, tennis, martial arts, and gymnastics ship
out of the box with sport-specific attribute sets, scoring models, and features.
Volleyball, padel, and athletics are on the near-term roadmap.

**Q:** What if you do not support my sport?

**A:** Every sport can run on our generic attribute set from day one.
Sport-specific attributes ship transparently when we launch dedicated support,
or you can configure your own via the attribute engine (on Growth and above).

**Q:** Can I customize the attribute set for my sport?

**A:** Yes. The attribute engine lets you configure any field for any sport. AI
Assistant can draft an attribute set from a plain-language description on
Growth-plus.

**Q:** Do you support multi-sport athletes?

**A:** Yes. An athlete has one identity and multiple per-sport enrollments.
History and payments follow the athlete across sports and branches.

### 16.5 Multi-branch

**Q:** How many branches can we run on one workspace?

**A:** 10 on Pro, unlimited on Enterprise. Multi-region operations (EU, MENA,
US) supported from one workspace.

**Q:** Can each branch have its own language and currency?

**A:** Yes. Every branch operates in its own language, currency, and regulatory
context. Reporting rolls up to the network in the CEO's preferred language and
currency.

**Q:** Can we scope access per branch?

**A:** Yes. Branch managers see their branch. Regional directors see their
region. The CEO sees everything. Scoping is enforced at the database layer.

**Q:** How do we handle athletes who move between branches?

**A:** Transfer the enrollment. History, payments, safeguarding, and performance
follow the athlete. Nothing is left behind.

### 16.6 Integrations

**Q:** Do you integrate with Stripe?

**A:** Yes on every plan. Stripe is the default payment gateway.

**Q:** Do you integrate with Paddle?

**A:** Yes on Pro and Enterprise. Paddle is a merchant-of-record option that
simplifies tax handling for global sales.

**Q:** Can we use a local payment gateway?

**A:** On Enterprise, yes. HyperPay, Tap, Moyasar, PayFort, Fawry, and other
regional gateways are supported via custom integration.

**Q:** Do you offer a public API?

**A:** Yes. REST API on every plan. Webhooks on Growth-plus. GraphQL on
Enterprise. Full docs at `/docs/api`.

**Q:** Do you offer webhooks?

**A:** Yes on Growth-plus. Every domain event (athlete created, invoice paid,
assessment recorded) can trigger a webhook to your endpoint.

**Q:** Can we export data to our data warehouse?

**A:** Yes on Enterprise. Nightly extracts to Snowflake, BigQuery, or S3 in
standard formats.

### 16.7 AI

**Q:** Does the AI Assistant train on my data?

**A:** No. Your data never trains external models. Inference runs against
isolated tenants.

**Q:** Which model powers the AI Assistant?

**A:** Multiple models depending on the workflow. GPT-4 class for progress
summaries and attribute-set drafts, smaller models for insight queries. On
Enterprise, you can bring your own OpenAI or Anthropic key.

**Q:** How much does the AI Assistant cost?

**A:** It is a paid add-on on Growth and above. Attribute-set suggestions are
included on every Growth-plus plan. Progress summaries and insight queries are
pay-as-you-go with usage credits included on each plan (see Section 3.3).

**Q:** Is the AI Assistant HIPAA compliant?

**A:** Yes on Growth-plus with the HIPAA BAA active. AI usage is covered under
the same BAA as the rest of the platform.

### 16.8 Getting started

**Q:** Do I need to give you a credit card to start?

**A:** No. Starter is free forever. Growth and Pro trials do not require a
credit card up front; add one when you upgrade.

**Q:** How long does setup take?

**A:** Under an hour to set up a workspace, create branches, add your first
team, and enroll your first athlete. Full go-live for an existing academy is
typically a week on Starter or Growth.

**Q:** Can we talk to a real person?

**A:** Yes. Book a demo at `/contact-sales`. We respond within four business
hours during weekdays.

**Q:** Do you offer a free trial?

**A:** Growth and Pro both include a 14-day free trial. No credit card required
to start.

---

## 17. Content-to-UI mapping (per-page UI spec)

For each page section listed in this document, we recommend the specific UI
component from HeroUI Pro (or a bespoke composition) that should render it. This
section is written for the UI team; every mapping below is descriptive, not
prescriptive. If an existing bespoke component is already in play (like the
pricing matrix), reuse it.

### 17.1 Global components

| Section            | Recommended component                            | Notes                                  |
| ------------------ | ------------------------------------------------ | -------------------------------------- |
| Header / mega-menu | Bespoke `LandingHeader` (already implemented)    | Data-driven from `nav.json`            |
| Footer             | Bespoke `FooterSection` (already implemented)    | Data-driven from `messages/en.json`    |
| Locale switcher    | HeroUI Pro `DropdownSelect`                      | Two options: English, Arabic           |
| Cookie banner      | HeroUI OSS `Popover` anchored to the page bottom | Consent stored in a first-party cookie |

### 17.2 Landing page (/)

| Section               | Recommended component                                                                                          |
| --------------------- | -------------------------------------------------------------------------------------------------------------- |
| Hero                  | Bespoke `HeroSection` (already implemented)                                                                    |
| KPI band              | HeroUI Pro `KPIGroup` in horizontal layout, 4 columns on desktop                                               |
| Trusted-by logo strip | HeroUI Pro `LogoWall` in grayscale row, marquee on mobile                                                      |
| Product bento         | Bespoke composition of HeroUI Pro `Card` with alternating column spans (2:1:1, 2:1:1)                          |
| Sports bento          | HeroUI Pro `ItemCardGroup` with `layout=grid` and `columns=3` on desktop, plus two "Coming soon" `Chip` badges |
| How it works timeline | HeroUI Pro `Timeline` with numbered steps, vertical on mobile                                                  |
| Persona cards         | HeroUI Pro `ItemCardGroup` with `layout=grid` and `columns=4` on desktop                                       |
| Testimonials          | HeroUI Pro `TestimonialCarousel` with optional rating chips, 3 slides visible on desktop                       |
| Pricing preview       | Bespoke `PricingSection` (already implemented) with 4 columns                                                  |
| CTA band              | Bespoke `CtaSection` (already implemented)                                                                     |
| FAQ                   | HeroUI OSS `Accordion`                                                                                         |

### 17.3 Pricing page (/pricing)

| Section                        | Recommended component                            |
| ------------------------------ | ------------------------------------------------ |
| Hero                           | Bespoke `PricingHero` (already implemented)      |
| Highlights (2 spotlight cards) | HeroUI Pro `Card` in a 2-column grid             |
| Plan tier cards                | Bespoke `PricingPlanCards` (already implemented) |
| Compare matrix                 | Bespoke `PricingMatrix` (already implemented)    |
| Bottom FAQ                     | HeroUI OSS `Accordion`                           |
| Bottom CTA                     | Bespoke `CtaSection`                             |

### 17.4 Product pages (/products/*)

| Section                | Recommended component                                                  |
| ---------------------- | ---------------------------------------------------------------------- |
| Hero                   | Bespoke `ProductHero` (already implemented)                            |
| Feature bento          | HeroUI Pro `ItemCardGroup` with `layout=grid` and `columns=3`          |
| Deep-dive stories      | HeroUI Pro `Card` with `Card.Header` and `Card.Content`, one per story |
| Persona relevance grid | HeroUI Pro `DataTable` in a compact variant, 2 columns (persona, why)  |
| Compliance angle       | HeroUI Pro `Card` with an `Alert`-style visual, muted background       |
| Testimonial            | HeroUI Pro `TestimonialCard` (single-card variant)                     |
| Stat block             | HeroUI Pro `KPIGroup` in horizontal layout, 3 columns                  |
| Related products       | HeroUI Pro `ItemCardGroup` with `layout=grid` and `columns=3`          |
| CTA                    | Bespoke `CtaSection`                                                   |

### 17.5 Sport pages (/sports/*)

| Section                     | Recommended component                                                  |
| --------------------------- | ---------------------------------------------------------------------- |
| Hero                        | Bespoke `SportHero` (adaptation of `ProductHero`)                      |
| Feature bento               | HeroUI Pro `ItemCardGroup` with `layout=grid` and `columns=3`          |
| KPIs coaches actually track | HeroUI Pro `DataTable` in a compact variant, or bespoke `SportKPIList` |
| Progression / scoring model | HeroUI Pro `Card` with `Card.Header` and `Card.Content`                |
| Testimonial                 | HeroUI Pro `TestimonialCard`                                           |
| Related sports              | HeroUI Pro `ItemCardGroup` with `layout=grid` and `columns=3`          |
| CTA                         | Bespoke `CtaSection`                                                   |
| Coming-soon teasers         | HeroUI Pro `EmptyState` with a "Join waitlist" CTA                     |

### 17.6 Enterprise pages (/enterprise/*)

| Section           | Recommended component                                         |
| ----------------- | ------------------------------------------------------------- |
| Hero              | Bespoke `EnterpriseHero` (adaptation of `ProductHero`)        |
| Feature bento     | HeroUI Pro `ItemCardGroup` with `layout=grid` and `columns=3` |
| Deep-dive stories | HeroUI Pro `Card` with `Card.Header` and `Card.Content`       |
| KPIs              | HeroUI Pro `KPIGroup` in horizontal layout, 4 columns         |
| Testimonial       | HeroUI Pro `TestimonialCard`                                  |
| Related pages     | HeroUI Pro `ItemCardGroup` with `layout=grid` and `columns=3` |
| CTA               | Bespoke `CtaSection`                                          |

### 17.7 Solutions pages (/solutions/*)

| Section                  | Recommended component                                                  |
| ------------------------ | ---------------------------------------------------------------------- |
| Hero                     | Bespoke `SolutionHero` (adaptation of `ProductHero`)                   |
| Story paragraphs         | Plain prose in a max-width container, no special component             |
| Supporting features list | HeroUI OSS `Accordion` or `ListGroup`, whichever fits the copy density |
| Testimonial              | HeroUI Pro `TestimonialCard`                                           |
| CTA                      | Bespoke `CtaSection`                                                   |

### 17.8 Persona pages (/for/*)

| Section                   | Recommended component                                         |
| ------------------------- | ------------------------------------------------------------- |
| Hero                      | Bespoke `PersonaHero` (adaptation of `ProductHero`)           |
| Day-in-the-life narrative | Plain prose in a max-width container                          |
| Five relevant features    | HeroUI Pro `ItemCardGroup` with `layout=grid` and `columns=3` |
| Testimonial               | HeroUI Pro `TestimonialCard`                                  |
| Related resources         | HeroUI Pro `ItemCardGroup` with `layout=grid` and `columns=3` |
| CTA                       | Bespoke `CtaSection`                                          |

### 17.9 Customer story pages (/customers/*)

| Section                             | Recommended component                                                     |
| ----------------------------------- | ------------------------------------------------------------------------- |
| Hero                                | Bespoke `CustomerStoryHero` with a company profile summary                |
| Company profile                     | HeroUI Pro `KPIGroup` compact variant for sport, branches, athletes, plan |
| Situation / Complication / Solution | Plain prose in a max-width container                                      |
| Results                             | HeroUI Pro `KPIGroup` in horizontal layout, 4-5 columns                   |
| Pull quote                          | HeroUI Pro `TestimonialCard` in a "hero" variant                          |
| Related resources                   | HeroUI Pro `ItemCardGroup`                                                |
| CTA                                 | Bespoke `CtaSection`                                                      |

### 17.10 Blog and content pages (/blog/*, /changelog)

| Section           | Recommended component                                                   |
| ----------------- | ----------------------------------------------------------------------- |
| Blog index        | HeroUI Pro `PostGrid` with category filter chips                        |
| Blog post         | Plain MDX prose with `Card` inserts for callouts, code, and pull quotes |
| Blog code preview | HeroUI Pro `CodeBlock`                                                  |
| Author bio        | HeroUI Pro `AuthorCard`                                                 |
| Related posts     | HeroUI Pro `PostList`                                                   |
| Changelog entry   | HeroUI Pro `TimelineEntry`                                              |

### 17.11 Legal pages (/legal/*)

| Section           | Recommended component                                         |
| ----------------- | ------------------------------------------------------------- |
| Hero              | Bespoke `LegalHero` with effective-date subhead               |
| Section body      | Plain prose with `H2` and `H3` headings, no special component |
| Table of contents | HeroUI OSS `Accordion` in a sticky sidebar on desktop         |

### 17.12 Utility patterns (empty states, error states, video)

| Pattern                                | Recommended component                                                                |
| -------------------------------------- | ------------------------------------------------------------------------------------ |
| Empty state (anywhere)                 | HeroUI Pro `EmptyState` (as already wired for pricing)                               |
| Video embed (hero, product demos)      | Plain HTML5 `<video>` with `poster` and lazy-loaded MP4                              |
| Animated illustration (product art)    | Plain HTML5 `<video>` with `autoplay muted loop playsinline`, or Lottie for line art |
| Comparison matrix (product comparison) | Bespoke `PricingMatrix` (already implemented, reusable for product comparison)       |
| Bento with mixed sizes                 | Bespoke composition of HeroUI Pro `Card` and `KPIGroup`                              |

### 17.13 Special notes

- Every list of features across the site should honor icon keys from the
  Heroicons outline set. UI teams should not introduce sport-specific or
  product-specific icons that live outside `@academorix/ui/icons/outline`.
- Every persona relevance grid, feature bento, and pricing matrix must have a
  mobile stacked variant with the columns collapsing to a single-column vertical
  scroll.
- Every CTA button should render as a HeroUI Pro `Button` with `variant=primary`
  for primary and a bordered link style for secondary. Full-width on mobile,
  auto width on desktop.
- Every testimonial card should use the initials avatar pattern (no remote image
  dependency) as already implemented, so cards render crisply offline and in
  both themes.

---

## 18. Localisation notes

Arabic translation happens in a dedicated pass after this document is signed
off. This section lists every string category and flags the specific
considerations for the Arabic pass.

### 18.1 Priority-ranked strings

Priority is defined by page traffic and CTA proximity. High priority translates
first; low priority can wait for a second pass.

| Priority | String category                         | Where it lives                                                                           | Notes                                                           |
| -------- | --------------------------------------- | ---------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| P0       | Landing hero, KPI band, primary CTAs    | `messages/en.json` (chrome) + `public/data/en/site.json`                                 | Every visitor sees these first                                  |
| P0       | Pricing page (all sections)             | `messages/en.json` + `public/data/en/plans.json` + `public/data/en/pricing-compare.json` | Every prospect reads pricing                                    |
| P0       | Product page hero, feature bento titles | `public/data/en/products.json`                                                           | Product pages have highest conversion volume                    |
| P0       | Sport page hero, feature bento titles   | `public/data/en/sports.json`                                                             | Sport pages carry regional relevance                            |
| P1       | Product page deep-dive sections         | This document, exported per product                                                      | Deep dives translate second                                     |
| P1       | Sport page KPIs and progression model   | This document, exported per sport                                                        | Sport-specific terminology (see below)                          |
| P1       | Enterprise pages                        | `public/data/en/enterprise.json`                                                         | Enterprise buyers often bilingual                               |
| P1       | Solutions pages                         | This document, exported                                                                  | Cross-cutting stories                                           |
| P2       | Persona pages                           | This document, exported                                                                  | Persona pages translate last of the marketing surfaces          |
| P2       | Blog seed posts                         | This document, exported                                                                  | Blog can be English-only for launch                             |
| P2       | Customer stories                        | This document, exported                                                                  | Customer stories can ship English-only if the customer consents |
| P3       | Legal pages                             | `public/data/en/legal.json`                                                              | Legal counsel translates, not marketing                         |
| P3       | Company pages (About, Careers, Press)   | This document, exported                                                                  | Company pages ship English-first                                |

### 18.2 Where Arabic differs from English

- **Direction:** Right-to-left throughout. Every page layout must honor
  `dir="rtl"` at the root and let child components render in reverse order.
- **Icons:** Directional icons (`ArrowRightIcon`, `ChevronRightIcon`,
  back-arrows, forward-arrows) must flip in Arabic. Non-directional icons
  (`UserGroupIcon`, `ShieldCheckIcon`) must not flip.
- **Numbers:** Latin digits (0-9) throughout. Do not use Eastern Arabic digits.
  Currency symbols precede or follow the number per convention (SAR 500, or ٥٠٠
  ريال in fully-native contexts; we standardize on the Latin-digit + symbol
  form).
- **Dates:** Gregorian dates in Arabic-numeral form. Format: `1 مارس 2026`.
  Hijri available as an option per tenant preference.
- **Currencies:** SAR, AED, EGP, USD, GBP supported at launch. QAR, KWD, BHD,
  OMR added Q3 2026. Each currency has an ISO code label (for finance-facing
  surfaces) and a regionally appropriate symbol (for family-facing surfaces).

### 18.3 Sport terminology (English to Arabic)

Sports terminology in Arabic varies by region and by federation. Our default
translations follow FIFA, FIBA, FINA, ITF, WT, and FIG official Arabic
terminology, with regional overrides available per tenant.

| English             | Arabic (Standard) | Notes                                                              |
| ------------------- | ----------------- | ------------------------------------------------------------------ |
| Football (soccer)   | كرة القدم         | Standard across the Arabic-speaking world                          |
| Swimming            | السباحة           | Standard                                                           |
| Basketball          | كرة السلة         | Standard                                                           |
| Tennis              | التنس             | Standard                                                           |
| Martial Arts        | فنون قتالية       | Style-specific terms preferred (كاراتيه, تايكواندو, جودو, جوجيتسو) |
| Gymnastics          | الجمباز           | Standard                                                           |
| Volleyball          | الكرة الطائرة     | Standard                                                           |
| Padel               | البادل            | Transliteration                                                    |
| Athletics           | ألعاب القوى       | Standard                                                           |
| Coach               | مدرب              | Also مدرّب depending on region                                     |
| Athlete             | لاعب or رياضي     | Contextual: لاعب in team sports, رياضي in individual sports        |
| Guardian / Parent   | ولي الأمر         | Formal, used on legal documents                                    |
| Match               | مباراة            | Standard                                                           |
| Training            | تدريب             | Standard                                                           |
| Attendance          | حضور              | Standard                                                           |
| Belt (martial arts) | حزام              | Standard                                                           |
| Session             | حصة               | Regional variation (جلسة also common)                              |

### 18.4 Fixed English tokens

Some brand and product tokens remain in English regardless of locale:

- Academorix (brand)
- Stripe, Paddle (third-party products)
- SSO, SAML, OIDC, SCIM (technical standards)
- HIPAA, GDPR, DPA, CCPA, SOC 2, ISO 27001 (regulatory acronyms)
- URLs and email addresses

### 18.5 Regional currency and format defaults

Default per region unless overridden per tenant.

| Region                       | Default currency               | Date format     | Number format                                              |
| ---------------------------- | ------------------------------ | --------------- | ---------------------------------------------------------- |
| GCC (SA, AE, QA, KW, BH, OM) | SAR / AED / others per country | `1 مارس 2026`   | Latin digits, comma as thousands separator                 |
| Egypt                        | EGP                            | `1 مارس 2026`   | Latin digits, comma as thousands separator                 |
| UK                           | GBP                            | `1 March 2026`  | Latin digits, comma as thousands separator                 |
| Europe                       | EUR                            | `1 March 2026`  | Latin digits, dot as decimal separator                     |
| US                           | USD                            | `March 1, 2026` | Latin digits, comma as thousands separator, dot as decimal |

---

## 19. Open questions

Items that require confirmation before publication. Every open question is
tagged with an owner and a target decision date.

### 19.1 Sports coverage

- **Are Volleyball, Padel, and Athletics coming?** Currently drafted as "Coming
  soon" with quarter targets. Confirm the target quarters and whether we should
  advertise them at all before launch. Owner: Product. Target decision: end of
  Q1 2026.
- **Do we want a "Any sport" page for the attribute engine story on the /sports
  index?** Recommended, but not drafted. If yes, we draft a page that positions
  the attribute engine as the answer to "you do not see my sport." Owner:
  Marketing. Target decision: same as launch.

### 19.2 Personas

- **Is the "For platform-admins" persona a public page or gated?** Currently
  drafted as public with a note. Recommend gated (requires SSO login), because
  the surface is Academorix-operator and platform-partner focused, not
  academy-operator focused. Owner: Product marketing. Target decision: end of
  Q1 2026.
- **Do we want dedicated "For elite pathway coaches" and "For scouts"
  personas?** Not drafted. These may be over-segmented; a single "For coaches"
  page with elite-specific sections might suffice. Owner: Marketing. Target
  decision: post-launch review.

### 19.3 Customer stories

- **Do we ship customer stories as HTML pages or MDX pages?** Recommend MDX so
  we can embed rich components (stat blocks, quote pulls, related links) as
  compound components rather than as raw HTML. Owner: Engineering. Target
  decision: pre-launch.
- **Do we have customer sign-off for each of the three stories drafted in
  Section 11?** Not yet. Every story needs a formal go-ahead from the customer,
  plus review of specific numbers (branch counts, revenue recovery, migration
  timelines). Owner: Customer success. Target decision: 30 days before
  publication.
- **Do we anonymize customer stories that we cannot get sign-off for?**
  Recommend yes, with a note "Details anonymized at customer request." Owner:
  Marketing. Target decision: pre-launch.

### 19.4 Media

- **Do we ship videos or animated illustrations for hero product art?** Drafts
  assume plain HTML5 videos with posters. Alternative: Lottie animations for the
  smaller decorative elements (KPI counters, timeline steps). Owner: Design.
  Target decision: pre-launch.
- **Do we need a hero video for the landing page?** Not drafted. A 30-second
  product demo would work but adds asset production. Owner: Marketing. Target
  decision: post-launch (v2 of the landing page).
- **Do we license real customer logos for the trusted-by strip?** Currently
  drafted as illustrative names. Every logo requires written permission and
  often a co-marketing agreement. Owner: Customer success. Target decision: 30
  days before publication.

### 19.5 Compliance claims

- **When exactly is our SOC 2 Type II audit scheduled?** Drafted as Q4 2026.
  Confirm the exact quarter and the auditor. Owner: Security. Target decision:
  pre-launch.
- **When is our ISO 27001 certification scheduled?** Drafted as 2027. Confirm
  year and quarter. Owner: Security. Target decision: pre-launch.
- **Are we compliant with SOC 2 today (Type I)?** Drafted as yes. Confirm.
  Owner: Security. Target decision: pre-launch.
- **Do we currently offer HIPAA BAA?** Drafted as yes on Growth-plus with a $350
  per month surcharge. Confirm the surcharge and the plan scope. Owner: Legal.
  Target decision: pre-launch.

### 19.6 Pricing specifics

- **Are the per-athlete overage rates in the compare matrix accurate for 2026?**
  $0.20 on Growth, $0.15 on Pro. Confirm with finance. Owner: Finance. Target
  decision: pre-launch.
- **Is the additional-seat rate accurate?** $12 per seat per month. Confirm with
  finance. Owner: Finance. Target decision: pre-launch.
- **Is the yearly-plan discount rate accurate?** Drafted as ~20 percent (Growth
  $99/mo becomes $950/yr, saving $238). Confirm. Owner: Finance. Target
  decision: pre-launch.
- **Do we offer non-profit or educational discounts?** Drafted as 25 percent off
  Growth and Pro. Confirm. Owner: Sales. Target decision: pre-launch.

### 19.7 Solutions and personas

- **Does the "offline-first" solution page overpromise?** Drafted with "queue
  for up to 30 days offline." Confirm actual technical capability. Owner:
  Engineering. Target decision: pre-launch.
- **Does the "real-time" solution page overpromise?** Drafted with "thousands of
  concurrent connections per tenant." Confirm actual load-test results. Owner:
  Engineering. Target decision: pre-launch.

### 19.8 Blog and content

- **Do the six launch-post authors have time to write?** Drafted with three team
  members and three customer contributors. Owner: Marketing. Target decision: 30
  days before launch.
- **Do the customer contributors (Sara, Andrea, Sarah) want to write, or should
  marketing ghost-write and attribute?** Owner: Marketing. Target decision: 30
  days before launch.
- **Do we ship a "Changelog" from day one or from month three?** Recommend day
  one with the launch-note as the first entry. Owner: Product. Target decision:
  pre-launch.

### 19.9 Legal and privacy

- **Is the DPO named on the DPA?** Drafted as "signed by our DPO." Confirm we
  have a named DPO or contract with an external DPO representative. Owner:
  Legal. Target decision: pre-launch.
- **Does the sub-processor list at `/legal/subprocessors` exist yet?** Drafted
  as if it does. Owner: Legal. Target decision: pre-launch.
- **Are our privacy and terms in a state fit for public publication?** Draft
  copy in `legal.json` is a marketing-friendly summary; full
  legal-counsel-approved copy required before we go live. Owner: Legal. Target
  decision: pre-launch.

### 19.10 Site structure

- **Do we want a dedicated "For developers" persona page or an "API and
  integrations" resource page?** Not drafted. Recommend the latter for developer
  audience and keep personas focused on academy roles. Owner: Marketing. Target
  decision: post-launch.
- **Do we want a `/security` marketing page distinct from `/legal/security`?**
  Currently `/legal/security` covers both roles. Recommend a marketing-first
  `/security` page that pulls from Enterprise security and the legal security
  page. Owner: Marketing. Target decision: post-launch v2.
- **Are there missing pages on the sitemap in Section 0?** Confirm with sales
  what pages they get asked for that are not already listed. Owner: Sales.
  Target decision: pre-launch.

---

_End of document._

_Content owner: Marketing. Reviewers: Product, Sales, Legal, Security,
Engineering. Sign-off required from CEO before Arabic translation begins._
