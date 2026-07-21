# branch — SDUI blueprints

## Surfaces

### `resources/branch/`

Tenant-facing branch CRUD + lifecycle + hours-editor + map view.

- `list.screen.json` — filterable roster (organization / region / status /
  amenities / country) with a `+ Add branch` primary button. Row action
  quick-links to hours-editor + map-view for the branch. Uses the shared
  `is-open-chip` widget in the status column.
- `create.screen.json` — the branch-creation flow. Step 1: identity (org +
  region picker + name + slug). Step 2: address (uses the map for pin drop).
  Step 3: hours (starts from an opening-hours template picker). Step 4:
  amenities + capacity + review. Consumes 1 `branch_slot` on submit.
- `edit.screen.json` — combined edit for identity + address + phone + email
  - website + capacity + amenities + sort_order. Hours + coordinates have their
    own dedicated screens because their editors are visual.
- `hours-editor.screen.json` — the visual weekly-hours editor. Day-of-week
  columns with drag-to-set periods. Exception days as timeline blocks. Uses the
  shared `is-open-chip` widget for a live preview. Refuses multi-period days on
  tenants without `branch_multi_period_hours` (surfaces an upgrade banner
  instead of the split-period toolbar).
- `map-view.screen.json` — map-based view of every branch in the caller's
  visible tenants + orgs. Uses Mapbox tiles + amenity-cluster markers. Pin drop
  mode lets admins manually set `coordinates.source=manual` when auto-geocoding
  was unavailable or produced a low-quality result.

### `widgets/`

- `amenity-picker.widget.json` — the amenity-tag picker with search + category
  grouping. Consumed by `create.screen.json` + `edit.screen.json`. Feature-gates
  the custom-tag input behind the `branch_amenities: custom` entitlement.
- `is-open-chip.widget.json` — colour-coded chip for the branch's live
  open/closed state (respects both `status` + `opening_hours` + `exceptions`).
  Consumed by the list + map + hours-editor screens.
