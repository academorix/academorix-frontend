/**
 * @file broadcast.tsx
 * @module modules/dashboard/pages/broadcast
 *
 * @description
 * Public broadcast viewer — the new home for share links since the
 * Phase-1 landing. One route (`/broadcast/:token`) handles four
 * distinct states in a single mount:
 *
 *   1. **Loading** — resolving the token against the storage adapter.
 *   2. **Locked** — the token carries a `passwordHash`; render an
 *      unlock gate that mints a `sessionKey` on success.
 *   3. **Ready (embed)** — a single dashboard rendered chromeless,
 *      matching the historical `/embed/dashboard/:token` shape.
 *   4. **Ready (present)** — a full-viewport kiosk slideshow that
 *      rotates through every dashboard the broadcast owner pinned
 *      to the link.
 *
 * The old `/embed/dashboard/:token` route still resolves for links
 * minted before Phase-1 — it delegates to this component with the
 * `mode="legacy-embed"` prop so viewers with existing links don't
 * see a break.
 *
 * Auto-refresh (owner-configured `refreshMs`) is honoured by the
 * embed branch — the present branch polls per-slide instead so
 * cadence still tracks rotation.
 *
 * Session persistence: the unlock handshake stashes the sessionKey
 * in `sessionStorage` under a per-token key so a reload inside the
 * TTL window skips the gate.
 */

import { Button, Chip, Input, Label, Spinner, TextField, toast } from "@heroui/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "@stackra/routing/react";

import type { PublicEmbedDashboard } from "@/modules/dashboard/dashboards";
import type { ReactNode } from "react";

import { BrandIsotipo, brand } from "@/brand";
import { Iconify } from "@/icons/iconify";
import { DashboardCanvas } from "@/modules/dashboard/components/dashboard-canvas";
import {
  dashboardStorage,
  EmbedTokenInvalidError,
  EmbedTokenPasswordRequiredError,
} from "@/modules/dashboard/dashboards";

/** sessionStorage prefix for cached unlock handshakes. */
const SESSION_KEY_PREFIX = "academorix.broadcast.session.";

/** Sensible default refresh floor to avoid hammering storage. */
const MIN_REFRESH_MS = 5_000;

type BroadcastState =
  | { status: "loading" }
  | { status: "locked" }
  | { status: "invalid" }
  | { status: "ready"; dashboard: PublicEmbedDashboard };

/** Read the cached unlock session for a token, discarding expired ones. */
function readCachedSession(token: string): string | undefined {
  if (typeof window === "undefined") return undefined;

  try {
    const raw = window.sessionStorage.getItem(SESSION_KEY_PREFIX + token);

    if (!raw) return undefined;

    const parsed = JSON.parse(raw) as { sessionKey?: string; expiresAt?: string };

    if (!parsed.sessionKey || !parsed.expiresAt) return undefined;
    if (new Date(parsed.expiresAt).getTime() <= Date.now()) return undefined;

    return parsed.sessionKey;
  } catch {
    return undefined;
  }
}

/** Persist an unlock session against a token so a reload skips the gate. */
function writeCachedSession(token: string, sessionKey: string, expiresAt: string): void {
  if (typeof window === "undefined") return;

  try {
    window.sessionStorage.setItem(
      SESSION_KEY_PREFIX + token,
      JSON.stringify({ sessionKey, expiresAt }),
    );
  } catch {
    // sessionStorage may be blocked (private mode / disabled) — the
    // viewer just re-enters the password next time. No fatal path.
  }
}

/** Wipe the cached session — used after a wrong-password attempt. */
function clearCachedSession(token: string): void {
  if (typeof window === "undefined") return;

  try {
    window.sessionStorage.removeItem(SESSION_KEY_PREFIX + token);
  } catch {
    // ignore
  }
}

interface BroadcastRouteProps {
  /**
   * When rendered under the historical `/embed/dashboard/:token`
   * path, the header wording softens ("Public view") so returning
   * viewers hitting bookmarks don't see the newer "Broadcast"
   * copy. Feature-wise the two paths are identical.
   */
  legacyEmbed?: boolean;
}

export default function BroadcastRoute({
  legacyEmbed = false,
}: BroadcastRouteProps = {}): ReactNode {
  const { token } = useParams<{ token: string }>();
  const [state, setState] = useState<BroadcastState>({ status: "loading" });
  const sessionKeyRef = useRef<string | undefined>(undefined);

  // ---------------------------------------------------------------------
  // Resolver — one function reused by the initial mount, the
  // password-gate submit, and the refresh clock.
  // ---------------------------------------------------------------------

  const resolve = useCallback(
    async (currentToken: string, sessionKey: string | undefined): Promise<void> => {
      try {
        const payload = await dashboardStorage.resolveEmbedToken(currentToken, sessionKey);

        setState({ status: "ready", dashboard: payload });
      } catch (caught: unknown) {
        if (caught instanceof EmbedTokenPasswordRequiredError) {
          setState({ status: "locked" });

          return;
        }

        // Any invalid / revoked / expired / unknown-error state
        // collapses to "invalid" so a viewer can't tell WHY a
        // link is dead (an attacker probing tokens would exploit
        // that leak).
        if (caught instanceof EmbedTokenInvalidError) {
          setState({ status: "invalid" });

          return;
        }

        setState({ status: "invalid" });
      }
    },
    [],
  );

  // Boot the first resolve on mount + whenever the token changes.
  useEffect(() => {
    if (!token) {
      setState({ status: "invalid" });

      return;
    }

    const cached = readCachedSession(token);

    sessionKeyRef.current = cached;
    setState({ status: "loading" });
    void resolve(token, cached);
  }, [token, resolve]);

  // ---------------------------------------------------------------------
  // Auto-refresh clock — honours the owner's `refreshMs` policy.
  // Only runs in the ready state so the gate + invalid pages stay
  // static.
  // ---------------------------------------------------------------------

  const refreshMs = state.status === "ready" ? state.dashboard.broadcast?.refreshMs : undefined;

  useEffect(() => {
    if (state.status !== "ready") return;
    if (!refreshMs || refreshMs < MIN_REFRESH_MS) return;
    if (!token) return;

    const timer = window.setInterval(() => {
      void resolve(token, sessionKeyRef.current);
    }, refreshMs);

    return () => window.clearInterval(timer);
  }, [state.status, refreshMs, token, resolve]);

  // ---------------------------------------------------------------------
  // Rendering
  // ---------------------------------------------------------------------

  if (state.status === "loading") {
    return (
      <BroadcastShell>
        <div className="flex min-h-[60vh] items-center justify-center">
          <Spinner color="accent" size="lg" />
        </div>
      </BroadcastShell>
    );
  }

  if (state.status === "invalid") {
    return (
      <BroadcastShell>
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border py-24 text-center">
          <Iconify className="size-10 text-muted" icon="link" />
          <div>
            <p className="text-lg font-semibold text-foreground">
              This share link isn&apos;t available.
            </p>
            <p className="mx-auto mt-1 max-w-md text-sm text-muted">
              The link may have expired, been revoked, or the dashboard is no longer shared. Contact
              the person who sent you the link for a new one.
            </p>
          </div>
        </div>
      </BroadcastShell>
    );
  }

  if (state.status === "locked") {
    return (
      <UnlockGate
        token={token ?? ""}
        onUnlocked={(key, expiresAt) => {
          writeCachedSession(token ?? "", key, expiresAt);
          sessionKeyRef.current = key;

          if (token) void resolve(token, key);
        }}
      />
    );
  }

  // Ready — split on the broadcast kind so present mode gets a
  // completely different chrome (kiosk canvas) from the embed shell.
  const kind = state.dashboard.broadcast?.kind ?? "embed";

  if (kind === "present") {
    return <BroadcastPresent dashboard={state.dashboard} />;
  }

  return (
    <BroadcastShell
      broadcast={state.dashboard.broadcast}
      legacyEmbed={legacyEmbed}
      name={state.dashboard.name}
    >
      <DashboardCanvas dashboard={state.dashboard} mode="readonly" />
    </BroadcastShell>
  );
}

/* -------------------------------------------------------------------------
 * Shell — chromeless header + footer wrapper shared by the loading,
 * invalid, and embed-ready states. Present-mode skips the shell.
 *
 * Phase-3 rendering layers are applied here so the loading /
 * invalid states remain untouched: the shell only decorates the
 * outer div when `broadcast` is passed in (i.e. the ready state).
 * ----------------------------------------------------------------------- */

function BroadcastShell({
  broadcast,
  children,
  legacyEmbed = false,
  name,
}: {
  broadcast?: PublicEmbedDashboard["broadcast"];
  children: ReactNode;
  legacyEmbed?: boolean;
  name?: string;
}): ReactNode {
  const decorations = useViewerDecorations(broadcast);
  const whitelabel = broadcast?.whitelabel;

  return (
    <div
      {...decorations.rootProps}
      className={
        "relative min-h-dvh bg-background text-foreground " +
        (decorations.rootProps.className ?? "")
      }
    >
      <header className="flex items-center gap-3 border-b border-border px-4 py-3 sm:px-6">
        {whitelabel?.logoUrl ? (
          <img
            alt=""
            aria-hidden
            className="size-6 shrink-0 object-contain"
            height={24}
            src={whitelabel.logoUrl}
            width={24}
          />
        ) : (
          <BrandIsotipo className="size-6" height={24} width={24} />
        )}
        <span className="text-sm font-semibold text-foreground">
          {whitelabel?.welcomeText ?? brand.name}
        </span>
        {name ? (
          <>
            <span aria-hidden className="mx-2 text-muted">
              /
            </span>
            <span className="text-sm text-foreground">{name}</span>
            <Chip className="ms-auto" size="sm" variant="soft">
              <Chip.Label>{legacyEmbed ? "Public view" : "Broadcast"}</Chip.Label>
            </Chip>
          </>
        ) : null}
      </header>

      <main className="mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8">{children}</main>

      <footer className="flex items-center justify-center gap-2 border-t border-border px-4 py-3 text-xs text-muted">
        <span>Powered by</span>
        <span className="font-medium text-foreground">{whitelabel?.welcomeText ?? brand.name}</span>
      </footer>

      {decorations.watermark ? <WatermarkOverlay text={decorations.watermark} /> : null}
    </div>
  );
}

/* -------------------------------------------------------------------------
 * Password gate — one-field form that calls unlockEmbedToken and
 * hands the sessionKey back up so the parent can flip to ready.
 * ----------------------------------------------------------------------- */

function UnlockGate({
  token,
  onUnlocked,
}: {
  token: string;
  onUnlocked: (sessionKey: string, expiresAt: string) => void;
}): ReactNode {
  const [password, setPassword] = useState("");
  const [isSubmitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);

  const submit = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();
      if (!token || !password.trim() || isSubmitting) return;

      setSubmitting(true);
      setError(undefined);

      try {
        const session = await dashboardStorage.unlockEmbedToken(token, { password });

        onUnlocked(session.sessionKey, session.expiresAt);
      } catch (caught) {
        clearCachedSession(token);
        // Never distinguish between "wrong password" and "unknown
        // token" — same message for both so an attacker can't
        // enumerate valid tokens by password-guessing.
        setError("That password doesn't match.");
      } finally {
        setSubmitting(false);
      }
    },
    [token, password, isSubmitting, onUnlocked],
  );

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-4 text-foreground">
      <form
        className="w-full max-w-sm rounded-2xl border border-border bg-surface p-6 shadow-lg"
        onSubmit={submit}
      >
        <div className="mb-4 flex items-center gap-3">
          <BrandIsotipo className="size-7" height={28} width={28} />
          <span className="text-sm font-semibold text-foreground">{brand.name}</span>
        </div>
        <div className="mb-5 flex flex-col gap-1">
          <div className="mb-2 flex size-9 items-center justify-center rounded-full bg-accent-soft text-accent-soft-foreground">
            <Iconify className="size-4" icon="lock" />
          </div>
          <p className="text-lg font-semibold text-foreground">Password required</p>
          <p className="text-sm leading-5 text-muted">
            This broadcast is protected. Enter the password shared with you to open it.
          </p>
        </div>

        <TextField isDisabled={isSubmitting} onChange={setPassword} value={password}>
          <Label>Password</Label>
          <Input autoFocus placeholder="••••••••" type="password" variant="secondary" />
        </TextField>

        {error ? <p className="mt-2 text-xs text-danger">{error}</p> : null}

        <Button
          className="mt-4 w-full"
          isDisabled={!password.trim() || isSubmitting}
          isPending={isSubmitting}
          size="sm"
          type="submit"
          variant="primary"
        >
          <Iconify className="size-4" icon="key" />
          Unlock
        </Button>

        <p className="mt-4 text-center text-[11px] text-muted">
          Trouble? Contact the person who sent you this link.
        </p>
      </form>
    </div>
  );
}

/* -------------------------------------------------------------------------
 * Present mode — kiosk canvas that rotates through the broadcast's
 * dashboards on the owner-configured cadence. Purely a viewer —
 * mutation is impossible outside the app.
 * ----------------------------------------------------------------------- */

function BroadcastPresent({ dashboard }: { dashboard: PublicEmbedDashboard }): ReactNode {
  const slides = useMemo<readonly PublicEmbedDashboard[]>(
    () => dashboard.broadcast?.dashboards ?? [dashboard],
    [dashboard],
  );

  const rotationSeconds = dashboard.broadcast?.rotationSeconds ?? 30;
  const rotationMs = Math.max(5, rotationSeconds) * 1000;

  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setPaused] = useState(false);
  const [playhead, setPlayhead] = useState(0);

  // Phase-3 protection + Phase-4 whitelabel — the kiosk canvas
  // needs the same overlay stack as the embed shell. We reuse the
  // shared hook so `disableCopy`, `piiMask`, and `accent` all
  // behave consistently across the two viewer surfaces.
  const decorations = useViewerDecorations(dashboard.broadcast);
  const whitelabel = dashboard.broadcast?.whitelabel;

  const goNext = useCallback(() => {
    if (slides.length === 0) return;
    setActiveIndex((current) => (current + 1) % slides.length);
    setPlayhead((n) => n + 1);
  }, [slides.length]);

  const goPrev = useCallback(() => {
    if (slides.length === 0) return;
    setActiveIndex((current) => (current - 1 + slides.length) % slides.length);
    setPlayhead((n) => n + 1);
  }, [slides.length]);

  // Rotation clock — single timeout per active slide, re-armed on
  // pause / manual navigate / interval change.
  useEffect(() => {
    if (isPaused || slides.length <= 1) return;

    const timer = window.setTimeout(() => {
      setActiveIndex((current) => (current + 1) % slides.length);
      setPlayhead((n) => n + 1);
    }, rotationMs);

    return () => window.clearTimeout(timer);
  }, [activeIndex, isPaused, rotationMs, slides.length]);

  // Keyboard shortcuts — same as the in-app presenter so the UX
  // stays consistent between authenticated + broadcast surfaces.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target;

      if (target instanceof HTMLElement) {
        if (
          target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable
        ) {
          return;
        }
      }

      switch (event.key) {
        case "ArrowLeft":
          event.preventDefault();
          goPrev();
          return;
        case "ArrowRight":
          event.preventDefault();
          goNext();
          return;
        case " ":
        case "Spacebar":
          event.preventDefault();
          setPaused((current) => !current);
          return;
        case "f":
        case "F":
          if (event.metaKey || event.ctrlKey || event.altKey) return;
          event.preventDefault();

          if (document.fullscreenElement) {
            document.exitFullscreen().catch(() => toast.warning("Couldn't exit fullscreen."));
          } else {
            document.documentElement
              .requestFullscreen()
              .catch(() => toast.warning("Couldn't enter fullscreen."));
          }
          return;
      }
    };

    window.addEventListener("keydown", onKey);

    return () => window.removeEventListener("keydown", onKey);
  }, [goNext, goPrev]);

  const active = slides[activeIndex];

  return (
    <div
      {...decorations.rootProps}
      className={
        "dark fixed inset-0 flex flex-col overflow-hidden bg-black text-foreground " +
        (decorations.rootProps.className ?? "")
      }
      data-theme="dark"
    >
      <main
        aria-live="polite"
        className="min-h-0 flex-1 overflow-auto px-6 py-10 sm:px-10 lg:px-14"
      >
        {active ? (
          <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-6">
            <header className="flex items-center gap-3">
              {whitelabel?.logoUrl ? (
                <img
                  alt=""
                  aria-hidden
                  className="size-6 shrink-0 object-contain opacity-80"
                  height={24}
                  src={whitelabel.logoUrl}
                  width={24}
                />
              ) : active.icon ? (
                <Iconify className="size-6 text-foreground opacity-80" icon={active.icon} />
              ) : null}
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                {whitelabel?.welcomeText
                  ? `${whitelabel.welcomeText} — ${active.name}`
                  : active.name}
              </h1>
              <span className="ms-auto text-sm text-muted tabular-nums">
                {activeIndex + 1} / {slides.length}
              </span>
            </header>
            <DashboardCanvas dashboard={active} mode="readonly" />
          </div>
        ) : null}
      </main>

      <div className="pointer-events-none absolute top-4 right-4 z-20">
        <div className="pointer-events-auto flex items-center gap-1.5 rounded-full border border-white/10 bg-black/70 p-1 shadow-xl backdrop-blur">
          <Button aria-label="Previous slide" onPress={goPrev} size="sm" variant="ghost">
            <Iconify className="size-4" icon="chevron-left" />
          </Button>
          <Button
            aria-label={isPaused ? "Resume" : "Pause"}
            onPress={() => setPaused((current) => !current)}
            size="sm"
            variant="ghost"
          >
            <Iconify className="size-4" icon={isPaused ? "play" : "pause"} />
          </Button>
          <Button aria-label="Next slide" onPress={goNext} size="sm" variant="ghost">
            <Iconify className="size-4" icon="chevron-right" />
          </Button>
        </div>
      </div>

      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 z-10 flex flex-col gap-1 border-t border-white/10 bg-black/60 px-6 py-2.5 backdrop-blur"
      >
        <div className="flex items-center gap-2 text-xs text-white/70">
          <span className="tabular-nums">
            {activeIndex + 1} / {slides.length}
          </span>
          <span aria-hidden>·</span>
          <span>{isPaused ? "Paused" : `Every ${rotationSeconds}s`}</span>
        </div>
        <div className="h-1 w-full overflow-hidden rounded-full bg-white/10">
          <div
            key={`${activeIndex}-${playhead}`}
            className="h-full origin-left bg-white/80"
            style={{
              animationName: "broadcast-progress",
              animationDuration: `${rotationSeconds}s`,
              animationTimingFunction: "linear",
              animationFillMode: "forwards",
              animationPlayState: isPaused ? "paused" : "running",
              transform: "scaleX(0)",
            }}
          />
        </div>
      </div>

      <style>{`
        @keyframes broadcast-progress {
          from { transform: scaleX(0); }
          to   { transform: scaleX(1); }
        }
      `}</style>

      {decorations.watermark ? <WatermarkOverlay text={decorations.watermark} /> : null}
    </div>
  );
}

/* -------------------------------------------------------------------------
 * Viewer decorations — Phase-3 data protection + Phase-4 whitelabel
 *
 * `useViewerDecorations` returns the props each viewer surface has
 * to spread on its outermost `<div>`, plus the watermark string (if
 * any) to hand to `<WatermarkOverlay />`. Kept as a hook so both
 * `BroadcastShell` (embed) and `BroadcastPresent` (kiosk) get the
 * same treatment from a single source of truth.
 *
 *   * `disableCopy` — attaches `onContextMenu` + `onDragStart`
 *     preventers, adds `select-none` to the className, and listens
 *     for PrintScreen keypresses. Screenshot detection is best-
 *     effort — the browser never reports a real intercept, so we
 *     just surface a toast + `console.warn` for the operator's
 *     audit trail.
 *   * `piiMask` — sets `data-pii-masked="true"` on the root. The
 *     paired CSS rules in `src/index.css` blur every child with
 *     `.pii-name` / `.pii-email`.
 *   * `whitelabel.accent` — set as an inline CSS variable so
 *     descendants inheriting `var(--accent)` pick up the override
 *     without a rebuild.
 * ----------------------------------------------------------------------- */

interface ViewerDecorations {
  /**
   * Props to spread on the outer viewer div. Consumers merge their
   * own `className` (via string concat) so the shell keeps its
   * layout classes.
   */
  rootProps: {
    className: string;
    style?: React.CSSProperties;
    onContextMenu?: React.MouseEventHandler;
    onDragStart?: React.DragEventHandler;
    "data-pii-masked"?: "true";
  };
  /**
   * The watermark string ready for rendering (`{brand}` and
   * `{date}` substituted). `undefined` when the owner didn't
   * enable a watermark.
   */
  watermark?: string;
}

function useViewerDecorations(
  broadcast: PublicEmbedDashboard["broadcast"] | undefined,
): ViewerDecorations {
  const disableCopy = broadcast?.disableCopy === true;
  const piiMask = broadcast?.piiMask === true;
  const watermarkPolicy = broadcast?.watermark;
  const whitelabel = broadcast?.whitelabel;

  // Screenshot detection — best-effort. Browsers don't report the
  // actual capture; we can only observe the modifier chord the user
  // typed. The toast + console.warn give the operator a hint that
  // the surface is being copied; the value is auditability, not
  // prevention.
  useEffect(() => {
    if (!disableCopy) return;

    const onKey = (event: KeyboardEvent): void => {
      // `PrintScreen` is the primary target — desktop Chrome /
      // Firefox / Edge all deliver it. Also flag common "capture
      // region" shortcuts on macOS + Windows so the audit hint
      // fires wider than just full-screen prints.
      const isPrintScreen = event.key === "PrintScreen";
      const isMacRegion =
        event.metaKey &&
        event.shiftKey &&
        (event.key === "4" || event.key === "3" || event.key === "5");
      const isWinSnip = event.shiftKey && event.metaKey && (event.key === "s" || event.key === "S");

      if (isPrintScreen || isMacRegion || isWinSnip) {
        console.warn("[broadcast] screenshot key detected — owner requested anti-copy.");
        toast.warning("This broadcast disables copy & screenshots.", {
          description:
            "The owner has opted this share into anti-copy mode. Screenshots may still be captured — the reminder is for good-faith viewers.",
        });
      }
    };

    window.addEventListener("keydown", onKey);

    return () => window.removeEventListener("keydown", onKey);
  }, [disableCopy]);

  return useMemo<ViewerDecorations>(() => {
    const style: React.CSSProperties = {};

    if (whitelabel?.accent) {
      // The `--accent` custom property cascades to every descendant
      // that reads `var(--accent)`. Cast through a lax record so
      // React's CSSProperties type accepts the custom-property key.
      (style as Record<string, string>)["--accent"] = whitelabel.accent;
    }

    const rootProps: ViewerDecorations["rootProps"] = {
      className: disableCopy ? "select-none" : "",
      style: Object.keys(style).length > 0 ? style : undefined,
    };

    if (disableCopy) {
      rootProps.onContextMenu = (event) => event.preventDefault();
      rootProps.onDragStart = (event) => event.preventDefault();
    }

    if (piiMask) {
      rootProps["data-pii-masked"] = "true";
    }

    let watermarkText: string | undefined;

    if (watermarkPolicy?.enabled) {
      const template = watermarkPolicy.text?.trim() || "{brand}·{date}";
      const today = new Date().toISOString().slice(0, 10);

      watermarkText = template.replaceAll("{brand}", brand.name).replaceAll("{date}", today);
    }

    return { rootProps, watermark: watermarkText };
  }, [disableCopy, piiMask, watermarkPolicy, whitelabel]);
}

/**
 * Fixed-position, `pointer-events: none` overlay that tiles a
 * diagonal SVG watermark across the viewer. Rendered inside the
 * viewer root so the overlay respects fullscreen and print media
 * boundaries. Opacity is baked into the SVG itself (`fill-opacity`)
 * so the CSS can stay at `opacity: 1` — that way a printed page
 * still shows the watermark instead of aggressive optimisers
 * dropping the near-transparent layer.
 */
function WatermarkOverlay({ text }: { text: string }): ReactNode {
  const dataUri = useMemo(() => {
    // Rotate 30° for the classic diagonal draft-mark look; 240x240
    // tile keeps the pattern dense on a 4K screen without turning
    // into visual noise on a 13" laptop.
    const escaped = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const svg = `<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" width="240" height="240" viewBox="0 0 240 240"><text x="120" y="130" fill="#000" fill-opacity="0.06" font-family="Inter, system-ui, sans-serif" font-size="18" font-weight="600" text-anchor="middle" transform="rotate(-30 120 130)">${escaped}</text></svg>`;

    return `url('data:image/svg+xml;utf8,${encodeURIComponent(svg)}')`;
  }, [text]);

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-40"
      style={{
        backgroundImage: dataUri,
        backgroundRepeat: "repeat",
        backgroundSize: "240px 240px",
      }}
    />
  );
}
