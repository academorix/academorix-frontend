# geofencing — SDUI blueprints

## Surfaces

### `screens/`

- `geofence-checks-log.screen.json` — workspace audit view. Filterable by result / mode / subject_type. Coordinates truncated to 3 decimal places in the list; precise coords visible only in single-check detail.
- `branch-fence-editor.screen.json` — map-based polygon drawing UI. LIVES HERE structurally but MOUNTS INSIDE the Facilities module's branch-show screen when Facilities lands. Uses Leaflet with a draw plugin; on save serialises to WKT and PATCHes `/api/v1/branches/{branch}/geofence`.

### `widgets/`

- `geofence-status-chip.widget.json` — colour-coded chip for the 4 result values (INSIDE / OUTSIDE / SKIPPED / ERROR).
- `geofence-map.widget.json` — Leaflet map with fence polygon + captured location + accuracy ring overlay. Read-only surface for the check-detail modal.

## Consumer widgets (in check-in features, NOT here)

The mobile pre-flight UX + the "Grant override" modal live in the CONSUMING modules (`staff-clock-in-out`, `athlete-self-check-in`, `visitor-auto-log`), not in this module. Their design brief:

- Poll `POST /api/v1/geofence/preflight` before submitting a real check-in.
- If preflight returns `INSIDE`, submit immediately.
- If preflight returns `OUTSIDE` / `SKIPPED` / `ERROR`, show the appropriate friction (retry GPS, request override, etc.).
