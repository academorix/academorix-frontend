/**
 * @file checklist-messages.ts
 * @module modules/dashboard/widgets/onboarding-checklist/checklist-messages
 *
 * @description
 * The bilingual copy for the onboarding checklist widget — task labels,
 * task descriptions, and the widget chrome (header, buttons, footer). Kept
 * in-module (not in the shared catalog at `lib/i18n/messages.ts`) so the
 * checklist ships as a self-contained slice, mirroring the pattern used by
 * the tour under `src/onboarding/tour/tour-messages.ts`.
 *
 * The 12 tasks map 1:1 onto the entries in
 * {@link "@/config/onboarding.config".CHECKLIST_TASKS} — each `labelKey` /
 * `descriptionKey` referenced there resolves against this catalog. The
 * shared translator util (`use-checklist-translate`) reaches through this
 * table first and falls back to the raw key when a translation is missing.
 */

import type { Locale } from "@/config/i18n.config";
import type { MessageCatalog } from "@/lib/i18n/i18n-provider";

/**
 * English source catalog for the checklist widget. Anything user-facing the
 * widget renders resolves against this table.
 *
 * Keys are grouped in order: widget chrome first, then the 12 tasks in the
 * order they appear in {@link "@/config/onboarding.config".CHECKLIST_TASKS}.
 */
const en: MessageCatalog = {
  // -- Widget chrome ---------------------------------------------------------
  "onboarding.checklist.title": "Get started",
  "onboarding.checklist.description": "Complete these steps to launch your academy.",
  "onboarding.checklist.progress": "{{done}} of {{total}}",
  "onboarding.checklist.expand": "View all tasks",
  "onboarding.checklist.close": "Close",
  "onboarding.checklist.dismiss": "Dismiss checklist",
  "onboarding.checklist.hide": "Hide",
  "onboarding.checklist.markDone": "Mark done",
  "onboarding.checklist.undo": "Undo",
  "onboarding.checklist.doItNow": "Do it now",
  "onboarding.checklist.completeBadge": "Complete",
  "onboarding.checklist.allDone": "Setup complete",
  "onboarding.checklist.allDoneDescription": "You've finished the onboarding tasks. Well done!",

  // -- Task 1 — Complete your profile ---------------------------------------
  "onboarding.checklist.profile.label": "Complete your profile",
  "onboarding.checklist.profile.desc":
    "Confirm your name, timezone, and preferred locale so notifications look right.",

  // -- Task 2 — Invite your team --------------------------------------------
  "onboarding.checklist.team.label": "Invite your team",
  "onboarding.checklist.team.desc":
    "Bring your coaches and staff on board so you can assign them to sessions.",

  // -- Task 3 — Add your first branch ---------------------------------------
  "onboarding.checklist.branch.label": "Add your first branch",
  "onboarding.checklist.branch.desc": "Register the venue where your athletes train and compete.",

  // -- Task 4 — Create your first athlete -----------------------------------
  "onboarding.checklist.athlete.label": "Register your first athlete",
  "onboarding.checklist.athlete.desc":
    "Add an athlete so you can track their attendance, performance, and payments.",

  // -- Task 5 — Set up billing ----------------------------------------------
  "onboarding.checklist.billing.label": "Set up billing",
  "onboarding.checklist.billing.desc": "Connect a payment provider so families can pay online.",

  // -- Task 6 — Schedule your first session ---------------------------------
  "onboarding.checklist.session.label": "Schedule your first session",
  "onboarding.checklist.session.desc":
    "Publish a training session so athletes can book and attendance can start.",

  // -- Task 7 — Create your first team --------------------------------------
  "onboarding.checklist.team_create.label": "Create your first team",
  "onboarding.checklist.team_create.desc":
    "Group athletes into a squad so you can assign coaches and schedule sessions.",

  // -- Task 8 — Take your first attendance ----------------------------------
  "onboarding.checklist.attendance.label": "Take your first attendance",
  "onboarding.checklist.attendance.desc":
    "Check athletes in for a session so their attendance record starts building.",

  // -- Task 9 — Send your first invoice -------------------------------------
  "onboarding.checklist.invoice.label": "Send your first invoice",
  "onboarding.checklist.invoice.desc":
    "Issue an invoice so families receive their first payment request.",

  // -- Task 10 — Customize your branding ------------------------------------
  "onboarding.checklist.branding.label": "Customize your branding",
  "onboarding.checklist.branding.desc":
    "Upload your logo and pick brand colours so the workspace matches your identity.",

  // -- Task 11 — Install the app --------------------------------------------
  "onboarding.checklist.install.label": "Install the app",
  "onboarding.checklist.install.desc":
    "Add Academorix to your home screen or install the desktop app for offline access.",

  // -- Task 12 — Read the safeguarding guide --------------------------------
  "onboarding.checklist.safeguarding.label": "Read the safeguarding guide",
  "onboarding.checklist.safeguarding.desc":
    "Every academy has a safeguarding duty — read the guide before you go live.",
};

/**
 * Arabic catalog. Translates every key the English table declares; anything
 * missing at runtime falls back through the resolution order in
 * {@link "@/lib/onboarding/tour/use-tour-translate"} (translator → English →
 * caller default → raw key).
 */
const ar: MessageCatalog = {
  // -- Widget chrome ---------------------------------------------------------
  "onboarding.checklist.title": "لنبدأ",
  "onboarding.checklist.description": "أكمل هذه الخطوات لإطلاق أكاديميتك.",
  "onboarding.checklist.progress": "{{done}} من {{total}}",
  "onboarding.checklist.expand": "عرض كل المهام",
  "onboarding.checklist.close": "إغلاق",
  "onboarding.checklist.dismiss": "إخفاء القائمة",
  "onboarding.checklist.hide": "إخفاء",
  "onboarding.checklist.markDone": "تحديد كمكتمل",
  "onboarding.checklist.undo": "تراجع",
  "onboarding.checklist.doItNow": "قم بذلك الآن",
  "onboarding.checklist.completeBadge": "مكتمل",
  "onboarding.checklist.allDone": "اكتمل الإعداد",
  "onboarding.checklist.allDoneDescription": "لقد أنهيت مهام الإعداد. أحسنت!",

  // -- Task 1 — Complete your profile ---------------------------------------
  "onboarding.checklist.profile.label": "أكمل ملفك الشخصي",
  "onboarding.checklist.profile.desc":
    "أكّد اسمك ومنطقتك الزمنية ولغتك المفضّلة حتى تظهر التنبيهات بشكل صحيح.",

  // -- Task 2 — Invite your team --------------------------------------------
  "onboarding.checklist.team.label": "ادعُ فريقك",
  "onboarding.checklist.team.desc": "أضف مدرّبيك وطاقمك لتخصيصهم للحصص.",

  // -- Task 3 — Add your first branch ---------------------------------------
  "onboarding.checklist.branch.label": "أضف فرعك الأول",
  "onboarding.checklist.branch.desc": "سجّل المكان الذي يتدرّب فيه رياضيّوك ويتنافسون.",

  // -- Task 4 — Create your first athlete -----------------------------------
  "onboarding.checklist.athlete.label": "سجّل رياضيك الأول",
  "onboarding.checklist.athlete.desc": "أضف رياضيًا لتتبّع حضوره وأدائه ومدفوعاته.",

  // -- Task 5 — Set up billing ----------------------------------------------
  "onboarding.checklist.billing.label": "فعِّل الفوترة",
  "onboarding.checklist.billing.desc": "اربط مزوّد الدفع ليتمكّن الأهالي من الدفع أونلاين.",

  // -- Task 6 — Schedule your first session ---------------------------------
  "onboarding.checklist.session.label": "جدوِل حصّتك الأولى",
  "onboarding.checklist.session.desc":
    "انشر حصّة تدريبية ليتمكّن الرياضيون من الحجز وليبدأ الحضور.",

  // -- Task 7 — Create your first team --------------------------------------
  "onboarding.checklist.team_create.label": "أنشئ فريقك الأول",
  "onboarding.checklist.team_create.desc": "اجمع الرياضيين في فريق لتخصيص المدرّبين وجدولة الحصص.",

  // -- Task 8 — Take your first attendance ----------------------------------
  "onboarding.checklist.attendance.label": "سجّل الحضور لأول مرة",
  "onboarding.checklist.attendance.desc": "سجّل حضور الرياضيين في حصّة ليبدأ سجلّ الحضور بالبناء.",

  // -- Task 9 — Send your first invoice -------------------------------------
  "onboarding.checklist.invoice.label": "أصدر أول فاتورة",
  "onboarding.checklist.invoice.desc": "أصدر فاتورة ليتلقّى الأهالي طلب الدفع الأول.",

  // -- Task 10 — Customize your branding ------------------------------------
  "onboarding.checklist.branding.label": "خصّص هويّتك البصرية",
  "onboarding.checklist.branding.desc":
    "ارفع شعارك واختر ألوان العلامة لتتوافق مساحة العمل مع هويّتك.",

  // -- Task 11 — Install the app --------------------------------------------
  "onboarding.checklist.install.label": "ثبّت التطبيق",
  "onboarding.checklist.install.desc":
    "أضف Academorix إلى الشاشة الرئيسية أو ثبّت تطبيق سطح المكتب للعمل دون اتصال.",

  // -- Task 12 — Read the safeguarding guide --------------------------------
  "onboarding.checklist.safeguarding.label": "اقرأ دليل السلامة",
  "onboarding.checklist.safeguarding.desc":
    "على كل أكاديمية واجب حماية الأطفال — اقرأ الدليل قبل الانطلاق.",
};

/** Checklist message catalogs keyed by locale. */
export const CHECKLIST_MESSAGES: Record<Locale, MessageCatalog> = { en, ar };
