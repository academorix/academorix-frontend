/**
 * @file index.ts
 * @module providers/access-control
 *
 * @description
 * Re-exports the permission-based access-control provider. Authorization is
 * driven by the cached identity's permissions, so it works identically in mock
 * and REST modes (no env switch).
 */

export { accessControlProvider } from "@/providers/access-control/access-control-provider";
