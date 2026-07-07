//! # Cargo build script — Academorix dashboard desktop shell.
//!
//! Runs during every `cargo build` (and every `cargo check`) BEFORE the crate
//! itself compiles. Two responsibilities, both mandatory:
//!
//! 1. **Wire Tauri's own build machinery** via [`tauri_build::build`]. That
//!    call reads `tauri.conf.json`, generates the platform-specific manifest
//!    bindings (Windows resource file, macOS Info.plist, Linux .desktop), and
//!    validates that the frontendDist path exists at build time. Without this
//!    call the resulting binary would panic at startup complaining about a
//!    missing generated context.
//!
//! 2. **Deserialize `desktop-config.json`** — the snapshot generated from
//!    `src/config/desktop.config.ts` by the `sync:desktop-config` pnpm script
//!    (see `apps/dashboard/scripts/sync-desktop-config.mjs`) — and emit a
//!    Rust source file at `$OUT_DIR/desktop_config.rs` containing typed
//!    constants that `main.rs` / `lib.rs` pull in via `include!()`. This
//!    keeps the Rust shell and the TypeScript SPA reading the same
//!    window-sizing, tray, updater, and logging knobs without a runtime IPC
//!    round-trip.
//!
//! ## Why generate a Rust file (not deserialize at runtime)
//!
//! Runtime deserialization would either (a) require shipping the JSON blob in
//! the final binary via `include_str!` and paying a JSON parse cost every
//! launch, or (b) require the binary to look for the JSON on disk at startup
//! — brittle across install layouts (macOS `.app` bundle vs Windows
//! `Program Files` vs Linux `/opt`). Compile-time codegen gives us zero-cost
//! constants the Rust compiler can inline into the binary.
//!
//! ## Rebuild trigger
//!
//! The `cargo:rerun-if-changed` directives at the bottom of `main()` make
//! sure Cargo rebuilds this crate whenever the JSON snapshot or the Tauri
//! config changes — otherwise editing `desktop-config.json` would silently
//! keep the old baked-in constants until a `cargo clean`.

use std::env;
use std::fs;
use std::path::Path;

use serde::Deserialize;

// ---------------------------------------------------------------------------
// JSON schema — mirrors `src/config/desktop.config.ts`.
// ---------------------------------------------------------------------------
//
// Only the fields the Rust shell needs at compile time are modeled here. The
// SPA-side fields (allowedShellUrls, tray label keys, etc.) are read by the
// TS layer directly; duplicating them here would just add drift risk.

/// Root schema for `desktop-config.json`.
#[derive(Debug, Deserialize)]
struct DesktopConfig {
    app: AppSection,
    window: WindowSection,
    tray: TraySection,
    updater: UpdaterSection,
    logging: LoggingSection,
}

/// `app.*` — protocol + global shortcut identifiers.
#[derive(Debug, Deserialize)]
struct AppSection {
    protocol: String,
    #[serde(rename = "globalShortcut")]
    global_shortcut: String,
}

/// `window.*` — dimensions + persistence flag.
#[derive(Debug, Deserialize)]
struct WindowSection {
    default: WindowDefaults,
    #[serde(rename = "restoreState")]
    restore_state: bool,
    #[serde(rename = "closeBehaviour")]
    close_behaviour: String,
}

/// `window.default.*` — the concrete pixel dimensions.
#[derive(Debug, Deserialize)]
struct WindowDefaults {
    width: f64,
    height: f64,
    #[serde(rename = "minWidth")]
    min_width: f64,
    #[serde(rename = "minHeight")]
    min_height: f64,
}

/// `tray.*` — enable flag; the individual items are consumed by the SPA
/// (label localisation lives in the message catalog), so only the on/off
/// switch matters to the Rust shell.
#[derive(Debug, Deserialize)]
struct TraySection {
    enabled: bool,
}

/// `updater.*` — feed URL is used at runtime by the Phase 4 updater plugin;
/// the interval is used to schedule the background check.
#[derive(Debug, Deserialize)]
struct UpdaterSection {
    enabled: bool,
    #[serde(rename = "feedUrl")]
    feed_url: String,
    #[serde(rename = "intervalMs")]
    interval_ms: u64,
}

/// `logging.*` — passes the desired log level through to `tauri-plugin-log`.
#[derive(Debug, Deserialize)]
struct LoggingSection {
    level: String,
}

// ---------------------------------------------------------------------------
// Entrypoint
// ---------------------------------------------------------------------------

/// Cargo build-script entry. Any panic here fails `cargo build` — which is
/// exactly what we want: a malformed `desktop-config.json` must never yield
/// a runnable binary with stale constants.
fn main() {
    // 1. Tauri's own build machinery.
    tauri_build::build();

    // 2. Read + deserialize the desktop config snapshot.
    let manifest_dir = env::var("CARGO_MANIFEST_DIR")
        .expect("CARGO_MANIFEST_DIR is always set by Cargo during a build script");
    let config_path = Path::new(&manifest_dir).join("desktop-config.json");
    let raw = fs::read_to_string(&config_path).unwrap_or_else(|err| {
        panic!(
            "desktop-config.json missing at {} — run 'pnpm --filter @academorix/dashboard sync:desktop-config' before 'cargo build'. Underlying error: {err}",
            config_path.display()
        )
    });
    let config: DesktopConfig = serde_json::from_str(&raw).unwrap_or_else(|err| {
        panic!(
            "desktop-config.json at {} is not valid JSON matching the expected schema: {err}",
            config_path.display()
        )
    });

    // 3. Emit the generated Rust constants into $OUT_DIR/desktop_config.rs.
    let out_dir = env::var("OUT_DIR").expect("OUT_DIR is always set by Cargo");
    let generated = Path::new(&out_dir).join("desktop_config.rs");
    let body = render_constants(&config);
    fs::write(&generated, body).unwrap_or_else(|err| {
        panic!(
            "failed to write generated desktop_config.rs to {}: {err}",
            generated.display()
        )
    });

    // 4. Tell Cargo when to rerun this script. Editing the JSON snapshot,
    //    the Tauri config, or this script itself all trigger a rebuild —
    //    everything else uses the standard source-file dependency graph.
    println!("cargo:rerun-if-changed=desktop-config.json");
    println!("cargo:rerun-if-changed=tauri.conf.json");
    println!("cargo:rerun-if-changed=build.rs");
}

/// Renders the deserialized config into a self-contained Rust snippet with
/// heavy comments. The output is included from `lib.rs` via
/// `include!(concat!(env!("OUT_DIR"), "/desktop_config.rs"))`.
///
/// Every constant is `pub` so `main.rs` (which lives outside the module
/// `lib.rs` where the include lands) can also reference them via the
/// crate's library.
fn render_constants(config: &DesktopConfig) -> String {
    // Convert the log-level string to a `tauri_plugin_log::LogLevel` variant.
    // Falls back to `Info` when the input is unrecognised so a typo never
    // breaks the build silently.
    let log_level_variant = match config.logging.level.as_str() {
        "error" => "Error",
        "warn" => "Warn",
        "info" => "Info",
        "debug" => "Debug",
        "trace" => "Trace",
        _ => "Info",
    };

    // Close behaviour is a stringly-typed enum on the TS side; project it
    // onto an all-caps Rust identifier so the shell can `match` on it.
    let close_behaviour_variant = match config.window.close_behaviour.as_str() {
        "hide" => "Hide",
        _ => "Quit",
    };

    format!(
        "// Generated by build.rs from `desktop-config.json`. Do not edit.\n\
         // Regenerate via `pnpm --filter @academorix/dashboard sync:desktop-config`\n\
         // followed by `cargo build`.\n\
         \n\
         /// Deep-link URL scheme (case-insensitive on all three OSes).\n\
         pub const DEEP_LINK_SCHEME: &str = {scheme:?};\n\
         \n\
         /// Global raise-app hotkey. Overridable by the user in Phase 3.\n\
         pub const GLOBAL_SHORTCUT: &str = {shortcut:?};\n\
         \n\
         /// Main-window width in logical pixels.\n\
         pub const WINDOW_WIDTH: f64 = {width}_f64;\n\
         /// Main-window height in logical pixels.\n\
         pub const WINDOW_HEIGHT: f64 = {height}_f64;\n\
         /// Minimum width users can shrink the main window to.\n\
         pub const WINDOW_MIN_WIDTH: f64 = {min_width}_f64;\n\
         /// Minimum height users can shrink the main window to.\n\
         pub const WINDOW_MIN_HEIGHT: f64 = {min_height}_f64;\n\
         \n\
         /// Persist window position + size across launches.\n\
         pub const WINDOW_RESTORE_STATE: bool = {restore_state};\n\
         \n\
         /// What to do when the user clicks the close button. See\n\
         /// `desktop.config.ts` `window.closeBehaviour` for the source.\n\
         #[allow(dead_code)]\n\
         #[derive(Debug, Clone, Copy, PartialEq, Eq)]\n\
         pub enum CloseBehaviour {{\n\
         \x20\x20\x20\x20/// Terminate the process on close (Windows/Linux default).\n\
         \x20\x20\x20\x20Quit,\n\
         \x20\x20\x20\x20/// Hide to the tray on close (macOS default).\n\
         \x20\x20\x20\x20Hide,\n\
         }}\n\
         /// Configured close behaviour.\n\
         pub const CLOSE_BEHAVIOUR: CloseBehaviour = CloseBehaviour::{close_behaviour_variant};\n\
         \n\
         /// Tray icon on/off — respected by [`setup_tray`].\n\
         pub const TRAY_ENABLED: bool = {tray_enabled};\n\
         \n\
         /// Auto-updater on/off. Wired in Phase 4.\n\
         #[allow(dead_code)]\n\
         pub const UPDATER_ENABLED: bool = {updater_enabled};\n\
         /// Auto-updater manifest URL. Wired in Phase 4.\n\
         #[allow(dead_code)]\n\
         pub const UPDATER_FEED_URL: &str = {updater_feed_url:?};\n\
         /// Poll cadence in milliseconds. Wired in Phase 4.\n\
         #[allow(dead_code)]\n\
         pub const UPDATER_INTERVAL_MS: u64 = {updater_interval_ms}_u64;\n\
         \n\
         /// Log level string — projected onto `tauri_plugin_log::LogLevel`.\n\
         #[allow(dead_code)]\n\
         pub const LOG_LEVEL_NAME: &str = {log_level_name:?};\n\
         \n\
         /// The `tauri_plugin_log::LogLevel` variant that matches the\n\
         /// configured level. Falls back to `Info` on unrecognised input.\n\
         #[allow(dead_code)]\n\
         pub const LOG_LEVEL: log::LevelFilter = log::LevelFilter::{log_level_variant};\n",
        scheme = config.app.protocol,
        shortcut = config.app.global_shortcut,
        width = config.window.default.width,
        height = config.window.default.height,
        min_width = config.window.default.min_width,
        min_height = config.window.default.min_height,
        restore_state = config.window.restore_state,
        close_behaviour_variant = close_behaviour_variant,
        tray_enabled = config.tray.enabled,
        updater_enabled = config.updater.enabled,
        updater_feed_url = config.updater.feed_url,
        updater_interval_ms = config.updater.interval_ms,
        log_level_name = config.logging.level,
        log_level_variant = log_level_variant,
    )
}
