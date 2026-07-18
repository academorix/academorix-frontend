/**
 * @file auth-shell.tsx
 * @module modules/auth/components/auth-shell
 *
 * @description
 * Two-column layout wrapper for every unauthenticated surface —
 * sign-in, sign-up, forgot-password, reset-password, find-workspaces,
 * verify-email, join-invite.
 *
 * ## Design philosophy
 *
 * Uses **standard HeroUI Pro components** with **default theme tokens
 * only** — no custom CSS overrides, no `data-theme` forcing, no
 * bespoke gradients. Every colour is a semantic token
 * (`bg-background`, `bg-accent`, `text-accent-foreground`,
 * `border-border`) so the auth surface adopts whichever theme mode
 * the caller is on (light / dark / system) and matches the
 * dashboard's visual language exactly.
 *
 * ## Structure
 *
 * ```
 * ┌────────────────────────────────┬────────────────────────────────┐
 * │  brand mark   toolbar          │                                │
 * │                                │                                │
 * │                                │   Right column                 │
 * │       Title                    │   (bg-accent)                  │
 * │       Description              │                                │
 * │                                │   • hero copy                  │
 * │  ┌──────────────────────┐      │   • value-prop bullets         │
 * │  │  Card (form)         │      │   • quote / brand mark         │
 * │  └──────────────────────┘      │                                │
 * │                                │                                │
 * │       Footer link              │                                │
 * │                                │                                │
 * │  © year · Terms · Privacy      │                                │
 * └────────────────────────────────┴────────────────────────────────┘
 * ```
 *
 * The right column collapses below `lg` so mobile visitors get the
 * form directly without a scroll.
 *
 * ## Tenant branding
 *
 * When a workspace preview is passed via `workspace`, the shell:
 *   - Renders the tenant logo (falls back to the Academorix mark).
 *   - Applies the tenant's brand colours as CSS custom properties
 *     via `applyWorkspaceCssVars` so downstream `bg-accent` picks
 *     up the tenant tone.
 *   - Shows the workspace name in the right-column header.
 */

import { Card } from "@heroui/react";
import { useEffect } from "react";
import { Link } from "@stackra/routing/react";

import type { ReactNode } from "react";
import type { WorkspacePreview } from "@/lib/api/auth-api";

import { BrandIsotipo, BrandLogotipo } from "@/brand";
import { applyWorkspaceCssVars } from "@/lib/auth/workspace-branding";
import { Iconify } from "@/icons/iconify";

import { AuthToolbar } from "./auth-toolbar";

/** Props for {@link AuthShell}. */
export interface AuthShellProps {
  /** Page title above the form. */
  title: string;
  /** Optional subtitle under the title. */
  description?: ReactNode;
  /** Optional badge above the title (flow-position cue). */
  badge?: ReactNode;
  /** Optional footer content below the card (e.g. "Sign up" link). */
  footer?: ReactNode;
  /** The page's form content — rendered inside the Card body. */
  children: ReactNode;
  /**
   * Optional workspace preview envelope. When present, the tenant's
   * brand colours are applied + the tenant logo replaces the
   * Academorix mark in the shell header.
   */
  workspace?: WorkspacePreview | null;
  /**
   * Optional override for the right-column content. Pages that want
   * a step-specific hero (recovery flow, invite acceptance) pass
   * their own; every other page uses the default marketing block.
   */
  rightPanel?: ReactNode;
}

/**
 * Default value-prop bullets on the marketing panel. Kept as
 * module-level data so the whole component tree stays reference-
 * stable across re-renders.
 */
const MARKETING_BULLETS: ReadonlyArray<{ icon: string; text: string }> = [
  { icon: "chart-column", text: "Every stat, every athlete, every branch — in one dashboard." },
  {
    icon: "shield-check",
    text: "Enterprise access controls with a full safeguarding audit trail.",
  },
  {
    icon: "sparkles",
    text: "AI copilot for schedules, comms, and reports — always in your voice.",
  },
];

export function AuthShell({
  title,
  description,
  badge,
  footer,
  children,
  workspace,
  rightPanel,
}: AuthShellProps): ReactNode {
  // Apply tenant brand colours as CSS custom properties. Cleanup
  // removes them on unmount so navigation back to the central host
  // reverts to the Academorix palette.
  useEffect(() => applyWorkspaceCssVars(workspace ?? null), [workspace]);

  return (
    <div className="flex min-h-svh w-full flex-col bg-background text-foreground lg:flex-row">
      {/* ------------------------------------------------------- */}
      {/* Left column — brand + form + legal footer               */}
      {/* ------------------------------------------------------- */}
      <section className="flex flex-1 flex-col lg:w-[55%] xl:w-[52%]">
        <header className="flex items-center justify-between p-6 sm:p-8">
          <Link aria-label="Academorix home" className="flex items-center gap-2.5" to="/sign-in">
            {workspace ? (
              <>
                <BrandMark workspace={workspace} />
                <span className="text-sm font-semibold tracking-tight text-foreground">
                  {workspace.name}
                </span>
              </>
            ) : (
              // No tenant scope — render the horizontal lockup on its
              // own. It already contains the wordmark, so appending
              // "Academorix" text next to it would double-print the
              // brand name.
              <BrandLogotipo className="h-7 w-auto sm:h-8" />
            )}
          </Link>
          <AuthToolbar />
        </header>

        <main className="flex flex-1 items-center justify-center px-6 pb-6 sm:px-8">
          <div className="flex w-full max-w-md flex-col gap-6">
            <div className="flex flex-col gap-2">
              {badge ? <div>{badge}</div> : null}
              <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                {title}
              </h1>
              {description ? (
                <p className="text-sm leading-relaxed text-muted">{description}</p>
              ) : null}
            </div>

            <Card>
              <Card.Content className="p-6">{children}</Card.Content>
            </Card>

            {footer ? <div className="text-center text-sm text-muted">{footer}</div> : null}
          </div>
        </main>

        <footer className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 text-xs text-muted sm:px-8">
          <span>© {new Date().getFullYear()} Academorix. All rights reserved.</span>
          <div className="flex items-center gap-4">
            <a className="hover:text-foreground" href="/terms">
              Terms
            </a>
            <a className="hover:text-foreground" href="/privacy">
              Privacy
            </a>
            <a className="hover:text-foreground" href="mailto:support@academorix.com">
              Support
            </a>
          </div>
        </footer>
      </section>

      {/* ------------------------------------------------------- */}
      {/* Right column — brand / marketing panel                  */}
      {/*                                                         */}
      {/* Uses the app's `--accent` semantic token so it picks up  */}
      {/* the current theme (light / dark) + tenant brand colour  */}
      {/* overrides automatically. No custom CSS.                  */}
      {/* ------------------------------------------------------- */}
      <aside
        aria-hidden
        className="relative hidden overflow-hidden bg-accent text-accent-foreground lg:flex lg:w-[45%] lg:flex-col lg:justify-between xl:w-[48%]"
      >
        {rightPanel ?? <DefaultRightPanel workspace={workspace ?? null} />}
      </aside>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Right-column building blocks
// ---------------------------------------------------------------------------

/** Default marketing panel — product headline + value bullets. */
function DefaultRightPanel({ workspace }: { workspace: WorkspacePreview | null }): ReactNode {
  return (
    <div className="relative z-10 flex h-full flex-col justify-between p-10 xl:p-14">
      <header className="flex items-center gap-3">
        <span className="flex size-11 items-center justify-center rounded-2xl bg-background/95 p-2 shadow-sm ring-1 ring-background/40">
          {workspace?.logo_url ? (
            <img
              alt={`${workspace.name} logo`}
              className="size-full object-contain"
              src={workspace.logo_url}
            />
          ) : (
            <BrandIsotipo aria-hidden="true" className="size-full object-contain" />
          )}
        </span>
        <div className="flex flex-col">
          <span className="text-xs font-medium tracking-[0.18em] uppercase opacity-80">
            {workspace ? workspace.name : "Academorix"}
          </span>
          <span className="text-sm opacity-75">
            {workspace
              ? "Welcome back — your workspace is ready."
              : "Sports operations, without the paperwork."}
          </span>
        </div>
      </header>

      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-3">
          <h2 className="text-3xl leading-tight font-semibold tracking-tight sm:text-4xl">
            {workspace ? `Sign in to ${workspace.name}` : "Everything sports academies run on."}
          </h2>
          <p className="max-w-md text-base leading-relaxed opacity-85">
            {workspace
              ? "Dashboards, athletes, and today's sessions are one click away."
              : "Registrations, attendance, payments, credentials — the whole membership journey wired into a single workspace."}
          </p>
        </div>

        {workspace ? null : (
          <ul className="flex flex-col gap-3 text-sm">
            {MARKETING_BULLETS.map(({ icon, text }) => (
              <li key={icon} className="flex items-start gap-3">
                <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md bg-background/15 ring-1 ring-background/20">
                  <Iconify className="size-3.5" icon={icon} />
                </span>
                <span className="opacity-90">{text}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <footer className="text-xs opacity-75">
        Trusted by hundreds of academies across the region.
      </footer>
    </div>
  );
}

/**
 * The brand-mark tile in the shell header. Rendered only when a
 * tenant workspace is scoped — the central-host path uses the
 * inline lockup instead. When the tenant has no uploaded logo, the
 * Academorix mark stands in so the header layout stays consistent.
 */
function BrandMark({ workspace }: { workspace: WorkspacePreview }): ReactNode {
  if (workspace.logo_url) {
    return (
      <span className="flex size-9 items-center justify-center overflow-hidden rounded-xl bg-surface p-1 shadow-sm ring-1 ring-border">
        <img
          alt={`${workspace.name} logo`}
          className="size-full object-contain"
          src={workspace.logo_url}
        />
      </span>
    );
  }

  return (
    <span className="flex size-9 items-center justify-center overflow-hidden rounded-xl bg-surface p-1.5 shadow-sm ring-1 ring-border">
      <BrandIsotipo aria-hidden="true" className="size-full object-contain" />
    </span>
  );
}
