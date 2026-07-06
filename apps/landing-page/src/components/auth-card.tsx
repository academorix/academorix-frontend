/**
 * @file auth-card.tsx
 * @module components/auth-card
 *
 * @description
 * Reusable page chrome for onboarding routes. Consumes `site` as a prop so
 * every branded string comes from `public/data/site.json`.
 */

import { AcademicCapIcon } from "@academorix/ui/icons/outline";
import { Card } from "@academorix/ui/react";

import type { SiteData } from "@/lib/types";
import type { ReactNode } from "react";

import { Link } from "@/i18n/navigation";

/** Props for {@link AuthCard}. */
interface AuthCardProps {
  site: SiteData;
  title: string;
  description: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}

/** The shared onboarding-card layout. */
export function AuthCard({ site, title, description, children, footer }: AuthCardProps): ReactNode {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-background px-6 py-16">
      <Card className="w-full max-w-md">
        <Card.Header>
          <Link
            aria-label={`${site.name} home`}
            className="mb-2 flex items-center gap-2 text-accent transition-opacity hover:opacity-80"
            href="/"
          >
            <AcademicCapIcon aria-hidden="true" className="size-7" />
            <span className="text-lg font-semibold text-foreground">{site.name}</span>
          </Link>
          <Card.Title>{title}</Card.Title>
          <Card.Description>{description}</Card.Description>
        </Card.Header>

        {children}

        {footer ? (
          <Card.Footer className="mt-4 flex-col items-stretch gap-3">{footer}</Card.Footer>
        ) : null}
      </Card>
    </main>
  );
}
