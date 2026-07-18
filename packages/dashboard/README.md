# @stackra/dashboard

Headless dashboard framework for the Stackra platform. Domain types, storage
adapter, widget registry, widget catalogue, React hooks, and DI module. Visual
components live in consuming apps — this package deliberately never imports
HeroUI or React Native primitives so the same framework drives web and mobile.

## Install

```bash
pnpm add @stackra/dashboard @stackra/container @stackra/contracts @stackra/support \
  react react-dom reflect-metadata
```

## Subpaths

| Import                       | Purpose                                                                              |
| ---------------------------- | ------------------------------------------------------------------------------------ |
| `@stackra/dashboard`         | Core module + storage + registries + types + errors + config + utils                 |
| `@stackra/dashboard/react`   | React hooks (`useDashboards`, `useDashboardEditor`, `useWidgetLayout`, …) + renderer |
| `@stackra/dashboard/testing` | Test helpers (dashboard + widget fixtures, in-memory storage adapter)                |

## Quick start

```typescript
import { Module } from "@stackra/container";
import { DashboardModule } from "@stackra/dashboard";

@Module({
  imports: [
    DashboardModule.forRoot({
      storage: {
        ownerId: "playground-user",
        tenantId: "playground-tenant",
      },
      widgets: [
        {
          key: "kpi-athletes",
          cohort: "numbers",
          title: "Athletes",
          description: "Total active athletes.",
          icon: "person",
          span: "third",
        },
      ],
    }),
  ],
})
export class AppModule {}
```

## What lives here vs. in the app

**In the package (headless):**

- Domain types (`Dashboard`, `WidgetInstance`, `LayoutItem`, …)
- Storage adapter contract + localStorage implementation
- Widget catalogue service (metadata + registration + lookup)
- Widget registry service (key → renderer factory)
- Built-in dashboards (Overview, Analytics) + templates
- Slugify + auto-layout helpers
- React hooks (`useDashboards`, `useDashboardEditor`, `useCurrentDashboard`,
  `useWidgetLayout`, `useWidgetKeyboardNav`)
- A thin `<WidgetRenderer>` component that dispatches via the registry
- DI module (`DashboardModule.forRoot()` / `forFeature()`)

**In consuming apps (UI):**

- Visual HeroUI components (customize panel, share dialog, widget grid, …)
- Concrete widget renderers (KPI cards, charts, agenda widgets)
- Route pages
- Refine resource manifests

## License

MIT
