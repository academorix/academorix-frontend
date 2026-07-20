/**
 * @file pipeline-hub.spec.ts
 * @module @stackra/pipeline/__tests__/unit
 * @description Behavioural spec for the `PipelineHub` service — the
 *   named-preset registry over `Pipeline`. Covers registering named
 *   pipelines, the fallback to the default definition, and the
 *   error surface when a name is missing / empty.
 */

import { describe, expect, it, vi } from "vitest";

import { MockApplication } from "@stackra/container/testing";
import { Pipeline } from "@/services/pipeline.service";
import { PipelineHub } from "@/services/pipeline-hub.service";
import { PipelineError } from "@/errors/pipeline.error";

// ────────────────────────────────────────────────────────────────────────
// Specs
// ────────────────────────────────────────────────────────────────────────

describe("PipelineHub", () => {
  describe("named pipelines", () => {
    it("registers a named pipeline definition and executes it via `.pipe(passable, name)`", () => {
      const hub = new PipelineHub();
      // The `PipelineDefinition` callback is handed a freshly-built
      // Pipeline + the passable. It's responsible for wiring pipes
      // and returning the pipeline's result.
      hub.pipeline("increment", (pipeline, passable) =>
        (pipeline as Pipeline<number>)
          .send(passable as number)
          .through([(value: number, next) => next(value + 1)])
          .then((v) => v),
      );

      expect(hub.pipe(10, "increment")).toBe(11);
    });

    it("reports named pipeline existence via `.has(name)`", () => {
      const hub = new PipelineHub();
      hub.pipeline("foo", () => "ok");

      expect(hub.has("foo")).toBe(true);
      expect(hub.has("missing")).toBe(false);
    });

    it("throws INVALID_PIPELINE_NAME on an empty name", () => {
      const hub = new PipelineHub();

      // Empty name is an authoring bug — reject at registration.
      try {
        hub.pipeline("", () => "ok");
        expect.fail("expected PipelineHub.pipeline to throw");
      } catch (error) {
        expect(error).toBeInstanceOf(PipelineError);
        expect((error as PipelineError).code).toBe("INVALID_PIPELINE_NAME");
      }
    });

    it("throws PIPELINE_NOT_FOUND when calling `.pipe()` with an unknown name", () => {
      const hub = new PipelineHub();

      try {
        hub.pipe("anything", "ghost-pipeline");
        expect.fail("expected PipelineHub.pipe to throw");
      } catch (error) {
        expect(error).toBeInstanceOf(PipelineError);
        expect((error as PipelineError).code).toBe("PIPELINE_NOT_FOUND");
      }
    });
  });

  describe("default pipeline", () => {
    it("runs the default pipeline when `.pipe()` is called without a name", () => {
      const hub = new PipelineHub();
      hub.defaults((pipeline, passable) =>
        (pipeline as Pipeline<number>)
          .send(passable as number)
          .through([(value: number, next) => next(value * 3)])
          .then((v) => v),
      );

      // No name passed — the default definition is invoked.
      expect(hub.pipe(4)).toBe(12);
    });

    it("throws NO_DEFAULT_PIPELINE when `.pipe()` is called with no default registered", () => {
      const hub = new PipelineHub();

      try {
        hub.pipe("anything");
        expect.fail("expected PipelineHub.pipe to throw");
      } catch (error) {
        expect(error).toBeInstanceOf(PipelineError);
        expect((error as PipelineError).code).toBe("NO_DEFAULT_PIPELINE");
      }
    });
  });

  describe("container passthrough", () => {
    it("passes the container to the Pipeline instances it constructs", () => {
      // The hub captures the container in its constructor and hands
      // it to every pipeline it builds. This lets definitions use
      // string pipes resolved from the container.
      const app = new MockApplication();
      const pipe = { handle: (value: number, next: (v: number) => unknown) => next(value + 100) };
      app.provide("bonus", pipe);

      const hub = new PipelineHub(app);
      hub.pipeline("with-bonus", (pipeline, passable) =>
        (pipeline as Pipeline<number>)
          .send(passable as number)
          .through(["bonus"])
          .then((v) => v),
      );

      expect(hub.pipe(1, "with-bonus")).toBe(101);
    });

    it("creates a fresh Pipeline per `.pipe()` call (no state leaks between invocations)", () => {
      const hub = new PipelineHub();
      // Track what each callback sees — every call should get a
      // brand-new Pipeline instance so a stale `.send(...)` from a
      // previous run can never leak.
      const seen: Pipeline<unknown>[] = [];
      hub.pipeline("fresh", (pipeline, passable) => {
        seen.push(pipeline as Pipeline<unknown>);
        return (pipeline as Pipeline<unknown>).send(passable).then((v) => v);
      });

      hub.pipe("a", "fresh");
      hub.pipe("b", "fresh");

      expect(seen).toHaveLength(2);
      expect(seen[0]).not.toBe(seen[1]);
    });
  });

  describe("definition invocation contract", () => {
    it("passes (pipeline, passable) to the registered definition", () => {
      const hub = new PipelineHub();
      const definition = vi.fn((_pipeline: unknown, _passable: unknown) => "result");
      hub.pipeline("spy", definition);

      hub.pipe({ x: 1 }, "spy");
      expect(definition).toHaveBeenCalledTimes(1);
      const [pipelineArg, passableArg] = definition.mock.calls[0];
      // The pipeline arg is a Pipeline instance…
      expect(pipelineArg).toBeInstanceOf(Pipeline);
      // …and the passable is threaded through untouched.
      expect(passableArg).toEqual({ x: 1 });
    });
  });
});
