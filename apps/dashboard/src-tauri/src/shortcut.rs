//! # Global keyboard shortcuts — Phase 3 stub.
//!
//! Registers the OS-wide raise-app hotkey defined in
//! `apps/dashboard/src/config/desktop.config.ts` (`GLOBAL_SHORTCUT`).
//! Users can override the binding under `Settings → Desktop` (Phase 3
//! UX). Full design lives in `DESKTOP_PLAN.md` §3.3.
//!
//! ## Status
//!
//! Phase 1/2: no runtime code. `tauri-plugin-global-shortcut` is declared
//! as a dependency in `Cargo.toml` so the binary is self-contained, but
//! the actual registration is gated on the `phase3` cargo feature.

/// Register the global raise-app hotkey (`Cmd/Ctrl+Shift+A` by default).
/// Phase 3 implements the callback that raises + focuses the main window
/// when the shortcut fires from any application.
#[cfg(feature = "phase3")]
pub fn init<R: tauri::Runtime>(app: &tauri::AppHandle<R>) -> tauri::Result<()> {
    log::info!(
        "[phase3] shortcut::init — scaffold only; will register '{}' in Phase 3",
        crate::GLOBAL_SHORTCUT
    );
    let _ = app;
    Ok(())
}
