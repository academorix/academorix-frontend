/**
 * @file testing-helpers.spec.ts
 * @module @stackra/pipeline/__tests__/unit
 * @description Behavioural spec for the `@stackra/pipeline/testing`
 *   surface — `runPipe(...)` (single-pipe invocation helper) and
 *   `createMockPipeline(...)` (assertable wrapper around a real
 *   `Pipeline`).
 */

import { describe, expect, it, vi } from "vitest";

import { runPipe, createMockPipeline } from "@/testing";

// ────────────────────────────────────────────────────────────────────────
// Specs — runPipe
// ────────────────────────────────────────────────────────────────────────

describe("runPipe", () => {
  it("invokes a function pipe with (passable, next)", () => {
    const pipe = (value: number, next: (v: number) => unknown): unknown => next(value + 1);
    const result = runPipe<number, number>(pipe, 1, (v) => v * 2);
    // 1 → +1 (pipe) → *2 (next / terminal) = 4.
    expect(result).toBe(4);
  });

  it("defaults `next` to an identity when none is supplied", () => {
    // Handy for exercising middleware that just wraps a value and
    // returns whatever `next()` produces.
    const pipe = (value: number, next: (v: number) => unknown): unknown => next(value + 10);
    const result = runPipe<number, number>(pipe, 5);
    // No terminal → value flows through untouched after the pipe's
    // transform.
    expect(result).toBe(15);
  });

  it("invokes an object pipe using the default `handle` method", () => {
    const pipe = {
      handle: vi.fn((value: number, next: (v: number) => unknown) => next(value + 3)),
    };
    const result = runPipe<number, number>(pipe, 1, (v) => v);
    expect(result).toBe(4);
    expect(pipe.handle).toHaveBeenCalledTimes(1);
  });

  it("invokes an object pipe with a custom method name via `options.method`", () => {
    const pipe = {
      process: vi.fn((value: number, next: (v: number) => unknown) => next(value * 5)),
    };
    const result = runPipe<number, number>(pipe, 2, (v) => v, { method: "process" });
    expect(result).toBe(10);
    expect(pipe.process).toHaveBeenCalledTimes(1);
  });

  it("throws when the object pipe is missing the requested method", () => {
    // `runPipe` intentionally throws a plain Error (not
    // `PipelineError`) — it's a test helper, not the real dispatcher.
    const pipe = { handle: () => "x" };
    expect(() => runPipe(pipe, 0, undefined, { method: "nope" })).toThrow(/has no "nope" method/);
  });

  it("forwards extra tuple params to the function pipe after `next`", () => {
    // Unlike production `Pipeline.carry()`, `runPipe` DOES forward
    // tuple params to function pipes — this is intentional so tests
    // can exercise `[pipe, ...params]` shapes without wiring an
    // object pipe.
    const pipe = (value: number, next: (v: number) => unknown, ...params: number[]): unknown =>
      next(value + params.reduce((a, b) => a + b, 0));

    const result = runPipe<number, number>([pipe, 1, 2, 3], 0, (v) => v);
    expect(result).toBe(6);
  });

  it("forwards extra tuple params to an object pipe after `next`", () => {
    const pipe = {
      handle: vi.fn((value: number, next: (v: number) => unknown, offset: number) =>
        next(value + offset),
      ),
    };
    const result = runPipe<number, number>([pipe, 100], 1, (v) => v);
    expect(result).toBe(101);
    // The extra tuple param reached `handle` in position 3.
    const args = pipe.handle.mock.calls[0];
    expect(args[2]).toBe(100);
  });

  it("throws when the pipe form is unsupported (e.g. a string, primitive, null)", () => {
    // Strings would require a container — that's outside runPipe's
    // remit; consumers should build a Pipeline with a container
    // instead.
    expect(() => runPipe("some-token", 0)).toThrow(/String pipes require a container/);
    expect(() => runPipe(42 as unknown as never, 0)).toThrow(/unsupported pipe form/);
  });

  it("throws when a tuple's first entry is unsupported", () => {
    expect(() => runPipe([123 as unknown as never, "p"], 0)).toThrow(/unsupported tuple entry/);
  });
});

// ────────────────────────────────────────────────────────────────────────
// Specs — createMockPipeline
// ────────────────────────────────────────────────────────────────────────

describe("createMockPipeline", () => {
  it("returns a live `Pipeline` proxy — the fluent API still works end-to-end", () => {
    const pipeline = createMockPipeline<number, number>();
    const result = pipeline
      .send(2)
      .through([(v: number, next) => next(v + 3)])
      .then((v) => v);

    // The chain executes for real; the assertable wrapper only
    // adds recording on top.
    expect(result).toBe(5);
    // The proxy exposes an `$` bookkeeper for call assertions.
    expect(pipeline.$).toBeDefined();
  });

  it("records the initial method call directly against the proxy (`send`)", () => {
    // NOTE: the assertable proxy in `@stackra/testing` records only
    // the calls made against the proxy itself. Fluent methods that
    // return `this` return the RAW target (`this` inside `send()`
    // is the underlying Pipeline, not the proxy), so subsequent
    // chained calls (`.through()`, `.then()`) hit the raw object
    // and are NOT recorded. Tests that need the whole chain should
    // assert on the terminal result of `.then()` rather than every
    // hop.
    const pipeline = createMockPipeline<number, number>();
    const pipes = [(v: number, next: (v: number) => unknown) => next(v * 2)];
    pipeline
      .send(4)
      .through(pipes)
      .then((v) => v);

    expect(pipeline.$.wasCalled("send")).toBe(true);
    expect(pipeline.$.wasCalledWith("send", 4)).toBe(true);
  });

  it("produces independent proxies — one per `createMockPipeline()` call", () => {
    const a = createMockPipeline<number>();
    const b = createMockPipeline<number>();
    a.send(1);
    // The recorder on `b` MUST NOT see `a`'s send — the wrappers
    // share no state.
    expect(a.$.wasCalled("send")).toBe(true);
    expect(b.$.wasCalled("send")).toBe(false);
  });
});
