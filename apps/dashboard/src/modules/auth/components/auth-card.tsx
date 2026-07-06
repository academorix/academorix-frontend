/**
 * @file auth-card.tsx
 * @module modules/auth/components/auth-card
 *
 * @description
 * Reusable page chrome for every auth screen (login, register, forgot-password,
 * reset-password, verify-email, 2FA, confirm-password, change-password).
 * Centralises the layout so every screen presents the brand, title, and
 * description consistently — and so we can tweak the whole set in one place.
 */

import { AcademicCapIcon } from "@academorix/ui/icons/outline";
import { Card } from "@academorix/ui/react";

import type { ReactNode } from "react";

import { siteConfig } from "@/config/site.config";

/** Props for {@link AuthCard}. */
interface AuthCardProps {
  /** Card title (e.g. `"Sign in"`, `"Reset your password"`). */
  title: string;
  /** Subtitle line rendered below the title. */
  description: ReactNode;
  /** Card body (form + supporting UI). */
  children: ReactNode;
  /** Optional card footer (secondary actions, links). */
  footer?: ReactNode;
}

/**
 * The shared auth card. Fills the viewport, centers a max-width column, and
 * carries the brand mark + tenant name at the top.
 */
export function AuthCard({ title, description, children, footer }: AuthCardProps): ReactNode {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-background px-6 py-16">
      <Card className="w-full max-w-md">
        <Card.Header>
          <div className="mb-2 flex items-center gap-2 text-accent">
            <AcademicCapIcon aria-hidden="true" className="size-7" />
            <span className="text-lg font-semibold text-foreground">{siteConfig.name}</span>
          </div>
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
