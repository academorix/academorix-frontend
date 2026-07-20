/**
 * @file ai-tool-call.component.tsx
 * @module @stackra/ai/native/components
 * @description `AiToolCall` (native) — renders a single decoded tool call
 *   as a HeroUI Native `Card` with a `Chip` state pill in the header, the
 *   args/result body, and `Button` approve/reject actions in the footer
 *   when the call is in `RequiresAction`.
 */

import type { JSX } from "react";
import { View } from "react-native";
import { Button, Card, Chip, Typography } from "@stackra/ui/native";
import { AiToolState, type IAiToolCall } from "@stackra/contracts";

/** Props accepted by {@link AiToolCall}. */
export interface IAiToolCallProps {
  /** The tool call to render. */
  toolCall: IAiToolCall;
  /** Approve handler (for `RequiresAction`). */
  onApprove?: (toolCallId: string) => void;
  /** Reject handler (for `RequiresAction`). */
  onReject?: (toolCallId: string) => void;
  /** Passthrough class for composition. */
  className?: string;
}

/** Compact human-readable label for the state. */
function labelFor(state: AiToolState): string {
  switch (state) {
    case AiToolState.InputStreaming:
      return "Preparing…";
    case AiToolState.InputAvailable:
      return "Running…";
    case AiToolState.OutputAvailable:
      return "Completed";
    case AiToolState.OutputError:
      return "Failed";
    case AiToolState.RequiresAction:
      return "Approval needed";
    default:
      return String(state);
  }
}

/** Map state to the semantic `Chip` color. */
function chipColorFor(state: AiToolState): "accent" | "success" | "warning" | "danger" | "default" {
  switch (state) {
    case AiToolState.OutputAvailable:
      return "success";
    case AiToolState.OutputError:
      return "danger";
    case AiToolState.RequiresAction:
      return "warning";
    case AiToolState.InputStreaming:
    case AiToolState.InputAvailable:
      return "accent";
    default:
      return "default";
  }
}

/** Serialise a payload for display (compact JSON, truncated). */
function preview(value: unknown, max: number = 220): string {
  if (value === undefined || value === null) return "";
  try {
    const raw = typeof value === "string" ? value : JSON.stringify(value);
    return raw.length > max ? `${raw.slice(0, max)}…` : raw;
  } catch {
    return String(value);
  }
}

/** Render a single tool call. */
export function AiToolCall(props: IAiToolCallProps): JSX.Element {
  const { toolCall, onApprove, onReject, className } = props;
  const argsBody = toolCall.argsText ?? preview(toolCall.args);
  const resultBody =
    toolCall.state === AiToolState.OutputAvailable ? preview(toolCall.result) : undefined;
  const errorBody = toolCall.error;
  const needsApproval = toolCall.state === AiToolState.RequiresAction;

  return (
    <Card variant="secondary" className={className}>
      <Card.Header>
        <View className="flex-row items-center justify-between">
          <Typography type="body-sm" weight="semibold">
            {toolCall.toolName}
          </Typography>
          <Chip size="sm" variant="soft" color={chipColorFor(toolCall.state)}>
            <Chip.Label>{labelFor(toolCall.state)}</Chip.Label>
          </Chip>
        </View>
      </Card.Header>

      <Card.Body>
        {argsBody ? (
          <Typography type="body-xs" color="muted" numberOfLines={6}>
            {argsBody}
          </Typography>
        ) : null}

        {resultBody ? (
          <Typography type="body-xs" color="muted" numberOfLines={6} className="mt-2">
            {resultBody}
          </Typography>
        ) : null}

        {errorBody ? (
          <Typography type="body-xs" className="text-danger mt-2" numberOfLines={4}>
            {errorBody}
          </Typography>
        ) : null}
      </Card.Body>

      {needsApproval ? (
        <Card.Footer>
          <View className="flex-row justify-end gap-2">
            <Button size="sm" variant="outline" onPress={() => onReject?.(toolCall.toolCallId)}>
              <Button.Label>Reject</Button.Label>
            </Button>
            <Button size="sm" variant="primary" onPress={() => onApprove?.(toolCall.toolCallId)}>
              <Button.Label>Approve</Button.Label>
            </Button>
          </View>
        </Card.Footer>
      ) : null}
    </Card>
  );
}
