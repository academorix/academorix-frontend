#!/usr/bin/env python3
"""
E9 — Emit 11 drop-application_id migrations per ADR-0031 §D3.

Each migration lives inside the row's owning package. Every migration:
  * Uses `2026_07_22_...` timestamps (after the base migrations at
    `2026_07_15_...` which added application_id).
  * Ships an explicit `up()` that drops the column + rewrites any composite
    unique index that referenced it.
  * Ships an explicit `down()` that reverses `up()` for reversibility.
  * Carries a full file-level docblock + per-step inline comments per
    `.kiro/steering/docblocks.md`.

Also strips `ATTR_APPLICATION_ID` from the row's `<Row>Interface.php`
constant list — the interface is the schema contract; a dropped column stays
dropped from the interface too.

## Two composite-index rewrites (ADR-0031 §D3 rows 9 + 11)

Row 9 — `push_subscriptions`:
  BEFORE: UNIQUE(user_id, application_id, device_token_fingerprint)
  AFTER : UNIQUE(user_id, device_token_fingerprint)

Row 11 — `approval_templates`:
  BEFORE: UNIQUE(tenant_id, application_id, action_key, name, version)  [soft-delete-aware]
          UNIQUE(tenant_id, application_id, action_key, name)           [+ is_active=true partial]
  AFTER : UNIQUE(tenant_id, action_key, name, version)                  [soft-delete-aware]
          UNIQUE(tenant_id, action_key, name)                           [+ is_active=true partial]

Both index rewrites happen inside the same migration as the column drop —
the DB won't drop a column referenced by an index otherwise.

## No approval_instances

ADR-0031 §D3 does NOT list `approval_instances` in the 11-row drop set even
though its interface carries `ATTR_APPLICATION_ID`. Leave it alone here; it
is either a separate audit finding OR an intentional carry belonging to a
different pattern.
"""

from __future__ import annotations

import re
import sys
from pathlib import Path
from textwrap import dedent
from typing import Any

WORKSPACE = Path("/Users/akouta/Projects/academorix-frontend")


# ---------------------------------------------------------------------------
# Row targets — every row on ADR-0031 §D3.
#
# Each entry declares:
#   * `table`                — the physical table name
#   * `package_dir`          — location under packages/backend/
#   * `interface_file`       — the <Row>Interface.php whose ATTR_APPLICATION_ID
#                              constant must go
#   * `timestamp`            — the migration filename timestamp prefix
#   * `slug`                 — the migration filename slug
#   * `composite_rewrite`    — None OR a dict describing the composite unique
#                              index(es) that need to be dropped + recreated
#                              inside the same migration
# ---------------------------------------------------------------------------


ROW_TARGETS: list[dict[str, Any]] = [
    # ── access ─────────────────────────────────────────────────────────
    {
        "table": "role_delegations",
        "package_dir": "packages/backend/access/delegation",
        "interface_file": "src/Contracts/Data/RoleDelegationInterface.php",
        "timestamp": "2026_07_22_000000",
        "slug": "drop_application_id_from_role_delegations_table",
        "composite_rewrite": None,
    },
    {
        "table": "invitations",
        "package_dir": "packages/backend/access/invitations",
        "interface_file": "src/Contracts/Data/InvitationInterface.php",
        "timestamp": "2026_07_22_000000",
        "slug": "drop_application_id_from_invitations_table",
        "composite_rewrite": None,
    },
    {
        "table": "invitation_events",
        "package_dir": "packages/backend/access/invitations",
        "interface_file": "src/Contracts/Data/InvitationEventInterface.php",
        "timestamp": "2026_07_22_000001",
        "slug": "drop_application_id_from_invitation_events_table",
        "composite_rewrite": None,
    },
    {
        "table": "model_has_permissions",
        "package_dir": "packages/backend/access/rbac",
        "interface_file": "src/Contracts/Data/ModelHasPermissionsInterface.php",
        "timestamp": "2026_07_22_000000",
        "slug": "drop_application_id_from_model_has_permissions_table",
        "composite_rewrite": None,
    },
    {
        "table": "model_has_roles",
        "package_dir": "packages/backend/access/rbac",
        "interface_file": "src/Contracts/Data/ModelHasRolesInterface.php",
        "timestamp": "2026_07_22_000001",
        "slug": "drop_application_id_from_model_has_roles_table",
        "composite_rewrite": None,
    },
    {
        "table": "role_has_permissions",
        "package_dir": "packages/backend/access/rbac",
        "interface_file": "src/Contracts/Data/RoleHasPermissionsInterface.php",
        "timestamp": "2026_07_22_000002",
        "slug": "drop_application_id_from_role_has_permissions_table",
        "composite_rewrite": None,
    },
    {
        "table": "access_request_projections",
        "package_dir": "packages/backend/access/requests",
        "interface_file": "src/Contracts/Data/AccessRequestProjectionInterface.php",
        "timestamp": "2026_07_22_000000",
        "slug": "drop_application_id_from_access_request_projections_table",
        "composite_rewrite": None,
    },
    # ── notifications ───────────────────────────────────────────────────
    {
        "table": "in_app_messages",
        "package_dir": "packages/backend/notifications/notifications-in-app",
        "interface_file": "src/Contracts/Data/InAppMessageInterface.php",
        "timestamp": "2026_07_22_000000",
        "slug": "drop_application_id_from_in_app_messages_table",
        "composite_rewrite": None,
    },
    {
        "table": "push_subscriptions",
        "package_dir": "packages/backend/notifications/notifications-push",
        "interface_file": "src/Contracts/Data/PushSubscriptionInterface.php",
        "timestamp": "2026_07_22_000000",
        "slug": "drop_application_id_from_push_subscriptions_table",
        # Row 9 — rewrite the composite unique index.
        "composite_rewrite": {
            "drop_indexes": [
                # BEFORE: UNIQUE(user_id, application_id, device_token_fingerprint)
                {
                    "kind": "unique",
                    "name": "push_subscriptions_user_app_fingerprint_unique",
                    "columns": [
                        "PushSubscriptionInterface::ATTR_USER_ID",
                        "PushSubscriptionInterface::ATTR_APPLICATION_ID",
                        "PushSubscriptionInterface::ATTR_DEVICE_TOKEN_FINGERPRINT",
                    ],
                },
                # Also drop the plain index that includes application_id.
                {
                    "kind": "index",
                    "name": "push_subscriptions_user_app_active_index",
                    "columns": [
                        "PushSubscriptionInterface::ATTR_USER_ID",
                        "PushSubscriptionInterface::ATTR_APPLICATION_ID",
                    ],
                },
            ],
            "recreate_indexes": [
                # AFTER: UNIQUE(user_id, device_token_fingerprint)
                {
                    "kind": "unique",
                    "name": "push_subscriptions_user_fingerprint_unique",
                    "columns": [
                        "PushSubscriptionInterface::ATTR_USER_ID",
                        "PushSubscriptionInterface::ATTR_DEVICE_TOKEN_FINGERPRINT",
                    ],
                },
                # Plain user-only index for the active-lookup query path.
                {
                    "kind": "index",
                    "name": "push_subscriptions_user_active_index",
                    "columns": ["PushSubscriptionInterface::ATTR_USER_ID"],
                },
            ],
        },
    },
    {
        "table": "notifications",
        "package_dir": "packages/backend/notifications/notifications",
        "interface_file": "src/Contracts/Data/NotificationInterface.php",
        "timestamp": "2026_07_22_000000",
        "slug": "drop_application_id_from_notifications_table",
        "composite_rewrite": None,
    },
    # ── workflow ────────────────────────────────────────────────────────
    {
        "table": "approval_templates",
        "package_dir": "packages/backend/workflow/approvals",
        "interface_file": "src/Contracts/Data/ApprovalTemplateInterface.php",
        "timestamp": "2026_07_22_000000",
        "slug": "drop_application_id_from_approval_templates_table",
        # Row 11 — rewrite BOTH partial unique indexes.
        "composite_rewrite": {
            # These indexes are declared via raw DB::statement in the base
            # migration (they use WHERE clauses which Blueprint doesn't support).
            # Drop them via DROP INDEX + recreate via DB::statement.
            "raw_sql": {
                "drop_up": [
                    "DROP INDEX IF EXISTS approval_templates_composite_unique",
                    "DROP INDEX IF EXISTS approval_templates_one_active_unique",
                ],
                # Recreate WITHOUT application_id.
                "create_up": [
                    (
                        "CREATE UNIQUE INDEX approval_templates_composite_unique ON '"
                        " . ApprovalTemplateInterface::TABLE . '"
                        " (' . ApprovalTemplateInterface::ATTR_TENANT_ID . ', "
                        "' . ApprovalTemplateInterface::ATTR_ACTION_KEY . ', "
                        "' . ApprovalTemplateInterface::ATTR_NAME . ', "
                        "' . ApprovalTemplateInterface::ATTR_VERSION . ') "
                        "WHERE deleted_at IS NULL"
                    ),
                    (
                        "CREATE UNIQUE INDEX approval_templates_one_active_unique ON '"
                        " . ApprovalTemplateInterface::TABLE . '"
                        " (' . ApprovalTemplateInterface::ATTR_TENANT_ID . ', "
                        "' . ApprovalTemplateInterface::ATTR_ACTION_KEY . ', "
                        "' . ApprovalTemplateInterface::ATTR_NAME . ') "
                        "WHERE deleted_at IS NULL AND is_active = true"
                    ),
                ],
                # down() reverses up(): drop the narrow indexes, recreate the
                # wide ones (application_id included).
                "drop_down": [
                    "DROP INDEX IF EXISTS approval_templates_composite_unique",
                    "DROP INDEX IF EXISTS approval_templates_one_active_unique",
                ],
                "create_down": [
                    (
                        "CREATE UNIQUE INDEX approval_templates_composite_unique ON '"
                        " . ApprovalTemplateInterface::TABLE . '"
                        " (' . ApprovalTemplateInterface::ATTR_TENANT_ID . ', "
                        "' . ApprovalTemplateInterface::ATTR_APPLICATION_ID . ', "
                        "' . ApprovalTemplateInterface::ATTR_ACTION_KEY . ', "
                        "' . ApprovalTemplateInterface::ATTR_NAME . ', "
                        "' . ApprovalTemplateInterface::ATTR_VERSION . ') "
                        "WHERE deleted_at IS NULL"
                    ),
                    (
                        "CREATE UNIQUE INDEX approval_templates_one_active_unique ON '"
                        " . ApprovalTemplateInterface::TABLE . '"
                        " (' . ApprovalTemplateInterface::ATTR_TENANT_ID . ', "
                        "' . ApprovalTemplateInterface::ATTR_APPLICATION_ID . ', "
                        "' . ApprovalTemplateInterface::ATTR_ACTION_KEY . ', "
                        "' . ApprovalTemplateInterface::ATTR_NAME . ') "
                        "WHERE deleted_at IS NULL AND is_active = true"
                    ),
                ],
            },
        },
    },
]


# ---------------------------------------------------------------------------
# Migration templates
#
# Two shapes:
#   (a) Simple — just drop the column via Blueprint.
#   (b) Composite-rewrite — drop dependent indexes, drop column, recreate
#       indexes. Two variants: Blueprint-managed (push_subscriptions) and
#       raw DB::statement (approval_templates, because Blueprint doesn't
#       support partial WHERE clauses).
# ---------------------------------------------------------------------------


def render_simple_migration(target: dict[str, Any]) -> str:
    """
    Render a drop-application_id migration whose up() and down() are just
    Blueprint calls. No dependent indexes; no raw SQL.
    """
    table = target["table"]
    interface_class = _interface_class_from_path(target["interface_file"])
    interface_short = interface_class.rsplit("\\", 1)[-1]
    interface_use = interface_class

    return _wrap_migration(
        target=target,
        interface_use=interface_use,
        up_body=dedent(
            f"""
            Schema::table({interface_short}::TABLE, function (Blueprint $table): void {{
                // Drop the column outright. No dependent indexes on this row
                // (verified against ADR-0031 §D3 composite-index inventory).
                $table->dropColumn({interface_short}::ATTR_APPLICATION_ID);
            }});
            """
        ).strip(),
        down_body=dedent(
            f"""
            Schema::table({interface_short}::TABLE, function (Blueprint $table): void {{
                // Reverse of up(): add the column back with the original nullable
                // shape. The forward path zeroes it out; the reverse path only
                // restores the column definition — populating rows is out of
                // scope (no down-migration back-fill is possible without a
                // reverse-lookup path).
                $table->uuid({interface_short}::ATTR_APPLICATION_ID)->nullable();
                $table->index([{interface_short}::ATTR_APPLICATION_ID]);
            }});
            """
        ).strip(),
    )


def render_push_subscriptions_migration(target: dict[str, Any]) -> str:
    """
    Render the drop migration for push_subscriptions.

    push_subscriptions carries TWO indexes on application_id:
      * UNIQUE(user_id, application_id, device_token_fingerprint)  [natural key]
      * INDEX(user_id, application_id)                              [lookup path]
    Both must be dropped BEFORE the column drop (else PG/MySQL refuse).
    """
    interface_short = "PushSubscriptionInterface"
    interface_use = "Stackra\\NotificationsPush\\Contracts\\Data\\PushSubscriptionInterface"

    up_body = dedent(
        f"""
        Schema::table({interface_short}::TABLE, function (Blueprint $table): void {{
            // ── Step 1: drop the two composite indexes that reference application_id.
            //
            // Order matters — the column drop below fails if any index still
            // references it. We drop by NAME (Blueprint auto-hashes names in
            // some paths; naming explicitly matches the base migration).
            $table->dropUnique('push_subscriptions_user_app_fingerprint_unique');
            $table->dropIndex('push_subscriptions_user_app_active_index');

            // ── Step 2: drop the column itself.
            //
            // `application_id` cascades through `users.application_id` per
            // ADR-0031 §D3 row 9 — no data attribution is lost. The plain
            // FK / index on application_id (if any is auto-named) drops
            // implicitly with the column.
            $table->dropColumn({interface_short}::ATTR_APPLICATION_ID);

            // ── Step 3: recreate the narrower composite indexes.
            //
            // Natural key becomes UNIQUE(user_id, device_token_fingerprint).
            // Lookup path becomes INDEX(user_id) — active-only filter is
            // still applied at query time.
            $table->unique(
                [
                    {interface_short}::ATTR_USER_ID,
                    {interface_short}::ATTR_DEVICE_TOKEN_FINGERPRINT,
                ],
                'push_subscriptions_user_fingerprint_unique',
            );
            $table->index(
                [{interface_short}::ATTR_USER_ID],
                'push_subscriptions_user_active_index',
            );
        }});
        """
    ).strip()

    down_body = dedent(
        f"""
        Schema::table({interface_short}::TABLE, function (Blueprint $table): void {{
            // ── Step 1: drop the narrower indexes we created in up().
            $table->dropUnique('push_subscriptions_user_fingerprint_unique');
            $table->dropIndex('push_subscriptions_user_active_index');

            // ── Step 2: add application_id back with the original shape.
            $table->uuid({interface_short}::ATTR_APPLICATION_ID)->nullable();

            // ── Step 3: recreate the WIDER indexes that included application_id.
            //
            // Populating rows is out of scope — up() zeroed the column; down()
            // only restores the shape.
            $table->unique(
                [
                    {interface_short}::ATTR_USER_ID,
                    {interface_short}::ATTR_APPLICATION_ID,
                    {interface_short}::ATTR_DEVICE_TOKEN_FINGERPRINT,
                ],
                'push_subscriptions_user_app_fingerprint_unique',
            );
            $table->index(
                [
                    {interface_short}::ATTR_USER_ID,
                    {interface_short}::ATTR_APPLICATION_ID,
                ],
                'push_subscriptions_user_app_active_index',
            );
        }});
        """
    ).strip()

    return _wrap_migration(
        target=target,
        interface_use=interface_use,
        up_body=up_body,
        down_body=down_body,
    )


def render_approval_templates_migration(target: dict[str, Any]) -> str:
    """
    Render the drop migration for approval_templates.

    approval_templates carries TWO partial-unique indexes on application_id
    (partial WHERE clauses, so declared via raw DB::statement in the base
    migration). We use DB::statement for both drop AND recreate here to
    match the base migration's shape.
    """
    interface_short = "ApprovalTemplateInterface"
    interface_use = "Stackra\\Approvals\\Contracts\\Data\\ApprovalTemplateInterface"

    up_body = dedent(
        f"""
        // ── Step 1: drop the wide composite indexes that reference application_id.
        //
        // Both indexes are Postgres partial-unique indexes (WHERE deleted_at IS NULL
        // and WHERE is_active = true), which Blueprint's ->unique() can't express.
        // We drop them via raw SQL to match the base migration's shape.
        DB::statement('DROP INDEX IF EXISTS approval_templates_composite_unique');
        DB::statement('DROP INDEX IF EXISTS approval_templates_one_active_unique');

        // ── Step 2: drop the column itself.
        Schema::table({interface_short}::TABLE, function (Blueprint $table): void {{
            $table->dropColumn({interface_short}::ATTR_APPLICATION_ID);
        }});

        // ── Step 3: recreate the composite indexes WITHOUT application_id.
        //
        // Natural key becomes (tenant_id, action_key, name, version) — Application
        // is derivable from tenant_id → tenants.application_id, so it drops out
        // of the natural key without losing uniqueness.
        DB::statement('CREATE UNIQUE INDEX approval_templates_composite_unique ON ' . {interface_short}::TABLE . ' (' . {interface_short}::ATTR_TENANT_ID . ', ' . {interface_short}::ATTR_ACTION_KEY . ', ' . {interface_short}::ATTR_NAME . ', ' . {interface_short}::ATTR_VERSION . ') WHERE deleted_at IS NULL');
        DB::statement('CREATE UNIQUE INDEX approval_templates_one_active_unique ON ' . {interface_short}::TABLE . ' (' . {interface_short}::ATTR_TENANT_ID . ', ' . {interface_short}::ATTR_ACTION_KEY . ', ' . {interface_short}::ATTR_NAME . ') WHERE deleted_at IS NULL AND is_active = true');
        """
    ).strip()

    down_body = dedent(
        f"""
        // ── Step 1: drop the narrower indexes we created in up().
        DB::statement('DROP INDEX IF EXISTS approval_templates_composite_unique');
        DB::statement('DROP INDEX IF EXISTS approval_templates_one_active_unique');

        // ── Step 2: add application_id back.
        Schema::table({interface_short}::TABLE, function (Blueprint $table): void {{
            $table->uuid({interface_short}::ATTR_APPLICATION_ID)->nullable();
        }});

        // ── Step 3: recreate the WIDER partial-unique indexes.
        DB::statement('CREATE UNIQUE INDEX approval_templates_composite_unique ON ' . {interface_short}::TABLE . ' (' . {interface_short}::ATTR_TENANT_ID . ', ' . {interface_short}::ATTR_APPLICATION_ID . ', ' . {interface_short}::ATTR_ACTION_KEY . ', ' . {interface_short}::ATTR_NAME . ', ' . {interface_short}::ATTR_VERSION . ') WHERE deleted_at IS NULL');
        DB::statement('CREATE UNIQUE INDEX approval_templates_one_active_unique ON ' . {interface_short}::TABLE . ' (' . {interface_short}::ATTR_TENANT_ID . ', ' . {interface_short}::ATTR_APPLICATION_ID . ', ' . {interface_short}::ATTR_ACTION_KEY . ', ' . {interface_short}::ATTR_NAME . ') WHERE deleted_at IS NULL AND is_active = true');
        """
    ).strip()

    return _wrap_migration(
        target=target,
        interface_use=interface_use,
        up_body=up_body,
        down_body=down_body,
        extra_uses=("Illuminate\\Support\\Facades\\DB",),
    )


def _wrap_migration(
    target: dict[str, Any],
    interface_use: str,
    up_body: str,
    down_body: str,
    extra_uses: tuple[str, ...] = (),
) -> str:
    """
    Wrap up() + down() bodies with the file-level docblock + use statements
    per `.kiro/steering/docblocks.md` §Migrations.
    """
    table = target["table"]
    package = target["package_dir"].split("/", 3)[-1]  # e.g. access/delegation
    filename = f"{target['timestamp']}_{target['slug']}.php"
    rel_path = f"{target['package_dir']}/database/migrations/{filename}"
    composite_note = (
        "This migration ALSO rewrites the composite unique index(es) that "
        "referenced application_id — per ADR-0031 §D3. The DB refuses to drop "
        "a column referenced by an index, so the sequence is: drop old index → "
        "drop column → recreate narrower index."
        if target.get("composite_rewrite")
        else "No composite index depends on application_id for this row — the "
        "column drops cleanly on its own."
    )

    # Indent bodies to fit inside the anonymous class methods.
    up_indented = "\n".join("        " + line if line else "" for line in up_body.splitlines())
    down_indented = "\n".join("        " + line if line else "" for line in down_body.splitlines())

    uses_block = "\n".join(f"use {u};" for u in ("Illuminate\\Database\\Migrations\\Migration", "Illuminate\\Database\\Schema\\Blueprint", "Illuminate\\Support\\Facades\\Schema", interface_use) + extra_uses)

    return f"""<?php

/**
 * @file {rel_path}
 *
 * @description
 * Drop `application_id` from the `{table}` table per ADR-0031 §D3.
 *
 * The `{table}` row cascades through its legitimate parent (see ADR-0031
 * §D3 cascade path column) — no attribution is lost by removing the direct
 * `application_id` column. Every downstream consumer that used to read
 * `$row->application_id` reads through the parent relationship instead.
 *
 * {composite_note}
 *
 * ## Related
 *
 *   * ADR-0031 §D3 — the mandate this migration executes.
 *   * `.kiro/steering/tenancy-columns.md §2` — the 12-row named list that
 *     excludes this row.
 *   * `.kiro/steering/tenancy-columns.md §9b` — the closed-rows register
 *     the auditor reads.
 */

declare(strict_types=1);

{uses_block}

return new class() extends Migration
{{
    /**
     * Run the migration.
     */
    public function up(): void
    {{
{up_indented}
    }}

    /**
     * Reverse the migration.
     */
    public function down(): void
    {{
{down_indented}
    }}
}};
"""


def _interface_class_from_path(rel: str) -> str:
    """Derive the fully-qualified interface class name from its src/ path."""
    # e.g. src/Contracts/Data/RoleDelegationInterface.php
    parts = rel.replace("src/", "").replace(".php", "").split("/")
    return "Stackra\\" + "\\".join(parts)  # placeholder — refined per package


def _resolve_interface_class(target: dict[str, Any]) -> str:
    """
    Return the actual fully-qualified interface class name.

    Namespaces don't derive mechanically from the package folder — we need
    to open the interface file and read the `namespace` declaration.
    """
    p = WORKSPACE / target["package_dir"] / target["interface_file"]
    text = p.read_text(encoding="utf-8")
    ns_match = re.search(r"^namespace\s+([A-Za-z0-9\\]+)\s*;", text, re.MULTILINE)
    if not ns_match:
        raise RuntimeError(f"cannot resolve namespace from {p}")
    ns = ns_match.group(1)
    short = Path(target["interface_file"]).stem
    return f"{ns}\\{short}"


def render_migration(target: dict[str, Any]) -> str:
    """Dispatch to the right renderer based on composite_rewrite shape."""
    interface_use = _resolve_interface_class(target)
    if target["table"] == "push_subscriptions":
        return render_push_subscriptions_migration({**target, "interface_use": interface_use})
    if target["table"] == "approval_templates":
        return render_approval_templates_migration({**target, "interface_use": interface_use})
    return render_simple_migration({**target, "interface_use": interface_use})


def _wrap_migration_v2(
    target: dict[str, Any],
    up_body: str,
    down_body: str,
    extra_uses: tuple[str, ...] = (),
) -> str:
    """Newer wrapper that resolves the interface use lazily per target."""
    table = target["table"]
    interface_use = _resolve_interface_class(target)
    filename = f"{target['timestamp']}_{target['slug']}.php"
    rel_path = f"{target['package_dir']}/database/migrations/{filename}"
    composite_note = (
        "This migration ALSO rewrites the composite unique index(es) that "
        "referenced application_id — per ADR-0031 §D3. The DB refuses to drop "
        "a column referenced by an index, so the sequence is: drop old index → "
        "drop column → recreate narrower index."
        if target.get("composite_rewrite")
        else "No composite index depends on application_id for this row — the "
        "column drops cleanly on its own."
    )

    up_indented = "\n".join("        " + line if line else "" for line in up_body.splitlines())
    down_indented = "\n".join("        " + line if line else "" for line in down_body.splitlines())

    uses = (
        "Illuminate\\Database\\Migrations\\Migration",
        "Illuminate\\Database\\Schema\\Blueprint",
        "Illuminate\\Support\\Facades\\Schema",
        interface_use,
    ) + extra_uses
    uses_block = "\n".join(f"use {u};" for u in uses)

    return f"""<?php

/**
 * @file {rel_path}
 *
 * @description
 * Drop `application_id` from the `{table}` table per ADR-0031 §D3.
 *
 * The `{table}` row cascades through its legitimate parent — no attribution
 * is lost by removing the direct `application_id` column. Every downstream
 * consumer that used to read `$row->application_id` reads through the
 * parent relationship instead.
 *
 * {composite_note}
 *
 * ## Related
 *
 *   * ADR-0031 §D3 — the mandate this migration executes.
 *   * `.kiro/steering/tenancy-columns.md §2` — the 12-row named list that
 *     excludes this row.
 *   * `.kiro/steering/tenancy-columns.md §9b` — the closed-rows register
 *     the auditor reads.
 */

declare(strict_types=1);

{uses_block}

return new class() extends Migration
{{
    /**
     * Run the migration.
     */
    public function up(): void
    {{
{up_indented}
    }}

    /**
     * Reverse the migration.
     */
    public function down(): void
    {{
{down_indented}
    }}
}};
"""


# ---------------------------------------------------------------------------
# Interface constant stripping
# ---------------------------------------------------------------------------


def strip_attr_application_id(target: dict[str, Any]) -> bool:
    """Remove ATTR_APPLICATION_ID from a <Row>Interface.php."""
    p = WORKSPACE / target["package_dir"] / target["interface_file"]
    if not p.exists():
        print(f"  skip (missing): {p.relative_to(WORKSPACE)}")
        return False

    text = p.read_text(encoding="utf-8")
    before = text

    # Match:
    #   [optional preceding blank line + docblock]
    #   public const string ATTR_APPLICATION_ID = 'application_id';
    #   [optional trailing blank line]
    #
    # Multiple line variants observed in the workspace:
    #   * public const string ATTR_APPLICATION_ID = 'application_id';
    #   * public const ATTR_APPLICATION_ID = 'application_id';   (no scalar type)
    # Cover both.
    pattern = re.compile(
        r"    /\*\*[^*]*\*/\n"  # optional docblock
        r"    public const (?:string )?ATTR_APPLICATION_ID = '[^']+';\n"
        r"?",
        re.MULTILINE,
    )
    text, count = pattern.subn("", text, count=1)

    # Fallback — some interfaces don't have a per-const docblock (per the
    # column-constants exception in `.kiro/steering/docblocks.md`).
    if count == 0:
        pattern_bare = re.compile(
            r"    public const (?:string )?ATTR_APPLICATION_ID = '[^']+';\n",
            re.MULTILINE,
        )
        text, count = pattern_bare.subn("", text, count=1)

    if text == before:
        print(f"  no-op        : {p.relative_to(WORKSPACE)} (already clean)")
        return False

    p.write_text(text, encoding="utf-8")
    print(f"  strip const  : {p.relative_to(WORKSPACE)}")
    return True


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------


def render_target(target: dict[str, Any]) -> str:
    """Route each target to the right renderer."""
    if target["table"] == "push_subscriptions":
        up_body = dedent(
            """
            Schema::table(PushSubscriptionInterface::TABLE, function (Blueprint $table): void {
                // Step 1: drop the two composite indexes that reference application_id.
                //         The column drop below fails if any index still references it.
                $table->dropUnique('push_subscriptions_user_app_fingerprint_unique');
                $table->dropIndex('push_subscriptions_user_app_active_index');

                // Step 2: drop the column itself. Application cascades through
                //         `users.application_id` per ADR-0031 §D3 row 9.
                $table->dropColumn(PushSubscriptionInterface::ATTR_APPLICATION_ID);

                // Step 3: recreate the narrower composite indexes.
                //         Natural key becomes UNIQUE(user_id, device_token_fingerprint).
                $table->unique(
                    [
                        PushSubscriptionInterface::ATTR_USER_ID,
                        PushSubscriptionInterface::ATTR_DEVICE_TOKEN_FINGERPRINT,
                    ],
                    'push_subscriptions_user_fingerprint_unique',
                );
                $table->index(
                    [PushSubscriptionInterface::ATTR_USER_ID],
                    'push_subscriptions_user_active_index',
                );
            });
            """
        ).strip()

        down_body = dedent(
            """
            Schema::table(PushSubscriptionInterface::TABLE, function (Blueprint $table): void {
                // Step 1: drop the narrower indexes we created in up().
                $table->dropUnique('push_subscriptions_user_fingerprint_unique');
                $table->dropIndex('push_subscriptions_user_active_index');

                // Step 2: add application_id back.
                $table->uuid(PushSubscriptionInterface::ATTR_APPLICATION_ID)->nullable();

                // Step 3: recreate the WIDER indexes that included application_id.
                //         Populating rows is out of scope — up() zeroed the column;
                //         down() only restores the shape.
                $table->unique(
                    [
                        PushSubscriptionInterface::ATTR_USER_ID,
                        PushSubscriptionInterface::ATTR_APPLICATION_ID,
                        PushSubscriptionInterface::ATTR_DEVICE_TOKEN_FINGERPRINT,
                    ],
                    'push_subscriptions_user_app_fingerprint_unique',
                );
                $table->index(
                    [
                        PushSubscriptionInterface::ATTR_USER_ID,
                        PushSubscriptionInterface::ATTR_APPLICATION_ID,
                    ],
                    'push_subscriptions_user_app_active_index',
                );
            });
            """
        ).strip()
        return _wrap_migration_v2(target, up_body, down_body)

    if target["table"] == "approval_templates":
        up_body = dedent(
            """
            // Step 1: drop the wide partial-unique indexes that reference application_id.
            //         Both indexes are Postgres partial-unique indexes (WHERE deleted_at IS NULL
            //         and WHERE is_active = true), which Blueprint's ->unique() can't express.
            //         Match the base migration's raw-SQL shape.
            DB::statement('DROP INDEX IF EXISTS approval_templates_composite_unique');
            DB::statement('DROP INDEX IF EXISTS approval_templates_one_active_unique');

            // Step 2: drop the column itself.
            Schema::table(ApprovalTemplateInterface::TABLE, function (Blueprint $table): void {
                $table->dropColumn(ApprovalTemplateInterface::ATTR_APPLICATION_ID);
            });

            // Step 3: recreate the partial-unique indexes WITHOUT application_id.
            //         Natural key becomes (tenant_id, action_key, name, version) — Application
            //         cascades through tenants.application_id so it drops out of the natural key
            //         without losing uniqueness.
            DB::statement('CREATE UNIQUE INDEX approval_templates_composite_unique ON ' . ApprovalTemplateInterface::TABLE . ' (' . ApprovalTemplateInterface::ATTR_TENANT_ID . ', ' . ApprovalTemplateInterface::ATTR_ACTION_KEY . ', ' . ApprovalTemplateInterface::ATTR_NAME . ', ' . ApprovalTemplateInterface::ATTR_VERSION . ') WHERE deleted_at IS NULL');
            DB::statement('CREATE UNIQUE INDEX approval_templates_one_active_unique ON ' . ApprovalTemplateInterface::TABLE . ' (' . ApprovalTemplateInterface::ATTR_TENANT_ID . ', ' . ApprovalTemplateInterface::ATTR_ACTION_KEY . ', ' . ApprovalTemplateInterface::ATTR_NAME . ') WHERE deleted_at IS NULL AND is_active = true');
            """
        ).strip()

        down_body = dedent(
            """
            // Step 1: drop the narrower indexes we created in up().
            DB::statement('DROP INDEX IF EXISTS approval_templates_composite_unique');
            DB::statement('DROP INDEX IF EXISTS approval_templates_one_active_unique');

            // Step 2: add application_id back.
            Schema::table(ApprovalTemplateInterface::TABLE, function (Blueprint $table): void {
                $table->uuid(ApprovalTemplateInterface::ATTR_APPLICATION_ID)->nullable();
            });

            // Step 3: recreate the WIDER partial-unique indexes.
            DB::statement('CREATE UNIQUE INDEX approval_templates_composite_unique ON ' . ApprovalTemplateInterface::TABLE . ' (' . ApprovalTemplateInterface::ATTR_TENANT_ID . ', ' . ApprovalTemplateInterface::ATTR_APPLICATION_ID . ', ' . ApprovalTemplateInterface::ATTR_ACTION_KEY . ', ' . ApprovalTemplateInterface::ATTR_NAME . ', ' . ApprovalTemplateInterface::ATTR_VERSION . ') WHERE deleted_at IS NULL');
            DB::statement('CREATE UNIQUE INDEX approval_templates_one_active_unique ON ' . ApprovalTemplateInterface::TABLE . ' (' . ApprovalTemplateInterface::ATTR_TENANT_ID . ', ' . ApprovalTemplateInterface::ATTR_APPLICATION_ID . ', ' . ApprovalTemplateInterface::ATTR_ACTION_KEY . ', ' . ApprovalTemplateInterface::ATTR_NAME . ') WHERE deleted_at IS NULL AND is_active = true');
            """
        ).strip()
        return _wrap_migration_v2(target, up_body, down_body, extra_uses=("Illuminate\\Support\\Facades\\DB",))

    # Simple case — just drop the column.
    interface_short = Path(target["interface_file"]).stem
    up_body = dedent(
        f"""
        Schema::table({interface_short}::TABLE, function (Blueprint $table): void {{
            // No dependent index — the column drops cleanly on its own.
            // Application cascades through the row's legitimate parent
            // (see ADR-0031 §D3 for the cascade path per row).
            $table->dropColumn({interface_short}::ATTR_APPLICATION_ID);
        }});
        """
    ).strip()
    down_body = dedent(
        f"""
        Schema::table({interface_short}::TABLE, function (Blueprint $table): void {{
            // Reverse of up(): restore the column with the original nullable
            // shape. Populating rows is out of scope — up() zeroed the column;
            // down() only restores the definition.
            $table->uuid({interface_short}::ATTR_APPLICATION_ID)->nullable();
            $table->index([{interface_short}::ATTR_APPLICATION_ID]);
        }});
        """
    ).strip()
    return _wrap_migration_v2(target, up_body, down_body)


def main() -> int:
    print("=== E9 — drop application_id from 11 rows (ADR-0031 §D3) ===")
    print()

    migration_count = 0
    strip_count = 0

    for target in ROW_TARGETS:
        table = target["table"]
        pkg = target["package_dir"]
        migrations_dir = WORKSPACE / pkg / "database" / "migrations"
        migration_path = migrations_dir / f"{target['timestamp']}_{target['slug']}.php"

        print(f"--- {table} ({pkg.split('/', 2)[-1]}) ---")

        # 1. Write the drop-column migration.
        content = render_target(target)
        migrations_dir.mkdir(parents=True, exist_ok=True)
        migration_path.write_text(content, encoding="utf-8")
        print(f"  write        : {migration_path.relative_to(WORKSPACE)}")
        migration_count += 1

        # 2. Strip ATTR_APPLICATION_ID from the interface.
        if strip_attr_application_id(target):
            strip_count += 1

    print()
    print("=== E9 summary ===")
    print(f"Migrations authored          : {migration_count}")
    print(f"Interface constants stripped : {strip_count}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
