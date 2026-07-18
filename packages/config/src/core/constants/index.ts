/**
 * @file index.ts
 * @module @stackra/config/core/constants
 * @description Public API barrel for the `constants` category — one
 *   file per constant per `.kiro/steering/code-standards.md`.
 *
 *   The DI-facing tokens (`CONFIGURATION_TOKEN`,
 *   `CONFIGURATION_SERVICE_TOKEN`, `CONFIGURATION_LOADER`,
 *   `VALIDATED_ENV_LOADER`) live in `@stackra/contracts` and are
 *   imported directly by consumers — never re-exported from here
 *   per `.kiro/steering/contract-reexports.md`.
 */

export { PARTIAL_CONFIGURATION_KEY } from "./partial-configuration-key.constant";
export { PARTIAL_CONFIGURATION_PROPNAME } from "./partial-configuration-propname.constant";
export { AS_PROVIDER_METHOD_KEY } from "./as-provider-method-key.constant";
export { VALIDATED_ENV_PROPNAME } from "./validated-env-propname.constant";
export { DEFAULT_CONDITIONAL_TIMEOUT } from "./default-conditional-timeout.constant";
export { CONFIG_REDACTION_SENTINEL } from "./redaction-sentinel.constant";
