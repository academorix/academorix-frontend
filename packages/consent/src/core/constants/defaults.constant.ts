/**
 * @file defaults.constant.ts
 * @module @stackra/consent/core/constants
 * @description Default values for the consent module configuration.
 *   Used as fallbacks when options are not explicitly provided.
 */

import type { IConsentCategory } from '@stackra/contracts';
import type { IConsentModuleOptions } from '../types';

/** Default storage key / cookie name for consent persistence. */
export const DEFAULT_COOKIE_NAME = 'consent_preferences';

/** Default cookie max age in seconds (365 days). */
export const DEFAULT_COOKIE_MAX_AGE = 31_536_000;

/** Default storage backend hint. */
export const DEFAULT_STORAGE = 'localStorage' as const;

/** Default consent mode. */
export const DEFAULT_MODE = 'opt-in' as const;

/** Default consent categories. Labels are plain locale-keyed maps. */
export const DEFAULT_CATEGORIES: IConsentCategory[] = [
  {
    slug: 'functional',
    label: { en: 'Functional', ar: 'وظيفي' },
    description: {
      en: 'Cookies that enable enhanced functionality and personalization.',
      ar: 'ملفات تعريف الارتباط التي تتيح وظائف محسّنة وتخصيصًا.',
    },
    required: false,
    default: true,
  },
  {
    slug: 'analytics',
    label: { en: 'Analytics', ar: 'تحليلات' },
    description: {
      en: 'Cookies that help us understand how you use our website.',
      ar: 'ملفات تعريف الارتباط التي تساعدنا في فهم كيفية استخدامك لموقعنا.',
    },
    required: false,
    default: false,
  },
  {
    slug: 'marketing',
    label: { en: 'Marketing', ar: 'تسويق' },
    description: {
      en: 'Cookies used to deliver targeted advertisements.',
      ar: 'ملفات تعريف الارتباط المستخدمة لتقديم إعلانات مستهدفة.',
    },
    required: false,
    default: false,
  },
  {
    slug: 'advertising',
    label: { en: 'Advertising', ar: 'إعلانات' },
    description: {
      en: 'Cookies used for advertising measurement and targeting.',
      ar: 'ملفات تعريف الارتباط المستخدمة لقياس واستهداف الإعلانات.',
    },
    required: false,
    default: false,
  },
];

/**
 * Fully-resolved default consent configuration, composed from the granular
 * defaults above. The single source of defaults for `mergeConfig`.
 */
export const DEFAULT_CONSENT_CONFIG: IConsentModuleOptions = {
  categories: DEFAULT_CATEGORIES,
  storage: DEFAULT_STORAGE,
  cookieName: DEFAULT_COOKIE_NAME,
  cookieMaxAge: DEFAULT_COOKIE_MAX_AGE,
  defaultMode: DEFAULT_MODE,
  logging: 'silent',
  emitEvents: true,
};
