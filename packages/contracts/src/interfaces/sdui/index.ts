/**
 * @file index.ts
 * @module @stackra/contracts/interfaces/sdui
 * @description Barrel for the Server-Driven UI wire contract.
 */

export type { SduiScalar, SduiJsonValue } from "./sdui-primitive.type";
export type {
  ISduiExpression,
  ISduiExpressionPath,
  ISduiExpressionOp,
  SduiBindable,
  SduiOperator,
} from "./sdui-expression.interface";
export type {
  ISduiAction,
  ISduiNavigateAction,
  ISduiOpenOverlayAction,
  ISduiCloseOverlayAction,
  ISduiSetStateAction,
  ISduiToggleStateAction,
  ISduiSubmitFormAction,
  ISduiCallApiAction,
  ISduiToastAction,
} from "./sdui-action.interface";
export type { ISduiNode, SduiInteractionEvent } from "./sdui-node.interface";
export type { ISduiThemeDocument, SduiThemeTokenName } from "./sdui-theme.interface";
export type { ISduiScreen, ISduiDataSource, ISduiEvalScope } from "./sdui-screen.interface";
export type { ISduiClient } from "./sdui-client.interface";
export type { ISduiRuntime, ISduiNotification } from "./sdui-runtime.interface";
export type { ISduiComponentEntry, ISduiLayoutEntry } from "./sdui-registry.interface";
export type { ISduiModuleOptions } from "./sdui-module-options.interface";
export type { ISduiPageDescriptor, ISduiPageResolution } from "./sdui-page-resolution.interface";
