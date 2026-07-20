/**
 * @file overlay-outlet.component.tsx
 * @module @stackra/routing/react/components/overlay-outlet
 * @description Render the currently-active overlay route through the
 *   correct HeroUI primitive for each `mode` + viewport combo.
 *
 *   Scans `useMatches()` for a match whose
 *   `handle[STACKRA_HANDLE].mode` is `'dialog'`, `'drawer'`, or
 *   `'sheet'`. When one is present the child `<Outlet />` renders
 *   inside:
 *
 *   - **`dialog`** on desktop → HeroUI OSS `<Modal>` (compound:
 *     `Modal.Backdrop > Modal.Container > Modal.Dialog > ...`).
 *   - **`drawer`** on desktop → HeroUI OSS `<Drawer>` (compound:
 *     `Drawer.Backdrop > Drawer.Content > Drawer.Dialog > ...`).
 *   - **`sheet`** on desktop → HeroUI Pro `<Sheet>` (compound:
 *     `Sheet > Sheet.Backdrop > Sheet.Content > Sheet.Dialog > ...`).
 *   - **Mobile-first override** — on viewports < `md` (`max-width:
 *     767px`), EVERY non-page mode collapses to `<Sheet>` because
 *     modals and side-drawers are hostile on phones; bottom sheets
 *     are the native pattern.
 *
 *   All three primitives are controlled programmatically — the
 *   router opens/closes them; there is no trigger. When the user
 *   dismisses (backdrop click, ESC, swipe), `onDismiss` walks the
 *   handle's `IOverlayConfig` to run `'back'` (default) or
 *   `'to-parent'` semantics.
 *
 *   Logic-only wrapper — all visual concerns delegated to HeroUI
 *   primitives (`ui-components.md`).
 */

import { useCallback, useEffect, useState, type ReactElement } from "react";
import type { IOverlayConfig, IRouteMode } from "@stackra/contracts";
import { Drawer, Modal, Sheet } from "@stackra/ui/react";

import { STACKRA_HANDLE } from "@/core/constants";
import { Outlet, useMatches } from "@/react/react-router-re-exports";
import { useBack } from "@/react/hooks/use-back";
import { useMediaQuery } from "@/react/hooks/use-media-query";
import { useNavigate } from "@/react/hooks/use-navigate";

/**
 * Tailwind's `md` breakpoint boundary. Mirror the Tailwind default
 * so the collapse behaviour lines up with the app's responsive
 * layout — `md` is `768px`, so anything below `767px` is mobile.
 */
const MOBILE_QUERY = "(max-width: 767px)";

/**
 * Modal sizes exposed by `Modal.Container`. `xl` maps to `lg`
 * because RRv7's Modal only ships up to `lg` in the current v3
 * release (`Modal.Container.size = 'xs' | 'sm' | 'md' | 'lg' |
 * 'cover' | 'full'`).
 */
type IModalSize = "xs" | "sm" | "md" | "lg" | "cover" | "full";

/**
 * Render the topmost overlay route in the current match chain.
 *
 * Mount once at the layout root — alongside the page-mode
 * `<Outlet />` — so overlay routes render on top of the
 * currently-active page.
 *
 * @returns The overlay element, or `null` when no overlay match
 *   is present.
 */
export function OverlayOutlet(): ReactElement | null {
  const matches = useMatches();
  const back = useBack();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(MOBILE_QUERY);

  // The overlay is always considered "open" when a matching
  // overlay route is present — RRv7 keeps the match around
  // until navigation completes. We drive the primitive's own
  // `isOpen` from local state so animations run on close.
  const [isOpen, setIsOpen] = useState<boolean>(true);

  // Find the topmost overlay match — the framework treats
  // overlay routes as leaves rendered alongside their parent.
  const overlayMatch = matches.find((match) => {
    const stackra = (match.handle as Record<string | symbol, unknown> | undefined)?.[
      STACKRA_HANDLE
    ] as { readonly mode?: IRouteMode } | undefined;
    return stackra?.mode !== undefined && stackra.mode !== "page";
  });

  // Key the reset off the match's pathname so `overlayA → overlayB`
  // transitions open the second overlay fresh even if the first
  // was closed via dismiss (isOpen=false is left over otherwise).
  // The effect runs on match-identity changes; the guard skips
  // resets when the chain has no overlay match (that path is
  // covered by the `return null` below).
  const matchKey = overlayMatch?.pathname ?? null;
  useEffect(() => {
    if (matchKey !== null) setIsOpen(true);
  }, [matchKey]);

  const overlay = extractOverlayConfig(overlayMatch);
  const mode = overlay?.mode;

  // Dismiss handler — closes the primitive first (for the exit
  // animation) then runs the configured back/route navigation.
  const onDismiss = useCallback(() => {
    setIsOpen(false);
    // The primitive's exit animation runs before the router step
    // so the transition feels natural. `navigate` is fire-and-
    // forget — the router unmounts the overlay match when it
    // completes.
    queueMicrotask(() => {
      if (!overlay) return;
      const spec = overlay.config;
      // `'to-parent'` navigates to the fallbackRoute when set,
      // otherwise falls through to browser back.
      if (spec.onDismiss === "to-parent" && spec.fallbackRoute) {
        void navigate(spec.fallbackRoute, { replace: true });
        return;
      }
      // Default — browser back with fallback to the configured
      // route (or `/` when no history + no fallback).
      void back();
    });
  }, [back, navigate, overlay]);

  if (!overlayMatch || !mode) return null;

  // Mobile-first override — dialog + drawer + sheet ALL collapse
  // to the bottom sheet primitive on small viewports. Bottom
  // sheets are the mobile-native pattern; side drawers and modals
  // are hostile below ~768px.
  const effectiveMode: IRouteMode = isMobile ? "sheet" : mode;

  switch (effectiveMode) {
    case "dialog":
      return renderModal(isOpen, overlay?.config, onDismiss);
    case "drawer":
      return renderDrawer(isOpen, overlay?.config, onDismiss);
    case "sheet":
      return renderSheet(isOpen, overlay?.config, onDismiss, isMobile);
    default:
      return null;
  }
}

// ── Renderers ─────────────────────────────────────────────────────

/**
 * Render the dialog-mode overlay as a HeroUI OSS `<Modal>`.
 */
function renderModal(
  isOpen: boolean,
  config: IOverlayConfig | undefined,
  onDismiss: () => void,
): ReactElement {
  const size = mapOverlaySize(config?.size, "modal");
  const dismissible = config?.dismissible ?? true;

  // HeroUI Modal is controlled via `isOpen` + `onOpenChange` on the
  // Backdrop element (mirrors the OSS docs' controlled example).
  return (
    <Modal.Backdrop
      isOpen={isOpen}
      onOpenChange={(open) => {
        if (!open) onDismiss();
      }}
      isDismissable={dismissible}
      isKeyboardDismissDisabled={!dismissible}
    >
      <Modal.Container size={size}>
        <Modal.Dialog>
          <Modal.CloseTrigger />
          <Modal.Body>
            <Outlet />
          </Modal.Body>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}

/**
 * Render the drawer-mode overlay as a HeroUI OSS `<Drawer>`.
 */
function renderDrawer(
  isOpen: boolean,
  config: IOverlayConfig | undefined,
  onDismiss: () => void,
): ReactElement {
  // `side` selects the edge the drawer slides from. HeroUI's
  // Drawer accepts `top | bottom | left | right`; we default to
  // `right` because that's the most common desktop drawer pose.
  const placement = config?.side ?? "right";
  const dismissible = config?.dismissible ?? true;

  return (
    <Drawer.Backdrop
      isOpen={isOpen}
      onOpenChange={(open) => {
        if (!open) onDismiss();
      }}
      isDismissable={dismissible}
      isKeyboardDismissDisabled={!dismissible}
    >
      <Drawer.Content placement={placement}>
        <Drawer.Dialog>
          <Drawer.CloseTrigger />
          <Drawer.Body>
            <Outlet />
          </Drawer.Body>
        </Drawer.Dialog>
      </Drawer.Content>
    </Drawer.Backdrop>
  );
}

/**
 * Render the sheet-mode overlay as a HeroUI Pro `<Sheet>`.
 *
 * @param isMobile - Drives the layout width — bottom sheets on
 *   mobile hug the viewport (`max-w-none`); desktop side sheets
 *   constrain to `~420px`.
 */
function renderSheet(
  isOpen: boolean,
  config: IOverlayConfig | undefined,
  onDismiss: () => void,
  isMobile: boolean,
): ReactElement {
  // On mobile, `placement` is forced to `'bottom'` for the native
  // pattern; on desktop respect the caller's `side`. HeroUI Pro
  // Sheet's `placement` accepts `bottom | top | left | right`.
  const placement = isMobile ? "bottom" : (config?.side ?? "right");
  const dismissible = config?.dismissible ?? true;

  // Sheet content classes — bottom sheets are constrained to a
  // centred 420-width bubble on desktop; on mobile they hug the
  // viewport. Left/right sheets keep a 400-width column.
  const contentClass =
    placement === "left" || placement === "right"
      ? "w-[400px]"
      : isMobile
        ? "mx-auto max-h-[95vh] w-full"
        : "mx-auto max-h-[95vh] max-w-[420px]";

  // Sheet's controlled surface is the ROOT `<Sheet>` — different
  // from Modal + Drawer which control on the Backdrop. See the Pro
  // "Controlled" docs example.
  return (
    <Sheet
      isOpen={isOpen}
      onOpenChange={(open) => {
        if (!open) onDismiss();
      }}
      placement={placement}
      isDismissable={dismissible}
    >
      <Sheet.Backdrop>
        <Sheet.Content className={contentClass}>
          <Sheet.Dialog
            className={placement === "left" || placement === "right" ? "h-full" : undefined}
          >
            {/* Handle is standard for bottom sheets — the swipe
                affordance. Hide on side-sheets, where drag makes
                no sense. */}
            {placement === "bottom" || placement === "top" ? <Sheet.Handle /> : null}
            <Sheet.CloseTrigger />
            <Sheet.Body>
              <Outlet />
            </Sheet.Body>
          </Sheet.Dialog>
        </Sheet.Content>
      </Sheet.Backdrop>
    </Sheet>
  );
}

// ── Helpers ───────────────────────────────────────────────────────

/**
 * Read the STACKRA handle off a match and hoist the mode + config.
 */
function extractOverlayConfig(
  match: ReturnType<typeof useMatches>[number] | undefined,
): { readonly mode: IRouteMode; readonly config: IOverlayConfig } | undefined {
  if (!match) return undefined;
  const stackra = (match.handle as Record<string | symbol, unknown> | undefined)?.[
    STACKRA_HANDLE
  ] as { readonly mode: IRouteMode; readonly overlay?: IOverlayConfig } | undefined;
  if (!stackra?.mode) return undefined;
  return { mode: stackra.mode, config: stackra.overlay ?? {} };
}

/**
 * Map the shared `IOverlayConfig.size` values to the primitive-
 * specific size prop. HeroUI's Modal accepts an extra `cover`+
 * `full`, plus `xs`; we downshift `xl` to `lg` so consumers get a
 * predictable "large but not full" bucket.
 */
function mapOverlaySize(size: IOverlayConfig["size"], _target: "modal"): IModalSize {
  switch (size) {
    case "sm":
      return "sm";
    case "md":
      return "md";
    case "lg":
      return "lg";
    case "xl":
      // Modal has no `xl` — treat as the largest reserved size
      // that still centres in the viewport.
      return "lg";
    case "full":
      return "full";
    default:
      return "md";
  }
}
