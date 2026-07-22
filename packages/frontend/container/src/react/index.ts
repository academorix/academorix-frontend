/**
 * @file index.ts
 * @stackra/container/react
 *
 * React bindings for the DI container.
 * Import from '@stackra/container/react' to use React hooks
 * and providers. This entry point requires React as a peer dependency.
 *
 * @module @stackra/container/react
 */

// Context
export { ContainerContext } from "./contexts/container";

// Hooks
export { useInject } from "./hooks/use-inject";
export { useContainer } from "./hooks/use-container";
export { useOptionalInject } from "./hooks/use-optional-inject";
export { useDiscovery } from "./hooks/use-discovery";
export { useDiscovered } from "./hooks/use-discovered";

// Provider
export { ContainerProvider } from "./providers/container/container.provider";

// ════════════════════════════════════════════════════════════════════════════════
// Devtools contribution — pending
//
// The `ContainerDevtoolsPanel` used to live under `./devtools/` and re-export
// from here. It depends on `@stackra/devtools`, `@stackra/support`, and
// `@stackra/ui` — none of which are promoted into the workspace yet. When
// those packages land, restore `src/react/devtools/` from `.ref/packages/`
// and add the export back below.
// ════════════════════════════════════════════════════════════════════════════════
