/**
 * @file index.ts
 * @module i18n/dictionaries
 *
 * @description
 * Aggregates every locale catalog into a single `CATALOGS` map consumed by
 * the runtime i18n provider. Adding a locale = add its file here.
 */

import type { Locale } from "@/i18n/config";
import type { MessageCatalog } from "@/i18n/i18n-provider";

import { ar } from "@/i18n/dictionaries/ar";
import { en } from "@/i18n/dictionaries/en";

/** Every catalog keyed by locale. */
export const CATALOGS: Record<Locale, MessageCatalog> = { en, ar };
