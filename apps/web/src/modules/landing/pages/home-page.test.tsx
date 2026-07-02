/**
 * @file home-page.test.tsx
 * @module modules/landing/pages/home-page.test
 *
 * @description
 * Smoke tests for the public landing page: it renders the wordmark and the
 * primary call to action. Wrapped in `MemoryRouter` because HeroUI links/
 * buttons may touch router context.
 */

import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";

import HomePage from "@/modules/landing/pages/home-page";

describe("HomePage", () => {
  it("renders the Academorix wordmark", () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>,
    );

    expect(screen.getByText("Academorix")).toBeInTheDocument();
  });

  it("exposes the primary call to action", () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>,
    );

    expect(screen.getByRole("button", { name: /get started/i })).toBeInTheDocument();
  });
});
