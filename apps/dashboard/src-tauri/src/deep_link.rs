//! # Deep-link handling — Phase 3 stub.
//!
//! Registers the `academorix://` URL scheme with the OS and routes
//! incoming URLs through to the renderer via the `deep-link-received`
//! IPC event. Full route table lives in `DESKTOP_PLAN.md` §4.5; the
//! router itself is TypeScript-side (`src/lib/desktop/deep-link-router.ts`
//! — to be created in Phase 3).
//!
//! ## Status
//!
//! Phase 1/2: this file compiles into the binary but [`init`] only exists
//! behind the `phase3` cargo feature. Enabling it wires
//! `tauri-plugin-deep-link` and forwards incoming URLs to the renderer.
//!
//! ## Why keep the file when the impl is gated
//!
//! Two reasons:
//!
//! 1. The `mod deep_link;` declaration in `lib.rs` compiles regardless of
//!    feature state, keeping the module graph stable. New contributors
//!    can look up "where does deep-linking live?" in one grep.
//! 2. The heavy docblock here is the design record for Phase 3. Deleting
//!    the file until Phase 3 would push the same knowledge into a plan
//!    document that nobody rebuilds against.

/// Initialize the deep-link plugin. Real implementation lands with
/// `DESKTOP_PLAN.md` Phase 3 — for now it just logs and returns.
///
/// Signature is stable — Phase 3 fills in the body without touching the
/// caller in `lib.rs::setup`.
#[cfg(feature = "phase3")]
pub fn init<R: tauri::Runtime>(app: &tauri::AppHandle<R>) -> tauri::Result<()> {
    log::info!("[phase3] deep_link::init — scaffold only; will register academorix:// scheme in Phase 3");
    let _ = app; // silence unused warning until the real impl lands
    Ok(())
}
