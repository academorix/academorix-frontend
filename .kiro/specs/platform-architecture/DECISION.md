# Platform Architecture — Decision Record

> Status: **accepted** (2026-07-14). This is the authoritative platform-shape
> decision for Figentra Tech LLC. It governs how the `modules/<name>/`
> blueprints map to deployable services, which languages each layer uses, and
> how the products consume the platform. Supersede only with a follow-up
> decision record in this folder that references this one by date.

---

## 1. Context

Figentra Tech LLC ships **five SaaS products** on shared infrastructure: Sports,
Venue, Ticketing, Marketplace, Education. Requirements that shape the
architecture:

- **Shared login** across every product (one human, one credential).
- **Shared billing / licensing / entitlements** across products.
- **White-label** — per-tenant branding, custom domains, theming.
- **Multi-tenant** SaaS, plus **dedicated** and **on-premise** deployments for
  enterprise customers.
- **Laravel ecosystem** investment: 23 authored blueprint modules, ~30 traits +
  attributes, Cashier, spatie stack, stancl-style tenancy, an attribute-first
  discovery architecture, and SDK generation already in motion.

Two decisions had to be made together: **(1) service boundaries** — how many
services and what each owns; and **(2) language mix** — Laravel everywhere vs.
Go for the platform tier vs. a JS/TS or Python platform.

---

## 2. Decision

### 2.1 Service boundaries — Platform + Product

A **Platform + Product** topology. Six stable platform services own everything
that is _not_ business domain; five product monoliths own business domain and
consume the platform over versioned contracts. AI is a separate Python service.

```
                          Figentra Platform
   ┌──────────────────────────────────────────────────────────────┐
   │  Identity   Platform   Access   Billing   Notifications        │
   │  Compliance                                                    │
   └──────────────────────────────────────────────────────────────┘
                               │
                               │   + AI Service (Python)
                               │
      ┌────────────┬───────────┼───────────┬────────────┐
      │            │           │           │            │
   Sports       Venue      Ticketing   Marketplace   Education
  (Laravel)   (Laravel)   (Laravel)    (Laravel)     (Laravel)
```

**Six platform services** (not eight):

| Service           | Owns                                                                                                                                                                                                          |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Identity**      | Identity (one per human), authentication, MFA, passwords, sessions, OAuth clients, PATs, service accounts, JWT issuance + JWKS publication.                                                                   |
| **Platform**      | Applications, Tenants, Organizations, Regions, Branches, Settings, Feature Flags, Branding / white-label, Domains, Webhooks, **Storage/Media** (folded in initially).                                         |
| **Access**        | Roles, Permissions, Policies, Scopes, Groups, Invitations. No business logic.                                                                                                                                 |
| **Billing**       | Subscriptions, Plans, Invoices, Licenses, Trials, Coupons, Usage, **Entitlements** (inseparable from Subscription).                                                                                           |
| **Notifications** | Email, SMS, Push, In-app, WhatsApp, templates, digests, queues, fan-out. Newsletter folded in initially.                                                                                                      |
| **Compliance**    | DSAR orchestration, consent records, retention runner, legal hold, subprocessor / VPC registry, safeguarding intake, breach-notification workflow. Cross-service coordinator — gets its own deployment + SLA. |

**Deviations from the naive eight-service split, with rationale:**

- **Files/Media folds into Platform**, not its own service. File egress will not
  justify a separate deployment for 12–18 months. Extract when file bandwidth or
  CPU crosses ~30% of Platform's budget.
- **Audit + Activity are shared packages, not services.** Audit is a behaviour
  every service exhibits, not a domain. Each service writes to its own `audits`
  / `activity_log` tables; central compliance querying is a nightly ETL, not a
  synchronous service call.
- **Compliance is elevated to its own service.** DSAR export must query
  Identity, Platform, Billing, Notifications, and every product. A cross-service
  orchestrator cannot live inside any one of the services it coordinates.

### 2.2 Language mix — Laravel platform + Python AI

**All platform services and all product monoliths are Laravel. AI is Python.**
Go is explicitly **not** adopted at this time.

| Layer                                                          | Language     | Runtime                                |
| -------------------------------------------------------------- | ------------ | -------------------------------------- |
| Identity, Platform, Access, Billing, Notifications, Compliance | PHP 8.3+     | Laravel 12 + **Octane (Swoole)**       |
| Sports, Venue, Ticketing, Marketplace, Education               | PHP 8.3+     | Laravel 12                             |
| AI                                                             | Python 3.12+ | FastAPI + PyTorch + OpenCV + LangGraph |

**Products are modular monoliths** — one deployment, one database, ACID
transactions, no internal microservices. Business domains (Athletes →
Performance → Training → AI) are too coupled to split, and business logic
changes constantly; a monolith keeps that change cheap.

**Platform services are separate** because their concerns are stable, cross-
product, and independently scalable. They change slowly and are consumed by
everything.

---

## 3. Rejected options

| Option                                                 | Verdict                  | Why rejected                                                                                                                                                                                                                                                                                                                                     |
| ------------------------------------------------------ | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Go for the platform tier, Laravel for products**     | Rejected (revisit later) | Doubles SDK generation + contract tests; forfeits the shared-package compounding (Foundation + ~30 traits/attributes); splits hiring into two pools; complicates air-gapped on-prem installs with two runtimes; Octane closes ~80% of the throughput gap. No platform service will exceed Octane's ceiling in the next ~24 months at this stage. |
| **Everything a microservice (~30 services)**           | Rejected                 | Operational complexity with no payoff; business domains are coupled.                                                                                                                                                                                                                                                                             |
| **Every product fully isolated (duplicated platform)** | Rejected                 | Duplicated identity/billing/tenancy is the exact anti-pattern this topology exists to avoid.                                                                                                                                                                                                                                                     |
| **Eight platform services** (Files + Audit standalone) | Rejected                 | Files + Audit don't earn a deployment yet; fold them (package/embedded) and extract on real load.                                                                                                                                                                                                                                                |
| **NestJS platform**                                    | Rejected                 | Duplicates Laravel concepts (DI, modules, guards, events, validation) with no architectural gain given existing Laravel investment.                                                                                                                                                                                                              |
| **Python platform**                                    | Rejected                 | Python is reserved for AI/ML/CV workloads; it is not the best fit for identity/billing/authz/API infrastructure.                                                                                                                                                                                                                                 |

**Revisit-Go trigger:** a specific platform service where profiling shows
sustained saturation Octane cannot absorb, _and_ that service is stable enough
that adding a second runtime is cheaper than scaling the current one. Not
expected within 24 months.

---

## 4. How the 23 blueprint modules map to services

Modules are **units of code**; services are **units of deployment**. Multiple
modules cluster into one service. Nothing authored so far is wasted.

| Blueprint module                                                                                  | Lands in                       | Form                                           |
| ------------------------------------------------------------------------------------------------- | ------------------------------ | ---------------------------------------------- |
| `foundation`                                                                                      | all services                   | shared Composer package                        |
| `versioning`, `telemetry`, `audit`, `activity`, `localization`, `geography`, `search`, `transfer` | all services                   | shared Composer packages / infra wrappers      |
| `workspaces`, `settings`, `webhook`, `storage`                                                    | **Platform**                   | modules within the service                     |
| `invitations`                                                                                     | **Access**                     | module within the service                      |
| `entitlements`, `subscription`                                                                    | **Billing**                    | modules within the service                     |
| `notifications`, `notifications-mail/sms/push/in-app`, `newsletter`                               | **Notifications**              | modules within the service                     |
| `compliance`                                                                                      | **Compliance**                 | the service (cross-service orchestrator)       |
| `geofencing`                                                                                      | product-specific (e.g. Sports) | package consumed only by products that need it |

`identity` + `access` blueprint modules (planned, per `hierarchy.md` §12) land
in the **Identity** and **Access** services respectively.

---

## 5. Cross-cutting invariants (non-negotiable)

1. **Zero cross-tenant queries, ever.** Every service enforces `tenant_id` at
   the query-builder layer and fails hard if a tenant-scoped query executes
   without it. This isolation is the property enterprise customers pay a premium
   for.
2. **Every platform service exposes a versioned OpenAPI + a generated PHP SDK.**
   Products consume the SDK, never raw HTTP. Endpoint refactors break consuming
   products at CI time, not in production.
3. **Service-to-service auth is JWT + JWKS.** Identity issues, publishes JWKS;
   every other service verifies signatures locally — no per-request callback to
   Identity. The JWT `app` claim binds a token to one Application; downstream
   services reject mismatched tokens. SPA/mobile clients use Sanctum.
4. **Each service owns its schema.** No shared giant database. Identity DB,
   Platform DB, Billing DB, per-product DBs.
5. **One team owns the platform; one team per product.** The platform team's job
   is to make product teams boring.

---

## 6. Technology stack

| Concern                  | Choice                                                                             |
| ------------------------ | ---------------------------------------------------------------------------------- |
| Framework                | Laravel 12 (all PHP services + products)                                           |
| High-throughput runtime  | Laravel Octane (Swoole) on Identity / Platform / Notifications                     |
| Database                 | PostgreSQL 16, one schema per service                                              |
| Cache / queues / locks   | Redis 7 + Horizon                                                                  |
| Domain events            | **Redis Streams** at MVP; migrate to NATS if fan-out exceeds ~50k events/s         |
| AI                       | Python 3.12 + FastAPI + PyTorch + OpenCV + LangGraph; HTTP/gRPC/events to the rest |
| Gateway / ingress        | Traefik                                                                            |
| Tracing / metrics / logs | OpenTelemetry → Collector → Grafana/Tempo/Prometheus                               |
| Secrets                  | Doppler (SaaS); sealed-secrets / Vault (on-prem)                                   |
| Orchestration            | Kubernetes (SaaS); Docker Compose → Helm (on-prem)                                 |

---

## 7. Deployment modes

- **SaaS (cloud):** all six platform services + selected products + AI on
  Kubernetes. Shared identity + billing + tenancy across every product.
- **White-label:** same code, per-tenant branding + domain + theme resolved by
  Platform; products consume resolved branding.
- **On-premise:** Docker Compose (then Helm chart) with the subset a customer
  needs — e.g. Identity + Platform + one product. Billing may be omitted or
  replaced by a **local licensing** mechanism for customers without central
  billing. No internet dependency.

---

## 8. Phased execution

- **Phase 0 — Foundation (now):** finish the blueprint modules to lock
  contracts; publish `foundation` + `audit` + `activity` + `versioning` +
  `telemetry` as internal Composer packages.
- **Phase 1 (M1–3):** Identity + Platform services (Storage folded into
  Platform).
- **Phase 2 (M3–5):** Access + Billing services.
- **Phase 3 (M5–8):** Sports product end-to-end — validates the boundary
  contracts one product deep.
- **Phase 4 (M8–10):** second product (proves reusability — the biggest
  architectural risk); extract Notifications if traffic warrants.
- **Phase 5 (M10–14):** Compliance service + AI service.
- **Phase 6 (M14–20):** remaining products + on-prem packaging.

---

## 9. Open decisions (require explicit sign-off — NOT actioned by this record)

1. **Naming & namespace: `Stackra` → `Figentra`.** The company/platform is
   Figentra Tech LLC; "Stackra" reads as the Sports/Education product
   lineage. The entire current codebase is `Stackra\` namespaced (repo
   `stackra-frontend`, 23 modules, all traits/attributes). Renaming is a
   large, deliberate migration — it is **out of scope for this decision** and
   must be sequenced as its own migration with a rename plan + codemod, not done
   opportunistically. Until then, code stays `Stackra\`.
2. **Newsletter extraction trigger.** Starts inside Notifications; extract to
   its own service only if newsletter send volume dominates the notification
   queue.
3. **Storage extraction trigger.** Starts inside Platform; extract when file
   bandwidth/CPU crosses ~30% of Platform's budget.
4. **Event bus upgrade trigger.** Redis Streams → NATS at ~50k events/s
   sustained fan-out.

---

## 10. Consequences

**Positive:**

- One language for platform + products → one CI/CD shape, shared packages,
  shared SDK generation, one hiring pool, fastest path to a five-product
  portfolio.
- Clear service boundaries deliver the real architectural win (shared identity /
  billing / tenancy, independent product release cycles) without a runtime fork.
- Blueprint modules already authored map cleanly onto services — no wasted work.
- On-prem stays tractable: one runtime (PHP) + one AI runtime (Python).

**Negative / accepted trade-offs:**

- PHP/Octane uses more memory than Go for stateless CPU-bound work — accepted;
  re-evaluate per-service if profiling demands it.
- Twelve deployments at MVP (6 platform + 5 products + AI) is real operational
  surface — mitigated by identical service shape + shared packages + one team
  owning the platform.
- Redis Streams is a starting point, not the end state for eventing — accepted
  with a defined upgrade trigger.

---

## 11. Related

- `.kiro/specs/module-blueprints/PLAN.md` — the blueprint contract every module
  follows (Phase 0 output).
- `.kiro/steering/hierarchy.md` — platform tree + tier boundaries + service
  split (§12).
- `.kiro/steering/tenancy-columns.md` — the `tenant_id` isolation invariant
  (§5).
- `.kiro/steering/module-graph.md` — module dependency + boot-order invariants.
