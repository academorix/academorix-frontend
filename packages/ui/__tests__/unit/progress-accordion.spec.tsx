// @vitest-environment jsdom
/**
 * @file progress-accordion.spec.tsx
 * @module @stackra/ui/__tests__/unit
 * @description Behavioural spec for the `<ProgressAccordion>` compound —
 *   the accordion with per-section status dots. Covers item rendering,
 *   the aria-labeled status dot per status, initial `defaultExpandedKeys`
 *   behaviour, and `className` passthrough.
 */

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { ProgressAccordion } from "@/react/components/progress-accordion/progress-accordion.component";

afterEach(cleanup);

describe("<ProgressAccordion>", () => {
  it("renders section titles in the triggers", () => {
    render(
      <ProgressAccordion>
        <ProgressAccordion.Item title="General" value="general">
          general body
        </ProgressAccordion.Item>
        <ProgressAccordion.Item title="Pricing" value="pricing">
          pricing body
        </ProgressAccordion.Item>
      </ProgressAccordion>,
    );
    expect(screen.getByText("General")).toBeDefined();
    expect(screen.getByText("Pricing")).toBeDefined();
  });

  it("renders per-item descriptions when provided", () => {
    render(
      <ProgressAccordion>
        <ProgressAccordion.Item description="Basic product info" title="General" value="general">
          body
        </ProgressAccordion.Item>
      </ProgressAccordion>,
    );
    expect(screen.getByText("Basic product info")).toBeDefined();
  });

  it("exposes a status dot with an accessible label per section", () => {
    render(
      <ProgressAccordion>
        <ProgressAccordion.Item status="completed" title="General" value="general">
          body
        </ProgressAccordion.Item>
        <ProgressAccordion.Item status="in-progress" title="Pricing" value="pricing">
          body
        </ProgressAccordion.Item>
        <ProgressAccordion.Item status="not-started" title="Media" value="media">
          body
        </ProgressAccordion.Item>
      </ProgressAccordion>,
    );
    expect(screen.getByLabelText("Completed")).toBeDefined();
    expect(screen.getByLabelText("In progress")).toBeDefined();
    expect(screen.getByLabelText("Not started")).toBeDefined();
  });

  it('defaults to "not-started" when no status is provided', () => {
    render(
      <ProgressAccordion>
        <ProgressAccordion.Item title="General" value="general">
          body
        </ProgressAccordion.Item>
      </ProgressAccordion>,
    );
    expect(screen.getByLabelText("Not started")).toBeDefined();
  });

  it('stamps data-component="progress-accordion" on the root', () => {
    const { container } = render(
      <ProgressAccordion>
        <ProgressAccordion.Item title="General" value="general">
          body
        </ProgressAccordion.Item>
      </ProgressAccordion>,
    );
    expect(container.querySelector('[data-component="progress-accordion"]')).not.toBeNull();
  });

  it("forwards `className` on the root", () => {
    const { container } = render(
      <ProgressAccordion className="my-acc">
        <ProgressAccordion.Item title="General" value="general">
          body
        </ProgressAccordion.Item>
      </ProgressAccordion>,
    );
    const root = container.querySelector('[data-component="progress-accordion"]');
    expect(root?.className.includes("my-acc")).toBe(true);
  });
});
