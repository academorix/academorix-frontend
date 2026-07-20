/**
 * @file ai-devtools-panel.spec.ts
 * @module @stackra/ai/__tests__/unit
 * @description Behavioural spec for `AiDevtoolsPanel` — metadata
 *   stamp, empty-state construction, and badge behaviour.
 */

import "reflect-metadata";

import { describe, expect, it } from "vitest";
import { DEVTOOLS_PANEL_METADATA_KEY } from "@stackra/contracts";

import { AiDevtoolsPanel } from "@/react/devtools/ai.devtools-panel";
import type {
  ChatOrchestrator,
  OrchestratorStatus,
} from "@/core/services/chat-orchestrator.service";

/**
 * Build the minimal ChatOrchestrator stub the panel reads — a
 * `status` getter plus a no-op `onStatusChange` subscription.
 */
function makeOrchestrator(status: OrchestratorStatus): ChatOrchestrator {
  return {
    status,
    onStatusChange: (_listener: (s: OrchestratorStatus) => void) => () => {},
  } as unknown as ChatOrchestrator;
}

// ────────────────────────────────────────────────────────────────────────
// Specs
// ────────────────────────────────────────────────────────────────────────

describe("AiDevtoolsPanel", () => {
  it('stamps @DevtoolsPanel metadata with id "ai", framework category, order 50', () => {
    const metadata = Reflect.getMetadata(DEVTOOLS_PANEL_METADATA_KEY, AiDevtoolsPanel) as
      { id?: string; title?: string; category?: string; order?: number } | undefined;
    expect(metadata?.id).toBe("ai");
    expect(metadata?.title).toBe("AI");
    expect(metadata?.category).toBe("framework");
    expect(metadata?.order).toBe(50);
  });

  it("constructs with no orchestrator/client and exposes IDevtoolsPanel fields", () => {
    const panel = new AiDevtoolsPanel();
    expect(panel.id).toBe("ai");
    expect(panel.title).toBe("AI");
    expect(panel.category).toBe("framework");
    expect(panel.order).toBe(50);
    expect(panel.view.type).toBe("component");
  });

  it("badge() returns null when the orchestrator is absent", () => {
    // Missing orchestrator is a valid state (AI installed but not
    // rendering a chat surface). Badge stays hidden.
    expect(new AiDevtoolsPanel().badge()).toBeNull();
  });

  it("badge() returns null while idle", () => {
    const panel = new AiDevtoolsPanel(makeOrchestrator("idle"));
    expect(panel.badge()).toBeNull();
  });

  it("badge() returns 1 while streaming", () => {
    // A single "in-flight" indicator is the design — no attempt at
    // counting concurrent runs because the orchestrator enforces
    // one-at-a-time.
    const panel = new AiDevtoolsPanel(makeOrchestrator("streaming"));
    expect(panel.badge()).toBe(1);
  });

  it("badge() returns null after completion", () => {
    const panel = new AiDevtoolsPanel(makeOrchestrator("complete"));
    expect(panel.badge()).toBeNull();
  });

  it("badge() returns null when the orchestrator throws on status read", () => {
    // fail-soft — a broken orchestrator must not blow up the badge.
    const throwingOrchestrator = {
      get status(): never {
        throw new Error("boom");
      },
    } as unknown as ChatOrchestrator;
    expect(new AiDevtoolsPanel(throwingOrchestrator).badge()).toBeNull();
  });
});
