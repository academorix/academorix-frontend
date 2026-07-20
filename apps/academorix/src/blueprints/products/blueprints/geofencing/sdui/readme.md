# geofencing — SDUI blueprints

## Surfaces

### `screens/`

- `geofence-checks-log.screen.json` — tenant audit view. Filterable by result /
  mode / fenceable_type / subject_type. Coordinates truncated to 3 decimal
  places in the list; precise coords visible only in single-check detail.
- `fence-editor.screen.json` — model-agnostic map-based polygon drawing UI.
  Route: `/tenant/fences/{fenceable_type}/{fenceable_id}`. Works with ANY
  Geofenceable model — branches, facilities, venues, events, delivery-zones.
  Consumer modules embed a link to this route from their own model-detail pages.

### `widgets/`

- `geofence-status-chip.widget.json` — colour-coded chip for the 4 result values
  (INSIDE / OUTSIDE / SKIPPED / ERROR).
- `geofence-map.widget.json` — Leaflet map with fence polygon + captured
  location + accuracy ring overlay. Read-only surface for the check-detail
  modal. Reads geometry from the fenceable model via the FenceableGeometry value
  object — no Branch coupling.

## Consumer widgets (in check-in features, NOT here)

The mobile pre-flight UX + the "Grant override" modal live in the CONSUMING
modules (`staff-clock-in-out`, `athlete-self-check-in`, `visitor-auto-log`), not
in this module. Their design brief:

- Poll `POST /api/v1/geofence/preflight` before submitting a real check-in.
- If preflight returns `INSIDE`, submit immediately.
- If preflight returns `OUTSIDE` / `SKIPPED` / `ERROR`, show the appropriate
  friction (retry GPS, request override, etc.).
