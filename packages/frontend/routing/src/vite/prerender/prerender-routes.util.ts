/**
 * @file prerender-routes.util.ts
 * @module @stackra/routing/vite/prerender
 * @description Top-level orchestrator for the build-time prerender
 *   pipeline (per PLAN v3.9.2).
 *
 *   Flow (short form):
 *
 *   1. Load `react-router.config.ts` via {@link loadRouterConfig}.
 *   2. Bootstrap a build-time DI container from the app module (per
 *      `moduleFile` option). `STACKRA_PLATFORM=build` is set BEFORE
 *      the app module loads — see PLAN v3.12.7.
 *   3. Walk the route tree via {@link walkRoutes}.
 *   4. For every prerender-flagged route:
 *      a. Evaluate the lazy module (if any) to inspect `page.prerender`.
 *      b. Resolve param bags (`true` → `[{}]`; function → call it).
 *      c. For each param bag: substitute into the path, adapt the
 *         route tree via `toRrv7Routes`, render with `renderPrerender`,
 *         wrap in an HTML shell, and push to `outputs`.
 *   5. Return `{outputs, errors}` — the caller (plugin) writes the
 *      files.
 *
 *   Fail-soft: loader / render throws land in `errors`; `page.prerender`
 *   function throws propagate up and abort the walk (per plan).
 *
 *   The pipeline is testable in isolation — every step is a stand-
 *   alone utility. The plugin wires them together, this function does
 *   the same for programmatic callers (e.g. `pnpm stackra build`).
 */

import type { IApplication } from "@stackra/contracts";

import { toRrv7Routes } from "@/react/adapt-page-module/to-rrv7-routes.util";

import type { IPrerenderConfig } from "../interfaces/prerender-config.interface";
import type {
  IPrerenderError,
  IPrerenderOutput,
  IPrerenderResult,
} from "../interfaces/prerender-result.interface";
import { buildHtmlShell } from "./build-html-shell.util";
import { bootstrapBuildContainer } from "./bootstrap-build-container.util";
import { evaluateLazyRoute } from "./evaluate-lazy-route.util";
import { loadRouterConfig } from "./load-router-config.util";
import { renderPrerender, resolveRoutePath } from "./render-prerender.util";
import { walkRoutes, type IWalkedRoute } from "./walk-routes.util";

/**
 * Run the prerender pipeline end-to-end.
 *
 * @param config - Runtime configuration built by the plugin.
 * @returns The prerender result (outputs + errors).
 */
export async function prerenderRoutes(config: IPrerenderConfig): Promise<IPrerenderResult> {
  const outputs: IPrerenderOutput[] = [];
  const errors: IPrerenderError[] = [];

  // Step 1 — load the router config. A failure here IS a hard error
  // (missing config = build orchestrator error, not a runtime path).
  const routerConfig = await loadRouterConfig(config.configFile, config.root);
  const rootRoutes = routerConfig.routes;

  // Step 2 — bootstrap the DI container. Returns `null` when the
  // caller didn't supply a module file; the pipeline degrades to
  // "render without container" mode.
  const app = await bootstrapBuildContainer(config.moduleFile, config.root);

  // Step 3 — walk the tree. The walker attaches `hasSubdomainMatch`
  // to every entry so we know where to emit subdomain-scoped outputs.
  const walked = walkRoutes(rootRoutes);

  // Adapt the full tree ONCE — every render below uses the same
  // adapted tree seeded with a different `initialEntries` URL.
  const adaptedTree = toRrv7Routes(rootRoutes);

  // Step 4 — for each walked entry, look for a prerender spec + emit
  // one output per param bag.
  for (const entry of walked) {
    const specs = await collectPrerenderSpecs(entry, app);
    if (!specs || specs.length === 0) continue;

    for (const params of specs) {
      // Substitute the params into the route path. `resolveRoutePath`
      // throws when a param is missing — surface that as a captured
      // error (fail-soft) rather than crashing the whole walk.
      let concretePath: string;
      try {
        concretePath = resolveRoutePath(entry.fullPath, params);
      } catch (err) {
        errors.push({
          path: entry.fullPath,
          subdomain: null,
          error: coerceError(err),
        });
        continue;
      }

      // Emit under either the apex (no subdomain match anywhere in
      // the chain) or under every advertised dev subdomain (when
      // subdomain-scoped). We can't enumerate an arbitrary
      // subdomain predicate — emitting under each configured value
      // is the pragmatic v1 approach.
      const subdomainSet = entry.hasSubdomainMatch
        ? routerConfig.rootDomain
          ? extractDevSubdomains(config)
          : [null]
        : [null];

      for (const subdomain of subdomainSet) {
        try {
          const renderedHtml = await renderPrerender(adaptedTree, concretePath);
          const html = buildHtmlShell({
            renderedHtml,
            // F.3 does NOT extract runtime <SeoHead /> output — the
            // hydrated tree re-materialises head tags on mount, and
            // extracting them from the rendered string requires a
            // structured parse that's out of scope for v1. This is a
            // documented gap in the reporting; see the TODO markers.
            headHtml: "",
            clientEntries: config.clientEntries ?? [],
            clientStyles: config.clientStyles ?? [],
            baseUrl: config.baseUrl,
          });
          outputs.push({
            path: concretePath,
            subdomain,
            html,
          });
        } catch (err) {
          errors.push({
            path: concretePath,
            subdomain,
            error: coerceError(err),
          });
        }
      }
    }
  }

  return { outputs, errors };
}

// ── Internal ────────────────────────────────────────────────────────

/**
 * Extract dev-subdomain candidates from the runtime config. Empty
 * array falls back to `[null]` at the call site.
 */
function extractDevSubdomains(_config: IPrerenderConfig): readonly (string | null)[] {
  // v1: the plugin doesn't forward `devSubdomains` into the
  // `IPrerenderConfig` — subdomain enumeration lives on the plugin
  // options directly. When a future revision plumbs it through, this
  // helper reads the list and returns each entry.
  //
  // For now, apex-only emission is safe: consumers that need per-
  // subdomain outputs re-run the prerender per subdomain (via
  // `pnpm stackra build --subdomain=admin`).
  return [null];
}

/**
 * Read a route's prerender specs — either the record's `prerender`
 * (inline) OR the lazy module's `page.prerender`.
 *
 * @returns A list of param bags to prerender, or `null` when the
 *   route opts out.
 */
async function collectPrerenderSpecs(
  entry: IWalkedRoute,
  app: IApplication | null,
): Promise<readonly Readonly<Record<string, string>>[] | null> {
  // 1) Inline record-level prerender wins.
  const inline = entry.route.prerender;
  if (inline !== undefined) {
    return await resolvePrerenderSpec(inline, app);
  }

  // 2) Fall through to the lazy module's `page.prerender`.
  const lazy = entry.route.lazy;
  if (typeof lazy !== "function") return null;

  const evaluated = await evaluateLazyRoute(lazy);
  const pageSpec = evaluated?.page?.prerender;
  if (pageSpec === undefined) return null;

  // `page.prerender` types differ slightly from the record-level
  // prerender (function-form is always present + no literal array
  // form). Normalise via the same helper.
  return await resolvePrerenderSpec(pageSpec, app);
}

/**
 * Resolve a prerender specification into a list of concrete param
 * bags to render.
 */
async function resolvePrerenderSpec(
  spec: unknown,
  app: IApplication | null,
): Promise<readonly Readonly<Record<string, string>>[] | null> {
  // `false` / falsy → opt-out.
  if (spec === false || spec === undefined || spec === null) return null;

  // `true` → single output with an empty param bag.
  if (spec === true) return [{}];

  // Literal list of params (inline route case).
  if (Array.isArray(spec)) {
    return spec as readonly Readonly<Record<string, string>>[];
  }

  // Function form — the caller passes the DI container via
  // `IPrerenderContext`. When we don't have one (`moduleFile` was
  // omitted), we still call the function but pass a minimal stub —
  // the caller may not need the container.
  if (typeof spec === "function") {
    // The stub container never has any providers; every `get` throws
    // so downstream code can still handle the "no container"
    // path (usually by rethrowing, which lands in `errors`).
    const container: IApplication = app ?? createStubContainer();
    const result = await Promise.resolve(
      (spec as (ctx: { container: IApplication }) => unknown)({ container }),
    );
    if (!Array.isArray(result)) {
      throw new Error(
        `[@stackra/routing/vite] 'page.prerender' function must return an array of param bags.`,
      );
    }
    return result as readonly Readonly<Record<string, string>>[];
  }

  return null;
}

/**
 * Minimal `IApplication`-shaped stub for the "no module file"
 * degradation path.
 */
function createStubContainer(): IApplication {
  const notWired = (): never => {
    throw new Error(
      `[@stackra/routing/vite] No DI container was wired for prerender. ` +
        `Pass the 'moduleFile' option on router({...}) to supply one.`,
    );
  };
  return {
    get: notWired,
    getOptional: (): undefined => undefined,
    has: (): boolean => false,
  } as unknown as IApplication;
}

/**
 * Coerce an unknown throw value to a stable `Error` shape so the
 * pipeline's error records are uniformly typed.
 */
function coerceError(err: unknown): Error {
  if (err instanceof Error) return err;
  return new Error(String(err));
}
