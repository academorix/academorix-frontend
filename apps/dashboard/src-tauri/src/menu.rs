//! # Native application menu bar.
//!
//! Builds the platform-neutral menu tree (macOS-style menu bar on Tauri,
//! adapted per-OS by Tauri's `Menu` API) and installs it on the current
//! app. Every static item that the user
//! activates fires an `menu-command` IPC event carrying the command id;
//! the renderer's `native-menu.ts` bridge dispatches to the menu registry
//! declared in `src/config/menu.config.ts`.
//!
//! ## Static seed labels
//!
//! Labels here are English fallbacks. When the SPA's `LocaleProvider`
//! switches language it fires the `locale-changed` IPC event; Phase 2b
//! will listen for that and call `MenuItem::set_text` on every item.
//! Today the listener is a stub — see `lib.rs::setup_ipc_listeners`.
//!
//! ## Dynamic entries
//!
//! The `Navigate` submenu is populated dynamically at runtime from the
//! renderer via IPC (coordinated with the Menus sub-agent's
//! `native-menu.ts` adapter). Phase 1 ships the empty submenu; the real
//! entries appear once the renderer sends them.

use tauri::menu::{Menu, MenuItem, PredefinedMenuItem, Submenu};
use tauri::{AppHandle, Runtime};

use crate::emit_menu_command;

/// Installs the platform-neutral menu tree on the app handle. On macOS
/// this becomes the app-wide menu bar shown at the top of the screen; on
/// Windows/Linux it sits inside the main window's title strip.
///
/// The menu is a set-and-forget structure — items don't need to be
/// rebuilt per window, and the click handler is wired via
/// `AppHandle::on_menu_event` (attached once, fires for every click).
pub fn install_menu<R: Runtime>(app: &AppHandle<R>) -> tauri::Result<()> {
    let menu = build_menu(app)?;
    app.set_menu(menu)?;

    // Global handler — fires for every clickable menu item regardless of
    // which submenu it lives in. We forward the id to the renderer so the
    // menu registry can dispatch to the actual command implementation.
    let handle = app.clone();
    app.on_menu_event(move |_app, event| {
        let id = event.id().as_ref();
        log::info!("menu clicked: {id}");
        emit_menu_command(&handle, id, "native");
    });

    Ok(())
}

/// Constructs the full menu tree. Split out from [`install_menu`] so
/// tests can inspect the returned menu without side effects.
fn build_menu<R: Runtime>(app: &AppHandle<R>) -> tauri::Result<Menu<R>> {
    let menu = Menu::new(app)?;

    menu.append(&build_application_menu(app)?)?;
    menu.append(&build_file_menu(app)?)?;
    menu.append(&build_edit_menu(app)?)?;
    menu.append(&build_view_menu(app)?)?;
    menu.append(&build_navigate_menu(app)?)?;
    menu.append(&build_window_menu(app)?)?;
    menu.append(&build_help_menu(app)?)?;

    Ok(menu)
}

// ---------------------------------------------------------------------------
// Individual submenus. Each one returns a fully-populated Submenu so
// build_menu just stitches them together.
// ---------------------------------------------------------------------------

/// Application submenu. On macOS this becomes the special first slot
/// (the one that always shows the app name in bold). On Windows/Linux
/// it's a regular submenu titled `Academorix`.
fn build_application_menu<R: Runtime>(app: &AppHandle<R>) -> tauri::Result<Submenu<R>> {
    let about = MenuItem::with_id(app, "app.about", "About Academorix", true, None::<&str>)?;
    let preferences = MenuItem::with_id(
        app,
        "app.preferences",
        "Preferences…",
        true,
        Some("CmdOrCtrl+,"),
    )?;
    let separator = PredefinedMenuItem::separator(app)?;
    let quit = MenuItem::with_id(app, "app.quit", "Quit Academorix", true, Some("CmdOrCtrl+Q"))?;

    Submenu::with_items(
        app,
        "Academorix",
        true,
        &[&about, &separator, &preferences, &separator, &quit],
    )
}

/// File submenu. Seed labels are the "new resource" verbs — the Menus
/// sub-agent will extend this dynamically once the resource registry
/// hydrates.
fn build_file_menu<R: Runtime>(app: &AppHandle<R>) -> tauri::Result<Submenu<R>> {
    let new_workspace = MenuItem::with_id(
        app,
        "workspace.new",
        "New Workspace…",
        true,
        Some("CmdOrCtrl+Shift+W"),
    )?;
    let new_athlete = MenuItem::with_id(app, "athlete.create", "New Athlete", true, None::<&str>)?;
    let new_session = MenuItem::with_id(app, "session.create", "New Session", true, None::<&str>)?;
    let sep = PredefinedMenuItem::separator(app)?;
    let import = MenuItem::with_id(app, "file.import", "Import…", true, Some("CmdOrCtrl+I"))?;
    let export = MenuItem::with_id(
        app,
        "file.export",
        "Export…",
        true,
        Some("CmdOrCtrl+Shift+E"),
    )?;

    Submenu::with_items(
        app,
        "File",
        true,
        &[
            &new_workspace,
            &sep,
            &new_athlete,
            &new_session,
            &sep,
            &import,
            &export,
        ],
    )
}

/// Edit submenu — uses Tauri's predefined items so the actual clipboard
/// ops go through the OS's native cut/copy/paste plumbing (respects the
/// user's system-level shortcut overrides).
fn build_edit_menu<R: Runtime>(app: &AppHandle<R>) -> tauri::Result<Submenu<R>> {
    let undo = PredefinedMenuItem::undo(app, None)?;
    let redo = PredefinedMenuItem::redo(app, None)?;
    let sep = PredefinedMenuItem::separator(app)?;
    let cut = PredefinedMenuItem::cut(app, None)?;
    let copy = PredefinedMenuItem::copy(app, None)?;
    let paste = PredefinedMenuItem::paste(app, None)?;
    let select_all = PredefinedMenuItem::select_all(app, None)?;

    Submenu::with_items(
        app,
        "Edit",
        true,
        &[&undo, &redo, &sep, &cut, &copy, &paste, &sep, &select_all],
    )
}

/// View submenu — toggles for the sidebar / palette / theme / full screen.
fn build_view_menu<R: Runtime>(app: &AppHandle<R>) -> tauri::Result<Submenu<R>> {
    let toggle_sidebar = MenuItem::with_id(
        app,
        "view.toggle_sidebar",
        "Toggle Sidebar",
        true,
        Some("CmdOrCtrl+\\"),
    )?;
    let palette = MenuItem::with_id(
        app,
        "view.command_palette",
        "Command Palette…",
        true,
        Some("CmdOrCtrl+K"),
    )?;
    let sep = PredefinedMenuItem::separator(app)?;
    let toggle_theme = MenuItem::with_id(
        app,
        "view.toggle_theme",
        "Toggle Theme",
        true,
        Some("CmdOrCtrl+Shift+T"),
    )?;
    let fullscreen = PredefinedMenuItem::fullscreen(app, None)?;

    Submenu::with_items(
        app,
        "View",
        true,
        &[&toggle_sidebar, &palette, &sep, &toggle_theme, &fullscreen],
    )
}

/// Navigate submenu — populated dynamically at runtime from the renderer
/// (see menus module). Ships empty in Phase 2; the Menus
/// sub-agent's bridge sends `menu.set_items` messages once its
/// `AppResourceShortcuts` registry hydrates.
fn build_navigate_menu<R: Runtime>(app: &AppHandle<R>) -> tauri::Result<Submenu<R>> {
    // Placeholder so the menu isn't empty on Phase 1 launches. Real
    // entries land alongside the resource registry.
    let dashboard = MenuItem::with_id(
        app,
        "nav.dashboard",
        "Go to Dashboard",
        true,
        None::<&str>,
    )?;

    Submenu::with_items(app, "Navigate", true, &[&dashboard])
}

/// Window submenu — uses Tauri's predefined items for platform-native
/// behaviour on macOS (`Bring All to Front`, etc.).
fn build_window_menu<R: Runtime>(app: &AppHandle<R>) -> tauri::Result<Submenu<R>> {
    let minimize = PredefinedMenuItem::minimize(app, None)?;
    let maximize = PredefinedMenuItem::maximize(app, None)?;
    let sep = PredefinedMenuItem::separator(app)?;
    let close = PredefinedMenuItem::close_window(app, None)?;

    Submenu::with_items(
        app,
        "Window",
        true,
        &[&minimize, &maximize, &sep, &close],
    )
}

/// Help submenu — docs + shortcuts + tour + issue link. Static entries
/// only; the "Check for updates" item lives in the tray menu (see
/// `tray.rs`) so it can react to the updater plugin state.
fn build_help_menu<R: Runtime>(app: &AppHandle<R>) -> tauri::Result<Submenu<R>> {
    let docs = MenuItem::with_id(app, "help.docs", "Documentation", true, None::<&str>)?;
    let shortcuts = MenuItem::with_id(
        app,
        "help.keyboard_shortcuts",
        "Keyboard Shortcuts",
        true,
        Some("?"),
    )?;
    let restart_tour = MenuItem::with_id(
        app,
        "help.restart_tour",
        "Restart Tour",
        true,
        None::<&str>,
    )?;
    let report_issue = MenuItem::with_id(
        app,
        "help.report_issue",
        "Report an Issue…",
        true,
        None::<&str>,
    )?;
    let sep = PredefinedMenuItem::separator(app)?;
    let about = MenuItem::with_id(
        app,
        "help.about",
        "About Academorix",
        true,
        None::<&str>,
    )?;

    Submenu::with_items(
        app,
        "Help",
        true,
        &[&docs, &shortcuts, &restart_tour, &report_issue, &sep, &about],
    )
}
