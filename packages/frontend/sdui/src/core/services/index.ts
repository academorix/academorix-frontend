/**
 * @file index.ts
 * @module @stackra/sdui/core/services
 * @description Public API barrel for the core `services` category —
 *   re-exports the default `NullSduiClient` fallback, the `SchemaCache`
 *   for schema lookups, and the top-level `SduiService`.
 */

export { NullSduiClient } from "./sdui-client.service";
export { SchemaCache } from "./schema-cache.service";
export { SduiService } from "./sdui.service";
