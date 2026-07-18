/**
 * @file app.module.ts
 * @module @academorix/dashboard/app.module
 *
 * @description
 * Root DI module for the dashboard. Wired into React via
 * `ApplicationFactory.create(AppModule, await containerConfig())` in
 * `main.tsx`.
 *
 * Feature modules (`AuthModule`, `SettingsModule`, `RealtimeModule`, ...)
 * get imported here one at a time as they migrate to the `@stackra/*`
 * framework.
 *
 * ## Current imports
 *
 * ### `@stackra/config` — configuration + DI namespace registry
 *
 * `ConfigModule.forRoot({...})` runs FIRST so every downstream module
 * can inject `ConfigService` and reach any registered namespace via
 * `<namespaceConfig>.KEY`. `isGlobal: true` means feature modules do
 * NOT re-import `ConfigModule` to inject `ConfigService`.
 *
 * `load: [...]` lists every namespace factory the app owns. Even the
 * factories whose modules aren't wired yet (application/container/
 * cache/events/network/queue) are registered here so
 * `ConfigService.get('cache.prefix')` resolves at runtime — this is
 * how the dashboard exposes their values to devtools without pulling
 * in the full module wiring. When a module is wired later, its
 * `<X>Module.forRootAsync(<namespaceConfig>.asProvider())` call will
 * receive the exact same value.
 *
 * ### `@stackra/routing` — routing + middleware + SEO
 *
 * `RoutingModule.forRoot({...})` wires four subsystems under one
 * config:
 *
 *   - `MiddlewareModule` — HTTP/UI middleware pipeline (guards, gates,
 *     `redirect`/`notFound`/`abort` signals). Not yet consumed by the
 *     dashboard — kept available for the auth guard migration.
 *   - `GuardModule` — NestJS-style `ICanActivate` layer on top of
 *     middleware. Same "wired but unused" status as above.
 *   - `SeoModule` — site-wide SEO defaults merged with per-route
 *     descriptors and rendered by `<SeoHead />` from
 *     `@stackra/routing/react`.
 *   - `AnalyticsModule` — route-level analytics event dispatch.
 *
 * The dashboard remains a client-only SPA (see
 * `.kiro/steering/frontend-module-architecture.md`) — the routing
 * package is locked to `ssr: false` per PLAN v3.
 *
 * Route + middleware registration happens via
 * `RoutingModule.forFeature(...)` or the `@Middleware()` / `@Guard()`
 * decorators (auto-discovered). Neither is wired yet — the dashboard
 * keeps its existing `import.meta.glob` module registry
 * (`src/modules/registry.ts`) as the source of truth until we
 * intentionally migrate a route to `defineRoute()` colocation.
 *
 * ### Note: `RoutingModule.forRoot` still takes inline options
 *
 * The `RoutingModule` here is called with an inline options object
 * (basename + seo defaults). We deliberately do NOT rewrite this to
 * `RoutingModule.forRootAsync(routingConfig.asProvider())` — routing
 * is a private-to-this-branch surface that hasn't been mapped to a
 * `registerAs` factory yet. When it grows one, add a
 * `routing.config.ts` factory to the `load: [...]` list and switch
 * to `forRootAsync`.
 *
 * @example
 * ```ts
 * import { ApplicationFactory } from '@stackra/container';
 * import { AppModule } from '@/app.module';
 * import { containerConfig } from '@/config/container.config';
 *
 * // `registerAs` returns a factory — invoke + await at the boot site.
 * const app = await ApplicationFactory.create(AppModule, await containerConfig());
 * ```
 */

import { ConfigModule } from "@stackra/config";
import { Module } from "@stackra/container";
import { RoutingModule } from "@stackra/routing";

import { applicationConfig } from "@/config/application.config";
import { cacheConfig } from "@/config/cache.config";
import { containerConfig } from "@/config/container.config";
import { eventsConfig } from "@/config/events.config";
import { networkConfig } from "@/config/network.config";
import { queueConfig } from "@/config/queue.config";
import { AiAssistantService } from "@/services/ai-assistant";
import { CommandPaletteService } from "@/services/command-palette";
import { LocaleService } from "@/services/locale";
import { PasswordConfirmService } from "@/services/password-confirm";
import { ThemeService } from "@/services/theme";
import { AI_ASSISTANT_SERVICE } from "@/tokens/ai-assistant-service.token";
import { COMMAND_PALETTE_SERVICE } from "@/tokens/command-palette-service.token";
import { LOCALE_SERVICE } from "@/tokens/locale-service.token";
import { PASSWORD_CONFIRM_SERVICE } from "@/tokens/password-confirm-service.token";
import { THEME_SERVICE } from "@/tokens/theme-service.token";

/**
 * Root application module. Add feature modules to `imports` as they
 * are promoted from `packages/old/*` to `@stackra/*`.
 */
@Module({
  imports: [
    // `ConfigModule.forRoot` runs FIRST so every downstream module
    // resolves `ConfigService` + any namespace token through DI.
    // The returned `Promise<DynamicModule>` is a valid entry in
    // `imports` per the container's module-resolution semantics —
    // no `await` needed at the decorator call site.
    ConfigModule.forRoot({
      // `isGlobal: true` — every feature module can inject
      // `ConfigService` without re-importing `ConfigModule`.
      isGlobal: true,
      // `cache: true` — memoise `ConfigService.get(...)` reads.
      cache: true,
      // Register every namespace up-front so `ConfigService.get(...)`
      // returns the expected values even for namespaces whose modules
      // aren't wired yet (application / container / cache / events /
      // network / queue). Ordering here doesn't matter — each factory
      // is routed to its own `.KEY` slot on the internal config host.
      load: [
        applicationConfig,
        cacheConfig,
        containerConfig,
        eventsConfig,
        networkConfig,
        queueConfig,
      ],
    }),

    // Routing / middleware / SEO / analytics — app-wide config. Any
    // route-level SEO descriptor merges over the site defaults set
    // here. Concrete routes are registered by the app's
    // `react-router.config.ts` (build time) + `<StackraRoutingProvider>`
    // (runtime); route contributions from feature packages will
    // arrive through `RoutingModule.forFeature(...)` as they migrate.
    //
    // The plugin (dev) and the module (runtime) both need to know
    // about the same subdomain rules — every subdomain-adjacent
    // option below mirrors `apps/dashboard/src/config/vite.config.ts`.
    RoutingModule.forRoot({
      // ─── URL base ─────────────────────────────────────────────────
      //
      // Root-mounted SPA — passed through to RRv7's `basename`. Change
      // this ONLY if the SPA is served from a subpath (e.g.
      // `/dashboard/` behind a shared reverse proxy).
      basename: "/",

      // ─── Subdomain resolution (runtime) ──────────────────────────
      //
      // Mirrors the `router()` plugin. The plugin handles dev-time
      // subdomain simulation; this block handles runtime resolution
      // for any route that opts into `match.subdomain` in its
      // `defineRoute({...})`.
      rootDomain: "academorix.app",
      devMode: "localhost",
      allowDevSubdomainQuery: true,
      devSubdomains: ["www", "docs", "admin", "acme", "test"],

      // ─── AI routing hooks ────────────────────────────────────────
      //
      // When `true`, `@stackra/ai` is wired into the routing tree —
      // `<AiRouteContext>` mounts + the `navigateTool` binds against
      // the DI container. Off today because the app's AI surface is
      // still local (`AiAssistantProvider`) and hasn't migrated to the
      // framework AI module yet.
      ai: false,

      // ─── Devtools contributions ──────────────────────────────────
      //
      // Enables the routing devtools panel + inspector source inside
      // the `@stackra/devtools` overlay. Purely additive — the panel
      // renders only when devtools are otherwise mounted.
      devtools: true,

      // ─── Build-time prerender ────────────────────────────────────
      //
      // Mirrors the `router()` plugin's `prerender` block. Kept OFF
      // until the plugin's build-time TSX loader lands (see the TODO
      // in `src/config/vite.config.ts`).
      prerender: {
        enabled: false,
        // outputDir: 'prerender',
      },

      // ─── Fallback overrides ──────────────────────────────────────
      //
      // The framework ships default fallback components
      // (`DefaultLoadingFallback`, `DefaultPendingFallback`,
      // `DefaultErrorFallback`, `DefaultNotFoundFallback`,
      // `DefaultEmptyFallback` — all in `@stackra/routing/react`). We
      // opt into the defaults today; if the design system grows an
      // opinionated skeleton grid or empty-state art, plug them here
      // and every route inherits without touching the route tree.
      //
      // fallbacks: {
      //   LoadingComponent: MyLoadingSkeleton,
      //   PendingComponent: MyPendingIndicator,
      //   ErrorComponent: MyErrorBoundary,
      //   NotFoundComponent: MyNotFoundPage,
      //   EmptyComponent: MyEmptyState,
      // },

      // ─── Site-wide SEO defaults ──────────────────────────────────
      //
      // Every route's `seo` descriptor merges over this at render
      // time. `baseUrl` absolutises relative canonical / OpenGraph
      // URLs — set at deploy time via an env-driven overload if the
      // deployment target ever needs a different domain than the
      // production one.
      seo: {
        // baseUrl: 'https://app.academorix.com',  // set at deploy time
        defaults: {
          titleTemplate: "%s | Academorix Dashboard",
          openGraph: {
            siteName: "Academorix",
          },
        },
      },
    }),
  ],
  providers: [
    // ─── App-level container services ────────────────────────────
    //
    // Each service replaces a legacy `<XProvider>` context whose state
    // was app-wide (a "service in disguise" per
    // `.kiro/steering/communication-patterns.md` §Class-2). Consumers
    // read via a companion hook that bridges the service's reactive
    // store to React through `useSyncExternalStore`. The `useExisting`
    // aliases let callers `useInject(TOKEN)` OR `useInject(Class)` —
    // useful for tests and for framework hooks that expect a token.
    ThemeService,
    { provide: THEME_SERVICE, useExisting: ThemeService },
    LocaleService,
    { provide: LOCALE_SERVICE, useExisting: LocaleService },
    PasswordConfirmService,
    { provide: PASSWORD_CONFIRM_SERVICE, useExisting: PasswordConfirmService },
    CommandPaletteService,
    { provide: COMMAND_PALETTE_SERVICE, useExisting: CommandPaletteService },
    AiAssistantService,
    { provide: AI_ASSISTANT_SERVICE, useExisting: AiAssistantService },
  ],
  exports: [
    ThemeService,
    THEME_SERVICE,
    LocaleService,
    LOCALE_SERVICE,
    PasswordConfirmService,
    PASSWORD_CONFIRM_SERVICE,
    CommandPaletteService,
    COMMAND_PALETTE_SERVICE,
    AiAssistantService,
    AI_ASSISTANT_SERVICE,
  ],
})
export class AppModule {}
