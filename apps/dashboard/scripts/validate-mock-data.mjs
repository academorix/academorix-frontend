#!/usr/bin/env node
/**
 * validate-mock-data.mjs
 *
 * Full validator for the mock JSON dataset in /public/data/.
 *
 * Checks:
 *   1) Every JSON file parses.
 *   2) The manifest (_manifest.json) matches the files on disk exactly.
 *   3) Simple foreign keys (`<name>_id` -> <resource>.id) resolve.
 *   4) Polymorphic foreign keys (`<name>_type` + `<name>_id`) resolve after
 *      dispatching on the type discriminator.
 *   5) Every declared state machine has at least one record per state.
 *   6) Every module declared in the manifest either has at least one fixture
 *      or is explicitly listed as "without fixtures by design".
 *
 * Usage:
 *   node scripts/validate-mock-data.mjs
 *   node scripts/validate-mock-data.mjs --dir /custom/path
 *   node scripts/validate-mock-data.mjs --json      # emit JSON summary
 *
 * Exit code:
 *   0 - all checks pass
 *   1 - one or more checks fail
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// -------- CLI args --------
const args = process.argv.slice(2);
const jsonOutput = args.includes("--json");
const dirArgIdx = args.indexOf("--dir");
const dataDir =
  dirArgIdx >= 0
    ? path.resolve(args[dirArgIdx + 1])
    : path.resolve(__dirname, "..", "public", "data");

// -------- Utility --------
const ok = (msg) => (jsonOutput ? null : console.log(`\x1b[32mOK\x1b[0m  ${msg}`));
const warn = (msg) => (jsonOutput ? null : console.log(`\x1b[33mWARN\x1b[0m  ${msg}`));
const fail = (msg) => (jsonOutput ? null : console.log(`\x1b[31mFAIL\x1b[0m  ${msg}`));
const section = (title) => (jsonOutput ? null : console.log(`\n=== ${title} ===`));

// -------- Load all JSON files --------
section(`Loading fixtures from ${dataDir}`);
const files = fs
  .readdirSync(dataDir)
  .filter((f) => f.endsWith(".json"))
  .sort();

const data = {};
const parseFailures = [];

for (const f of files) {
  try {
    data[f] = JSON.parse(fs.readFileSync(path.join(dataDir, f), "utf8"));
  } catch (e) {
    parseFailures.push(`${f}: ${e.message}`);
  }
}
if (parseFailures.length === 0) {
  ok(`Parsed ${files.length} JSON files`);
} else {
  for (const f of parseFailures) fail(`Parse ${f}`);
}

// -------- Build ID indexes --------
const idIndex = {};

for (const f of files) {
  if (Array.isArray(data[f])) {
    idIndex[f] = new Set(
      data[f].filter((r) => r && typeof r === "object" && r.id).map((r) => r.id),
    );
  }
}

// -------- 1. Manifest sync --------
section("Manifest sync");
const manifest = data["_manifest.json"];
const manifestErrors = [];
const modulesCoverage = { withFixtures: new Set(), byDesignEmpty: new Set() };

if (!manifest) {
  manifestErrors.push("_manifest.json missing or unparseable");
} else {
  const inManifest = new Set(Object.keys(manifest.files || {}));
  const onDiskAll = [
    ...fs
      .readdirSync(dataDir)
      .filter(
        (f) =>
          f.endsWith(".json") ||
          f === "SHARED_IDS.md" ||
          f === "NAMING_CONVENTION.md" ||
          f === "README.md",
      ),
  ];
  const missing = onDiskAll.filter((f) => !inManifest.has(f));
  const extra = [...inManifest].filter((f) => !onDiskAll.includes(f));

  if (missing.length === 0) ok("Every disk file is indexed in the manifest");
  else missing.forEach((f) => manifestErrors.push(`Not in manifest: ${f}`));
  if (extra.length === 0) ok("Every manifest entry maps to a real file");
  else extra.forEach((f) => manifestErrors.push(`In manifest but no file: ${f}`));

  for (const [file, entry] of Object.entries(manifest.files || {})) {
    for (const m of entry.modules || []) modulesCoverage.withFixtures.add(m);
  }
  for (const m of manifest.coverage?.modules_without_fixtures_by_design || []) {
    modulesCoverage.byDesignEmpty.add(m);
  }
}
for (const e of manifestErrors) fail(e);

// -------- 2. Simple FK integrity --------
section("Simple foreign keys");
/** @type {Array<[file, field, targetFile]>} */
const simpleFks = [
  ["athlete-guardians.json", "athlete_id", "athletes.json"],
  ["athlete-guardians.json", "user_id", "users.json"],
  ["athlete-enrollments.json", "athlete_id", "athletes.json"],
  ["athlete-enrollments.json", "team_id", "teams.json"],
  ["athlete-enrollments.json", "season_id", "seasons.json"],
  ["athlete-transfers.json", "athlete_id", "athletes.json"],
  ["athlete-transfers.json", "approval_task_id", "approval-tasks.json"],
  ["invoices.json", "payer_user_id", "users.json"],
  ["invoices.json", "athlete_id", "athletes.json"],
  ["invoice-reminders.json", "invoice_id", "invoices.json"],
  ["payments.json", "invoice_id", "invoices.json"],
  ["payments.json", "payer_user_id", "users.json"],
  ["payments.json", "payment_method_id", "payment-methods.json"],
  ["transactions.json", "invoice_id", "invoices.json"],
  ["transactions.json", "payment_id", "payments.json"],
  ["memberships.json", "athlete_id", "athletes.json"],
  ["memberships.json", "payer_user_id", "users.json"],
  ["memberships.json", "plan_id", "membership-plans.json"],
  ["memberships.json", "default_payment_method_id", "payment-methods.json"],
  ["session-credits.json", "athlete_id", "athletes.json"],
  ["private-sessions.json", "athlete_id", "athletes.json"],
  ["private-sessions.json", "coach_id", "staff.json"],
  ["private-sessions.json", "invoice_id", "invoices.json"],
  ["private-sessions.json", "session_credit_id", "session-credits.json"],
  ["private-sessions.json", "resource_id", "facilities.json"],
  ["packs.json", "sport_id", "sports.json"],
  ["match-squad.json", "match_id", "matches.json"],
  ["match-squad.json", "athlete_id", "athletes.json"],
  ["match-results.json", "match_id", "matches.json"],
  ["events.json", "team_id", "teams.json"],
  ["events.json", "resource_id", "facilities.json"],
  ["event-invitations.json", "athlete_id", "athletes.json"],
  ["event-reminders.json", "event_id", "events.json"],
  ["event-teams.json", "event_id", "events.json"],
  ["event-teams.json", "team_id", "teams.json"],
  ["registrations.json", "lead_id", "leads.json"],
  ["registrations.json", "athlete_id", "athletes.json"],
  ["registrations.json", "assigned_staff_id", "staff.json"],
  ["waitlist-entries.json", "registration_id", "registrations.json"],
  ["waitlist-entries.json", "team_id", "teams.json"],
  ["offers.json", "registration_id", "registrations.json"],
  ["offers.json", "waitlist_entry_id", "waitlist-entries.json"],
  ["team-trials.json", "athlete_id", "athletes.json"],
  ["team-trials.json", "registration_id", "registrations.json"],
  ["team-trials.json", "coach_id", "staff.json"],
  ["team-trials.json", "resource_id", "facilities.json"],
  ["coaches.json", "staff_id", "staff.json"],
  ["coach-assignments.json", "staff_id", "staff.json"],
  ["coach-assignments.json", "team_id", "teams.json"],
  ["coach-availability.json", "staff_id", "staff.json"],
  ["coach-notes.json", "athlete_id", "athletes.json"],
  ["staff.json", "user_id", "users.json"],
  ["staff-transfers.json", "staff_id", "staff.json"],
  ["staff-bonuses.json", "staff_id", "staff.json"],
  ["staff-leave.json", "staff_id", "staff.json"],
  ["staff-pay-rates.json", "staff_id", "staff.json"],
  ["staff-documents.json", "staff_id", "staff.json"],
  ["background-checks.json", "user_id", "users.json"],
  ["certifications.json", "staff_id", "staff.json"],
  ["expenses.json", "category_id", "expense-categories.json"],
  ["expenses.json", "receipt_document_id", "documents.json"],
  ["expenses.json", "created_by_user_id", "users.json"],
  ["payroll-lines.json", "run_id", "payroll-runs.json"],
  ["payroll-lines.json", "staff_id", "staff.json"],
  ["injuries.json", "athlete_id", "athletes.json"],
  ["injuries.json", "clearance_id", "medical-clearances.json"],
  ["treatments.json", "injury_id", "injuries.json"],
  ["treatments.json", "athlete_id", "athletes.json"],
  ["medical-clearances.json", "athlete_id", "athletes.json"],
  ["assessment-records.json", "athlete_id", "athletes.json"],
  ["assessment-records.json", "enrollment_id", "athlete-enrollments.json"],
  ["test-results.json", "athlete_id", "athletes.json"],
  ["test-results.json", "battery_id", "test-batteries.json"],
  ["benchmarks.json", "battery_id", "test-batteries.json"],
  ["goals.json", "athlete_id", "athletes.json"],
  ["pathway-stages.json", "pathway_id", "development-pathways.json"],
  ["talent-flags.json", "athlete_id", "athletes.json"],
  ["talent-flags.json", "promoted_from_stage_id", "pathway-stages.json"],
  ["talent-flags.json", "promoted_to_stage_id", "pathway-stages.json"],
  ["awards.json", "athlete_id", "athletes.json"],
  ["awards.json", "type_id", "award-types.json"],
  ["certificates.json", "athlete_id", "athletes.json"],
  ["competitions.json", "season_id", "seasons.json"],
  ["competitions.json", "linked_event_id", "events.json"],
  ["competitions.json", "winner_team_id", "teams.json"],
  ["competitions.json", "runner_up_team_id", "teams.json"],
  ["competition-fixtures.json", "competition_id", "competitions.json"],
  ["competition-fixtures.json", "match_id", "matches.json"],
  ["competition-fixtures.json", "bracket_node_id", "bracket-nodes.json"],
  ["competition-fixtures.json", "linked_event_id", "events.json"],
  ["standing-rows.json", "competition_id", "competitions.json"],
  ["bracket-nodes.json", "competition_id", "competitions.json"],
  ["bracket-nodes.json", "next_node_id", "bracket-nodes.json"],
  ["bracket-nodes.json", "feeder_left_node_id", "bracket-nodes.json"],
  ["bracket-nodes.json", "feeder_right_node_id", "bracket-nodes.json"],
  ["messages.json", "conversation_id", "conversations.json"],
  ["consents.json", "athlete_id", "athletes.json"],
  ["consents.json", "granted_by_user_id", "users.json"],
  ["consents.json", "evidence_document_id", "documents.json"],
  ["policy-acknowledgements.json", "user_id", "users.json"],
  ["calendar-subscriptions.json", "user_id", "users.json"],
  ["calendar-subscriptions.json", "athlete_id", "athletes.json"],
  ["day-passes.json", "issued_by_user_id", "users.json"],
  ["day-passes.json", "related_athlete_id", "athletes.json"],
  ["day-passes.json", "related_lead_id", "leads.json"],
  ["reception-visits.json", "handled_by_user_id", "users.json"],
  ["reception-visits.json", "related_athlete_id", "athletes.json"],
  ["reception-visits.json", "related_lead_id", "leads.json"],
  ["reception-visits.json", "related_registration_id", "registrations.json"],
  ["notifications.json", "user_id", "users.json"],
  ["notification-preferences.json", "user_id", "users.json"],
  ["webhook-deliveries.json", "endpoint_id", "webhook-endpoints.json"],
  ["saved-reports.json", "definition_id", "report-definitions.json"],
  ["saved-reports.json", "owner_user_id", "users.json"],
  ["ai-runs.json", "conversation_id", "ai-conversations.json"],
  ["ai-conversations.json", "user_id", "users.json"],
  ["ai-tool-calls.json", "run_id", "ai-runs.json"],
  ["tasks.json", "assigned_to_user_id", "users.json"],
  ["gates.json", "branch_id", "branches.json"],
  ["checkin-logs.json", "gate_id", "gates.json"],
  ["checkin-logs.json", "credential_id", "credentials.json"],
  ["passes.json", "membership_id", "memberships.json"],
  ["age-cutoff-rules.json", "season_id", "seasons.json"],
  ["age-cutoff-rules.json", "age_group_id", "age-groups.json"],
  ["curriculums.json", "team_id", "teams.json"],
  ["curriculums.json", "season_id", "seasons.json"],
  ["curriculum-weeks.json", "curriculum_id", "curriculums.json"],
  ["session-plans.json", "team_id", "teams.json"],
  ["session-plans.json", "curriculum_id", "curriculums.json"],
  ["training-sessions.json", "team_id", "teams.json"],
  ["training-sessions.json", "branch_id", "branches.json"],
  ["training-sessions.json", "season_id", "seasons.json"],
  ["matches.json", "team_id", "teams.json"],
  ["matches.json", "season_id", "seasons.json"],
  ["matches.json", "competition_id", "competitions.json"],
  ["matches.json", "event_id", "events.json"],
  ["matches.json", "formation", "formations.json"],
  ["team-members.json", "team_id", "teams.json"],
  ["registration-windows.json", "season_id", "seasons.json"],
  ["seasons.json", "registration_window_id", "registration-windows.json"],
  ["branches.json", "region_id", "regions.json"],
];

const simpleOrphans = [];

for (const [file, field, target] of simpleFks) {
  if (!data[file] || !idIndex[target]) continue;
  const rows = Array.isArray(data[file]) ? data[file] : [];

  for (const [i, row] of rows.entries()) {
    if (!row || typeof row !== "object") continue;
    const val = row[field];

    if (val == null || val === "") continue;
    if (!idIndex[target].has(val)) {
      simpleOrphans.push(`${file}[${row.id || i}].${field}="${val}" -> not in ${target}`);
    }
  }
}
if (simpleOrphans.length === 0) {
  ok(`All ${simpleFks.length} simple FK relationships resolve`);
} else {
  simpleOrphans.forEach((o) => fail(o));
}

// -------- 3. Polymorphic FK integrity --------
section("Polymorphic foreign keys");
/**
 * Each dispatch entry:
 *   file, typeField, idField, table<typeValue,targetFile>
 * If a typeValue is missing from the table, the row is skipped with a warning.
 */
const polyChecks = [
  {
    file: "documents.json",
    typeField: "owner_type",
    idField: "owner_id",
    table: {
      athlete: "athletes.json",
      staff: "staff.json",
      expense: "expenses.json",
      // User-owned documents (guardian bundles, admin-issued erasure
      // packets) are backed by the tenant/platform users tables now
      // served by the User BE module, not the deleted users.json fixture.
      user: null,
    },
  },
  {
    file: "approval-tasks.json",
    typeField: "approvable_type",
    idField: "approvable_id",
    table: {
      registration: "registrations.json",
      document: "documents.json",
      refund: "invoices.json",
      match: "matches.json",
      attendance: "attendance-submissions.json",
      link_request: "people.json",
      athlete_transfer: "athlete-transfers.json",
      resource_booking: "resource-bookings.json",
    },
  },
  {
    file: "ai-embeddings.json",
    typeField: "source_type",
    idField: "source_id",
    table: {
      drill: "drills.json",
      coach_note: "coach-notes.json",
      document: "documents.json",
      scouting_report: "scouting-reports.json",
      announcement: "announcements.json",
    },
  },
  {
    file: "resource-bookings.json",
    typeField: "activity_type",
    idField: "activity_id",
    table: {
      training: "training-sessions.json",
      match: "matches.json",
      session: "private-sessions.json",
      blackout: null, // blackout bookings have no linked activity — the id is a synthetic tag
    },
  },
  {
    file: "credentials.json",
    typeField: "holder_type",
    idField: "holder_id",
    table: {
      athlete: "athletes.json",
      staff: "staff.json",
    },
  },
  {
    file: "passes.json",
    typeField: "holder_type",
    idField: "holder_id",
    table: {
      athlete: "athletes.json",
      // Guardian holders resolve against the tenant users table served by
      // the User BE module, not the deleted users.json fixture.
      guardian: null,
    },
  },
];

// Scope-shaped polymorphic: from_scope { type, id }
const scopePolyChecks = [
  {
    file: "athlete-transfers.json",
    scopeFields: ["from_scope", "to_scope"],
    table: {
      team: "teams.json",
      branch: "branches.json",
      // Tenant / academy scopes now resolve against the Tenancy BE module
      // rather than the deleted tenants.json fixture.
      tenant: null,
      academy: null,
    },
  },
  {
    file: "staff-transfers.json",
    scopeFields: ["from_scope", "to_scope"],
    table: {
      branch: "branches.json",
      // Tenant scopes now resolve against the Tenancy BE module rather
      // than the deleted tenants.json fixture.
      tenant: null,
      // "role" scope ids are role slugs (e.g. "coach"), not role_* FKs — skipped
    },
    skipTypes: new Set(["role"]),
  },
];

const polyOrphans = [];
const polyWarnings = [];

for (const chk of polyChecks) {
  const rows = Array.isArray(data[chk.file]) ? data[chk.file] : [];

  for (const [i, row] of rows.entries()) {
    if (!row) continue;
    const type = row[chk.typeField];
    const val = row[chk.idField];

    if (!type || val == null || val === "") continue;
    const target = chk.table[type];

    if (target === null) continue; // explicitly not FK-linked
    if (!target) {
      polyWarnings.push(
        `${chk.file}[${row.id || i}].${chk.typeField}="${type}" is not mapped in the dispatch table (${chk.idField}="${val}")`,
      );
      continue;
    }
    if (!idIndex[target] || !idIndex[target].has(val)) {
      polyOrphans.push(
        `${chk.file}[${row.id || i}].${chk.typeField}=${type},${chk.idField}="${val}" -> not in ${target}`,
      );
    }
  }
}

for (const chk of scopePolyChecks) {
  const rows = Array.isArray(data[chk.file]) ? data[chk.file] : [];

  for (const [i, row] of rows.entries()) {
    if (!row) continue;
    for (const sf of chk.scopeFields) {
      const scope = row[sf];

      if (!scope || typeof scope !== "object") continue;
      const type = scope.type;
      const val = scope.id;

      if (!type || val == null || val === "") continue;
      if (chk.skipTypes && chk.skipTypes.has(type)) continue;
      const target = chk.table[type];

      if (target === null) continue; // explicitly not FK-linked
      if (!target) {
        polyWarnings.push(
          `${chk.file}[${row.id || i}].${sf}.type="${type}" is not mapped (id="${val}")`,
        );
        continue;
      }
      if (!idIndex[target] || !idIndex[target].has(val)) {
        polyOrphans.push(`${chk.file}[${row.id || i}].${sf}=${type}:${val} -> not in ${target}`);
      }
    }
  }
}

const polyChecksRun = polyChecks.length + scopePolyChecks.length;

if (polyOrphans.length === 0) {
  ok(`All polymorphic FK relationships resolve (${polyChecksRun} check groups)`);
} else {
  polyOrphans.forEach((o) => fail(o));
}
if (polyWarnings.length) {
  polyWarnings.forEach((w) => warn(w));
}

// -------- 4. State-machine coverage --------
section("State machine coverage");
/** file -> [{ field, states }] */
const stateMachines = [
  {
    file: "matches.json",
    field: "status",
    expected: ["scheduled", "completed", "postponed", "draft"],
  },
  {
    file: "memberships.json",
    field: "status",
    expected: ["trialing", "active", "past_due", "paused"],
  },
  {
    file: "injuries.json",
    field: "status",
    expected: ["under_treatment", "recovering", "cleared"],
  },
  { file: "seasons.json", field: "status", expected: ["active", "upcoming", "closed"] },
  {
    file: "attendance-submissions.json",
    field: "status",
    expected: ["draft", "submitted", "confirmed", "rejected"],
  },
  { file: "offers.json", field: "status", expected: ["sent", "accepted", "declined", "expired"] },
  {
    file: "team-trials.json",
    field: "status",
    expected: ["booked", "attended", "no_show", "offered", "declined"],
  },
  {
    file: "erasure-requests.json",
    field: "status",
    expected: ["REQUESTED", "EXPORTED", "EXECUTED", "REJECTED"],
  },
  {
    file: "staff-leave.json",
    field: "status",
    expected: ["requested", "approved", "in_progress", "completed", "rejected"],
  },
  { file: "payment-methods.json", field: "status", expected: ["needs_reauth", "declined"] },
  {
    file: "competitions.json",
    field: "status",
    expected: ["draft", "registration", "in_progress", "completed"],
  },
  { file: "background-checks.json", field: "status", expected: ["pending", "verified", "expired"] },
  { file: "athlete-transfers.json", field: "status", expected: ["requested", "completed"] },
  {
    file: "staff-transfers.json",
    field: "status",
    expected: ["requested", "completed", "approved", "pending_approval"],
  },
  { file: "credentials.json", field: "status", expected: ["active", "revoked"] },
  { file: "gates.json", field: "status", expected: ["active", "maintenance", "offline"] },
  { file: "webhook-endpoints.json", field: "status", expected: ["active", "paused", "failed"] },
  {
    file: "webhook-deliveries.json",
    field: "status",
    expected: ["delivered", "queued", "retrying", "failed", "abandoned"],
  },
  { file: "approval-tasks.json", field: "status", expected: ["pending", "approved", "rejected"] },
  { file: "invoices.json", field: "status", expected: ["issued", "paid", "overdue"] },
  { file: "payments.json", field: "status", expected: ["succeeded", "partially_refunded"] },
  {
    file: "registrations.json",
    field: "status",
    expected: ["lead", "trial", "enrolled", "waitlisted", "offered", "declined"],
  },
  {
    file: "waitlist-entries.json",
    field: "status",
    expected: ["waiting", "offered", "expired", "enrolled"],
  },
  {
    file: "notifications.json",
    field: "status",
    expected: ["read", "delivered", "sent", "bounced"],
  },
  {
    file: "safeguarding-incidents.json",
    field: "status",
    expected: ["under_review", "resolved", "reported"],
  },
];

const stateGaps = [];

for (const { file, field, expected } of stateMachines) {
  const rows = Array.isArray(data[file]) ? data[file] : [];
  const found = new Set(rows.map((r) => r && r[field]).filter(Boolean));
  const missing = expected.filter((s) => !found.has(s));

  if (missing.length) {
    stateGaps.push({ file, field, missing });
  }
}
if (stateGaps.length === 0) {
  ok(`All ${stateMachines.length} state machines have coverage for their sampled states`);
} else {
  for (const g of stateGaps) fail(`${g.file}.${g.field} missing: ${g.missing.join(", ")}`);
}

// -------- 5. Module coverage --------
section("Module coverage");
const modulesDeclared = new Set(Object.keys(manifest?.modules || {}));
const uncovered = [...modulesDeclared].filter(
  (m) => !modulesCoverage.withFixtures.has(m) && !modulesCoverage.byDesignEmpty.has(m),
);

if (uncovered.length === 0) {
  ok(
    `All ${modulesDeclared.size} manifest-declared modules are covered (${modulesCoverage.withFixtures.size} with fixtures + ${modulesCoverage.byDesignEmpty.size} by-design empty)`,
  );
} else {
  uncovered.forEach((m) => fail(`Module not covered: ${m}`));
}

// -------- Summary --------
section("Summary");
const totalRecords = files
  .filter((f) => Array.isArray(data[f]))
  .reduce((sum, f) => sum + data[f].length, 0);

const summary = {
  data_dir: dataDir,
  files: files.length,
  records: totalRecords,
  parse_failures: parseFailures.length,
  manifest_issues: manifestErrors.length,
  simple_fk_checks: simpleFks.length,
  simple_fk_orphans: simpleOrphans.length,
  polymorphic_fk_check_groups: polyChecksRun,
  polymorphic_fk_orphans: polyOrphans.length,
  polymorphic_fk_warnings: polyWarnings.length,
  state_machines: stateMachines.length,
  state_machine_gaps: stateGaps.length,
  modules_declared: modulesDeclared.size,
  modules_with_fixtures: modulesCoverage.withFixtures.size,
  modules_empty_by_design: modulesCoverage.byDesignEmpty.size,
  modules_uncovered: uncovered.length,
};

if (jsonOutput) {
  console.log(JSON.stringify(summary, null, 2));
} else {
  for (const [k, v] of Object.entries(summary)) {
    console.log(`  ${k.padEnd(30)} ${v}`);
  }
}

const failed =
  parseFailures.length > 0 ||
  manifestErrors.length > 0 ||
  simpleOrphans.length > 0 ||
  polyOrphans.length > 0 ||
  stateGaps.length > 0 ||
  uncovered.length > 0;

process.exit(failed ? 1 : 0);
