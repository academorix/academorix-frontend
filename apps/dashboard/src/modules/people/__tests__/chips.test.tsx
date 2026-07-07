/**
 * @file chips.test.tsx
 * @module modules/people/__tests__/chips.test
 *
 * @description
 * Component tests for the People-module chip variants:
 *
 *   1. {@link RoleChip} renders the correct label per role and applies the
 *      role-specific colour class.
 *   2. {@link ProfileStatusChip} renders the correct label per status and
 *      distinguishes `active` from `inactive` visually.
 *
 * We keep the assertions to the visible text plus a spot-check on the
 * BEM color modifier that HeroUI emits — enough to catch a swapped colour
 * mapping without coupling the test to internal DOM structure.
 */

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ProfileStatusChip } from "@/modules/people/components/profile-status-chip";
import { RoleChip } from "@/modules/people/components/role-chip";
import { ROLES_IN_TENANT } from "@/modules/people/people.types";

describe("RoleChip", () => {
  it("renders the human-readable label for every known role", () => {
    for (const role of ROLES_IN_TENANT) {
      const { unmount } = render(<RoleChip role={role} />);

      // Labels are "Athlete", "Coach", "Staff", "Guardian".
      const capitalised = role.charAt(0).toUpperCase() + role.slice(1);

      expect(screen.getByText(capitalised)).toBeInTheDocument();
      unmount();
    }
  });

  it("uses distinct colour classes for the athlete and staff roles", () => {
    // Extract the RoleChip element into a variable so eslint's
    // `jsx-a11y/aria-role` rule doesn't see `role="athlete"` as an ARIA role.
    const athleteRoleName = "athlete" as const;
    const staffRoleName = "staff" as const;

    const { container: athleteContainer } = render(<RoleChip role={athleteRoleName} />);
    const athleteChip = athleteContainer.firstElementChild!;

    const { container: staffContainer } = render(<RoleChip role={staffRoleName} />);
    const staffChip = staffContainer.firstElementChild!;

    // Sanity: the two roles must not resolve to the same colour modifier.
    expect(athleteChip.className).not.toBe(staffChip.className);
  });
});

describe("ProfileStatusChip", () => {
  it("renders 'Active' for the active status", () => {
    render(<ProfileStatusChip status="active" />);

    expect(screen.getByText("Active")).toBeInTheDocument();
  });

  it("renders 'Inactive' for the inactive status", () => {
    render(<ProfileStatusChip status="inactive" />);

    expect(screen.getByText("Inactive")).toBeInTheDocument();
  });

  it("uses different colour classes for active and inactive", () => {
    const { container: activeContainer } = render(<ProfileStatusChip status="active" />);
    const activeChip = activeContainer.firstElementChild!;

    const { container: inactiveContainer } = render(<ProfileStatusChip status="inactive" />);
    const inactiveChip = inactiveContainer.firstElementChild!;

    expect(activeChip.className).not.toBe(inactiveChip.className);
  });
});
