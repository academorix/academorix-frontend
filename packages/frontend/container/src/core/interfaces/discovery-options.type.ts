/**
 * @file discovery-options.type.ts
 * Options for `DiscoveryService.getProviders()`.
 */
export type DiscoveryOptions = { include?: Function[] } | { metadataKey?: string };
