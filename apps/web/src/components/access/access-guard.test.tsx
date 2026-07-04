/**
 * @file access-guard.test.tsx
 * @module components/access/access-guard.test
 *
 * @description
 * Component tests for {@link AccessDenied}. The panel resolves its copy through
 * Refine's `useTranslate`, so it is rendered inside the app's real i18n provider
 * (bound via Refine's `I18nContext`) to prove the whole translation path wires
 * up: the English catalog surfaces the access-denied title/description, a custom
 * `reason` overrides the default description, and switching the bound locale to
 * Arabic renders the localized title.
 *
 * Scope is intentionally limited to `AccessDenied` — `ResourceAccessGuard`
 * additionally depends on Refine's resource/router context (`useResourceParams`,
 * `useCan`), which needs far more setup than a focused unit test warrants.
 */

import { I18nContext } from "@refinedev/core";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { Locale } from "@/lib/i18n/i18n.types";
import type { ReactNode } from "react";

import { AccessDenied } from "@/components/access/access-guard";
import { createI18nProvider } from "@/lib/i18n/i18n-provider";
import { MESSAGES } from "@/lib/i18n/messages";

/** Renders `ui` wrapped in the app's i18n provider, bound to `locale`. */
function renderWithLocale(ui: ReactNode, locale: Locale = "en"): void {
  render(
    <I18nContext.Provider value={{ i18nProvider: createI18nProvider(locale, () => {}) }}>
      {ui}
    </I18nContext.Provider>,
  );
}

describe("AccessDenied", () => {
  it("shows the access-denied title", () => {
    renderWithLocale(<AccessDenied />);

    expect(screen.getByRole("heading", { name: /access denied/i })).toBeInTheDocument();
  });

  it("shows the default description when no reason is given", () => {
    renderWithLocale(<AccessDenied />);

    expect(screen.getByText(/don't have permission to view this page/i)).toBeInTheDocument();
  });

  it("shows a custom reason in place of the default description", () => {
    renderWithLocale(<AccessDenied reason='You do not have the "invoices.viewAny" permission.' />);

    expect(
      screen.getByText('You do not have the "invoices.viewAny" permission.'),
    ).toBeInTheDocument();
  });

  it("renders the localized title when the bound locale is Arabic", () => {
    renderWithLocale(<AccessDenied />, "ar");

    expect(
      screen.getByRole("heading", { name: MESSAGES.ar["app.accessDenied.title"] }),
    ).toBeInTheDocument();
  });
});
