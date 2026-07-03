/**
 * @file messages.ts
 * @module lib/i18n/messages
 *
 * @description
 * The message catalogs. Keys mirror Refine's translation namespace so the
 * framework's own strings (action buttons, unsaved-changes prompt, error pages)
 * localize automatically, plus an `app.*` namespace for our own UI.
 *
 * This is **groundwork**: the English catalog is the source of truth, and the
 * Arabic catalog translates the high-traffic keys. Any key missing from a
 * catalog falls back to the English `defaultMessage` Refine passes at the call
 * site, so the UI never shows a raw key.
 *
 * Per-tenant, per-resource *terminology* (e.g. "Athletes" → "Students") is a
 * separate mechanism sourced from `/auth/me`; see `@/lib/refine`.
 */

import type { Locale, MessageCatalog } from "@/lib/i18n/i18n.types";

/** English (source) catalog. */
const en: MessageCatalog = {
  "buttons.create": "Create",
  "buttons.save": "Save",
  "buttons.edit": "Edit",
  "buttons.delete": "Delete",
  "buttons.show": "Show",
  "buttons.list": "List",
  "buttons.cancel": "Cancel",
  "buttons.confirm": "Are you sure?",
  "buttons.filter": "Filter",
  "buttons.clear": "Clear",
  "buttons.refresh": "Refresh",
  "buttons.notAccessTitle": "You don't have permission to access",
  warnWhenUnsavedChanges: "Are you sure you want to leave? You have unsaved changes.",
  "pages.error.404": "Sorry, the page you visited does not exist.",
  "pages.error.resource404": "Are you sure you have created this resource?",
  "pages.error.backHome": "Back Home",
  "table.actions": "Actions",
  "app.language": "Language",
  "app.search": "Search",
  "app.loading": "Loading",
  "app.noData": "No data",
  "app.signOut": "Sign out",
};

/** Arabic catalog — translates the high-traffic keys; the rest falls back to English. */
const ar: MessageCatalog = {
  "buttons.create": "إنشاء",
  "buttons.save": "حفظ",
  "buttons.edit": "تعديل",
  "buttons.delete": "حذف",
  "buttons.show": "عرض",
  "buttons.list": "القائمة",
  "buttons.cancel": "إلغاء",
  "buttons.confirm": "هل أنت متأكد؟",
  "buttons.filter": "تصفية",
  "buttons.clear": "مسح",
  "buttons.refresh": "تحديث",
  "buttons.notAccessTitle": "ليس لديك صلاحية للوصول",
  warnWhenUnsavedChanges: "لديك تغييرات غير محفوظة. هل تريد المغادرة؟",
  "pages.error.404": "عذرًا، الصفحة التي تبحث عنها غير موجودة.",
  "pages.error.resource404": "هل قمت بإنشاء هذا المورد؟",
  "pages.error.backHome": "العودة إلى الرئيسية",
  "table.actions": "إجراءات",
  "app.language": "اللغة",
  "app.search": "بحث",
  "app.loading": "جارٍ التحميل",
  "app.noData": "لا توجد بيانات",
  "app.signOut": "تسجيل الخروج",
};

/** All catalogs keyed by locale. */
export const MESSAGES: Record<Locale, MessageCatalog> = { en, ar };
