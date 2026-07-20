/**
 * @file build-html-shell.util.ts
 * @module @stackra/routing/vite/prerender
 * @description Wrap a rendered React tree + head fragment in a full
 *   HTML document shell (per PLAN v3.9.2 + v3.12.5).
 *
 *   Every emitted HTML file contains the `__STACKRA_NONCE__` placeholder
 *   on every `<script>` + `<style>` the shell owns. The runtime CSP
 *   middleware (or the app's edge worker) replaces the placeholder with
 *   the request-scoped nonce before serving.
 *
 *   The shell is deliberately conservative — no framework-specific
 *   markup beyond what react-dom's `renderToString` produced. Consumers
 *   who need a bespoke `<html>` structure own their root layout
 *   component; that markup ends up inside the rendered fragment.
 */

/**
 * Placeholder token replaced at request-serve time by the CSP nonce
 * middleware. Kept as a well-known string so the app's edge layer can
 * substitute it via a plain `String.prototype.replace`.
 */
export const NONCE_PLACEHOLDER = "__STACKRA_NONCE__";

/**
 * Input to `buildHtmlShell`.
 */
export interface IBuildHtmlShellInput {
  /**
   * The HTML rendered by `renderToString(<RouterProvider .../>)`.
   * Includes the app's `<html>` shell when the root layout renders
   * one — we detect the case + emit the shell verbatim.
   */
  readonly renderedHtml: string;

  /**
   * Extra `<head>` content the framework emitted via `<SeoHead />`.
   * When the rendered tree already contains a `<head>` element (root
   * layout style), this string is injected AT THE END of the head so
   * scalar tags (title, canonical, ...) override any framework
   * defaults set earlier in the head.
   */
  readonly headHtml: string;

  /**
   * Paths (relative to the emitted HTML's directory) of the client
   * entry scripts. Every path is wrapped in a `<script type="module"
   * src="...">` element with the nonce placeholder.
   */
  readonly clientEntries: readonly string[];

  /**
   * Paths (relative to the emitted HTML's directory) of the CSS
   * bundles. Every path is wrapped in a `<link rel="stylesheet"
   * href="...">` element.
   */
  readonly clientStyles: readonly string[];

  /**
   * Optional `<base href>` value — inserted so the emitted static
   * page resolves relative asset URLs correctly.
   */
  readonly baseUrl?: string;

  /**
   * Language attribute for `<html lang="...">`. Only used when the
   * rendered tree doesn't already include a `<html>` element.
   *
   * @default 'en'
   */
  readonly lang?: string;
}

/**
 * Build the full HTML shell.
 *
 * @param input - Rendered tree + head + asset links.
 * @returns Complete HTML document string, ready to write to disk.
 */
export function buildHtmlShell(input: IBuildHtmlShellInput): string {
  const { renderedHtml, headHtml, clientEntries, clientStyles, baseUrl, lang = "en" } = input;

  // Compose the head fragment — every asset link carries the nonce
  // placeholder so the runtime middleware can substitute it.
  const headFragmentParts: string[] = [];
  if (baseUrl) {
    // `<base>` MUST appear before any relative link/script — put it
    // at the top of the head fragment.
    headFragmentParts.push(`  <base href="${escapeAttr(baseUrl)}" />`);
  }
  for (const stylePath of clientStyles) {
    headFragmentParts.push(
      `  <link rel="stylesheet" href="${escapeAttr(stylePath)}" nonce="${NONCE_PLACEHOLDER}" />`,
    );
  }
  if (headHtml) {
    headFragmentParts.push(headHtml);
  }

  // The scripts fragment — every entry uses `type="module"` because
  // Vite's client build emits ESM.
  const scriptsFragment = clientEntries
    .map(
      (entryPath) =>
        `  <script type="module" src="${escapeAttr(entryPath)}" nonce="${NONCE_PLACEHOLDER}"></script>`,
    )
    .join("\n");

  // Detect whether the rendered tree already includes a `<html>`
  // element. Consumers who own a root layout that renders `<html>`
  // (Remix-style) get their shell used verbatim; we only inject the
  // framework parts INTO their tree via placeholder replacements.
  if (/<html[\s>]/i.test(renderedHtml)) {
    // Root layout owns the shell. Inject:
    //   - Head fragment right before `</head>`.
    //   - Scripts fragment right before `</body>`.
    let html = renderedHtml;
    const headFragment = headFragmentParts.filter((line) => line.length > 0).join("\n");
    if (headFragment) {
      html = html.replace(/<\/head>/i, `${headFragment}\n</head>`);
    }
    if (scriptsFragment) {
      html = html.replace(/<\/body>/i, `${scriptsFragment}\n</body>`);
    }
    // Prefix the doctype when missing so the browser stays in
    // standards mode.
    if (!/^\s*<!doctype/i.test(html)) {
      html = `<!DOCTYPE html>\n${html}`;
    }
    return html;
  }

  // No root `<html>` — synthesise a minimal shell around the
  // rendered fragment. Every emitted file gets the same doctype so
  // browsers stay in standards mode.
  const headFragment = headFragmentParts.filter((line) => line.length > 0).join("\n");
  return [
    "<!DOCTYPE html>",
    `<html lang="${escapeAttr(lang)}">`,
    "<head>",
    '  <meta charset="utf-8" />',
    '  <meta name="viewport" content="width=device-width, initial-scale=1" />',
    headFragment,
    "</head>",
    "<body>",
    `  <div id="root">${renderedHtml}</div>`,
    scriptsFragment,
    "</body>",
    "</html>",
  ]
    .filter((line) => line.length > 0)
    .join("\n");
}

/**
 * Escape a value for use inside a double-quoted HTML attribute.
 *
 * Kept tiny + local — the emitted paths come from Vite's build
 * output, so the exposure is minimal. Handles the four characters
 * that could actually break the attribute (double-quote, ampersand,
 * less-than, greater-than).
 */
function escapeAttr(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
