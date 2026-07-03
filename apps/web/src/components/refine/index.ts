/**
 * @file index.ts
 * @module components/refine
 *
 * @description
 * Public barrel for the app's HeroUI-based Refine UI kit: action buttons, CRUD
 * view scaffolds, the breadcrumb trail, and the reusable resource DataGrid.
 * Feature modules compose these instead of re-implementing Refine plumbing.
 *
 * These are the HeroUI + HeroUI Pro equivalents of the Refine UI (shadcn) kit —
 * same coverage, our design system.
 */

export * from "@/components/refine/buttons";
export { Breadcrumbs } from "@/components/refine/breadcrumbs";
export { ResourceDataGrid } from "@/components/refine/resource-data-grid";
export * from "@/components/refine/views";
