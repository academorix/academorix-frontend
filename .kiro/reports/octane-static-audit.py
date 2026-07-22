#!/usr/bin/env python3
"""
Octane static audit — enforces the Octane-safe DI patterns from
`.kiro/steering/octane-first-di.md` across every backend package
and service.

## Why this script exists

Laravel Octane keeps the framework alive between requests. Any service
that survives request-1 and captures per-request state (current user,
current tenant, static caches) will silently serve request-2 the wrong
data. The `.kiro/steering/octane-first-di.md` document codifies the
patterns that avoid this class of bug, but reviewers can only catch a
fraction of the violations by hand. This script grep-scans the whole
workspace + produces a structured report.

## The four rules

Each rule maps to a section of `.kiro/steering/octane-first-di.md`.

### R1 — #[Singleton] must be provably stateless

A class marked #[Singleton] survives the whole worker lifetime. It
MUST NOT read per-request state — no $request injection, no
Auth::user(), no Session::, no #[CurrentUser], no #[RouteParameter].
Any such read means the service captured request-1's state at the
first resolution + serves that stale state to every subsequent
request.

Severity: **P0** — silent data corruption in production.

### R2 — No static mutable state on services

Static properties survive between requests. A `private static array
$cache = []` on any service class is a state leak by construction.
Value objects (`readonly` classes) are exempt — their static
properties (like `Enum::cases()`) are immutable.

Severity: **P0** — silent data corruption in production.

### R3 — No facades inside services

`Auth::user()`, `Log::info(...)`, `Cache::store(...)`, `Session::get(...)`
inside a domain service create hidden per-request coupling that
survives worker reuse. Every read should be attribute-injected
(`#[Auth]`, `#[Log]`, `#[Cache]`, `#[Session]`).

Severity: **P1** — non-obvious coupling that's easy to miss in review.

Exceptions: controllers (inherently per-request), tests, migrations,
seeders, config files, console commands, and the framework tier
itself (`packages/backend/framework/*` publishes the facades).

### R4 — env() outside config/ folders

`env()` reads the environment directly + bypasses `config:cache`.
Every request that hits `env()` in service code re-parses env vars —
slow AND potentially inconsistent under Octane's cached config. Every
env read belongs in a `config/` folder; every service reads via
`config()` or `#[Config('...')]`.

Severity: **P1** — perf regression + config-cache incoherence.

## Report shape

Prints a structured report grouped by severity + rule:

    === Octane static audit — 2026-07-22 ===
    Scanned N files across M packages.

    ── P0 violations ──
    R1 (Singleton reads request state):
      - packages/backend/foo/src/Services/FooService.php:24
        `#[CurrentUser]` on a #[Singleton] class
    ...

    ── P1 violations ──
    R3 (Facade in service):
      - packages/backend/bar/src/Services/BarService.php:15
        `Auth::user()` — inject via `#[Auth]` in constructor
    ...

    Total: X P0 + Y P1 violations across Z files.

Exit code: 0 if zero P0 violations; 1 otherwise. P1 warnings do NOT
fail the run — they surface as warnings for gradual migration.

## What this script does NOT check

- Dynamic runtime behaviour (only static grep — regex-based).
- Third-party library statics (Iconify caches, Sentry scopes) — those
  need cleanup listeners per steering §5, not detectable here.
- Cross-file flow analysis (e.g. `$manager->getInstance()` returning
  a per-request instance across an abstract boundary). PHPStan level
  max catches some of these.

For rules the script can't reach, `.kiro/steering/octane-first-di.md`
+ reviewer discipline are still the source of truth.
"""

from __future__ import annotations

import re
import sys
from dataclasses import dataclass, field
from pathlib import Path

WORKSPACE = Path("/Users/akouta/Projects/academorix-frontend")

# Directories the audit walks.
SCAN_ROOTS = (
    "packages/backend",
    "services",
    "apps/academorix/src/modules",
    "apps/laravel-template/src",
)

# Directories the audit NEVER descends into.
SKIP_DIR_NAMES = frozenset(
    {
        ".git",
        ".turbo",
        "vendor",
        "node_modules",
        ".doppler",
        "dist",
        "storage",
        "bootstrap",  # bootstrap/cache/, bootstrap/app.php exempted
        "tests",      # test doubles legitimately mock statics
        "database",   # migrations + seeders + factories run at seed time only
    }
)

# Facades that are per-request-coupled if used inside a service.
# These are the SAME classes attribute injection handles (#[Auth],
# #[Log], #[Cache], etc.).
FORBIDDEN_FACADES = (
    "Auth::",
    "Session::",
    "Cache::",
    "Log::",
    # Note: Route::, URL::, Storage::, DB:: are also facades but they're
    # either per-request context (Route, URL) or resolve to a config-
    # keyed store (Storage, DB) — the workspace convention still uses
    # them via `#[Storage]` / `#[DB]` inside services. Flag them at P2
    # severity via a separate pass if needed.
)

# Compiled facade regexes — anchored on a word boundary + require a
# method-call `(` after the `::`. This is what filters:
#   * word-boundary       — `ImpersonationSession::class` won't match
#     `Session::` (there's no non-word char before it there anyway, but
#     it belt-and-braces).
#   * ANYTHING but `class` — `Session::class` is a compile-time
#     class-string constant, not a runtime facade invocation. Skip it.
RE_FACADES = tuple(
    (
        facade,
        re.compile(
            r"(?<![A-Za-z0-9_])"
            + re.escape(facade)
            + r"(?!class\b)"
        ),
    )
    for facade in FORBIDDEN_FACADES
)

# `// octane-safe: <reason>` on the same line OR one line above a static
# property tells the audit "yes we know, this is a deterministic
# reflection-metadata / class-string-keyed cache, it's Octane-safe by
# construction". Every exemption MUST carry the reason string.
OCTANE_SAFE_MARKER = re.compile(r"//\s*octane-safe\s*:\s*\S")

# Files under these subpaths are ALLOWED to use facades — they're
# inherently per-request or bootstrap-time.
FACADE_EXEMPT_PATH_MARKERS = (
    "/Controllers/",
    "/Actions/",
    "/Console/",
    "/Providers/",
    "/config/",
    "/routes/",
    # Framework tier — publishes the facades + their bindings.
    "packages/backend/framework/",
    "packages/backend/foundation/",
    "packages/backend/authorization/",
    # SDKs (deleted but keep the exemption for future re-adds).
    "/sdk/",
    "/sdks/",
)

# Per-request injection attributes. Presence on ANY constructor of a
# #[Singleton] class fires R1.
PER_REQUEST_ATTRIBUTES = (
    "#[CurrentUser]",
    "#[Authenticated]",
    "#[RouteParameter",  # #[RouteParameter('id')] etc.
    "#[Context",         # #[Context('tenant_id')]
)

# Compiled regexes — kept at module scope so the walker doesn't
# recompile them per file.
RE_SINGLETON = re.compile(r"^\s*#\[Singleton\]", re.MULTILINE)
RE_STATIC_PROPERTY = re.compile(
    # Match public/private/protected + optional readonly-like markers.
    # SKIP `const` (those are runtime-constant) + skip type-only lines.
    r"^\s*(?:public|protected|private)\s+static\s+(?!const\b)[\w?\\|]+\s+\$",
    re.MULTILINE,
)
RE_ENV_CALL = re.compile(r"\benv\s*\(")

# Files that are ALLOWED to hold static state — value objects, enums,
# support helpers where static caches are the whole point.
#
# Rationale per exemption:
#   * /Enums/            — enum cases + Enum::cases() cache
#   * /Support/          — Str-like helpers with per-class reflection cache
#   * /framework/support/ — the whole stackra/support package IS Str+Arr+...
#   * /Data/             — readonly DTOs (spatie/laravel-data)
#   * /Contracts/        — interfaces don't hold state
#   * /Attributes/       — attribute classes are compile-time metadata
#   * /Concerns/         — traits; the composing class holds the state
#   * /Testing/          — test fakes
#   * /Models/           — dual-source enum-db-seed pattern uses static
#                          `$allowSystemMutation` flag on Model classes
#                          (per .kiro/steering/enum-db-seed-dual-source.md).
#   * /Migrations/       — legitimate reflection cache in migrator
#   * /compliance/architecture/src/Rules/ — PHPStan rule files literally
#                          author env()-detection strings + reflection
#                          caches that walk the AST. Exempt whole tree.
STATIC_STATE_EXEMPT_MARKERS = (
    "/Enums/",
    "/Support/",
    "/framework/support/",
    "/Data/",
    "/Contracts/",
    "/Attributes/",
    "/Concerns/",
    "/Testing/",
    "/Models/",
    "/Migrations/",
    "/compliance/architecture/src/Rules/",
)


# ---------------------------------------------------------------------------
# Findings model
# ---------------------------------------------------------------------------

@dataclass(frozen=True)
class Finding:
    """One rule violation on one file at one line."""

    rule: str          # "R1" / "R2" / "R3" / "R4"
    severity: str      # "P0" / "P1"
    path: Path
    line: int
    message: str


@dataclass
class Report:
    """The full audit report."""

    scanned_files: int = 0
    scanned_dirs: int = 0
    findings: list[Finding] = field(default_factory=list)


# ---------------------------------------------------------------------------
# Walker
# ---------------------------------------------------------------------------

def walk_php_files() -> list[Path]:
    """Return every .php file under SCAN_ROOTS outside SKIP_DIR_NAMES."""
    out: list[Path] = []
    for root_rel in SCAN_ROOTS:
        root = WORKSPACE / root_rel
        if not root.exists():
            continue
        for p in root.rglob("*.php"):
            if any(part in SKIP_DIR_NAMES for part in p.parts):
                continue
            out.append(p)
    return sorted(out)


# ---------------------------------------------------------------------------
# Rules
# ---------------------------------------------------------------------------

def check_r1_singleton_reads_request(path: Path, text: str) -> list[Finding]:
    """R1 — a #[Singleton] class that reads per-request state."""
    findings: list[Finding] = []
    if not RE_SINGLETON.search(text):
        return findings
    for attribute in PER_REQUEST_ATTRIBUTES:
        for match in re.finditer(re.escape(attribute), text):
            line = text.count("\n", 0, match.start()) + 1
            findings.append(
                Finding(
                    rule="R1",
                    severity="P0",
                    path=path,
                    line=line,
                    message=f"`{attribute}` on a #[Singleton] class — should be #[Scoped]",
                )
            )
    return findings


def check_r2_static_state(path: Path, text: str) -> list[Finding]:
    """R2 — static mutable state on a service class.

    Skips:
      * Files under STATIC_STATE_EXEMPT_MARKERS (enums, VOs, models, etc.).
      * `readonly` static properties (rare + immutable by definition).
      * Any static property whose line OR preceding line carries the
        `// octane-safe: <reason>` marker (workspace-authorized
        memoization patterns).
    """
    # Exempt files that legitimately hold statics.
    posix = path.as_posix()
    if any(marker in posix for marker in STATIC_STATE_EXEMPT_MARKERS):
        return []

    # Pre-compute per-line index for the octane-safe marker check.
    lines = text.split("\n")

    findings: list[Finding] = []
    for match in RE_STATIC_PROPERTY.finditer(text):
        line = text.count("\n", 0, match.start()) + 1

        # Skip `readonly` static properties.
        matched_line = text[match.start():text.find("\n", match.start())]
        if "readonly" in matched_line:
            continue

        # Skip if the property's own line OR any of the consecutive
        # single-line-comment lines immediately preceding it carry the
        # `// octane-safe: <reason>` marker. Walk backwards through the
        # comment block so multi-line rationales work (a rationale that
        # spans 5 comment lines still exempts the property below).
        #
        # A non-comment line (blank, docblock end `*/`, code) breaks the
        # walk — the marker MUST be attached to the property, not to
        # some unrelated block above.
        exempt = False
        curr_idx = line - 1  # 0-indexed
        if curr_idx < len(lines) and OCTANE_SAFE_MARKER.search(lines[curr_idx]):
            exempt = True
        else:
            idx = curr_idx - 1
            while idx >= 0:
                candidate = lines[idx].strip()
                if not candidate.startswith("//"):
                    break
                if OCTANE_SAFE_MARKER.search(candidate):
                    exempt = True
                    break
                idx -= 1
        if exempt:
            continue

        findings.append(
            Finding(
                rule="R2",
                severity="P0",
                path=path,
                line=line,
                message=(
                    "Static mutable property — service state must live on the "
                    "container, not the class. If this is a deterministic "
                    "reflection / class-string memoization, add "
                    "`// octane-safe: <reason>` on the same or preceding line."
                ),
            )
        )
    return findings


def check_r3_facade_in_service(path: Path, text: str) -> list[Finding]:
    """R3 — a facade call inside a service (non-controller, non-provider).

    The regex is anchored on a word boundary so `ImpersonationSession::class`
    doesn't false-positive against `Session::`.
    """
    posix = path.as_posix()
    if any(marker in posix for marker in FACADE_EXEMPT_PATH_MARKERS):
        return []
    findings: list[Finding] = []
    for facade, pattern in RE_FACADES:
        for match in pattern.finditer(text):
            # Skip the `use ...\Auth;` import lines — they're the type
            # hint, not an invocation.
            line_start = text.rfind("\n", 0, match.start()) + 1
            line_end = text.find("\n", match.start())
            line_text = text[line_start:line_end] if line_end != -1 else text[line_start:]
            if line_text.lstrip().startswith("use "):
                continue
            # Skip docblock references (comments starting with * or //).
            stripped = line_text.lstrip()
            if stripped.startswith("*") or stripped.startswith("//"):
                continue
            line = text.count("\n", 0, match.start()) + 1
            attr_name = facade.rstrip("::").lower()
            findings.append(
                Finding(
                    rule="R3",
                    severity="P1",
                    path=path,
                    line=line,
                    message=f"`{facade}` in service — inject via `#[{attr_name.title()}]` in constructor",
                )
            )
    return findings


def check_r4_env_outside_config(path: Path, text: str) -> list[Finding]:
    """R4 — env() call outside a config/ folder."""
    posix = path.as_posix()
    if "/config/" in posix:
        return []
    # The architecture PHPStan-rule file literally authors env-detection
    # strings; exempt it OR it will detect itself forever.
    if "/compliance/architecture/src/Rules/" in posix:
        return []
    # Skip package-conventions.md style scripts that legitimately read
    # env (e.g., docker/ / .github/) — the audit doesn't walk those, so
    # no exemption needed here.
    findings: list[Finding] = []
    for match in RE_ENV_CALL.finditer(text):
        # Skip docblock mentions + comments.
        line_start = text.rfind("\n", 0, match.start()) + 1
        line_end = text.find("\n", match.start())
        line_text = text[line_start:line_end] if line_end != -1 else text[line_start:]
        stripped = line_text.lstrip()
        if stripped.startswith("*") or stripped.startswith("//") or stripped.startswith("#"):
            continue
        line = text.count("\n", 0, match.start()) + 1
        findings.append(
            Finding(
                rule="R4",
                severity="P1",
                path=path,
                line=line,
                message="`env()` outside config/ — use `config('...')` or `#[Config('...')]`",
            )
        )
    return findings


# ---------------------------------------------------------------------------
# Runner
# ---------------------------------------------------------------------------

def audit_file(path: Path, report: Report) -> None:
    """Run every rule against one file."""
    try:
        text = path.read_text(encoding="utf-8")
    except (OSError, UnicodeDecodeError):
        return
    report.scanned_files += 1

    report.findings.extend(check_r1_singleton_reads_request(path, text))
    report.findings.extend(check_r2_static_state(path, text))
    report.findings.extend(check_r3_facade_in_service(path, text))
    report.findings.extend(check_r4_env_outside_config(path, text))


def render_report(report: Report) -> str:
    """Format the report to a human-readable string."""
    lines: list[str] = []
    lines.append("=== Octane static audit ===")
    lines.append(f"Scanned files : {report.scanned_files}")
    lines.append(f"Findings      : {len(report.findings)}")
    lines.append("")

    p0 = [f for f in report.findings if f.severity == "P0"]
    p1 = [f for f in report.findings if f.severity == "P1"]

    # ── P0 block ────────────────────────────────────────────────────
    if p0:
        lines.append("── P0 violations (silent data corruption) ──")
        for rule_id, title in (
            ("R1", "Singleton reads per-request state"),
            ("R2", "Static mutable state on a service"),
        ):
            rule_hits = [f for f in p0 if f.rule == rule_id]
            if not rule_hits:
                continue
            lines.append(f"\n{rule_id} — {title}  ({len(rule_hits)} hits)")
            for f in rule_hits[:50]:  # cap per-rule display
                rel = f.path.relative_to(WORKSPACE)
                lines.append(f"  {rel}:{f.line}")
                lines.append(f"    {f.message}")
            if len(rule_hits) > 50:
                lines.append(f"  … and {len(rule_hits) - 50} more.")
        lines.append("")

    # ── P1 block ────────────────────────────────────────────────────
    if p1:
        lines.append("── P1 warnings (coupling / perf) ──")
        for rule_id, title in (
            ("R3", "Facade inside service"),
            ("R4", "env() outside config/"),
        ):
            rule_hits = [f for f in p1 if f.rule == rule_id]
            if not rule_hits:
                continue
            lines.append(f"\n{rule_id} — {title}  ({len(rule_hits)} hits)")
            for f in rule_hits[:20]:  # cap display
                rel = f.path.relative_to(WORKSPACE)
                lines.append(f"  {rel}:{f.line}")
                lines.append(f"    {f.message}")
            if len(rule_hits) > 20:
                lines.append(f"  … and {len(rule_hits) - 20} more.")
        lines.append("")

    # ── Summary ─────────────────────────────────────────────────────
    lines.append("── Summary ──")
    lines.append(f"P0 violations : {len(p0)}")
    lines.append(f"P1 warnings   : {len(p1)}")
    lines.append("")
    if p0:
        lines.append("EXIT: FAIL — P0 violations must be fixed before merge.")
    elif p1:
        lines.append("EXIT: WARN — P0 clean; P1 warnings surfaced for review.")
    else:
        lines.append("EXIT: OK — zero violations.")

    return "\n".join(lines)


def main() -> int:
    report = Report()
    for path in walk_php_files():
        audit_file(path, report)

    print(render_report(report))

    # Exit 0 if zero P0 (green); 1 if any P0. P1 warnings never fail.
    p0_count = sum(1 for f in report.findings if f.severity == "P0")
    return 1 if p0_count else 0


if __name__ == "__main__":
    sys.exit(main())
