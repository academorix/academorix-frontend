/**
 * @file index.ts
 * @module lib/refine
 *
 * @description
 * Cross-cutting Refine infrastructure — custom hooks and helpers that sit on
 * top of Refine and are shared across feature modules (not module-specific).
 * Module-only hooks live in `modules/<name>/hooks/`.
 */

export { useResourceLabel } from "@/lib/refine/use-resource-label";
