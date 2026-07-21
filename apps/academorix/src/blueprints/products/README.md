# `modules/products/` — product-scoped blueprints

Modules that **are not consumed by any platform service**, but ARE consumed by
one or more product monoliths (Sports, Venue, Ticketing, Marketplace,
Education). They ship as shared Composer packages that product apps `require`;
they never own a service deployment.

## Modules — on disk

| Module                                  | Wave | Priority | Schemas | Purpose                                                                                                                                                                                                                                     |
| --------------------------------------- | ---- | -------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`geofencing/`](./geofencing/readme.md) | 5    | 30       | 2       | PostGIS geofence primitive. Model-agnostic via `HasGeofence` trait; polymorphic `fenceable_type/fenceable_id` on `GeofenceCheck`. Sports uses it for attendance validation; Venue for access control; Marketplace for delivery-zone gating. |

**Total on disk: 1 module, 2 schemas.**

## Modules — planned

The full product-scoped roster will grow as products come online. Each is
authored only when a product needs it:

| Module          | Consumed by            | Purpose                                                                                                        |
| --------------- | ---------------------- | -------------------------------------------------------------------------------------------------------------- |
| `sports/`       | Sports monolith        | Athlete, Team, Coach, Match, Season, AthleteGuardian, AthleteEnrollment, TeamMember.                           |
| `attendance/`   | Sports, Education      | Session attendance capture, sign-in/out, guardian pickup verification.                                         |
| `bookings/`     | Venue, Sports          | Facility bookings, passes, day passes.                                                                         |
| `courses/`      | Education              | Courses, lessons, enrollments, assignments, grading.                                                           |
| `commerce/`     | Marketplace, Ticketing | Products, orders, carts, inventory, shipping.                                                                  |
| `events/`       | Ticketing              | Events, tickets, seat maps, entry validation.                                                                  |
| `safeguarding/` | Sports, Education      | Case management workflow (peer to `compliance/`'s intake — deeper investigation + external referral tracking). |

**Placement rule of thumb:**

- One product needs it → live in that product's monolith
  (`apps/<product>/src/modules/`), not here.
- Two or more products need it → `products/` here as a shared package.
- Every service needs it → `shared/` (not `products/`).

## Why product-scoped differs from `shared/`

Both `shared/` and `products/` ship as Composer packages that services /
products `require`. The difference is audience:

- **`shared/`** — every service consumes it (foundation, telemetry, audit, …).
  If you're building any Academorix service, you pull in `shared/`.
- **`products/`** — only consuming products pull it in. A Sports-only deployment
  carries `geofencing/`; a Marketplace-only deployment might not.

Consequence: `products/` modules can safely depend on the _concept_ of a
product-monolith stack (Cashier, PostGIS, spatie/laravel-medialibrary, …),
whereas `shared/` modules stay light because they're pulled in by every service.
Keep the heavy deps here.

## Cross-cutting invariants

- **Products modules NEVER depend on platform services' internal modules.** A
  product-scoped module reaches the platform via SDKs (`platform-sdk`,
  `identity-sdk`, `billing-sdk`), never by requiring `platform/tenants/` as a
  Composer package. Depending would collapse the service boundary.
- **Trait composition is the primary integration pattern.** `HasGeofence`,
  future `HasSafeguarding`, future `HasAthlete` — these are model traits that a
  product's own models compose. Products modules don't ship their own
  controllers or routes for tenant-facing UX — the product monolith owns its
  HTTP surface.
- **Every product-scoped model is tenant-scoped.** `BelongsToTenant` applies
  here the same as anywhere else.

## For agents

- **Never author a `sports/` module here that mirrors a product monolith's
  entire domain.** The product monolith owns Athletes/Teams/etc.; the `sports/`
  shared package (if it ever exists) would ship only the CROSS- PRODUCT
  vocabulary (`HasAthlete` trait, `Sport` reference enum, …).
- **When a `products/*` module gets N=1 consumer**, move it into the consumer's
  monolith. Keeping single-consumer modules here is over- engineering.

## Related

- `../README.md` — master index.
- `.kiro/specs/platform-architecture/DECISION.md` — 5 product monoliths.
- `.kiro/steering/hierarchy.md` §1b — domain-plane vocabulary lock-in (Athlete,
  Team, Coach, Season, Pass, Membership).
