/**
 * @file create-realtime-context.test.tsx
 * @module @academorix/realtime/context/__tests__/create-realtime-context.test
 *
 * @description
 * Covers the {@link createRealtimeContext} factory: hook guard when
 * called outside a provider, happy-path client passthrough, and
 * context-value updates when the parent re-renders with a new client
 * instance.
 */

import { fireEvent, render, renderHook } from "@testing-library/react";
import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { createRealtimeContext } from "../create-realtime-context";

import type { RealtimeClient } from "../../client/realtime-client.type";
import type { PropsWithChildren } from "react";

/**
 * A minimal `RealtimeClient` stand-in — every method is a stub so
 * the tests can identify a client instance by reference without
 * exercising any transport code.
 */
function stubClient(): RealtimeClient {
  return {
    channel: vi.fn().mockReturnValue({
      listen: vi.fn().mockReturnThis(),
      listenToAll: vi.fn().mockReturnThis(),
      stopListening: vi.fn().mockReturnThis(),
    }),
    private: vi.fn().mockReturnValue({
      listen: vi.fn().mockReturnThis(),
      listenToAll: vi.fn().mockReturnThis(),
      stopListening: vi.fn().mockReturnThis(),
    }),
    presence: vi.fn().mockReturnValue({
      listen: vi.fn().mockReturnThis(),
      listenToAll: vi.fn().mockReturnThis(),
      stopListening: vi.fn().mockReturnThis(),
    }),
    leave: vi.fn(),
    disconnect: vi.fn().mockResolvedValue(undefined),
  };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("useRealtimeClient — guard rail", () => {
  it("throws when called outside a RealtimeProvider", () => {
    const { useRealtimeClient } = createRealtimeContext();

    // React's error boundary machinery logs to console.error; silence
    // the trace so the test output stays clean.
    const reactErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    expect(() => renderHook(() => useRealtimeClient())).toThrow(
      /useRealtimeClient must be used within a <RealtimeProvider>/,
    );

    reactErrorSpy.mockRestore();
  });
});

describe("useRealtimeClient — inside provider", () => {
  it("returns the exact client instance passed to the provider", () => {
    const client = stubClient();
    const { RealtimeProvider, useRealtimeClient } = createRealtimeContext();
    const wrapper = ({ children }: PropsWithChildren): React.ReactElement => (
      <RealtimeProvider client={client}>{children}</RealtimeProvider>
    );

    const { result } = renderHook(() => useRealtimeClient(), { wrapper });

    expect(result.current).toBe(client);
  });
});

describe("RealtimeProvider — client swap", () => {
  it("updates the context value when the parent re-renders with a new client", () => {
    const firstClient = stubClient();
    const secondClient = stubClient();

    const { RealtimeProvider, useRealtimeClient } = createRealtimeContext();

    let observed: RealtimeClient | null = null;

    function Reader(): React.ReactElement {
      observed = useRealtimeClient();

      return <span>reader</span>;
    }

    function App(): React.ReactElement {
      const [client, setClient] = useState<RealtimeClient>(firstClient);

      return (
        <RealtimeProvider client={client}>
          <button type="button" onClick={(): void => setClient(secondClient)}>
            swap
          </button>
          <Reader />
        </RealtimeProvider>
      );
    }

    const { getByRole } = render(<App />);

    expect(observed).toBe(firstClient);

    fireEvent.click(getByRole("button"));

    expect(observed).toBe(secondClient);
  });
});
