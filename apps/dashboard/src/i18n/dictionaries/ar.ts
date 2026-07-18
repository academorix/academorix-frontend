/**
 * @file ar.ts
 * @module i18n/dictionaries/ar
 *
 * @description
 * Arabic (RTL) catalog. Translates the high-traffic keys; anything missing
 * falls back to the English source at render time.
 */

import type { MessageCatalog } from "@/i18n/i18n-provider";

export const ar: MessageCatalog = {
  "buttons.create": "إنشاء",
  "buttons.save": "حفظ",
  "buttons.edit": "تعديل",
  "buttons.delete": "حذف",
  "buttons.show": "عرض",
  "buttons.list": "القائمة",
  "buttons.clone": "نسخ",
  "buttons.refresh": "تحديث",
  "buttons.cancel": "إلغاء",
  "buttons.confirm": "هل أنت متأكد؟",
  "buttons.filter": "تصفية",
  "buttons.clear": "مسح",
  "buttons.export": "تصدير",
  "buttons.import": "استيراد",
  "buttons.notAccessTitle": "ليس لديك صلاحية للوصول",

  warnWhenUnsavedChanges: "لديك تغييرات غير محفوظة. هل تريد المغادرة؟",
  "pages.error.404": "عذرًا، الصفحة التي تبحث عنها غير موجودة.",
  "pages.error.resource404": "هل قمت بإنشاء هذا المورد؟",
  "pages.error.backHome": "العودة إلى الرئيسية",
  "table.actions": "إجراءات",

  "app.brand.name": "أكاديموريكس",
  "app.brand.subtitle": "مركز تحكم أكاديموريكس",
  "app.search.placeholder": "ابحث أو انتقل إلى…",
  "app.notifications": "الإشعارات",
  "app.help": "المساعدة",
  "app.account": "الحساب",
  "app.signIn": "تسجيل الدخول",
  "app.signOut": "تسجيل الخروج",
  "app.profile": "الملف الشخصي",
  "app.settings": "الإعدادات",
  "app.language": "اللغة",
  "app.theme": "المظهر",
  "app.appearance": "النمط",
  "app.loading": "جارٍ التحميل",
  "app.noData": "لا توجد بيانات",
  "app.comingSoon": "قريبًا",
  "app.emptyState.title": "لا توجد سجلات",
  "app.emptyState.description": "لا توجد بيانات لعرضها في هذا العرض حتى الآن.",
  "app.error.title": "تعذر تحميل البيانات",
  "app.error.description": "فشل الطلب. تحقق من اتصالك ثم أعد المحاولة.",
  "app.accessDenied.title": "تم رفض الوصول",
  "app.accessDenied.description": "ليس لديك إذن لعرض هذه الصفحة.",
};

Object.assign(ar, {
  "sidebar.group.overview": "نظرة عامة",
  "sidebar.group.people": "الأشخاص",
  "sidebar.group.programs": "البرامج",
  "sidebar.group.schedule": "الجدول",
  "sidebar.group.records": "السجلات",
  "sidebar.group.communications": "التواصل",
  "sidebar.group.growth": "النمو",
  "sidebar.group.finance": "المالية",
  "sidebar.group.administration": "الإدارة",
  "sidebar.group.ai": "الذكاء الاصطناعي",
  // Deprecated bucket, kept during the migration window.
  "sidebar.group.operations": "العمليات",
  "sidebar.group.other": "أخرى",
  "sidebar.group.pinned": "المثبَّتة",
  "sidebar.search.placeholder": "تصفية الوحدات…",
  "sidebar.chip.soon": "قريبًا",
  "sidebar.pin.add": "تثبيت في الأعلى",
  "sidebar.pin.remove": "إلغاء التثبيت",
  "sidebar.pin.empty": "لا توجد وحدات مثبَّتة",

  "command.title": "لوحة الأوامر",
  "command.placeholder": "اكتب أمرًا أو ابحث…",
  "command.section.navigate": "انتقل إلى · {group}",
  "command.section.create": "إنشاء · {group}",
  "command.section.actions": "إجراءات · {group}",
  "command.section.help": "المساعدة",
  "command.empty.title": "لا توجد أوامر مطابقة",
  "command.empty.description": "جرّب استعلامًا أقصر أو أعد الضبط بمفتاح Esc.",
  "command.verb.navigate": "انتقل إلى {label}",
  "command.verb.create": "أنشئ {label}",
  "command.help.shortcuts": "عرض اختصارات لوحة المفاتيح",
  "command.help.docs": "فتح التوثيق",
  "command.help.theme": "تغيير المظهر",
  "command.help.language": "تغيير اللغة",

  "theme.mode.light": "فاتح",
  "theme.mode.dark": "داكن",
  "theme.mode.system": "النظام",

  "shortcuts.title": "اختصارات لوحة المفاتيح",
  "shortcuts.hint": "اضغط ؟ في أي وقت لفتح هذه الورقة.",
  "shortcuts.category.application": "التطبيق",
  "shortcuts.category.navigate": "التنقل",
  "shortcuts.category.create": "إنشاء",
  "shortcuts.category.help": "المساعدة",
  "shortcuts.category.actions": "الإجراءات",

  "actions.title": "إجراءات",
  "actions.selected": "تم تحديد {count}",
  "actions.clearSelection": "مسح التحديد",
});
