/**
 * @file document-chips.test.tsx
 * @module modules/documents/__tests__/document-chips.test
 *
 * @description
 * Unit tests for the three visual atoms of the Documents module:
 *
 *  * {@link DocumentTypeChip} — colour + iconography per known type, and
 *    graceful fallback for unknown tenant-added values.
 *  * {@link DocumentStatusChip} — colour + label per scan status
 *    (`pending`, `clean`, `infected`).
 *  * {@link DocumentScopeBadge} — "Scope: <name>" label with a raw-id
 *    fallback when the resolver can't produce a name.
 *
 * Kept in one file so a single mental model — "the chip primitives" —
 * groups the three assertions the visual language leans on.
 */

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { DocumentScopeBadge } from "@/modules/documents/components/document-scope-badge";
import { DocumentStatusChip } from "@/modules/documents/components/document-status-chip";
import { DocumentTypeChip } from "@/modules/documents/components/document-type-chip";
import {
  DOCUMENT_STATUS_LABELS,
  DOCUMENT_TYPE_LABELS,
  labelForDocumentType,
} from "@/modules/documents/documents.config";

// ─────────────────────────────────────────────────────────────────────────────
// DocumentTypeChip
// ─────────────────────────────────────────────────────────────────────────────

describe("DocumentTypeChip", () => {
  it("renders each known type with its label", () => {
    for (const [key, label] of Object.entries(DOCUMENT_TYPE_LABELS)) {
      const { unmount } = render(<DocumentTypeChip type={key} />);

      expect(screen.getByText(label)).toBeInTheDocument();
      unmount();
    }
  });

  it("falls back to a normalised label for unknown types", () => {
    render(<DocumentTypeChip type="board_minutes" />);

    expect(screen.getByText("board minutes")).toBeInTheDocument();
  });

  it("renders an icon by default", () => {
    const { container } = render(<DocumentTypeChip type="medical_clearance" />);

    // The heroicon renders as an <svg>; without aria-hidden, react-aria's
    // Chip should still contain exactly one SVG glyph for the icon.
    expect(container.querySelectorAll("svg").length).toBeGreaterThanOrEqual(1);
  });

  it("hides the icon when hideIcon is set", () => {
    const { container: iconContainer } = render(<DocumentTypeChip type="contract" />);
    const iconedSvgCount = iconContainer.querySelectorAll("svg").length;

    const { container: bareContainer } = render(<DocumentTypeChip hideIcon type="contract" />);
    const bareSvgCount = bareContainer.querySelectorAll("svg").length;

    // Bare chip has one fewer SVG than iconed chip.
    expect(bareSvgCount).toBeLessThan(iconedSvgCount);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// DocumentStatusChip
// ─────────────────────────────────────────────────────────────────────────────

describe("DocumentStatusChip", () => {
  it("renders every scan status with the correct label", () => {
    for (const [status, label] of Object.entries(DOCUMENT_STATUS_LABELS)) {
      const { unmount } = render(
        <DocumentStatusChip status={status as keyof typeof DOCUMENT_STATUS_LABELS} />,
      );

      expect(screen.getByText(label)).toBeInTheDocument();
      unmount();
    }
  });

  it("uses the emphasised primary variant for infected", () => {
    const { container } = render(<DocumentStatusChip status="infected" />);
    const chip = container.querySelector(".chip");

    expect(chip).not.toBeNull();
    expect(chip?.className).toMatch(/primary/);
  });

  it("uses the soft variant for pending and clean", () => {
    const { container: pendingContainer } = render(<DocumentStatusChip status="pending" />);
    const { container: cleanContainer } = render(<DocumentStatusChip status="clean" />);

    expect(pendingContainer.querySelector(".chip")?.className).toMatch(/soft/);
    expect(cleanContainer.querySelector(".chip")?.className).toMatch(/soft/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// DocumentScopeBadge
// ─────────────────────────────────────────────────────────────────────────────

describe("DocumentScopeBadge", () => {
  it("renders the scope label and the resolved owner name", () => {
    render(<DocumentScopeBadge ownerId="ath_emma" ownerName="Emma Johnson" scope="athlete" />);

    expect(screen.getByText("Athlete:")).toBeInTheDocument();
    expect(screen.getByText("Emma Johnson")).toBeInTheDocument();
  });

  it("falls back to the raw owner id when a name is not provided", () => {
    render(<DocumentScopeBadge ownerId="ath_emma" scope="athlete" />);

    expect(screen.getByText("Athlete:")).toBeInTheDocument();
    expect(screen.getByText("ath_emma")).toBeInTheDocument();
  });

  it("falls back to the raw owner id when the name is an empty string", () => {
    render(<DocumentScopeBadge ownerId="ath_emma" ownerName="   " scope="athlete" />);

    // Whitespace-only names should still be treated as absent so the
    // badge does not render an empty label.
    expect(screen.getByText("ath_emma")).toBeInTheDocument();
  });

  it("renders the unknown-scope key as its raw string", () => {
    render(<DocumentScopeBadge ownerId="cat_1" scope="cat" />);

    expect(screen.getByText("cat:")).toBeInTheDocument();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// labelForDocumentType — smoke-check the shared config helper
// ─────────────────────────────────────────────────────────────────────────────

describe("labelForDocumentType", () => {
  it("returns the mapped label for known types", () => {
    expect(labelForDocumentType("medical_clearance")).toBe("Medical clearance");
  });

  it("normalises unknown keys by replacing underscores with spaces", () => {
    expect(labelForDocumentType("board_minutes")).toBe("board minutes");
  });
});
