/**
 * @file proxy.ts
 * @module proxy
 *
 * @description
 * Edge proxy (formerly "middleware") that runs before every request
 * to the marketing site. Two concerns:
 *
 *   1. **Locale detection** — delegated to the `next-intl` middleware
 *      factory. It reads the URL segment > `NEXT_LOCALE` cookie >
 *      `Accept-Language` header > `routing.defaultLocale` chain to
 *      pick the visitor's locale, then rewrites bare URLs to the
 *      locale-prefixed variant, sets the `NEXT_LOCALE` cookie on
 *      locale-prefixed landings, and populates the
 *      `x-next-intl-locale` header so RSC + `getRequestConfig` can
 *      read the resolved locale server-side.
 *
 *   2. **Rate limiting** — a lightweight in-memory fixed-window
 *      limiter keyed on `(client IP, path)`. Applied only to POST /
 *      DELETE traffic so cache-friendly GETs are never blocked. This
 *      is best-effort per-node (a horizontally scaled deployment
 *      gets ~N-node capacity in aggregate); pair with Cloudflare /
 *      Vercel firewalls for genuinely hostile traffic. Upgrade to
 *      Upstash Redis when the traffic shape justifies the extra hop.
 *
 * ## Naming
 *
 * Next.js 16.2 renamed the `middleware.ts` file convention to
 * `proxy.ts`. Having both files in the same project is a build
 * error, so this module absorbs the (still-valuable) rate-limiting
 * work that shipped under the older name.
 *
 * See: https://nextjs.org/docs/app/api-reference/file-conventions/proxy
 */

import { NextResponse } from "next/server";
import createIntlMiddleware from "next-intl/middleware";

import type { NextRequest } from "next/server";

import { routing } from "@/i18n/routing";

// ═══════════════════════════════════════════════════════════════════
// Rate limiting
// ═══════════════════════════════════════════════════════════════════

/** Requests per minute allowed per (client IP, path) tuple. */
const POST_LIMIT_PER_MINUTE = 100;

/** Rolling window (milliseconds). */
const WINDOW_MS = 60_000;

/**
 * In-memory bucket. Keys are `<ip>:<path>`, values are
 * `{ start, count }` tuples. Cleaned lazily on read (see the
 * `now - existing.start > WINDOW_MS` reset branch below).
 */
const buckets = new Map<string, { start: number; count: number }>();

/**
 * Increment the bucket for this request, returning whether the
 * request should be allowed and how many requests remain in the
 * current window.
 */
function ratelimit(request: NextRequest): { allowed: boolean; remaining: number } {
  // Vercel + Cloudflare set `x-forwarded-for`; if neither exists we
  // fall back to a stable sentinel string so every unknown-IP request
  // shares a single bucket. That is intentional — the goal is to
  // shed noise before it hits the app; a single hostile actor with a
  // rotating IP pool needs proper WAF anyway.
  const forwardedFor = request.headers.get("x-forwarded-for");
  const clientIp = forwardedFor?.split(",")[0]?.trim() ?? "unknown";
  const key = `${clientIp}:${request.nextUrl.pathname}`;
  const now = Date.now();

  const existing = buckets.get(key);

  if (!existing || now - existing.start > WINDOW_MS) {
    buckets.set(key, { start: now, count: 1 });
    return { allowed: true, remaining: POST_LIMIT_PER_MINUTE - 1 };
  }

  existing.count += 1;

  return {
    allowed: existing.count <= POST_LIMIT_PER_MINUTE,
    remaining: Math.max(0, POST_LIMIT_PER_MINUTE - existing.count),
  };
}

// ═══════════════════════════════════════════════════════════════════
// Proxy
// ═══════════════════════════════════════════════════════════════════

const intlMiddleware = createIntlMiddleware(routing);

/**
 * Proxy entry. Rate-limits mutating verbs; then always runs the
 * next-intl middleware so the locale detection + rewriting happens
 * on every request regardless of method.
 */
export default function proxy(request: NextRequest): NextResponse {
  if (request.method === "POST" || request.method === "DELETE") {
    const { allowed, remaining } = ratelimit(request);
    if (!allowed) {
      return new NextResponse("Too Many Requests", {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil(WINDOW_MS / 1000)),
          "X-RateLimit-Limit": String(POST_LIMIT_PER_MINUTE),
          "X-RateLimit-Remaining": "0",
        },
      });
    }
    const response = intlMiddleware(request);
    response.headers.set("X-RateLimit-Limit", String(POST_LIMIT_PER_MINUTE));
    response.headers.set("X-RateLimit-Remaining", String(remaining));
    return response;
  }

  return intlMiddleware(request);
}

/**
 * Route-scoping config. Runs on every path except:
 *   - API routes (`/api/*`)
 *   - Next internals + Vercel internals (`_next`, `_vercel`)
 *   - Service-worker paths (`/serwist/*`)
 *   - Static assets — anything with a dot in the last path segment
 *     (favicon, images, sitemap, robots, OG images)
 */
export const config = {
  matcher: [
    "/((?!api|_next|_vercel|serwist|favicon.ico|manifest.webmanifest|robots.txt|sitemap.xml|brand|.*\\..*).*)",
  ],
};
