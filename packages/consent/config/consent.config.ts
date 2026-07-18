/**
 * @file consent.config.ts
 * @module @stackra/consent/config
 * @description Default consent module configuration.
 *   Uses `defineConfig()` for type-safe IDE autocompletion. Labels are plain
 *   locale-keyed maps — no i18n runtime dependency.
 */

import { defineConfig } from '@stackra/consent';

export const consentConfig = defineConfig({
  // ──────────────────────────────────────────────────────────────────────────
  // │ Categories                                                             │
  // ──────────────────────────────────────────────────────────────────────────
  categories: [
    {
      slug: 'necessary',
      label: { en: 'Necessary', ar: 'ضروري' },
      description: { en: 'Essential cookies', ar: 'ملفات تعريف الارتباط الأساسية' },
      required: true,
      default: true,
    },
    {
      slug: 'functional',
      label: { en: 'Functional', ar: 'وظيفي' },
      description: { en: 'Enhanced functionality', ar: 'وظائف محسّنة' },
      required: false,
      default: true,
    },
    {
      slug: 'analytics',
      label: { en: 'Analytics', ar: 'تحليلات' },
      description: { en: 'Usage analytics', ar: 'تحليلات الاستخدام' },
      required: false,
      default: false,
    },
    {
      slug: 'marketing',
      label: { en: 'Marketing', ar: 'تسويق' },
      description: { en: 'Marketing cookies', ar: 'ملفات التسويق' },
      required: false,
      default: false,
    },
    {
      slug: 'advertising',
      label: { en: 'Advertising', ar: 'إعلانات' },
      description: { en: 'Ad targeting', ar: 'استهداف الإعلانات' },
      required: false,
      default: false,
    },
  ],

  // ──────────────────────────────────────────────────────────────────────────
  // │ Storage                                                                │
  // ──────────────────────────────────────────────────────────────────────────
  storage: 'localStorage',
  cookieName: 'consent_preferences',

  // ──────────────────────────────────────────────────────────────────────────
  // │ Behavior                                                               │
  // ──────────────────────────────────────────────────────────────────────────
  defaultMode: 'opt-in',
  emitEvents: true,
});
