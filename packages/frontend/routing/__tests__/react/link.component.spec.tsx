/**
 * @file link.component.spec.tsx
 * @module @stackra/routing/__tests__/react
 * @description Unit tests for the routing `<Link>` component.
 */

// @vitest-environment jsdom

import { describe, expect, it, vi } from "vitest";
import { fireEvent, render } from "@testing-library/react";
import type { ReactNode } from "react";

import { Link } from "@/react/components/link/link.component";
import { StackraRoutingContext } from "@/react/contexts";
import type { IStackraRouter } from "@/react/contexts";

function makeWrapper(navigate = vi.fn()): {
  readonly wrapper: (props: { children: ReactNode }) => JSX.Element;
  readonly navigate: ReturnType<typeof vi.fn>;
} {
  const router = { navigate, fetch: vi.fn() } as unknown as IStackraRouter;
  return {
    navigate,
    wrapper: ({ children }) => (
      <StackraRoutingContext.Provider value={{ container: {} as never, config: {}, router }}>
        {children}
      </StackraRoutingContext.Provider>
    ),
  };
}

describe("<Link>", () => {
  it("intercepts click and dispatches through useNavigate", () => {
    const { wrapper: Wrapper, navigate } = makeWrapper();
    const { getByTestId } = render(
      <Wrapper>
        <Link to="/dashboard" data-testid="link">
          Go
        </Link>
      </Wrapper>,
    );
    const anchor = getByTestId("link");
    fireEvent.click(anchor);
    expect(navigate).toHaveBeenCalledWith("/dashboard", expect.objectContaining({}));
  });

  it("respects the replace prop", () => {
    const { wrapper: Wrapper, navigate } = makeWrapper();
    const { getByTestId } = render(
      <Wrapper>
        <Link to="/dashboard" replace data-testid="link">
          Go
        </Link>
      </Wrapper>,
    );
    fireEvent.click(getByTestId("link"));
    expect(navigate).toHaveBeenCalledWith("/dashboard", expect.objectContaining({ replace: true }));
  });

  it("does not intercept modified clicks (meta/ctrl/shift/alt)", () => {
    const { wrapper: Wrapper, navigate } = makeWrapper();
    const { getByTestId } = render(
      <Wrapper>
        <Link to="/dashboard" data-testid="link">
          Go
        </Link>
      </Wrapper>,
    );
    fireEvent.click(getByTestId("link"), { metaKey: true });
    expect(navigate).not.toHaveBeenCalled();
  });

  it("renders as an anchor with href set to `to`", () => {
    const { wrapper: Wrapper } = makeWrapper();
    const { getByTestId } = render(
      <Wrapper>
        <Link to="/blog" data-testid="link">
          Blog
        </Link>
      </Wrapper>,
    );
    const anchor = getByTestId("link") as HTMLAnchorElement;
    expect(anchor.tagName).toBe("A");
    expect(anchor.getAttribute("href")).toBe("/blog");
  });

  it("triggers prefetch on pointer enter when prefetch=hover", () => {
    const fetch = vi.fn();
    const router = { navigate: vi.fn(), fetch } as unknown as IStackraRouter;
    const Wrapper = ({ children }: { children: ReactNode }): JSX.Element => (
      <StackraRoutingContext.Provider value={{ container: {} as never, config: {}, router }}>
        {children}
      </StackraRoutingContext.Provider>
    );
    const { getByTestId } = render(
      <Wrapper>
        <Link to="/prefetch-target" prefetch="hover" data-testid="link">
          Hover
        </Link>
      </Wrapper>,
    );
    fireEvent.pointerEnter(getByTestId("link"));
    expect(fetch).toHaveBeenCalledWith("/prefetch-target");
  });

  it("does NOT prefetch when prefetch=off", () => {
    const fetch = vi.fn();
    const router = { navigate: vi.fn(), fetch } as unknown as IStackraRouter;
    const Wrapper = ({ children }: { children: ReactNode }): JSX.Element => (
      <StackraRoutingContext.Provider value={{ container: {} as never, config: {}, router }}>
        {children}
      </StackraRoutingContext.Provider>
    );
    const { getByTestId } = render(
      <Wrapper>
        <Link to="/prefetch-target" prefetch="off" data-testid="link">
          Off
        </Link>
      </Wrapper>,
    );
    fireEvent.pointerEnter(getByTestId("link"));
    expect(fetch).not.toHaveBeenCalled();
  });
});
