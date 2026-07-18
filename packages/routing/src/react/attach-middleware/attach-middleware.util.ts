/**
 * @file attach-middleware.util.ts
 * @module @stackra/routing/react/attach-middleware
 * @description Wire the middleware + guard chain into an RRv7 route
 *   tree.
 *
 *   For every route with `middleware` and/or `guards` on its
 *   `handle[STACKRA_HANDLE]` bag, we wrap the route's `loader` in a
 *   function that:
 *     1. Resolves the merged chain via `MiddlewareResolverService`.
 *     2. Runs each entry through `@stackra/pipeline` (guards adapt to
 *        middleware-shaped pipes via `GuardAdapterService`).
 *     3. Catches redirect / notFound / abort signals and rethrows
 *        them as `Response` values so RRv7's error boundary catches
 *        them native.
 *     4. Invokes the original loader (if any) with the same args.
 *
 *   INTERNAL — not re-exported from `react/index.ts`. Only consumed
 *   by `<StackraRoutingProvider>`.
 */

import type { IApplication, ICanActivate, IGuardDecision, IMiddleware } from "@stackra/contracts";
import { MIDDLEWARE_RESOLVER } from "@stackra/contracts";
import { Pipeline } from "@stackra/pipeline";
import { redirect as rrRedirect } from "react-router";
import type { LoaderFunction, LoaderFunctionArgs, RouteObject } from "react-router";

import { STACKRA_HANDLE } from "@/core/constants";
import type { IResolvedPipelineEntry } from "@/core/interfaces";
import { MiddlewareAbortSignal, NotFoundSignal, RedirectSignal } from "@/middleware/signals";
import type { MiddlewareResolverService } from "@/middleware/services/middleware-resolver.service";

/**
 * Attachment environment — matches the `runOn` filter shape used by
 * the resolver. `'client'` for browser routers; `'server'` for
 * static/memory routers.
 */
export type AttachEnvironment = "client" | "server";

/**
 * Walk an RRv7 route tree and produce a NEW tree with middleware +
 * guard chains wired into every route's loader.
 *
 * The tree is not mutated — every node is cloned.
 *
 * @param routes      - RRv7 route tree (post `toRrv7Routes(...)`).
 * @param app         - DI container — used to resolve services.
 * @param environment - Attachment environment (`'client'` for browser
 *   routers, `'server'` for memory / static routers).
 */
export function attachMiddleware(
  routes: readonly RouteObject[],
  app: IApplication,
  environment: AttachEnvironment,
): RouteObject[] {
  return routes.map((route) => attachToRoute(route, app, environment));
}

// ── Internal ────────────────────────────────────────────────────────

function attachToRoute(
  route: RouteObject,
  app: IApplication,
  environment: AttachEnvironment,
): RouteObject {
  // The Stackra handle bag — this is where guards / middleware live
  // on the adapted route object.
  const handle = route.handle as Record<string | symbol, unknown> | undefined;
  const stackra = handle?.[STACKRA_HANDLE] as
    | {
        readonly guards?: readonly unknown[];
        readonly middleware?: readonly unknown[];
      }
    | undefined;
  const guards = stackra?.guards ?? [];
  const middleware = stackra?.middleware ?? [];
  const hasChain = guards.length > 0 || middleware.length > 0;

  // Recurse into children FIRST so parents rebuild against wrapped
  // children. Cheap for the common case (a few routes deep).
  const wrappedChildren = route.children
    ? attachMiddleware(route.children as readonly RouteObject[], app, environment)
    : undefined;

  // If the route has no chain AND no children, return as-is.
  if (!hasChain && !wrappedChildren) return route;

  const originalLoader = route.loader as LoaderFunction | undefined;

  const wrappedLoader: LoaderFunction | undefined =
    hasChain || originalLoader
      ? async (args: LoaderFunctionArgs) => {
          if (hasChain) {
            await runChain({
              guards,
              middleware,
              app,
              environment,
              args,
            });
          }
          if (typeof originalLoader === "function") {
            return await originalLoader(args);
          }
          return null;
        }
      : undefined;

  const cloned: RouteObject = {
    ...route,
    ...(wrappedLoader ? { loader: wrappedLoader } : {}),
    ...(wrappedChildren ? { children: wrappedChildren } : {}),
  } as RouteObject;

  return cloned;
}

/**
 * Run the merged guard + middleware chain for a single route.
 *
 * @throws Response — a `redirect(...)`, `notFound(...)`, or `abort(...)`
 *   fires here as an RRv7-native `Response` throw. RRv7's error
 *   boundary catches it and renders the error slot.
 */
async function runChain(args: {
  readonly guards: readonly unknown[];
  readonly middleware: readonly unknown[];
  readonly app: IApplication;
  readonly environment: AttachEnvironment;
  readonly args: LoaderFunctionArgs;
}): Promise<void> {
  const { guards, middleware, app, environment, args: loaderArgs } = args;
  void environment; // Environment filtering is applied by the resolver via `runOn`.

  const resolver = app.get(MIDDLEWARE_RESOLVER) as MiddlewareResolverService;
  const chain = resolver.resolve({
    guards,
    middleware,
  });

  const url = new URL(loaderArgs.request.url);

  // Instantiate every entry via the container. Guards fold to a
  // middleware-shaped pipe here — the shared pipe shape keeps the
  // Pipeline runner uniform.
  const pipes = chain.map((entry) => buildPipe(entry, app));

  try {
    await new Pipeline(app)
      .send({
        container: app,
        request: loaderArgs.request,
        response: new Response(),
        params: loaderArgs.params,
        url,
        state: {},
      })
      .through(pipes)
      .thenReturn();
  } catch (err) {
    // Redirect / notFound / abort signals convert to RRv7-native
    // Response throws so error boundaries catch them.
    if (err instanceof RedirectSignal) {
      throw rrRedirect(err.url, { status: err.status });
    }
    if (err instanceof NotFoundSignal) {
      throw new Response(err.reason, { status: 404 });
    }
    if (err instanceof MiddlewareAbortSignal) {
      const result = err.result;
      if (result instanceof Response) throw result;
      throw new Response(JSON.stringify(result), {
        headers: { "content-type": "application/json" },
      });
    }
    // Anything else — rethrow. RRv7's ErrorBoundary catches it.
    throw err;
  }
}

/**
 * Build one pipeline pipe from a resolved chain entry. Guards adapt
 * inline to a middleware-shaped `(ctx, next) => ...` so the runner
 * treats both entry kinds uniformly.
 */
function buildPipe(
  entry: IResolvedPipelineEntry,
  app: IApplication,
): (ctx: unknown, next: () => Promise<unknown>) => Promise<unknown> {
  if (entry.kind === "guard") {
    // Resolve the guard through the container — `@Injectable()`
    // dependencies land via constructor injection.
    const instance = app.get(entry.ctor as never) as ICanActivate;
    return async (ctx: unknown, next: () => Promise<unknown>): Promise<unknown> => {
      const decision = await instance.canActivate(ctx as never);
      // `true` — allow. Advance the pipeline.
      if (decision === true) return next();
      // `false` — deny. Emit a plain 403 so the error boundary catches.
      if (decision === false) {
        throw new NotFoundSignal("Access denied");
      }
      // Object decisions — map each tag to a signal throw.
      const d = decision as IGuardDecision;
      if ("allow" in d && d.allow) return next();
      if ("deny" in d && d.deny) {
        // Deny carries reason + status — surface as a Response so RRv7
        // renders the correct fallback.
        throw new Response(d.reason ?? "Access denied", {
          status: d.status ?? 403,
        });
      }
      if ("redirect" in d) {
        throw new RedirectSignal(d.redirect, d.status ?? 302);
      }
      if ("notFound" in d && d.notFound) {
        throw new NotFoundSignal(d.message ?? "Not Found");
      }
      if ("abort" in d) {
        throw new MiddlewareAbortSignal(d.abort);
      }
      // Unknown shape — allow by default (fail-soft).
      return next();
    };
  }

  // Middleware — resolve via the container so `@Injectable()`
  // dependencies are supplied. Handle-shape mirrors the pipeline's
  // native pipe signature.
  const instance = app.get(entry.ctor as never) as IMiddleware;
  return (ctx: unknown, next: () => Promise<unknown>): Promise<unknown> =>
    instance.handle(ctx as never, next as never);
}
