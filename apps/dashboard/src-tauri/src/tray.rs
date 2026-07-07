//! # System tray icon.
//!
//! Registers the tray icon described in `DESKTOP_PLAN.md` §4.3:
//!
//! - **macOS**: menu-bar icon in the top-right. Uses
//!   `set_icon_as_template(true)` so macOS auto-tints it for light/dark
//!   mode. Left-click raises + focuses the main window; right-click opens
//!   the same context menu.
//! - **Windows**: system-tray icon in the lower-right. Same click model.
//! - **Linux**: best-effort. Some DEs (Wayland-only GNOME) don't render
//!   trays at all; the [`install_tray`] entrypoint logs a warning and
//!   returns `Ok(())` in that case rather than aborting boot.
//!
//! ## Menu structure (see `desktop.config.ts` `TRAY_ITEMS`)
//!
//! ```text
//! Show Academorix        (actions section)
//! ───────
//! New Athlete            (navigation section)
//! New Session
//! ───────
//! Check for updates      (system section — Phase 4 stub)
//! Sign out
//! ───────
//! Quit Academorix
//! ```
//!
//! Clicks are forwarded to the renderer via the same `menu-command` IPC
//! event the native menu bar uses — the renderer distinguishes source
//! ("tray" vs "native") via the payload.

use tauri::menu::{Menu, MenuItem, PredefinedMenuItem};
use tauri::tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent};
use tauri::{AppHandle, Manager, Runtime};

use crate::emit_menu_command;

/// Installs the tray icon on the given app. Called by the setup hook in
/// `lib.rs` when `TRAY_ENABLED` is true. Failures return `Err` so setup
/// fails loudly rather than shipping a broken tray silently.
pub fn install_tray<R: Runtime>(app: &AppHandle<R>) -> tauri::Result<()> {
    // Reuse the app's default window icon as a starting point. macOS will
    // tint it because we set `icon_as_template(true)` below; Windows +
    // Linux consume it as-is.
    let icon = app
        .default_window_icon()
        .cloned()
        .ok_or_else(|| tauri::Error::AssetNotFound("default_window_icon".to_string()))?;

    let menu = build_tray_menu(app)?;

    let builder = TrayIconBuilder::with_id("main-tray")
        .icon(icon)
        .menu(&menu)
        .tooltip("Academorix")
        .icon_as_template(true) // macOS auto-tint; no-op on other platforms
        .show_menu_on_left_click(false);

    let handle = app.clone();
    let tray = builder
        .on_menu_event(move |app, event| {
            let id = event.id().as_ref();
            log::info!("tray menu clicked: {id}");
            match id {
                "tray.quit" => app.exit(0),
                "tray.open" => raise_main_window(app),
                _ => emit_menu_command(&handle, id, "tray"),
            }
        })
        .on_tray_icon_event(|tray, event| {
            // Left-click raises the main window. Right-click is handled
            // by the OS (opens the menu we attached above).
            if let TrayIconEvent::Click {
                button: MouseButton::Left,
                button_state: MouseButtonState::Up,
                ..
            } = event
            {
                let app = tray.app_handle();
                raise_main_window(app);
            }
        })
        .build(app);

    match tray {
        Ok(_) => Ok(()),
        Err(err) => {
            // Linux DEs without tray support come through this branch on
            // Wayland-only setups. Downgrade to a warning so the app still
            // boots.
            #[cfg(target_os = "linux")]
            {
                log::warn!(
                    "system tray unavailable on this Linux desktop environment: {err} — the app will keep running without a tray icon"
                );
                Ok(())
            }
            #[cfg(not(target_os = "linux"))]
            {
                Err(err)
            }
        }
    }
}

/// Builds the tray context menu. Item ids mirror the `TRAY_ITEMS` array
/// declared in `apps/dashboard/src/config/desktop.config.ts` — the two
/// stay in lock-step so the renderer can look up the label key from a
/// single source.
fn build_tray_menu<R: Runtime>(app: &AppHandle<R>) -> tauri::Result<Menu<R>> {
    let open = MenuItem::with_id(app, "tray.open", "Show Academorix", true, None::<&str>)?;

    let new_athlete = MenuItem::with_id(app, "tray.new_athlete", "New Athlete", true, None::<&str>)?;
    let new_session = MenuItem::with_id(app, "tray.new_session", "New Session", true, None::<&str>)?;

    let check_updates = MenuItem::with_id(
        app,
        "tray.check_updates",
        "Check for updates",
        true,
        None::<&str>,
    )?;
    let sign_out = MenuItem::with_id(app, "tray.sign_out", "Sign out", true, None::<&str>)?;
    let quit = MenuItem::with_id(app, "tray.quit", "Quit Academorix", true, Some("CmdOrCtrl+Q"))?;

    let sep = PredefinedMenuItem::separator(app)?;

    let menu = Menu::with_items(
        app,
        &[
            &open,
            &sep,
            &new_athlete,
            &new_session,
            &sep,
            &check_updates,
            &sign_out,
            &sep,
            &quit,
        ],
    )?;

    Ok(menu)
}

/// Raises the main window: makes sure it is visible, un-minimizes it,
/// and takes keyboard focus. Called by the "Show Academorix" tray entry
/// and by left-clicking the tray icon.
fn raise_main_window<R: Runtime>(app: &AppHandle<R>) {
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.unminimize();
        let _ = window.show();
        let _ = window.set_focus();
    } else {
        log::warn!("tray raise requested but 'main' window is missing");
    }
}
