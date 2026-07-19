# people

The CENTRAL-plane person registry — cross-academy shared profile substrate. Wave
1 module. Sits on the central connection (never a tenant DB).

## 1. What this module owns

| Concern         | Owned artefact                                                                                                 |
| --------------- | -------------------------------------------------------------------------------------------------------------- |
| Global identity | `PersonIdentity` (`pin_`) — one per real human, cross-tenant, minimal PII, carries the Academorix ID.          |
| Guardian link   | `PersonGuardianLink` (`pgl_`) — central-plane parent↔minor link that survives across tenants.                  |
| Consent request | `TenantLinkRequest` (`tlr_`) — request from a tenant to bind a local Athlete/Staff to a global PersonIdentity. |

## 2. Two-layer split (per blueprint §2.2)

```
Central (this module)              Tenant (athlete / staff)
  PersonIdentity                     athletes.person_identity_id (nullable)
  PersonGuardianLink                 staff.person_identity_id     (nullable)
  TenantLinkRequest
```

The **only** cross-DB reference in the platform points FROM tenant DBs INTO
central — never the reverse. Central knows a person exists; tenants know what
that person does IN their academy. Scoring / cards / attendance / progress /
medical records stay 100% tenant-local.

## 3. The Academorix ID

Format: `AX-<segment1>-<segment2>` where each segment is 4 base32 chars
(Crockford). Example: `AX-7F3K-9210`. Guaranteed globally unique across the
platform via a monotonic issuer with sharded ranges.

The ID is human-shareable: a guardian gives it to a new academy alongside their
child's DOB, the academy runs a lookup, and — with consent — pre-fills a local
Athlete record.

## 4. Enumeration-resistant lookup

`POST /api/v1/people/lookup` takes `{ academorix_id, date_of_birth }`. The
response contains ONLY `{ found: true, request_url? }` — no PII, no name, no
nationality is revealed before consent. If a match is found, the caller may file
a `TenantLinkRequest` which fires a consent notification to the linked
guardians.

Rate limits:

- 10 lookups / hour / IP address
- 100 lookups / day / originating tenant
- 3-of-5 failed matches in a sliding 15-minute window → 24-hour lockout for the
  originating tenant

## 5. Consent flow

```
Tenant B → POST /people/lookup { AX-7F3K-9210, dob }
        ← { found: true, request_url? }

Tenant B → POST /people/link-requests { person_identity_id, requesting_tenant_id, purpose }
        ← { link_request_id, status: 'requested' }

Guardian receives central-URL notification (email/push):
  "Academy B wants to link [masked child] to their identity —
   review + choose what to share."

Guardian → GET /people/link-requests/{signature}
        ← { requesting_tenant: 'Academy B', shareable_fields: [...] }

Guardian → POST /people/link-requests/{signature}/approve
           { shared_fields: ['legal_name', 'date_of_birth',
                             'emergency_contact_json', 'allergies_summary'] }
        ← { status: 'approved', payload: { legal_name: ..., dob: ..., ... } }

Tenant B applies the payload to its local Athlete row and stamps
   `athletes.person_identity_id = pin_...` + `link_request_id`.
```

Consent is per-tenant + revocable — revoking stops future sync but preserves
what the receiving tenant already created.

## 6. Shareable field subset

**Shareable** (guardian may include):

- `legal_name`
- `date_of_birth`
- `nationality`
- `emergency_contact_json`
- `allergies_summary` (structured, low-detail)
- `passport_document_id` (cross-tenant signed URL to a `storage::File` on the
  origin tenant)

**Never shareable** (100% tenant-local):

- `email`, `phone`, `national_id_full`
- Medical records / injuries / clearances
- Financial records / invoices / memberships
- Scoring / cards / attendance / progress

## 7. Cascades

- `PersonIdentity` deletion → CASCADE `PersonGuardianLink` +
  `TenantLinkRequest`; tenant rows retain their local data with
  `person_identity_id = NULL` (dangling reference deliberately allowed).
- `PersonIdentity` freeze (fraud) → all active links become read-only; new link
  requests refused.
- `TenantLinkRequest` expiry → 30 days after `requested_at` without approval →
  auto-declined by `ExpireStaleLinkRequestsJob`.

## 8. ULID prefixes owned

- `pin_` — PersonIdentity
- `pgl_` — PersonGuardianLink
- `tlr_` — TenantLinkRequest

Register in `modules/shared/blueprints/foundation/data/ulid-prefixes.json`.
