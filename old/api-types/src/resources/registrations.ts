/**
 * registrations.json — auto-scaffolded from the mock fixture shape.
 *
 * Every field mirrors an observed field in registrations.json. Nullability and
 * optionality reflect the actual JSON (a field is nullable if it ever
 * appears as null; optional if it is missing from at least one record).
 * ID fields are branded — see ../ids.ts. Closed enums live in ../enums.ts.
 */
import { z } from "zod";

import { Timestamp } from "../common.js";
import { RegistrationStatus, SportKey } from "../enums.js";
import {
  AthleteId,
  BranchId,
  EventId,
  LeadId,
  OrganizationId,
  RegionId,
  SeasonId,
  StaffId,
  TenantId,
} from "../ids.js";

import { collectionHelpers } from "./_helpers.js";

export const Registration = z
  .object({
    id: RegionId,
    tenant_id: TenantId,
    organization_id: OrganizationId,
    branch_id: BranchId,
    region_id: RegionId,
    season_id: SeasonId,
    sport_key: SportKey,
    applicant_first_name: z.enum([
      "Diego",
      "Ethan",
      "Jenna",
      "Kai",
      "Luca",
      "Mia",
      "Olivia",
      "Sofia",
    ]),
    applicant_last_name: z.enum([
      "Alvarez",
      "Chen",
      "Kim",
      "Martinez",
      "Nakamura",
      "Park",
      "Rossi",
    ]),
    applicant_date_of_birth: z.enum([
      "2010-08-21",
      "2012-05-11",
      "2013-02-27",
      "2013-05-14",
      "2014-03-08",
      "2014-08-19",
      "2014-11-02",
      "2015-01-24",
    ]),
    guardian_first_name: z.enum([
      "Alessandro",
      "Dana",
      "Giulia",
      "Ji-hoon",
      "Ji-woo",
      "Sofia",
      "Wei",
      "Yuki",
    ]),
    guardian_last_name: z.enum(["Alvarez", "Chen", "Johnson", "Kim", "Nakamura", "Park", "Rossi"]),
    contact_email: z.string(),
    contact_phone: z.string().nullable(),
    status: RegistrationStatus,
    lead_id: LeadId.nullable(),
    athlete_id: AthleteId.nullable(),
    assigned_staff_id: StaffId.nullable(),
    trial_event_id: EventId.nullable(),
    consents: z.record(z.string(), z.unknown()),
    submitted_at: Timestamp,
    approved_at: Timestamp.nullable(),
    created_at: Timestamp,
    updated_at: Timestamp,
  })
  .loose();
export type Registration = z.infer<typeof Registration>;

export const { array: RegistrationList, parse: parseRegistrationsJson } =
  collectionHelpers(Registration);
