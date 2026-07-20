/**
 * @file event-emitter.test.ts
 * @description Tests for the EventEmitter service using @stackra/testing infrastructure.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { EventEmitter } from "@/core/services/event-emitter.service";

describe("EventEmitter", () => {
  let emitter: EventEmitter;

  beforeEach(() => {
    emitter = new EventEmitter();
  });

  // ==========================================================================
  // Subscription & Emission
  // ==========================================================================

  describe("on / emit", () => {
    it("calls registered listeners on emit", () => {
      const received: unknown[] = [];
      emitter.on("user.created", (data) => received.push(data));
      emitter.emit("user.created", { id: "123" });

      expect(received).toEqual([{ id: "123" }]);
    });

    it("supports multiple listeners for the same event", () => {
      const calls: number[] = [];
      emitter.on("test", () => calls.push(1));
      emitter.on("test", () => calls.push(2));
      emitter.on("test", () => calls.push(3));

      emitter.emit("test");
      expect(calls).toEqual([1, 2, 3]);
    });

    it("returns true when listeners are called", () => {
      emitter.on("event", () => {});
      expect(emitter.emit("event")).toBe(true);
    });

    it("returns false when no listeners exist", () => {
      expect(emitter.emit("nothing")).toBe(false);
    });

    it("passes multiple arguments to listeners", () => {
      let received: unknown[] = [];
      emitter.on("multi", (...args) => {
        received = args;
      });
      emitter.emit("multi", "a", "b", "c");

      expect(received).toEqual(["a", "b", "c"]);
    });
  });

  // ==========================================================================
  // once
  // ==========================================================================

  describe("once", () => {
    it("fires listener only once then auto-removes", () => {
      let count = 0;
      emitter.once("event", () => count++);

      emitter.emit("event");
      emitter.emit("event");
      emitter.emit("event");

      expect(count).toBe(1);
    });
  });

  // ==========================================================================
  // off / removeAllListeners
  // ==========================================================================

  describe("off", () => {
    it("removes a specific listener", () => {
      let count = 0;
      const handler = () => count++;

      emitter.on("event", handler);
      emitter.off("event", handler);
      emitter.emit("event");

      expect(count).toBe(0);
    });

    it("removeAllListeners clears all listeners for an event", () => {
      emitter.on("event", () => {});
      emitter.on("event", () => {});
      emitter.removeAllListeners("event");

      expect(emitter.hasListeners("event")).toBe(false);
    });

    it("removeAllListeners without args clears everything", () => {
      emitter.on("a", () => {});
      emitter.on("b", () => {});
      emitter.removeAllListeners();

      expect(emitter.eventNames()).toHaveLength(0);
    });
  });

  // ==========================================================================
  // prependListener
  // ==========================================================================

  describe("prependListener", () => {
    it("fires prepended listener before others", () => {
      const order: string[] = [];
      emitter.on("event", () => order.push("second"));
      emitter.prependListener("event", () => order.push("first"));

      emitter.emit("event");
      expect(order).toEqual(["first", "second"]);
    });
  });

  // ==========================================================================
  // Async emission
  // ==========================================================================

  describe("emitAsync", () => {
    it("awaits async listeners sequentially", async () => {
      const order: number[] = [];

      emitter.on("event", async () => {
        await new Promise((r) => setTimeout(r, 5));
        order.push(1);
      });
      emitter.on("event", async () => {
        order.push(2);
      });

      await emitter.emitAsync("event");
      expect(order).toEqual([1, 2]);
    });

    it("returns results from all listeners", async () => {
      emitter.on("calc", () => 10);
      emitter.on("calc", () => 20);

      const results = await emitter.emitAsync("calc");
      expect(results).toEqual([10, 20]);
    });
  });

  // ==========================================================================
  // Introspection
  // ==========================================================================

  describe("introspection", () => {
    it("listenerCount returns correct count", () => {
      emitter.on("event", () => {});
      emitter.on("event", () => {});
      expect(emitter.listenerCount("event")).toBe(2);
    });

    it("eventNames returns all registered events", () => {
      emitter.on("a", () => {});
      emitter.on("b", () => {});
      emitter.on("c", () => {});

      const names = emitter.eventNames();
      expect(names).toContain("a");
      expect(names).toContain("b");
      expect(names).toContain("c");
    });

    it("hasListeners returns correct boolean", () => {
      expect(emitter.hasListeners("empty")).toBe(false);
      emitter.on("full", () => {});
      expect(emitter.hasListeners("full")).toBe(true);
    });
  });

  // ==========================================================================
  // Wildcard matching
  // ==========================================================================

  describe("wildcard", () => {
    let wildcardEmitter: EventEmitter;

    beforeEach(() => {
      wildcardEmitter = new EventEmitter({ wildcard: true, delimiter: "." } as any);
    });

    it("* matches one segment", () => {
      const received: string[] = [];
      wildcardEmitter.on("user.*", (eventName: string) => received.push(eventName));

      wildcardEmitter.emit("user.created");
      wildcardEmitter.emit("user.updated");
      wildcardEmitter.emit("order.created"); // should NOT match

      expect(received).toEqual(["user.created", "user.updated"]);
    });

    it("** matches multiple segments", () => {
      const received: string[] = [];
      wildcardEmitter.on("app.**", (eventName: string) => received.push(eventName));

      wildcardEmitter.emit("app.user.created");
      wildcardEmitter.emit("app.order.payment.completed");
      wildcardEmitter.emit("other.event"); // should NOT match

      expect(received).toEqual(["app.user.created", "app.order.payment.completed"]);
    });
  });

  // ==========================================================================
  // Transactional events
  // ==========================================================================

  describe("transactional events", () => {
    it("emitAfterCommit buffers events", () => {
      const received: string[] = [];
      emitter.on("order.created", () => received.push("fired"));

      emitter.emitAfterCommit("order.created", { id: "abc" });

      // Event should NOT have fired yet
      expect(received).toHaveLength(0);
      expect(emitter.hasPendingEvents()).toBe(true);
    });

    it("flushPendingEvents dispatches buffered events", () => {
      const received: unknown[] = [];
      emitter.on("order.created", (data) => received.push(data));

      emitter.emitAfterCommit("order.created", { id: "abc" });
      emitter.flushPendingEvents();

      expect(received).toEqual([{ id: "abc" }]);
      expect(emitter.hasPendingEvents()).toBe(false);
    });

    it("discardPendingEvents drops buffered events without firing", () => {
      const received: unknown[] = [];
      emitter.on("order.created", (data) => received.push(data));

      emitter.emitAfterCommit("order.created", { id: "abc" });
      emitter.discardPendingEvents();

      expect(received).toHaveLength(0);
      expect(emitter.hasPendingEvents()).toBe(false);
    });
  });

  // ==========================================================================
  // Typed dispatch
  // ==========================================================================

  describe("dispatch (typed event objects)", () => {
    it("dispatches using class name as event", () => {
      class OrderCreated {
        constructor(public readonly orderId: string) {}
      }

      const received: unknown[] = [];
      emitter.on("OrderCreated", (event) => received.push(event));

      const event = new OrderCreated("ord-123");
      emitter.dispatch(event);

      expect(received).toHaveLength(1);
      expect((received[0] as OrderCreated).orderId).toBe("ord-123");
    });

    it("dispatches using static eventName if defined", () => {
      class OrderCreated {
        static eventName = "order.created";
        constructor(public readonly orderId: string) {}
      }

      const received: unknown[] = [];
      emitter.on("order.created", (event) => received.push(event));

      emitter.dispatch(new OrderCreated("ord-456"));
      expect(received).toHaveLength(1);
    });
  });
});
