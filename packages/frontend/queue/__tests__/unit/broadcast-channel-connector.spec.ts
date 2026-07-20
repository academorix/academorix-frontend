/**
 * @file broadcast-channel-connector.spec.ts
 * @module @stackra/queue/__tests__/unit
 * @description Behavioural spec for the `BroadcastChannelConnector`
 *   + `BroadcastChannelConnection` — cross-tab job distribution
 *   through `@stackra/coordinator`'s `ITabTransportManager`.
 *
 *   Uses `MockTabTransportManager` from `@stackra/coordinator/testing`;
 *   no real `BroadcastChannel` touched.
 */

import { describe, it, expect, beforeEach } from "vitest";

import { MockTabTransportManager } from "@stackra/coordinator/testing";

import { BroadcastChannelConnector } from "@/core/connectors/broadcast-channel.connector";
import type { IQueueConnection, IQueuedJob } from "@/core/interfaces";

describe("BroadcastChannelConnector", () => {
  let manager: MockTabTransportManager;
  let connector: BroadcastChannelConnector;
  let connection: IQueueConnection;

  beforeEach(async () => {
    manager = new MockTabTransportManager();
    connector = new BroadcastChannelConnector(manager);
    connection = await connector.connect({
      driver: "broadcast-channel",
      channelName: "test-queue",
    });
  });

  describe("push", () => {
    it("broadcasts the job to peer tabs AND stores it locally", async () => {
      // Peer manager on the same bus registry — represents a second tab.
      const peer = manager.createPeer();
      const peerChan = peer.channel("test-queue");
      const seen: unknown[] = [];
      peerChan.subscribe((data) => seen.push(data));

      const id = await connection.push("send-email", { to: "alice" });

      expect(id).toBeDefined();
      // The peer received the broadcast.
      expect(seen).toHaveLength(1);
      const msg = seen[0] as { kind: string; job: IQueuedJob };
      expect(msg.kind).toBe("job");
      expect(msg.job.name).toBe("send-email");

      // The sender still has the job locally (leader draining).
      expect(await connection.size()).toBe(1);
    });

    it("local pop drains only local queue (peer broadcast does not double-count)", async () => {
      const peer = manager.createPeer();
      const peerConn = await new BroadcastChannelConnector(peer).connect({
        driver: "broadcast-channel",
        channelName: "test-queue",
      });

      // Local push — broadcasts to peer.
      await connection.push("a", {});

      // Both tabs now see the job in their local queues.
      expect(await connection.size()).toBe(1);
      expect(await peerConn.size()).toBe(1);

      // Local pop only drains local; peer's queue is unaffected.
      const job = await connection.pop();
      expect(job?.name).toBe("a");
      expect(await connection.size()).toBe(0);
      expect(await peerConn.size()).toBe(1);
    });
  });

  describe("size + remove", () => {
    it("counts per named queue", async () => {
      await connection.push("a", {}, { queue: "high" });
      await connection.push("b", {}, { queue: "low" });
      await connection.push("c", {}, { queue: "high" });

      expect(await connection.size("high")).toBe(2);
      expect(await connection.size("low")).toBe(1);
    });

    it("remove drops the local entry by id", async () => {
      const id = await connection.push("a", {});
      await connection.remove(id);
      expect(await connection.size()).toBe(0);
    });
  });

  describe("clear", () => {
    it("scopes to a single queue name", async () => {
      await connection.push("a", {}, { queue: "x" });
      await connection.push("b", {}, { queue: "y" });
      await connection.clear("x");

      expect(await connection.size("x")).toBe(0);
      expect(await connection.size("y")).toBe(1);
    });
  });

  describe("close", () => {
    it("unsubs and drops the local queue but leaves the shared channel open", async () => {
      const peer = manager.createPeer();
      const peerChan = peer.channel("test-queue");

      // Sanity — a peer broadcast lands in our local queue.
      peerChan.broadcast({
        kind: "job",
        job: {
          id: "peer-1",
          name: "peer",
          data: {},
          attempts: 0,
          maxAttempts: 1,
          queue: "default",
          createdAt: Date.now(),
        } satisfies IQueuedJob,
      });
      expect(await connection.size()).toBe(1);

      await connection.close();

      // Local queue was cleared.
      expect(await connection.size()).toBe(0);

      // Post-close broadcasts don't land locally (unsubscribed).
      peerChan.broadcast({
        kind: "job",
        job: {
          id: "peer-2",
          name: "peer2",
          data: {},
          attempts: 0,
          maxAttempts: 1,
          queue: "default",
          createdAt: Date.now(),
        } satisfies IQueuedJob,
      });
      expect(await connection.size()).toBe(0);

      // But the manager still holds the shared channel — other
      // consumers on the same channel keep working.
      expect(manager.hasChannel("test-queue")).toBe(true);
    });
  });

  describe("tab-local fallback (no manager)", () => {
    it("falls back to a local-only queue when the manager is undefined", async () => {
      const standalone = new BroadcastChannelConnector();
      const conn = await standalone.connect({
        driver: "broadcast-channel",
        channelName: "test-queue",
      });

      const id = await conn.push("a", {});
      expect(id).toBeDefined();
      expect(await conn.size()).toBe(1);

      const job = await conn.pop();
      expect(job?.name).toBe("a");
    });

    it("falls back when the manager reports unsupported", async () => {
      const unsupported = new MockTabTransportManager();
      unsupported.simulateUnsupported();
      const conn = await new BroadcastChannelConnector(unsupported).connect({
        driver: "broadcast-channel",
        channelName: "test-queue",
      });
      await conn.push("a", {});
      expect(await conn.size()).toBe(1);
      // Manager didn't cache a channel because we never opened one.
      expect(unsupported.hasChannel("test-queue")).toBe(false);
    });
  });

  describe("bulk", () => {
    it("pushes and broadcasts every job", async () => {
      const peer = manager.createPeer();
      const seen: unknown[] = [];
      peer.channel("test-queue").subscribe((data) => seen.push(data));

      const ids = await connection.bulk([
        { name: "a", data: {} },
        { name: "b", data: {} },
      ]);

      expect(ids).toHaveLength(2);
      expect(seen).toHaveLength(2);
    });
  });
});
