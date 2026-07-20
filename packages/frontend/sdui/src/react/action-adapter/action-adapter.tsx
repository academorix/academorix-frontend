/**
 * @file action-adapter.tsx
 * @module @stackra/sdui/react/action-adapter
 * @description Translates schema-level `ISduiAction` variants into
 *   `@stackra/actions` `IActionDescriptor` payloads at dispatch time.
 *
 *   Two responsibilities:
 *
 *   1. **Variant mapping** — each `ISduiAction.kind` becomes an
 *      `IActionDescriptor` with the matching framework `ActionKind`.
 *      `setState` / `toggleState` descriptors are auto-annotated with
 *      `storeToken: SDUI_RUNTIME_STORE` so the framework
 *      `SetStateHandler` routes them to the SDUI runtime store
 *      registered by `<SduiRuntimeProvider>`.
 *   2. **Response observation** — every dispatch resolves through this
 *      adapter, which forwards `response.notification` via
 *      `runtime.notify(...)` and emits `SDUI_EVENTS.ACTION_DISPATCHED`
 *      on the shared event bus so telemetry / dev-tools observe SDUI
 *      dispatches without subscribing to every schema node.
 */

import { useCallback } from 'react';
import { useOptionalInject } from '@stackra/container/react';
import { useActionDispatcher } from '@stackra/actions/react';
import type {
  IActionContext,
  IActionResponse,
  IEventEmitter,
  ISduiAction,
  ISduiSubmitFormAction,
} from '@stackra/contracts';
import { ActionKind, EVENT_EMITTER, SDUI_EVENTS, SDUI_RUNTIME_STORE } from '@stackra/contracts';
import type { ISduiRuntime } from '@stackra/contracts';
import { useSduiRuntime } from '../providers/sdui-runtime.provider';

/**
 * Result of `adaptAction` — the framework descriptor plus whether the
 * schema action fans out into a `Composite` (so the adapter knows to
 * merge form values before dispatching).
 */
interface AdaptResult {
  readonly descriptor: Parameters<ReturnType<typeof useActionDispatcher>>[0];
  readonly isSubmitForm?: true;
}

/**
 * Map an `ISduiAction` variant to a framework `IActionDescriptor`.
 *
 * Pure function — kept pure so it's straightforward to unit-test and
 * so the adapter's public surface (`useSduiActionAdapter`) can wrap
 * it with cross-cutting concerns.
 */
function adaptAction(action: ISduiAction): AdaptResult {
  switch (action.kind) {
    case 'navigate':
      return {
        descriptor: {
          kind: ActionKind.Navigate,
          to: action.to,
          external: action.external,
          replace: action.replace,
        } as never,
      };
    case 'toast':
      return {
        descriptor: {
          kind: ActionKind.Toast,
          status: action.status,
          title: action.title,
          message: action.description ?? action.title,
        } as never,
      };
    case 'openOverlay':
      return {
        descriptor: {
          kind: ActionKind.OpenOverlay,
          overlayId: action.overlayId,
          payload: action.payload as unknown,
        } as never,
      };
    case 'closeOverlay':
      return {
        descriptor: {
          kind: ActionKind.CloseOverlay,
          overlayId: action.overlayId,
        } as never,
      };
    case 'setState':
      // Substitute the SDUI runtime store as default `storeToken` so
      // the framework `SetStateHandler` routes schema-authored writes
      // to the registered SDUI store (registered by
      // `<SduiRuntimeProvider>` — see `SDUI_RUNTIME_STORE`).
      return {
        descriptor: {
          kind: ActionKind.SetState,
          path: action.path,
          value: action.value as unknown,
          storeToken: SDUI_RUNTIME_STORE,
        } as never,
      };
    case 'toggleState':
      return {
        descriptor: {
          kind: ActionKind.ToggleState,
          path: action.path,
          storeToken: SDUI_RUNTIME_STORE,
        } as never,
      };
    case 'callApi':
      return {
        descriptor: {
          kind: ActionKind.Mutate,
          endpoint: action.endpoint,
          method: action.method,
          body: action.body,
          assignTo: action.assignTo,
        } as never,
      };
    case 'submitForm':
      // Handled specially: adapter grabs form values, then wraps the
      // Mutate + onSuccess chain in a single `ICompositeAction` so the
      // whole submission traces as one dispatch (see caller below).
      return {
        descriptor: {
          kind: ActionKind.Mutate,
          endpoint: action.endpoint,
          method: action.method ?? 'POST',
        } as never,
        isSubmitForm: true,
      };
  }
}

/**
 * Signature of the dispatch callback returned by
 * {@link useSduiActionAdapter}.
 */
export type SduiActionDispatchCallback = (
  action: ISduiAction,
  context?: IActionContext
) => Promise<IActionResponse>;

/**
 * Return an `adapter(action, context?)` callback that translates a
 * schema-level `ISduiAction` into a framework dispatch and observes
 * the response.
 *
 * The returned callback:
 *
 * 1. Adapts the schema action to an `IActionDescriptor`.
 * 2. Overlays SDUI runtime metadata onto the action context.
 * 3. For `openOverlay`/`closeOverlay`, ALSO mirrors the change on the
 *    local SDUI runtime so overlays react even when the framework
 *    `OverlayRegistry` isn't wired (headless / test contexts).
 * 4. For `submitForm`, collects form values, wraps the Mutate + any
 *    `onSuccess` sequence as a `Composite`, and dispatches once.
 * 5. Awaits the response, forwards `response.notification` through
 *    `runtime.notify(...)`, emits `SDUI_EVENTS.ACTION_DISPATCHED` on
 *    the shared event bus.
 *
 * @returns Stable async callback that dispatches one schema action.
 *
 * @example
 * ```tsx
 * import { useSduiActionAdapter } from '@stackra/sdui/react';
 *
 * function SchemaNode({ node }: { node: ISduiNode }) {
 *   const dispatch = useSduiActionAdapter();
 *   return <button onClick={() => dispatch(node.actions.onPress[0])}>Go</button>;
 * }
 * ```
 */
export function useSduiActionAdapter(): SduiActionDispatchCallback {
  const dispatch = useActionDispatcher();
  const runtime = useSduiRuntime();
  const events = useOptionalInject<IEventEmitter>(EVENT_EMITTER);

  return useCallback(
    async (action: ISduiAction, context: IActionContext = {}): Promise<IActionResponse> => {
      // Every dispatch carries SDUI-specific bindings so framework
      // handlers can access the SDUI runtime when needed. The metadata
      // spread preserves any caller-provided fields.
      const augmented: IActionContext = {
        ...context,
        metadata: {
          ...(context.metadata ?? {}),
          sduiRuntime: runtime,
          getFormValues: runtime.getFormValues,
          openOverlay: runtime.openOverlay,
          closeOverlay: runtime.closeOverlay,
          notify: runtime.notify,
        },
      };

      // Overlay mutation strategy:
      //
      // - When `@stackra/ui/actions` is wired, the dispatched
      //   `OpenOverlayHandler`/`CloseOverlayHandler` writes to the
      //   framework `OverlayRegistry` and the SDUI runtime provider's
      //   subscription mirrors that back into local state — one source
      //   of truth, no double-write.
      // - When it isn't wired, the dispatched handler isn't registered
      //   (returns a "no handler" failure) — the schema still needs
      //   local overlay reactivity, so the adapter mutates the local
      //   runtime directly here. `runtime.openOverlay` internally
      //   detects OverlayRegistry presence via the same
      //   useOptionalInject, so this call is safe either way (it
      //   double-writes framework→local via subscription when both are
      //   set, but the framework itself is idempotent on repeated
      //   opens with the same id).
      //
      // Practically: the local call is the fallback path; the
      // subscription in the provider is the primary path when the
      // framework is wired.
      if (action.kind === 'openOverlay') runtime.openOverlay(action.overlayId);
      if (action.kind === 'closeOverlay') runtime.closeOverlay(action.overlayId);

      let response: IActionResponse;

      if (action.kind === 'submitForm') {
        // Compose Mutate + onSuccess into a single Composite so the
        // pipeline traces as ONE dispatch (matches the framework's
        // "one audit surface per intent" invariant) and stopOnFailure
        // semantics propagate through `onSuccess`.
        response = await dispatchSubmitForm(action, augmented, dispatch, runtime);
      } else {
        const { descriptor } = adaptAction(action);
        response = await dispatch(descriptor, augmented);
      }

      // Response observation — schemas can't manually chain notifications
      // or telemetry, so the adapter surfaces both automatically.
      if (response.notification) {
        runtime.notify({
          title: response.notification.title ?? response.notification.message,
          description: response.notification.title ? response.notification.message : undefined,
          status: response.notification.status,
        });
      }
      // Emit on the shared bus so dev-tools / telemetry can observe
      // every schema-driven dispatch without patching the renderer.
      void events?.emit(SDUI_EVENTS.ACTION_DISPATCHED, { action, response });

      return response;
    },
    [dispatch, runtime, events]
  );
}

/**
 * Dispatch a `submitForm` action as a single `Composite` descriptor.
 *
 * The Mutate carrying collected form values dispatches first; on
 * success, every action in `onSuccess` runs sequentially. `stopOnFailure`
 * defaults to `true` so a Mutate failure short-circuits `onSuccess`.
 *
 * Extracted from the adapter's main callback so the async flow stays
 * linear and easy to read.
 */
async function dispatchSubmitForm(
  action: ISduiSubmitFormAction,
  context: IActionContext,
  dispatch: ReturnType<typeof useActionDispatcher>,
  runtime: ISduiRuntime
): Promise<IActionResponse> {
  // Collect the form values imperatively — the form-value registry
  // lives on a ref inside the runtime so keystrokes don't cause
  // provider re-renders.
  const values = runtime.getFormValues(action.formId);
  const mutateDescriptor = {
    kind: ActionKind.Mutate,
    endpoint: action.endpoint,
    method: action.method ?? 'POST',
    body: values,
  } as const;

  // No onSuccess chain: dispatch the mutate directly to avoid an
  // unnecessary Composite wrapper for the common case.
  if (!action.onSuccess || action.onSuccess.length === 0) {
    return dispatch(mutateDescriptor as never, context);
  }

  // Compose Mutate + adapted onSuccess actions into a Composite. The
  // framework `CompositeHandler` walks the array; `stopOnFailure: true`
  // ensures the chain aborts if Mutate fails, so `onSuccess` truly runs
  // only on success.
  const onSuccessDescriptors = action.onSuccess.map((nested) => adaptAction(nested).descriptor);
  const composite = {
    kind: ActionKind.Composite,
    actions: [mutateDescriptor, ...onSuccessDescriptors],
    stopOnFailure: true,
  } as const;

  return dispatch(composite as never, context);
}
