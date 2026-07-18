// @vitest-environment jsdom
/**
 * @file pattern-lock.spec.tsx
 * @module @stackra/ui/__tests__/unit
 * @description Behavioural spec for `<PatternLock>` — the Android-style
 *   pattern grid. Full geometry-driven drag testing needs a real
 *   layout engine, so we scope to smoke render, prop-driven size,
 *   disabled state, error/success/invisible visual mode toggles, and
 *   `className` / `data-component` passthrough.
 */

import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { PatternLock } from "@/react/components/pattern-lock/pattern-lock.component";

afterEach(cleanup);

describe("<PatternLock>", () => {
  it("renders `size*size` dot cells for a size=3 grid", () => {
    const { container } = render(<PatternLock path={[]} onChange={vi.fn()} onFinish={vi.fn()} />);
    // The dot grid is the first inner div (`z-20 flex flex-wrap`).
    // Each cell is a direct child.
    const grid = container.querySelector(".z-20");
    expect(grid?.children.length).toBe(9);
  });

  it("renders `size*size` cells for a size=4 grid", () => {
    const { container } = render(
      <PatternLock path={[]} size={4} onChange={vi.fn()} onFinish={vi.fn()} />,
    );
    const grid = container.querySelector(".z-20");
    expect(grid?.children.length).toBe(16);
  });

  it("sets width and height on the root wrapper", () => {
    const { container } = render(
      <PatternLock path={[]} width={200} onChange={vi.fn()} onFinish={vi.fn()} />,
    );
    const root = container.querySelector('[data-component="pattern-lock"]') as HTMLElement;
    expect(root.style.width).toBe("200px");
    expect(root.style.height).toBe("200px");
  });

  it('stamps `data-component="pattern-lock"` on the root wrapper', () => {
    const { container } = render(<PatternLock path={[]} onChange={vi.fn()} onFinish={vi.fn()} />);
    expect(container.querySelector('[data-component="pattern-lock"]')).not.toBeNull();
  });

  it("marks aria-disabled=true when isDisabled", () => {
    const { container } = render(
      <PatternLock isDisabled path={[]} onChange={vi.fn()} onFinish={vi.fn()} />,
    );
    const root = container.querySelector('[data-component="pattern-lock"]') as HTMLElement;
    expect(root.getAttribute("aria-disabled")).toBe("true");
  });

  it("marks aria-disabled=false when not disabled", () => {
    const { container } = render(<PatternLock path={[]} onChange={vi.fn()} onFinish={vi.fn()} />);
    const root = container.querySelector('[data-component="pattern-lock"]') as HTMLElement;
    expect(root.getAttribute("aria-disabled")).toBe("false");
  });

  it("draws connector segments between consecutive path points", () => {
    // `path=[0, 1]` = one connector from cell 0 to cell 1. The
    // connectors container has `z-10` and each connector is an
    // absolutely-positioned div child.
    const { container } = render(
      <PatternLock path={[0, 1]} onChange={vi.fn()} onFinish={vi.fn()} />,
    );
    const connectors = container.querySelector(".z-10");
    // The mapped path renders `path.length - 1` = 1 connector.
    expect(connectors?.children.length).toBe(1);
  });

  it("hides connector segments when isInvisible=true", () => {
    const { container } = render(
      <PatternLock isInvisible path={[0, 1]} onChange={vi.fn()} onFinish={vi.fn()} />,
    );
    // In invisible mode, the whole `.z-10` connectors layer is absent.
    expect(container.querySelector(".z-10")).toBeNull();
  });

  it("applies the danger colour class when isError=true", () => {
    const { container } = render(
      <PatternLock isError path={[0, 1]} onChange={vi.fn()} onFinish={vi.fn()} />,
    );
    // Connector divs pick up `bg-danger` when isError is set.
    const connector = container.querySelector(".z-10 > div");
    expect(connector?.className.includes("bg-danger")).toBe(true);
  });

  it("applies the success colour class when isSuccess=true", () => {
    const { container } = render(
      <PatternLock isSuccess path={[0, 1]} onChange={vi.fn()} onFinish={vi.fn()} />,
    );
    const connector = container.querySelector(".z-10 > div");
    expect(connector?.className.includes("bg-success")).toBe(true);
  });

  it("forwards `className` onto the root", () => {
    const { container } = render(
      <PatternLock className="my-pattern" path={[]} onChange={vi.fn()} onFinish={vi.fn()} />,
    );
    const root = container.querySelector('[data-component="pattern-lock"]');
    expect(root?.className.includes("my-pattern")).toBe(true);
  });

  it("exposes the aria-label for screen readers", () => {
    const { getByLabelText } = render(
      <PatternLock path={[]} onChange={vi.fn()} onFinish={vi.fn()} />,
    );
    expect(getByLabelText("Pattern lock input")).toBeDefined();
  });
});
