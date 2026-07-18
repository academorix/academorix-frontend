/**
 * @file placeholder-regex.constant.ts
 * @module @stackra/logger/enrichers
 * @description Regex for detecting interpolation placeholders in log messages.
 */

/** Matches `{variableName}` placeholders in log messages. */
export const PLACEHOLDER_REGEX = /\{(\w+)\}/g;
