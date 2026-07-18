# @stackra/routing

Client-side routing for the Stackra framework — guards, middleware, SEO,
analytics, breadcrumbs, route modes (page / dialog / drawer / sheet), advanced
matchers (subdomain / query / header / hash), and a `defineRoute()` builder that
composes with React Router v7.

> **Phase F.1 — core.** This release ships the non-React CORE only. The React
> subpath (`@stackra/routing/react`) lands in F.2; the Vite plugin
> (`@stackra/routing/vite`) lands in F.3. Every symbol below is
> framework-agnostic and safe to import from a Node build script or a browser
> bundle alike.

## Install

```bash
pnpm add @stackra/routing @stackra/container @stackra/contracts @stackra/decorators \
  @stackra/error @stackra/events @stackra/logger @stackra/pipeline @stackra/support \
  react-router reflect-metadata
```

## Quick start (F.1 surface)

```typescript
import { Module } from "@stackra/container";
import {
  RoutingModule,
  defineRoute,
  defineLayout,
  definePage,
} from "@stackra/routing";
import { subdomain, query } from "@stackra/routing/matchers";
import { organization, article } from "@stackra/routing/seo";

@Module({
  imports: [
    RoutingModule.forRoot({
      basename: "/",
      rootDomain: "academorix.app",
      seo: {
        baseUrl: "https://academorix.app",
        defaults: {
          jsonLd: [
            organization({ name: "Academorix", url: "https://academorix.app" }),
          ],
        },
      },
    }),
  ],
})
export class AppModule {}
```

## Subpaths

| Import                      | Purpose                                                                     |
| --------------------------- | --------------------------------------------------------------------------- |
| `@stackra/routing`          | Core module + services (registry, matcher, middleware/guard resolvers, SEO) |
| `@stackra/routing/matchers` | Callable matcher builders — `subdomain`, `query`, `header`, `hash`          |
| `@stackra/routing/seo`      | JSON-LD builders (`article`, `organization`, `faqPage`, …)                  |
| `@stackra/routing/rrv7`     | Type-only re-exports of RRv7 primitives (`IRrvRouteObject`, …)              |
| `@stackra/routing/testing`  | Unit-test helpers (`createMockGuardContext`, `runGuard`, …)                 |

## What's coming later

- **F.2 — React subpath.** `<Link>`, `useNavigate()`, `<SeoHead />`,
  `<StackraRoutingProvider>`, `<OverlayOutlet />`, `<Breadcrumbs />`, dev-tools
  panel.
- **F.3 — Vite plugin.** `router()` plugin for dev subdomain wiring, build-time
  prerender pipeline, subdomain output split.
- **G — AI integration.** `<AiRouteContext>` + `navigateTool` binding.

## License

MIT
