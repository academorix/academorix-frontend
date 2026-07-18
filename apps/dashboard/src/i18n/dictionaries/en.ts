/**
 * @file en.ts
 * @module i18n/dictionaries/en
 *
 * @description
 * English (source) catalog. Keys mirror Refine's translation namespace
 * (`buttons.*`, `pages.error.*`, `warnWhenUnsavedChanges`, `table.actions`)
 * plus app-owned namespaces (`app.*`, `sidebar.*`, `command.*`, `theme.*`).
 * Missing keys anywhere fall back through this dictionary.
 */

import type { MessageCatalog } from "@/i18n/i18n-provider";

export const en: MessageCatalog = {
  // Refine action buttons
  "buttons.create": "Create",
  "buttons.save": "Save",
  "buttons.edit": "Edit",
  "buttons.delete": "Delete",
  "buttons.show": "Show",
  "buttons.list": "List",
  "buttons.clone": "Clone",
  "buttons.refresh": "Refresh",
  "buttons.cancel": "Cancel",
  "buttons.confirm": "Are you sure?",
  "buttons.filter": "Filter",
  "buttons.clear": "Clear",
  "buttons.export": "Export",
  "buttons.import": "Import",
  "buttons.notAccessTitle": "You don't have permission to access",

  // Refine chrome
  warnWhenUnsavedChanges: "Are you sure you want to leave? You have unsaved changes.",
  "pages.error.404": "Sorry, the page you visited does not exist.",
  "pages.error.resource404": "Are you sure you have created this resource?",
  "pages.error.backHome": "Back home",
  "table.actions": "Actions",

  // App shell
  "app.brand.name": "Academorix",
  "app.brand.subtitle": "Academorix control center",
  "app.search.placeholder": "Search or jump to…",
  "app.notifications": "Notifications",
  "app.help": "Help",
  "app.account": "Account",
  "app.signIn": "Sign in",
  "app.signOut": "Sign out",
  "app.profile": "Profile",
  "app.settings": "Settings",
  "app.language": "Language",
  "app.theme": "Theme",
  "app.appearance": "Appearance",
  "app.loading": "Loading",
  "app.noData": "No data",
  "app.comingSoon": "Coming soon",
  "app.emptyState.title": "No records found",
  "app.emptyState.description": "There are no records to display for this view yet.",
  "app.error.title": "Couldn't load data",
  "app.error.description": "The request failed. Check your connection and try again.",
  "app.accessDenied.title": "Access denied",
  "app.accessDenied.description": "You don't have permission to view this page.",
};

Object.assign(en, {
  // Sidebar
  "sidebar.group.overview": "Overview",
  "sidebar.group.people": "People",
  "sidebar.group.programs": "Programs",
  "sidebar.group.schedule": "Schedule",
  "sidebar.group.records": "Records",
  "sidebar.group.communications": "Communications",
  "sidebar.group.growth": "Growth",
  "sidebar.group.finance": "Finance",
  "sidebar.group.administration": "Administration",
  "sidebar.group.ai": "AI",
  // Kept for the deprecation window while every module manifest
  // migrates off the legacy monolithic `operations` bucket.
  "sidebar.group.operations": "Operations",
  "sidebar.group.other": "Other",
  "sidebar.group.pinned": "Pinned",
  "sidebar.search.placeholder": "Filter modules…",
  "sidebar.chip.soon": "Soon",
  "sidebar.pin.add": "Pin to top",
  "sidebar.pin.remove": "Unpin",
  "sidebar.pin.empty": "No pinned modules yet",

  // Command palette
  "command.title": "Command palette",
  "command.placeholder": "Type a command or search…",
  "command.section.navigate": "Go to · {group}",
  "command.section.create": "Create · {group}",
  "command.section.actions": "Actions · {group}",
  "command.section.help": "Help",
  "command.empty.title": "No commands match",
  "command.empty.description": "Try a shorter query or reset with Esc.",
  "command.verb.navigate": "Go to {label}",
  "command.verb.create": "Create {label}",
  "command.help.shortcuts": "Show keyboard shortcuts",
  "command.help.docs": "Open documentation",
  "command.help.theme": "Change theme",
  "command.help.language": "Change language",

  // Theme
  "theme.mode.light": "Light",
  "theme.mode.dark": "Dark",
  "theme.mode.system": "System",

  // Shortcut sheet
  "shortcuts.title": "Keyboard shortcuts",
  "shortcuts.hint": "Press ? anywhere to open this sheet.",
  "shortcuts.category.application": "Application",
  "shortcuts.category.navigate": "Navigation",
  "shortcuts.category.create": "Create",
  "shortcuts.category.help": "Help",
  "shortcuts.category.actions": "Actions",

  // Row / bulk actions
  "actions.title": "Actions",
  "actions.selected": "{count} selected",
  "actions.clearSelection": "Clear selection",
});
