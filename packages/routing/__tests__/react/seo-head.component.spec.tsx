/**
 * @file seo-head.component.spec.tsx
 * @module @stackra/routing/__tests__/react
 * @description Unit tests for the `<SeoHead />` component.
 *
 *   The component depends on the DI container (to reach
 *   `SEO_SERVICE`) AND on RRv7's match context. We build a memory
 *   router whose route renders `<SeoHead />` and wrap it in a
 *   `<ContainerProvider>` bound to a container with the SEO service
 *   registered.
 */

// @vitest-environment jsdom

import { describe, expect, it } from "vitest";
import { act, render } from "@testing-library/react";
import { ApplicationFactory, Module } from "@stackra/container";
import { ContainerProvider } from "@stackra/container/react";
import { SEO_SERVICE } from "@stackra/contracts";
import { createMemoryRouter, RouterProvider } from "react-router";

import { STACKRA_HANDLE } from "@/core/constants";
import { SeoService } from "@/seo/services/seo.service";
import { SeoHead } from "@/react/components/seo-head/seo-head.component";

/** Bare-bones app module for the test — no routing config wired. */
@Module({
  providers: [SeoService, { provide: SEO_SERVICE, useExisting: SeoService }],
  exports: [SeoService, SEO_SERVICE],
})
class TestAppModule {}

describe("<SeoHead>", () => {
  it("renders <title> from the leaf match seo descriptor", async () => {
    const app = await ApplicationFactory.create(TestAppModule);
    const router = createMemoryRouter(
      [
        {
          path: "/",
          handle: { [STACKRA_HANDLE]: { seo: { title: "Home" } } },
          Component: () => <SeoHead />,
        },
      ],
      { initialEntries: ["/"] },
    );
    const { container } = await act(async () =>
      render(
        <ContainerProvider context={app}>
          <RouterProvider router={router} />
        </ContainerProvider>,
      ),
    );
    // Title is projected into the head; jsdom hoists it there.
    const titleEl = container.ownerDocument.head.querySelector("title");
    expect(titleEl?.textContent).toBe("Home");
  });

  it("merges outer defaults with the inner descriptor", async () => {
    const app = await ApplicationFactory.create(TestAppModule);
    const router = createMemoryRouter(
      [
        {
          path: "/",
          handle: {
            [STACKRA_HANDLE]: {
              seo: { titleTemplate: "%s | Stackra", description: "root" },
            },
          },
          children: [
            {
              index: true,
              handle: {
                [STACKRA_HANDLE]: { seo: { title: "Home" } },
              },
              Component: () => <SeoHead />,
            },
          ],
        },
      ],
      { initialEntries: ["/"] },
    );
    await act(async () =>
      render(
        <ContainerProvider context={app}>
          <RouterProvider router={router} />
        </ContainerProvider>,
      ),
    );
    const titleEl = document.head.querySelector("title");
    // The template applies at merge time.
    expect(titleEl?.textContent).toBe("Home | Stackra");
  });
});
