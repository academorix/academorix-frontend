/**
 * @file normalise-whitelabel.util.ts
 * @module @stackra/dashboard/core/utils
 * @description Normalise a whitelabel payload from the share dialog.
 *   Trims every string and drops empties. Returns `undefined` when no
 *   field survives so the record stays clean when the owner enables
 *   and then clears the section.
 */

import { Str } from "@stackra/support";

/**
 * Whitelabel input shape shared by
 * {@link IIssueEmbedTokenInput.whitelabel} and
 * {@link IEmbedTokenRecord.whitelabel}. Kept inline to avoid the noise
 * of a third interface — the shape is trivial and never leaks.
 */
export interface WhitelabelInput {
  /** Logo URL served in place of the framework isotipo. */
  logoUrl?: string;
  /** Accent colour applied as `--accent` on the viewer root. */
  accent?: string;
  /** Header welcome copy replacing the default. */
  welcomeText?: string;
}

/**
 * Trim + drop-empty pass on a whitelabel payload. Returns `undefined`
 * when nothing survives so the persisted record stays clean.
 *
 * @param input - Raw whitelabel payload.
 * @returns Trimmed payload, or `undefined` when nothing survives.
 */
export function normaliseWhitelabel(
  input: WhitelabelInput | undefined,
): WhitelabelInput | undefined {
  if (!input) return undefined;

  // `Str.trim(x ?? "")` collapses undefined → "" so a subsequent
  // `|| undefined` handles both "empty string after trim" and
  // "missing input" cases uniformly.
  const logoUrl = Str.trim(input.logoUrl ?? "") || undefined;
  const accent = Str.trim(input.accent ?? "") || undefined;
  const welcomeText = Str.trim(input.welcomeText ?? "") || undefined;

  if (!logoUrl && !accent && !welcomeText) return undefined;

  return { logoUrl, accent, welcomeText };
}
