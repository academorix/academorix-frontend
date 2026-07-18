/**
 * @file facility-type-chip.test.tsx
 * @module modules/facilities/__tests__/facility-type-chip.test
 *
 * @description
 * Rendering tests for {@link FacilityTypeChip}. Every {@link FacilityType}
 * must:
 *   1. Render the human-readable label from `FACILITY_TYPE_LABELS`.
 *   2. Render its icon glyph by default (marked aria-hidden).
 *   3. Suppress the icon when the caller passes `showIcon={false}` — used by
 *      the list cell that already renders a leading glyph.
 */

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { FacilityType } from "@/modules/facilities/facilities.types";

import { FacilityTypeChip } from "@/modules/facilities/components/facility-type-chip";
import { FACILITY_TYPE_LABELS, FACILITY_TYPES } from "@/modules/facilities/facilities.types";

describe("FacilityTypeChip", () => {
  // A parametric loop is the cleanest way to guarantee every type has a
  // configured icon + colour + label. Adding a new type to `FACILITY_TYPES`
  // that forgets its label / icon / colour will fail this suite immediately.
  it.each(FACILITY_TYPES)("renders the label for %s", (type: FacilityType) => {
    render(<FacilityTypeChip type={type} />);

    expect(screen.getByText(FACILITY_TYPE_LABELS[type])).toBeInTheDocument();
  });

  it("includes an aria-hidden icon by default", () => {
    const { container } = render(<FacilityTypeChip type="pitch" />);

    // Icons render as SVGs; heroicons default marker for decorative glyphs is
    // aria-hidden=true.
    const svg = container.querySelector("svg[aria-hidden='true']");

    expect(svg).not.toBeNull();
  });

  it("omits the icon when showIcon is false", () => {
    const { container } = render(<FacilityTypeChip showIcon={false} type="pitch" />);

    // No SVG should be rendered inside the chip in this mode.
    expect(container.querySelector("svg")).toBeNull();

    // The label must still be present regardless of the icon toggle.
    expect(screen.getByText(FACILITY_TYPE_LABELS.pitch)).toBeInTheDocument();
  });

  it("keeps distinct labels for adjacent-looking types", () => {
    // A regression guard — if someone collapses `pitch` and `court` (both
    // rectangular field-like resources) into the same label, catch it here.
    render(
      <div>
        <FacilityTypeChip type="pitch" />
        <FacilityTypeChip type="court" />
      </div>,
    );

    expect(screen.getByText("Pitch")).toBeInTheDocument();
    expect(screen.getByText("Court")).toBeInTheDocument();
  });
});
