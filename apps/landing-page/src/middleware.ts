/**
 * @file middleware.ts
 * @description
 * Edge-runtime middleware. Composes:
 *
 *   1. **Locale detection** — `next-intl` middleware reads
 *      `Accept-Language`, cross-references with the configured
 *      locales, and rewrites paths that need a locale prefix.
 *
 *   2. **Rate limiting** — an in-memory fixed-window limiter keyed
 *      on `(client IP, path)`. Applied only to POST + DELETE traffic
 *      so cache-friendly GETs are never blocked. Ships without a
 *      Redis dependency; pair with Cloudflare / Vercel firewalls
 *      for genuinely hostile traffic.
 */

import { NextResponse } from "next/server";
import createIntlMiddleware from "next-intl/middleware";

import type { NextRequest } from "next/server";

import { routing } from "@/i18n/routing";

const POST_LIMIT_PER_MINUTE = 100;
const WINDOW_MS = 60_000;

const buckets = new Map<string, { start: number; count: number }>();

function ratelimit(request: NextRequest): { allowed: boolean; remaining: number } {
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

const intlMiddleware = createIntlMiddleware(routing);

export default function middleware(request: NextRequest): NextResponse {
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

export const config = {
  matcher: [
    "/((?!api|_next|serwist|favicon.ico|manifest.webmanifest|robots.txt|sitemap.xml|brand|.*\\..*).*)",
  ],
};
