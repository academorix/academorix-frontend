/**
 * @file index.ts
 * @module @stackra/contracts/interfaces/actions
 * @description Barrel export for the framework Action contract.
 */

export type {
  IActionDescriptor,
  INavigateAction,
  IToastAction,
  IDialogAction,
  ISetStateAction,
  IToggleStateAction,
  IQueryAction,
  IMutateAction,
  ICompositeAction,
  IRefreshAction,
  IDownloadAction,
  IUploadAction,
  IOpenOverlayAction,
  ICloseOverlayAction,
  IRealtimeAction,
  IDispatchAction,
  IAiToolAction,
} from "./action-descriptor.interface";
export type { IActionResponse } from "./action-response.interface";
export type { IActionContext } from "./action-context.interface";
export type { IActionHandler } from "./action-handler.interface";
export type { IActionDispatcher } from "./action-dispatcher.interface";
export type { IPermissionResolver } from "./permission-resolver.interface";
export type { IActionsModuleOptions, IActionsConfig } from "./actions-module-options.interface";
