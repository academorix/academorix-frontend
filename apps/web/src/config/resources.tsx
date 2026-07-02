/**
 * @file resources.tsx
 * @module config/resources
 *
 * @description
 * The single Refine `resources` registry. Each entry maps a domain resource to
 * its list route and presentation metadata (label + sidebar icon). Refine uses
 * this for route/resource detection, breadcrumbs, and — via `useMenu()` — the
 * data that drives the app-shell sidebar.
 *
 * Adding a resource here surfaces it in the sidebar automatically; wire its
 * `<Route>` in `App.tsx` and drop a `public/data/<name>.json` fixture to make
 * it work end-to-end in mock mode.
 *
 * This is a `.tsx` file because `meta.icon` holds real React elements.
 */

import {
  AcademicCapIcon,
  BookOpenIcon,
  BuildingOffice2Icon,
  Squares2X2Icon,
  UserGroupIcon,
  UsersIcon,
} from "@academorix/ui/icons/outline";

import type { ResourceProps } from "@refinedev/core";

import { routes } from "@/config/routes";

/** Shared icon sizing for sidebar glyphs. */
const ICON_CLASS = "size-5";

/**
 * Every resource the app exposes. `dashboard` is an overview surface (not a
 * CRUD entity) but is modelled as a resource so it participates uniformly in
 * the sidebar menu and routing.
 */
export const resources: ResourceProps[] = [
  {
    name: "dashboard",
    list: routes.dashboard,
    meta: {
      label: "Dashboard",
      icon: <Squares2X2Icon aria-hidden="true" className={ICON_CLASS} />,
    },
  },
  {
    name: "students",
    list: routes.students,
    meta: {
      label: "Students",
      icon: <AcademicCapIcon aria-hidden="true" className={ICON_CLASS} />,
      canDelete: true,
    },
  },
  {
    name: "coaches",
    list: routes.coaches,
    meta: {
      label: "Coaches",
      icon: <UsersIcon aria-hidden="true" className={ICON_CLASS} />,
    },
  },
  {
    name: "courses",
    list: routes.courses,
    meta: {
      label: "Courses",
      icon: <BookOpenIcon aria-hidden="true" className={ICON_CLASS} />,
    },
  },
  {
    name: "teams",
    list: routes.teams,
    meta: {
      label: "Teams",
      icon: <UserGroupIcon aria-hidden="true" className={ICON_CLASS} />,
    },
  },
  {
    name: "branches",
    list: routes.branches,
    meta: {
      label: "Branches",
      icon: <BuildingOffice2Icon aria-hidden="true" className={ICON_CLASS} />,
    },
  },
];
