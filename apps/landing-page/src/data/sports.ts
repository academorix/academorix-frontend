/**
 * @file sports.ts
 * @module data/sports
 *
 * @description
 * Sport-specific profile content driving `/sports/[slug]`. Every translatable
 * field is stored as `{ en, ar }` so a route can resolve the right locale via
 * `pick(value, locale)` without any string interpolation trickery. Structural
 * fields (`slug`, `accent`, `vector`, `icon`) stay plain strings.
 */

import type { Locale } from "../i18n/dictionaries";

/** Shape of any translatable leaf in this file. */
export type Localized = { en: string; ar: string };

/** Vector illustration variant rendered in the sport-detail hero. */
export type VectorKind = "pitch" | "lanes" | "court" | "mat" | "track" | "apparatus";

/**
 * Collapse a `{ en, ar }` leaf to the visitor's active locale, with a safe
 * fallback to English when a locale is missing an entry.
 */
export function pick(value: Localized, locale: Locale): string {
  return value[locale] ?? value.en;
}

/** Vector map of `pick(x, locale)` for arrays of localized leaves. */
export function pickAll(values: readonly Localized[], locale: Locale): string[] {
  return values.map((v) => pick(v, locale));
}

export type SportProfile = {
  slug: string;
  accent: string;
  vector: VectorKind;
  tagline: Localized;
  heroTitle: Localized;
  heroDescription: Localized;
  environment: Localized;
  features: { icon: string; title: Localized; description: Localized }[];
  showcase: { tag: Localized; title: Localized; description: Localized; icon: string }[];
  workflow: { title: Localized; description: Localized }[];
  testimonial: { quote: Localized; author: Localized; role: Localized; initials: string };
  highlights: Localized[];
};

export const sportProfiles: Record<string, SportProfile> = {
  soccer: {
    slug: "soccer",
    accent: "var(--sport-soccer)",
    vector: "pitch",
    tagline: { en: "Soccer academies", ar: "أكاديميات كرة القدم" },
    heroTitle: {
      en: "Run every squad, pitch, and matchday from one touchline",
      ar: "أدر كل فريق وملعب ومباراة من خط واحد",
    },
    heroDescription: {
      en: "From U6 skills groups to competitive travel teams, Academorix keeps rosters, training loads, match availability, and club dues moving without a single group chat.",
      ar: "من مجموعات المهارات تحت 6 سنوات إلى فرق السفر التنافسية، يُبقي أكاديموريكس التشكيلات وأحمال التدريب وتوافر المباريات ورسوم النادي في حركة، دون الحاجة إلى أي مجموعة دردشة.",
    },
    environment: {
      en: "Training ground · full-size & 5-a-side pitches",
      ar: "أرض التدريب · ملاعب كاملة وخماسية",
    },
    features: [
      {
        icon: "calendar",
        title: { en: "Fixture-aware scheduling", ar: "جدولة تراعي مواعيد المباريات" },
        description: {
          en: "Sync training around league fixtures, pitch bookings, and floodlight windows.",
          ar: "زامن التدريب مع مواعيد الدوري وحجوزات الملاعب وأوقات الإضاءة الكاشفة.",
        },
      },
      {
        icon: "persons",
        title: { en: "Squad & team rosters", ar: "تشكيلات الفرق واللاعبين" },
        description: {
          en: "Age-group squads, player positions, and coach assignments in one board.",
          ar: "فرق حسب الفئة العمرية ومراكز اللاعبين وتوزيع المدربين في لوحة واحدة.",
        },
      },
      {
        icon: "circle-check",
        title: { en: "Match availability", ar: "توافر المباريات" },
        description: {
          en: "Parents confirm availability in a tap so coaches pick squads early.",
          ar: "يؤكّد أولياء الأمور التوافر بلمسة، فيختار المدربون تشكيلاتهم مبكرًا.",
        },
      },
      {
        icon: "receipt",
        title: { en: "Club subscriptions", ar: "اشتراكات النادي" },
        description: {
          en: "Monthly dues, kit fees, and tour payments billed and reconciled automatically.",
          ar: "الرسوم الشهرية ورسوم الأطقم ومدفوعات الجولات، تُفوتر وتُسوَّى تلقائيًا.",
        },
      },
    ],
    showcase: [
      {
        tag: { en: "Roster", ar: "التشكيلة" },
        title: { en: "Matchday squad sheet", ar: "ورقة تشكيلة يوم المباراة" },
        description: {
          en: "Drag players into the starting XI and bench, print team sheets, and share lineups with parents.",
          ar: "اسحب اللاعبين إلى التشكيلة الأساسية والاحتياط، واطبع ورقة الفريق، وشارك التشكيلات مع أولياء الأمور.",
        },
        icon: "list-ul",
      },
      {
        tag: { en: "Attendance", ar: "الحضور" },
        title: { en: "Session check-in", ar: "تسجيل حضور الحصص" },
        description: {
          en: "Tap-to-mark attendance pitch-side, flag no-shows, and track training minutes per player.",
          ar: "سجّل الحضور بلمسة بجانب الملعب، وأشِر إلى المتغيّبين، وتتبّع دقائق التدريب لكل لاعب.",
        },
        icon: "circle-check",
      },
      {
        tag: { en: "Billing", ar: "الفوترة" },
        title: { en: "Season dues", ar: "رسوم الموسم" },
        description: {
          en: "Auto-charge monthly subscriptions with smart retries and a clear balance per family.",
          ar: "خصم شهري تلقائي مع إعادة محاولات ذكية ورصيد واضح لكل عائلة.",
        },
        icon: "credit-card",
      },
    ],
    workflow: [
      {
        title: { en: "Register & place players", ar: "سجّل اللاعبين ووزّعهم" },
        description: {
          en: "Import last season's roster or open online registration and auto-place players into age-group squads.",
          ar: "استورد تشكيلة الموسم الماضي أو افتح التسجيل عبر الإنترنت مع توزيع اللاعبين تلقائيًا حسب الفئة العمرية.",
        },
      },
      {
        title: { en: "Plan the training week", ar: "خطّط أسبوع التدريب" },
        description: {
          en: "Block pitches, assign coaches, and publish the schedule to every parent instantly.",
          ar: "احجز الملاعب، ووزّع المدربين، وانشر الجدول لكل ولي أمر فورًا.",
        },
      },
      {
        title: { en: "Run matchday", ar: "أدر يوم المباراة" },
        description: {
          en: "Collect availability, pick squads, and share team sheets, all from your phone.",
          ar: "اجمع التوافر، واختر التشكيلة، وشارك ورقة الفريق، كل ذلك من هاتفك.",
        },
      },
      {
        title: { en: "Collect dues on autopilot", ar: "حصّل الرسوم تلقائيًا" },
        description: {
          en: "Recurring subscriptions charge on schedule and reconcile into season reports.",
          ar: "الاشتراكات المتكررة تُخصم في مواعيدها وتُسوَّى ضمن تقارير الموسم.",
        },
      },
    ],
    testimonial: {
      quote: {
        en: "We manage 24 teams across two grounds. Academorix replaced our spreadsheets, WhatsApp groups, and three payment links with one system the whole club actually uses.",
        ar: "نُدير 24 فريقًا في ملعبَين. استبدل أكاديموريكس جداول البيانات ومجموعات واتساب وثلاث روابط دفع، بنظام واحد يستخدمه النادي كله فعلًا.",
      },
      author: { en: "Marco Nielsen", ar: "ماركو نيلسن" },
      role: { en: "Technical Director, Northgate FC", ar: "المدير الفني، نادي نورث جيت" },
      initials: "MN",
    },
    highlights: [
      { en: "Fixture & pitch conflicts", ar: "تعارضات المباريات والملاعب" },
      { en: "Availability polling", ar: "استطلاع التوافر" },
      { en: "Kit & tour payments", ar: "مدفوعات الأطقم والجولات" },
      { en: "Player development notes", ar: "ملاحظات تطوّر اللاعبين" },
    ],
  },
  swimming: {
    slug: "swimming",
    accent: "var(--sport-swimming)",
    vector: "lanes",
    tagline: { en: "Aquatic clubs", ar: "أندية السباحة" },
    heroTitle: {
      en: "Fill every lane and keep every swimmer progressing",
      ar: "املأ كل مسار وحافظ على تقدّم كل سبّاح",
    },
    heroDescription: {
      en: "Balance squad training, learn-to-swim programs, and masters sessions across lanes and pools, while stroke progressions and monthly billing take care of themselves.",
      ar: "وازن بين تدريبات الفرق وبرامج تعلّم السباحة وحصص الفئة الكبرى عبر المسارات والمسابح، فيما تُدار تدرجات الحركات والفوترة الشهرية تلقائيًا.",
    },
    environment: {
      en: "Aquatic center · 25m & 50m pools, multi-lane",
      ar: "المركز المائي · مسابح 25م و50م، متعددة المسارات",
    },
    features: [
      {
        icon: "calendar",
        title: { en: "Lane-level scheduling", ar: "جدولة حتى مستوى المسار" },
        description: {
          en: "Assign squads to lanes, cap capacity per lane, and avoid pool-space clashes.",
          ar: "وزّع الفرق على المسارات، وضع سقوفًا للسعة، وتجنّب تعارضات المسبح.",
        },
      },
      {
        icon: "chart-line",
        title: { en: "Stroke progressions", ar: "تدرّج الحركات" },
        description: {
          en: "Track stage completions and PBs so swimmers move up at the right time.",
          ar: "تتبّع إتمام المراحل والأرقام الشخصية ليصعد السبّاح إلى المرحلة التالية في الوقت المناسب.",
        },
      },
      {
        icon: "persons",
        title: { en: "Squad management", ar: "إدارة الفرق" },
        description: {
          en: "Development, performance, and masters squads with coach ratios per lane.",
          ar: "فرق تطوير وأداء وكبار مع نسبة مدرّبين لكل مسار.",
        },
      },
      {
        icon: "receipt",
        title: { en: "Squad billing", ar: "فوترة الفرق" },
        description: {
          en: "Monthly squad fees and learn-to-swim terms billed automatically.",
          ar: "رسوم الفرق الشهرية وفصول تعلّم السباحة تُفوتر تلقائيًا.",
        },
      },
    ],
    showcase: [
      {
        tag: { en: "Scheduling", ar: "الجدولة" },
        title: { en: "Lane allocation board", ar: "لوحة توزيع المسارات" },
        description: {
          en: "See every lane by session and drag squads into open water without overbooking.",
          ar: "شاهد كل مسار حسب الحصة واسحب الفرق إلى المسارات الشاغرة دون حجز زائد.",
        },
        icon: "sliders",
      },
      {
        tag: { en: "Progress", ar: "التقدّم" },
        title: { en: "Stage tracker", ar: "متتبّع المراحل" },
        description: {
          en: "Log stroke milestones and stage awards, and share progress with parents.",
          ar: "سجّل إنجازات الحركات وشهادات المراحل، وشارك التقدم مع أولياء الأمور.",
        },
        icon: "chart-line",
      },
      {
        tag: { en: "Billing", ar: "الفوترة" },
        title: { en: "Term & squad fees", ar: "رسوم الفصل والفرق" },
        description: {
          en: "Pro-rate mid-term joiners and auto-charge monthly squad subscriptions.",
          ar: "احتساب تناسبي للمنضمّين في منتصف الفصل مع خصم تلقائي للاشتراكات الشهرية.",
        },
        icon: "credit-card",
      },
    ],
    workflow: [
      {
        title: { en: "Set up pools & lanes", ar: "هيّئ المسابح والمسارات" },
        description: {
          en: "Model your pools, lanes, and session blocks so capacity is always accurate.",
          ar: "أدخل مسابحك ومساراتك وقوالب الحصص لتظل الطاقة الاستيعابية دقيقة دائمًا.",
        },
      },
      {
        title: { en: "Enroll swimmers", ar: "سجّل السبّاحين" },
        description: {
          en: "Place swimmers into squads or learn-to-swim stages with waitlists and auto-fill.",
          ar: "وزّع السبّاحين على الفرق أو مراحل تعلّم السباحة مع قوائم انتظار وتعبئة تلقائية.",
        },
      },
      {
        title: { en: "Track progression", ar: "تتبّع التقدّم" },
        description: {
          en: "Coaches log stroke milestones pool-side and swimmers advance automatically.",
          ar: "يسجّل المدربون إنجازات الحركات بجانب المسبح ويرتقي السبّاحون تلقائيًا.",
        },
      },
      {
        title: { en: "Bill the term", ar: "فوترة الفصل" },
        description: {
          en: "Recurring squad fees and term invoices charge and reconcile on schedule.",
          ar: "رسوم الفرق المتكررة وفواتير الفصل تُخصم وتُسوَّى وفق الجدول.",
        },
      },
    ],
    testimonial: {
      quote: {
        en: "Lane utilization jumped to 86% once we could see every session in one board. Progression tracking means no swimmer sits in the wrong squad anymore.",
        ar: "قفز استخدام المسارات إلى 86٪ بمجرد أن رأينا كل الحصص في لوحة واحدة. تتبّع التدرّج يعني ألا يبقى سبّاح في الفريق الخطأ بعد الآن.",
      },
      author: { en: "Elena Marsh", ar: "إيلينا مارش" },
      role: { en: "Head Coach, Riverside Aquatics", ar: "المدربة الأولى، ريڤرسايد أكواتيكس" },
      initials: "EM",
    },
    highlights: [
      { en: "Lane capacity caps", ar: "سقوف طاقة المسارات" },
      { en: "Stroke & stage awards", ar: "شهادات الحركات والمراحل" },
      { en: "Learn-to-swim terms", ar: "فصول تعلّم السباحة" },
      { en: "Masters memberships", ar: "عضويات الفئة الكبرى" },
    ],
  },
  gymnastics: {
    slug: "gymnastics",
    accent: "var(--sport-gymnastics)",
    vector: "apparatus",
    tagline: { en: "Gymnastics academies", ar: "أكاديميات الجمباز" },
    heroTitle: {
      en: "Rotate every apparatus and grade every gymnast with ease",
      ar: "دوّر كل جهاز واختبر كل لاعب جمباز بسهولة",
    },
    heroDescription: {
      en: "Recreational classes, competitive squads, and parent-and-tot sessions run smoothly with apparatus rotations, skill levels, and term billing designed for gymnastics.",
      ar: "تسير الحصص الترفيهية والفرق التنافسية وحصص الأمهات والأطفال بانسيابية مع دورات الأجهزة والمستويات والفوترة الفصلية المصممة للجمباز.",
    },
    environment: {
      en: "Gym hall · beam, vault, bars, floor",
      ar: "الصالة · عارضة التوازن، حصان القفز، العارضين، الأرضية",
    },
    features: [
      {
        icon: "sliders",
        title: { en: "Apparatus rotations", ar: "دورات الأجهزة" },
        description: {
          en: "Plan timed rotations across beam, vault, bars, and floor with coach coverage.",
          ar: "خطّط دورات موقوتة بين العارضة وحصان القفز والعارضَين والأرضية مع تغطية المدربين.",
        },
      },
      {
        icon: "medal",
        title: { en: "Skill levels & badges", ar: "المستويات والشارات" },
        description: {
          en: "Track level completions and award badges as gymnasts progress.",
          ar: "تتبّع اجتياز المستويات ومنح الشارات مع تقدّم اللاعبين.",
        },
      },
      {
        icon: "persons",
        title: { en: "Class ratios", ar: "نسبة الفصل" },
        description: {
          en: "Enforce coach-to-gymnast ratios per level for safe, compliant sessions.",
          ar: "افرض نسب المدرّب إلى اللاعب لكل مستوى لضمان حصص آمنة ومتوافقة.",
        },
      },
      {
        icon: "receipt",
        title: { en: "Term plans", ar: "خطط الفصل" },
        description: {
          en: "12-week term billing with sibling discounts and auto-renewal.",
          ar: "فوترة فصل مدتها 12 أسبوعًا مع خصومات الإخوة وتجديد تلقائي.",
        },
      },
    ],
    showcase: [
      {
        tag: { en: "Sessions", ar: "الحصص" },
        title: { en: "Rotation planner", ar: "مخطّط الدورات" },
        description: {
          en: "Build rotation timetables so every group cycles apparatus with the right coach.",
          ar: "أنشئ جداول دورات لتنتقل كل مجموعة بين الأجهزة مع المدرّب المناسب.",
        },
        icon: "sliders",
      },
      {
        tag: { en: "Progress", ar: "التقدّم" },
        title: { en: "Level & badge tracker", ar: "متتبّع المستوى والشارات" },
        description: {
          en: "Record skill sign-offs and issue digital badges parents can celebrate.",
          ar: "سجّل اعتماد المهارات وامنح شارات رقمية يحتفل بها الأهل.",
        },
        icon: "medal",
      },
      {
        tag: { en: "Billing", ar: "الفوترة" },
        title: { en: "Term invoicing", ar: "فوترة الفصل" },
        description: {
          en: "Charge term plans up front with pro-rating and family discounts.",
          ar: "احصّل خطط الفصل مقدّمًا مع احتساب تناسبي وخصومات العائلات.",
        },
        icon: "credit-card",
      },
    ],
    workflow: [
      {
        title: { en: "Build class levels", ar: "أنشئ مستويات الفصول" },
        description: {
          en: "Define recreational and competitive levels with capacity and coach ratios.",
          ar: "عرّف المستويات الترفيهية والتنافسية بسعتها ونسب مدربيها.",
        },
      },
      {
        title: { en: "Plan rotations", ar: "خطّط الدورات" },
        description: {
          en: "Timetable apparatus rotations and assign coaches to each station.",
          ar: "أنشئ جداول دورات الأجهزة وعيّن مدرّبًا لكل محطة.",
        },
      },
      {
        title: { en: "Grade & award", ar: "قيّم وامنح" },
        description: {
          en: "Sign off skills, advance levels, and issue badges automatically.",
          ar: "اعتمد المهارات، وارفع المستويات، وامنح الشارات تلقائيًا.",
        },
      },
      {
        title: { en: "Invoice the term", ar: "افتح فواتير الفصل" },
        description: {
          en: "Bill 12-week terms with discounts and reconcile every payment.",
          ar: "أرسل فواتير الفصل (12 أسبوعًا) مع الخصومات وسوِّ كل دفعة.",
        },
      },
    ],
    testimonial: {
      quote: {
        en: "Rotations used to live on a whiteboard. Now every coach sees their station, every parent sees progress, and terms bill themselves.",
        ar: "كانت الدورات على السبورة. الآن يرى كل مدرّب محطته، ويرى كل ولي أمر التقدّم، وتُفوتر الفصول نفسها.",
      },
      author: { en: "Bianca Rossi", ar: "بيانكا روسي" },
      role: { en: "Head of Gymnastics, Apex Gymnastics", ar: "رئيسة الجمباز، أبكس جيمناستكس" },
      initials: "BR",
    },
    highlights: [
      { en: "Timed apparatus rotations", ar: "دورات أجهزة موقوتة" },
      { en: "Level sign-offs", ar: "اعتماد المستويات" },
      { en: "Coach ratio safety", ar: "أمان نسبة المدرّب" },
      { en: "Sibling discounts", ar: "خصومات الإخوة" },
    ],
  },
  tennis: {
    slug: "tennis",
    accent: "var(--sport-tennis)",
    vector: "court",
    tagline: { en: "Tennis programs", ar: "برامج التنس" },
    heroTitle: {
      en: "Book every court and grow every player up the ladder",
      ar: "احجز كل ملعب وارفع كل لاعب في السلّم",
    },
    heroDescription: {
      en: "Group coaching, private lessons, and cardio tennis stay booked and billed across indoor and outdoor courts, with coaching ladders that keep players improving.",
      ar: "تدريب جماعي ودروس خاصة وتنس اللياقة، تظل محجوزة ومُفوترة عبر الملاعب الداخلية والخارجية، مع سلّم تدريب يُبقي اللاعبين في تحسّن مستمر.",
    },
    environment: {
      en: "Courts · indoor & outdoor, hard & clay",
      ar: "الملاعب · داخلية وخارجية، صلبة وترابية",
    },
    features: [
      {
        icon: "calendar",
        title: { en: "Court booking", ar: "حجز الملاعب" },
        description: {
          en: "Live court availability across surfaces with clash-free coach scheduling.",
          ar: "توافر مباشر للملاعب عبر السطوح مع جدولة مدربين خالية من التعارض.",
        },
      },
      {
        icon: "chart-column",
        title: { en: "Coaching ladders", ar: "سلالم التدريب" },
        description: {
          en: "Rank players and move them up groups as their level improves.",
          ar: "رتّب اللاعبين وارفعهم بين المجموعات مع تحسّن مستواهم.",
        },
      },
      {
        icon: "person",
        title: { en: "Private lessons", ar: "الدروس الخاصة" },
        description: {
          en: "One-to-one booking with per-coach rates and package tracking.",
          ar: "حجز فردي بأسعار لكل مدرّب مع تتبّع الباقات.",
        },
      },
      {
        icon: "receipt",
        title: { en: "Lesson billing", ar: "فوترة الدروس" },
        description: {
          en: "Charge packages, memberships, and pay-as-you-go lessons automatically.",
          ar: "احصّل الباقات والعضويات والدروس بالدفع الفوري تلقائيًا.",
        },
      },
    ],
    showcase: [
      {
        tag: { en: "Booking", ar: "الحجز" },
        title: { en: "Court grid", ar: "شبكة الملاعب" },
        description: {
          en: "See every court by hour and drop lessons into open slots without double-booking.",
          ar: "شاهد كل ملعب حسب الساعة وضع الدروس في الفتحات الشاغرة دون حجز مزدوج.",
        },
        icon: "sliders",
      },
      {
        tag: { en: "Players", ar: "اللاعبون" },
        title: { en: "Ladder & levels", ar: "السلّم والمستويات" },
        description: {
          en: "Track player ratings and promote them between coaching groups.",
          ar: "تتبّع تقييمات اللاعبين ورقّهم بين المجموعات.",
        },
        icon: "chart-column",
      },
      {
        tag: { en: "Billing", ar: "الفوترة" },
        title: { en: "Packages & memberships", ar: "الباقات والعضويات" },
        description: {
          en: "Sell lesson packages and auto-deduct as players attend.",
          ar: "بع باقات الدروس واخصم تلقائيًا مع حضور اللاعبين.",
        },
        icon: "credit-card",
      },
    ],
    workflow: [
      {
        title: { en: "Map courts & coaches", ar: "عيّن الملاعب والمدربين" },
        description: {
          en: "Model courts, surfaces, and coach availability for clash-free booking.",
          ar: "أدخل الملاعب والسطوح وتوافر المدربين لحجز بلا تعارضات.",
        },
      },
      {
        title: { en: "Enroll players", ar: "سجّل اللاعبين" },
        description: {
          en: "Place players into groups by level and open private-lesson booking.",
          ar: "وزّع اللاعبين على المجموعات حسب المستوى وافتح حجز الدروس الخاصة.",
        },
      },
      {
        title: { en: "Run the ladder", ar: "أدر السلّم" },
        description: {
          en: "Update ratings and promote players between groups as they improve.",
          ar: "حدّث التقييمات ورقّ اللاعبين بين المجموعات مع تحسّنهم.",
        },
      },
      {
        title: { en: "Bill packages", ar: "افوتر الباقات" },
        description: {
          en: "Charge memberships and lesson packages and reconcile every session.",
          ar: "احصّل العضويات وباقات الدروس وسوِّ كل حصة.",
        },
      },
    ],
    testimonial: {
      quote: {
        en: "Court utilization and private-lesson billing were our two biggest headaches. Both are now automatic, and our coaches finally trust the schedule.",
        ar: "كان استخدام الملاعب وفوترة الدروس الخاصة أكبر صداعين لدينا. الآن كلاهما آلي، وأخيرًا يثق مدربونا بالجدول.",
      },
      author: { en: "Sofia Duarte", ar: "صوفيا دوارتي" },
      role: { en: "Director of Tennis, Coastline Tennis", ar: "مديرة التنس، كوستلاين تنس" },
      initials: "SD",
    },
    highlights: [
      { en: "Multi-surface courts", ar: "ملاعب متعددة السطوح" },
      { en: "Player ratings", ar: "تقييمات اللاعبين" },
      { en: "Lesson packages", ar: "باقات الدروس" },
      { en: "Cardio tennis groups", ar: "مجموعات تنس اللياقة" },
    ],
  },
  athletics: {
    slug: "athletics",
    accent: "var(--sport-athletics)",
    vector: "track",
    tagline: { en: "Athletics clubs", ar: "أندية ألعاب القوى" },
    heroTitle: {
      en: "Coordinate every event squad, session, and meet",
      ar: "نسّق كل فريق فعّالية وحصة وبطولة",
    },
    heroDescription: {
      en: "Sprints, distance, and field-event squads train on schedule while meet logistics, PBs, and squad fees stay organized across your whole club.",
      ar: "فرق العَدو والمسافات ومسابقات الميدان تتدرّب وفق الجدول، بينما تظل لوجستيات البطولات والأرقام الشخصية ورسوم الفرق منظّمة في كامل النادي.",
    },
    environment: {
      en: "Track & field · 400m track and field zones",
      ar: "المضمار والميدان · مضمار 400م ومناطق الميدان",
    },
    features: [
      {
        icon: "calendar",
        title: { en: "Event squad sessions", ar: "حصص فرق الفعاليات" },
        description: {
          en: "Schedule sprint, distance, and field squads across track and field zones.",
          ar: "جدول فرق العَدو والمسافات والميدان عبر المضمار ومناطق الميدان.",
        },
      },
      {
        icon: "chart-line",
        title: { en: "PB & performance tracking", ar: "تتبّع الأرقام الشخصية والأداء" },
        description: {
          en: "Log times, distances, and personal bests to guide training.",
          ar: "سجّل الأزمنة والمسافات والأرقام الشخصية لتوجيه التدريب.",
        },
      },
      {
        icon: "flag",
        title: { en: "Meet logistics", ar: "لوجستيات البطولات" },
        description: {
          en: "Manage entries, travel, and event timetables for competition days.",
          ar: "أدر التسجيلات والسفر وجداول الفعاليات في أيام المنافسات.",
        },
      },
      {
        icon: "receipt",
        title: { en: "Squad fees", ar: "رسوم الفرق" },
        description: {
          en: "Season and monthly squad fees billed and reconciled automatically.",
          ar: "رسوم موسمية وشهرية للفرق تُفوتر وتُسوَّى تلقائيًا.",
        },
      },
    ],
    showcase: [
      {
        tag: { en: "Sessions", ar: "الحصص" },
        title: { en: "Squad timetable", ar: "جدول الفرق" },
        description: {
          en: "Plan event-group sessions across the track and field areas without clashes.",
          ar: "خطّط حصص المجموعات عبر المضمار والميدان دون تعارضات.",
        },
        icon: "sliders",
      },
      {
        tag: { en: "Performance", ar: "الأداء" },
        title: { en: "PB tracker", ar: "متتبّع الأرقام الشخصية" },
        description: {
          en: "Record marks by event and surface improvement trends over the season.",
          ar: "سجّل الأرقام حسب الفعّالية وأظهر اتجاهات التحسّن خلال الموسم.",
        },
        icon: "chart-line",
      },
      {
        tag: { en: "Meets", ar: "البطولات" },
        title: { en: "Meet entries", ar: "تسجيلات البطولات" },
        description: {
          en: "Collect event entries and share travel and timetable details with athletes.",
          ar: "اجمع تسجيلات الفعاليات وشارك تفاصيل السفر والجدول مع الرياضيين.",
        },
        icon: "flag",
      },
    ],
    workflow: [
      {
        title: { en: "Set up event squads", ar: "هيّئ فرق الفعاليات" },
        description: {
          en: "Create sprint, distance, and field squads with coaches and zones.",
          ar: "أنشئ فرق العَدو والمسافات والميدان بمدربين ومناطق.",
        },
      },
      {
        title: { en: "Publish training", ar: "انشر التدريب" },
        description: {
          en: "Schedule sessions and share the weekly plan with athletes and parents.",
          ar: "جدول الحصص وشارك الخطة الأسبوعية مع الرياضيين وأولياء الأمور.",
        },
      },
      {
        title: { en: "Track performance", ar: "تتبّع الأداء" },
        description: {
          en: "Log times and marks so coaches steer training with real data.",
          ar: "سجّل الأزمنة والأرقام ليقود المدربون التدريب ببيانات حقيقية.",
        },
      },
      {
        title: { en: "Manage meets", ar: "أدر البطولات" },
        description: {
          en: "Collect entries, organize travel, and bill season fees on schedule.",
          ar: "اجمع التسجيلات، ونظّم السفر، وأفوتر رسوم الموسم في مواعيدها.",
        },
      },
    ],
    testimonial: {
      quote: {
        en: "Between 18 meets a season and nine event squads, logistics were chaos. Academorix put entries, sessions, and fees in one place the whole club shares.",
        ar: "بين 18 بطولة في الموسم وتسع فرق فعاليات، كانت اللوجستيات فوضى. جمع أكاديموريكس التسجيلات والحصص والرسوم في مكان واحد يشاركه النادي كله.",
      },
      author: { en: "Tariq Hassan", ar: "طارق حسن" },
      role: { en: "Head Coach, Summit Athletics", ar: "المدرّب الأول، سَميت أثلتيكس" },
      initials: "TH",
    },
    highlights: [
      { en: "Event-group scheduling", ar: "جدولة مجموعات الفعاليات" },
      { en: "PB & mark tracking", ar: "تتبّع الأرقام الشخصية" },
      { en: "Meet entries & travel", ar: "تسجيلات البطولات والسفر" },
      { en: "Season squad fees", ar: "رسوم موسم الفرق" },
    ],
  },
  "martial-arts": {
    slug: "martial-arts",
    accent: "var(--sport-martial-arts)",
    vector: "mat",
    tagline: { en: "Dojos & academies", ar: "الدوجو والأكاديميات" },
    heroTitle: {
      en: "Track every belt, grading, and family membership",
      ar: "تتبّع كل حزام واختبار وعضوية عائلية",
    },
    heroDescription: {
      en: "Little dragons, adult classes, and sparring sessions run on schedule while belt progressions, grading events, and family memberships stay effortless.",
      ar: "حصص الأطفال والبالغين والمواجهات تسير وفق الجدول، بينما يبقى تدرّج الأحزمة واختبارات الترقية والعضويات العائلية بلا جهد.",
    },
    environment: {
      en: "Dojo · matted training floor",
      ar: "الدوجو · أرضية تدريب مبطّنة",
    },
    features: [
      {
        icon: "calendar",
        title: { en: "Class scheduling", ar: "جدولة الحصص" },
        description: {
          en: "Program kids, adults, and sparring classes with capacity and coach cover.",
          ar: "برمج حصص الأطفال والبالغين والمواجهات بسعة وتغطية مدرّب.",
        },
      },
      {
        icon: "medal",
        title: { en: "Belt progressions", ar: "تدرّج الأحزمة" },
        description: {
          en: "Track curriculum, stripes, and belt levels for every student.",
          ar: "تتبّع المنهج والشرائط ومستويات الأحزمة لكل طالب.",
        },
      },
      {
        icon: "flag",
        title: { en: "Grading events", ar: "اختبارات الترقية" },
        description: {
          en: "Run grading days with eligibility checks, entries, and certificates.",
          ar: "أدر أيام الاختبارات مع تحقّق من الأهلية وتسجيلات وشهادات.",
        },
      },
      {
        icon: "receipt",
        title: { en: "Family memberships", ar: "العضويات العائلية" },
        description: {
          en: "Recurring memberships with family plans and grading fees, billed automatically.",
          ar: "عضويات متكررة بخطط عائلية ورسوم اختبارات، تُفوتر تلقائيًا.",
        },
      },
    ],
    showcase: [
      {
        tag: { en: "Curriculum", ar: "المنهج" },
        title: { en: "Belt & stripe tracker", ar: "متتبّع الأحزمة والشرائط" },
        description: {
          en: "Log curriculum sign-offs and advance students through belt levels.",
          ar: "سجّل اعتماد المنهج وارفع الطلاب بين مستويات الأحزمة.",
        },
        icon: "medal",
      },
      {
        tag: { en: "Gradings", ar: "الترقيات" },
        title: { en: "Grading day manager", ar: "مدير يوم الترقية" },
        description: {
          en: "Check eligibility, take entries, and issue certificates for grading events.",
          ar: "تحقّق من الأهلية، وسجّل الترشيحات، وأصدر الشهادات لأيام الترقية.",
        },
        icon: "flag",
      },
      {
        tag: { en: "Billing", ar: "الفوترة" },
        title: { en: "Family memberships", ar: "العضويات العائلية" },
        description: {
          en: "Auto-charge recurring memberships with family discounts and grading fees.",
          ar: "خصم تلقائي للعضويات المتكررة مع خصومات العائلات ورسوم الاختبارات.",
        },
        icon: "credit-card",
      },
    ],
    workflow: [
      {
        title: { en: "Build your curriculum", ar: "ابنِ منهجك" },
        description: {
          en: "Define belts, stripes, and requirements for each program and age group.",
          ar: "عرّف الأحزمة والشرائط والمتطلبات لكل برنامج وفئة عمرية.",
        },
      },
      {
        title: { en: "Schedule classes", ar: "جدول الحصص" },
        description: {
          en: "Program classes with capacity and coach cover, and publish to members.",
          ar: "برمج الحصص بسعتها وتغطية مدرّبيها، وانشرها للأعضاء.",
        },
      },
      {
        title: { en: "Grade students", ar: "قيّم الطلاب" },
        description: {
          en: "Sign off curriculum, run grading events, and advance belts automatically.",
          ar: "اعتمد المنهج، وأدر أيام الاختبارات، وارفع الأحزمة تلقائيًا.",
        },
      },
      {
        title: { en: "Bill memberships", ar: "افوتر العضويات" },
        description: {
          en: "Recurring family memberships and grading fees charge and reconcile on schedule.",
          ar: "العضويات العائلية المتكررة ورسوم الترقية تُخصم وتُسوَّى وفق الجدول.",
        },
      },
    ],
    testimonial: {
      quote: {
        en: "Belt tracking and grading admin used to eat my weekends. Now memberships bill themselves and every student's progress is one tap away.",
        ar: "كانت متابعة الأحزمة وإدارة الترقيات تلتهم عطلاتي. الآن تُفوتر العضويات نفسها وتقدّم كل طالب على بُعد لمسة.",
      },
      author: { en: "Kenji Watanabe", ar: "كنجي واتانابي" },
      role: {
        en: "Chief Instructor, Vertex Martial Arts",
        ar: "المدرّب الرئيسي، ڤيرتكس مارشال آرتس",
      },
      initials: "KW",
    },
    highlights: [
      { en: "Belt & stripe curriculum", ar: "منهج الأحزمة والشرائط" },
      { en: "Grading eligibility", ar: "أهلية الترقية" },
      { en: "Family memberships", ar: "العضويات العائلية" },
      { en: "Certificate issuing", ar: "إصدار الشهادات" },
    ],
  },
};
