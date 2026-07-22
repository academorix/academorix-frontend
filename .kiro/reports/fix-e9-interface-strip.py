#!/usr/bin/env python3
"""Fix the 7 <Row>Interface.php files the E9 emitter's regex missed.

The base regex expected `= '` (single space) but the actual constants use
aligned = signs (multiple spaces before =). This script uses `\\s*=\\s*` to
match both aligned + unaligned forms.
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

WORKSPACE = Path("/Users/akouta/Projects/academorix-frontend")
FILES = (
    "packages/backend/access/delegation/src/Contracts/Data/RoleDelegationInterface.php",
    "packages/backend/access/invitations/src/Contracts/Data/InvitationInterface.php",
    "packages/backend/access/requests/src/Contracts/Data/AccessRequestProjectionInterface.php",
    "packages/backend/notifications/notifications-in-app/src/Contracts/Data/InAppMessageInterface.php",
    "packages/backend/notifications/notifications-push/src/Contracts/Data/PushSubscriptionInterface.php",
    "packages/backend/notifications/notifications/src/Contracts/Data/NotificationInterface.php",
    "packages/backend/workflow/approvals/src/Contracts/Data/ApprovalTemplateInterface.php",
)

PATTERN = re.compile(
    r"    public const (?:string )?ATTR_APPLICATION_ID\s*=\s*'[^']+';\n",
)


def main() -> int:
    for rel in FILES:
        p = WORKSPACE / rel
        if not p.exists():
            print(f"skip missing: {rel}")
            continue
        text = p.read_text(encoding="utf-8")
        new_text, n = PATTERN.subn("", text)
        if n == 0:
            print(f"NO MATCH    : {rel}")
            continue
        p.write_text(new_text, encoding="utf-8")
        print(f"stripped    : {rel}  ({n} match)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
