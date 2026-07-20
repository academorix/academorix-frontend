/**
 * @file ai-tool-call.component.tsx
 * @module @stackra/ai/react/components
 * @description `AiToolCall` — renders a decoded tool call. Maps our
 *   `AiToolState` directly onto HeroUI Pro `ChatTool`'s `state` union
 *   (same string values by design), and wires `onApprove` / `onReject`
 *   to the orchestrator through the caller (Req 20.1, 20.2, 9).
 */

import type { JSX } from "react";
import { ChatTool } from "@stackra/ui/react";
import { AiToolState, type IAiToolCall } from "@stackra/contracts";

/** Props accepted by {@link AiToolCall}. */
export interface IAiToolCallProps {
  /** The tool call to render. */
  toolCall: IAiToolCall;
  /** Approve handler for `RequiresAction` state. */
  onApprove?: (toolCallId: string) => void;
  /** Reject handler for `RequiresAction` state. */
  onReject?: (toolCallId: string) => void;
  /** Whether the disclosure is open by default. */
  defaultExpanded?: boolean;
  /** Optional passthrough class. */
  className?: string;
}

/**
 * Map an `AiToolState` to the string literal `ChatTool` expects. The
 * enum values are aligned so the mapping is direct identity.
 */
function mapState(
  state: AiToolState,
): "input-streaming" | "input-available" | "output-available" | "output-error" | "requires-action" {
  return state as
    "input-streaming" | "input-available" | "output-available" | "output-error" | "requires-action";
}

/** Render a single tool call. */
export function AiToolCall(props: IAiToolCallProps): JSX.Element {
  const { toolCall, onApprove, onReject, defaultExpanded = false, className } = props;

  const commonProps = {
    className,
    toolName: toolCall.toolName,
    state: mapState(toolCall.state),
    defaultExpanded,
    triggerPrefix:
      toolCall.origin === "server"
        ? "Server tool: "
        : toolCall.state === AiToolState.RequiresAction
          ? "Approval needed: "
          : "Used tool: ",
    ...(toolCall.args !== undefined ? { input: toolCall.args } : {}),
    ...(toolCall.argsText !== undefined ? { argsText: toolCall.argsText } : {}),
    ...(toolCall.result !== undefined ? { output: toolCall.result } : {}),
    ...(toolCall.error !== undefined ? { errorText: toolCall.error } : {}),
  };

  if (toolCall.state === AiToolState.RequiresAction) {
    return (
      <ChatTool
        {...commonProps}
        approveLabel="Approve"
        rejectLabel="Reject"
        onApprove={() => onApprove?.(toolCall.toolCallId)}
        onReject={() => onReject?.(toolCall.toolCallId)}
      />
    );
  }

  return <ChatTool {...commonProps} />;
}
