//! # Native OS notifications — Phase 3 stub.
//!
//! Sends notifications through `tauri-plugin-notification` (macOS
//! Notification Center, Windows Action Center, Linux DBus/notify-send).
//! Full delivery matrix + fallback rules live in `NOTIFICATIONS_PLAN.md`
//! §7 and §11 Phase 4.
//!
//! ## Status
//!
//! Phase 1/2: no runtime code. The renderer's
//! `src/desktop/notifications.ts` already exposes `showNativeNotification`
//! as a no-op on the JS side. Enabling the `phase3` cargo feature will
//! wire Rust-side helpers for background notifications (fired from event
//! listeners in the shell that can't round-trip through the SPA — e.g. a
//! push received while the webview is unfocused).

/// Initialise the notification subsystem. Currently a log-only stub.
/// Phase 3 hooks the plugin's `sendNotification` command up to the
/// Reverb-received push events forwarded by the renderer.
#[cfg(feature = "phase3")]
pub fn init<R: tauri::Runtime>(app: &tauri::AppHandle<R>) -> tauri::Result<()> {
    log::info!("[phase3] notification::init — scaffold only; will wire OS notifications in Phase 3");
    let _ = app;
    Ok(())
}
