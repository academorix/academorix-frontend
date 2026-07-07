//! # IPC command handlers.
//!
//! Rust-side handlers for `#[tauri::command]` calls the renderer makes via
//! `@tauri-apps/api/core::invoke`. Kept intentionally small in Phase 1/2:
//! the only production handler right now is [`menu_command`], which the
//! renderer's `native-menu.ts` bridge calls when the menu registry wants
//! to route a menu-generated intent through the shell (e.g. to trigger a
//! Rust-side side effect like `quit` or `unminimize` that the SPA cannot
//! do on its own).
//!
//! ## Extending
//!
//! Each new command is `#[tauri::command]` plus a line in the
//! `generate_handler![...]` macro invocation in `lib.rs::run`. Keep the
//! Rust-side function names in `snake_case`; the renderer calls them via
//! the same snake_case identifier (Tauri v2 dropped v1's camelCase
//! translation).

use tauri::{AppHandle, Runtime};

use crate::emit_menu_command;

/// Menu-command bridge. The renderer's `native-menu.ts` calls this with
/// `invoke("menu_command", { id: "app.preferences" })` when it wants the
/// shell to re-emit the click through the same `menu-command` IPC event
/// the native menu bar uses — useful for tests and for programmatic menu
/// activation from the command palette.
///
/// The handler is a no-op passthrough in Phase 1/2: it fires the event
/// and returns. Real Rust-side dispatch (e.g. `id == "app.quit"` → call
/// `app.exit(0)`) lands alongside the concrete commands in Phase 3.
#[tauri::command]
pub async fn menu_command<R: Runtime>(app: AppHandle<R>, id: String) -> Result<(), String> {
    log::info!("renderer invoked menu_command with id={id}");
    emit_menu_command(&app, id, "renderer");
    Ok(())
}
