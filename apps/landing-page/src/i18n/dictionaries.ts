export const locales = ["en", "ar"] as const;

export type Locale = (typeof locales)[number];

export const localeMeta: Record<
  Locale,
  { label: string; native: string; dir: "ltr" | "rtl"; flag: string }
> = {
  en: { label: "English", native: "English", dir: "ltr", flag: "flag:us-4x3" },
  ar: { label: "Arabic", native: "العربية", dir: "rtl", flag: "flag:sa-4x3" },
};

type Dictionary = Record<string, string>;

// -----------------------------------------------------------------------------
// Flat key/value dictionary. Every key MUST exist in both `en` and `ar`. Group
// by dot-namespace (nav.*, hero.*, features.*, …) for grep-friendliness.
// -----------------------------------------------------------------------------

export const dictionaries: Record<Locale, Dictionary> = {
  en: {
    // ── Nav ─────────────────────────────────────────────────────────────
    "nav.products": "Products",
    "nav.sports": "Sports",
    "nav.solutions": "Solutions",
    "nav.enterprise": "Enterprise",
    "nav.pricing": "Pricing",
    "nav.resources": "Resources",
    "nav.signIn": "Sign in",
    "nav.startTrial": "Start free trial",

    // ── Common CTAs ─────────────────────────────────────────────────────
    "common.startFreeTrial": "Start free trial",
    "common.talkToSales": "Talk to sales",
    "common.bookDemo": "Book a demo",
    "common.contactSales": "Contact sales",
    "common.viewPricing": "View pricing",
    "common.learnMore": "Learn more",
    "common.readMore": "Read more",
    "common.getStarted": "Get started",
    "common.explore": "Explore the platform",
    "common.viewAll": "View all",
    "common.readStory": "Read the full story",
    "common.exploreProducts": "Explore products",
    "common.exploreSports": "Explore sports",
    "common.exploreSolutions": "Explore solutions",
    "common.exploreBlog": "Browse the blog",
    "common.viewJob": "View role",
    "common.subscribe": "Subscribe",
    "common.email": "Email",
    "common.emailPlaceholder": "you@academy.com",

    // ── Hero ────────────────────────────────────────────────────────────
    "hero.badge": "Built for every sport you coach",
    "hero.title": "One command center for your whole academy",
    "hero.subtitle":
      "Schedule rosters, message parents, and collect tuition automatically. Academorix runs the operations behind swimming, gymnastics, soccer, and beyond.",
    "hero.sportsLabel": "One system, any discipline",

    // ── Sports (chrome, shared strings) ─────────────────────────────────
    "sports.title": "Built for the way your sport trains",
    "sports.subtitle":
      "One platform, any discipline. Venues, session types, and billing plans adapt to each sport, no custom build required.",
    "sports.liveSetup": "Live setup",
    "sports.sessionTypes": "Session types",
    "sports.showcase": "Product showcase",
    "sports.runOn": "Run your {sport} academy on Academorix",
    "sports.exploreOthers": "Explore other sports",
    "sports.environment": "Training environment",
    "sports.hero.trust": "Sport-agnostic core",
    "sports.workflow.title": "How it works",
    "sports.workflow.subtitle":
      "A hands-off operating rhythm coaches, families, and finance all understand.",
    "sports.workflow.fullSeason": "From sign-up to full season in four steps",
    "sports.testimonial": "What academies say",
    "sports.highlights.title": "Everything a {sport} academy needs",
    "sports.purposeBuilt": "Purpose-built for {sport}",
    "sports.purposeBuiltDesc":
      "The same platform, arranged around the workflows your discipline runs every week.",
    "sports.capabilities": "Capabilities",
    "sports.whatAcademiesGet": "What {sport} academies get",
    "sports.runOnDesc":
      "Start free and see your own setup live in minutes, with migration help from our team.",

    // ── Sport names (used across the app) ───────────────────────────────
    "sport.swimming": "Swimming",
    "sport.gymnastics": "Gymnastics",
    "sport.soccer": "Soccer",
    "sport.tennis": "Tennis",
    "sport.athletics": "Athletics",
    "sport.martial-arts": "Martial arts",

    // ── Features section (home page) ────────────────────────────────────
    "features.eyebrow": "The platform",
    "features.title": "Everything an academy runs on, in one place",
    "features.subtitle":
      "Replace the patchwork of spreadsheets, group chats, and payment links with a single operating system built for coaching organizations.",

    "features.scheduling.title": "Multi-sport scheduling",
    "features.scheduling.description":
      "Build rosters across pools, mats, courts, and pitches in one calendar. Coaches, venues, and capacity stay in sync automatically.",
    "features.scheduling.point1": "Drag-and-drop session planner",
    "features.scheduling.point2": "Venue & coach conflict alerts",
    "features.scheduling.point3": "Waitlists and auto-fill",

    "features.communication.title": "Parent communication",
    "features.communication.description":
      "Keep families in the loop with broadcast updates, cancellations, and progress notes, delivered by email and push in seconds.",
    "features.communication.point1": "Group and per-squad messaging",
    "features.communication.point2": "Attendance & progress alerts",
    "features.communication.point3": "Two-way replies inbox",

    "features.invoicing.title": "Automated invoicing",
    "features.invoicing.description":
      "Charge tuition on a schedule, retry failed cards, and reconcile every payment without touching a spreadsheet.",
    "features.invoicing.point1": "Recurring plans & pro-rating",
    "features.invoicing.point2": "Auto-charge with smart retries",
    "features.invoicing.point3": "Payout & tax-ready reports",

    // ── Demo section (home page) ────────────────────────────────────────
    "demo.eyebrow": "One system, every setup",
    "demo.title": "Configured for the way each sport trains",
    "demo.subtitle":
      "Toggle a discipline to see how venues, session types, and billing plans adapt, no custom setup required.",
    "demo.sessionTypes": "Session types",
    "demo.planNote": "Auto-billed, retries handled",
    "demo.liveSetup": "Live setup · {sport}",

    // Swimming setup
    "demo.swimming.venue": "Aquatic Center · Pool 2",
    "demo.swimming.venueDetail": "8 lanes · 25m",
    "demo.swimming.planLabel": "Monthly squad plan",
    "demo.swimming.session.squad": "Squad training",
    "demo.swimming.session.learnToSwim": "Learn-to-swim",
    "demo.swimming.session.masters": "Masters",
    "demo.swimming.session.strokeClinic": "Stroke clinic",
    "demo.swimming.metric.activeSwimmers": "Active swimmers",
    "demo.swimming.metric.weeklySessions": "Weekly sessions",
    "demo.swimming.metric.laneUtilization": "Lane utilization",

    // Gymnastics setup
    "demo.gymnastics.venue": "Main Gym Hall",
    "demo.gymnastics.venueDetail": "Beam · Vault · Floor",
    "demo.gymnastics.planLabel": "12-week term plan",
    "demo.gymnastics.session.recreational": "Recreational",
    "demo.gymnastics.session.competitive": "Competitive squad",
    "demo.gymnastics.session.tumbling": "Tumbling",
    "demo.gymnastics.session.parentTot": "Parent & tot",
    "demo.gymnastics.metric.activeGymnasts": "Active gymnasts",
    "demo.gymnastics.metric.apparatusRotations": "Apparatus rotations",
    "demo.gymnastics.metric.coachRatio": "Coach ratio",

    // Soccer setup
    "demo.soccer.venue": "Training Ground · Pitch 1",
    "demo.soccer.venueDetail": "11-a-side · floodlit",
    "demo.soccer.planLabel": "Monthly academy plan",
    "demo.soccer.session.skillsAcademy": "Skills academy",
    "demo.soccer.session.matchPrep": "Match prep",
    "demo.soccer.session.u12": "U12 league",
    "demo.soccer.session.goalkeeping": "Goalkeeping",
    "demo.soccer.metric.registeredPlayers": "Registered players",
    "demo.soccer.metric.teamsManaged": "Teams managed",
    "demo.soccer.metric.attendanceRate": "Attendance rate",

    // ── Product preview (home page mock) ────────────────────────────────
    "preview.address": "app.academorix.com",
    "preview.tabSchedule": "Roster & scheduling",
    "preview.tabBilling": "Billing",
    "preview.today": "Today · 24 sessions",
    "preview.liveVenues": "Live across 6 venues",
    "preview.onTrack": "On track",
    "preview.day.mon": "Mon",
    "preview.day.tue": "Tue",
    "preview.day.wed": "Wed",
    "preview.day.thu": "Thu",
    "preview.day.fri": "Fri",
    "preview.day.sat": "Sat",
    "preview.col.time": "Time",
    "preview.col.session": "Session",
    "preview.col.coach": "Coach",
    "preview.col.status": "Status",
    "preview.col.family": "Family",
    "preview.col.plan": "Plan",
    "preview.col.amount": "Amount",
    "preview.status.confirmed": "Confirmed",
    "preview.status.waitlist": "Waitlist",
    "preview.status.paid": "Paid",
    "preview.status.due": "Due Apr 3",
    "preview.status.overdue": "Overdue",
    "preview.session.freestyle": "Freestyle · Squad A",
    "preview.session.beam": "Beam · Level 3",
    "preview.session.u12": "U12 Skills",
    "preview.session.sprint": "Sprint Drills",
    "preview.venue.pool2": "Pool 2",
    "preview.venue.gymHall": "Gym Hall",
    "preview.venue.pitch1": "Pitch 1",
    "preview.venue.track": "Track",
    "preview.family.okonkwo": "The Okonkwo family",
    "preview.family.bianchi": "The Bianchi family",
    "preview.family.novak": "The Novak family",
    "preview.family.ahmed": "The Ahmed family",
    "preview.plan.swimMonthly": "Swim · Monthly",
    "preview.plan.gymTerm": "Gymnastics · Term",
    "preview.plan.soccerMonthly": "Soccer · Monthly",
    "preview.plan.multiSport": "Multi-sport",
    "preview.billing.collected": "Collected · March",
    "preview.billing.outstanding": "Outstanding",
    "preview.billing.collectedNote": "92% of expected",
    "preview.billing.autoChargeTitle": "Auto-charge on due date",
    "preview.billing.autoChargeNote": "Retries failed cards automatically",

    // ── Proof section (home page) ───────────────────────────────────────
    "proof.trustedBy": "Trusted by academies in 30+ countries",
    "proof.stat.academies": "Academies running on Academorix",
    "proof.stat.sessions": "Sessions scheduled every year",
    "proof.stat.tuition": "Tuition processed annually",
    "proof.stat.savings": "Admin saved per coach each week",
    "proof.quote":
      '"We coach four sports across three sites. Academorix replaced five tools and a wall of spreadsheets. Registrations, rosters, and billing finally live in one place."',
    "proof.quoteAuthor": "Elena Marsh",
    "proof.quoteRole": "Director, Riverside Aquatics",

    // ── FAQ section (home page) ─────────────────────────────────────────
    "faq.title": "Frequently asked questions",
    "faq.subtitle": "Everything you need to know about running your academy on Academorix.",
    "faq.q1": "Is Academorix really sport-agnostic?",
    "faq.a1":
      "Yes. Venues, session types, skill levels, and billing plans are all configurable, so swimming lanes, gym apparatus rotations, and soccer squads run on the same core with setups that fit each discipline.",
    "faq.q2": "How does billing and payment collection work?",
    "faq.a2":
      "Create recurring or term-based plans, then let Academorix auto-charge saved cards on the due date. Failed payments retry automatically and every transaction reconciles into payout and tax-ready reports.",
    "faq.q3": "Can parents manage bookings themselves?",
    "faq.a3":
      "Parents get a self-serve portal to register children, view schedules, message coaches, and update payment details, which cuts the front-desk load for your team.",
    "faq.q4": "How long does it take to migrate?",
    "faq.a4":
      "Most academies import rosters and are live within a week. Our team helps map your existing sessions, plans, and family records during onboarding.",
    "faq.q5": "Do you offer a free trial?",
    "faq.a5":
      "Every plan starts with a 14-day free trial. No card required, and you can invite your coaching staff to explore the full platform.",
    "faq.q6": "Do you support single sign-on?",
    "faq.a6":
      "Yes, SSO is available on Enterprise plans along with advanced role-based permissions and per-site access controls.",

    // ── CTA band (home page) ────────────────────────────────────────────
    "ctaBand.title": "Give your coaches their evenings back",
    "ctaBand.subtitle":
      "Bring scheduling, parent communication, and billing into one system your whole academy will actually enjoy using.",
    "ctaBand.point1": "14-day free trial",
    "ctaBand.point2": "No card required",
    "ctaBand.point3": "Migration help included",

    // ── Footer ──────────────────────────────────────────────────────────
    "footer.tagline":
      "The academy management system for coaching organizations of every sport. Scheduling, parent communication, and automated billing in one command center.",
    "footer.newsletterTitle": "Join the operators' newsletter",
    "footer.newsletterSubtitle":
      "Monthly playbooks and product updates for academy directors and coaches. No spam.",
    "footer.subscribe": "Subscribe",
    "footer.emailPlaceholder": "you@academy.com",
    "footer.allSystems": "All systems operational",
    "footer.rights": "All rights reserved.",

    "footer.col.product": "Product",
    "footer.col.sports": "Sports",
    "footer.col.solutions": "Solutions",
    "footer.col.forTeams": "For teams",
    "footer.col.resources": "Resources",
    "footer.col.company": "Company",

    "footer.product.scheduling": "Scheduling",
    "footer.product.attendance": "Attendance",
    "footer.product.billing": "Billing",
    "footer.product.communication": "Communication",
    "footer.product.registration": "Registration",
    "footer.product.reporting": "Reporting",

    "footer.solutions.single": "Single academy",
    "footer.solutions.multi": "Multi-site",
    "footer.solutions.franchise": "Franchises",
    "footer.solutions.clubs": "Clubs & leagues",
    "footer.solutions.enterprise": "Enterprise",
    "footer.solutions.pricing": "Pricing",

    "footer.forTeams.directors": "Directors",
    "footer.forTeams.coaches": "Coaches",
    "footer.forTeams.administrators": "Administrators",
    "footer.forTeams.parents": "Parents",
    "footer.forTeams.customers": "Customers",

    "footer.resources.docs": "Docs",
    "footer.resources.tutorials": "Tutorials",
    "footer.resources.changelog": "Changelog",
    "footer.resources.blog": "Blog",
    "footer.resources.faq": "FAQ",
    "footer.resources.newsletter": "Newsletter",

    "footer.company.about": "About",
    "footer.company.careers": "Careers",
    "footer.company.press": "Press",
    "footer.company.contactSales": "Contact sales",
    "footer.company.legal": "Legal & trust",

    "footer.legal.privacy": "Privacy",
    "footer.legal.terms": "Terms",
    "footer.legal.security": "Security",
    "footer.legal.dpa": "DPA",

    "footer.badge.soc2": "SOC 2 Type II",
    "footer.badge.gdpr": "GDPR ready",
    "footer.badge.iso": "ISO 27001",

    // ── Locale + theme controls ─────────────────────────────────────────
    "controls.appearance": "Appearance",
    "controls.light": "Light",
    "controls.dark": "Dark",
    "controls.language": "Language",

    // ── Products index / detail ─────────────────────────────────────────
    "products.eyebrow": "Products",
    "products.title": "The Academorix product suite",
    "products.subtitle":
      "Every capability an academy needs, engineered to work together out of the box. Pick a product to dive deeper.",
    "products.details.tagline": "What it does",
    "products.details.features": "How it helps",
    "products.details.exploreOther": "Explore other products",

    // ── Sports index / detail ───────────────────────────────────────────
    "sportsIndex.eyebrow": "Sports",
    "sportsIndex.title": "One system for every sport you run",
    "sportsIndex.subtitle":
      "Every discipline gets a purpose-built configuration for venues, sessions, progressions, and billing.",
    "sportsIndex.explore": "Explore {sport}",
    "sportsIndex.metric": "Live metric",
    "sportsIndex.dontSeeYours": "Don't see your sport?",
    "sportsIndex.dontSeeYoursDesc":
      "If you coach it, Academorix can run it. Talk to us about your discipline.",

    // ── Solutions index / detail ────────────────────────────────────────
    "solutions.eyebrow": "Solutions",
    "solutions.title": "Built for every academy shape",
    "solutions.subtitle":
      "From a single studio to a national franchise, Academorix scales without losing the details that matter.",
    "solutions.outcomes": "Outcomes you can expect",
    "solutions.detail.summary": "Summary",
    "solutions.explore": "See {name}",

    // ── Personas ────────────────────────────────────────────────────────
    "personas.eyebrow": "For every role in the academy",
    "personas.title": "Purpose-built for the people who run it",
    "personas.subtitle":
      "Directors, coaches, administrators, and parents all get exactly the view they need, on any device.",
    "personas.jobs": "What they get done",

    // ── Customers ───────────────────────────────────────────────────────
    "customers.eyebrow": "Customer stories",
    "customers.title": "Academies going further with Academorix",
    "customers.subtitle":
      "Real numbers from real academies. See how directors and coaches move admin off their plate.",
    "customers.metric": "Metric",
    "customers.readStory": "Read the story",
    "customers.detail.metrics": "Impact by the numbers",
    "customers.detail.story": "The full story",

    // ── Blog / resources ────────────────────────────────────────────────
    "blog.eyebrow": "Blog",
    "blog.title": "Operators' notebook",
    "blog.subtitle":
      "Field notes and playbooks from academy directors, coaches, and the Academorix team.",
    "blog.readTime": "{minutes} min read",
    "blog.author": "By {author}",
    "blog.related": "More from the blog",

    "resources.docs.title": "Docs",
    "resources.docs.subtitle": "Everything you need to configure and run Academorix.",
    "resources.docs.category": "Category",
    "resources.docs.readArticle": "Read article",
    "resources.tutorials.title": "Tutorials",
    "resources.tutorials.subtitle":
      "Step-by-step walk-throughs for the most common academy setups.",
    "resources.tutorials.level": "Level",
    "resources.tutorials.duration": "Duration",
    "resources.tutorials.steps": "What you'll do",
    "resources.changelog.title": "Changelog",
    "resources.changelog.subtitle": "Every improvement we ship, in reverse chronological order.",

    // ── Company ─────────────────────────────────────────────────────────
    "company.eyebrow": "About",
    "company.title": "The team behind the operating system",
    "company.subtitle":
      "We build Academorix from lived academy experience. Meet the team and read what we're up to.",
    "company.jobs.title": "Open roles",
    "company.jobs.subtitle": "Come build the operating system for coaching organizations.",
    "company.job.team": "Team",
    "company.job.location": "Location",
    "company.job.type": "Type",
    "company.job.responsibilities": "What you'll do",
    "company.job.requirements": "What we're looking for",

    // ── Enterprise ──────────────────────────────────────────────────────
    "enterprise.eyebrow": "Enterprise",
    "enterprise.title": "Multi-site operations, one command center",
    "enterprise.subtitle":
      "SSO, roll-up reporting, and dedicated onboarding for franchise networks and multi-brand academy groups.",
    "enterprise.feature1.title": "Standardized programs",
    "enterprise.feature1.description":
      "Push program templates and pricing across every site with per-location autonomy.",
    "enterprise.feature2.title": "Roll-up analytics",
    "enterprise.feature2.description":
      "Live revenue, retention, and utilization across every venue in a single view.",
    "enterprise.feature3.title": "Security & SSO",
    "enterprise.feature3.description":
      "Single sign-on, granular permissions, and SOC 2 Type II compliance out of the box.",
    "enterprise.feature4.title": "Dedicated onboarding",
    "enterprise.feature4.description":
      "Named implementation team, migration engineering, and quarterly business reviews.",

    // ── Contact sales ───────────────────────────────────────────────────
    "contactSales.eyebrow": "Talk to sales",
    "contactSales.title": "Let's plan your rollout",
    "contactSales.subtitle":
      "Tell us about your academy and we'll come back with a tailored walkthrough within one business day.",
    "contactSales.form.name": "Full name",
    "contactSales.form.email": "Work email",
    "contactSales.form.role": "Your role",
    "contactSales.form.company": "Academy or company",
    "contactSales.form.size": "Athletes managed",
    "contactSales.form.message": "What are you hoping to solve?",
    "contactSales.form.submit": "Request a demo",
    "contactSales.form.privacy":
      "By submitting, you agree to our privacy policy. We never share your details.",
    "contactSales.trust.title": "What happens next",
    "contactSales.trust.step1.title": "Discovery call",
    "contactSales.trust.step1.description":
      "A 30-minute conversation to understand your programs and pain points.",
    "contactSales.trust.step2.title": "Tailored demo",
    "contactSales.trust.step2.description":
      "Walk-through configured for your sport, sites, and family model.",
    "contactSales.trust.step3.title": "Rollout plan",
    "contactSales.trust.step3.description":
      "A clear migration plan with dates, owners, and success metrics.",

    // ── Pricing ─────────────────────────────────────────────────────────
    "pricing.eyebrow": "Pricing",
    "pricing.title": "Straightforward pricing that scales with you",
    "pricing.subtitle":
      "Predictable per-academy pricing. Start free and grow without pricing games or surprise fees.",
    "pricing.featured": "Most popular",
    "pricing.faq": "Pricing questions",

    // ── Legal ───────────────────────────────────────────────────────────
    "legal.eyebrow": "Legal & trust",
    "legal.title": "Policies, promises, and controls",
    "legal.subtitle":
      "The commitments we make to your academy, and the controls that keep your data safe.",
    "legal.updated": "Last updated {date}",
    "legal.detail.summary": "Summary",

    // ── FAQ page ────────────────────────────────────────────────────────
    "faqPage.eyebrow": "FAQ",
    "faqPage.title": "Answers to the questions we hear most",
    "faqPage.subtitle": "Can't find what you're looking for? Talk to sales anytime.",

    // ── Auth (create / find workspace) ──────────────────────────────────
    "auth.create.eyebrow": "Create workspace",
    "auth.create.title": "Spin up your academy's workspace",
    "auth.create.subtitle":
      "A private, secure workspace for your academy. Invite coaches and admins later.",
    "auth.create.workspace": "Workspace name",
    "auth.create.workspacePlaceholder": "Riverside Aquatics",
    "auth.create.admin": "Your name",
    "auth.create.adminPlaceholder": "Alex Morgan",
    "auth.create.email": "Work email",
    "auth.create.emailPlaceholder": "you@academy.com",
    "auth.create.submit": "Create workspace",
    "auth.create.trust": "14-day free trial · No credit card required",

    "auth.find.eyebrow": "Find your workspace",
    "auth.find.title": "Get back into your academy",
    "auth.find.subtitle":
      "Enter the email you signed up with. We'll send a magic link to every workspace you belong to.",
    "auth.find.email": "Work email",
    "auth.find.emailPlaceholder": "you@academy.com",
    "auth.find.submit": "Send my sign-in links",
    "auth.find.newHere": "New here?",
    "auth.find.createOne": "Create a workspace",

    // ── Common (extras) ─────────────────────────────────────────────────
    "common.home": "Home",
    "common.back": "Back",

    // ── Products details ────────────────────────────────────────────────
    "products.details.wholePlatform": "See the whole platform in action",
    "products.details.wholePlatformDesc":
      "Start a free trial and explore every module with your own academy's setup.",
    "products.details.whatItDoes": "What {name} does",
    "products.details.highlights": "Highlights",
    "products.details.readyToRun": "Ready to run {name} on Academorix?",
    "products.details.readyToRunDesc":
      "Get set up in under a week with hands-on migration help from our team.",

    // ── Solutions (extras) ──────────────────────────────────────────────
    "solutions.ctaTitle": "Let's map Academorix to your operation",
    "solutions.ctaDesc":
      "Tell us how you're structured and we'll show you the fastest path to live.",
    "solutions.whatToExpect": "What you can expect",
    "solutions.detailCtaTitle": "See it configured for your organization",
    "solutions.detailCtaDesc": "Book a walkthrough and we'll tailor Academorix to your structure.",

    // ── Personas (extras) ───────────────────────────────────────────────
    "personas.ctaTitle": "Bring your whole team on board",
    "personas.ctaDesc": "Invite unlimited coaches and staff on every plan, from day one.",
    "personas.dayToDay": "Day to day",
    "personas.detailTitle": "Academorix for {name}",
    "personas.detailCtaTitle": "Give your team a system they'll actually use",
    "personas.detailCtaDesc": "Academorix is fast to learn and even faster to run day to day.",

    // ── Customers (extras) ──────────────────────────────────────────────
    "customers.indexTitle": "Academies growing with Academorix",
    "customers.indexSubtitle":
      "From aquatic clubs to soccer academies, coaching organizations run their operations on one platform.",
    "customers.storyTag": "The story",
    "customers.allStories": "All customer stories",
    "customers.indexCtaTitle": "Join hundreds of academies",
    "customers.indexCtaDesc":
      "Start your free trial and see why coaching organizations switch to Academorix.",
    "customers.detailCtaTitle": "Write your own success story",
    "customers.detailCtaDesc": "Start free and get the same results these academies did.",

    // ── FAQ page (extras) ───────────────────────────────────────────────
    "faqPage.stillHave": "Still have questions?",
    "faqPage.stillHaveDesc": "Our team is happy to help you find the right fit for your academy.",

    // ── Pricing (extras) ────────────────────────────────────────────────
    "pricing.faqTitle": "Pricing questions, answered",
    "pricing.ctaTitle": "Start free, upgrade when you're ready",
    "pricing.ctaDesc": "Explore the full platform for 14 days with your own academy's data.",

    // ── Blog (extras) ───────────────────────────────────────────────────
    "blog.featured": "Featured",
    "blog.readArticle": "Read article",
    "blog.backToBlog": "Back to blog",
    "blog.indexCtaTitle": "Put these ideas to work",
    "blog.indexCtaDesc": "Start a free trial and run your academy the modern way.",
    "blog.detailCtaTitle": "Run your academy on Academorix",
    "blog.detailCtaDesc": "Everything scheduling, communication, and billing, in one place.",
    "blog.byLine": "By {author} · {date} · {readTime}",
    "blog.meta": "{date} · {readTime}",
    "blog.featuredMeta": "{category} · {date} · {readTime}",

    // ── Resources (extras) ──────────────────────────────────────────────
    "resources.docs.eyebrow": "Documentation",
    "resources.docs.indexTitle": "Docs & guides",
    "resources.docs.indexSubtitle":
      "Everything you need to set up, configure, and get the most from Academorix.",
    "resources.docs.read": "Read",
    "resources.docs.backToDocs": "Back to docs",
    "resources.changelog.eyebrow": "Changelog",
    "resources.changelog.whatsNew": "What's new in Academorix",
    "resources.changelog.whatsNewDesc": "Every release, improvement, and fix, in one place.",
    "resources.changelog.tag.new": "New",
    "resources.changelog.tag.improved": "Improved",
    "resources.changelog.tag.fixed": "Fixed",
    "resources.newsletter.eyebrow": "Newsletter",
    "resources.newsletter.title": "The academy operators' newsletter",
    "resources.newsletter.subtitle":
      "Monthly playbooks, product updates, and growth ideas for coaching organizations. No spam, unsubscribe anytime.",
    "resources.newsletter.cardTitle": "Subscribe",
    "resources.newsletter.cardDesc":
      "Join 8,000+ directors and coaches getting the monthly edition.",
    "resources.tutorials.eyebrow": "Tutorials",
    "resources.tutorials.indexTitle": "Step-by-step tutorials",
    "resources.tutorials.indexSubtitle":
      "Hands-on walkthroughs to help you master Academorix, one workflow at a time.",
    "resources.tutorials.stepsHeading": "Steps",
    "resources.tutorials.backToAll": "All tutorials",
    "resources.tutorials.resourcesCrumb": "Resources",

    // ── Company / About / Careers / Press ───────────────────────────────
    "company.about.title": "We're building the operating system for academies",
    "company.about.description":
      "Academorix started when a group of coaches and builders got tired of running world-class programs on spreadsheets. Today we help hundreds of academies focus on what they do best: coaching.",
    "company.about.stats.academies": "Academies",
    "company.about.stats.countries": "Countries",
    "company.about.stats.sessions": "Sessions / year",
    "company.about.stats.team": "Team members",
    "company.values.eyebrow": "Our values",
    "company.values.title": "What we stand for",
    "company.values.coachesFirst.title": "Coaches first",
    "company.values.coachesFirst.description":
      "We build for the people running sessions, not just the people buying software.",
    "company.values.simple.title": "Simple by default",
    "company.values.simple.description":
      "Powerful when you need it, effortless the rest of the time.",
    "company.values.trust.title": "Earn trust",
    "company.values.trust.description":
      "We protect the data of academies and families like it's our own.",
    "company.values.ship.title": "Ship & learn",
    "company.values.ship.description":
      "We move quickly, listen closely, and improve every release.",
    "company.about.ctaTitle": "Want to help build it?",
    "company.about.ctaDesc": "We're hiring across product, engineering, and customer success.",
    "company.about.seeRoles": "See open roles",
    "company.about.contactUs": "Contact us",
    "company.careers.eyebrow": "Careers",
    "company.careers.title": "Build the future of academy management",
    "company.careers.subtitle":
      "Join a remote-first team helping coaching organizations around the world run better.",
    "company.job.applyNow": "Apply now",
    "company.press.eyebrow": "Press",
    "company.press.title": "Press & media",
    "company.press.subtitle":
      "News, announcements, and resources for journalists covering Academorix.",
    "company.press.mediaKit.title": "Media kit",
    "company.press.mediaKit.desc": "Logos, brand assets, and company facts.",
    "company.press.mediaKit.cta": "Request assets",
    "company.press.item1.title": "Academorix raises $18M to scale academy management",
    "company.press.item1.source": "TechCrunch",
    "company.press.item1.date": "Mar 2025",
    "company.press.item2.title": "How one platform runs 400+ sports academies",
    "company.press.item2.source": "SportsTech Weekly",
    "company.press.item2.date": "Feb 2025",
    "company.press.item3.title": "Academorix launches multi-site reporting",
    "company.press.item3.source": "Press release",
    "company.press.item3.date": "Jan 2025",

    // ── Enterprise (extras) ─────────────────────────────────────────────
    "enterprise.hero.title": "Academy management at network scale",
    "enterprise.hero.description":
      "For multi-site operators and franchises that need security, control, and reporting across every location.",
    "enterprise.stats.uptime.value": "99.9%",
    "enterprise.stats.uptime.label": "Uptime SLA",
    "enterprise.stats.compliance.value": "SOC 2",
    "enterprise.stats.compliance.label": "Type II aligned",
    "enterprise.stats.support.value": "24/7",
    "enterprise.stats.support.label": "Priority support",
    "enterprise.capabilities.eyebrow": "Enterprise-grade",
    "enterprise.capabilities.title": "Everything you need to standardize and scale",
    "enterprise.capabilities.description":
      "Run consistent programs across locations while giving each site the autonomy it needs.",
    "enterprise.capabilities.sso.title": "SSO & SCIM",
    "enterprise.capabilities.sso.description":
      "SAML single sign-on and automated user provisioning for large teams.",
    "enterprise.capabilities.permissions.title": "Advanced permissions",
    "enterprise.capabilities.permissions.description":
      "Granular, per-site role controls so people see only what they should.",
    "enterprise.capabilities.reporting.title": "Roll-up reporting",
    "enterprise.capabilities.reporting.description":
      "Network-wide dashboards across every location and program.",
    "enterprise.capabilities.onboarding.title": "Custom onboarding",
    "enterprise.capabilities.onboarding.description":
      "A dedicated team migrates your data and configures your workspace.",
    "enterprise.capabilities.security.title": "Security reviews",
    "enterprise.capabilities.security.description":
      "SOC 2 Type II alignment, DPAs, and support for your security questionnaires.",
    "enterprise.capabilities.success.title": "Dedicated success",
    "enterprise.capabilities.success.description":
      "A named success manager and priority SLA-backed support.",
    "enterprise.ctaTitle": "Let's talk about your network",
    "enterprise.ctaDesc": "Get a tailored walkthrough and a rollout plan for every site.",

    // ── Contact sales (extras) ──────────────────────────────────────────
    "contactSales.hero.title": "Talk to our team",
    "contactSales.hero.description":
      "Tell us about your academy and we'll show you the fastest path to running it on Academorix.",
    "contactSales.highlights.walkthrough.title": "Tailored walkthrough",
    "contactSales.highlights.walkthrough.description":
      "See Academorix configured for your sport and setup.",
    "contactSales.highlights.migration.title": "Migration plan",
    "contactSales.highlights.migration.description":
      "We map your rosters, plans, and history for a smooth switch.",
    "contactSales.highlights.contact.title": "Dedicated contact",
    "contactSales.highlights.contact.description":
      "A real person to answer questions and get you live.",
    "contactSales.form.firstName": "First name",
    "contactSales.form.firstNamePlaceholder": "Elena",
    "contactSales.form.lastName": "Last name",
    "contactSales.form.lastNamePlaceholder": "Marsh",
    "contactSales.form.emailPlaceholder": "you@academy.com",
    "contactSales.form.academy": "Academy name",
    "contactSales.form.academyPlaceholder": "Riverside Aquatics",
    "contactSales.form.primarySport": "Primary sport",
    "contactSales.form.selectSport": "Select a sport",
    "contactSales.form.academySize": "Academy size",
    "contactSales.form.selectSize": "Select a size",
    "contactSales.form.helpLabel": "How can we help?",
    "contactSales.form.helpPlaceholder":
      "Tell us about your programs and what you're looking for...",
    "contactSales.form.sport.swimming": "Swimming",
    "contactSales.form.sport.gymnastics": "Gymnastics",
    "contactSales.form.sport.soccer": "Soccer",
    "contactSales.form.sport.tennis": "Tennis",
    "contactSales.form.sport.athletics": "Athletics",
    "contactSales.form.sport.martialArts": "Martial arts",
    "contactSales.form.sport.multi": "Multi-sport",
    "contactSales.form.sport.other": "Other",
    "contactSales.form.size.small": "1 - 50 athletes",
    "contactSales.form.size.medium": "50 - 250 athletes",
    "contactSales.form.size.large": "250 - 1,000 athletes",
    "contactSales.form.size.enterprise": "1,000+ athletes",
    "contactSales.form.request": "Request a demo",

    // ── Auth (extras) ───────────────────────────────────────────────────
    "auth.create.headline": "Create your workspace",
    "auth.create.subheadline": "Start your 14-day free trial. No card required.",
    "auth.create.name": "Full name",
    "auth.create.namePlaceholder": "Elena Marsh",
    "auth.create.emailLabel": "Work email",
    "auth.create.workspaceLabel": "Workspace name",
    "auth.create.workspaceInputPlaceholder": "riverside",
    "auth.create.workspaceSuffix": ".academorix.app",
    "auth.create.password": "Password",
    "auth.create.passwordPlaceholder": "At least 8 characters",
    "auth.create.showPassword": "Show password",
    "auth.create.hidePassword": "Hide password",
    "auth.create.submitLabel": "Create workspace",
    "auth.create.haveWorkspace": "Already have a workspace?",
    "auth.create.signInLink": "Sign in",
    "auth.find.headline": "Find your workspaces",
    "auth.find.subheadline":
      "Enter your email and we'll send a link to all the workspaces you belong to.",
    "auth.find.emailLabel": "Work email",
    "auth.find.continue": "Continue",
    "auth.find.noWorkspace": "Don't have a workspace yet?",
    "auth.find.createOneLink": "Create one",

    // ── Legal (extras) ──────────────────────────────────────────────────
    "legal.updatedShort": "Updated {date}",
    "legal.indexTitle": "Legal & trust",
    "legal.indexSubtitle":
      "Our policies, terms, and commitments to keeping your academy's data safe.",

    // ── Mega menu ───────────────────────────────────────────────────────
    "megaMenu.core.title": "Core modules",
    "megaMenu.core.scheduling.desc": "Rosters and sessions for every venue",
    "megaMenu.core.attendance.desc": "Track every check-in in real time",
    "megaMenu.core.billing.desc": "Automated tuition, done right",
    "megaMenu.core.communication.desc": "Keep every family in the loop",
    "megaMenu.core.registration.desc": "Self-serve sign-ups and waivers",
    "megaMenu.core.reporting.desc": "Decisions backed by real data",
    "megaMenu.intelligence.title": "Intelligence",
    "megaMenu.intelligence.aiEngine": "AI Engine",
    "megaMenu.intelligence.aiEngineDesc": "Autonomous scheduling and insight",
    "megaMenu.intelligence.analytics": "Analytics",
    "megaMenu.intelligence.analyticsDesc": "Live dashboards for revenue and growth",
    "megaMenu.intelligence.automations": "Automations",
    "megaMenu.intelligence.automationsDesc": "Trigger workflows across your academy",
    "megaMenu.products.banner.title": "Meet the AI Engine",
    "megaMenu.products.banner.description":
      "Autonomous scheduling, insight, and communication. Learn more →",
    "megaMenu.products.banner.cta": "Explore AI Engine",
    "megaMenu.sports.title": "Sports we support",
    "megaMenu.sports.banner.title": "Not your sport?",
    "megaMenu.sports.banner.description":
      "Any discipline runs on our attribute engine. Talk to us.",
    "megaMenu.sports.banner.cta": "Talk to sales",

    // ── AI Engine ───────────────────────────────────────────────────────
    "aiEngine.eyebrow": "AI Engine",
    "aiEngine.title": "The autonomous layer for your academy",
    "aiEngine.subtitle":
      "Predictive scheduling, contextual insights, and hands-off automations. The AI Engine turns Academorix into a system that anticipates your next move.",
    "aiEngine.features.eyebrow": "Capabilities",
    "aiEngine.features.title": "Three ways it shows up in your day",
    "aiEngine.features.predictive.title": "Predictive scheduling",
    "aiEngine.features.predictive.description":
      "The engine suggests session times, coach assignments, and venue rotations based on historical attendance and demand.",
    "aiEngine.features.insight.title": "Insight assistant",
    "aiEngine.features.insight.description":
      "Ask questions about your academy in plain language. Get answers backed by your live scheduling, billing, and attendance data.",
    "aiEngine.features.automation.title": "Automation studio",
    "aiEngine.features.automation.description":
      "Compose triggers that respond to no-shows, overdue invoices, or waitlist activity, without writing a single line of code.",
    "aiEngine.how.eyebrow": "How it works",
    "aiEngine.how.title": "One engine, two moving parts",
    "aiEngine.how.step1.title": "Understand your academy",
    "aiEngine.how.step1.description":
      "The engine reads your live schedule, roster, and billing to build a real-time model of how your organization runs.",
    "aiEngine.how.step2.title": "Recommend the next move",
    "aiEngine.how.step2.description":
      "Predictions and suggestions surface in the same product surfaces you already use, no separate dashboards to learn.",
    "aiEngine.testimonial.quote":
      "The AI Engine flagged three coaches who were about to be overbooked before the schedule went live. It changed how we plan every week.",
    "aiEngine.testimonial.author": "Elena Marsh",
    "aiEngine.testimonial.role": "Director, Riverside Aquatics",
    "aiEngine.cta.title": "See the AI Engine on your own academy",
    "aiEngine.cta.description": "Start a free trial and turn on the AI Engine in a single click.",

    // ── Not found ───────────────────────────────────────────────────────
    "notFound.title": "Page not found",
    "notFound.subtitle": "The page you're looking for moved, was renamed, or never existed.",
    "notFound.cta": "Back to the homepage",
  },
  ar: {
    // ── Nav ─────────────────────────────────────────────────────────────
    "nav.products": "المنتجات",
    "nav.sports": "الرياضات",
    "nav.solutions": "الحلول",
    "nav.enterprise": "المؤسسات",
    "nav.pricing": "الأسعار",
    "nav.resources": "الموارد",
    "nav.signIn": "تسجيل الدخول",
    "nav.startTrial": "ابدأ النسخة المجانية",

    // ── Common CTAs ─────────────────────────────────────────────────────
    "common.startFreeTrial": "ابدأ النسخة المجانية",
    "common.talkToSales": "تحدث إلى المبيعات",
    "common.bookDemo": "احجز عرضًا توضيحيًا",
    "common.contactSales": "تواصل مع المبيعات",
    "common.viewPricing": "عرض الأسعار",
    "common.learnMore": "اعرف المزيد",
    "common.readMore": "اقرأ المزيد",
    "common.getStarted": "ابدأ الآن",
    "common.explore": "استكشف المنصة",
    "common.viewAll": "عرض الكل",
    "common.readStory": "اقرأ القصة كاملة",
    "common.exploreProducts": "استعرض المنتجات",
    "common.exploreSports": "استعرض الرياضات",
    "common.exploreSolutions": "استعرض الحلول",
    "common.exploreBlog": "تصفّح المدونة",
    "common.viewJob": "عرض الوظيفة",
    "common.subscribe": "اشترك",
    "common.email": "البريد الإلكتروني",
    "common.emailPlaceholder": "you@academy.com",

    // ── Hero ────────────────────────────────────────────────────────────
    "hero.badge": "مصممة لكل رياضة تدربها",
    "hero.title": "مركز تحكم واحد لأكاديميتك بالكامل",
    "hero.subtitle":
      "جدول الحصص، وراسل أولياء الأمور، وحصّل الرسوم تلقائيًا. تدير أكاديموريكس عمليات السباحة والجمباز وكرة القدم وأكثر.",
    "hero.sportsLabel": "نظام واحد، أي تخصص",

    // ── Sports (chrome, shared strings) ─────────────────────────────────
    "sports.title": "مصممة لطريقة تدريب رياضتك",
    "sports.subtitle":
      "منصة واحدة لأي تخصص. تتكيف المرافق وأنواع الحصص وخطط الفوترة مع كل رياضة دون أي إعداد مخصص.",
    "sports.liveSetup": "إعداد مباشر",
    "sports.sessionTypes": "أنواع الحصص",
    "sports.showcase": "عرض المنتج",
    "sports.runOn": "أدر أكاديمية {sport} على أكاديموريكس",
    "sports.exploreOthers": "استكشف رياضات أخرى",
    "sports.environment": "بيئة التدريب",
    "sports.hero.trust": "نواة تدعم كل الرياضات",
    "sports.workflow.title": "كيف يعمل النظام",
    "sports.workflow.subtitle": "إيقاع تشغيل يفهمه المدربون والأسر وفريق المالية.",
    "sports.workflow.fullSeason": "من التسجيل إلى موسم كامل في أربع خطوات",
    "sports.testimonial": "ماذا تقول الأكاديميات",
    "sports.highlights.title": "كل ما تحتاجه أكاديمية {sport}",
    "sports.purposeBuilt": "مصمم خصيصًا لـ {sport}",
    "sports.purposeBuiltDesc": "المنصة نفسها، مرتّبة حول تدفقات العمل التي تديرها رياضتك أسبوعيًا.",
    "sports.capabilities": "القدرات",
    "sports.whatAcademiesGet": "ما تحصل عليه أكاديميات {sport}",
    "sports.runOnDesc": "ابدأ مجانًا وشاهد إعدادك مباشرًا خلال دقائق، مع مساعدة الترحيل من فريقنا.",

    // ── Sport names ─────────────────────────────────────────────────────
    "sport.swimming": "السباحة",
    "sport.gymnastics": "الجمباز",
    "sport.soccer": "كرة القدم",
    "sport.tennis": "التنس",
    "sport.athletics": "ألعاب القوى",
    "sport.martial-arts": "الفنون القتالية",

    // ── Features section (home page) ────────────────────────────────────
    "features.eyebrow": "المنصة",
    "features.title": "كل ما تحتاجه الأكاديمية للعمل، في مكان واحد",
    "features.subtitle":
      "استبدل خليط جداول البيانات ومجموعات الدردشة وروابط الدفع بنظام تشغيل واحد مصمم لمؤسسات التدريب.",

    "features.scheduling.title": "جدولة متعددة الرياضات",
    "features.scheduling.description":
      "أنشئ التشكيلات عبر المسابح والحلبات والملاعب وأرضيات التدريب في تقويم واحد. يبقى المدربون والمرافق والطاقة الاستيعابية متزامنين تلقائيًا.",
    "features.scheduling.point1": "مخطّط حصص بالسحب والإفلات",
    "features.scheduling.point2": "تنبيهات تعارض المرافق والمدربين",
    "features.scheduling.point3": "قوائم انتظار وتعبئة تلقائية",

    "features.communication.title": "التواصل مع أولياء الأمور",
    "features.communication.description":
      "أبقِ الأسر مطّلعة عبر تحديثات جماعية وإشعارات الإلغاء وملاحظات التقدم، تصل عبر البريد والدفع في ثوانٍ.",
    "features.communication.point1": "رسائل جماعية وحسب الفريق",
    "features.communication.point2": "تنبيهات الحضور والتقدم",
    "features.communication.point3": "صندوق ردود ثنائي الاتجاه",

    "features.invoicing.title": "فوترة آلية",
    "features.invoicing.description":
      "احصّل الرسوم وفق جدول محدد، وأعد محاولة البطاقات المرفوضة، وسوِّ كل دفعة دون لمس أي جدول بيانات.",
    "features.invoicing.point1": "خطط متكررة وحساب تناسبي",
    "features.invoicing.point2": "دفع تلقائي بمحاولات ذكية",
    "features.invoicing.point3": "تقارير جاهزة للدفعات والضرائب",

    // ── Demo section ────────────────────────────────────────────────────
    "demo.eyebrow": "نظام واحد لكل الإعدادات",
    "demo.title": "مُهيّأ لطريقة تدريب كل رياضة",
    "demo.subtitle":
      "بدّل التخصص لترى كيف تتكيّف المرافق وأنواع الحصص وخطط الفوترة، دون أي إعداد مخصص.",
    "demo.sessionTypes": "أنواع الحصص",
    "demo.planNote": "فوترة تلقائية مع إعادة محاولات",
    "demo.liveSetup": "إعداد مباشر · {sport}",

    // Swimming
    "demo.swimming.venue": "المركز المائي · المسبح 2",
    "demo.swimming.venueDetail": "8 مسارات · 25 مترًا",
    "demo.swimming.planLabel": "خطة الفريق الشهرية",
    "demo.swimming.session.squad": "تدريب الفريق",
    "demo.swimming.session.learnToSwim": "تعلّم السباحة",
    "demo.swimming.session.masters": "الفئة الكبرى",
    "demo.swimming.session.strokeClinic": "ورشة الحركات",
    "demo.swimming.metric.activeSwimmers": "سبّاحون نشطون",
    "demo.swimming.metric.weeklySessions": "حصص أسبوعية",
    "demo.swimming.metric.laneUtilization": "استخدام المسارات",

    // Gymnastics
    "demo.gymnastics.venue": "الصالة الرئيسية للجمباز",
    "demo.gymnastics.venueDetail": "عارضة التوازن · حصان القفز · الأرضية",
    "demo.gymnastics.planLabel": "خطة الفصل الدراسي (12 أسبوعًا)",
    "demo.gymnastics.session.recreational": "ترفيهية",
    "demo.gymnastics.session.competitive": "فريق تنافسي",
    "demo.gymnastics.session.tumbling": "الشقلبة",
    "demo.gymnastics.session.parentTot": "الأمهات والأطفال",
    "demo.gymnastics.metric.activeGymnasts": "لاعبو الجمباز النشطون",
    "demo.gymnastics.metric.apparatusRotations": "دورات الأجهزة",
    "demo.gymnastics.metric.coachRatio": "نسبة المدرّب",

    // Soccer
    "demo.soccer.venue": "أرض التدريب · الملعب 1",
    "demo.soccer.venueDetail": "11 لاعبًا · إضاءة كاشفة",
    "demo.soccer.planLabel": "خطة الأكاديمية الشهرية",
    "demo.soccer.session.skillsAcademy": "أكاديمية المهارات",
    "demo.soccer.session.matchPrep": "تحضير المباريات",
    "demo.soccer.session.u12": "دوري تحت 12 عامًا",
    "demo.soccer.session.goalkeeping": "حراسة المرمى",
    "demo.soccer.metric.registeredPlayers": "لاعبون مسجّلون",
    "demo.soccer.metric.teamsManaged": "فرق مُدارة",
    "demo.soccer.metric.attendanceRate": "معدل الحضور",

    // ── Product preview (home page mock) ────────────────────────────────
    "preview.address": "app.academorix.com",
    "preview.tabSchedule": "التشكيلة والجدولة",
    "preview.tabBilling": "الفوترة",
    "preview.today": "اليوم · 24 حصة",
    "preview.liveVenues": "مباشر في 6 مرافق",
    "preview.onTrack": "على المسار",
    "preview.day.mon": "الاثنين",
    "preview.day.tue": "الثلاثاء",
    "preview.day.wed": "الأربعاء",
    "preview.day.thu": "الخميس",
    "preview.day.fri": "الجمعة",
    "preview.day.sat": "السبت",
    "preview.col.time": "الوقت",
    "preview.col.session": "الحصة",
    "preview.col.coach": "المدرب",
    "preview.col.status": "الحالة",
    "preview.col.family": "العائلة",
    "preview.col.plan": "الخطة",
    "preview.col.amount": "المبلغ",
    "preview.status.confirmed": "مؤكدة",
    "preview.status.waitlist": "قائمة انتظار",
    "preview.status.paid": "مدفوعة",
    "preview.status.due": "مستحقة 3 أبريل",
    "preview.status.overdue": "متأخرة",
    "preview.session.freestyle": "حرة · فريق أ",
    "preview.session.beam": "عارضة التوازن · المستوى 3",
    "preview.session.u12": "مهارات تحت 12 عامًا",
    "preview.session.sprint": "تمارين العَدو",
    "preview.venue.pool2": "المسبح 2",
    "preview.venue.gymHall": "صالة الجمباز",
    "preview.venue.pitch1": "الملعب 1",
    "preview.venue.track": "المضمار",
    "preview.family.okonkwo": "عائلة أوكونكوو",
    "preview.family.bianchi": "عائلة بيانكي",
    "preview.family.novak": "عائلة نوفاك",
    "preview.family.ahmed": "عائلة أحمد",
    "preview.plan.swimMonthly": "سباحة · شهرية",
    "preview.plan.gymTerm": "جمباز · فصلية",
    "preview.plan.soccerMonthly": "كرة قدم · شهرية",
    "preview.plan.multiSport": "متعدد الرياضات",
    "preview.billing.collected": "المحصّل · مارس",
    "preview.billing.outstanding": "المستحق",
    "preview.billing.collectedNote": "92٪ من المتوقع",
    "preview.billing.autoChargeTitle": "دفع تلقائي عند الاستحقاق",
    "preview.billing.autoChargeNote": "إعادة محاولات تلقائية للبطاقات المرفوضة",

    // ── Proof section ───────────────────────────────────────────────────
    "proof.trustedBy": "موثوق من أكاديميات في أكثر من 30 دولة",
    "proof.stat.academies": "أكاديمية تعمل على أكاديموريكس",
    "proof.stat.sessions": "حصة مجدولة سنويًا",
    "proof.stat.tuition": "من الرسوم تُعالج سنويًا",
    "proof.stat.savings": "ساعات إدارية يوفرها كل مدرب أسبوعيًا",
    "proof.quote":
      "«نُدرّب أربع رياضات في ثلاثة مواقع. استبدل أكاديموريكس خمس أدوات وحائطًا من جداول البيانات. أصبح التسجيل والتشكيلات والفوترة في مكان واحد أخيرًا.»",
    "proof.quoteAuthor": "إيلينا مارش",
    "proof.quoteRole": "المديرة، ريڤرسايد أكواتيكس",

    // ── FAQ section ─────────────────────────────────────────────────────
    "faq.title": "الأسئلة الشائعة",
    "faq.subtitle": "كل ما تحتاج معرفته لإدارة أكاديميتك على أكاديموريكس.",
    "faq.q1": "هل أكاديموريكس مناسب لكل الرياضات فعلًا؟",
    "faq.a1":
      "نعم. المرافق وأنواع الحصص والمستويات وخطط الفوترة كلها قابلة للتخصيص، بحيث تعمل مسارات السباحة ودوارات الجمباز وفرق كرة القدم على نفس النواة بإعدادات تناسب كل تخصص.",
    "faq.q2": "كيف تعمل الفوترة وتحصيل المدفوعات؟",
    "faq.a2":
      "أنشئ خططًا متكررة أو فصلية، ثم دع أكاديموريكس يدفع تلقائيًا من البطاقات المحفوظة عند الاستحقاق. تُعاد محاولة الدفعات الفاشلة تلقائيًا وتُسوَّى كل معاملة ضمن تقارير جاهزة للدفعات والضرائب.",
    "faq.q3": "هل يمكن لأولياء الأمور إدارة حجوزاتهم بأنفسهم؟",
    "faq.a3":
      "يحصل أولياء الأمور على بوابة ذاتية الخدمة لتسجيل الأبناء، وعرض الجداول، ومراسلة المدربين، وتحديث تفاصيل الدفع، ما يخفف الحمل عن مكتب الاستقبال.",
    "faq.q4": "كم يستغرق الترحيل؟",
    "faq.a4":
      "معظم الأكاديميات تستورد التشكيلات وتنطلق خلال أسبوع. يساعدك فريقنا في تعيين الحصص والخطط وسجلات العائلات أثناء التهيئة.",
    "faq.q5": "هل تقدمون نسخة تجريبية مجانية؟",
    "faq.a5":
      "كل خطة تبدأ بتجربة مجانية مدتها 14 يومًا. لا حاجة إلى بطاقة، ويمكنك دعوة طاقم التدريب لديك لاستكشاف المنصة بالكامل.",
    "faq.q6": "هل تدعمون تسجيل الدخول الموحّد (SSO)؟",
    "faq.a6":
      "نعم، تسجيل الدخول الموحّد متاح في خطط المؤسسات مع صلاحيات متقدمة قائمة على الأدوار وضوابط وصول لكل موقع.",

    // ── CTA band ────────────────────────────────────────────────────────
    "ctaBand.title": "أعِد لمدرّبيك أمسياتهم",
    "ctaBand.subtitle":
      "اجمع الجدولة والتواصل مع أولياء الأمور والفوترة في نظام واحد ستستمتع أكاديميتك باستخدامه فعلًا.",
    "ctaBand.point1": "تجربة مجانية 14 يومًا",
    "ctaBand.point2": "بدون بطاقة ائتمان",
    "ctaBand.point3": "مساعدة في الترحيل مشمولة",

    // ── Footer ──────────────────────────────────────────────────────────
    "footer.tagline":
      "نظام إدارة الأكاديميات لمؤسسات التدريب في كل رياضة. الجدولة والتواصل مع أولياء الأمور والفوترة الآلية في مركز تحكم واحد.",
    "footer.newsletterTitle": "انضم إلى نشرة المشغّلين",
    "footer.newsletterSubtitle":
      "أدلة شهرية وتحديثات المنتج لمديري الأكاديميات والمدربين. بدون رسائل مزعجة.",
    "footer.subscribe": "اشترك",
    "footer.emailPlaceholder": "you@academy.com",
    "footer.allSystems": "جميع الأنظمة تعمل",
    "footer.rights": "جميع الحقوق محفوظة.",

    "footer.col.product": "المنتج",
    "footer.col.sports": "الرياضات",
    "footer.col.solutions": "الحلول",
    "footer.col.forTeams": "للفرق",
    "footer.col.resources": "الموارد",
    "footer.col.company": "الشركة",

    "footer.product.scheduling": "الجدولة",
    "footer.product.attendance": "الحضور",
    "footer.product.billing": "الفوترة",
    "footer.product.communication": "التواصل",
    "footer.product.registration": "التسجيل",
    "footer.product.reporting": "التقارير",

    "footer.solutions.single": "أكاديمية فردية",
    "footer.solutions.multi": "متعدد المواقع",
    "footer.solutions.franchise": "الامتيازات",
    "footer.solutions.clubs": "الأندية والاتحادات",
    "footer.solutions.enterprise": "الشركات",
    "footer.solutions.pricing": "الأسعار",

    "footer.forTeams.directors": "المديرون",
    "footer.forTeams.coaches": "المدربون",
    "footer.forTeams.administrators": "الإداريون",
    "footer.forTeams.parents": "أولياء الأمور",
    "footer.forTeams.customers": "العملاء",

    "footer.resources.docs": "التوثيق",
    "footer.resources.tutorials": "الدروس",
    "footer.resources.changelog": "سجل التغييرات",
    "footer.resources.blog": "المدونة",
    "footer.resources.faq": "الأسئلة الشائعة",
    "footer.resources.newsletter": "النشرة البريدية",

    "footer.company.about": "من نحن",
    "footer.company.careers": "الوظائف",
    "footer.company.press": "الصحافة",
    "footer.company.contactSales": "تحدث إلى المبيعات",
    "footer.company.legal": "القانوني والامتثال",

    "footer.legal.privacy": "الخصوصية",
    "footer.legal.terms": "الشروط",
    "footer.legal.security": "الأمان",
    "footer.legal.dpa": "معالجة البيانات",

    "footer.badge.soc2": "SOC 2 Type II",
    "footer.badge.gdpr": "متوافق مع GDPR",
    "footer.badge.iso": "ISO 27001",

    // ── Locale + theme controls ─────────────────────────────────────────
    "controls.appearance": "المظهر",
    "controls.light": "فاتح",
    "controls.dark": "داكن",
    "controls.language": "اللغة",

    // ── Products index / detail ─────────────────────────────────────────
    "products.eyebrow": "المنتجات",
    "products.title": "مجموعة منتجات أكاديموريكس",
    "products.subtitle":
      "كل ما تحتاجه أي أكاديمية، مصممة لتعمل معًا من اليوم الأول. اختر منتجًا للتعمق فيه.",
    "products.details.tagline": "ماذا يفعل",
    "products.details.features": "كيف يساعدك",
    "products.details.exploreOther": "استكشف منتجات أخرى",

    // ── Sports index / detail ───────────────────────────────────────────
    "sportsIndex.eyebrow": "الرياضات",
    "sportsIndex.title": "نظام واحد لكل رياضة تديرها",
    "sportsIndex.subtitle": "كل تخصص يحصل على إعداد مخصص للمرافق والحصص والتدرج والفوترة.",
    "sportsIndex.explore": "استعرض {sport}",
    "sportsIndex.metric": "مؤشر مباشر",
    "sportsIndex.dontSeeYours": "لا ترى رياضتك؟",
    "sportsIndex.dontSeeYoursDesc":
      "إن كنت تدرّبها، فأكاديموريكس يستطيع تشغيلها. تحدث إلينا عن تخصصك.",

    // ── Solutions index / detail ────────────────────────────────────────
    "solutions.eyebrow": "الحلول",
    "solutions.title": "مصمم لكل حجم أكاديمية",
    "solutions.subtitle":
      "من ستوديو واحد إلى امتياز وطني، يتوسع أكاديموريكس دون أن يخسر التفاصيل المهمة.",
    "solutions.outcomes": "النتائج المتوقعة",
    "solutions.detail.summary": "نبذة",
    "solutions.explore": "استعرض {name}",

    // ── Personas ────────────────────────────────────────────────────────
    "personas.eyebrow": "لكل دور في الأكاديمية",
    "personas.title": "مصمم للأشخاص الذين يديرونها",
    "personas.subtitle":
      "المديرون والمدربون والإداريون وأولياء الأمور يحصلون تمامًا على الواجهة التي يحتاجونها، على أي جهاز.",
    "personas.jobs": "ما ينجزونه",

    // ── Customers ───────────────────────────────────────────────────────
    "customers.eyebrow": "قصص العملاء",
    "customers.title": "أكاديميات تمضي أبعد مع أكاديموريكس",
    "customers.subtitle":
      "أرقام حقيقية من أكاديميات حقيقية. اكتشف كيف يُبعِد المديرون والمدربون العمل الإداري عن مسؤولياتهم.",
    "customers.metric": "المؤشر",
    "customers.readStory": "اقرأ القصة",
    "customers.detail.metrics": "الأثر بالأرقام",
    "customers.detail.story": "القصة كاملة",

    // ── Blog / resources ────────────────────────────────────────────────
    "blog.eyebrow": "المدونة",
    "blog.title": "دفتر ملاحظات المشغّلين",
    "blog.subtitle":
      "ملاحظات ميدانية وأدلة عملية من مديري الأكاديميات والمدربين وفريق أكاديموريكس.",
    "blog.readTime": "{minutes} دقيقة قراءة",
    "blog.author": "بقلم {author}",
    "blog.related": "المزيد من المدونة",

    "resources.docs.title": "التوثيق",
    "resources.docs.subtitle": "كل ما تحتاجه لتهيئة أكاديموريكس وتشغيله.",
    "resources.docs.category": "التصنيف",
    "resources.docs.readArticle": "اقرأ المقالة",
    "resources.tutorials.title": "الدروس",
    "resources.tutorials.subtitle": "خطوة بخطوة لأكثر إعدادات الأكاديميات شيوعًا.",
    "resources.tutorials.level": "المستوى",
    "resources.tutorials.duration": "المدة",
    "resources.tutorials.steps": "ماذا ستنجز",
    "resources.changelog.title": "سجل التغييرات",
    "resources.changelog.subtitle": "كل تحسين نطلقه، من الأحدث إلى الأقدم.",

    // ── Company ─────────────────────────────────────────────────────────
    "company.eyebrow": "من نحن",
    "company.title": "الفريق الذي يبني نظام التشغيل",
    "company.subtitle":
      "نبني أكاديموريكس من تجربة حقيقية داخل الأكاديميات. تعرّف على الفريق واقرأ ما نعمل عليه.",
    "company.jobs.title": "الوظائف المفتوحة",
    "company.jobs.subtitle": "انضم إلى بناء نظام التشغيل لمؤسسات التدريب.",
    "company.job.team": "الفريق",
    "company.job.location": "الموقع",
    "company.job.type": "النوع",
    "company.job.responsibilities": "ماذا ستفعل",
    "company.job.requirements": "ما نبحث عنه",

    // ── Enterprise ──────────────────────────────────────────────────────
    "enterprise.eyebrow": "المؤسسات",
    "enterprise.title": "عمليات متعددة المواقع، مركز تحكم واحد",
    "enterprise.subtitle":
      "تسجيل دخول موحّد وتقارير موحّدة وتهيئة مخصّصة لشبكات الامتياز ومجموعات الأكاديميات متعددة العلامات.",
    "enterprise.feature1.title": "برامج موحّدة",
    "enterprise.feature1.description":
      "انشر قوالب البرامج والأسعار عبر كل موقع مع استقلالية لكل فرع.",
    "enterprise.feature2.title": "تحليلات موحّدة",
    "enterprise.feature2.description":
      "إيرادات مباشرة ومعدل احتفاظ واستخدام عبر كل المرافق في عرض واحد.",
    "enterprise.feature3.title": "الأمان وتسجيل الدخول الموحّد",
    "enterprise.feature3.description":
      "تسجيل دخول موحّد وصلاحيات دقيقة وامتثال SOC 2 Type II جاهزة.",
    "enterprise.feature4.title": "تهيئة مخصّصة",
    "enterprise.feature4.description": "فريق تنفيذ مسمّى وهندسة ترحيل ومراجعات ربع سنوية للأعمال.",

    // ── Contact sales ───────────────────────────────────────────────────
    "contactSales.eyebrow": "تحدث إلى المبيعات",
    "contactSales.title": "لنخطط لعملية النشر",
    "contactSales.subtitle": "أخبرنا عن أكاديميتك وسنعود إليك بجولة مخصصة خلال يوم عمل واحد.",
    "contactSales.form.name": "الاسم الكامل",
    "contactSales.form.email": "بريد العمل",
    "contactSales.form.role": "دورك",
    "contactSales.form.company": "الأكاديمية أو الشركة",
    "contactSales.form.size": "عدد اللاعبين",
    "contactSales.form.message": "ما الذي تسعى لحلّه؟",
    "contactSales.form.submit": "اطلب عرضًا توضيحيًا",
    "contactSales.form.privacy":
      "بإرسال النموذج، فأنت توافق على سياسة الخصوصية. لن نشارك تفاصيلك أبدًا.",
    "contactSales.trust.title": "ما الذي سيحدث لاحقًا",
    "contactSales.trust.step1.title": "مكالمة استكشافية",
    "contactSales.trust.step1.description": "محادثة مدتها 30 دقيقة لفهم برامجك ونقاط الألم لديك.",
    "contactSales.trust.step2.title": "عرض مخصّص",
    "contactSales.trust.step2.description": "جولة مُهيّأة لرياضتك ومواقعك ونموذج عائلاتك.",
    "contactSales.trust.step3.title": "خطة نشر",
    "contactSales.trust.step3.description": "خطة ترحيل واضحة بمواعيد ومسؤوليات ومقاييس نجاح.",

    // ── Pricing ─────────────────────────────────────────────────────────
    "pricing.eyebrow": "الأسعار",
    "pricing.title": "أسعار واضحة تنمو معك",
    "pricing.subtitle":
      "أسعار لكل أكاديمية يمكن التنبؤ بها. ابدأ مجانًا وتوسّع دون ألاعيب في الأسعار أو رسوم مفاجئة.",
    "pricing.featured": "الأكثر شيوعًا",
    "pricing.faq": "أسئلة عن الأسعار",

    // ── Legal ───────────────────────────────────────────────────────────
    "legal.eyebrow": "القانوني والامتثال",
    "legal.title": "السياسات والتعهدات والضوابط",
    "legal.subtitle": "الالتزامات التي نقدمها لأكاديميتك، والضوابط التي تحمي بياناتك.",
    "legal.updated": "آخر تحديث {date}",
    "legal.detail.summary": "نبذة",

    // ── FAQ page ────────────────────────────────────────────────────────
    "faqPage.eyebrow": "الأسئلة الشائعة",
    "faqPage.title": "إجابات على الأسئلة الأكثر تكرارًا",
    "faqPage.subtitle": "لم تجد ما تبحث عنه؟ تحدث إلى المبيعات في أي وقت.",

    // ── Auth (create / find workspace) ──────────────────────────────────
    "auth.create.eyebrow": "إنشاء مساحة عمل",
    "auth.create.title": "أنشئ مساحة عمل لأكاديميتك",
    "auth.create.subtitle":
      "مساحة عمل خاصة وآمنة لأكاديميتك. يمكنك دعوة المدربين والإداريين لاحقًا.",
    "auth.create.workspace": "اسم مساحة العمل",
    "auth.create.workspacePlaceholder": "ريفرسايد أكواتيكس",
    "auth.create.admin": "اسمك",
    "auth.create.adminPlaceholder": "أليكس مورغان",
    "auth.create.email": "بريد العمل",
    "auth.create.emailPlaceholder": "you@academy.com",
    "auth.create.submit": "أنشئ مساحة العمل",
    "auth.create.trust": "تجربة مجانية 14 يومًا · بدون بطاقة ائتمان",

    "auth.find.eyebrow": "ابحث عن مساحة عملك",
    "auth.find.title": "عد إلى أكاديميتك",
    "auth.find.subtitle":
      "أدخل البريد الذي سجّلت به. سنرسل رابطًا سحريًا لكل مساحة عمل تنتمي إليها.",
    "auth.find.email": "بريد العمل",
    "auth.find.emailPlaceholder": "you@academy.com",
    "auth.find.submit": "أرسل روابط تسجيل الدخول",
    "auth.find.newHere": "جديد هنا؟",
    "auth.find.createOne": "أنشئ مساحة عمل",

    // ── Common (extras) ─────────────────────────────────────────────────
    "common.home": "الرئيسية",
    "common.back": "رجوع",

    // ── Products details ────────────────────────────────────────────────
    "products.details.wholePlatform": "شاهد المنصة كاملةً في عملها",
    "products.details.wholePlatformDesc":
      "ابدأ نسخة تجريبية مجانية واستكشف كل وحدة بإعداد أكاديميتك.",
    "products.details.whatItDoes": "ماذا يفعل {name}",
    "products.details.highlights": "أبرز الميزات",
    "products.details.readyToRun": "جاهز لإدارة {name} على أكاديموريكس؟",
    "products.details.readyToRunDesc": "الإعداد في أقل من أسبوع مع مساعدة عملية للترحيل من فريقنا.",

    // ── Solutions (extras) ──────────────────────────────────────────────
    "solutions.ctaTitle": "لنكيّف أكاديموريكس مع عملياتك",
    "solutions.ctaDesc": "أخبرنا بهيكل مؤسستك ونعرض لك أسرع مسار للانطلاق.",
    "solutions.whatToExpect": "ما يمكنك توقّعه",
    "solutions.detailCtaTitle": "شاهده مُهيّأً لمؤسستك",
    "solutions.detailCtaDesc": "احجز جولة توضيحية وسنكيّف أكاديموريكس مع هيكلك.",

    // ── Personas (extras) ───────────────────────────────────────────────
    "personas.ctaTitle": "أشرك فريقك بأكمله",
    "personas.ctaDesc": "ادعُ عددًا غير محدود من المدربين والموظفين في كل خطة، من اليوم الأول.",
    "personas.dayToDay": "يومًا بيوم",
    "personas.detailTitle": "أكاديموريكس لـ{name}",
    "personas.detailCtaTitle": "امنح فريقك نظامًا سيستخدمه فعلًا",
    "personas.detailCtaDesc": "أكاديموريكس سهل التعلّم وأسرع في الاستخدام اليومي.",

    // ── Customers (extras) ──────────────────────────────────────────────
    "customers.indexTitle": "أكاديميات تنمو مع أكاديموريكس",
    "customers.indexSubtitle":
      "من أندية السباحة إلى أكاديميات كرة القدم، تدير مؤسسات التدريب عملياتها على منصة واحدة.",
    "customers.storyTag": "القصة",
    "customers.allStories": "كل قصص العملاء",
    "customers.indexCtaTitle": "انضم إلى مئات الأكاديميات",
    "customers.indexCtaDesc":
      "ابدأ نسختك التجريبية المجانية واعرف لماذا تنتقل مؤسسات التدريب إلى أكاديموريكس.",
    "customers.detailCtaTitle": "اكتب قصة نجاحك",
    "customers.detailCtaDesc": "ابدأ مجانًا واحصل على النتائج ذاتها التي حققتها هذه الأكاديميات.",

    // ── FAQ page (extras) ───────────────────────────────────────────────
    "faqPage.stillHave": "لا تزال لديك أسئلة؟",
    "faqPage.stillHaveDesc": "فريقنا سعيد بمساعدتك على إيجاد الحل الأنسب لأكاديميتك.",

    // ── Pricing (extras) ────────────────────────────────────────────────
    "pricing.faqTitle": "أسئلة الأسعار، مُجاب عنها",
    "pricing.ctaTitle": "ابدأ مجانًا وارتقِ حين تستعد",
    "pricing.ctaDesc": "استكشف المنصة كاملةً لمدة 14 يومًا ببيانات أكاديميتك.",

    // ── Blog (extras) ───────────────────────────────────────────────────
    "blog.featured": "مميّز",
    "blog.readArticle": "اقرأ المقالة",
    "blog.backToBlog": "عودة إلى المدونة",
    "blog.indexCtaTitle": "طبّق هذه الأفكار",
    "blog.indexCtaDesc": "ابدأ نسخة تجريبية مجانية وأدر أكاديميتك بطريقة عصرية.",
    "blog.detailCtaTitle": "أدر أكاديميتك على أكاديموريكس",
    "blog.detailCtaDesc": "الجدولة والتواصل والفوترة في مكان واحد.",
    "blog.byLine": "بقلم {author} · {date} · {readTime}",
    "blog.meta": "{date} · {readTime}",
    "blog.featuredMeta": "{category} · {date} · {readTime}",

    // ── Resources (extras) ──────────────────────────────────────────────
    "resources.docs.eyebrow": "التوثيق",
    "resources.docs.indexTitle": "التوثيق والأدلة",
    "resources.docs.indexSubtitle":
      "كل ما تحتاجه لإعداد أكاديموريكس وتشغيله والاستفادة القصوى منه.",
    "resources.docs.read": "اقرأ",
    "resources.docs.backToDocs": "عودة إلى التوثيق",
    "resources.changelog.eyebrow": "سجل التغييرات",
    "resources.changelog.whatsNew": "الجديد في أكاديموريكس",
    "resources.changelog.whatsNewDesc": "كل إصدار وتحسين وإصلاح، في مكان واحد.",
    "resources.changelog.tag.new": "جديد",
    "resources.changelog.tag.improved": "تحسينات",
    "resources.changelog.tag.fixed": "إصلاحات",
    "resources.newsletter.eyebrow": "النشرة البريدية",
    "resources.newsletter.title": "نشرة مشغّلي الأكاديميات",
    "resources.newsletter.subtitle":
      "أدلة شهرية وتحديثات المنتج وأفكار النمو لمؤسسات التدريب. بدون رسائل مزعجة، وإلغاء الاشتراك متاح في أي وقت.",
    "resources.newsletter.cardTitle": "اشترك",
    "resources.newsletter.cardDesc": "انضم إلى أكثر من 8,000 مدير ومدرب يتلقون الإصدار الشهري.",
    "resources.tutorials.eyebrow": "الدروس",
    "resources.tutorials.indexTitle": "دروس خطوة بخطوة",
    "resources.tutorials.indexSubtitle":
      "جولات عملية تساعدك على إتقان أكاديموريكس، تدفقًا تلو الآخر.",
    "resources.tutorials.stepsHeading": "الخطوات",
    "resources.tutorials.backToAll": "كل الدروس",
    "resources.tutorials.resourcesCrumb": "الموارد",

    // ── Company / About / Careers / Press ───────────────────────────────
    "company.about.title": "نبني نظام تشغيل الأكاديميات",
    "company.about.description":
      "بدأت أكاديموريكس حين ملّ فريق من المدربين والمطوّرين إدارة برامج عالمية المستوى على جداول البيانات. اليوم نساعد مئات الأكاديميات على التركيز على ما تجيده: التدريب.",
    "company.about.stats.academies": "أكاديميات",
    "company.about.stats.countries": "دولة",
    "company.about.stats.sessions": "حصص سنويًا",
    "company.about.stats.team": "أعضاء الفريق",
    "company.values.eyebrow": "قيمنا",
    "company.values.title": "ما نؤمن به",
    "company.values.coachesFirst.title": "المدربون أولًا",
    "company.values.coachesFirst.description":
      "نبني لمن يديرون الحصص، لا لمن يشترون البرمجيات فقط.",
    "company.values.simple.title": "البساطة أساس",
    "company.values.simple.description": "قوي حين تحتاجه، سلس في بقية الوقت.",
    "company.values.trust.title": "اكسب الثقة",
    "company.values.trust.description": "نحمي بيانات الأكاديميات والأسر كأنها بياناتنا.",
    "company.values.ship.title": "أطلق وتعلّم",
    "company.values.ship.description": "نتحرك بسرعة ونصغي جيدًا ونحسّن كل إصدار.",
    "company.about.ctaTitle": "أتريد المشاركة في بنائه؟",
    "company.about.ctaDesc": "نوظّف في المنتج والهندسة ونجاح العملاء.",
    "company.about.seeRoles": "استعرض الوظائف المفتوحة",
    "company.about.contactUs": "تواصل معنا",
    "company.careers.eyebrow": "الوظائف",
    "company.careers.title": "شارك في بناء مستقبل إدارة الأكاديميات",
    "company.careers.subtitle":
      "انضم إلى فريق يعمل عن بُعد أولًا لمساعدة مؤسسات التدريب حول العالم على العمل بشكل أفضل.",
    "company.job.applyNow": "قدّم الآن",
    "company.press.eyebrow": "الصحافة",
    "company.press.title": "الصحافة والإعلام",
    "company.press.subtitle": "أخبار وإعلانات وموارد للصحفيين الذين يغطّون أكاديموريكس.",
    "company.press.mediaKit.title": "الحزمة الإعلامية",
    "company.press.mediaKit.desc": "الشعارات وأصول العلامة وحقائق الشركة.",
    "company.press.mediaKit.cta": "اطلب الأصول",
    "company.press.item1.title": "أكاديموريكس تجمع 18 مليون دولار لتوسيع إدارة الأكاديميات",
    "company.press.item1.source": "تك كرانش",
    "company.press.item1.date": "مارس 2025",
    "company.press.item2.title": "كيف تدير منصة واحدة أكثر من 400 أكاديمية رياضية",
    "company.press.item2.source": "سبورتس تك ويكلي",
    "company.press.item2.date": "فبراير 2025",
    "company.press.item3.title": "أكاديموريكس تطلق التقارير متعددة المواقع",
    "company.press.item3.source": "بيان صحفي",
    "company.press.item3.date": "يناير 2025",

    // ── Enterprise (extras) ─────────────────────────────────────────────
    "enterprise.hero.title": "إدارة الأكاديميات على مستوى الشبكة",
    "enterprise.hero.description":
      "لمشغّلي المواقع المتعددة والامتيازات الذين يحتاجون إلى الأمان والتحكم والتقارير عبر كل موقع.",
    "enterprise.stats.uptime.value": "99.9٪",
    "enterprise.stats.uptime.label": "اتفاقية مستوى تشغيل",
    "enterprise.stats.compliance.value": "SOC 2",
    "enterprise.stats.compliance.label": "متوافق مع Type II",
    "enterprise.stats.support.value": "24/7",
    "enterprise.stats.support.label": "دعم بأولوية",
    "enterprise.capabilities.eyebrow": "بمستوى المؤسسات",
    "enterprise.capabilities.title": "كل ما تحتاجه للتوحيد والتوسّع",
    "enterprise.capabilities.description":
      "أدر برامج متسقة عبر المواقع مع منح كل موقع الاستقلالية التي يحتاجها.",
    "enterprise.capabilities.sso.title": "SSO و SCIM",
    "enterprise.capabilities.sso.description":
      "تسجيل دخول موحّد SAML وتزويد مستخدمين آلي للفرق الكبيرة.",
    "enterprise.capabilities.permissions.title": "صلاحيات متقدمة",
    "enterprise.capabilities.permissions.description":
      "ضوابط أدوار دقيقة لكل موقع بحيث يرى كل شخص ما يخصّه فقط.",
    "enterprise.capabilities.reporting.title": "تقارير موحّدة",
    "enterprise.capabilities.reporting.description": "لوحات على مستوى الشبكة عبر كل موقع وبرنامج.",
    "enterprise.capabilities.onboarding.title": "تهيئة مخصّصة",
    "enterprise.capabilities.onboarding.description": "فريق مخصّص يرحّل بياناتك ويُهيئ مساحة عملك.",
    "enterprise.capabilities.security.title": "مراجعات أمنية",
    "enterprise.capabilities.security.description":
      "توافق مع SOC 2 Type II واتفاقيات معالجة البيانات ودعم استبيانات الأمان.",
    "enterprise.capabilities.success.title": "نجاح مخصّص",
    "enterprise.capabilities.success.description":
      "مدير نجاح مسمّى ودعم مدعوم باتفاقية مستوى خدمة بأولوية.",
    "enterprise.ctaTitle": "لنتحدث عن شبكتك",
    "enterprise.ctaDesc": "احصل على جولة مخصصة وخطة نشر لكل موقع.",

    // ── Contact sales (extras) ──────────────────────────────────────────
    "contactSales.hero.title": "تحدث إلى فريقنا",
    "contactSales.hero.description":
      "أخبرنا عن أكاديميتك وسنعرض لك أسرع مسار لتشغيلها على أكاديموريكس.",
    "contactSales.highlights.walkthrough.title": "جولة مخصّصة",
    "contactSales.highlights.walkthrough.description": "شاهد أكاديموريكس مُهيّأً لرياضتك وإعدادك.",
    "contactSales.highlights.migration.title": "خطة الترحيل",
    "contactSales.highlights.migration.description":
      "نُعيد تعيين تشكيلاتك وخططك وسجلك لانتقال سلس.",
    "contactSales.highlights.contact.title": "جهة اتصال مخصّصة",
    "contactSales.highlights.contact.description": "شخص حقيقي للإجابة عن الأسئلة وإطلاقك للعمل.",
    "contactSales.form.firstName": "الاسم الأول",
    "contactSales.form.firstNamePlaceholder": "إيلينا",
    "contactSales.form.lastName": "اسم العائلة",
    "contactSales.form.lastNamePlaceholder": "مارش",
    "contactSales.form.emailPlaceholder": "you@academy.com",
    "contactSales.form.academy": "اسم الأكاديمية",
    "contactSales.form.academyPlaceholder": "ريفرسايد أكواتيكس",
    "contactSales.form.primarySport": "الرياضة الأساسية",
    "contactSales.form.selectSport": "اختر رياضة",
    "contactSales.form.academySize": "حجم الأكاديمية",
    "contactSales.form.selectSize": "اختر الحجم",
    "contactSales.form.helpLabel": "كيف يمكننا مساعدتك؟",
    "contactSales.form.helpPlaceholder": "أخبرنا عن برامجك وما تبحث عنه...",
    "contactSales.form.sport.swimming": "السباحة",
    "contactSales.form.sport.gymnastics": "الجمباز",
    "contactSales.form.sport.soccer": "كرة القدم",
    "contactSales.form.sport.tennis": "التنس",
    "contactSales.form.sport.athletics": "ألعاب القوى",
    "contactSales.form.sport.martialArts": "الفنون القتالية",
    "contactSales.form.sport.multi": "متعدد الرياضات",
    "contactSales.form.sport.other": "أخرى",
    "contactSales.form.size.small": "1 - 50 لاعبًا",
    "contactSales.form.size.medium": "50 - 250 لاعبًا",
    "contactSales.form.size.large": "250 - 1,000 لاعب",
    "contactSales.form.size.enterprise": "أكثر من 1,000 لاعب",
    "contactSales.form.request": "اطلب عرضًا",

    // ── Auth (extras) ───────────────────────────────────────────────────
    "auth.create.headline": "أنشئ مساحة عملك",
    "auth.create.subheadline": "ابدأ تجربتك المجانية لمدة 14 يومًا. بدون بطاقة.",
    "auth.create.name": "الاسم الكامل",
    "auth.create.namePlaceholder": "إيلينا مارش",
    "auth.create.emailLabel": "بريد العمل",
    "auth.create.workspaceLabel": "اسم مساحة العمل",
    "auth.create.workspaceInputPlaceholder": "riverside",
    "auth.create.workspaceSuffix": ".academorix.app",
    "auth.create.password": "كلمة المرور",
    "auth.create.passwordPlaceholder": "8 أحرف على الأقل",
    "auth.create.showPassword": "عرض كلمة المرور",
    "auth.create.hidePassword": "إخفاء كلمة المرور",
    "auth.create.submitLabel": "أنشئ مساحة العمل",
    "auth.create.haveWorkspace": "لديك مساحة عمل بالفعل؟",
    "auth.create.signInLink": "تسجيل الدخول",
    "auth.find.headline": "ابحث عن مساحات عملك",
    "auth.find.subheadline": "أدخل بريدك وسنرسل رابطًا لكل مساحات العمل التي تنتمي إليها.",
    "auth.find.emailLabel": "بريد العمل",
    "auth.find.continue": "متابعة",
    "auth.find.noWorkspace": "أليست لديك مساحة عمل بعد؟",
    "auth.find.createOneLink": "أنشئ واحدة",

    // ── Legal (extras) ──────────────────────────────────────────────────
    "legal.updatedShort": "آخر تحديث {date}",
    "legal.indexTitle": "القانوني والامتثال",
    "legal.indexSubtitle": "سياساتنا وشروطنا والتزاماتنا للحفاظ على أمان بيانات أكاديميتك.",

    // ── Mega menu ───────────────────────────────────────────────────────
    "megaMenu.core.title": "الوحدات الأساسية",
    "megaMenu.core.scheduling.desc": "تشكيلات وحصص لكل مرفق",
    "megaMenu.core.attendance.desc": "تتبّع كل تسجيل حضور لحظيًا",
    "megaMenu.core.billing.desc": "رسوم آلية، كما ينبغي",
    "megaMenu.core.communication.desc": "أبقِ كل عائلة على اطّلاع",
    "megaMenu.core.registration.desc": "تسجيل ذاتي وتعهدات إلكترونية",
    "megaMenu.core.reporting.desc": "قرارات مدعومة ببيانات حقيقية",
    "megaMenu.intelligence.title": "الذكاء",
    "megaMenu.intelligence.aiEngine": "محرك الذكاء الاصطناعي",
    "megaMenu.intelligence.aiEngineDesc": "جدولة ورؤى آلية",
    "megaMenu.intelligence.analytics": "التحليلات",
    "megaMenu.intelligence.analyticsDesc": "لوحات مباشرة للإيرادات والنمو",
    "megaMenu.intelligence.automations": "الأتمتة",
    "megaMenu.intelligence.automationsDesc": "أطلق تدفقات آلية عبر أكاديميتك",
    "megaMenu.products.banner.title": "تعرّف على محرك الذكاء الاصطناعي",
    "megaMenu.products.banner.description": "جدولة ورؤى وتواصل بشكل آلي. اعرف المزيد ←",
    "megaMenu.products.banner.cta": "استكشف محرك الذكاء",
    "megaMenu.sports.title": "الرياضات التي ندعمها",
    "megaMenu.sports.banner.title": "رياضتك غير مدرجة؟",
    "megaMenu.sports.banner.description": "أي تخصص يعمل على محرك السمات لدينا. تواصل معنا.",
    "megaMenu.sports.banner.cta": "تحدث إلى المبيعات",

    // ── AI Engine ───────────────────────────────────────────────────────
    "aiEngine.eyebrow": "محرك الذكاء الاصطناعي",
    "aiEngine.title": "الطبقة المستقلة لأكاديميتك",
    "aiEngine.subtitle":
      "جدولة تنبؤية، ورؤى ذات سياق، وأتمتة دون تدخل. يحوّل محرك الذكاء الاصطناعي أكاديموريكس إلى نظام يستبق خطوتك التالية.",
    "aiEngine.features.eyebrow": "القدرات",
    "aiEngine.features.title": "ثلاث طرق يظهر بها في يومك",
    "aiEngine.features.predictive.title": "الجدولة التنبؤية",
    "aiEngine.features.predictive.description":
      "يقترح المحرك أوقات الحصص وتعيين المدربين ودورات المرافق بناءً على الحضور والطلب التاريخيين.",
    "aiEngine.features.insight.title": "المساعد التحليلي",
    "aiEngine.features.insight.description":
      "اسأل عن أكاديميتك بلغة طبيعية. احصل على إجابات مدعومة ببيانات الجدولة والفوترة والحضور الحيّة.",
    "aiEngine.features.automation.title": "استوديو الأتمتة",
    "aiEngine.features.automation.description":
      "أنشئ محفزات ترد على حالات الغياب أو الفواتير المتأخرة أو نشاط قوائم الانتظار، دون كتابة سطر واحد من الشيفرة.",
    "aiEngine.how.eyebrow": "كيف يعمل",
    "aiEngine.how.title": "محرك واحد، جزءان متحركان",
    "aiEngine.how.step1.title": "يفهم أكاديميتك",
    "aiEngine.how.step1.description":
      "يقرأ المحرك جدولك المباشر وتشكيلاتك وفوترتك ليبني نموذجًا فوريًا لكيفية إدارة مؤسستك.",
    "aiEngine.how.step2.title": "يقترح الخطوة التالية",
    "aiEngine.how.step2.description":
      "تظهر التوقعات والاقتراحات ضمن الشاشات ذاتها التي تستخدمها، دون لوحات منفصلة تتعلمها.",
    "aiEngine.testimonial.quote":
      "رصد محرك الذكاء الاصطناعي ثلاثة مدربين على وشك الحجز الزائد قبل نشر الجدول. غيّر ذلك طريقة تخطيطنا كل أسبوع.",
    "aiEngine.testimonial.author": "إيلينا مارش",
    "aiEngine.testimonial.role": "المديرة، ريفرسايد أكواتيكس",
    "aiEngine.cta.title": "شاهد محرك الذكاء الاصطناعي على أكاديميتك",
    "aiEngine.cta.description": "ابدأ نسخة تجريبية مجانية وفعّل محرك الذكاء الاصطناعي بنقرة واحدة.",

    // ── Not found ───────────────────────────────────────────────────────
    "notFound.title": "الصفحة غير موجودة",
    "notFound.subtitle": "الصفحة التي تبحث عنها قد نُقلت أو أُعيدت تسميتها أو لم توجد أصلًا.",
    "notFound.cta": "العودة إلى الصفحة الرئيسية",
  },
};
