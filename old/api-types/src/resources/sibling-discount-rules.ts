/**
 * sibling-discount-rules.json — auto-scaffolded from the mock fixture shape.
 *
 * Every field mirrors an observed field in sibling-discount-rules.json. Nullability and
 * optionality reflect the actual JSON (a field is nullable if it ever
 * appears as null; optional if it is missing from at least one record).
 * ID fields are branded — see ../ids.ts. Closed enums live in ../enums.ts.
 */
import { z } from "zod";

import { Timestamp } from "../common.js";
import { SportKey } from "../enums.js";
import { SiblingDiscountRuleId, TenantId } from "../ids.js";

import { collectionHelpers } from "./_helpers.js";

export const SiblingDiscountRule = z
  .object({
    id: SiblingDiscountRuleId,
    tenant_id: TenantId,
    name: z.string(),
    min_active_memberships: z.number(),
    discount_type: z.enum(["first_period_free", "percent"]),
    discount_value: z.number(),
    applies_to: z.enum(["cheapest", "each", "new_member"]),
    is_active: z.boolean(),
    priority: z.number(),
    notes: z.string(),
    created_at: Timestamp,
    updated_at: Timestamp,
    applies_to_sports: z.array(z.string()).nullable().optional(),
    starts_on: z.enum(["2025-09-01", "2026-01-01"]).optional(),
    ends_on: z.enum(["2025-12-31", "2026-12-31"]).nullable().optional(),
    sport_key: SportKey.optional(),
  })
  .loose();
export type SiblingDiscountRule = z.infer<typeof SiblingDiscountRule>;

export const { array: SiblingDiscountRuleList, parse: parseSiblingDiscountRulesJson } =
  collectionHelpers(SiblingDiscountRule);
