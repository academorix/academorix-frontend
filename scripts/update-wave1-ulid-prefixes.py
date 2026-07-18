"""One-shot script — register Wave 1 identity + access + workflow ULID prefixes
in the foundation registry. Runs the ulid-prefix validator implicitly by writing
the full file back. Idempotent: entries already present are skipped."""
import json
from pathlib import Path
from datetime import date

REG = Path(__file__).resolve().parent.parent / "modules/shared/blueprints/foundation/data/ulid-prefixes.json"
today = date.today().isoformat()

NEW = {
    "idn_": {"module": "identity", "entity": "Identity", "description": "Global credential record - one row per real human across every Application. Reachable ONLY through auth-service actions; never wire-projected."},
    "usr_": {"module": "user", "entity": "User", "description": "Per-Application projection of an Identity. Unique on (identity_id, application_id).", "promoted_from_reserved": True},
    "prf_": {"module": "user", "entity": "Profile", "description": "1:1 PII satellite of User (name, phone, avatar, locale, timezone)."},
    "tmb_": {"module": "user", "entity": "TenantMember", "description": "Row that pins a User to a Tenant with a Role. Multi-tenant membership pivot."},
    "plu_": {"module": "platform-user", "entity": "PlatformUser", "description": "Academorix-staff principal on the `platform_admin` guard. Cross-tenant + cross-application by construction."},
    "plp_": {"module": "platform-user", "entity": "PlatformProfile", "description": "1:1 PII satellite of PlatformUser (name, phone, avatar, Slack + GitHub handles, timezone). HR-controlled fields immutable."},
    "svc_": {"module": "service-accounts", "entity": "ServiceAccount", "description": "Machine credential for inter-service authentication. Bound to one Application via application_id; optionally tenant-scoped."},
    "wac_": {"module": "mfa", "entity": "WebauthnCredential", "description": "FIDO2 credential (platform authenticator or roaming hardware key). Global aggregate - belongs to Identity."},
    "mfc_": {"module": "mfa", "entity": "MfaChallenge", "description": "Ephemeral in-flight MFA challenge. Shared ledger owned by identity/auth; schema documented in mfa module."},
    "atr_": {"module": "auth", "entity": "RefreshToken", "description": "Refresh token in the rotation-with-reuse-detection chain. Polymorphic tokenable, family_id for lockdown cascade."},
    "aev_": {"module": "auth", "entity": "EmailVerification", "description": "24-hour TTL email verification token. Hashed at rest."},
    "amc_": {"module": "auth", "entity": "AuthMfaChallenge", "description": "Auth-side pending MFA challenge ledger row. Shared with mfa module (mfc_ is mfa's alias for the same shape)."},
    "acg_": {"module": "auth", "entity": "CrossAppGrant", "description": "Short-lived (300s) cross-Application SSO grant token. Consumed atomically at exchange."},
    "ajd_": {"module": "auth", "entity": "JwtDenyListEntry", "description": "Revoked jti with natural expiry. Populated by password-change / user-suspend / breach-response flows."},
    "ajk_": {"module": "auth", "entity": "JwtSigningKey", "description": "HS256 signing key with per-Application binding + kid rotation. Secret KMS-envelope-encrypted at rest."},
    "rol_": {"module": "rbac", "entity": "Role", "description": "Spatie-extended role row with (application_id, tenant_id, is_system, description, sort_order)."},
    "per_": {"module": "rbac", "entity": "Permission", "description": "Spatie-extended permission row. Dot-notated names with scope suffix."},
    "rdf_": {"module": "rbac", "entity": "RoleDefinition", "description": "Academorix metadata layer for system roles - business_type default provisioning, i18n labels, min-tier gating."},
    "agr_": {"module": "grants", "entity": "AccessGrant", "description": "Per-resource dynamic access grant. Polymorphic subject + resource, JSONB permissions, decision enum (allow/deny - deny wins)."},
    "dlg_": {"module": "delegation", "entity": "RoleDelegation", "description": "Time-bounded delegation of a delegator's role(s) to a delegate in the same tenant. Max 90-day window."},
    "imp_": {"module": "delegation", "entity": "ImpersonationSession", "description": "PlatformUser act-as session against a tenant User. 60-min hard cap; append-only compliance evidence."},
    "aac_": {"module": "approvals", "entity": "ApprovableAction", "description": "Registry entry for an action decorated with #[AsApprovableAction]. Populated by boot-time discovery."},
    "apt_": {"module": "approvals", "entity": "ApprovalTemplate", "description": "Tenant-authored approval rule set (runtime data per D-A4). Versioned; multiple templates per action_key with priority-ordered match."},
    "apg_": {"module": "approvals", "entity": "ApprovalTemplateApprover", "description": "Approver group within a template. Ordered via sort_order for sequential + parallel semantics. Quorum type all/any/n_of_m."},
    "api_": {"module": "approvals", "entity": "ApprovalInstance", "description": "One row per triggered approval flow. Polymorphic subject; immutable-once-created except for lifecycle status transitions."},
    "apr_": {"module": "approvals", "entity": "ApprovalRequirement", "description": "Per-approver-group requirement materialised at instance-create time. Snapshotted selector + resolved_approvers (delegation-aware)."},
    "apd_": {"module": "approvals", "entity": "ApprovalDecision", "description": "Individual approve/reject decision by an approver. Write-once - no update, no delete."},
    "apn_": {"module": "approvals", "entity": "ApprovalReminder", "description": "Per-approver reminder audit row. De-duplicated via composite unique on (requirement, approver, reminder_number)."},
}

doc = json.loads(REG.read_text())
prefixes = doc["prefixes"]
reserved = doc.get("reserved_for_future", {})
history = doc.get("renaming_history", [])

added = 0
for prefix, meta in NEW.items():
    if prefix in prefixes:
        continue
    entry = {"module": meta["module"], "entity": meta["entity"], "description": meta["description"]}
    if meta.get("promoted_from_reserved"):
        if prefix in reserved:
            del reserved[prefix]
        entry["promoted_from_reserved"] = True
        history.append({
            "from": prefix + " (reserved)",
            "to": prefix + " (active)",
            "date": today,
            "reason": "Wave 1 identity module User schema now landed; prefix promoted from reserved_for_future to active."
        })
    prefixes[prefix] = entry
    added += 1

doc["prefixes"] = dict(sorted(prefixes.items()))
if reserved:
    doc["reserved_for_future"] = reserved
doc["renaming_history"] = history

REG.write_text(json.dumps(doc, indent=2, ensure_ascii=False) + "\n")
print("added:", added)
print("total active prefixes now:", len(prefixes))
