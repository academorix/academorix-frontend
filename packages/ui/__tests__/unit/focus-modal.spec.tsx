// @vitest-environment jsdom
/**
 * @file focus-modal.spec.tsx
 * @module @stackra/ui/__tests__/unit
 * @description Behavioural spec for `<FocusModal>` compound — the full-screen
 *   focus modal for create/edit workflows. Covers open/closed rendering,
 *   Header title + description, Body children, Footer children, and
 *   `className` passthrough on each part.
 */

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { FocusModal } from "@/react/components/focus-modal/focus-modal.component";

afterEach(cleanup);

describe("<FocusModal>", () => {
  it("does not render the dialog when closed", () => {
    render(
      <FocusModal open={false} onOpenChange={vi.fn()}>
        <FocusModal.Header title="Create" />
        <FocusModal.Body>body</FocusModal.Body>
        <FocusModal.Footer>footer</FocusModal.Footer>
      </FocusModal>,
    );
    expect(screen.queryByText("Create")).toBeNull();
    expect(screen.queryByText("body")).toBeNull();
  });

  it("renders the header title when open", () => {
    render(
      <FocusModal open onOpenChange={vi.fn()}>
        <FocusModal.Header title="Create Product" />
      </FocusModal>,
    );
    expect(screen.getByText("Create Product")).toBeDefined();
  });

  it("renders the header description when provided", () => {
    render(
      <FocusModal open onOpenChange={vi.fn()}>
        <FocusModal.Header
          description="Add a new product to your catalog."
          title="Create Product"
        />
      </FocusModal>,
    );
    expect(screen.getByText("Add a new product to your catalog.")).toBeDefined();
  });

  it("renders body children when open", () => {
    render(
      <FocusModal open onOpenChange={vi.fn()}>
        <FocusModal.Body>
          <span data-testid="body-child">body content</span>
        </FocusModal.Body>
      </FocusModal>,
    );
    expect(screen.getByTestId("body-child")).toBeDefined();
  });

  it("renders footer children when open", () => {
    render(
      <FocusModal open onOpenChange={vi.fn()}>
        <FocusModal.Footer>
          <button data-testid="save-btn" type="button">
            Save
          </button>
        </FocusModal.Footer>
      </FocusModal>,
    );
    expect(screen.getByTestId("save-btn")).toBeDefined();
  });

  it("renders header extras alongside the close trigger", () => {
    render(
      <FocusModal open onOpenChange={vi.fn()}>
        <FocusModal.Header title="Wizard">
          <span data-testid="header-extra">Step 1 of 3</span>
        </FocusModal.Header>
      </FocusModal>,
    );
    expect(screen.getByTestId("header-extra")).toBeDefined();
  });

  it('stamps data-component="focus-modal" on the dialog element', () => {
    render(
      <FocusModal open onOpenChange={vi.fn()}>
        <FocusModal.Header title="Create" />
      </FocusModal>,
    );
    // The dialog is rendered inside a portal — search the whole document.
    expect(document.querySelector('[data-component="focus-modal"]')).not.toBeNull();
  });

  it("forwards className onto the dialog element", () => {
    render(
      <FocusModal className="my-modal" open onOpenChange={vi.fn()}>
        <FocusModal.Header title="Create" />
      </FocusModal>,
    );
    const dialog = document.querySelector('[data-component="focus-modal"]');
    expect(dialog?.className.includes("my-modal")).toBe(true);
  });
});
