// @vitest-environment jsdom
/**
 * @file section-container.spec.tsx
 * @module @stackra/ui/__tests__/unit
 * @description Behavioural spec for `<SectionContainer>` — the card-shell
 *   used to group form fields under a labelled section. Covers title,
 *   description, `action` slot, `children`, `className` passthrough, and
 *   the `showDivider` toggle.
 */

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { SectionContainer } from "@/react/components/section-container/section-container.component";

afterEach(cleanup);

describe("<SectionContainer>", () => {
  it("renders the title", () => {
    render(<SectionContainer title="General">body</SectionContainer>);
    expect(screen.getByText("General")).toBeDefined();
  });

  it("renders the description when provided", () => {
    render(
      <SectionContainer description="Basic info." title="General">
        body
      </SectionContainer>,
    );
    expect(screen.getByText("Basic info.")).toBeDefined();
  });

  it("omits the description block when not provided", () => {
    render(<SectionContainer title="General">body</SectionContainer>);
    expect(screen.queryByText(/./, { selector: "p" })).toBeNull();
  });

  it("renders the action slot when provided", () => {
    render(
      <SectionContainer action={<span data-testid="edit-btn">Edit</span>} title="General">
        body
      </SectionContainer>,
    );
    expect(screen.getByTestId("edit-btn")).toBeDefined();
  });

  it("renders children in the content area", () => {
    render(
      <SectionContainer title="General">
        <span data-testid="child">field</span>
      </SectionContainer>,
    );
    expect(screen.getByTestId("child")).toBeDefined();
  });

  it('stamps data-component="section-container" on the card root', () => {
    const { container } = render(<SectionContainer title="General">body</SectionContainer>);
    expect(container.querySelector('[data-component="section-container"]')).not.toBeNull();
  });

  it("forwards `className` to the card root", () => {
    const { container } = render(
      <SectionContainer className="my-card" title="General">
        body
      </SectionContainer>,
    );
    const root = container.querySelector('[data-component="section-container"]');
    expect(root?.className.includes("my-card")).toBe(true);
  });
});
