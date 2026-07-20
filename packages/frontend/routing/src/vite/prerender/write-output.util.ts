/**
 * @file write-output.util.ts
 * @module @stackra/routing/vite/prerender
 * @description Write a prerender output to disk.
 *
 *   Each output writes to `<outputDir>/<subdomain?>/<path>/index.html`.
 *   Directories are created recursively (Node ≥ 22's `mkdir` with
 *   `{recursive: true}` handles every case).
 *
 *   The `<path>` value is normalised — leading `/` stripped, empty
 *   collapsed to the empty string, and every `:param` placeholder
 *   already substituted by the caller.
 */

import fs from "node:fs/promises";
import path from "node:path";

import type { IPrerenderOutput } from "../interfaces/prerender-result.interface";

/**
 * Compute the absolute file path a prerender output writes to.
 *
 * @param output    - The prerender output record.
 * @param outputDir - Absolute output directory (the Vite `outDir`
 *   augmented with the plugin's `prerender.outputDir` if set).
 */
export function computeOutputFilePath(output: IPrerenderOutput, outputDir: string): string {
  // Strip leading slashes so `path.join` doesn't reset back to root.
  const trimmedPath = output.path.replace(/^\/+/, "");

  // Subdomain scoping: `<outputDir>/<subdomain>/...`
  const parts: string[] = [outputDir];
  if (output.subdomain) parts.push(output.subdomain);

  if (trimmedPath.length > 0) {
    parts.push(trimmedPath);
  }
  parts.push("index.html");

  return path.join(...parts);
}

/**
 * Write a single prerender output to disk.
 *
 * @param output    - The prerender output.
 * @param outputDir - Absolute output directory.
 * @returns The absolute path written to.
 */
export async function writePrerenderOutput(
  output: IPrerenderOutput,
  outputDir: string,
): Promise<string> {
  const filePath = computeOutputFilePath(output, outputDir);
  const dir = path.dirname(filePath);

  // Recursive mkdir tolerates existing directories — no need to
  // stat first. `{recursive: true}` is the canonical Node ≥ 22
  // pattern for build-time file emission.
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(filePath, output.html, "utf8");

  return filePath;
}
