# Desktop shell icons

**Generated.** Do not edit by hand.

## Master

`apps/dashboard/public/academorix-icon-tile.png` (1024×1024, opaque). Same
source that drives the PWA icon set — the desktop app and the browser home
screen tile stay visually identical by design.

## Regenerate

From the repo root:

```
pnpm --filter @academorix/dashboard exec tauri icon \
  public/academorix-icon-tile.png -o src-tauri/icons
```

The Tauri CLI raster to every size Tauri v2 needs on every platform:

| File               | Purpose                                                                                                                             |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------- |
| `32x32.png`        | Linux tray + smallest bundle raster.                                                                                                |
| `64x64.png`        | Linux mid-DPI raster.                                                                                                               |
| `128x128.png`      | Linux `.desktop` + macOS legacy.                                                                                                    |
| `128x128@2x.png`   | macOS Retina.                                                                                                                       |
| `icon.png`         | Full-resolution reference — 512×512 PNG.                                                                                            |
| `icon.icns`        | macOS `.app` bundle.                                                                                                                |
| `icon.ico`         | Windows `.msi` + `.exe` bundle.                                                                                                     |
| `Square*Logo.png`  | Windows Store (`.appx`) tile sizes — required by the bundler even when not shipping.                                                |
| `android/`, `ios/` | Mobile targets (`cargo tauri android/ios`) — kept so mobile can rasterize the same source without a second `tauri icon` invocation. |

## When to regenerate

- Whenever `academorix-icon-tile.png` changes.
- Whenever we bump Tauri and the CLI adds a new required size.

Commit the regenerated set alongside the master change so `cargo build`
consumers stay in lock-step.
