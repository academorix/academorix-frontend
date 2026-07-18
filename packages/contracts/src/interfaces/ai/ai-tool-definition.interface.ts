/**
 * @file ai-tool-definition.interface.ts
 * @module @stackra/contracts/interfaces/ai
 * @description Metadata describing a client tool authored via `useAiTool`.
 */

/**
 * A client-tool definition.
 *
 * Its `parameters` are a zod schema at authoring time and a JSON schema once
 * converted for advertisement to the backend.
 */
export interface IAiClientToolDefinition {
  /** Unique tool name the backend calls by. */
  name: string;
  /** Human-readable description advertised to the model. */
  description: string;
  /** Parameter schema (zod at authoring → JSON schema when advertised). */
  parameters: unknown;
  /** Whether invocation requires explicit user approval. */
  requiresApproval?: boolean;
  /** Ordering/selection weight. */
  priority?: number;
  /** Namespacing scope so scope-distinct registrations coexist. */
  scope?: string;
  /**
   * Permission string forwarded onto the `IAiToolAction` descriptor when
   * the tool is invoked through the framework action pipeline. The
   * `AuthorizeMiddleware` checks it against the configured
   * `IPermissionResolver`; when absent the tool call bypasses
   * authorization (existing "no permission → skip" pipeline contract).
   * Convention: `ai.tool:<scope>:<name>` or a domain-specific string.
   */
  permission?: string;
}
