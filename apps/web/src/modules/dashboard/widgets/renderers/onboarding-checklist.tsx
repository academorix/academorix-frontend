/**
 * @file onboarding-checklist.tsx
 * @module modules/dashboard/widgets/renderers/onboarding-checklist
 *
 * @description
 * Overview widget: the guided setup checklist a fresh workspace uses to reach
 * a working state. Every step is one of two kinds:
 *
 * - `auto`: completion is detected by a `useList` row-count against a target
 *   resource. Adding the first branch, first team, first athlete, etc.
 * - `manual`: completion is toggled by the operator. Reserved for steps that
 *   depend on Settings module keys that will not exist until Phase 4.
 *
 * The widget stores its ephemeral state (which steps have been manually marked
 * done, which have been individually dismissed, whether the whole widget is
 * hidden) in `localStorage`, keyed per tenant slug. The plan (§20.30) upgrades
 * this to a real `dashboard_onboarding_state` resource in a follow-up wave.
 */

import {
  AcademicCapIcon,
  BellIcon,
  BuildingOfficeIcon,
  BuildingStorefrontIcon,
  CalendarIcon,
  ChartBarIcon,
  CheckCircleIcon,
  CreditCardIcon,
  EyeSlashIcon,
  GlobeAltIcon,
  ShieldCheckIcon,
  TrophyIcon,
  UserGroupIcon,
  UsersIcon,
  XMarkIcon,
} from "@academorix/ui/icons/outline";
import { CheckCircleIcon as CheckCircleSolid } from "@academorix/ui/icons/solid";
import { Button, Chip, Link, ProgressBar, Skeleton, Widget } from "@academorix/ui/react";
import { useGetIdentity, useList } from "@refinedev/core";
import { useCallback, useEffect, useMemo, useState } from "react";

import type { Identity } from "@/types";
import type { IconType } from "@academorix/ui/icons";
import type { ReactNode } from "react";

/** Descriptor for a single step in the checklist. */
interface OnboardingStep {
  /** Stable identifier used in `localStorage` state. */
  key: string;
  /** Section heading on the step row. */
  title: string;
  /** Short body copy explaining what the step accomplishes. */
  description: string;
  /** Route the primary CTA sends the user to. */
  ctaRoute: string;
  /** Label for the primary CTA button. */
  ctaLabel: string;
  /** Icon rendered on the step row. */
  Icon: IconType;
  /**
   * How completion is detected. `auto` steps read a row count from the
   * declared resource; `manual` steps require the operator to press "Mark
   * done" once the underlying action is complete (Settings-scoped steps).
   */
  detection: { kind: "auto"; resource: string } | { kind: "manual" };
}

/** The 12 default steps every workspace ships with. See plan §4.6. */
const STEPS: readonly OnboardingStep[] = [
  {
    key: "workspace",
    title: "Set up your workspace",
    description: "Confirm your workspace name, timezone, and default landing route.",
    ctaRoute: "/organizations",
    ctaLabel: "Open workspace",
    Icon: BuildingOfficeIcon,
    detection: { kind: "manual" },
  },
  {
    key: "branch",
    title: "Add your first branch",
    description:
      "Register the physical or logical venue where your athletes will train and compete.",
    ctaRoute: "/branches/create",
    ctaLabel: "Add branch",
    Icon: BuildingStorefrontIcon,
    detection: { kind: "auto", resource: "branches" },
  },
  {
    key: "domain",
    title: "Configure your domain",
    description: "Point a custom domain at your workspace so members find you at your own URL.",
    ctaRoute: "/organizations",
    ctaLabel: "Configure domain",
    Icon: GlobeAltIcon,
    detection: { kind: "manual" },
  },
  {
    key: "staff",
    title: "Invite your first coach",
    description: "Bring your coaching staff onboard so you can assign them to teams and sessions.",
    ctaRoute: "/staff/create",
    ctaLabel: "Invite coach",
    Icon: UsersIcon,
    detection: { kind: "auto", resource: "staff" },
  },
  {
    key: "billing",
    title: "Enable payments",
    description:
      "Connect a payment provider so families can pay online and you can issue receipts.",
    ctaRoute: "/settings/billing",
    ctaLabel: "Enable payments",
    Icon: CreditCardIcon,
    detection: { kind: "manual" },
  },
  {
    key: "sports",
    title: "Add your sports catalogue",
    description: "Enable the sports you run so registrations and analytics show the right options.",
    ctaRoute: "/sports",
    ctaLabel: "Open catalogue",
    Icon: TrophyIcon,
    detection: { kind: "manual" },
  },
  {
    key: "team",
    title: "Create your first team",
    description: "Group athletes into a squad so you can assign coaches and schedule sessions.",
    ctaRoute: "/teams/create",
    ctaLabel: "Create team",
    Icon: UserGroupIcon,
    detection: { kind: "auto", resource: "teams" },
  },
  {
    key: "athlete",
    title: "Register your first athlete",
    description: "Add an athlete so you can track their attendance, performance, and payments.",
    ctaRoute: "/athletes/create",
    ctaLabel: "Register athlete",
    Icon: AcademicCapIcon,
    detection: { kind: "auto", resource: "athletes" },
  },
  {
    key: "session",
    title: "Schedule your first session",
    description:
      "Publish a training or private session so athletes can book and attendance can start.",
    ctaRoute: "/training-sessions/create",
    ctaLabel: "Schedule session",
    Icon: CalendarIcon,
    detection: { kind: "auto", resource: "training-sessions" },
  },
  {
    key: "notifications",
    title: "Set up notifications",
    description: "Choose how you reach members and mute what is not helpful.",
    ctaRoute: "/notification-templates",
    ctaLabel: "Open notifications",
    Icon: BellIcon,
    detection: { kind: "manual" },
  },
  {
    key: "safeguarding",
    title: "Configure safeguarding",
    description:
      "Publish your safeguarding policy and name escalation contacts so cases are handled fast.",
    ctaRoute: "/safeguarding",
    ctaLabel: "Configure safeguarding",
    Icon: ShieldCheckIcon,
    detection: { kind: "manual" },
  },
  {
    key: "reports",
    title: "Explore reports",
    description:
      "Have a look at the reports library so you know where to find operational answers.",
    ctaRoute: "/reports",
    ctaLabel: "Open reports",
    Icon: ChartBarIcon,
    detection: { kind: "manual" },
  },
] as const;

/** Persisted onboarding state, one row per tenant slug in `localStorage`. */
interface StoredState {
  hidden: boolean;
  manuallyCompleted: readonly string[];
  dismissed: readonly string[];
}

/** Default state used when nothing is persisted yet. */
const DEFAULT_STATE: StoredState = {
  hidden: false,
  manuallyCompleted: [],
  dismissed: [],
};

/** Namespaces the localStorage key by tenant so tenants do not share state. */
function storageKey(tenantSlug: string | null): string {
  return `academorix:onboarding:${tenantSlug ?? "unknown"}`;
}

/**
 * Reads the stored state from `localStorage`. Falls back to the default on
 * any parse error so a corrupt payload cannot break the widget.
 */
function readStoredState(tenantSlug: string | null): StoredState {
  if (typeof window === "undefined") {
    return DEFAULT_STATE;
  }

  try {
    const raw = window.localStorage.getItem(storageKey(tenantSlug));

    if (!raw) {
      return DEFAULT_STATE;
    }

    const parsed = JSON.parse(raw) as Partial<StoredState>;

    return {
      hidden: Boolean(parsed.hidden),
      manuallyCompleted: Array.isArray(parsed.manuallyCompleted) ? parsed.manuallyCompleted : [],
      dismissed: Array.isArray(parsed.dismissed) ? parsed.dismissed : [],
    };
  } catch {
    return DEFAULT_STATE;
  }
}

/** Persists state to `localStorage`. Silent on quota or serialisation errors. */
function writeStoredState(tenantSlug: string | null, state: StoredState): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(storageKey(tenantSlug), JSON.stringify(state));
  } catch {
    // Storage errors (quota, private mode) are not worth surfacing here; the
    // widget still functions in-memory for the rest of the session.
  }
}

/**
 * One-shot row-count probe used to detect completion of `auto` steps. Fires a
 * `pageSize: 1` list against the target resource and reads `result.total`.
 */
function useResourceCount(resource: string): { total: number; isLoading: boolean } {
  const { result, query } = useList({
    resource,
    pagination: { currentPage: 1, pageSize: 1 },
  });

  return { total: result.total ?? 0, isLoading: query.isLoading };
}

/**
 * Renders a single step row. Extracted so the parent map can call it inside a
 * flex column without JSX getting too deep to read.
 */
interface StepRowProps {
  step: OnboardingStep;
  isCompleted: boolean;
  isLoading: boolean;
  canManuallyToggle: boolean;
  onToggleManual: (key: string) => void;
  onDismiss: (key: string) => void;
}

function StepRow({
  step,
  isCompleted,
  isLoading,
  canManuallyToggle,
  onToggleManual,
  onDismiss,
}: StepRowProps): ReactNode {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-border p-3">
      <span
        aria-hidden="true"
        className={
          isCompleted
            ? "flex size-8 shrink-0 items-center justify-center rounded-full bg-success/10 text-success"
            : "flex size-8 shrink-0 items-center justify-center rounded-full bg-default text-muted"
        }
      >
        {isCompleted ? <CheckCircleSolid className="size-5" /> : <step.Icon className="size-4" />}
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 flex-col">
            <span
              className={
                isCompleted
                  ? "truncate text-sm font-medium text-muted line-through"
                  : "truncate text-sm font-medium text-foreground"
              }
            >
              {step.title}
            </span>
            <span className="text-xs text-muted">{step.description}</span>
          </div>
          {isLoading ? (
            <Skeleton className="h-5 w-20" />
          ) : isCompleted ? (
            <Chip color="success" size="sm" variant="soft">
              <CheckCircleIcon aria-hidden="true" className="size-3.5" />
              <Chip.Label>Complete</Chip.Label>
            </Chip>
          ) : null}
        </div>
        {!isCompleted ? (
          <div className="flex flex-wrap items-center gap-2">
            <Link
              className="inline-flex items-center gap-1 text-sm font-medium text-accent"
              href={step.ctaRoute}
            >
              {step.ctaLabel}
            </Link>
            {canManuallyToggle ? (
              <Button size="sm" variant="ghost" onPress={() => onToggleManual(step.key)}>
                Mark done
              </Button>
            ) : null}
            <Button size="sm" variant="ghost" onPress={() => onDismiss(step.key)}>
              <XMarkIcon />
              Dismiss
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

/** Overview widget: onboarding checklist. */
export default function OnboardingChecklistWidget(): ReactNode {
  const { data: identity } = useGetIdentity<Identity>();
  const tenantSlug = identity?.tenant?.slug ?? null;

  const [state, setState] = useState<StoredState>(DEFAULT_STATE);

  // Rehydrate from localStorage on mount and whenever the tenant slug changes
  // (e.g. cross-tenant workspace switch mid-session).
  useEffect(() => {
    setState(readStoredState(tenantSlug));
  }, [tenantSlug]);

  const persist = useCallback(
    (next: StoredState) => {
      setState(next);
      writeStoredState(tenantSlug, next);
    },
    [tenantSlug],
  );

  // Fire the row-count probe for every auto step. React hooks must run in a
  // stable order, so we call `useResourceCount` for each step regardless of
  // detection kind. Manual steps use a placeholder resource whose result is
  // ignored below.
  const branchCount = useResourceCount("branches");
  const staffCount = useResourceCount("staff");
  const teamCount = useResourceCount("teams");
  const athleteCount = useResourceCount("athletes");
  const sessionCount = useResourceCount("training-sessions");

  const autoResults = useMemo<Record<string, { total: number; isLoading: boolean }>>(
    () => ({
      branches: branchCount,
      staff: staffCount,
      teams: teamCount,
      athletes: athleteCount,
      "training-sessions": sessionCount,
    }),
    [branchCount, staffCount, teamCount, athleteCount, sessionCount],
  );

  const stepStatuses = useMemo(
    () =>
      STEPS.map((step) => {
        const dismissed = state.dismissed.includes(step.key);
        const manuallyCompleted = state.manuallyCompleted.includes(step.key);
        let autoCompleted = false;
        let isLoading = false;

        if (step.detection.kind === "auto") {
          const probe = autoResults[step.detection.resource];

          autoCompleted = Boolean(probe && probe.total > 0);
          isLoading = Boolean(probe && probe.isLoading);
        }

        return {
          step,
          dismissed,
          isLoading,
          isCompleted: autoCompleted || manuallyCompleted,
          canManuallyToggle: step.detection.kind === "manual",
        };
      }),
    [autoResults, state.dismissed, state.manuallyCompleted],
  );

  const visible = stepStatuses.filter((status) => !status.dismissed);
  const totalCount = visible.length;
  const completedCount = visible.filter((status) => status.isCompleted).length;
  const progress = totalCount === 0 ? 100 : Math.round((completedCount / totalCount) * 100);

  const toggleManual = useCallback(
    (key: string) => {
      const set = new Set(state.manuallyCompleted);

      if (set.has(key)) {
        set.delete(key);
      } else {
        set.add(key);
      }
      persist({ ...state, manuallyCompleted: Array.from(set) });
    },
    [persist, state],
  );

  const dismissStep = useCallback(
    (key: string) => {
      const set = new Set(state.dismissed);

      set.add(key);
      persist({ ...state, dismissed: Array.from(set) });
    },
    [persist, state],
  );

  const hideWidget = useCallback(() => {
    persist({ ...state, hidden: true });
  }, [persist, state]);

  if (state.hidden) {
    return null;
  }

  return (
    <Widget className="h-full">
      <Widget.Header>
        <div className="flex min-w-0 flex-col gap-1">
          <Widget.Title>Get started</Widget.Title>
          <Widget.Description>Complete these steps to launch your academy.</Widget.Description>
        </div>
        <div className="flex items-center gap-3">
          <Chip size="sm" variant="soft">
            <Chip.Label className="tabular-nums">
              {completedCount} / {totalCount}
            </Chip.Label>
          </Chip>
          <Button
            isIconOnly
            aria-label="Hide setup checklist"
            size="sm"
            variant="ghost"
            onPress={hideWidget}
          >
            <EyeSlashIcon />
          </Button>
        </div>
      </Widget.Header>
      <Widget.Content className="flex flex-col gap-4">
        <ProgressBar
          aria-label="Setup progress"
          className="w-full"
          color={progress >= 100 ? "success" : "accent"}
          size="sm"
          value={progress}
        >
          <ProgressBar.Track>
            <ProgressBar.Fill />
          </ProgressBar.Track>
        </ProgressBar>

        <div className="flex flex-col gap-2">
          {visible.map(({ step, isCompleted, isLoading, canManuallyToggle }) => (
            <StepRow
              key={step.key}
              canManuallyToggle={canManuallyToggle}
              isCompleted={isCompleted}
              isLoading={isLoading}
              step={step}
              onDismiss={dismissStep}
              onToggleManual={toggleManual}
            />
          ))}
        </div>
      </Widget.Content>
    </Widget>
  );
}
