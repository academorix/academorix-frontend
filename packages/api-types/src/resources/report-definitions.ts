/**
 * report-definitions.json — auto-scaffolded from the mock fixture shape.
 *
 * Every field mirrors an observed field in report-definitions.json. Nullability and
 * optionality reflect the actual JSON (a field is nullable if it ever
 * appears as null; optional if it is missing from at least one record).
 * ID fields are branded — see ../ids.ts. Closed enums live in ../enums.ts.
 */
import { z } from "zod";

import { Timestamp } from "../common.js";
import { ReportDefinitionId, TenantId } from "../ids.js";

import { collectionHelpers } from "./_helpers.js";

export const ReportDefinition = z
  .object({
    id: ReportDefinitionId,
    tenant_id: TenantId.nullable(),
    key: z.string(),
    name: z.record(z.string(), z.unknown()),
    domain: z.enum(["attendance", "facilities", "finance", "medical", "memberships", "payroll"]),
    default_range: z.enum(["last_30d", "last_7d", "last_90d", "month_to_date", "season"]),
    parameters_schema: z.array(z.record(z.string(), z.unknown()).loose()),
    scope_by: z.enum(["branch", "team"]),
    output_format: z.enum(["both", "chart", "table"]),
    created_at: Timestamp,
    updated_at: Timestamp,
  })
  .loose();
export type ReportDefinition = z.infer<typeof ReportDefinition>;

export const { array: ReportDefinitionList, parse: parseReportDefinitionsJson } =
  collectionHelpers(ReportDefinition);
