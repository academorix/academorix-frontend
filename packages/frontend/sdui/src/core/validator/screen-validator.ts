/**
 * @file screen-validator.ts
 * @module @stackra/sdui/core/validator
 * @description Client-side SDUI screen validator.
 *
 *   Walks an entire `ISduiScreen` and produces a flat list of issues
 *   with dotted paths (`root.slotName[nodeId]`). Consumed by the renderer
 *   in development mode (via `ISduiConfig.validateSchemas`) and by
 *   `assertValidScreen` for tests.
 */

import type { ISduiAction, ISduiNode, ISduiScreen } from "@stackra/contracts";

const SDUI_ACTION_KINDS: ReadonlySet<string> = new Set<ISduiAction["kind"]>([
  "navigate",
  "openOverlay",
  "closeOverlay",
  "setState",
  "toggleState",
  "submitForm",
  "callApi",
  "toast",
]);

/**
 * A single validation issue.
 */
export interface ISduiValidationIssue {
  /** Dotted path to the offending node. */
  readonly path: string;
  /** Human-readable message. */
  readonly message: string;
}

/**
 * Result of a validation pass.
 */
export interface ISduiValidationResult {
  readonly valid: boolean;
  readonly issues: readonly ISduiValidationIssue[];
}

/**
 * Anything that can answer whether it holds a component type. Passing
 * `null` is valid — the validator treats every type as unknown, so
 * type coverage is only checked when a registry is supplied.
 */
export interface IComponentRegistryLike {
  has(type: string): boolean;
}

/**
 * Validate an SDUI screen.
 *
 * @param screen - The screen to validate.
 * @param registry - Optional component registry — when supplied, node
 *   `type` values are checked against it.
 * @returns Validation result with every discovered issue.
 */
export function validateScreen(
  screen: ISduiScreen,
  registry: IComponentRegistryLike | null = null,
): ISduiValidationResult {
  const issues: ISduiValidationIssue[] = [];

  if (typeof screen.schemaVersion !== "number") {
    issues.push({ path: "screen", message: "`schemaVersion` is required and must be a number" });
  }
  if (!screen.root) {
    issues.push({ path: "screen", message: "`root` node is required" });
    return { valid: false, issues };
  }

  walk(screen.root, "root", issues, registry);
  return { valid: issues.length === 0, issues };
}

function walk(
  node: ISduiNode,
  path: string,
  issues: ISduiValidationIssue[],
  registry: IComponentRegistryLike | null,
): void {
  if (!node || typeof node !== "object") {
    issues.push({ path, message: "Node must be an object" });
    return;
  }
  if (typeof node.id !== "string" || node.id.length === 0) {
    issues.push({ path, message: "`id` must be a non-empty string" });
  }
  if (typeof node.type !== "string" || node.type.length === 0) {
    issues.push({ path, message: "`type` must be a non-empty string" });
  } else if (registry && !registry.has(node.type)) {
    issues.push({ path, message: `Unknown component type "${node.type}"` });
  }

  // Validate actions.
  if (node.actions) {
    for (const [eventName, actions] of Object.entries(node.actions)) {
      if (!Array.isArray(actions)) {
        issues.push({
          path: `${path}.actions.${eventName}`,
          message: `Expected an array of actions`,
        });
        continue;
      }
      for (const [index, action] of actions.entries()) {
        if (!action || typeof action !== "object" || typeof action.kind !== "string") {
          issues.push({
            path: `${path}.actions.${eventName}[${index}]`,
            message: "Action must be an object with a string `kind` field",
          });
          continue;
        }
        if (!SDUI_ACTION_KINDS.has(action.kind)) {
          issues.push({
            path: `${path}.actions.${eventName}[${index}]`,
            message: `Unknown action kind "${action.kind}"`,
          });
        }
      }
    }
  }

  // Recurse into slots.
  if (node.slots) {
    for (const [slotName, children] of Object.entries(node.slots)) {
      if (!Array.isArray(children)) {
        issues.push({ path: `${path}.slots.${slotName}`, message: "Slot must be an array" });
        continue;
      }
      for (const child of children) {
        walk(child, `${path}.${slotName}[${child?.id ?? "?"}]`, issues, registry);
      }
    }
  }
}

/**
 * Assert an SDUI screen validates cleanly; throws a diagnostic error
 * listing every issue.
 */
export function assertValidScreen(
  screen: ISduiScreen,
  registry: IComponentRegistryLike | null = null,
): void {
  const result = validateScreen(screen, registry);
  if (result.valid) return;
  const summary = result.issues.map((i) => `  • ${i.path}: ${i.message}`).join("\n");
  throw new Error(`Invalid SDUI screen:\n${summary}`);
}
