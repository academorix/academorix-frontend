/**
 * @file onboarding-checklist.tsx
 * @module components/dashboard/onboarding-checklist
 *
 * @description
 * The "Get started" onboarding widget (Section 4.6). Reads the
 * tenant's onboarding aggregate from
 * `GET /api/auth/me/onboarding` via {@link useOnboarding}, projects
 * each step onto a HeroUI `Disclosure` row inside a `Widget`, and
 * short-circuits when everything is done.
 *
 * ## Data source
 *
 * `authApi.onboarding()` short-circuits in dev / mock mode to the
 * dashboard fixture (`public/api/v1/dashboard.json` →
 * `onboardingSteps`), so component work and Storybook still render
 * without a running Laravel. In production every step's `complete`
 * flag reflects real workspace state (see backend
 * `TenantOnboardingService`).
 */

import { Button, Chip, Disclosure, DisclosureGroup, ProgressBar, Spinner } from "@heroui/react";
import { Widget } from "@heroui-pro/react";
import { useMemo, useState } from "react";
import { useNavigate } from "@stackra/routing/react";

import type { ReactNode } from "react";

import { Iconify } from "@/icons/iconify";
import { useOnboarding } from "@/hooks/use-onboarding";

export function OnboardingChecklist(): ReactNode {
  const navigate = useNavigate();
  const { data, isLoading, error, refresh } = useOnboarding();
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const visible = useMemo(() => {
    if (!data) return [];

    return data.steps.filter((step) => !dismissed.has(step.id));
  }, [data, dismissed]);

  // Loading + first-load skeleton — a compact spinner keeps the
  // widget's card footprint stable so the dashboard grid doesn't
  // jump when the async load resolves.
  if (isLoading && !data) {
    return (
      <Widget className="w-full">
        <Widget.Header>
          <Widget.Title>Get started</Widget.Title>
        </Widget.Header>
        <Widget.Content className="flex items-center justify-center py-10">
          <Spinner color="accent" size="md" />
        </Widget.Content>
      </Widget>
    );
  }

  // Error state — surface a short retry affordance so a transient
  // network flake doesn't hide the checklist forever.
  if (error && !data) {
    return (
      <Widget className="w-full">
        <Widget.Header>
          <Widget.Title>Get started</Widget.Title>
        </Widget.Header>
        <Widget.Content>
          <div className="flex items-start gap-3 rounded-xl border border-danger/40 bg-danger/10 p-4 text-sm">
            <Iconify className="mt-0.5 size-4 shrink-0 text-danger" icon="triangle-exclamation" />
            <div className="flex flex-1 flex-col gap-1">
              <p className="font-medium text-foreground">Couldn't load onboarding progress</p>
              <p className="text-xs text-muted">{error.message}</p>
            </div>
            <Button onPress={refresh} size="sm" variant="secondary">
              Retry
            </Button>
          </div>
        </Widget.Content>
      </Widget>
    );
  }

  if (!data) return null;

  const total = visible.length;
  const completed = visible.filter((step) => step.complete).length;
  const progress = total === 0 ? 100 : Math.round((completed / total) * 100);

  // Fully-done state — don't render the widget at all so the
  // dashboard grid drops back to the "no leftover chrome" happy
  // path. Same behaviour as the legacy fixture-driven widget.
  if (total === 0 || completed === total) return null;

  return (
    <Widget className="w-full">
      <Widget.Header>
        <div className="flex flex-col">
          <Widget.Title>Get started</Widget.Title>
          <Widget.Description>Finish setting up your academy in a few minutes.</Widget.Description>
        </div>
        <div className="flex items-center gap-3">
          <Chip size="sm" variant="soft">
            <Chip.Label>
              {completed} / {total}
            </Chip.Label>
          </Chip>
          <ProgressBar aria-label="Setup progress" className="w-32" value={progress}>
            <ProgressBar.Track>
              <ProgressBar.Fill />
            </ProgressBar.Track>
          </ProgressBar>
        </div>
      </Widget.Header>
      <Widget.Content>
        <DisclosureGroup className="flex flex-col gap-2" defaultExpandedKeys={[]}>
          {visible.map((step) => (
            <Disclosure key={step.id} id={step.id}>
              <Disclosure.Trigger className="w-full rounded-lg border border-border px-3 py-2 text-left">
                <div className="flex items-center gap-3">
                  <span
                    aria-hidden
                    className={
                      step.complete
                        ? "flex size-8 items-center justify-center rounded-full bg-success/15 text-success"
                        : "flex size-8 items-center justify-center rounded-full bg-surface-secondary text-muted"
                    }
                  >
                    <Iconify className="size-4" icon={step.complete ? "check" : step.icon} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{step.title}</p>
                    <p className="truncate text-xs text-muted">{step.description}</p>
                  </div>
                  {step.complete ? (
                    <Chip color="success" size="sm" variant="soft">
                      <Chip.Label>Done</Chip.Label>
                    </Chip>
                  ) : null}
                </div>
              </Disclosure.Trigger>
              <Disclosure.Content className="-mt-1 rounded-b-lg border-x border-b border-border px-3 py-2">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-muted">{step.description}</p>
                  <div className="flex items-center gap-2">
                    {!step.complete ? (
                      <Button
                        onPress={() => {
                          navigate(step.route);
                          // Optimistically refetch so a completion
                          // that happens on the destination route
                          // ticks the row off without waiting for
                          // the 60-second server cache.
                          void refresh();
                        }}
                        size="sm"
                        variant="primary"
                      >
                        {step.cta}
                        <Iconify className="size-4" icon="arrow-right" />
                      </Button>
                    ) : null}
                    <Button
                      onPress={() => setDismissed((prev) => new Set(prev).add(step.id))}
                      size="sm"
                      variant="ghost"
                    >
                      Dismiss
                    </Button>
                  </div>
                </div>
              </Disclosure.Content>
            </Disclosure>
          ))}
        </DisclosureGroup>
      </Widget.Content>
    </Widget>
  );
}
