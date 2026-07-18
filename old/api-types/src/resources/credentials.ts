/**
 * credentials.json — auto-scaffolded from the mock fixture shape.
 *
 * Every field mirrors an observed field in credentials.json. Nullability and
 * optionality reflect the actual JSON (a field is nullable if it ever
 * appears as null; optional if it is missing from at least one record).
 * ID fields are branded — see ../ids.ts. Closed enums live in ../enums.ts.
 */
import { z } from "zod";

import { Timestamp } from "../common.js";
import { CredentialStatus, CredentialType, HolderType } from "../enums.js";
import { AthleteId, BranchId, CredentialId, TenantId } from "../ids.js";

import { collectionHelpers } from "./_helpers.js";

export const Credential = z
  .object({
    id: CredentialId,
    tenant_id: TenantId,
    branch_id: BranchId,
    uid: z.enum([
      "0416BB9903A1",
      "0433E811A22F",
      "0489A1245B22",
      "04A21876AA19",
      "04B722C3E419",
      "04D9F02218CC",
    ]),
    type: CredentialType,
    code: z.enum(["NFC-0001", "NFC-0003", "NFC-0004", "NFC-0005", "NFC-STF-01", "RFID-0002"]),
    holder_type: HolderType,
    holder_id: z.string(),
    athlete_id: AthleteId.nullable(),
    status: CredentialStatus,
    issued_at: Timestamp,
    activated_at: Timestamp,
    revoked_at: Timestamp.nullable(),
    replaced_by_credential_id: CredentialId.nullable(),
    created_at: Timestamp,
    updated_at: Timestamp,
  })
  .loose();
export type Credential = z.infer<typeof Credential>;

export const { array: CredentialList, parse: parseCredentialsJson } = collectionHelpers(Credential);
