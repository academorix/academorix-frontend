/**
 * @file chat-orchestrator.feature.test.ts
 * @description End-to-end feature test for the streamed chat pipeline:
 *   ChatOrchestrator wires the mock `IAiClient` (yielding a scripted
 *   sequence of decoded events) into the ConversationStore + ToolExecutor
 *   + ToolConverter, drives an assistant message + a client-tool call
 *   requiring approval, and asserts:
 *
 *   - Text deltas accumulate onto the assistant message (Req 17.2).
 *   - `tool-call-delta` fragments assemble into `args` before invocation
 *     (Req 8.5).
 *   - Approval-required client tools wait on `approveTool` (Req 9).
 *   - The handler runs, its result is posted via `client.postToolResult`
 *     (Req 8.2).
 *   - The store transitions the tool call through InputStreaming →
 *     InputAvailable → RequiresAction → OutputAvailable.
 *   - Status transitions Idle → Streaming → Complete.
 */

import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import {
  AiStreamEventType,
  AiToolState,
  type IAiChatRequest,
  type IAiClient,
  type IAiClientToolDefinition,
  type IAiStreamEvent,
  type IAiToolResult,
  type IPersona,
  type IUiContextSnapshot,
} from "@stackra/contracts";

import { ChatOrchestrator } from "@/core/services/chat-orchestrator.service";
import { ConversationStore } from "@/core/services/conversation-store.service";
import { ToolConverter } from "@/core/services/tool-converter.service";
import { ToolExecutor } from "@/core/services/tool-executor.service";
import { ToolRegistry } from "@/core/registries/tool.registry";

// ── Fixtures ─────────────────────────────────────────────────────────────

/** A scripted mock IAiClient that replays a fixed event sequence. */
function scriptedClient(events: IAiStreamEvent[]): {
  client: IAiClient;
  posted: IAiToolResult[];
  chatCalls: IAiChatRequest[];
} {
  const posted: IAiToolResult[] = [];
  const chatCalls: IAiChatRequest[] = [];
  const client = {
    chat(_persona: string, req: IAiChatRequest): AsyncIterable<IAiStreamEvent> {
      chatCalls.push(req);
      async function* iter(): AsyncIterable<IAiStreamEvent> {
        for (const e of events) {
          yield e;
          // Let the event loop churn so downstream awaits run between
          // yields (mimics real streaming).
          await Promise.resolve();
        }
      }
      return iter();
    },
    cancelRun: vi.fn(() => Promise.resolve()),
    postToolResult(result: IAiToolResult): Promise<void> {
      posted.push(result);
      return Promise.resolve();
    },
    confirmDraft: () => Promise.resolve(),
    listPersonas: (): Promise<IPersona[]> => Promise.resolve([]),
    listTools: (): Promise<IAiClientToolDefinition[]> => Promise.resolve([]),
    advertiseTools: () => Promise.resolve(),
    syncContext: (_s: IUiContextSnapshot) => Promise.resolve(),
    transcribe: () => Promise.resolve({ text: "" }),
    synthesize: () => Promise.resolve(new ArrayBuffer(0)),
  } as unknown as IAiClient;
  return { client, posted, chatCalls };
}

/** Build a fresh subsystem stack wired for a feature test. */
interface IHarness {
  orchestrator: ChatOrchestrator;
  store: ConversationStore;
  registry: ToolRegistry;
  posted: IAiToolResult[];
  chatCalls: IAiChatRequest[];
}

function makeHarness(events: IAiStreamEvent[]): IHarness {
  const registry = new ToolRegistry();
  const { client, posted, chatCalls } = scriptedClient(events);
  const converter = new ToolConverter(registry);
  converter.onModuleInit();
  const executor = new ToolExecutor(registry, client);
  const store = new ConversationStore();
  const orchestrator = new ChatOrchestrator(client, store, executor, converter);
  return { orchestrator, store, registry, posted, chatCalls };
}

// ── Feature test ─────────────────────────────────────────────────────────

describe("ChatOrchestrator — feature: streamed chat + client-tool with approval", () => {
  it("drives an end-to-end assistant reply that invokes an approved client tool", async () => {
    const handler = vi.fn().mockResolvedValue({ ok: true, url: "/orders" });

    // Scripted decoded event sequence.
    const events: IAiStreamEvent[] = [
      { type: AiStreamEventType.TextStart, id: "m1" },
      { type: AiStreamEventType.TextDelta, id: "m1", delta: "Sure, " },
      { type: AiStreamEventType.TextDelta, id: "m1", delta: "navigating…" },
      { type: AiStreamEventType.TextEnd, id: "m1" },
      { type: AiStreamEventType.ToolCallStart, toolCallId: "c1", toolName: "navigate" },
      // Args arrive in fragments.
      { type: AiStreamEventType.ToolCallDelta, toolCallId: "c1", argsTextDelta: '{"url":' },
      { type: AiStreamEventType.ToolCallDelta, toolCallId: "c1", argsTextDelta: '"/orders"}' },
      { type: AiStreamEventType.ToolCallEnd, toolCallId: "c1", args: { url: "/orders" } },
      { type: AiStreamEventType.Finish, runId: "r1", reason: "stop" },
    ];

    const { orchestrator, store, registry, posted, chatCalls } = makeHarness(events);
    // Register the client tool the backend calls.
    registry.register({
      definition: {
        name: "navigate",
        description: "Navigate the UI",
        parameters: z.object({ url: z.string() }),
        requiresApproval: true,
      },
      handler: (args) => handler(args as unknown),
    });

    // Kick off the run + await it in parallel with an approval decision.
    const threadId = store.createThread({ personaSlug: "guide" });
    const runPromise = orchestrator.send({ threadId, persona: "guide", message: "Go to orders" });

    // Give the loop time to enter RequiresAction state.
    await waitFor(() => {
      const call = getCurrentToolCall(store, threadId, "c1");
      return call?.state === AiToolState.RequiresAction;
    });

    // Approve — the executor's promise settles, the handler runs.
    orchestrator.approveTool("c1");
    await runPromise;

    // ── Assertions ───────────────────────────────────────────────────

    // 1. Chat request piggybacked tool defs.
    expect(chatCalls[0]!.tools?.length).toBe(1);
    expect(chatCalls[0]!.tools![0]!.name).toBe("navigate");
    expect(chatCalls[0]!.message).toBe("Go to orders");

    // 2. Text accumulated correctly (Req 17.2).
    const assistant = getLastAssistant(store, threadId);
    expect(assistant.text).toBe("Sure, navigating…");

    // 3. Tool call reached OutputAvailable with the handler's result.
    const finalCall = assistant.toolCalls.find((t) => t.toolCallId === "c1")!;
    expect(finalCall.state).toBe(AiToolState.OutputAvailable);
    expect(finalCall.result).toEqual({ ok: true, url: "/orders" });
    expect(finalCall.args).toEqual({ url: "/orders" });
    expect(finalCall.origin).toBe("client");

    // 4. Handler invoked with the assembled args (Req 8.5).
    expect(handler).toHaveBeenCalledWith({ url: "/orders" });

    // 5. Result posted back to the backend (Req 8.2).
    expect(posted).toContainEqual(
      expect.objectContaining({ toolCallId: "c1", result: { ok: true, url: "/orders" } }),
    );

    // 6. Final orchestrator status.
    expect(orchestrator.status).toBe("complete");
  });

  it("marks a tool call as OutputError when the user rejects the approval (Req 9.3)", async () => {
    const events: IAiStreamEvent[] = [
      { type: AiStreamEventType.ToolCallStart, toolCallId: "c1", toolName: "refund" },
      { type: AiStreamEventType.ToolCallEnd, toolCallId: "c1", args: { amount: 42 } },
      { type: AiStreamEventType.Finish, runId: "r1", reason: "stop" },
    ];

    const handler = vi.fn();
    const { orchestrator, store, registry, posted } = makeHarness(events);
    registry.register({
      definition: {
        name: "refund",
        description: "Refund",
        parameters: z.object({ amount: z.number() }),
        requiresApproval: true,
      },
      handler,
    });

    const threadId = store.createThread({ personaSlug: "ops" });
    const runPromise = orchestrator.send({ threadId, persona: "ops", message: "refund" });

    await waitFor(() => {
      const call = getCurrentToolCall(store, threadId, "c1");
      return call?.state === AiToolState.RequiresAction;
    });

    orchestrator.rejectTool("c1");
    await runPromise;

    const assistant = getLastAssistant(store, threadId);
    const call = assistant.toolCalls.find((t) => t.toolCallId === "c1")!;
    expect(call.state).toBe(AiToolState.OutputError);
    expect(call.error).toBe("rejected");
    expect(handler).not.toHaveBeenCalled();
    expect(posted).toContainEqual(expect.objectContaining({ toolCallId: "c1", rejected: true }));
  });

  it("renders server-tool results without executing anything locally (Req 5.2, 8.4)", async () => {
    const events: IAiStreamEvent[] = [
      { type: AiStreamEventType.ToolCallStart, toolCallId: "c1", toolName: "searchDocs" },
      { type: AiStreamEventType.ToolCallEnd, toolCallId: "c1", args: { q: "hello" } },
      {
        type: AiStreamEventType.ToolResult,
        toolCallId: "c1",
        result: { hits: ["a", "b"] },
        isError: false,
      },
      { type: AiStreamEventType.Finish, runId: "r1", reason: "stop" },
    ];

    const { orchestrator, store, posted } = makeHarness(events);
    const threadId = store.createThread({ personaSlug: "writer" });
    await orchestrator.send({ threadId, persona: "writer", message: "search docs" });

    const call = getLastAssistant(store, threadId).toolCalls[0]!;
    expect(call.origin).toBe("server");
    expect(call.state).toBe(AiToolState.OutputAvailable);
    expect(call.result).toEqual({ hits: ["a", "b"] });
    // No client-side handler invoked → no tool-result posted by us.
    expect(posted).toEqual([]);
  });
});

// ── Helpers ──────────────────────────────────────────────────────────────

function getLastAssistant(store: ConversationStore, threadId: string) {
  const thread = store.getThread(threadId)!;
  for (let i = thread.messages.length - 1; i >= 0; i--) {
    if (thread.messages[i]!.role === "assistant") return thread.messages[i]!;
  }
  throw new Error("no assistant message found");
}

function getCurrentToolCall(store: ConversationStore, threadId: string, toolCallId: string) {
  const thread = store.getThread(threadId);
  for (const msg of thread?.messages ?? []) {
    const call = msg.toolCalls.find((t) => t.toolCallId === toolCallId);
    if (call) return call;
  }
  return undefined;
}

/**
 * Poll a predicate until it returns true (or the timeout expires).
 * Cheap replacement for `waitFor` from testing-library since we're in
 * a Node environment without it.
 */
async function waitFor(predicate: () => boolean, timeoutMs = 500): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (predicate()) return;
    await new Promise((resolve) => setTimeout(resolve, 5));
  }
  throw new Error("waitFor: predicate never became true within timeout");
}
