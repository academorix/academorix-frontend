/**
 * @file create-feature-flags-context.test.tsx
 * @module @academorix/feature-flags/context/__tests__/create-feature-flags-context.test
 *
 * @description
 * Covers the {@link createFeatureFlagsContext} factory: default
 * lookup, per-key override, sparse-object shadow-merge, reactive
 * updates when the parent re-renders with a new `overrides`
 * reference, and the `useAllFeatures` full-map accessor.
 *
 * Compile-time-only assertions (e.g. `useFeature("undeclared")`
 * fails typecheck) are handled by the tsconfig — no runtime test
 * needed. They live here as commented ambient examples so a future
 * reader knows what the factory guarantees.
 */

import { fireEvent, render, renderHook } from "@testing-library/react";
import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { defineFlags } from "../../config/define-flags.util";
import { createFeatureFlagsContext } from "../create-feature-flags-context";

import type { PropsWithChildren } from "react";

const DEFAULT_FLAGS = defineFlags({
  x: false,
  y: true,
  z: false,
});

type Flag = keyof typeof DEFAULT_FLAGS;

afterEach(() => {
  vi.restoreAllMocks();
});

describe("FeatureFlagsProvider — no overrides", () => {
  it("returns the static default for a flag when no overrides are set", () => {
    const { FeatureFlagsProvider, useFeature } = createFeatureFlagsContext<Flag>(DEFAULT_FLAGS);
    const wrapper = ({ children }: PropsWithChildren): React.ReactElement => (
      <FeatureFlagsProvider>{children}</FeatureFlagsProvider>
    );

    const { result: xResult } = renderHook(() => useFeature("x"), { wrapper });
    const { result: yResult } = renderHook(() => useFeature("y"), { wrapper });

    expect(xResult.current).toBe(false);
    expect(yResult.current).toBe(true);
  });

  it("exposes the static defaults on the returned bundle", () => {
    const bundle = createFeatureFlagsContext<Flag>(DEFAULT_FLAGS);

    expect(bundle.defaults).toBe(DEFAULT_FLAGS);
  });
});

describe("FeatureFlagsProvider — with overrides", () => {
  it("prefers a boolean override over the default", () => {
    const { FeatureFlagsProvider, useFeature } = createFeatureFlagsContext<Flag>(DEFAULT_FLAGS);
    const wrapper = ({ children }: PropsWithChildren): React.ReactElement => (
      <FeatureFlagsProvider overrides={{ x: true }}>{children}</FeatureFlagsProvider>
    );

    const { result } = renderHook(() => useFeature("x"), { wrapper });

    expect(result.current).toBe(true);
  });

  it("ignores an explicit `undefined` override (falls through to default)", () => {
    const { FeatureFlagsProvider, useFeature } = createFeatureFlagsContext<Flag>(DEFAULT_FLAGS);
    // `y` defaults to true — passing `undefined` must NOT flip it to
    // the falsy branch. Callers pass sparse objects safely.
    const wrapper = ({ children }: PropsWithChildren): React.ReactElement => (
      <FeatureFlagsProvider overrides={{ y: undefined }}>{children}</FeatureFlagsProvider>
    );

    const { result } = renderHook(() => useFeature("y"), { wrapper });

    expect(result.current).toBe(true);
  });

  it("shadow-merges partial overrides — unmentioned keys keep their default", () => {
    const { FeatureFlagsProvider, useAllFeatures } = createFeatureFlagsContext<Flag>(DEFAULT_FLAGS);
    const wrapper = ({ children }: PropsWithChildren): React.ReactElement => (
      // Override only `x`. `y` and `z` should keep their defaults.
      <FeatureFlagsProvider overrides={{ x: true }}>{children}</FeatureFlagsProvider>
    );

    const { result } = renderHook(() => useAllFeatures(), { wrapper });

    expect(result.current).toEqual({ x: true, y: true, z: false });
  });
});

describe("useAllFeatures", () => {
  it("returns the full effective flag map", () => {
    const { FeatureFlagsProvider, useAllFeatures } = createFeatureFlagsContext<Flag>(DEFAULT_FLAGS);
    const wrapper = ({ children }: PropsWithChildren): React.ReactElement => (
      <FeatureFlagsProvider overrides={{ x: true, z: true }}>{children}</FeatureFlagsProvider>
    );

    const { result } = renderHook(() => useAllFeatures(), { wrapper });

    expect(result.current).toEqual({ x: true, y: true, z: true });
  });

  it("returns the untouched defaults when no overrides are set", () => {
    const { FeatureFlagsProvider, useAllFeatures } = createFeatureFlagsContext<Flag>(DEFAULT_FLAGS);
    const wrapper = ({ children }: PropsWithChildren): React.ReactElement => (
      <FeatureFlagsProvider>{children}</FeatureFlagsProvider>
    );

    const { result } = renderHook(() => useAllFeatures(), { wrapper });

    expect(result.current).toEqual({ x: false, y: true, z: false });
  });
});

describe("FeatureFlagsProvider — reactive updates", () => {
  it("re-renders consumers when the parent passes a new overrides object", () => {
    const { FeatureFlagsProvider, useFeature } = createFeatureFlagsContext<Flag>(DEFAULT_FLAGS);
    let capturedFlagX: boolean | undefined;

    function Reader(): React.ReactElement {
      capturedFlagX = useFeature("x");

      return <span>{capturedFlagX ? "on" : "off"}</span>;
    }

    function App(): React.ReactElement {
      const [overrides, setOverrides] = useState<Partial<Record<Flag, boolean | undefined>>>({
        x: false,
      });

      return (
        <FeatureFlagsProvider overrides={overrides}>
          <button type="button" onClick={(): void => setOverrides({ x: true })}>
            flip
          </button>
          <Reader />
        </FeatureFlagsProvider>
      );
    }

    const { getByRole } = render(<App />);

    // Initial state comes from the initial overrides object.
    expect(capturedFlagX).toBe(false);

    fireEvent.click(getByRole("button"));

    // A new overrides reference should have flipped the flag.
    expect(capturedFlagX).toBe(true);
  });
});
