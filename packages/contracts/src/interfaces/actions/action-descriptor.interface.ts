/**
 * @file action-descriptor.interface.ts
 * @module @stackra/contracts/interfaces/actions
 * @description Base action descriptor plus the well-known descriptor
 *   variants (navigate, toast, dialog, ...).
 */

/**
 * Base action descriptor — a plain JSON-serializable object identifying
 * a single intended side effect by its `kind`.
 *
 * Every well-known variant extends this with a string-literal `kind`.
 * Apps declare their own descriptors with `IActionDescriptor<'my.custom'>`.
 */
export interface IActionDescriptor<K extends string = string> {
  readonly kind: K;

  /** Optional permission checked by the `AuthorizeMiddleware`. */
  readonly permission?: string;

  /** Opt out of authorization for this specific dispatch. */
  readonly authorize?: false;
}

/** `navigate` — push a route through the app's router. */
export interface INavigateAction extends IActionDescriptor<"navigate"> {
  to: string;
  external?: boolean;
  replace?: boolean;
  state?: unknown;
  /**
   * When `true`, the router skips restoring the scroll position on
   * the destination. Aligned with RRv7's `navigate(to, {preventScrollReset})`.
   *
   * @default false
   */
  preventScrollReset?: boolean;
}

/** `toast` — fire a fire-and-forget toast notification. */
export interface IToastAction extends IActionDescriptor<"toast"> {
  status?: "info" | "success" | "warning" | "danger";
  title?: string;
  message: string;
  description?: string;
}

/** `dialog` — open a named app-level dialog with an optional payload. */
export interface IDialogAction extends IActionDescriptor<"dialog"> {
  dialogId: string;
  payload?: unknown;
}

/** `setState` — write a value at a dotted path in a registered store. */
export interface ISetStateAction extends IActionDescriptor<"setState"> {
  path: string;
  storeToken?: symbol | string;
  value: unknown;
}

/** `toggleState` — flip a boolean at a dotted path in a registered store. */
export interface IToggleStateAction extends IActionDescriptor<"toggleState"> {
  path: string;
  storeToken?: symbol | string;
}

/** `query` — invalidate and/or refetch a cached query. */
export interface IQueryAction extends IActionDescriptor<"query"> {
  queryKey: readonly unknown[];
  refetch?: boolean;
  invalidate?: boolean;
}

/** `mutate` — execute a server mutation with optional optimistic updates. */
export interface IMutateAction extends IActionDescriptor<"mutate"> {
  resource?: string;
  endpoint?: string;
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  params?: Record<string, unknown>;
  optimisticUpdate?: unknown;
  assignTo?: string;
}

/** `composite` — run a list of descriptors sequentially. */
export interface ICompositeAction extends IActionDescriptor<"composite"> {
  actions: readonly IActionDescriptor[];
  stopOnFailure?: boolean;
}

/** `refresh` — invalidate one or more cached queries. */
export interface IRefreshAction extends IActionDescriptor<"refresh"> {
  keys?: readonly (readonly unknown[])[];
  resource?: string;
}

/** `download` — trigger a browser file download. */
export interface IDownloadAction extends IActionDescriptor<"download"> {
  endpoint: string;
  method?: "GET" | "POST";
  filename?: string;
  params?: Record<string, unknown>;
}

/** `upload` — POST a file (or several) to an endpoint. */
export interface IUploadAction extends IActionDescriptor<"upload"> {
  endpoint: string;
  method?: "POST" | "PUT" | "PATCH";
  files: readonly (File | Blob)[];
  fieldName?: string;
}

/** `openOverlay` — mark a named overlay as open. */
export interface IOpenOverlayAction extends IActionDescriptor<"openOverlay"> {
  overlayId: string;
  payload?: unknown;
}

/** `closeOverlay` — mark a named overlay as closed (or close the most recent). */
export interface ICloseOverlayAction extends IActionDescriptor<"closeOverlay"> {
  overlayId?: string;
}

/** `realtime` — subscribe, unsubscribe, or publish on a realtime channel. */
export interface IRealtimeAction extends IActionDescriptor<"realtime"> {
  channel: string;
  mode: "subscribe" | "unsubscribe" | "publish";
  event?: string;
  payload?: unknown;
}

/** `dispatch` — indirection to another registered action kind by name. */
export interface IDispatchAction extends IActionDescriptor<"dispatch"> {
  name: string;
  payload: IActionDescriptor;
}

/**
 * `ai.tool` — execute a locally-registered AI client tool.
 *
 * Bridge descriptor emitted by `@stackra/ai`'s `ToolExecutor` when the
 * `ACTION_DISPATCHER` is wired: the AI package handles zod validation,
 * approval, and result-posting to the backend; the actions pipeline
 * applies `Authorize → Log → Trace → handler`. When the dispatcher is
 * absent the executor falls back to invoking the registered handler
 * directly, so headless `@stackra/ai` still works.
 */
export interface IAiToolAction extends IActionDescriptor<"ai.tool"> {
  /** Name of the registered tool as advertised to the backend. */
  toolName: string;
  /** The originating tool-call id (matched against the AI stream). */
  toolCallId: string;
  /**
   * Arguments already validated / parsed against the tool's parameter
   * schema by `ToolExecutor` before dispatch.
   */
  args: unknown;
  /**
   * Registration scope for tools registered under `(name, scope)` in
   * `@stackra/ai`'s `ToolRegistry`. Passed through so consumers can
   * disambiguate in middleware if they need to.
   */
  scope?: string;
}
