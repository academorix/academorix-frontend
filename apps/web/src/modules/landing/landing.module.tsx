/**
 * @file landing.module.tsx
 * @module modules/landing
 *
 * @description
 * Landing module manifest: contributes the public index route (`/`). No Refine
 * resource — the landing page is not a data-backed resource.
 */

import { createElement, lazy } from "react";

import type { AppModule } from "@/app/module";

const HomePage = lazy(() => import("@/modules/landing/pages/home-page"));

const landingModule: AppModule = {
  name: "landing",
  routes: [{ tier: "public", index: true, element: createElement(HomePage) }],
};

export default landingModule;
