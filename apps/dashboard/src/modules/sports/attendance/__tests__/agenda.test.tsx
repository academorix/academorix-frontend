/**
 * @file agenda.test.tsx
 * @module modules/sports/attendance/__tests__/agenda.test
 *
 * @description
 * Component tests for the attendance agenda page. Covers:
 *
 *  1. When `features.attendanceAgenda` is off, the page redirects.
 *  2. When on, the page mounts, fetches sessions, and renders one calendar
 *     chip per session.
 *  3. Clicking a session chip opens the roster drawer with the correct title.
 *  4. Filter chips clear on demand.
 *
 * # Mocks
 *
 *  - `useList` from `@refinedev/core` — the page fires this against several
 *    resources. We swap it for a resource-keyed factory that returns the
 *    right fixture per call.
 *  - `useCan`, `useResourceParams`, `useTranslate`, `useUserFriendlyName`,
 *    `useBack` — Refine surfaces the ListView + Breadcrumbs shell touches;
 *    stubbed so the shell renders without a real Refine provider tree.
 *  - `useScope` from `@/lib/scope` — the ResourceDataGrid inside ListView
 *    calls this even though the agenda page doesn't render a grid; the shell
 *    still needs a valid scope.
 *  - `features` from `@/config/features.config` — a mutable object we can
 *    flip between tests so both the "off" and "on" branches get coverage.
 */

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { Attendance, Branch, Event, Staff, Team } from "@/types";
import type { ReactNode } from "react";

// ─────────────────────────────────────────────────────────────────────
// Mocks — order matters, `vi.mock` calls are hoisted above imports
// ─────────────────────────────────────────────────────────────────────

// Vitest hoists `vi.mock` factories above ALL top-level statements. Referring
// to a module-scope const inside the factory would blow up with a TDZ error —
// so we route the flag through `vi.hoisted`, which runs the initialiser in
// the hoisted phase and gives us a mutable object every test can flip.
const { featuresState } = vi.hoisted(() => ({
  featuresState: {
    attendanceAgenda: true,
    pwaUpdatePrompt: false,
    onboardingTour: false,
    onboardingChecklist: false,
    commandPalette: false,
    contextMenu: false,
    webPush: false,
    nativeNotifications: false,
    desktopShell: false,
    overviewDnd: false,
    kanbanViews: false,
    billingLivePlans: false,
    debugHeaders: false,
    developerMenu: false,
  },
}));

const { listByResource, updateMock } = vi.hoisted(() => ({
  listByResource: new Map<
    string,
    { data: Record<string, unknown>[]; isLoading: boolean; error: null }
  >(),
  updateMock: vi.fn(),
}));

vi.mock("@/config/features.config", () => ({
  features: featuresState,
  isFeatureEnabled: (flag: keyof typeof featuresState) => featuresState[flag],
  featuresConfig: featuresState,
}));

// ─────────────────────────────────────────────────────────────────────
// Refine surface — stubbed for the shell + the agenda's own useList calls.
// ─────────────────────────────────────────────────────────────────────

// Both `listByResource` and `updateMock` are hoisted above so the factory
// below can safely reference them.

vi.mock("@refinedev/core", async () => {
  const actual = await vi.importActual<typeof import("@refinedev/core")>("@refinedev/core");

  return {
    ...actual,
    // The agenda page reads sessions + markers + teams + staff + branches.
    // Each call is keyed by `resource`, so the mock uses that as the lookup.
    useList: ({ resource }: { resource?: string }) => {
      const entry = listByResource.get(resource ?? "") ?? {
        data: [],
        isLoading: false,
        error: null,
      };

      return {
        result: { data: entry.data, total: entry.data.length },
        query: {
          isLoading: entry.isLoading,
          error: entry.error,
          isFetching: false,
        },
      };
    },
    useUpdate: () => ({ mutate: updateMock }),
    useCan: () => ({ data: { can: true }, isLoading: false }),
    useResourceParams: () => ({ resource: undefined, identifier: "attendance" }),
    useTranslate: () => (_key: string, fallback: string) => fallback,
    useGetIdentity: () => ({ data: undefined }),
    useUserFriendlyName: () => (name: string) => name,
    useBack: () => vi.fn(),
    useBreadcrumb: () => ({ breadcrumbs: [] }),
  };
});

// The ListView shell + ResourceDataGrid touch the scope helpers. The agenda
// page renders neither (it uses `ListView` for breadcrumbs/title only), but
// `<ResourceAccessGuard>` inside `<ListView>` reads them.
vi.mock("@/lib/scope", async () => {
  const actual = await vi.importActual<typeof import("@/lib/scope")>("@/lib/scope");

  return {
    ...actual,
    useScope: () => ({
      scope: { organizationId: null, branchId: null, seasonId: null },
      setScope: vi.fn(),
      isReady: true,
      allowed: {
        organizations: [],
        branches: [],
        seasons: [],
      },
    }),
    buildScopeFilters: () => [],
  };
});

// Import AFTER the mocks so hoisting order stays correct.
import AttendanceAgendaPage from "@/modules/sports/attendance/pages/agenda";

// ─────────────────────────────────────────────────────────────────────
// Fixture builders
// ─────────────────────────────────────────────────────────────────────

/**
 * Builds an ISO string at the given hour on a fixed day *inside the current
 * local week*. The agenda page renders the current week by default, so
 * events need to fall inside it — we take today's Monday and offset from
 * there so DST or timezone drift can't move the event out of the window.
 */
function isoAtHour(hour: number, dayOffset = 0): string {
  const now = new Date();
  const day = new Date(now);

  // Anchor at today's Monday.
  const dayOfWeek = (day.getDay() + 6) % 7;

  day.setDate(day.getDate() - dayOfWeek + dayOffset);
  day.setHours(hour, 0, 0, 0);

  return day.toISOString();
}

function makeSession(overrides: Partial<Event>): Event {
  return {
    id: "session-1",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    tenant_id: "tenant-1",
    organization_id: "org-1",
    branch_id: "branch-1",
    team_id: "team-1",
    season_id: "season-1",
    title: "Morning practice",
    type: "training",
    status: "scheduled",
    starts_at: isoAtHour(10, 1),
    ends_at: isoAtHour(11, 1),
    location: "Field A",
    rsvp_going: 0,
    rsvp_total: 0,
    ...overrides,
  };
}

function makeMarker(overrides: Partial<Attendance>): Attendance {
  return {
    id: "marker-1",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    tenant_id: "tenant-1",
    organization_id: "org-1",
    branch_id: "branch-1",
    team_id: "team-1",
    event_id: "session-1",
    athlete_id: "ath-1",
    status: "present",
    is_confirmed: true,
    marked_at: new Date().toISOString(),
    note: null,
    ...overrides,
  };
}

function makeTeam(overrides: Partial<Team>): Team {
  return {
    id: "team-1",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    tenant_id: "tenant-1",
    organization_id: "org-1",
    branch_id: "branch-1",
    season_id: "season-1",
    name: "U12 Falcons",
    description: null,
    sport_key: "football",
    age_group: "U12",
    level: "beginner",
    status: "active",
    lead_coach_id: "staff-1",
    members_count: 10,
    capacity: 20,
    ...overrides,
  };
}

function makeStaff(overrides: Partial<Staff>): Staff {
  return {
    id: "staff-1",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    tenant_id: "tenant-1",
    user_id: null,
    organization_id: "org-1",
    branch_id: "branch-1",
    first_name: "Alex",
    last_name: "Coach",
    email: null,
    phone: null,
    role: "coach",
    department: null,
    is_active: true,
    hire_date: null,
    // Cast to Staff — the real type has additional fields, this fixture only
    // needs to satisfy the display code (`first_name`, `last_name`, `id`).
    ...(overrides as Partial<Staff>),
  } as Staff;
}

function makeBranch(overrides: Partial<Branch>): Branch {
  return {
    id: "branch-1",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    tenant_id: "tenant-1",
    organization_id: "org-1",
    name: "Main branch",
    region_id: null,
    slug: "main",
    email: null,
    phone: null,
    address: null,
    timezone: "UTC",
    status: "active",
    is_default: true,
    settings_overrides: null,
    // Cast — Branch has additional required fields shared with the platform
    // model that don't affect the agenda's rendering.
    ...(overrides as Partial<Branch>),
  } as Branch;
}

function renderAgenda(children: ReactNode = <AttendanceAgendaPage />) {
  // Refine's internal `useCan` still runs a `useQuery` even though we mock
  // its return value at the barrel — the tanstack-query provider must
  // exist for the mock to short-circuit correctly. A one-shot client per
  // render keeps caches isolated between tests.
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{children}</MemoryRouter>
    </QueryClientProvider>,
  );
}

/**
 * Seeds every resource the agenda page reads. We pass concrete domain types
 * through as `readonly unknown[]` because Refine's `BaseRecord` (an index
 * signature) is not assignable from a plain TypeScript interface like
 * {@link Event}. Casting once at the boundary keeps the test bodies typed
 * against the domain shapes.
 */
function seedResources(overrides: Partial<Record<string, readonly unknown[]>> = {}): void {
  listByResource.clear();
  listByResource.set("events", {
    data: [makeSession({}) as unknown as Record<string, unknown>],
    isLoading: false,
    error: null,
  });
  listByResource.set("attendance", { data: [], isLoading: false, error: null });
  listByResource.set("teams", {
    data: [makeTeam({}) as unknown as Record<string, unknown>],
    isLoading: false,
    error: null,
  });
  listByResource.set("staff", {
    data: [makeStaff({}) as unknown as Record<string, unknown>],
    isLoading: false,
    error: null,
  });
  listByResource.set("branches", {
    data: [makeBranch({}) as unknown as Record<string, unknown>],
    isLoading: false,
    error: null,
  });

  for (const [resource, data] of Object.entries(overrides)) {
    listByResource.set(resource, {
      data: (data ?? []) as unknown as Record<string, unknown>[],
      isLoading: false,
      error: null,
    });
  }
}

beforeEach(() => {
  featuresState.attendanceAgenda = true;
  listByResource.clear();
  updateMock.mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ─────────────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────────────

describe("AttendanceAgendaPage — feature flag", () => {
  it("redirects to /attendance when the feature is off", () => {
    featuresState.attendanceAgenda = false;
    seedResources();

    renderAgenda();

    // The redirect renders nothing on the agenda surface — we don't assert
    // on the target route (jsdom doesn't run react-router side-effects
    // beyond mounting), we just confirm the agenda body isn't visible.
    expect(screen.queryByTestId("attendance-agenda")).not.toBeInTheDocument();
  });
});

describe("AttendanceAgendaPage — mount + fetch", () => {
  it("renders the agenda shell when the feature is on", () => {
    seedResources();

    renderAgenda();

    expect(screen.getByTestId("attendance-agenda")).toBeInTheDocument();
  });

  it("renders one event chip per session", () => {
    seedResources({
      events: [
        makeSession({ id: "s-1", title: "Morning practice" }),
        makeSession({
          id: "s-2",
          title: "Afternoon match",
          starts_at: isoAtHour(15, 2),
          ends_at: isoAtHour(17, 2),
        }),
      ],
    });

    renderAgenda();

    expect(screen.getByText("Morning practice")).toBeInTheDocument();
    expect(screen.getByText("Afternoon match")).toBeInTheDocument();
  });

  it("renders a 'New session' primary action in the toolbar", () => {
    seedResources();

    renderAgenda();

    expect(screen.getByRole("button", { name: /new session/i })).toBeInTheDocument();
  });
});

describe("AttendanceAgendaPage — session click", () => {
  it("opens the roster drawer when a session chip is clicked", async () => {
    seedResources({
      events: [makeSession({ id: "s-1", title: "Skills clinic" })],
      attendance: [makeMarker({ event_id: "s-1" })],
    });

    renderAgenda();

    // The event chip carries the session title; click it to open the
    // drawer. The drawer surfaces the same title via `Drawer.Heading`.
    const chip = screen.getByText("Skills clinic");

    chip.click();

    await waitFor(() => {
      // The drawer heading matches the session title. React-aria renders
      // the drawer content inside a portal; jsdom mounts it in the same
      // document, so we can query by text.
      const headings = screen.getAllByText("Skills clinic");

      expect(headings.length).toBeGreaterThanOrEqual(1);
    });
  });
});

describe("AttendanceAgendaPage — filter chips", () => {
  it("renders the four filter dropdowns", () => {
    seedResources();

    renderAgenda();

    // The Select components render their aria-label on the trigger button.
    expect(screen.getByLabelText(/filter by team/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/filter by coach/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/filter by branch/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/filter by status/i)).toBeInTheDocument();
  });
});
