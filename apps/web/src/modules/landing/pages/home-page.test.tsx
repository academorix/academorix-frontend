/**
 * @file home-page.test.tsx
 * @module modules/landing/pages/home-page.test
 *
 * @description
 * Smoke tests for the public landing page: the header exposes the wordmark and
 * the page surfaces its primary call to action. Wrapped in `MemoryRouter`
 * because the header/footer links and CTA buttons touch router context. Queries
 * are scoped (banner landmark) or use `getAllBy*` because the marketing layout
 * intentionally repeats the wordmark (header + footer) and the "Get started"
 * CTA (hero + closing banner).
 */

import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";

import { siteConfig } from "@/config/site";
import HomePage from "@/modules/landing/pages/home-page";

describe("HomePage", () => {
  it("renders the Academorix wordmark in the header", () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>,
    );

    const header = screen.getByRole("banner");

    expect(within(header).getByText(siteConfig.name)).toBeInTheDocument();
  });

  it("exposes the primary call to action", () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>,
    );

    expect(screen.getAllByRole("button", { name: /get started/i }).length).toBeGreaterThan(0);
  });
});
