/**
 * @file ai-agent.decorator.test.ts
 * @description Unit tests for `@AiAgent(...)` — confirms metadata is
 *   stamped on the class constructor and retrievable via
 *   `getAiAgentMetadata`.
 */

import "reflect-metadata";
import { describe, expect, it } from "vitest";
import { AI_AGENT_METADATA } from "@stackra/contracts";

import { AiAgent, getAiAgentMetadata } from "@/core/decorators/ai-agent.decorator";

describe("@AiAgent decorator", () => {
  it("stamps IPersona metadata under AI_AGENT_METADATA", () => {
    @AiAgent({ slug: "analyst", title: "Analyst", description: "Data insights." })
    class AnalystAgent {}

    const stamped = Reflect.getMetadata(AI_AGENT_METADATA, AnalystAgent);
    expect(stamped).toEqual({
      slug: "analyst",
      title: "Analyst",
      description: "Data insights.",
    });
  });

  it("getAiAgentMetadata reads the stamped persona", () => {
    @AiAgent({ slug: "writer", title: "Writer" })
    class WriterAgent {}

    expect(getAiAgentMetadata(WriterAgent)).toEqual({ slug: "writer", title: "Writer" });
  });

  it("returns undefined for undecorated classes", () => {
    class Plain {}
    expect(getAiAgentMetadata(Plain)).toBeUndefined();
  });
});
