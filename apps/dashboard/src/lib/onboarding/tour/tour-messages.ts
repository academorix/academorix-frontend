/**
 * @file tour-messages.ts
 * @module onboarding/tour/tour-messages
 *
 * @description
 * The bilingual tour copy — every user-facing string the popover
 * shell renders. Kept in-module (not in `lib/i18n/messages.ts`) so
 * the tour ships as a self-contained slice: a future translation
 * pass can lift these keys into the shared catalog without touching
 * the tour runtime.
 *
 * Every string ties to a key referenced in
 * {@link "@/config/onboarding.config".TOUR_STEPS} (`titleKey`,
 * `bodyKey`, `ctaKey`) plus a small set of chrome keys owned by
 * this module (Back/Next/Skip/Finish, step counters, preface copy).
 *
 * The messages are Refine-i18n-provider-friendly: they resolve via
 * `useTranslate()` which reaches through the app's shared
 * {@link "@/lib/i18n/i18n-provider"} — the tour just adds its own
 * catalog layer. Falls back to English when a key is missing in the
 * active locale so a new tour string never surfaces as a raw key.
 */

import type { Locale } from "@/config/i18n.config";
import type { MessageCatalog } from "@/lib/i18n/i18n-provider";

/** English source catalog for the tour. */
const en: MessageCatalog = {
  // Step 1 — Sidebar workspace anchor.
  "onboarding.tour.workspace.title": "Everything is a workspace",
  "onboarding.tour.workspace.body":
    "Your data lives here — athletes, teams, sessions, payments. Try clicking one.",

  // Step 2 — Command palette trigger.
  "onboarding.tour.palette.title": "⌘K jumps you anywhere",
  "onboarding.tour.palette.body":
    "Fastest way to move around Academorix. Press ⌘K (Ctrl+K on Windows), type what you need.",
  "onboarding.tour.palette.cta": "Try it",

  // Step 3 — Notification bell.
  "onboarding.tour.notifications.title": "You'll never miss an alert",
  "onboarding.tour.notifications.body":
    "Late check-ins, failed payments, safeguarding flags — they all surface here.",

  // Step 4 — Settings gear.
  "onboarding.tour.settings.title": "Everything's tunable",
  "onboarding.tour.settings.body":
    "Branding, permissions, integrations, feature flags — all here. Have a look when you're ready.",

  // PWA preface (step 0).
  "onboarding.tour.pwa.title": "You're using the installed app",
  "onboarding.tour.pwa.body":
    "Academorix caches offline and updates automatically. Notifications keep you in the loop when the tab is closed.",

  // Desktop preface (step 0).
  "onboarding.tour.desktop.title": "We live in the menu bar too",
  "onboarding.tour.desktop.body":
    "Click the tray icon for quick actions — new athlete, new session, jump back to the app.",

  // Chrome + generic labels.
  "onboarding.tour.back": "Back",
  "onboarding.tour.next": "Next",
  "onboarding.tour.finish": "Finish",
  "onboarding.tour.skip": "Skip",
  "onboarding.tour.enableNotifications": "Enable notifications",
  "onboarding.tour.stepCounter": "Step {{current}} of {{total}}",

  // PWA welcome toast.
  "onboarding.tour.pwaToast.title": "Academorix installed",
  "onboarding.tour.pwaToast.body": "It'll work offline too.",

  // Desktop shortcut coachmark.
  "onboarding.tour.desktopShortcut.title": "Press ⌘ Shift A to raise Academorix",
  "onboarding.tour.desktopShortcut.body":
    "The global shortcut brings the app forward from anywhere. Change it in Settings → Desktop.",

  // Menu command.
  "menu.help.restart_tour": "Restart tour",
  "menu.finish": "Finish",
};

/**
 * Arabic catalog. Translates the high-traffic keys; anything missing
 * falls back to the English string via the provider's resolution
 * order (see `translateMessage`).
 */
const ar: MessageCatalog = {
  "onboarding.tour.workspace.title": "كل شيء يتم في مساحة العمل",
  "onboarding.tour.workspace.body":
    "بياناتك هنا — الرياضيون، الفرق، الحصص، المدفوعات. جرب النقر على أحدها.",

  "onboarding.tour.palette.title": "⌘K ينقلك أينما أردت",
  "onboarding.tour.palette.body":
    "أسرع طريقة للتنقل في Academorix. اضغط ⌘K (أو Ctrl+K على ويندوز) واكتب ما تحتاجه.",
  "onboarding.tour.palette.cta": "جرّبها",

  "onboarding.tour.notifications.title": "لن يفوتك أي تنبيه",
  "onboarding.tour.notifications.body":
    "التسجيلات المتأخرة، المدفوعات الفاشلة، تنبيهات السلامة — كلها تظهر هنا.",

  "onboarding.tour.settings.title": "كل شيء قابل للتخصيص",
  "onboarding.tour.settings.body":
    "الهوية البصرية، الصلاحيات، التكاملات، الميزات — كلها هنا. ألقِ نظرة حين تشعر بالاستعداد.",

  "onboarding.tour.pwa.title": "أنت تستخدم التطبيق المثبّت",
  "onboarding.tour.pwa.body":
    "يعمل Academorix دون اتصال ويتحدّث تلقائيًا. التنبيهات تُبقيك على اطّلاع حتى مع إغلاق التبويب.",

  "onboarding.tour.desktop.title": "نحن في شريط القوائم أيضًا",
  "onboarding.tour.desktop.body":
    "انقر أيقونة الشريط لإجراءات سريعة — إضافة رياضي، جدولة حصة، العودة للتطبيق.",

  "onboarding.tour.back": "رجوع",
  "onboarding.tour.next": "التالي",
  "onboarding.tour.finish": "إنهاء",
  "onboarding.tour.skip": "تخطي",
  "onboarding.tour.enableNotifications": "تفعيل التنبيهات",
  "onboarding.tour.stepCounter": "الخطوة {{current}} من {{total}}",

  "onboarding.tour.pwaToast.title": "تم تثبيت Academorix",
  "onboarding.tour.pwaToast.body": "يعمل دون اتصال أيضًا.",

  "onboarding.tour.desktopShortcut.title": "اضغط ⌘ Shift A لإظهار Academorix",
  "onboarding.tour.desktopShortcut.body":
    "الاختصار العام يُظهر التطبيق من أي مكان. عدّله من الإعدادات → سطح المكتب.",

  "menu.help.restart_tour": "إعادة تشغيل الجولة",
  "menu.finish": "إنهاء",
};

/** Tour message catalogs keyed by locale. */
export const TOUR_MESSAGES: Record<Locale, MessageCatalog> = { en, ar };
