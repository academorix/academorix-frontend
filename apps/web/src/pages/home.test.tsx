import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";

import { HomePage } from "@/pages/home";

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

    expect(
      screen.getByRole("button", { name: /get started/i }),
    ).toBeInTheDocument();
  });
});
