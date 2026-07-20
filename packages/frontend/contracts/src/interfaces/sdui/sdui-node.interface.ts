/**
 * @file sdui-node.interface.ts
 * @module @stackra/contracts/interfaces/sdui
 * @description A single renderable node in the SDUI wire contract.
 */

import type { SduiBindable, ISduiExpression } from "./sdui-expression.interface";
import type { SduiScalar, SduiJsonValue } from "./sdui-primitive.type";
import type { ISduiAction } from "./sdui-action.interface";

/**
 * The logical interaction-event name a schema-level action attaches to.
 * Registry entries translate these into the underlying component's
 * event props (e.g. `onPress` → HeroUI's `onPress`).
 */
export type SduiInteractionEvent =
  "onPress" | "onSubmit" | "onChange" | "onSelectionChange" | "onOpenChange" | "onValueChange";

/**
 * A single node in an SDUI screen. Registry-keyed by `type` (dotted
 * compound keys allowed, e.g. `'Card.Header'`, `'KPI.Value'`).
 */
export interface ISduiNode {
  readonly id: string;
  readonly type: string;
  readonly props?: Readonly<Record<string, SduiJsonValue>>;
  readonly bindings?: Readonly<Record<string, SduiBindable>>;
  readonly actions?: Readonly<Partial<Record<SduiInteractionEvent, readonly ISduiAction[]>>>;
  readonly visibleIf?: ISduiExpression;
  readonly slots?: Readonly<Record<string, readonly ISduiNode[]>>;
  readonly className?: string;
  /** Leaf-value escape hatch (icons, text, ...). */
  readonly value?: SduiScalar;
}
