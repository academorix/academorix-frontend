/**
 * @file not-found.tsx
 * @module pages/not-found
 *
 * @description
 * Catch-all 404 page for unmatched routes. Offers a single action back to the
 * public landing page.
 */

import { Button } from "@academorix/ui/react";
import { useNavigate } from "react-router";

import type { ReactNode } from "react";

import { routes } from "@/config/routes";

/** Renders the 404 screen. */
export function NotFoundPage(): ReactNode {
  const navigate = useNavigate();

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 py-16 text-center">
      <p className="text-6xl font-bold tracking-tight text-foreground">404</p>
      <p className="text-muted">We couldn&apos;t find the page you were looking for.</p>
      <Button variant="primary" onPress={() => navigate(routes.home)}>
        Back to home
      </Button>
    </main>
  );
}
