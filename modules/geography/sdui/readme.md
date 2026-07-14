# geography — SDUI blueprints

## Surfaces

### `widgets/`

Reusable pickers for signup / profile / billing / event forms.

- `country-picker.widget.json` — Combobox with flag emoji + localized name. Filters by `region`. Ships a "geolocate me" toggle to pre-fill from `/geolocate`.
- `currency-picker.widget.json` — Combobox with symbol + precision. Filters by `country_id`. Renders "$29.00" preview when a precision is picked.
- `timezone-picker.widget.json` — Combobox filtered by `country_id`. Shows current UTC offset alongside the IANA name.
- `language-picker.widget.json` — Combobox for the ISO-639 catalog. Note: for workspace locale enablement, use `localization` module's `language-switcher` widget instead.

No `screens/` folder — geography has no dedicated pages. It contributes widgets that other modules mount.
