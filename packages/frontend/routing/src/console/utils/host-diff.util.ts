/**
 * @file host-diff.util.ts
 * @module @stackra/routing/console/utils
 * @description Pure diff engine — compare an existing `/etc/hosts` content
 *   against the target state and describe the change (or lack thereof).
 *
 *   No side effects — the caller decides whether to write.
 */

import { Str } from "@stackra/support";

import { HOST_BLOCK_BEGIN, HOST_BLOCK_END } from "../constants";
import type { IHostDiff } from "../interfaces";

/**
 * Compute what needs to change in the hosts file.
 *
 * @param currentContent - The existing `/etc/hosts` content on disk.
 * @param newBlock - The rendered block (from `renderHostBlock`).
 * @param remove - When `true`, remove the managed block instead of inserting.
 * @returns Diff descriptor — `changed` flag, target content, human summary.
 */
export function computeHostDiff(
  currentContent: string,
  newBlock: string,
  remove: boolean,
): IHostDiff {
  // Detect an existing managed block via BEGIN / END markers.
  const beginIdx = currentContent.indexOf(HOST_BLOCK_BEGIN);
  const endIdx = currentContent.indexOf(HOST_BLOCK_END);
  const hasBlock = beginIdx !== -1 && endIdx !== -1 && endIdx > beginIdx;

  if (remove) {
    if (!hasBlock) {
      return {
        changed: false,
        nextContent: currentContent,
        summary: "No stackra block found — nothing to remove.",
      };
    }
    // Strip the block AND its surrounding blank lines so we don't
    // leave orphan blanks behind.
    const before = currentContent.slice(0, beginIdx).replace(/\n+$/, "\n");
    const after = currentContent.slice(endIdx + HOST_BLOCK_END.length).replace(/^\n+/, "");
    return {
      changed: true,
      nextContent: `${before}${after}`,
      summary: "Removed stackra block.",
    };
  }

  if (hasBlock) {
    // Replace the managed block in place — same start/end anchors.
    const before = currentContent.slice(0, beginIdx);
    const after = currentContent.slice(endIdx + HOST_BLOCK_END.length);
    const next = `${before}${newBlock}${after}`;
    if (next === currentContent) {
      return {
        changed: false,
        nextContent: currentContent,
        summary: "Stackra block already up to date.",
      };
    }
    return {
      changed: true,
      nextContent: next,
      summary: "Updated stackra block.",
    };
  }

  // No block yet — append one at the end. Use a two-line separator
  // when the file doesn't end with a newline for readability.
  const separator = Str.endsWith(currentContent, "\n") ? "\n" : "\n\n";
  const next = `${currentContent}${separator}${newBlock}\n`;
  return {
    changed: true,
    nextContent: next,
    summary: "Appended stackra block.",
  };
}
