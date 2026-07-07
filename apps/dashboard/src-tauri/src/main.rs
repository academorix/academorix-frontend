//! # Academorix dashboard — desktop binary entrypoint.
//!
//! Thin wrapper that just calls [`academorix_dashboard_lib::run`]. Every
//! bit of real logic (builder wiring, menu, tray, IPC) lives in `lib.rs`
//! so:
//!
//! - `cargo tauri android/ios` picks up the same code via
//!   `#[cfg_attr(mobile, tauri::mobile_entry_point)]` on the library `run`.
//! - Integration tests can call `academorix_dashboard_lib::run` directly
//!   without pulling in the binary target.
//! - The binary stays tiny, so `cargo check` on the workspace is fast.
//!
//! Do NOT add plugin registrations or setup hooks here. Everything belongs
//! in `lib.rs`.

// Suppresses the extra command-prompt window that would otherwise flash on
// Windows when the app launches. macOS + Linux ignore this attribute.
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    academorix_dashboard_lib::run();
}
