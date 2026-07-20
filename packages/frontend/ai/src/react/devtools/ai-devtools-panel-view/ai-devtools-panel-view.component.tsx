/**
 * @file ai-devtools-panel-view.component.tsx
 * @module @stackra/ai/react/devtools
 * @description React body of the `@stackra/devtools` AI panel.
 *
 *   Two-card layout: (1) orchestrator status + active client, (2) a
 *   placeholder for the recent-calls history buffer. The history
 *   buffer is intentionally deferred — the panel ships the empty
 *   state today, and a future PR wires a bounded FIFO
 *   `AiHistoryService` into `ChatOrchestrator` so entries populate
 *   automatically. Read-only: the panel does not fire prompts,
 *   cancel runs, or approve tool calls.
 *
 *   Status subscription: {@link ChatOrchestrator.onStatusChange} is
 *   a classic listener API, which is exactly what
 *   `useSyncExternalStore` needs — we adapt it via `subscribe` +
 *   `getSnapshot`. The snapshot returns the orchestrator's `status`
 *   getter directly; identity swaps naturally when the underlying
 *   string changes.
 */

import { type ReactElement, useCallback, useSyncExternalStore } from "react";
import { Card, Chip } from "@stackra/ui/react";

import type { OrchestratorStatus } from "@/core/services/chat-orchestrator.service";
import type { AiDevtoolsPanelViewProps } from "./ai-devtools-panel-view.interface";

/** Fallback status when no orchestrator is present. */
const IDLE_STATUS: OrchestratorStatus = "idle";

/**
 * Map an orchestrator status to a HeroUI `Chip` variant. Kept as a
 * pure function so React reconciles the chip identity cleanly.
 *
 * `primary` foregrounds the active (streaming) state; `secondary`
 * covers every quiescent state. HeroUI Pro's chip doesn't ship a
 * "danger" variant — the error label carries the semantic weight
 * in the text.
 */
function statusVariant(status: OrchestratorStatus): "primary" | "secondary" | "soft" | "tertiary" {
  switch (status) {
    case "streaming":
      return "primary";
    case "complete":
      return "soft";
    case "error":
    case "cancelled":
      return "tertiary";
    case "idle":
    default:
      return "secondary";
  }
}

/**
 * The AI devtools panel body.
 *
 * @param props - See {@link AiDevtoolsPanelViewProps}.
 * @returns The panel body — orchestrator status + recent-calls empty state.
 */
export function AiDevtoolsPanelView({
  orchestrator,
  client,
}: AiDevtoolsPanelViewProps): ReactElement {
  // Stable subscribe / getSnapshot callbacks so
  // `useSyncExternalStore` doesn't tear on re-renders.
  const subscribe = useCallback(
    (cb: () => void) => (orchestrator ? orchestrator.onStatusChange(cb) : () => {}),
    [orchestrator],
  );
  const getSnapshot = useCallback(
    () => (orchestrator ? orchestrator.status : IDLE_STATUS),
    [orchestrator],
  );
  const status = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  if (!orchestrator) {
    return (
      <div className="flex flex-col gap-3">
        <Card>
          <Card.Header>
            <Card.Title>AI orchestrator not available</Card.Title>
            <Card.Description>
              Wire <code>WebAiModule.forRoot(...)</code> (or
              <code>NativeAiModule.forRoot(...)</code>) to see live chat orchestrator state here.
            </Card.Description>
          </Card.Header>
        </Card>
      </div>
    );
  }

  const clientName =
    (client as { constructor?: { name?: string } })?.constructor?.name ?? "unknown";

  return (
    <div className="flex flex-col gap-3">
      <header>
        <h3 className="text-foreground text-base font-semibold">AI</h3>
        <p className="text-muted text-xs">Live orchestrator status and the active AI client.</p>
      </header>

      <Card>
        <Card.Header>
          <div className="flex items-center gap-2">
            <Card.Title className="text-sm">Orchestrator</Card.Title>
            <Chip size="sm" variant={statusVariant(status)}>
              <Chip.Label>{status}</Chip.Label>
            </Chip>
          </div>
          <Card.Description>
            Streaming, tool-call, and error state — sourced from the orchestrator's{" "}
            <code>onStatusChange</code> event.
          </Card.Description>
        </Card.Header>
        <Card.Content>
          <ul className="flex flex-col gap-1 text-sm">
            <li className="flex items-center justify-between">
              <span className="text-muted">Client</span>
              <code className="tabular-nums">{clientName}</code>
            </li>
            <li className="flex items-center justify-between">
              <span className="text-muted">Status</span>
              <code className="tabular-nums">{status}</code>
            </li>
          </ul>
        </Card.Content>
      </Card>

      <Card>
        <Card.Header>
          <Card.Title className="text-sm">Recent calls</Card.Title>
          <Card.Description>
            Recent prompt/response pairs will appear here once wired. The history buffer lands in a
            follow-up.
          </Card.Description>
        </Card.Header>
      </Card>
    </div>
  );
}
