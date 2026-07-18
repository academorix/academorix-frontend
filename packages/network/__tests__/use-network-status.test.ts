/**
 * @file use-network-status.test.ts
 * @module @stackra/network/__tests__
 * @description Unit tests for the useNetworkStatus React hook.
 *   Tests the hook's subscription logic by mocking React's useState/useEffect
 *   and the DI container's useInject — no @testing-library/react dependency.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// ============================================================================
// Mocks
// ============================================================================

/** Mock NetworkService instance. */
const mockNetworkService = {
  isOnline: vi.fn(() => true),
  getStatus: vi.fn(() =>
    Promise.resolve({ isOnline: true, type: "wifi" as const, downlinkSpeed: 50 }),
  ),
  subscribe: vi.fn((_cb: (status: any) => void) => {
    return vi.fn(); // unsubscribe function
  }),
};

// Track useState calls
let stateValues: any[] = [];
let setStateFns: Array<(v: any) => void> = [];

// Track useEffect calls and their cleanup functions
let effectCallbacks: Array<() => (() => void) | void> = [];

vi.mock("react", () => ({
  useState: (initial: any) => {
    const value = typeof initial === "function" ? initial() : initial;
    stateValues.push(value);
    const setter = vi.fn((newVal: any) => {
      const resolved =
        typeof newVal === "function" ? newVal(stateValues[stateValues.length - 1]) : newVal;
      stateValues[stateValues.length - 1] = resolved;
    });
    setStateFns.push(setter);
    return [value, setter];
  },
  useEffect: (cb: () => (() => void) | void, _deps?: any[]) => {
    effectCallbacks.push(cb);
  },
}));

vi.mock("@stackra/container/react", () => ({
  useInject: vi.fn(() => mockNetworkService),
}));

vi.mock("@stackra/contracts", () => ({
  NETWORK_SERVICE: Symbol.for("NETWORK_SERVICE"),
}));

// Import the hook after mocking
import { useNetworkStatus } from "../src/core/hooks/use-network-status/use-network-status.hook";

// ============================================================================
// Tests
// ============================================================================

describe("useNetworkStatus", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    stateValues = [];
    setStateFns = [];
    effectCallbacks = [];
    mockNetworkService.isOnline.mockReturnValue(true);
    mockNetworkService.getStatus.mockResolvedValue({
      isOnline: true,
      type: "wifi",
      downlinkSpeed: 50,
    });
    mockNetworkService.subscribe.mockImplementation(() => vi.fn());
  });

  it("should return initial online state from NetworkService", () => {
    const result = useNetworkStatus();

    expect(result.isOnline).toBe(true);
  });

  it("should return initial status object with isOnline from service", () => {
    mockNetworkService.isOnline.mockReturnValue(false);

    const result = useNetworkStatus();

    expect(result.isOnline).toBe(false);
    expect(result.status).toEqual({
      isOnline: false,
      type: undefined,
      downlinkSpeed: undefined,
    });
  });

  it("should register a useEffect that subscribes to network changes", () => {
    useNetworkStatus();

    // useEffect should have been called
    expect(effectCallbacks.length).toBeGreaterThan(0);
  });

  it("should subscribe to network changes when effect runs", () => {
    useNetworkStatus();

    // Run the effect
    effectCallbacks[0]?.();

    expect(mockNetworkService.subscribe).toHaveBeenCalledTimes(1);
    expect(mockNetworkService.subscribe).toHaveBeenCalledWith(expect.any(Function));
  });

  it("should call getStatus when effect runs", async () => {
    useNetworkStatus();

    // Run the effect
    effectCallbacks[0]?.();

    // getStatus is called async
    expect(mockNetworkService.getStatus).toHaveBeenCalledTimes(1);
  });

  it("should return unsubscribe as cleanup from useEffect", () => {
    const unsubscribeMock = vi.fn();
    mockNetworkService.subscribe.mockImplementation(() => unsubscribeMock);

    useNetworkStatus();

    // Run the effect — it should return the unsubscribe function
    const cleanup = effectCallbacks[0]?.();

    expect(typeof cleanup).toBe("function");
    // Call the cleanup
    if (typeof cleanup === "function") {
      cleanup();
    }

    expect(unsubscribeMock).toHaveBeenCalledTimes(1);
  });

  it("should invoke setState with new status when subscribe callback fires", () => {
    let capturedCallback: ((status: any) => void) | null = null;

    mockNetworkService.subscribe.mockImplementation((cb: any) => {
      capturedCallback = cb;
      return vi.fn();
    });

    useNetworkStatus();

    // Run the effect to activate subscription
    effectCallbacks[0]?.();

    // The first setState fn corresponds to the status state
    const setStatusFn = setStateFns[0];
    expect(setStatusFn).toBeDefined();

    // Simulate network change
    const newStatus = { isOnline: false, type: "unknown" as const, downlinkSpeed: undefined };
    if (capturedCallback) {
      (capturedCallback as (status: any) => void)(newStatus);
    }

    // The subscribe callback should call setStatus
    expect(setStatusFn).toHaveBeenCalledWith(newStatus);
  });

  it("should return type from the current status", () => {
    const result = useNetworkStatus();

    // Initial status has type undefined (before async getStatus completes)
    expect(result.type).toBeUndefined();
  });

  it("should handle null status gracefully", () => {
    // Force initial state to null-like
    mockNetworkService.isOnline.mockReturnValue(false);

    const result = useNetworkStatus();

    expect(result.isOnline).toBe(false);
  });
});
