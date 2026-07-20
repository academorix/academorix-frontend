# athlete-guardian — SDUI blueprints

## Surfaces

### `resources/athlete-guardian/`

Nested under an athlete's detail page. Wave 3a scope is a compact list + add +
edit surface — no dedicated dashboard, guardians surface within athlete context.

- `list.screen.json` — table of guardians for the current athlete. Columns:
  guardian avatar + name (via user->profile), relationship, verification-badge,
  primary indicator, role-flag summary. Row actions: view, edit, verify (HR-only
  when entitlement on), dispute, revoke, remove.
- `add.screen.json` — 3-card form. Card 1: user picker (searches Users in the
  tenant that aren't already guardians). Card 2: relationship + role flags. Card
  3: primary toggle (only if athlete has no existing primary).
- `edit.screen.json` — same three cards, BUT user_id + athlete_id are read-only
  (immutable post-create).

### `widgets/`

- `guardian-picker.widget.json` — HeroUI `ComboBox` searching Users in the
  tenant that hold an active guardianship for the current athlete. Used in
  downstream flows (medical clearance, session pickup roster) where the caller
  picks an authorised guardian.
- `guardian-role-flags.widget.json` — compact chip strip showing the four role
  flags as icons: custody (scales icon), pickup (car icon), communications (mail
  icon), medical (heart icon). Green icon = flag true; grey icon = false.
- `verification-badge.widget.json` — chip showing verification_status: green
  (verified), yellow (pending), red (disputed), grey-strikethrough (revoked).
  Tooltip on hover shows verification_method + verified_at.

## Notes on `ComboBox` over `Select`

Every picker on this module uses HeroUI `ComboBox` per `ui-components.md`. The
guardian-picker is especially important on Enterprise tenants where an athlete
may have 4+ guardians (extended split families with grandparents + step-parents
on the roster).

## Minor-safeguarding rendering

Guardian rows for MINOR athletes render with additional visual cues:

- Guardian names + emails are shown to tenant staff but redacted to initials on
  platform-admin surfaces.
- The verification-badge widget shows a red-outlined "REVIEW" chip when
  verification_status='disputed' — safeguarding-yellow variant to catch
  attention.

## Entitlement-driven rendering

The list + add screens check tenant entitlements before rendering:

- The "Add another guardian" button is disabled + shows "Multi-guardian
  required" chip when `athlete_multi_guardian=false` AND athlete already has one
  guardian.
- The "Verify with document" button on a pending guardian is hidden + shows
  "Enterprise required" when `athlete_guardian_verification=false`.
- The custody + medical-authorisation flags render as read-only when the caller
  lacks `athlete_guardians.update` (guardians updating their own row can toggle
  communications preferences but not legal custody).
