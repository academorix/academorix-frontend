/**
 * @file index.ts
 * @module lib/module
 *
 * @description
 * Public barrel for the feature-module framework: the {@link AppModule} contract
 * and resource/route types, the auto-discovery {@link "@/lib/module/registry" registry},
 * and the shared {@link "@/lib/module/routes" routes}. Import module infrastructure
 * from `@/lib/module` rather than reaching into individual files.
 */

export * from "@/lib/module/module";
export * from "@/lib/module/registry";
export * from "@/lib/module/routes";
