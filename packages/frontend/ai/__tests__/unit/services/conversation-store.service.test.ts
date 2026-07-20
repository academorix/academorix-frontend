/**
 * @file conversation-store.service.test.ts
 * @description Unit tests for {@link ConversationStore} — thread create/
 *   list/select (Req 17.3, 17.4), user + assistant message appending,
 *   text-delta accumulation (Req 17.2), tool-call attachment + updates,
 *   and the count invariant (Req 17.5). Property 10 travels in
 *   `../../property/conversation-append.test.ts`.
 */

import { describe, expect, it, vi } from "vitest";
import { AiRunStatus, AiToolState } from "@stackra/contracts";

import { ConversationStore } from "@/core/services/conversation-store.service";

const make = (): ConversationStore => new ConversationStore();

describe("ConversationStore — threads", () => {
  it("createThread returns an id and adds the thread to the list", () => {
    const store = make();
    const id = store.createThread({ personaSlug: "writer" });
    expect(store.getThread(id)).toBeDefined();
    expect(store.listThreads().map((t) => t.threadId)).toContain(id);
  });

  it("sets the created thread as active when there is no other", () => {
    const store = make();
    const id = store.createThread({ personaSlug: "writer" });
    expect(store.getActiveId()).toBe(id);
  });

  it("setActive changes the active thread (Req 17.4)", () => {
    const store = make();
    const a = store.createThread({ personaSlug: "writer" });
    const b = store.createThread({ personaSlug: "writer" });
    store.setActive(b);
    expect(store.getActiveId()).toBe(b);
    expect(store.getActive()?.threadId).toBe(b);
    expect(store.getActiveId()).not.toBe(a);
  });

  it("setActive on an unknown id logs a warning and does not change state", () => {
    const store = make();
    const a = store.createThread({ personaSlug: "writer" });
    store.setActive("missing");
    expect(store.getActiveId()).toBe(a);
  });

  it("deleteThread removes the thread and clears active when applicable", () => {
    const store = make();
    const a = store.createThread({ personaSlug: "writer" });
    store.deleteThread(a);
    expect(store.getThread(a)).toBeUndefined();
    expect(store.getActiveId()).toBeNull();
  });
});

describe("ConversationStore — messages", () => {
  it("appendUser adds a user message and increments the count", () => {
    const store = make();
    const t = store.createThread({ personaSlug: "writer" });
    const before = store.getThread(t)!.messages.length;
    store.appendUser(t, "hello");
    expect(store.getThread(t)!.messages.length).toBe(before + 1);
    expect(store.getThread(t)!.messages.at(-1)?.role).toBe("user");
  });

  it("startAssistantMessage adds an empty assistant message + sets Streaming status", () => {
    const store = make();
    const t = store.createThread({ personaSlug: "writer" });
    const id = store.startAssistantMessage(t);
    const msg = store.getThread(t)!.messages.find((m) => m.id === id);
    expect(msg?.role).toBe("assistant");
    expect(msg?.text).toBe("");
    expect(store.getThread(t)!.status).toBe(AiRunStatus.Streaming);
  });

  it("appendTextDelta concatenates deltas onto the correct message (Req 17.2)", () => {
    const store = make();
    const t = store.createThread({ personaSlug: "writer" });
    const id = store.startAssistantMessage(t);
    store.appendTextDelta(t, id, "Hello");
    store.appendTextDelta(t, id, " ");
    store.appendTextDelta(t, id, "world");
    const msg = store.getThread(t)!.messages.find((m) => m.id === id);
    expect(msg?.text).toBe("Hello world");
  });

  it("finishAssistantMessage transitions the run status to Completed", () => {
    const store = make();
    const t = store.createThread({ personaSlug: "writer" });
    const id = store.startAssistantMessage(t);
    store.finishAssistantMessage(t, id);
    expect(store.getThread(t)!.status).toBe(AiRunStatus.Completed);
  });

  it("addSource attaches citations to a message", () => {
    const store = make();
    const t = store.createThread({ personaSlug: "writer" });
    const id = store.startAssistantMessage(t);
    store.addSource(t, id, { id: "s1", title: "Docs" });
    store.addSource(t, id, { id: "s2", title: "Blog" });
    const msg = store.getThread(t)!.messages.find((m) => m.id === id);
    expect(msg?.sources?.map((s) => s.id)).toEqual(["s1", "s2"]);
  });
});

describe("ConversationStore — tool calls", () => {
  it("addToolCall attaches a call to a message and ignores duplicates", () => {
    const store = make();
    const t = store.createThread({ personaSlug: "writer" });
    const id = store.startAssistantMessage(t);
    const tc = {
      toolCallId: "c1",
      toolName: "navigate",
      state: AiToolState.InputAvailable,
      origin: "client" as const,
      requiresApproval: false,
    };
    store.addToolCall(t, id, tc);
    store.addToolCall(t, id, tc); // duplicate — ignored
    expect(store.getThread(t)!.messages.find((m) => m.id === id)!.toolCalls).toHaveLength(1);
  });

  it("updateToolCall mutates matching call properties", () => {
    const store = make();
    const t = store.createThread({ personaSlug: "writer" });
    const id = store.startAssistantMessage(t);
    store.addToolCall(t, id, {
      toolCallId: "c1",
      toolName: "navigate",
      state: AiToolState.InputAvailable,
      origin: "client",
      requiresApproval: false,
    });
    store.updateToolCall(t, id, "c1", { state: AiToolState.OutputAvailable, result: "ok" });
    const tc = store.getThread(t)!.messages.find((m) => m.id === id)!.toolCalls[0]!;
    expect(tc.state).toBe(AiToolState.OutputAvailable);
    expect(tc.result).toBe("ok");
  });

  it("setToolCallState is shorthand for updateToolCall with just a state", () => {
    const store = make();
    const t = store.createThread({ personaSlug: "writer" });
    const id = store.startAssistantMessage(t);
    store.addToolCall(t, id, {
      toolCallId: "c1",
      toolName: "refund",
      state: AiToolState.InputAvailable,
      origin: "client",
      requiresApproval: true,
    });
    store.setToolCallState(t, id, "c1", AiToolState.RequiresAction);
    expect(store.getThread(t)!.messages.find((m) => m.id === id)!.toolCalls[0]!.state).toBe(
      AiToolState.RequiresAction,
    );
  });
});

describe("ConversationStore — change notification", () => {
  it("notifies onChange on every mutation", () => {
    const store = make();
    const listener = vi.fn();
    store.onChange(listener);
    const t = store.createThread({ personaSlug: "writer" });
    store.appendUser(t, "hi");
    const id = store.startAssistantMessage(t);
    store.appendTextDelta(t, id, "Hi");
    expect(listener).toHaveBeenCalled();
    expect(listener.mock.calls.length).toBeGreaterThanOrEqual(4);
  });
});
