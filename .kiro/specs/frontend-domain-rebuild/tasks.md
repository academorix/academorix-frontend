# Frontend Domain Rebuild — Tasks

Dependency-ordered, grouped by the blueprint's build waves. Each wave ends with
all gates green (build, lint, knip, format, test, size) and a conventional
commit. Requirement references point to `requirements.md`.

## Wave 0 — Foundations

- [ ] 1. Reorganize types into `src/types/` folders (platform, access, people,
      structure, scheduling, development, commerce, attributes, api, enums) and
      re-export from `index.ts`; migrate existing imports. _(R1, R6)_
- [ ] 2. Expand `enums.ts` with all blueprint enums + `*_LABELS` (event/match
      status, RSVP, invoice/payment status, staff employment/status, season
      status, scoring types, capability keys, etc.). _(R1)_
- [ ] 3. Model the hierarchy types: `Tenant`, `Region`, `Organization`,
      `Branch`, `Season`, plus `AllowedScopes` and expanded `Identity` (tenants,
      scopes). _(R1, R2, R4)_
- [ ] 4. Build `src/lib/scope/` — types, `scope-storage`, `scope-context` +
      `ScopeProvider` (persist/validate/default), `use-scope`, `use-tenant`,
      barrel. _(R2)_
- [ ] 5. Build `providers/data/scope-filter.ts` (get/set active scope) and wire
      scope filters into REST + mock `getList` for a resource's `scopedBy`
      dimensions; add `scopedBy` to `AppResourceMeta`. _(R2, R3)_
- [ ] 6. Build `src/components/scope/` switchers (tenant/org/branch/season) and
      mount them in `authenticated-layout`; wrap the protected area with
      `ScopeProvider` in `App.tsx`. _(R2, R9)_
- [ ] 7. Build `src/lib/attributes/` — types, `use-attribute-set`,
      `attribute-field`, `attribute-form`, `attribute-view`, barrel. _(R5)_
- [ ] 8. Expand `me.json` with `features`, `terminology`, `tenants`, `scopes`;
      update `Identity` + `map-identity.ts`. _(R4)_
- [ ] 9. Remove legacy `courses` module + fixture + type refs; `git mv` sports
      dirs into `modules/sports/{athletes,teams}` and `modules/sports/coaching`;
      keep `modules/branches` (platform). Fix imports. _(R8)_
- [ ] 10. Platform modules: `tenancy` (context only), `organization` (L/S +
      switcher source), `branches` (L/C/E/S), `regions` (L/S). Fixtures:
      `organizations.json`, `branches.json`, `regions.json`. _(R1, R6, R7)_
- [ ] 11. Sport `registry` module: `sports` (L/S) + `tenant-sports` overlay;
      fixtures `sports.json`, `tenant-sports.json`, and `attribute-sets.json`
      (athlete enrollment sets for ≥2 sports). _(R1, R5, R7)_
- [ ] 12. `attributes` admin module (list/show of sets) + `documents` /
      `notifications` placeholders. _(R5, R6)_
- [ ] 13. Update steering (scope layer, sports sub-domain layout,
      attributes/SDUI, module map); run all gates; commit Wave 0. _(R8, R10)_

## Wave 1 — Structure, acquisition, money, people

- [ ] 14. `sports/seasons` — L/C/E/S + `SeasonSwitcher` data source;
      `seasons.json`. _(R1, R2)_
- [ ] 15. `sports/athletes` — L/C/E/S with typed identity + **SDUI enrollment**
      block (attribute set by `sport_key`); guardians/documents sections;
      `athletes.json`, `athlete-enrollments.json`. _(R1, R5)_
- [ ] 16. `sports/teams` — L/C/E/S + roster/members; `teams.json`,
      `team-members.json`. _(R1)_
- [ ] 17. `sports/registrations` — funnel L/S; `registrations.json`. _(R1)_
- [ ] 18. `sports/events` — L/C/E/S + RSVP surface; `events.json`,
      `event-invitations.json`. _(R1)_
- [ ] 19. `payments` — invoices L/S + refund action; `invoices.json`,
      `payments.json`. `memberships` — L/C/E/S; `memberships.json`. _(R1)_
- [ ] 20. `staff` — L/C/E/S (employment/pay/docs); `staff.json`. `users` —
      L/C/E/S; `users.json`. `access` — roles/permissions L/S; `roles.json`,
      `permissions.json`. _(R1, R4)_
- [ ] 21. `reception` (approval queue), `admin` shell, `billing` subscription
      view, `people` placeholder, `facilities` (feature-flagged). Fixtures as
      listed in design §2. _(R1, R6)_
- [ ] 22. Run all gates; commit Wave 1.

## Wave 2 — Activities, participation, cost, check-in

- [ ] 23. `sports/coaching` (`coaches`, view over staff) — L/S;
      `coach-assignments.json`. _(R1)_
- [ ] 24. `sports/training`, `sports/matches`, `sports/sessions` — L/C/E/S;
      fixtures per design. _(R1)_
- [ ] 25. `sports/attendance` — capture surface (event/session pre-fill);
      `attendance.json`. _(R1)_
- [ ] 26. `sports/progress` — skill cards with **SDUI** + belt/grading;
      `progress.json`, progress attribute sets. _(R5)_
- [ ] 27. `expenses` (receipts/recurring/payroll) — L/C/E/S; `credentials`
      (NFC/RFID) — L/S. Fixtures per design. _(R1)_
- [ ] 28. `announcements` — L/C/E/S; `messaging` — thread surface. _(R1)_
- [ ] 29. Run all gates; commit Wave 2.

## Wave 3 — Development, competition, content, compliance, AI

- [ ] 30. `sports/performance` (SDUI tests), `sports/medical` (restricted),
      `sports/development`, `sports/drills`. _(R1, R5)_
- [ ] 31. `sports/competition` (team + individual standings),
      `sports/formations` (builder), `sports/safeguarding`. _(R1)_
- [ ] 32. `reports` (dashboards), `leads` (CRM pipeline), `ai` (flagged
      placeholder). _(R1)_
- [ ] 33. Run all gates; commit Wave 3.

## Wave 4 — Reach & polish

- [ ] 34. `integrations` (webhooks/connectors), offline-sync affordances,
      `passes`, `awards`, `public-site` CMS. _(R1)_
- [ ] 35. i18n groundwork (en/ar + RTL) via a Refine `i18nProvider` and
      terminology; final gates; commit Wave 4.

## Cross-cutting (every task)

- Compose the `@/components/refine` kit + Refine headless hooks; no bespoke
  table or action-bar plumbing. _(R6)_
- Create/edit share one controlled form per resource in the module's
  `components/`. _(R6)_
- Fixtures: pure snake_case record arrays, FK-consistent, scope columns aligned
  to `me.json`; no embedded `meta`. _(R7)_
- Docblocks on every file/type/symbol/provider/hook; inline comments for
  non-obvious logic. _(R6)_
- Keep authz/features/terminology data-driven from `/auth/me`. _(R4)_
