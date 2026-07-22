#!/usr/bin/env python3
"""
A5 — Reconcile finance/gateway's PaymentMethod duplication.

Per ADR-0030 §D1–D6, the `payment_methods` table is owned by
`apps/academorix/src/modules/finance/payment/`. The gateway module carries
a byte-DIFFERENT duplicate migration + a full duplicate PaymentMethod
aggregate surface (Interface + Model + Repository + Actions + Events + Jobs
+ Exceptions + Policy + Factory + Test + Enum). ADR-0030 §D2 mandates the
gateway version is deleted; §D3 says gateway rows FK to the payment module's
payment_methods table instead of owning their own copy.

Grep confirms ZERO downstream consumers of the gateway PaymentMethod surface
outside gateway itself — the reconciliation is safe.

## What this script does

1. **Delete 23 whole-scope PaymentMethod files** from
   `apps/academorix/src/modules/finance/gateway/`. Every file is either:
     * A migration / factory / test whose whole purpose is the duplicate
       payment_methods table.
     * A Contract / Model / Repository / Action / Event / Job / Exception /
       Policy / Enum whose whole purpose is the duplicate PaymentMethod
       aggregate.

2. **Surgically edit `GatewayPermission.php`** — remove the 5 payment-
   methods.* cases + their guard mappings. These permissions gated the
   4 gateway PaymentMethod Actions we just deleted; leaving them behind
   would seed orphaned permission rows on `db:seed`.

3. **Surgically edit `PaymentGatewayException.php`** — remove the stale
   docblock reference to the deleted `PaymentMethodExpiredException` /
   `PaymentMethodNotFoundException` subclasses.

4. **Print a summary** of every file touched.

## What this script does NOT do

- Add `payment_method_id` FK columns to gateway rows (Sprint 3d follow-up per
  ADR-0030 §D3). Gateway's PaymentIntent + gateway_transactions tables should
  eventually carry a nullable FK; that's a separate schema migration and lives
  in the E9-batch companion commit. This script only removes the duplicate;
  the additive FK migrations come next.
- Touch the payment module's authoritative files.

## Ordering + idempotency

Every step is idempotent: re-running the script after a partial success
finishes cleanly. Deletion targets that no longer exist are silently
skipped; edits that have already been applied are a no-op.
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

# ---------------------------------------------------------------------------
# Workspace layout
# ---------------------------------------------------------------------------

WORKSPACE = Path("/Users/akouta/Projects/academorix-frontend")
GATEWAY_MODULE = WORKSPACE / "apps" / "academorix" / "src" / "modules" / "finance" / "gateway"

# ---------------------------------------------------------------------------
# The 23 whole-scope PaymentMethod files to delete.
#
# Every file below is either:
#   (a) A migration / factory / test whose whole purpose is the duplicate
#       payment_methods table.
#   (b) A Contract / Model / Repository / Action / Event / Job / Exception /
#       Policy / Enum whose whole purpose is the duplicate PaymentMethod
#       aggregate surface.
#
# Every path is relative to GATEWAY_MODULE for readability.
# ---------------------------------------------------------------------------
WHOLE_SCOPE_DELETES: tuple[str, ...] = (
    # Migration + factory + test
    "database/migrations/2026_07_15_120002_create_payment_methods_table.php",
    "database/factories/PaymentMethodFactory.php",
    "tests/Unit/PaymentMethodTest.php",
    # Contracts
    "src/Contracts/Data/PaymentMethodInterface.php",
    "src/Contracts/Repositories/PaymentMethodRepositoryInterface.php",
    # Model + Repository
    "src/Models/PaymentMethod.php",
    "src/Repositories/PaymentMethodRepository.php",
    # Policy
    "src/Policies/PaymentMethodPolicy.php",
    # Actions (all 4 tenant CRUD)
    "src/Actions/Tenant/CreatePaymentMethodAction.php",
    "src/Actions/Tenant/DeletePaymentMethodAction.php",
    "src/Actions/Tenant/ListPaymentMethodAction.php",
    "src/Actions/Tenant/ShowPaymentMethodAction.php",
    # Concerns
    "src/Concerns/HasPaymentMethods.php",
    # Data DTOs
    "src/Data/PaymentMethodData.php",
    "src/Data/Requests/CreatePaymentMethodRequestData.php",
    # Enums
    "src/Enums/PaymentMethodOwnerType.php",
    # Events
    "src/Events/PaymentMethodAdded.php",
    "src/Events/PaymentMethodMadeDefault.php",
    "src/Events/PaymentMethodRemoved.php",
    "src/Events/PaymentMethodVerified.php",
    # Exceptions
    "src/Exceptions/PaymentMethodExpiredException.php",
    "src/Exceptions/PaymentMethodNotFoundException.php",
    # Jobs
    "src/Jobs/VerifyPaymentMethodJob.php",
)


# ---------------------------------------------------------------------------
# Surgical edit — GatewayPermission.php
#
# Remove the 5 payment-methods.* cases + their guard-map entries. The
# gateway module retains its gateway-transport permissions (Gateways*,
# GatewayWebhooks*, PlatformGateway*) — those stay.
# ---------------------------------------------------------------------------

# Case-block pattern to remove. Each block spans from the leading "/**" to
# the "case X = 'x';" line — captured with a lazy multiline regex.
GATEWAY_PERMISSION_CASES_TO_REMOVE: tuple[str, ...] = (
    "PaymentMethodsViewAny",
    "PaymentMethodsView",
    "PaymentMethodsCreate",
    "PaymentMethodsDelete",
    "PaymentMethodsSetDefault",
)


def strip_payment_method_cases_from_permission_enum() -> None:
    """
    Remove the 5 payment-methods.* cases from GatewayPermission.

    The enum is generated by the module blueprint. Every case follows the
    same physical shape:

        /**
         * `x.y.z` — <label>
         */
        #[Label('...')]
        #[Description('...')]
        case PaymentMethodsX = 'payment-methods.x';

    Match each of the 5 case-name suffixes and strip the whole block plus
    the trailing blank line. Then strip the matching `self::PaymentMethods* =>
    Guard::Sanctum,` line from the `guard()` match body.
    """
    path = GATEWAY_MODULE / "src" / "Enums" / "GatewayPermission.php"
    if not path.exists():
        print(f"  skip (missing): {path.relative_to(WORKSPACE)}")
        return

    text = path.read_text(encoding="utf-8")

    # For each target case, remove:
    #   /**\n     * `payment-methods...` — ...\n     */\n
    #   #[Label(...)]\n
    #   #[Description(...)]\n
    #   case PaymentMethodsX = 'payment-methods.x';\n
    #   \n  (trailing blank line separating the case blocks)
    for case_name in GATEWAY_PERMISSION_CASES_TO_REMOVE:
        # Match the docblock + attributes + case line + trailing blank line.
        # `re.DOTALL` so `.` matches newlines inside the block.
        pattern = re.compile(
            r"    /\*\*\n"
            r"(?:     \*[^\n]*\n)+"
            r"     \*/\n"
            r"    #\[Label\([^\n]*\)\]\n"
            r"    #\[Description\([^\n]*\)\]\n"
            r"    case " + re.escape(case_name) + r" = '[^']+';\n"
            r"\n",
            re.MULTILINE,
        )
        text, n = pattern.subn("", text, count=1)
        if n == 0:
            print(f"  warn: could not locate case block for {case_name}")

    # Strip the matching guard-map entries. Every entry looks like:
    #   "            self::PaymentMethodsX => Guard::Sanctum,\n"
    for case_name in GATEWAY_PERMISSION_CASES_TO_REMOVE:
        text = re.sub(
            r"            self::" + re.escape(case_name) + r" => Guard::[^,\n]+,\n",
            "",
            text,
        )

    path.write_text(text, encoding="utf-8")
    print(f"  edit         : {path.relative_to(WORKSPACE)}  (removed 5 cases + guard map entries)")


# ---------------------------------------------------------------------------
# Surgical edit — PaymentGatewayException.php
#
# The exception's class docblock references `PaymentMethodExpiredException` +
# `PaymentMethodNotFoundException` as sibling subclasses. Both are deleted
# by this script — the reference is stale. Update the docblock in-place.
# ---------------------------------------------------------------------------


def fix_payment_gateway_exception_docblock() -> None:
    """Update the PaymentGatewayException docblock to remove stale refs."""
    path = GATEWAY_MODULE / "src" / "Exceptions" / "PaymentGatewayException.php"
    if not path.exists():
        print(f"  skip (missing): {path.relative_to(WORKSPACE)}")
        return

    text = path.read_text(encoding="utf-8")
    before = text

    # The exact stale docblock line:
    #    " * subclasses (WebhookSignatureInvalidException, PaymentMethodExpiredException,"
    # ADR-0030 removes the PaymentMethod-related subclasses; rewrite the line
    # so it doesn't reference them.
    text = text.replace(
        " * subclasses (WebhookSignatureInvalidException, PaymentMethodExpiredException,",
        " * subclasses (WebhookSignatureInvalidException,",
    )

    if text == before:
        print(f"  no-op        : {path.relative_to(WORKSPACE)}  (docblock already clean)")
        return

    path.write_text(text, encoding="utf-8")
    print(f"  edit         : {path.relative_to(WORKSPACE)}  (docblock stale ref removed)")


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------


def main() -> int:
    if not GATEWAY_MODULE.exists():
        print(f"Gateway module missing: {GATEWAY_MODULE}", file=sys.stderr)
        return 1

    print("=== A5 reconciliation — finance/gateway/payment_methods ===")
    print(f"Root: {GATEWAY_MODULE.relative_to(WORKSPACE)}")
    print()

    # 1. Delete whole-scope PaymentMethod files.
    deleted = 0
    skipped = 0
    print(f"--- Deleting {len(WHOLE_SCOPE_DELETES)} whole-scope files ---")
    for rel in WHOLE_SCOPE_DELETES:
        p = GATEWAY_MODULE / rel
        if not p.exists():
            print(f"  skip (missing): {p.relative_to(WORKSPACE)}")
            skipped += 1
            continue
        p.unlink()
        print(f"  delete       : {p.relative_to(WORKSPACE)}")
        deleted += 1
    print(f"    deleted={deleted}, skipped={skipped}")
    print()

    # 2. Surgical edits.
    print("--- Surgical edits ---")
    strip_payment_method_cases_from_permission_enum()
    fix_payment_gateway_exception_docblock()
    print()

    # 3. Empty-folder cleanup — if a folder used to hold only PaymentMethod
    #    scoped files, it's now empty and should be removed.
    print("--- Empty-folder cleanup ---")
    for candidate in (
        "src/Actions/Tenant",
        "src/Concerns",
        "src/Data/Requests",
        "src/Enums",  # will only clean if it's now empty — GatewayPermission is here so it won't
        "src/Events",
        "src/Jobs",
        "src/Policies",
        "src/Repositories",
        "src/Models",
        "src/Contracts/Data",
        "src/Contracts/Repositories",
        "database/factories",
        "tests/Unit",
    ):
        p = GATEWAY_MODULE / candidate
        if p.exists() and p.is_dir() and not any(p.iterdir()):
            p.rmdir()
            print(f"  rmdir (empty): {p.relative_to(WORKSPACE)}")

    print()
    print("=== A5 reconciliation complete ===")
    return 0


if __name__ == "__main__":
    sys.exit(main())
