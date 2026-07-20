# branch

Physical venue — the concrete place where a Tenant's activities happen.
FK-central to the whole platform. Wave 2 of the tenancy tier (priority 45).

## 1. What this module owns

| Concern                   | Owned artefact                                                                        |
| ------------------------- | ------------------------------------------------------------------------------------- |
| Physical venue            | `Branch` (`branches.tenant_id × branches.organization_id × branches.region_id`)       |
| Structured address        | `Branch.address` (jsonb: line1, line2, city, subdivision, postal_code, country_code)  |
| Geolocation               | `Branch.coordinates` (jsonb: lat, lng, accuracy_m, source) — no PostGIS in Wave 2     |
| Opening hours             | `Branch.opening_hours` (jsonb per-day + tz-aware exceptions + multi-period support)   |
| Capacity                  | `Branch.capacity` (int, nullable — fire-safety cap consumed by booking-adjacent code) |
| Amenities                 | `Branch.amenities` (jsonb array of tags from the platform catalogue)                  |
| Operational lifecycle     | `active` / `paused` / `closed` with reopen semantics                                  |
| Default-per-org invariant | Exactly one `is_default = true` per `(tenant_id, organization_id)`                    |
| CLI + HTTP surface        | 11 Artisan commands + 12 tenant-plane routes + 3 platform-plane routes                |
| Runtime helpers           | `OpeningHoursEvaluator`, `AddressFormatter`, `CapacityGate`, `DefaultBranchResolver`  |
| Geocoding (optional)      | `GeocodingClient` — Google Maps / Mapbox / Nominatim, gated by `branch_geocoding`     |

### 1.1 The three-FK contract

Branch is the ONE place where Organization + Region + Tenant meet:

```
tenants                       organizations                   regions
─────────────                 ──────────────                  ────────
id (ten_...)                  id (org_...)                    id (rgn_...)
                              tenant_id ──┐                   tenant_id ──┐
                              ...         │                   ...         │
                                          │                               │
                                          ▼                               ▼
                                    branches ─── organization_id ─── region_id
                                    ──────────
                                    id (brn_...)
                                    tenant_id
                                    organization_id
                                    region_id
                                    name / slug / code
                                    address / coordinates
                                    opening_hours
                                    capacity
                                    amenities
                                    status
                                    is_default (per org)
```

Three orthogonal axes converge here:

- **`tenant_id`** — _who owns this row?_ (the customer of the Application)
- **`organization_id`** — _which structural sub-brand does it belong to?_
  (`Elite Sports Academy`)
- **`region_id`** — _which commercial/regulatory zone applies?_ (`US-CA`
  currency + tax + timezone)

Downstream domain rows (facilities, teams, athletes, staff, coaches,
memberships) cascade through `branch_id` for Region + Organization. There are NO
shortcut FKs — no `facilities.organization_id`, no `teams.region_id`. If a
report needs a facility's Region, it joins through `branches`.

### 1.2 Why no shortcuts?

Every shortcut FK invites drift. If a Branch is moved (in practice: it never is;
see §7), a shortcut on Facility would need a cascading update the DB can't
enforce. Cascading through `branch_id` means the Branch row is the ONE place
Region + Organization live for that venue.

Hard rules (see `tenancy-columns.md` §5):

- No `facilities.organization_id` — join through Branch.
- No `facilities.region_id` — join through Branch.
- No `teams.region_id` — join through Branch.
- No `regions.organization_id` — orthogonal by design.
- No `application_id` on Branch — cascades through
  `tenant_id → tenants.application_id`.

### 1.3 Terminal states + the immutability rules

Branches don't move between organizations. Branches don't move between regions.
Once created, `organization_id` and `region_id` are frozen — this is enforced by
the observer's `saving` hook (refuses the change with a
`BRANCH_ORGANIZATION_IMMUTABLE` / `BRANCH_REGION_IMMUTABLE` 422). Rationale:

- **Organization move** would orphan every facility / team / staff row that
  cascades Organization through this branch.
- **Region move** would corrupt every historic invoice that snapshotted Region
  for tax + currency at issue time. Regions carry commercial + regulatory
  context; migrating a Branch to another Region is a compliance event, not an
  edit.

The correct path for either move is: create a fresh Branch under the new
Organization / Region, migrate operational load, then close the old one.

`status → closed` is the terminal state. Reopen is allowed (see §5), but hard
delete is not — closed rows are compliance material referenced by historic
invoices, activity logs, and audit trails.

## 2. Provisioning

Branches are explicit tenant-admin actions. The `TenantProvisioned` listener
does NOT seed a default Branch — creating the first venue is one of the tenant's
mandatory onboarding steps. Rationale: tenants across the five business types
have wildly different venue shapes at day one (a solo coach academy has no
venue; a chain gym has 12). Seeding one wrong is worse than seeding none.

The `ProvisionBranch` action:

```php
$branch = app(BranchProvisioner::class)->provision(
    tenant: $tenant,
    organization: $organization,     // required
    region: $region,                 // required
    name: 'Downtown SF',
    slug: 'downtown-sf',
    address: new StructuredAddress(
        line1: '123 Market St',
        city: 'San Francisco',
        subdivision: 'CA',
        postal_code: '94103',
        country_code: 'US',
    ),
    isDefault: true,
    createdBy: $admin,
);
```

The action:

1. Refuses when `organization.tenant_id !== branch.tenant_id`.
2. Refuses when `region.tenant_id !== branch.tenant_id`.
3. Consumes 1 unit of `branch_slot` entitlement.
4. If `isDefault=true` OR no other default exists on the target org, seeds
   `is_default = true` and demotes any prior default row.
5. Dispatches `GeocodeAddressJob` when the tenant has `branch_geocoding`
   enabled + `address` is present.
6. Fires `BranchCreated`.

## 3. The status lifecycle

```
[created]  status=active
    │
    │─ pause (admin, temporary — new bookings refused)
    ▼
[paused]
    │─ resume (admin)                    │─ close (admin, terminal)
    ▼                                    ▼
[active]                              [closed]  closed_date set
                                         │─ reopen (admin, rare)
                                         ▼
                                      [active]
```

Rules:

- **`active`** — the normal state. Every operation permitted.
- **`paused`** — new bookings + registrations refused; existing work continues.
  Read-only for booking-adjacent surfaces. Reversible.
- **`closed`** — terminal. Refused when any active downstream row references the
  Branch (teams, facilities, sessions, bookings, memberships). Response:
  `BRANCH_IN_USE` (409). `closed_date` populated automatically.
- **Reopen** — allowed only when no active successor branch has been created
  under the same `(tenant, organization)` after the close event (guards against
  accidental resurrection of a decommissioned venue).

Every transition fires the matching event (see `events.json`). Sanctum PATs
scoped to a closed branch are NOT revoked — closure affects the venue, not
users' credentials.

## 4. Structured address

`Branch.address` is a JSONB blob (the ONE place structured addresses live in the
platform in Wave 2 — separate address module is deferred). Shape:

```jsonc
{
  "line1": "123 Market St",
  "line2": "Suite 400", // nullable
  "city": "San Francisco",
  "subdivision": "CA", // state / province / emirate
  "postal_code": "94103", // nullable in countries without them
  "country_code": "US", // ISO 3166-1 alpha-2
  "formatted": "123 Market St, Suite 400, San Francisco, CA 94103, US",
}
```

- Validated by `valid_address_structure` — requires `line1`, `city`,
  `country_code` at minimum.
- `AddressFormatter` produces the `formatted` field per-locale (US =
  street-first, JP = ZIP-first, FR = ZIP-city, GB = title-case city);
  overwritten server-side on every save.
- `country_code` FKs conceptually to `geography::Country.iso2` (soft, validated
  at write time — no hard FK because addresses often outlive the country row
  cleanup).

## 5. Geolocation + geofencing hand-off

`Branch.coordinates` is a JSONB blob (no PostGIS in Wave 2 — the geofencing
module in Wave 3 owns PostGIS + polygon math):

```jsonc
{
  "lat": 37.7749,
  "lng": -122.4194,
  "accuracy_m": 20, // meters
  "source": "geocoded", // manual | geocoded | imported
}
```

- **`manual`** — tenant admin dragged the pin on the map.
- **`geocoded`** — resolved by `GeocodeAddressJob` (subprocessor).
- **`imported`** — CSV import brought coordinates in wholesale.

When `coordinates` change, the observer fires `BranchCoordinatesUpdated`. The
Wave 3 geofencing module subscribes to this event and re-runs its polygon
coverage check for every geofence attached to this Branch.

**Wave 3 hand-off contract.** The geofencing module (per its blueprint) is
model-agnostic — any Eloquent model with `HasGeofence` participates. Branch
consumes it when the sports domain lands attendance / check-in flows. This
module just publishes the coordinate change; the geofencing module owns the
recomputation.

## 6. Opening hours

`Branch.opening_hours` is a JSONB blob (per-day + timezone-aware exceptions):

```jsonc
{
  "monday": [{ "open": "07:00", "close": "22:00" }],
  "tuesday": [{ "open": "07:00", "close": "22:00" }],
  "wednesday": [{ "open": "07:00", "close": "22:00" }],
  "thursday": [{ "open": "07:00", "close": "22:00" }],
  "friday": [{ "open": "07:00", "close": "22:00" }],
  "saturday": [{ "open": "09:00", "close": "20:00" }],
  "sunday": [
    { "open": "09:00", "close": "13:00" },
    { "open": "17:00", "close": "22:00" }, // multi-period day
  ],
  "exceptions": [
    { "date": "2026-12-25", "reason": "Christmas", "closed": true },
    { "date": "2026-07-04", "hours": [{ "open": "10:00", "close": "16:00" }] },
  ],
}
```

Rules:

- Times are **local to `branch.region.timezone`** — never UTC. The evaluator
  runs `now()->setTimezone($branch->region->timezone)` before comparing.
- `close > open` per period (validated by `valid_opening_hours`).
- Multi-period days require `branch_multi_period_hours` entitlement (Medium+).
  Small tier is single-period only.
- Exceptions override the day's default. `closed: true` blocks the day entirely;
  a `hours` array overrides the day's periods.

`OpeningHoursEvaluator` exposes:

- `isOpenNow($branch): bool` — used by the `is-open` GET endpoint.
- `nextOpenAt($branch): CarbonImmutable | null`
- `nextCloseAt($branch): CarbonImmutable | null`
- `isOpenAt($branch, CarbonImmutable $moment): bool`

The `branch.enforce_operating_hours` middleware wraps booking-adjacent routes
and refuses writes outside the current window. Read routes are never gated.

## 7. Capacity

`Branch.capacity` is a nullable int — the fire-safety cap (max concurrent
occupants). Nullable because not every tenant knows or cares (a solo-coach
academy running one team on a rented court has no fire-safety number).

Consumed by downstream booking modules via `CapacityGate`:

```php
CapacityGate::allowsAdditional($branch, moment: now(), delta: 25);
// false when concurrent bookings + delta > capacity
```

Feature-gated by `branch_capacity_gating` (Medium+) — enforcement is opt-in;
without the entitlement `CapacityGate::allowsAdditional()` always returns
`true`. Capacity is uniform across all opening periods — no per-period cap.

## 8. Amenities

`Branch.amenities` is a JSONB array of string tags drawn from the platform
catalogue (`data/amenity-catalog.json`):

```json
["wifi", "parking", "showers", "cafe", "prayer_room", "wheelchair_accessible"]
```

The catalogue is platform-wide (all tenants share the same tags) so filtering
works cross-tenant on platform-admin surfaces. Custom amenity tags require the
`branch_amenities` entitlement in "custom" mode (Enterprise) — the catalogue is
the ONLY source of truth on Small + Medium tiers.

## 9. What this module does NOT do

- **Doesn't do point-in-polygon math.** That's `products::geofencing` in Wave 3.
- **Doesn't own booking / session / registration domain rows.** Those are future
  domain modules (`facility`, `teams`, `sports`) that FK to Branch.
- **Doesn't move Branches between Organizations.** Immutable post-create.
- **Doesn't move Branches between Regions.** Immutable post-create.
- **Doesn't hard-delete via public API.** Close is the terminal state;
  hard-delete is a two-person platform-support action via CLI.
- **Doesn't run its own geocoder.** Delegates to a configured subprocessor
  (Google / Mapbox / Nominatim). Falls back to `manual` mode when the
  entitlement is absent.
- **Doesn't handle mobile / virtual venues.** Wave 2 assumes physical addresses.
  Mobile venues (e.g. a coach who travels between client sites) deferred to a
  later wave.
- **Doesn't publish addresses / coordinates for public directory listings.** A
  `Branch.is_publicly_listed` toggle is future work; the current default is
  admin-only visibility.

## 10. Cross-references

- `.kiro/steering/hierarchy.md` §2 — the platform tree (Branch is the physical
  join point of Organization + Region).
- `.kiro/steering/hierarchy.md` §7 — tier matrix (Branch slots per tier).
- `.kiro/steering/hierarchy.md` §13 — no shortcut FKs.
- `.kiro/steering/hierarchy.md` §14 — belongs-to matrix (Branch is the target of
  every downstream domain aggregate).
- `.kiro/steering/tenancy-columns.md` §3 — Branch carries `tenant_id` +
  `organization_id` + `region_id`; no `application_id`.
- `modules/platform/blueprints/branch/data/amenity-catalog.json` — the canonical
  amenity tag list.
- `modules/products/blueprints/geofencing/` — Wave 3 hand-off contract for
  polygon-based fences attached to Branch.
