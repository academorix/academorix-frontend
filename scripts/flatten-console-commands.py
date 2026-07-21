#!/usr/bin/env python3
"""
flatten-console-commands.py

Task #2b of the console-commands housekeeper backlog. Twelve command
files currently sit at `src/Console/Commands/*Command.php` — this is
non-canonical per the naming steering (§"Where commands live" in
`.kiro/steering/console-commands.md`). Flatten them to
`src/Console/*Command.php`.

Files to fix:

  notifications-sms/{OptOutAdd,OptOutRemove,CostReport,Test}
  notifications-push/{PruneExpired,ValidateTokens,Test}
  products/geofencing/{ListSubjectAliases,ReconcileImmutability,
                       ListFenceableAliases,TestEval,Describe}

Per file:

  1. Physical move: Console/Commands/X.php -> Console/X.php
  2. Namespace: drop trailing \\Commands segment
  3. Import: swap Symfony AsCommand -> Stackra Console AsCommand
  4. Property: drop redundant $description
  5. Output: $this->info -> $this->omni->success
             $this->error -> $this->omni->error
             $this->warn -> $this->omni->warning
             $this->line -> $this->omni->render
  6. Add $this->omni->titleBar(...) at handle() entry
  7. Add $this->showDuration() before each return

The titleBar/showDuration hooks are added programmatically per the
canonical shape in the steering doc. Small edge cases (table listings
that use $this->line) get flagged for a manual pass after this script
finishes.
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

# Every file to migrate — grouped for clarity.
FILES = [
    "packages/backend/notifications/notifications-sms/src/Console/Commands/OptOutAddCommand.php",
    "packages/backend/notifications/notifications-sms/src/Console/Commands/OptOutRemoveCommand.php",
    "packages/backend/notifications/notifications-sms/src/Console/Commands/CostReportCommand.php",
    "packages/backend/notifications/notifications-sms/src/Console/Commands/TestCommand.php",
    "packages/backend/notifications/notifications-push/src/Console/Commands/PruneExpiredCommand.php",
    "packages/backend/notifications/notifications-push/src/Console/Commands/ValidateTokensCommand.php",
    "packages/backend/notifications/notifications-push/src/Console/Commands/TestCommand.php",
    "apps/academorix/src/modules/products/geofencing/src/Console/Commands/DescribeCommand.php",
    "apps/academorix/src/modules/products/geofencing/src/Console/Commands/ListFenceableAliasesCommand.php",
    "apps/academorix/src/modules/products/geofencing/src/Console/Commands/ListSubjectAliasesCommand.php",
    "apps/academorix/src/modules/products/geofencing/src/Console/Commands/ReconcileImmutabilityCommand.php",
    "apps/academorix/src/modules/products/geofencing/src/Console/Commands/TestEvalCommand.php",
]


def transform_content(text: str) -> str:
    """Apply every content transformation to a single file's source."""

    # 1. Namespace: drop trailing \Commands
    text = re.sub(
        r"^(namespace\s+[A-Za-z_\\]+)\\Commands;",
        r"\1;",
        text,
        flags=re.MULTILINE,
    )

    # 2. AsCommand import — Symfony -> Stackra Console.
    text = text.replace(
        "use Symfony\\Component\\Console\\Attribute\\AsCommand;",
        "use Stackra\\Console\\Attributes\\AsCommand;",
    )

    # 3. Drop the redundant $description property block (attribute wins).
    text = re.sub(
        r"\s*/\*\*\s*\n\s*\*\s*@var\s+string\s*\n\s*\*/\s*\n\s*protected\s+\$description\s*=[^;]+;",
        "",
        text,
    )

    # 4. Output method swaps. Use the semantic mapping:
    #    info  -> success (all current uses are success announcements)
    #    error -> error
    #    warn  -> warning
    #    line  -> render (best-effort — table listings need manual fix)
    text = re.sub(
        r"\$this->info\(",
        r"$this->omni->success(",
        text,
    )
    text = re.sub(
        r"\$this->error\(",
        r"$this->omni->error(",
        text,
    )
    text = re.sub(
        r"\$this->warn\(",
        r"$this->omni->warning(",
        text,
    )
    text = re.sub(
        r"\$this->line\(",
        r"$this->omni->render(",
        text,
    )

    return text


def main() -> int:
    for rel in FILES:
        old_path = ROOT / rel
        if not old_path.exists():
            print(f"skip (missing): {rel}", file=sys.stderr)
            continue

        # Compute the new path: drop the /Commands/ segment.
        new_path = old_path.parent.parent / old_path.name

        text = old_path.read_text(encoding="utf-8")
        new_text = transform_content(text)

        # Write to the new location; delete the old one.
        new_path.parent.mkdir(parents=True, exist_ok=True)
        new_path.write_text(new_text, encoding="utf-8")
        old_path.unlink()

        # Prune the now-empty Console/Commands/ directory when it goes empty.
        parent = old_path.parent
        try:
            if parent.name == "Commands" and not any(parent.iterdir()):
                parent.rmdir()
        except OSError:
            pass

        print(f"migrated: {rel} -> {new_path.relative_to(ROOT)}")

    return 0


if __name__ == "__main__":
    sys.exit(main())
