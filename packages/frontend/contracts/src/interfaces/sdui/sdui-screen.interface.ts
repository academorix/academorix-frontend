/**
 * @file sdui-screen.interface.ts
 * @module @stackra/contracts/interfaces/sdui
 * @description The top-level SDUI wire document.
 */

import type { SduiJsonValue } from "./sdui-primitive.type";
import type { ISduiNode } from "./sdui-node.interface";
import type { ISduiThemeDocument } from "./sdui-theme.interface";

/**
 * Declarative data source — the server describes what to fetch, the
 * runtime executes it and merges the result into `$.data`.
 */
export interface ISduiDataSource {
  readonly id: string;
  readonly endpoint: string;
  readonly method?: "GET" | "POST";
  readonly body?: SduiJsonValue;
  /** Path under `$.data` to write the response to (defaults to `id`). */
  readonly assignTo?: string;
}

/**
 * The top-level SDUI document — the wire format the server returns.
 */
export interface ISduiScreen {
  readonly id: string;
  readonly path: string;
  readonly title: string;
  readonly schemaVersion: number;
  readonly theme?: ISduiThemeDocument;
  readonly data?: Readonly<Record<string, SduiJsonValue>>;
  readonly dataSources?: readonly ISduiDataSource[];
  /** Optional registry key of a layout component wrapping the root. */
  readonly layout?: string;
  readonly root: ISduiNode;
}

/**
 * The scope every SDUI expression evaluates against.
 */
export interface ISduiEvalScope {
  readonly data: Readonly<Record<string, unknown>>;
  readonly state: Readonly<Record<string, unknown>>;
  readonly user: Readonly<Record<string, unknown>>;
  readonly item?: unknown;
  readonly tenant?: Readonly<Record<string, unknown>>;
}
