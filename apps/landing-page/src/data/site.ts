import type { Locale } from "../i18n/dictionaries";

/**
 * Bilingual leaf. Every user-visible string in the site catalogue lives as
 * `{en, ar}` so the same records can render in either locale. Non-string
 * fields (slugs, hrefs, prices, dates, icons) stay plain.
 */
export type Localized = { en: string; ar: string };

/** Collapse a `{ en, ar }` leaf to the current locale, falling back to English. */
export function pickL(value: Localized, locale: Locale): string {
  return value[locale] ?? value.en;
}

/** Vector map of {@link pickL} over an array of `Localized`. */
export function pickLAll(values: readonly Localized[], locale: Locale): string[] {
  return values.map((v) => pickL(v, locale));
}

/** Reusable feature card used inside product records. */
export type FeatureBlock = {
  icon: string;
  title: Localized;
  description: Localized;
};

export type Product = {
  slug: string;
  name: Localized;
  icon: string;
  tagline: Localized;
  summary: Localized;
  highlights: Localized[];
  features: FeatureBlock[];
};

export const products: Product[] = [
  {
    slug: "scheduling",
    name: { en: "Scheduling", ar: "الجدولة" },
    icon: "calendar",
    tagline: { en: "Rosters and sessions for every venue", ar: "تشكيلات وحصص لكل مرفق" },
    summary: {
      en: "Plan sessions across pools, mats, courts, and pitches in one calendar. Coaches, venues, and capacity stay in sync automatically.",
      ar: "خطّط الحصص عبر المسابح والحلبات والملاعب في تقويم واحد. يبقى المدربون والمرافق والطاقة الاستيعابية متزامنين تلقائيًا.",
    },
    highlights: [
      { en: "Drag-and-drop planner", ar: "مخطّط بالسحب والإفلات" },
      { en: "Conflict detection", ar: "كشف التعارضات" },
      { en: "Waitlists & auto-fill", ar: "قوائم انتظار وتعبئة تلقائية" },
    ],
    features: [
      {
        icon: "calendar",
        title: { en: "Unified calendar", ar: "تقويم موحّد" },
        description: {
          en: "See every discipline, venue, and coach on a single timeline with instant filtering.",
          ar: "شاهد كل تخصص ومرفق ومدرّب على خط زمني واحد مع تصفية فورية.",
        },
      },
      {
        icon: "shield-check",
        title: { en: "Conflict alerts", ar: "تنبيهات التعارضات" },
        description: {
          en: "Double-booked venues and coaches are flagged before the schedule goes live.",
          ar: "تُميَّز المرافق والمدربون المحجوزون مزدوجًا قبل نشر الجدول.",
        },
      },
      {
        icon: "persons",
        title: { en: "Capacity & waitlists", ar: "السعة وقوائم الانتظار" },
        description: {
          en: "Set caps per session, auto-fill from the waitlist, and notify families instantly.",
          ar: "حدّد سعة كل حصة، وعبِّئ تلقائيًا من قائمة الانتظار، وأبلغ الأسر فورًا.",
        },
      },
    ],
  },
  {
    slug: "attendance",
    name: { en: "Attendance", ar: "الحضور" },
    icon: "circle-check",
    tagline: { en: "Track every check-in in real time", ar: "تتبّع كل تسجيل حضور لحظيًا" },
    summary: {
      en: "Take attendance from any device, flag no-shows, and give parents a live view of their child's participation.",
      ar: "سجّل الحضور من أي جهاز، ونبّه على الغياب، وامنح أولياء الأمور رؤية مباشرة لمشاركة أبنائهم.",
    },
    highlights: [
      { en: "One-tap check-in", ar: "تسجيل حضور بلمسة واحدة" },
      { en: "No-show alerts", ar: "تنبيهات الغياب" },
      { en: "Attendance analytics", ar: "تحليلات الحضور" },
    ],
    features: [
      {
        icon: "circle-check",
        title: { en: "One-tap roll call", ar: "نداء الأسماء بلمسة واحدة" },
        description: {
          en: "Coaches mark attendance in seconds from a phone or tablet, even offline.",
          ar: "يسجّل المدربون الحضور خلال ثوانٍ من الهاتف أو الجهاز اللوحي، حتى دون اتصال.",
        },
      },
      {
        icon: "bell",
        title: { en: "Absence alerts", ar: "تنبيهات الغياب" },
        description: {
          en: "Parents and admins are notified automatically when an athlete misses a session.",
          ar: "يُبلَّغ أولياء الأمور والإداريون تلقائيًا حين يفوّت اللاعب حصة.",
        },
      },
      {
        icon: "chart-column",
        title: { en: "Participation trends", ar: "اتجاهات المشاركة" },
        description: {
          en: "Spot drop-off early with per-athlete and per-squad attendance reporting.",
          ar: "اكتشف الانسحاب مبكرًا عبر تقارير حضور لكل لاعب ولكل فريق.",
        },
      },
    ],
  },
  {
    slug: "billing",
    name: { en: "Billing & payments", ar: "الفوترة والمدفوعات" },
    icon: "receipt",
    tagline: { en: "Automated tuition, done right", ar: "رسوم آلية، كما ينبغي" },
    summary: {
      en: "Charge tuition on a schedule, retry failed cards, and reconcile every payment without touching a spreadsheet.",
      ar: "احصّل الرسوم وفق جدول محدد، وأعد محاولة البطاقات المرفوضة، وسوِّ كل دفعة دون لمس أي جدول بيانات.",
    },
    highlights: [
      { en: "Recurring plans", ar: "خطط متكررة" },
      { en: "Smart retries", ar: "إعادة محاولات ذكية" },
      { en: "Payout reports", ar: "تقارير الدفعات" },
    ],
    features: [
      {
        icon: "credit-card",
        title: { en: "Recurring plans", ar: "خطط متكررة" },
        description: {
          en: "Monthly, termly, and pro-rated plans that adapt to each family's enrollment.",
          ar: "خطط شهرية وفصلية وبحساب تناسبي تتكيف مع تسجيل كل عائلة.",
        },
      },
      {
        icon: "clock-arrow-rotate-left",
        title: { en: "Smart retries", ar: "إعادة محاولات ذكية" },
        description: {
          en: "Failed cards retry automatically with dunning emails, recovering lost revenue.",
          ar: "تُعاد محاولة البطاقات المرفوضة تلقائيًا مع رسائل تذكير، لاستعادة الإيرادات المفقودة.",
        },
      },
      {
        icon: "circle-dollar",
        title: { en: "Reconciliation", ar: "التسوية" },
        description: {
          en: "Every transaction reconciles into payout and tax-ready reports you can trust.",
          ar: "تُسوَّى كل معاملة ضمن تقارير جاهزة للدفعات والضرائب يمكنك الوثوق بها.",
        },
      },
    ],
  },
  {
    slug: "communication",
    name: { en: "Communication", ar: "التواصل" },
    icon: "comments",
    tagline: { en: "Keep every family in the loop", ar: "أبقِ كل عائلة على اطّلاع" },
    summary: {
      en: "Broadcast updates, cancellations, and progress notes by email and push in seconds, with two-way replies.",
      ar: "أرسل التحديثات وإشعارات الإلغاء وملاحظات التقدم بالبريد والإشعارات الفورية في ثوانٍ، مع ردود ثنائية الاتجاه.",
    },
    highlights: [
      { en: "Broadcast & per-squad", ar: "بثّ جماعي وحسب الفريق" },
      { en: "Two-way inbox", ar: "صندوق ردود ثنائي الاتجاه" },
      { en: "Progress notes", ar: "ملاحظات التقدم" },
    ],
    features: [
      {
        icon: "megaphone",
        title: { en: "Targeted broadcasts", ar: "بثّ مستهدف" },
        description: {
          en: "Message the whole academy, a single squad, or one family with delivery tracking.",
          ar: "راسل الأكاديمية كاملة أو فريقًا واحدًا أو عائلة واحدة مع تتبع التسليم.",
        },
      },
      {
        icon: "comments",
        title: { en: "Two-way inbox", ar: "صندوق ردود ثنائي الاتجاه" },
        description: {
          en: "Parents reply in a shared inbox so nothing gets lost across channels.",
          ar: "يرد أولياء الأمور في صندوق وارد مشترك حتى لا يضيع شيء بين القنوات.",
        },
      },
      {
        icon: "star",
        title: { en: "Progress updates", ar: "تحديثات التقدم" },
        description: {
          en: "Send skill milestones and coach feedback straight to the parent portal.",
          ar: "أرسل مراحل المهارات وملاحظات المدربين مباشرة إلى بوابة أولياء الأمور.",
        },
      },
    ],
  },
  {
    slug: "registration",
    name: { en: "Registration", ar: "التسجيل" },
    icon: "list-ul",
    tagline: { en: "Self-serve sign-ups and waivers", ar: "تسجيل ذاتي وتعهدات إلكترونية" },
    summary: {
      en: "Let families register, sign waivers, and pay online. Roster spots update the moment a place is confirmed.",
      ar: "دع الأسر تسجّل وتوقّع التعهدات وتدفع عبر الإنترنت. تتحدّث أماكن التشكيلة لحظة تأكيد المكان.",
    },
    highlights: [
      { en: "Online enrollment", ar: "تسجيل عبر الإنترنت" },
      { en: "Digital waivers", ar: "تعهدات رقمية" },
      { en: "Instant roster sync", ar: "مزامنة تشكيلة فورية" },
    ],
    features: [
      {
        icon: "pencil",
        title: { en: "Custom forms", ar: "نماذج مخصّصة" },
        description: {
          en: "Build enrollment forms with the fields, waivers, and consents each program needs.",
          ar: "أنشئ نماذج تسجيل بالحقول والتعهدات والموافقات التي يحتاجها كل برنامج.",
        },
      },
      {
        icon: "shield-check",
        title: { en: "Digital waivers", ar: "تعهدات رقمية" },
        description: {
          en: "Collect legally binding signatures and store them against each athlete's record.",
          ar: "اجمع توقيعات ملزمة قانونيًا واحفظها ضمن سجل كل لاعب.",
        },
      },
      {
        icon: "layers",
        title: { en: "Roster sync", ar: "مزامنة التشكيلة" },
        description: {
          en: "Confirmed registrations flow straight into scheduling and billing.",
          ar: "تنساب التسجيلات المؤكدة مباشرة إلى الجدولة والفوترة.",
        },
      },
    ],
  },
  {
    slug: "reporting",
    name: { en: "Reporting", ar: "التقارير" },
    icon: "chart-column",
    tagline: { en: "Decisions backed by real data", ar: "قرارات مدعومة ببيانات حقيقية" },
    summary: {
      en: "Dashboards for enrollment, revenue, attendance, and coach utilization, exportable and always current.",
      ar: "لوحات معلومات للتسجيل والإيرادات والحضور واستخدام المدربين، قابلة للتصدير ومحدّثة دائمًا.",
    },
    highlights: [
      { en: "Live dashboards", ar: "لوحات مباشرة" },
      { en: "Revenue insights", ar: "رؤى الإيرادات" },
      { en: "Exportable reports", ar: "تقارير قابلة للتصدير" },
    ],
    features: [
      {
        icon: "chart-line",
        title: { en: "Growth dashboards", ar: "لوحات النمو" },
        description: {
          en: "Track enrollment and revenue trends across every program in one view.",
          ar: "تتبّع اتجاهات التسجيل والإيرادات عبر كل برنامج في عرض واحد.",
        },
      },
      {
        icon: "chart-column",
        title: { en: "Utilization", ar: "الاستخدام" },
        description: {
          en: "See how venues and coaches are used so you can right-size your timetable.",
          ar: "شاهد كيف تُستخدم المرافق والمدربون لتضبط جدولك بالحجم المناسب.",
        },
      },
      {
        icon: "file-text",
        title: { en: "Exports", ar: "التصدير" },
        description: {
          en: "Export any report to CSV or share a live link with your board.",
          ar: "صدّر أي تقرير إلى CSV أو شارك رابطًا مباشرًا مع مجلس إدارتك.",
        },
      },
    ],
  },
];

export type Sport = {
  slug: string;
  name: Localized;
  icon: string;
  blurb: Localized;
  venue: Localized;
  sessionTypes: Localized[];
  metrics: { label: Localized; value: string }[];
};

export const sports: Sport[] = [
  {
    slug: "swimming",
    name: { en: "Swimming", ar: "السباحة" },
    icon: "circle-check",
    blurb: {
      en: "Lane scheduling, stroke progressions, and squad billing built for aquatic clubs.",
      ar: "جدولة المسارات، وتدرّج الحركات، وفوترة الفرق، مصممة لأندية السباحة.",
    },
    venue: { en: "Aquatic center · lanes & pools", ar: "المركز المائي · مسارات ومسابح" },
    sessionTypes: [
      { en: "Squad training", ar: "تدريب الفريق" },
      { en: "Learn-to-swim", ar: "تعلّم السباحة" },
      { en: "Masters", ar: "الفئة الكبرى" },
      { en: "Stroke clinic", ar: "ورشة الحركات" },
    ],
    metrics: [
      { label: { en: "Active swimmers", ar: "سبّاحون نشطون" }, value: "312" },
      { label: { en: "Weekly sessions", ar: "حصص أسبوعية" }, value: "48" },
      { label: { en: "Lane utilization", ar: "استخدام المسارات" }, value: "86%" },
    ],
  },
  {
    slug: "gymnastics",
    name: { en: "Gymnastics", ar: "الجمباز" },
    icon: "medal",
    blurb: {
      en: "Apparatus rotations, skill levels, and term plans tailored to gymnastics academies.",
      ar: "دورات الأجهزة، والمستويات، وخطط الفصول، مصممة لأكاديميات الجمباز.",
    },
    venue: { en: "Gym hall · beam, vault, floor", ar: "الصالة · عارضة، حصان قفز، أرضية" },
    sessionTypes: [
      { en: "Recreational", ar: "ترفيهية" },
      { en: "Competitive squad", ar: "فريق تنافسي" },
      { en: "Tumbling", ar: "الشقلبة" },
      { en: "Parent & tot", ar: "الأمهات والأطفال" },
    ],
    metrics: [
      { label: { en: "Active gymnasts", ar: "لاعبو جمباز نشطون" }, value: "268" },
      { label: { en: "Apparatus rotations", ar: "دورات الأجهزة" }, value: "36" },
      { label: { en: "Coach ratio", ar: "نسبة المدرّب" }, value: "1:6" },
    ],
  },
  {
    slug: "soccer",
    name: { en: "Soccer", ar: "كرة القدم" },
    icon: "flag",
    blurb: {
      en: "Team management, match prep, and league scheduling for soccer clubs of any size.",
      ar: "إدارة الفرق وتحضير المباريات وجدولة الدوري لأندية كرة القدم من أي حجم.",
    },
    venue: { en: "Training ground · pitches", ar: "أرض التدريب · ملاعب" },
    sessionTypes: [
      { en: "Skills academy", ar: "أكاديمية المهارات" },
      { en: "Match prep", ar: "تحضير المباريات" },
      { en: "U12 league", ar: "دوري تحت 12 عامًا" },
      { en: "Goalkeeping", ar: "حراسة المرمى" },
    ],
    metrics: [
      { label: { en: "Registered players", ar: "لاعبون مسجّلون" }, value: "540" },
      { label: { en: "Teams managed", ar: "فرق مُدارة" }, value: "24" },
      { label: { en: "Attendance rate", ar: "معدل الحضور" }, value: "94%" },
    ],
  },
  {
    slug: "tennis",
    name: { en: "Tennis", ar: "التنس" },
    icon: "circle-check",
    blurb: {
      en: "Court booking, coaching ladders, and private-lesson billing for tennis programs.",
      ar: "حجز الملاعب، وسلالم التدريب، وفوترة الدروس الخاصة لبرامج التنس.",
    },
    venue: { en: "Courts · indoor & outdoor", ar: "الملاعب · داخلية وخارجية" },
    sessionTypes: [
      { en: "Group coaching", ar: "تدريب جماعي" },
      { en: "Private lessons", ar: "دروس خاصة" },
      { en: "Cardio tennis", ar: "تنس اللياقة" },
      { en: "Match play", ar: "مباريات" },
    ],
    metrics: [
      { label: { en: "Members", ar: "أعضاء" }, value: "410" },
      { label: { en: "Courts managed", ar: "ملاعب مُدارة" }, value: "12" },
      { label: { en: "Private lessons/wk", ar: "دروس خاصة أسبوعيًا" }, value: "180" },
    ],
  },
  {
    slug: "athletics",
    name: { en: "Athletics", ar: "ألعاب القوى" },
    icon: "rocket",
    blurb: {
      en: "Track sessions, event squads, and meet logistics for athletics clubs.",
      ar: "حصص المضمار وفرق الفعاليات ولوجستيات البطولات لأندية ألعاب القوى.",
    },
    venue: { en: "Track & field", ar: "المضمار والميدان" },
    sessionTypes: [
      { en: "Sprints", ar: "العَدو" },
      { en: "Distance", ar: "المسافات" },
      { en: "Field events", ar: "مسابقات الميدان" },
      { en: "Strength & conditioning", ar: "القوة والتحضير البدني" },
    ],
    metrics: [
      { label: { en: "Athletes", ar: "رياضيون" }, value: "220" },
      { label: { en: "Event squads", ar: "فرق الفعاليات" }, value: "9" },
      { label: { en: "Meets/season", ar: "بطولات/موسم" }, value: "18" },
    ],
  },
  {
    slug: "martial-arts",
    name: { en: "Martial arts", ar: "الفنون القتالية" },
    icon: "shield-check",
    blurb: {
      en: "Belt progressions, grading events, and family memberships for dojos and academies.",
      ar: "تدرّج الأحزمة واختبارات الترقية والعضويات العائلية للدوجو والأكاديميات.",
    },
    venue: { en: "Dojo · mats", ar: "الدوجو · بُسط" },
    sessionTypes: [
      { en: "Little dragons", ar: "التنانين الصغيرة" },
      { en: "Adult class", ar: "حصص البالغين" },
      { en: "Sparring", ar: "المواجهات" },
      { en: "Grading prep", ar: "تحضير الترقية" },
    ],
    metrics: [
      { label: { en: "Students", ar: "طلاب" }, value: "295" },
      { label: { en: "Belt levels", ar: "مستويات الأحزمة" }, value: "10" },
      { label: { en: "Retention", ar: "معدل الاحتفاظ" }, value: "91%" },
    ],
  },
];

export type Solution = {
  slug: string;
  name: Localized;
  icon: string;
  tagline: Localized;
  summary: Localized;
  outcomes: Localized[];
};

export const solutions: Solution[] = [
  {
    slug: "single-academy",
    name: { en: "Single academy", ar: "أكاديمية فردية" },
    icon: "house",
    tagline: { en: "Everything one location needs", ar: "كل ما يحتاجه موقع واحد" },
    summary: {
      en: "Run scheduling, communication, and billing for a single academy without the busywork or the spreadsheets.",
      ar: "أدر الجدولة والتواصل والفوترة لأكاديمية واحدة دون العمل الروتيني أو جداول البيانات.",
    },
    outcomes: [
      { en: "Set up in under a week", ar: "الإعداد في أقل من أسبوع" },
      { en: "One inbox for every family", ar: "صندوق وارد واحد لكل عائلة" },
      { en: "Predictable monthly revenue", ar: "إيراد شهري يمكن التنبؤ به" },
    ],
  },
  {
    slug: "multi-site",
    name: { en: "Multi-site operators", ar: "المشغّلون متعددو المواقع" },
    icon: "geo-pin",
    tagline: { en: "Consistency across every venue", ar: "اتساق عبر كل مرفق" },
    summary: {
      en: "Standardize programs, pricing, and reporting across locations while giving each site the autonomy it needs.",
      ar: "وحّد البرامج والأسعار والتقارير عبر المواقع مع منح كل موقع الاستقلالية التي يحتاجها.",
    },
    outcomes: [
      { en: "Central program templates", ar: "قوالب برامج مركزية" },
      { en: "Per-site permissions", ar: "صلاحيات لكل موقع" },
      { en: "Roll-up reporting", ar: "تقارير موحّدة" },
    ],
  },
  {
    slug: "franchises",
    name: { en: "Franchises", ar: "الامتيازات" },
    icon: "layers",
    tagline: { en: "Scale the brand, not the overhead", ar: "وسّع العلامة دون توسيع التكاليف" },
    summary: {
      en: "Give every franchisee a turnkey operating system with brand-consistent workflows and network-wide analytics.",
      ar: "امنح كل حامل امتياز نظام تشغيل جاهزًا بتدفقات عمل موحّدة وتحليلات على مستوى الشبكة.",
    },
    outcomes: [
      { en: "Franchise-wide standards", ar: "معايير موحّدة عبر الامتياز" },
      { en: "Royalty & revenue visibility", ar: "شفافية الإتاوات والإيرادات" },
      { en: "Fast onboarding", ar: "تهيئة سريعة" },
    ],
  },
  {
    slug: "clubs",
    name: { en: "Clubs & associations", ar: "الأندية والاتحادات" },
    icon: "persons",
    tagline: { en: "Member management made simple", ar: "إدارة الأعضاء بأبسط شكل" },
    summary: {
      en: "Manage memberships, events, and volunteer coaches for community clubs and governing associations.",
      ar: "أدر العضويات والفعاليات والمدربين المتطوعين للأندية المجتمعية والاتحادات الحاكمة.",
    },
    outcomes: [
      { en: "Membership renewals", ar: "تجديد العضويات" },
      { en: "Event & meet logistics", ar: "لوجستيات الفعاليات والبطولات" },
      { en: "Volunteer coordination", ar: "تنسيق المتطوعين" },
    ],
  },
];

export type Persona = {
  slug: string;
  name: Localized;
  icon: string;
  tagline: Localized;
  summary: Localized;
  jobs: Localized[];
};

export const personas: Persona[] = [
  {
    slug: "directors",
    name: { en: "Academy directors", ar: "مديرو الأكاديميات" },
    icon: "briefcase",
    tagline: { en: "The full picture, in real time", ar: "الصورة الكاملة، لحظة بلحظة" },
    summary: {
      en: "Understand enrollment, revenue, and utilization across every program so you can grow with confidence.",
      ar: "افهم التسجيل والإيرادات والاستخدام عبر كل برنامج لتنمو بثقة.",
    },
    jobs: [
      { en: "Track revenue and growth", ar: "تتبّع الإيرادات والنمو" },
      { en: "Standardize programs", ar: "توحيد البرامج" },
      { en: "Report to the board", ar: "الرفع إلى مجلس الإدارة" },
    ],
  },
  {
    slug: "coaches",
    name: { en: "Coaches", ar: "المدربون" },
    icon: "person",
    tagline: { en: "Less admin, more coaching", ar: "إدارة أقل، تدريب أكثر" },
    summary: {
      en: "Check schedules, take attendance, and message families from your phone, before and after every session.",
      ar: "راجع الجداول، وسجّل الحضور، وراسل الأسر من هاتفك، قبل كل حصة وبعدها.",
    },
    jobs: [
      { en: "See today's sessions", ar: "اطّلع على حصص اليوم" },
      { en: "Take attendance fast", ar: "سجّل الحضور بسرعة" },
      { en: "Log athlete progress", ar: "دوّن تقدم اللاعبين" },
    ],
  },
  {
    slug: "administrators",
    name: { en: "Administrators", ar: "الإداريون" },
    icon: "gear",
    tagline: { en: "Run operations on autopilot", ar: "أدر العمليات على الطيار الآلي" },
    summary: {
      en: "Automate registrations, billing, and communications so the front desk can focus on families, not forms.",
      ar: "أتمِت التسجيلات والفوترة والتواصل حتى يركّز مكتب الاستقبال على الأسر لا على النماذج.",
    },
    jobs: [
      { en: "Automate billing", ar: "أتمتة الفوترة" },
      { en: "Manage registrations", ar: "إدارة التسجيلات" },
      { en: "Answer families quickly", ar: "الردّ على الأسر بسرعة" },
    ],
  },
  {
    slug: "parents",
    name: { en: "Parents", ar: "أولياء الأمور" },
    icon: "heart",
    tagline: { en: "One place for the whole family", ar: "مكان واحد للعائلة بأكملها" },
    summary: {
      en: "Register children, view schedules, message coaches, and pay tuition from a single self-serve portal.",
      ar: "سجّل أبناءك، وراجع الجداول، وراسل المدربين، وادفع الرسوم من بوابة ذاتية الخدمة واحدة.",
    },
    jobs: [
      { en: "Register and pay online", ar: "التسجيل والدفع عبر الإنترنت" },
      { en: "See schedules & progress", ar: "متابعة الجداول والتقدم" },
      { en: "Message coaches", ar: "مراسلة المدربين" },
    ],
  },
];

export type Customer = {
  slug: string;
  name: Localized;
  initials: string;
  sport: Localized;
  location: Localized;
  quote: Localized;
  author: Localized;
  role: Localized;
  metrics: { label: Localized; value: string }[];
  story: Localized[];
};

export const customers: Customer[] = [
  {
    slug: "riverside-aquatics",
    name: { en: "Riverside Aquatics", ar: "ريفرسايد أكواتيكس" },
    initials: "RA",
    sport: { en: "Swimming", ar: "السباحة" },
    location: { en: "Portland, OR", ar: "بورتلاند، أوريغون" },
    quote: {
      en: "We coach four sports across three sites. Academorix replaced five tools and a wall of spreadsheets.",
      ar: "نُدرّب أربع رياضات في ثلاثة مواقع. استبدل أكاديموريكس خمس أدوات وحائطًا من جداول البيانات.",
    },
    author: { en: "Elena Marsh", ar: "إيلينا مارش" },
    role: { en: "Director, Riverside Aquatics", ar: "المديرة، ريفرسايد أكواتيكس" },
    metrics: [
      {
        label: { en: "Admin hours saved / week", ar: "ساعات إدارية موفّرة أسبوعيًا" },
        value: "22",
      },
      { label: { en: "On-time payments", ar: "المدفوعات في وقتها" }, value: "98%" },
      { label: { en: "Swimmers managed", ar: "سبّاحون مُدارون" }, value: "1,200" },
    ],
    story: [
      {
        en: "Riverside Aquatics was juggling a booking tool, a payments app, three spreadsheets, and a group chat to run swim squads across three pools.",
        ar: "كانت ريفرسايد أكواتيكس تتنقل بين أداة حجز وتطبيق مدفوعات وثلاث جداول بيانات ومحادثة جماعية لإدارة فرق السباحة عبر ثلاثة مسابح.",
      },
      {
        en: "After moving to Academorix, registrations, rosters, and billing finally lived in one place, and the front desk reclaimed the better part of a full-time role.",
        ar: "بعد الانتقال إلى أكاديموريكس، أصبح التسجيل والتشكيلات والفوترة في مكان واحد أخيرًا، واستعاد مكتب الاستقبال ما يعادل معظم وظيفة بدوام كامل.",
      },
      {
        en: "Automated tuition and smart retries pushed on-time payments to 98%, giving the club predictable revenue for the first time.",
        ar: "رفعت الرسوم الآلية وإعادة المحاولات الذكية نسبة المدفوعات في وقتها إلى 98٪، ومنحت النادي إيرادًا يمكن التنبؤ به لأول مرة.",
      },
    ],
  },
  {
    slug: "apex-gymnastics",
    name: { en: "Apex Gymnastics", ar: "أبكس للجمباز" },
    initials: "AG",
    sport: { en: "Gymnastics", ar: "الجمباز" },
    location: { en: "Austin, TX", ar: "أوستن، تكساس" },
    quote: {
      en: "Apparatus rotations and term billing used to take a weekend. Now it's ten minutes.",
      ar: "كانت دورات الأجهزة وفوترة الفصل تستغرق عطلة أسبوع كاملة. الآن عشر دقائق فقط.",
    },
    author: { en: "Priya Nair", ar: "بريا ناير" },
    role: { en: "Head Coach, Apex Gymnastics", ar: "المدرّبة الرئيسية، أبكس للجمباز" },
    metrics: [
      { label: { en: "Setup time saved", ar: "وقت الإعداد الموفّر" }, value: "90%" },
      { label: { en: "Active gymnasts", ar: "لاعبو جمباز نشطون" }, value: "680" },
      { label: { en: "Parent satisfaction", ar: "رضا أولياء الأمور" }, value: "4.8/5" },
    ],
    story: [
      {
        en: "Apex runs recreational and competitive squads across two gym halls with complex apparatus rotations.",
        ar: "تدير أبكس فرقًا ترفيهية وتنافسية في صالتَي جمباز مع دورات أجهزة معقّدة.",
      },
      {
        en: "Academorix templates let coaches build a full term of sessions in minutes, and parents self-serve their enrollment and payments.",
        ar: "تتيح قوالب أكاديموريكس للمدربين بناء فصل كامل من الحصص في دقائق، ويُنجز أولياء الأمور تسجيلهم ودفعاتهم ذاتيًا.",
      },
      {
        en: "The team now spends its energy on athletes instead of timetables and invoices.",
        ar: "يصرف الفريق طاقته الآن على اللاعبين بدلًا من الجداول والفواتير.",
      },
    ],
  },
  {
    slug: "northgate-fc",
    name: { en: "Northgate FC", ar: "نورث غيت إف سي" },
    initials: "NF",
    sport: { en: "Soccer", ar: "كرة القدم" },
    location: { en: "Manchester, UK", ar: "مانشستر، المملكة المتحدة" },
    quote: {
      en: "Managing 24 teams and 540 players from one system changed how we operate.",
      ar: "إدارة 24 فريقًا و540 لاعبًا من نظام واحد غيّرت طريقة عملنا.",
    },
    author: { en: "Tom Bailey", ar: "توم بيلي" },
    role: { en: "Academy Manager, Northgate FC", ar: "مدير الأكاديمية، نورث غيت إف سي" },
    metrics: [
      { label: { en: "Teams managed", ar: "فرق مُدارة" }, value: "24" },
      { label: { en: "Players", ar: "لاعبون" }, value: "540" },
      { label: { en: "Attendance rate", ar: "معدل الحضور" }, value: "94%" },
    ],
    story: [
      {
        en: "Northgate FC needed to coordinate 24 squads, dozens of volunteer coaches, and a packed fixture list.",
        ar: "احتاجت نورث غيت إف سي إلى تنسيق 24 فريقًا وعشرات المدربين المتطوعين وقائمة مباريات مزدحمة.",
      },
      {
        en: "With Academorix, coaches take attendance pitch-side and parents get instant updates on cancellations and match details.",
        ar: "مع أكاديموريكس، يسجّل المدربون الحضور جانب الملعب ويتلقى أولياء الأمور تحديثات فورية عن الإلغاءات وتفاصيل المباريات.",
      },
      {
        en: "League scheduling and billing now run themselves, freeing the academy manager to focus on player development.",
        ar: "أصبحت جدولة الدوري والفوترة تعملان تلقائيًا، مما يترك لمدير الأكاديمية التركيز على تطوير اللاعبين.",
      },
    ],
  },
];

export type BlogPost = {
  slug: string;
  title: Localized;
  category: Localized;
  /** Dates stay as plain English strings for now — a follow-up will localize per-locale date formatting. */
  date: string;
  readTime: Localized;
  author: Localized;
  excerpt: Localized;
  body: Localized[];
};

export const blogPosts: BlogPost[] = [
  {
    slug: "reduce-no-shows",
    title: {
      en: "Five ways to cut no-shows at your academy",
      ar: "خمس طرق لخفض حالات الغياب في أكاديميتك",
    },
    category: { en: "Operations", ar: "العمليات" },
    date: "Mar 18, 2025",
    readTime: { en: "6 min read", ar: "قراءة 6 دقائق" },
    author: { en: "Elena Marsh", ar: "إيلينا مارش" },
    excerpt: {
      en: "No-shows quietly drain revenue and morale. Here are five automation-friendly tactics that actually move the needle.",
      ar: "يستنزف الغياب الإيرادات والمعنويات بهدوء. إليك خمس تكتيكات صديقة للأتمتة تُحدث فرقًا حقيقيًا.",
    },
    body: [
      {
        en: "Every empty spot in a session is lost revenue and a missed development opportunity. The good news: most no-shows are preventable with the right reminders and policies.",
        ar: "كل مقعد شاغر في الحصة إيراد ضائع وفرصة تطوير فائتة. الخبر السار: معظم حالات الغياب يمكن تفاديها بتذكيرات وسياسات مناسبة.",
      },
      {
        en: "Start with automated reminders 24 hours and 2 hours before each session. Academies that switch on push and email reminders typically see no-shows fall by a third within a month.",
        ar: "ابدأ بتذكيرات آلية قبل الحصة بـ24 ساعة وبساعتين. تشهد الأكاديميات التي تفعّل التذكيرات عبر البريد والإشعارات انخفاضًا في الغياب بنحو الثلث خلال شهر عادة.",
      },
      {
        en: "Next, make rescheduling frictionless. When families can move a session themselves, they're far less likely to simply not turn up. Pair that with a clear cancellation window and waitlist auto-fill so empty spots get claimed.",
        ar: "بعد ذلك، اجعل إعادة الجدولة سلسة. حين يستطيع أولياء الأمور نقل الحصة بأنفسهم، تقلّ احتمالية الغياب دون إشعار كثيرًا. اقرن ذلك بنافذة إلغاء واضحة وتعبئة تلقائية لقائمة الانتظار لتُشغَل الأماكن الفارغة.",
      },
      {
        en: "Finally, watch your attendance analytics. Athletes who miss two sessions in a row are your early churn signal, reach out before they drift away.",
        ar: "أخيرًا، راقب تحليلات الحضور. اللاعبون الذين يتغيّبون عن حصتين متتاليتين هم إشارتك المبكرة لخطر الانسحاب؛ تواصل معهم قبل أن يبتعدوا.",
      },
    ],
  },
  {
    slug: "multi-sport-pricing",
    title: {
      en: "How to price multi-sport family memberships",
      ar: "كيف تسعّر عضويات العائلة متعددة الرياضات",
    },
    category: { en: "Growth", ar: "النمو" },
    date: "Mar 4, 2025",
    readTime: { en: "8 min read", ar: "قراءة 8 دقائق" },
    author: { en: "Priya Nair", ar: "بريا ناير" },
    excerpt: {
      en: "Bundles, sibling discounts, and term plans: a practical framework for pricing across disciplines.",
      ar: "باقات وخصومات الإخوة وخطط فصلية: إطار عملي لتسعير التخصصات المتعددة.",
    },
    body: [
      {
        en: "Families that train in more than one sport are your most loyal, and your most price-sensitive. Getting multi-sport pricing right rewards commitment without eroding margin.",
        ar: "الأسر التي تتدرب في أكثر من رياضة هي الأكثر ولاءً والأكثر حساسية للسعر. ضبط تسعير الرياضات المتعددة يكافئ الالتزام دون أن يقلّص هامش الربح.",
      },
      {
        en: "A simple, effective model is a per-athlete base plan with automatic sibling and multi-sport discounts applied at checkout. Academorix handles the pro-rating so you never calculate a partial month by hand.",
        ar: "نموذج بسيط وفعّال هو خطة أساس لكل لاعب مع تطبيق تلقائي لخصومات الإخوة والرياضات المتعددة عند الدفع. يتولى أكاديموريكس الحساب التناسبي حتى لا تحسب شهرًا جزئيًا يدويًا.",
      },
      {
        en: "Term plans smooth your cash flow and lock in commitment, while monthly plans lower the barrier to entry. Offering both, with a small discount for term commitment, captures the widest audience.",
        ar: "تُنعّم خطط الفصل تدفقك النقدي وتثبّت الالتزام، بينما تخفض الخطط الشهرية حاجز الدخول. تقديم كليهما مع خصم بسيط للالتزام الفصلي يجذب أوسع جمهور.",
      },
    ],
  },
  {
    slug: "coach-onboarding",
    title: {
      en: "A 30-day onboarding plan for new coaches",
      ar: "خطة تهيئة 30 يومًا للمدربين الجدد",
    },
    category: { en: "Coaching", ar: "التدريب" },
    date: "Feb 20, 2025",
    readTime: { en: "5 min read", ar: "قراءة 5 دقائق" },
    author: { en: "Tom Bailey", ar: "توم بيلي" },
    excerpt: {
      en: "Set coaches up for success with a structured first month that covers tools, culture, and athletes.",
      ar: "هيّئ المدربين للنجاح بشهر أول ممنهج يشمل الأدوات والثقافة واللاعبين.",
    },
    body: [
      {
        en: "A great coach can still struggle without a clear onboarding path. A structured first 30 days protects your athletes and your culture.",
        ar: "قد يواجه المدرّب البارع صعوبة دون مسار تهيئة واضح. يحمي أول 30 يومًا ممنهجة لاعبيك وثقافتك.",
      },
      {
        en: "Week one is about access and observation: set up their Academorix account, add them to squads, and have them shadow sessions.",
        ar: "الأسبوع الأول للوصول والمراقبة: أنشئ حسابهم على أكاديموريكس، وأضفهم إلى الفرق، ودعهم يواكبون الحصص.",
      },
      {
        en: "By week four they should be running sessions independently, taking attendance, and logging progress notes, with a check-in to gather feedback and answer questions.",
        ar: "بحلول الأسبوع الرابع، ينبغي أن يديروا الحصص بأنفسهم ويسجّلوا الحضور ويدوّنوا ملاحظات التقدم، مع لقاء مراجعة لجمع الملاحظات والإجابة على الأسئلة.",
      },
    ],
  },
  {
    slug: "parent-communication",
    title: {
      en: "The parent communication playbook",
      ar: "دليل التواصل مع أولياء الأمور",
    },
    category: { en: "Communication", ar: "التواصل" },
    date: "Feb 6, 2025",
    readTime: { en: "7 min read", ar: "قراءة 7 دقائق" },
    author: { en: "Elena Marsh", ar: "إيلينا مارش" },
    excerpt: {
      en: "What to send, when to send it, and how to keep families engaged without overwhelming them.",
      ar: "ماذا ترسل، ومتى ترسله، وكيف تُبقي الأسر متفاعلة دون إثقالها.",
    },
    body: [
      {
        en: "Parents want to feel informed, not spammed. The academies with the happiest families are deliberate about what they send and when.",
        ar: "يريد أولياء الأمور أن يشعروا بالاطلاع لا بالإزعاج. الأكاديميات التي تحظى بأسعد الأسر تُحكم ما ترسله ومتى.",
      },
      {
        en: "Use broadcasts sparingly for genuinely important updates, and lean on the parent portal for schedules and progress so families can self-serve.",
        ar: "استخدم البثّ باعتدال للتحديثات المهمة فعلًا، واعتمد على بوابة أولياء الأمور للجداول والتقدم لتخدم الأسر نفسها.",
      },
      {
        en: "A monthly highlights message, per-squad updates as needed, and instant alerts for cancellations strikes the right balance for most programs.",
        ar: "رسالة شهرية بأبرز الأخبار، وتحديثات لكل فريق عند الحاجة، وتنبيهات فورية للإلغاءات تحقق التوازن المناسب لمعظم البرامج.",
      },
    ],
  },
];

export type LegalDoc = {
  slug: string;
  title: Localized;
  /** Dates stay as plain English strings for now. */
  updated: string;
  summary: Localized;
  body: { heading: Localized; text: Localized }[];
};

export const legalDocs: LegalDoc[] = [
  {
    slug: "privacy",
    title: { en: "Privacy Policy", ar: "سياسة الخصوصية" },
    updated: "March 1, 2025",
    summary: {
      en: "How Academorix collects, uses, and protects the personal data of academies and their families.",
      ar: "كيف يجمع أكاديموريكس البيانات الشخصية للأكاديميات وأسرها ويستخدمها ويحميها.",
    },
    body: [
      {
        heading: { en: "Information we collect", ar: "المعلومات التي نجمعها" },
        text: {
          en: "We collect account details, athlete and family records you enter, and usage data needed to operate the service.",
          ar: "نجمع تفاصيل الحساب، وسجلات اللاعبين والعائلات التي تُدخلها، وبيانات الاستخدام اللازمة لتشغيل الخدمة.",
        },
      },
      {
        heading: { en: "How we use data", ar: "كيف نستخدم البيانات" },
        text: {
          en: "Data is used solely to provide scheduling, communication, and billing features to your academy. We never sell personal data.",
          ar: "تُستخدم البيانات حصريًا لتقديم ميزات الجدولة والتواصل والفوترة لأكاديميتك. لا نبيع البيانات الشخصية أبدًا.",
        },
      },
      {
        heading: { en: "Data retention", ar: "الاحتفاظ بالبيانات" },
        text: {
          en: "We retain records for as long as your workspace is active and delete them on request in line with applicable law.",
          ar: "نحتفظ بالسجلات طالما بقيت مساحة عملك نشطة ونحذفها عند الطلب وفق القانون المعمول به.",
        },
      },
      {
        heading: { en: "Your rights", ar: "حقوقك" },
        text: {
          en: "You can access, correct, export, or delete personal data at any time from your workspace settings or by contacting our team.",
          ar: "يمكنك الوصول إلى بياناتك الشخصية أو تصحيحها أو تصديرها أو حذفها في أي وقت من إعدادات مساحة العمل أو بالتواصل مع فريقنا.",
        },
      },
    ],
  },
  {
    slug: "terms",
    title: { en: "Terms of Service", ar: "شروط الخدمة" },
    updated: "March 1, 2025",
    summary: {
      en: "The terms that govern your use of the Academorix platform and services.",
      ar: "الشروط التي تحكم استخدامك لمنصة أكاديموريكس وخدماتها.",
    },
    body: [
      {
        heading: { en: "Your account", ar: "حسابك" },
        text: {
          en: "You are responsible for maintaining the security of your workspace and for all activity under your account.",
          ar: "أنت مسؤول عن الحفاظ على أمان مساحة عملك وعن كل نشاط يجري تحت حسابك.",
        },
      },
      {
        heading: { en: "Acceptable use", ar: "الاستخدام المقبول" },
        text: {
          en: "You agree to use Academorix lawfully and not to disrupt the service or misuse other organizations' data.",
          ar: "توافق على استخدام أكاديموريكس بشكل قانوني وعدم تعطيل الخدمة أو إساءة استخدام بيانات المؤسسات الأخرى.",
        },
      },
      {
        heading: { en: "Billing", ar: "الفوترة" },
        text: {
          en: "Subscriptions renew automatically. You can cancel at any time and retain access until the end of the billing period.",
          ar: "تُجدَّد الاشتراكات تلقائيًا. يمكنك الإلغاء في أي وقت والاحتفاظ بالوصول حتى نهاية فترة الفوترة.",
        },
      },
      {
        heading: { en: "Liability", ar: "المسؤولية" },
        text: {
          en: "The service is provided as-is. Our liability is limited to the fees paid in the preceding twelve months.",
          ar: "تُقدَّم الخدمة كما هي. تقتصر مسؤوليتنا على الرسوم المدفوعة خلال الاثني عشر شهرًا السابقة.",
        },
      },
    ],
  },
  {
    slug: "security",
    title: { en: "Security", ar: "الأمان" },
    updated: "March 1, 2025",
    summary: {
      en: "The controls and practices that keep your academy's data safe.",
      ar: "الضوابط والممارسات التي تحافظ على أمان بيانات أكاديميتك.",
    },
    body: [
      {
        heading: { en: "Encryption", ar: "التشفير" },
        text: {
          en: "All data is encrypted in transit with TLS and at rest with AES-256.",
          ar: "تُشفَّر كل البيانات أثناء النقل بـTLS وأثناء التخزين بـAES-256.",
        },
      },
      {
        heading: { en: "Access controls", ar: "ضوابط الوصول" },
        text: {
          en: "Role-based permissions and single sign-on ensure people only see what they need to.",
          ar: "تضمن الصلاحيات القائمة على الأدوار وتسجيل الدخول الموحّد أن يرى الأشخاص ما يحتاجونه فقط.",
        },
      },
      {
        heading: { en: "Compliance", ar: "الامتثال" },
        text: {
          en: "We undergo regular independent audits and are SOC 2 Type II aligned.",
          ar: "نخضع لعمليات تدقيق مستقلة منتظمة ونتوافق مع معايير SOC 2 Type II.",
        },
      },
      {
        heading: { en: "Payments", ar: "المدفوعات" },
        text: {
          en: "Card data is handled by PCI-DSS Level 1 certified payment providers and never stored on our servers.",
          ar: "تتولى مزوّدات دفع معتمدة بمعيار PCI-DSS المستوى 1 التعامل مع بيانات البطاقات، ولا تُخزَّن على خوادمنا أبدًا.",
        },
      },
    ],
  },
  {
    slug: "dpa",
    title: { en: "Data Processing Addendum", ar: "ملحق معالجة البيانات" },
    updated: "March 1, 2025",
    summary: {
      en: "Our commitments as a data processor for academies operating in regulated regions.",
      ar: "التزاماتنا بوصفنا معالجًا للبيانات تجاه الأكاديميات العاملة في مناطق منظّمة.",
    },
    body: [
      {
        heading: { en: "Roles", ar: "الأدوار" },
        text: {
          en: "Your academy is the data controller and Academorix acts as the data processor for the data you enter.",
          ar: "أكاديميتك هي المتحكم بالبيانات ويعمل أكاديموريكس بوصفه معالجًا للبيانات التي تُدخلها.",
        },
      },
      {
        heading: { en: "Subprocessors", ar: "المعالجون الفرعيون" },
        text: {
          en: "We maintain a current list of subprocessors and notify you of material changes.",
          ar: "نحتفظ بقائمة محدّثة بالمعالجين الفرعيين ونبلغك بأي تغييرات جوهرية.",
        },
      },
      {
        heading: { en: "International transfers", ar: "التحويلات الدولية" },
        text: {
          en: "Transfers are governed by standard contractual clauses where required.",
          ar: "تُحكم التحويلات ببنود تعاقدية قياسية حين يتطلب الأمر ذلك.",
        },
      },
    ],
  },
];

// ─── Jobs ────────────────────────────────────────────────────────────────

export type Job = {
  slug: string;
  title: Localized;
  team: Localized;
  location: Localized;
  type: Localized;
  description: Localized;
  responsibilities: Localized[];
  requirements: Localized[];
};

export const jobs: Job[] = [
  {
    slug: "senior-product-designer",
    title: { en: "Senior Product Designer", ar: "مصمم منتجات أول" },
    team: { en: "Design", ar: "التصميم" },
    location: { en: "Remote (US / EU)", ar: "عن بُعد (الولايات المتحدة / أوروبا)" },
    type: { en: "Full-time", ar: "دوام كامل" },
    description: {
      en: "Shape the product experience academies rely on every day, from scheduling to billing.",
      ar: "شكّل تجربة المنتج التي تعتمد عليها الأكاديميات يوميًا، من الجدولة إلى الفوترة.",
    },
    responsibilities: [
      {
        en: "Own end-to-end design for core product areas",
        ar: "امتلك التصميم من الطرف إلى الطرف لأجزاء المنتج الأساسية",
      },
      {
        en: "Partner with engineering to ship polished, accessible interfaces",
        ar: "تعاون مع الهندسة لإطلاق واجهات مصقولة وقابلة للوصول",
      },
      {
        en: "Run research sessions with academy directors and coaches",
        ar: "أدر جلسات بحث مع مديري الأكاديميات والمدربين",
      },
    ],
    requirements: [
      {
        en: "5+ years designing complex SaaS products",
        ar: "خبرة 5+ سنوات في تصميم منتجات SaaS المعقدة",
      },
      {
        en: "Strong systems thinking and prototyping skills",
        ar: "تفكير منهجي قوي ومهارات نمذجة أولية",
      },
      { en: "A portfolio of shipped, high-craft work", ar: "أعمال منشورة عالية الجودة" },
    ],
  },
  {
    slug: "backend-engineer",
    title: { en: "Backend Engineer", ar: "مهندس خلفي" },
    team: { en: "Engineering", ar: "الهندسة" },
    location: { en: "Remote (Global)", ar: "عن بُعد (عالمي)" },
    type: { en: "Full-time", ar: "دوام كامل" },
    description: {
      en: "Build the billing and scheduling systems that power thousands of academies.",
      ar: "ابنِ أنظمة الفوترة والجدولة التي تُشغّل آلاف الأكاديميات.",
    },
    responsibilities: [
      { en: "Design reliable, well-tested services", ar: "صمّم خدمات موثوقة ومُختبَرة جيدًا" },
      {
        en: "Own billing, payments, and reconciliation flows",
        ar: "امتلك تدفقات الفوترة والمدفوعات والتسوية",
      },
      {
        en: "Collaborate across the product on performance and scale",
        ar: "تعاون عبر المنتج في الأداء والقياس",
      },
    ],
    requirements: [
      {
        en: "4+ years building production backends",
        ar: "خبرة 4+ سنوات في بناء أنظمة خلفية للإنتاج",
      },
      {
        en: "Experience with payments or scheduling systems",
        ar: "خبرة في أنظمة المدفوعات أو الجدولة",
      },
      {
        en: "Strong fundamentals in data modeling and APIs",
        ar: "أسس قوية في نمذجة البيانات وواجهات البرمجة",
      },
    ],
  },
  {
    slug: "customer-success-manager",
    title: { en: "Customer Success Manager", ar: "مدير نجاح العملاء" },
    team: { en: "Customer Success", ar: "نجاح العملاء" },
    location: { en: "Austin, TX", ar: "أوستن، تكساس" },
    type: { en: "Full-time", ar: "دوام كامل" },
    description: {
      en: "Help academies get the most out of Academorix, from onboarding to expansion.",
      ar: "ساعد الأكاديميات على تحقيق أقصى استفادة من أكاديموريكس، من التهيئة إلى التوسع.",
    },
    responsibilities: [
      {
        en: "Own onboarding and adoption for a book of accounts",
        ar: "امتلك التهيئة والتبنّي لمحفظة حسابات",
      },
      {
        en: "Turn customer feedback into product improvements",
        ar: "حوّل ملاحظات العملاء إلى تحسينات في المنتج",
      },
      { en: "Drive retention and expansion", ar: "ادفع بالاحتفاظ والتوسع" },
    ],
    requirements: [
      { en: "3+ years in SaaS customer success", ar: "خبرة 3+ سنوات في نجاح عملاء SaaS" },
      { en: "Empathy and excellent communication", ar: "تعاطف وتواصل ممتاز" },
      {
        en: "Bonus: background in sports or education",
        ar: "ميزة إضافية: خلفية في الرياضة أو التعليم",
      },
    ],
  },
  {
    slug: "growth-marketer",
    title: { en: "Growth Marketer", ar: "مسوّق نمو" },
    team: { en: "Marketing", ar: "التسويق" },
    location: { en: "Remote (US / EU)", ar: "عن بُعد (الولايات المتحدة / أوروبا)" },
    type: { en: "Full-time", ar: "دوام كامل" },
    description: {
      en: "Own acquisition experiments that bring more academies into Academorix.",
      ar: "امتلك تجارب الاستحواذ التي تجلب المزيد من الأكاديميات إلى أكاديموريكس.",
    },
    responsibilities: [
      { en: "Run acquisition and lifecycle experiments", ar: "أدر تجارب الاستحواذ ودورة الحياة" },
      {
        en: "Own performance across paid and organic channels",
        ar: "امتلك الأداء عبر القنوات المدفوعة والعضوية",
      },
      {
        en: "Partner with product on onboarding conversion",
        ar: "تعاون مع فريق المنتج في تحويل التهيئة",
      },
    ],
    requirements: [
      { en: "4+ years in B2B SaaS growth", ar: "خبرة 4+ سنوات في نمو SaaS للشركات" },
      { en: "Data-driven and hands-on", ar: "مدفوع بالبيانات وعملي" },
      { en: "Strong writing and analytical skills", ar: "مهارات كتابة وتحليل قوية" },
    ],
  },
];

// ─── Docs / tutorials / changelog ─────────────────────────────────────────

export type DocArticle = {
  slug: string;
  title: Localized;
  category: Localized;
  summary: Localized;
  body: Localized[];
};

export const docArticles: DocArticle[] = [
  {
    slug: "quickstart",
    title: { en: "Quickstart", ar: "بداية سريعة" },
    category: { en: "Getting started", ar: "البداية" },
    summary: {
      en: "Create your workspace and run your first session in under 15 minutes.",
      ar: "أنشئ مساحة عملك وأدر أول حصة في أقل من 15 دقيقة.",
    },
    body: [
      {
        en: "Welcome to Academorix. This guide walks you through creating a workspace, adding your first venue and coach, and scheduling a session.",
        ar: "مرحبًا بك في أكاديموريكس. يرشدك هذا الدليل إلى إنشاء مساحة عمل، وإضافة أول مرفق ومدرّب، وجدولة أول حصة.",
      },
      {
        en: "Start by creating your workspace and inviting your team. Then add the venues where you train, the coaches on your staff, and the programs you run.",
        ar: "ابدأ بإنشاء مساحة عملك ودعوة فريقك. ثم أضف المرافق التي تتدرّب فيها والمدربين وبرامجك.",
      },
      {
        en: "With those in place, scheduling a session takes seconds, and your first families can register right away.",
        ar: "بعد إعداد ذلك، تستغرق جدولة الحصة ثوانٍ، ويستطيع أول الأسر التسجيل فورًا.",
      },
    ],
  },
  {
    slug: "importing-data",
    title: { en: "Importing your data", ar: "استيراد بياناتك" },
    category: { en: "Getting started", ar: "البداية" },
    summary: {
      en: "Bring rosters, families, and plans over from your previous tools.",
      ar: "انقل التشكيلات والعائلات والخطط من أدواتك السابقة.",
    },
    body: [
      {
        en: "Academorix imports athletes, families, and billing plans from CSV or directly from popular tools.",
        ar: "يستورد أكاديموريكس اللاعبين والعائلات وخطط الفوترة من CSV أو مباشرة من الأدوات الشائعة.",
      },
      {
        en: "Map your columns once and we handle the rest, including matching families to athletes and preserving payment history.",
        ar: "طابق أعمدتك مرة واحدة ونتولى الباقي، بما في ذلك مطابقة العائلات باللاعبين وحفظ سجل المدفوعات.",
      },
      {
        en: "Our onboarding team is available to help with larger or more complex migrations.",
        ar: "فريق التهيئة لدينا متاح للمساعدة في عمليات الترحيل الأكبر أو الأكثر تعقيدًا.",
      },
    ],
  },
  {
    slug: "setting-up-billing",
    title: { en: "Setting up billing", ar: "إعداد الفوترة" },
    category: { en: "Billing", ar: "الفوترة" },
    summary: {
      en: "Configure plans, auto-charging, and payout accounts.",
      ar: "هيّئ الخطط والدفع التلقائي وحسابات الدفعات.",
    },
    body: [
      {
        en: "Connect your payout account, then create the plans your programs use, monthly, termly, or pro-rated.",
        ar: "اربط حساب الدفعات، ثم أنشئ الخطط التي تستخدمها برامجك: شهرية أو فصلية أو تناسبية.",
      },
      {
        en: "Turn on auto-charge to bill saved cards on the due date, with automatic retries for failed payments.",
        ar: "شغّل الدفع التلقائي لتحميل البطاقات المحفوظة في تاريخ الاستحقاق، مع إعادة محاولات آلية للمدفوعات الفاشلة.",
      },
      {
        en: "Every payment reconciles into reports you can export or share.",
        ar: "تُسوَّى كل دفعة ضمن تقارير يمكنك تصديرها أو مشاركتها.",
      },
    ],
  },
  {
    slug: "roles-and-permissions",
    title: { en: "Roles and permissions", ar: "الأدوار والصلاحيات" },
    category: { en: "Administration", ar: "الإدارة" },
    summary: {
      en: "Control what directors, coaches, and admins can see and do.",
      ar: "تحكّم في ما يمكن للمديرين والمدربين والإداريين رؤيته وفعله.",
    },
    body: [
      {
        en: "Academorix ships with sensible default roles for directors, administrators, and coaches.",
        ar: "يأتي أكاديموريكس بأدوار افتراضية معقولة للمديرين والإداريين والمدربين.",
      },
      {
        en: "You can fine-tune permissions per role and, on multi-site plans, scope access to specific locations.",
        ar: "يمكنك ضبط الصلاحيات لكل دور، وفي خطط المواقع المتعددة، حصر الوصول بمواقع محددة.",
      },
      {
        en: "Single sign-on is available on Enterprise plans.",
        ar: "تسجيل الدخول الموحّد متاح في خطط المؤسسات.",
      },
    ],
  },
  {
    slug: "api-overview",
    title: { en: "API overview", ar: "نظرة عامة على واجهة البرمجة" },
    category: { en: "Developers", ar: "المطورون" },
    summary: {
      en: "Automate and integrate Academorix with your own systems.",
      ar: "أتمتة أكاديموريكس وربطه بأنظمتك.",
    },
    body: [
      {
        en: "The Academorix REST API lets you read and write athletes, sessions, and payments programmatically.",
        ar: "تتيح لك واجهة REST البرمجية قراءة وكتابة اللاعبين والحصص والمدفوعات برمجيًا.",
      },
      {
        en: "Authenticate with a workspace API key and respect our rate limits.",
        ar: "استخدم مفتاح API لمساحة عملك مع احترام حدود الطلبات.",
      },
      {
        en: "Webhooks notify your systems in real time when key events occur.",
        ar: "تُنبّه Webhooks أنظمتك مباشرة عند وقوع الأحداث المهمة.",
      },
    ],
  },
];

export type Tutorial = {
  slug: string;
  title: Localized;
  level: Localized;
  duration: Localized;
  summary: Localized;
  steps: Localized[];
};

export const tutorials: Tutorial[] = [
  {
    slug: "build-first-schedule",
    title: { en: "Build your first weekly schedule", ar: "ابنِ أول جدول أسبوعي لك" },
    level: { en: "Beginner", ar: "مبتدئ" },
    duration: { en: "12 min", ar: "12 دقيقة" },
    summary: {
      en: "Create venues, add sessions, and publish a full week of training.",
      ar: "أنشئ المرافق، وأضف الحصص، وانشر أسبوعًا كاملًا من التدريب.",
    },
    steps: [
      { en: "Add your venues and their capacity", ar: "أضف مرافقك وسعتها" },
      { en: "Create session types for each program", ar: "أنشئ أنواع الحصص لكل برنامج" },
      { en: "Drag sessions onto the calendar", ar: "اسحب الحصص إلى التقويم" },
      { en: "Publish and notify coaches", ar: "انشر وأبلغ المدربين" },
    ],
  },
  {
    slug: "automate-tuition",
    title: { en: "Automate tuition collection", ar: "أتمتة تحصيل الرسوم" },
    level: { en: "Intermediate", ar: "متوسط" },
    duration: { en: "18 min", ar: "18 دقيقة" },
    summary: {
      en: "Set up recurring plans, auto-charging, and smart retries end to end.",
      ar: "أعدّ الخطط المتكررة والدفع التلقائي وإعادة المحاولات الذكية من الطرف إلى الطرف.",
    },
    steps: [
      { en: "Connect your payout account", ar: "اربط حساب الدفعات" },
      { en: "Create recurring plans", ar: "أنشئ خططًا متكررة" },
      { en: "Assign plans to families", ar: "عيّن الخطط للعائلات" },
      { en: "Turn on auto-charge and retries", ar: "شغّل الدفع التلقائي والمحاولات" },
    ],
  },
  {
    slug: "parent-portal-setup",
    title: { en: "Set up the parent portal", ar: "إعداد بوابة أولياء الأمور" },
    level: { en: "Beginner", ar: "مبتدئ" },
    duration: { en: "9 min", ar: "9 دقائق" },
    summary: {
      en: "Give families self-serve registration, schedules, and messaging.",
      ar: "امنح الأسر تسجيلًا ذاتيًا وجداول ومراسلة.",
    },
    steps: [
      { en: "Enable the parent portal", ar: "فعّل بوابة أولياء الأمور" },
      { en: "Customize your registration form", ar: "خصّص نموذج التسجيل" },
      { en: "Invite families", ar: "ادعُ الأسر" },
      { en: "Review self-serve settings", ar: "راجع إعدادات الخدمة الذاتية" },
    ],
  },
];

export type ChangelogEntry = {
  version: string;
  date: string;
  tag: "New" | "Improved" | "Fixed";
  title: Localized;
  items: Localized[];
};

export const changelog: ChangelogEntry[] = [
  {
    version: "3.4",
    date: "Mar 22, 2025",
    tag: "New",
    title: { en: "Multi-site roll-up reporting", ar: "تقارير مجمّعة متعددة المواقع" },
    items: [
      {
        en: "New network dashboard aggregates revenue and enrollment across every location",
        ar: "لوحة شبكة جديدة تجمع الإيرادات والتسجيلات عبر كل المواقع",
      },
      {
        en: "Per-site permissions for regional managers",
        ar: "صلاحيات لكل موقع للمديرين الإقليميين",
      },
      { en: "Exportable board-ready PDF summaries", ar: "ملخصات PDF جاهزة للمجلس وقابلة للتصدير" },
    ],
  },
  {
    version: "3.3",
    date: "Mar 5, 2025",
    tag: "Improved",
    title: { en: "Faster scheduling", ar: "جدولة أسرع" },
    items: [
      {
        en: "Drag-and-drop planner is up to 3x faster on large timetables",
        ar: "المخطّط بالسحب والإفلات أسرع بثلاث مرات في الجداول الكبيرة",
      },
      {
        en: "Improved conflict detection for shared venues",
        ar: "تحسين اكتشاف التعارضات للمرافق المشتركة",
      },
    ],
  },
  {
    version: "3.2",
    date: "Feb 18, 2025",
    tag: "New",
    title: { en: "Two-way parent inbox", ar: "صندوق أولياء أمور ثنائي الاتجاه" },
    items: [
      {
        en: "Parents can now reply to broadcasts in a shared inbox",
        ar: "يمكن لأولياء الأمور الآن الرد على البث الجماعي في صندوق مشترك",
      },
      { en: "Assign conversations to team members", ar: "عيّن المحادثات لأعضاء الفريق" },
    ],
  },
  {
    version: "3.1",
    date: "Feb 2, 2025",
    tag: "Fixed",
    title: { en: "Billing reliability", ar: "موثوقية الفوترة" },
    items: [
      {
        en: "Resolved an edge case in pro-rated refunds",
        ar: "حللنا حالة استثنائية في المبالغ المستردة التناسبية",
      },
      {
        en: "Improved retry timing for failed cards",
        ar: "تحسين توقيت إعادة المحاولة للبطاقات الفاشلة",
      },
    ],
  },
];

// ─── Pricing ──────────────────────────────────────────────────────────────

export type PricingPlan = {
  name: Localized;
  price: string;
  cadence: Localized;
  description: Localized;
  featured?: boolean;
  cta: Localized;
  ctaHref: string;
  features: Localized[];
};

export const pricingPlans: PricingPlan[] = [
  {
    name: { en: "Starter", ar: "المبتدئ" },
    price: "$49",
    cadence: { en: "/ month", ar: "/ شهر" },
    description: {
      en: "For a single program getting organized.",
      ar: "لبرنامج واحد يبدأ بتنظيم عملياته.",
    },
    cta: { en: "Start free trial", ar: "ابدأ النسخة المجانية" },
    ctaHref: "/create-workspace",
    features: [
      { en: "Up to 100 athletes", ar: "حتى 100 لاعب" },
      { en: "1 venue", ar: "مرفق واحد" },
      { en: "Scheduling & attendance", ar: "الجدولة والحضور" },
      { en: "Email support", ar: "دعم عبر البريد" },
    ],
  },
  {
    name: { en: "Academy", ar: "الأكاديمية" },
    price: "$149",
    cadence: { en: "/ month", ar: "/ شهر" },
    description: {
      en: "For growing academies running multiple programs.",
      ar: "للأكاديميات النامية التي تدير برامج متعددة.",
    },
    featured: true,
    cta: { en: "Start free trial", ar: "ابدأ النسخة المجانية" },
    ctaHref: "/create-workspace",
    features: [
      { en: "Up to 750 athletes", ar: "حتى 750 لاعبًا" },
      { en: "Unlimited venues", ar: "مرافق غير محدودة" },
      { en: "Billing & automated payments", ar: "الفوترة والمدفوعات الآلية" },
      { en: "Parent portal & communication", ar: "بوابة أولياء الأمور والتواصل" },
      { en: "Reporting dashboards", ar: "لوحات التقارير" },
      { en: "Priority support", ar: "دعم ذو أولوية" },
    ],
  },
  {
    name: { en: "Enterprise", ar: "المؤسسات" },
    price: "Custom",
    cadence: { en: "", ar: "" },
    description: {
      en: "For multi-site operators and franchises.",
      ar: "لمشغّلي المواقع المتعددة والامتيازات.",
    },
    cta: { en: "Contact sales", ar: "تواصل مع المبيعات" },
    ctaHref: "/contact-sales",
    features: [
      { en: "Unlimited athletes & sites", ar: "لاعبون ومواقع غير محدودين" },
      { en: "Roll-up reporting", ar: "تقارير مجمّعة" },
      { en: "SSO & advanced permissions", ar: "SSO وصلاحيات متقدمة" },
      { en: "Dedicated success manager", ar: "مدير نجاح مخصّص" },
      { en: "SLA & onboarding", ar: "اتفاقية مستوى الخدمة والتهيئة" },
    ],
  },
];

// ─── FAQ ─────────────────────────────────────────────────────────────────

export type FaqItem = { q: Localized; a: Localized };

export const faqs: FaqItem[] = [
  {
    q: {
      en: "Is Academorix really sport-agnostic?",
      ar: "هل أكاديموريكس مناسب لكل الرياضات فعلًا؟",
    },
    a: {
      en: "Yes. Venues, session types, skill levels, and billing plans are all configurable, so swimming lanes, gym apparatus rotations, and soccer squads run on the same core with setups that fit each discipline.",
      ar: "نعم. المرافق وأنواع الحصص والمستويات وخطط الفوترة كلها قابلة للتخصيص، بحيث تعمل مسارات السباحة ودوارات الجمباز وفرق كرة القدم على نفس النواة بإعدادات تناسب كل تخصص.",
    },
  },
  {
    q: {
      en: "How does billing and payment collection work?",
      ar: "كيف تعمل الفوترة وتحصيل المدفوعات؟",
    },
    a: {
      en: "Create recurring or term-based plans, then let Academorix auto-charge saved cards on the due date. Failed payments retry automatically and every transaction reconciles into payout and tax-ready reports.",
      ar: "أنشئ خططًا متكررة أو فصلية، ثم دع أكاديموريكس يخصم تلقائيًا من البطاقات المحفوظة عند الاستحقاق. تُعاد محاولة الدفعات الفاشلة تلقائيًا وتُسوَّى كل معاملة ضمن تقارير جاهزة للدفعات والضرائب.",
    },
  },
  {
    q: {
      en: "Can parents manage bookings themselves?",
      ar: "هل يمكن لأولياء الأمور إدارة حجوزاتهم بأنفسهم؟",
    },
    a: {
      en: "Parents get a self-serve portal to register children, view schedules, message coaches, and update payment details, which cuts the front-desk load for your team.",
      ar: "يحصل أولياء الأمور على بوابة ذاتية الخدمة لتسجيل الأبناء وعرض الجداول ومراسلة المدربين وتحديث الدفع، ما يخفف حمل مكتب الاستقبال.",
    },
  },
  {
    q: { en: "How long does it take to migrate?", ar: "كم يستغرق الترحيل؟" },
    a: {
      en: "Most academies import rosters and are live within a week. Our team helps map your existing sessions, plans, and family records during onboarding.",
      ar: "معظم الأكاديميات تستورد التشكيلات وتنطلق خلال أسبوع. يساعدك فريقنا في تعيين الحصص والخطط وسجلات العائلات أثناء التهيئة.",
    },
  },
  {
    q: { en: "Do you offer a free trial?", ar: "هل تقدمون نسخة تجريبية مجانية؟" },
    a: {
      en: "Every plan starts with a 14-day free trial. No card required, and you can invite your coaching staff to explore the full platform.",
      ar: "كل خطة تبدأ بتجربة مجانية مدتها 14 يومًا. لا حاجة إلى بطاقة، ويمكنك دعوة طاقم التدريب لديك لاستكشاف المنصة بالكامل.",
    },
  },
  {
    q: { en: "Do you support single sign-on?", ar: "هل تدعمون تسجيل الدخول الموحّد؟" },
    a: {
      en: "Yes, SSO is available on Enterprise plans along with advanced role-based permissions and per-site access controls.",
      ar: "نعم، SSO متاح في خطط المؤسسات مع صلاحيات دقيقة قائمة على الأدوار وضوابط وصول لكل موقع.",
    },
  },
];

// ─── Helper ──────────────────────────────────────────────────────────────

/**
 * Look up a record by slug across any of the site.ts collections. Kept
 * generic so it works for products, sports, solutions, personas, customers,
 * blog posts, legal docs, jobs, doc articles, tutorials — every collection
 * whose entry carries a `slug`.
 */
export function findBySlug<T extends { slug: string }>(
  items: readonly T[],
  slug: string | undefined,
): T | undefined {
  if (!slug) return undefined;

  return items.find((item) => item.slug === slug);
}
