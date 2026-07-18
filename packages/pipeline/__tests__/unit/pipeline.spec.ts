/**
 * @file pipeline.spec.ts
 * @module @stackra/pipeline/__tests__/unit
 * @description Behavioural spec for the `Pipeline` service — the
 *   Laravel-style middleware chain. Covers the chain-of-responsibility
 *   basics (`.send().through().then()`), input/output transformation,
 *   short-circuiting, async chains, container resolution for string
 *   pipes, tuple pipes, per-pipe method overrides via `.via()`, and
 *   error propagation.
 */

import { describe, expect, it, vi } from "vitest";

import { MockApplication } from "@stackra/container/testing";
import { Pipeline } from "@/services/pipeline.service";
import { PipelineError } from "@/errors/pipeline.error";

// ────────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────────

/**
 * A closure pipe that increments a numeric passable by `delta` before
 * calling `next()`. Handy for asserting execution order and transform
 * semantics without introducing a class.
 */
function addPipe(delta: number) {
  return (value: number, next: (value: number) => unknown): unknown => next(value + delta);
}

/**
 * A closure pipe that doubles the numeric result AFTER `next()` returns.
 * Demonstrates output transformation (the second half of the chain).
 */
function doubleResult(): (value: number, next: (value: number) => unknown) => unknown {
  return (value, next) => {
    const result = next(value) as number;
    return result * 2;
  };
}

// ────────────────────────────────────────────────────────────────────────
// Specs
// ────────────────────────────────────────────────────────────────────────

describe("Pipeline", () => {
  describe("empty pipeline", () => {
    it("runs the terminal handler directly when no pipes are registered", () => {
      // The terminal is called with the passable as-is — no middleware
      // stack means the reduce over `pipes` produces the prepared
      // destination unchanged.
      const destination = vi.fn((value: number) => value + 1);
      const result = new Pipeline<number, number>().send(3).then(destination);

      expect(result).toBe(4);
      expect(destination).toHaveBeenCalledTimes(1);
      expect(destination).toHaveBeenCalledWith(3);
    });

    it("returns the passable unchanged via `thenReturn()` when no pipes are registered", () => {
      const value = { id: 42 };
      const result = new Pipeline<{ id: number }>().send(value).thenReturn();

      // `thenReturn()` uses `identity` as its destination, so the
      // passable flows straight through.
      expect(result).toBe(value);
    });
  });

  describe("single-middleware pipeline", () => {
    it("wraps the terminal handler with a single pipe", () => {
      const destination = vi.fn((value: number) => value);
      const result = new Pipeline<number, number>()
        .send(10)
        .through([addPipe(5)])
        .then(destination);

      // The pipe added 5 before calling next(), so destination saw 15.
      expect(result).toBe(15);
      expect(destination).toHaveBeenCalledWith(15);
    });
  });

  describe("multi-middleware pipeline", () => {
    it("runs middleware in registration order", () => {
      // Registration order: [addPipe(1), addPipe(10), addPipe(100)]
      // Each pipe applies its delta BEFORE calling next(), so the
      // destination receives 1 + 10 + 100 + 0 = 111.
      const order: string[] = [];
      const trace =
        (label: string) =>
        (value: number, next: (value: number) => unknown): unknown => {
          order.push(label);
          return next(value);
        };

      new Pipeline<number, number>()
        .send(0)
        .through([trace("first"), trace("second"), trace("third")])
        .then((value) => value);

      expect(order).toEqual(["first", "second", "third"]);
    });

    it("transforms the passable in registration order (input transforms compose left-to-right)", () => {
      const result = new Pipeline<number, number>()
        .send(0)
        .through([addPipe(1), addPipe(10), addPipe(100)])
        .then((value) => value);

      // 0 → +1 → +10 → +100 = 111.
      expect(result).toBe(111);
    });
  });

  describe("short-circuit behaviour", () => {
    it("skips the rest of the chain when a middleware does not call `next()`", () => {
      const skipped = vi.fn();
      const destination = vi.fn((value: number) => value);

      const result = new Pipeline<number, number>()
        .send(0)
        // First pipe returns a sentinel without invoking `next()` —
        // downstream pipes and the destination are never entered.
        .through([
          (_value, _next) => 999,
          (value, next) => {
            skipped(value);
            return next(value);
          },
        ])
        .then(destination);

      expect(result).toBe(999);
      expect(skipped).not.toHaveBeenCalled();
      expect(destination).not.toHaveBeenCalled();
    });
  });

  describe("input / output transformation", () => {
    it("transforms the input before delegating to `next()`", () => {
      const destination = vi.fn((value: number) => value);

      const result = new Pipeline<number, number>()
        .send(2)
        // pipe passes `value * value` downstream — destination sees 4.
        .through([(value: number, next: (v: number) => unknown) => next(value * value)])
        .then(destination);

      expect(destination).toHaveBeenCalledWith(4);
      expect(result).toBe(4);
    });

    it("transforms the output after `next()` returns", () => {
      const result = new Pipeline<number, number>()
        .send(3)
        .through([doubleResult()])
        // Destination returns the value unchanged (3), the pipe then
        // doubles it (6) on the way out.
        .then((value) => value);

      expect(result).toBe(6);
    });

    it("composes input + output transforms across multiple pipes", () => {
      const result = new Pipeline<number, number>()
        .send(1)
        // Outer pipe doubles the RESULT; inner pipe adds 5 to the
        // INPUT. Order: input flows 1 → 6, output flows 6 → 12.
        .through([doubleResult(), addPipe(5)])
        .then((value) => value);

      expect(result).toBe(12);
    });
  });

  describe("async chains", () => {
    it("awaits async closure pipes through the terminal", async () => {
      const asyncPipe =
        (delta: number) =>
        async (value: number, next: (value: number) => unknown): Promise<unknown> => {
          // Simulate a boundary crossing (await something) before
          // handing off to the next pipe. `next(...)` returns a
          // Promise which we await so this pipe resolves after the
          // downstream chain settles.
          await Promise.resolve();
          return next(value + delta);
        };

      // Async chain — each pipe awaits before continuing. Every pipe
      // returns a Promise, so `then()` returns a Promise too.
      const promise = new Pipeline<number, Promise<number>>()
        .send(0)
        .through([asyncPipe(1), asyncPipe(2)])
        .then(async (value) => value * 10);

      await expect(promise).resolves.toBe(30);
    });
  });

  describe("error propagation", () => {
    it("bubbles a synchronous throw from a middleware as a PipelineError", () => {
      const throwingPipe = (_value: number, _next: (value: number) => unknown): unknown => {
        throw new Error("boom");
      };

      // `carry()` wraps every non-PipelineError in a
      // PipelineError with code `PIPE_EXECUTION_FAILED`. The
      // original error is preserved under `.cause`.
      expect(() =>
        new Pipeline<number, number>()
          .send(0)
          .through([throwingPipe])
          .then((v) => v),
      ).toThrow(PipelineError);

      try {
        new Pipeline<number, number>()
          .send(0)
          .through([throwingPipe])
          .then((v) => v);
        expect.fail("expected the pipeline to throw");
      } catch (error) {
        expect(error).toBeInstanceOf(PipelineError);
        expect((error as PipelineError).code).toBe("PIPE_EXECUTION_FAILED");
        expect((error as PipelineError).cause).toBeInstanceOf(Error);
        expect((error as PipelineError).cause?.message).toBe("boom");
      }
    });

    it("preserves an already-typed PipelineError unchanged (no double-wrap)", () => {
      const original = new PipelineError("typed", "CUSTOM_CODE");
      const throwingPipe = (_value: number, _next: (value: number) => unknown): unknown => {
        throw original;
      };

      // `carry()` re-throws the existing PipelineError as-is so the
      // caller-facing `code` is preserved.
      try {
        new Pipeline<number, number>()
          .send(0)
          .through([throwingPipe])
          .then((v) => v);
        expect.fail("expected the pipeline to throw");
      } catch (error) {
        expect(error).toBe(original);
      }
    });
  });

  describe("object pipes", () => {
    it("invokes the default `handle` method on an object pipe", () => {
      // `Pipeline` treats an object as an `{ handle(value, next) }`
      // pipe by default. This is the OOP-style middleware shape.
      const handler = {
        handle: vi.fn((value: number, next: (v: number) => unknown) => next(value + 1)),
      };

      const result = new Pipeline<number, number>()
        .send(1)
        .through([handler])
        .then((value) => value);

      expect(result).toBe(2);
      expect(handler.handle).toHaveBeenCalledTimes(1);
    });

    it("invokes a custom method name via `.via(name)`", () => {
      // `.via('process')` overrides the handler name for every object
      // pipe in the chain. Handy for interop with adapters that use a
      // different method-name convention.
      const handler = {
        process: vi.fn((value: number, next: (v: number) => unknown) => next(value + 100)),
      };

      const result = new Pipeline<number, number>()
        .send(0)
        .through([handler])
        .via("process")
        .then((value) => value);

      expect(result).toBe(100);
      expect(handler.process).toHaveBeenCalledTimes(1);
    });

    it("throws when the pipe object has no matching handler method", () => {
      // The pipe has no `handle` and no override — `carry()` wraps
      // the METHOD_NOT_FOUND diagnostic in a PipelineError.
      const bad = { doStuff: () => "x" };

      try {
        new Pipeline<number, number>()
          .send(0)
          .through([bad])
          .then((v) => v);
        expect.fail("expected the pipeline to throw");
      } catch (error) {
        expect(error).toBeInstanceOf(PipelineError);
        expect((error as PipelineError).code).toBe("METHOD_NOT_FOUND");
      }
    });
  });

  describe("tuple pipes", () => {
    it("forwards tuple params to a function pipe AFTER `next` — matching the object / string pipe convention", () => {
      // The tuple docblock in `pipeline-options.interface.ts`
      // documents params flowing "after `passable` and `next`". Every
      // pipe type — function, object, string — honours that contract.
      const captured: unknown[][] = [];
      const paramPipe = (
        value: number,
        next: (v: number) => unknown,
        delta: number,
        multiplier: number,
      ): unknown => {
        captured.push([value, next, delta, multiplier]);
        return next(value * multiplier + delta);
      };

      const result = new Pipeline<number, number>()
        .send(3)
        .through([[paramPipe, 5, 10]])
        .then((v) => v);

      // 3 * 10 + 5 = 35 — both extra params reached the pipe.
      expect(result).toBe(35);
      expect(captured).toHaveLength(1);
      expect(captured[0]).toHaveLength(4);
      expect(captured[0][0]).toBe(3);
      expect(typeof captured[0][1]).toBe("function");
      expect(captured[0][2]).toBe(5);
      expect(captured[0][3]).toBe(10);
    });

    it("supports [objectPipe, ...params] tuples for parameterised object pipes", () => {
      const pipe = {
        handle: (value: number, next: (v: number) => unknown, offset: number) =>
          next(value + offset),
      };
      const spy = vi.spyOn(pipe, "handle");

      const result = new Pipeline<number, number>()
        .send(1)
        .through([[pipe, 100]])
        .then((v) => v);

      expect(result).toBe(101);
      // Verify the extra param was forwarded to `handle` after next.
      const args = spy.mock.calls[0];
      expect(args[0]).toBe(1);
      expect(typeof args[1]).toBe("function");
      expect(args[2]).toBe(100);
    });
  });

  describe("container resolution (string pipes)", () => {
    it("resolves a string pipe from the DI container and calls its `handle`", () => {
      const app = new MockApplication();

      // The container returns a real pipe instance for the token
      // 'authPipe'. `Pipeline.carry()` will look it up and invoke
      // `handle(value, next)`.
      const authPipe = {
        handle: (value: number, next: (v: number) => unknown) => next(value + 42),
      };
      app.provide("authPipe", authPipe);

      const result = new Pipeline<number, number>(app)
        .send(0)
        .through(["authPipe"])
        .then((v) => v);

      expect(result).toBe(42);
    });

    it("throws NO_CONTAINER when a string pipe is used without a container", () => {
      // No container passed to the constructor — string pipes have
      // nowhere to resolve from.
      try {
        new Pipeline<number, number>()
          .send(0)
          .through(["authPipe"])
          .then((v) => v);
        expect.fail("expected the pipeline to throw");
      } catch (error) {
        expect(error).toBeInstanceOf(PipelineError);
        expect((error as PipelineError).code).toBe("NO_CONTAINER");
      }
    });

    it("throws PIPE_RESOLUTION_FAILED when the container cannot resolve the token", () => {
      // MockApplication.get() throws when the token is not
      // registered — `carry()` wraps that in a PipelineError.
      const app = new MockApplication();

      try {
        new Pipeline<number, number>(app)
          .send(0)
          .through(["missing-token"])
          .then((v) => v);
        expect.fail("expected the pipeline to throw");
      } catch (error) {
        expect(error).toBeInstanceOf(PipelineError);
        expect((error as PipelineError).code).toBe("PIPE_RESOLUTION_FAILED");
      }
    });

    it("throws INVALID_RESOLVED_PIPE when the container returns a non-object", () => {
      const app = new MockApplication();
      // The registered value is a primitive — not usable as a pipe.
      app.provide("bad-pipe", "not-an-object");

      try {
        new Pipeline<number, number>(app)
          .send(0)
          .through(["bad-pipe"])
          .then((v) => v);
        expect.fail("expected the pipeline to throw");
      } catch (error) {
        expect(error).toBeInstanceOf(PipelineError);
        expect((error as PipelineError).code).toBe("INVALID_RESOLVED_PIPE");
      }
    });
  });

  describe("fluent API — `.pipe(...)` and `.finally(...)`", () => {
    it("`pipe(...)` appends to the existing chain instead of replacing it", () => {
      // `.through(...)` REPLACES the pipes. `.pipe(...)` appends,
      // letting callers conditionally extend a base configuration.
      const result = new Pipeline<number, number>()
        .send(1)
        .through([addPipe(2)])
        .pipe(addPipe(3), addPipe(4))
        .then((v) => v);

      // 1 + 2 + 3 + 4 = 10.
      expect(result).toBe(10);
    });

    it("`finally(...)` runs the callback with the (original) passable after execution", () => {
      // The finally callback receives the ORIGINAL passable (not the
      // per-pipe transformed value) because it fires after
      // `pipeline(this.passable)` returns.
      const seen: number[] = [];
      const result = new Pipeline<number, number>()
        .send(5)
        .through([addPipe(10)])
        .finally((passable) => {
          seen.push(passable);
        })
        .then((v) => v);

      expect(result).toBe(15);
      // The recorded passable is the original send() value.
      expect(seen).toEqual([5]);
    });
  });

  describe("invalid pipe types", () => {
    it("throws INVALID_PIPE_TYPE when a pipe is null / undefined / primitive", () => {
      // `null` isn't a function, string, object, or tuple — the
      // dispatcher rejects it up front.
      try {
        new Pipeline<number, number>()
          .send(0)
          .through([null as unknown as never])
          .then((v) => v);
        expect.fail("expected the pipeline to throw");
      } catch (error) {
        expect(error).toBeInstanceOf(PipelineError);
        expect((error as PipelineError).code).toBe("INVALID_PIPE_TYPE");
      }
    });

    it("throws INVALID_PIPE_ENTRY when a tuple's first element is invalid", () => {
      try {
        new Pipeline<number, number>()
          .send(0)
          // Tuple with a non-callable, non-object, non-string first
          // entry. carry() → handleTuplePipe rejects with
          // INVALID_PIPE_ENTRY.
          .through([[123 as unknown as never, "p1"]])
          .then((v) => v);
        expect.fail("expected the pipeline to throw");
      } catch (error) {
        expect(error).toBeInstanceOf(PipelineError);
        expect((error as PipelineError).code).toBe("INVALID_PIPE_ENTRY");
      }
    });
  });
});
