/**
 * @file app-shell.tsx
 * @module components/app-shell
 *
 * @description
 * The shell: primary sidebar (left) + navbar (top) + optional aside
 * (right). The aside is driven by the {@link useAsideSlot} store —
 * routes publish a renderer function which this component invokes
 * during its own render pass, so React sees ONE stable fiber for the
 * panel across route re-renders instead of the earlier mount/unmount
 * cycle that surfaced as `nextResource.createElementNS is not a
 * function` under React 19.
 *
 * The aside is resizable (`asideResizable`), auto-persisted to the
 * `academorix.app-layout` cookie via `resizableAutoSaveId`, and falls
 * back to a full-height sheet below the desktop breakpoint via
 * `asideMobile="sheet"`.
 */

import type { ReactNode } from "react";
import { Suspense } from "react";

import { Spinner } from "@heroui/react";
import { AppLayout } from "@heroui-pro/react";

import { useAsideSlot } from "@/lib/aside-slot";

import { AppNavbar } from "./app-navbar";
import { AppSidebar } from "./app-sidebar";
import { EmailVerificationBanner } from "./email-verification-banner";

function PageFallback(): ReactNode {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Spinner color="accent" size="lg" />
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }): ReactNode {
  const aside = useAsideSlot();

  return (
    <AppLayout
      /*
       * Gate the `aside` prop on `isOpen`. HeroUI Pro's AppLayout treats
       * a truthy `aside` as an intent to reserve column space even when
       * `asideOpen={false}`, so passing the panel unconditionally leaks
       * as a visible reserved gutter on first paint. Feeding `null` keeps
       * the layout collapsed until a route explicitly asks to open the
       * aside (e.g. dashboard's Customise button).
       */
      aside={aside.isOpen ? aside.content : null}
      /*
       * WHY the width bump (400 → 480 default, 320 → 360 min, 560 → 640 max):
       * customise panels routinely host multi-column tab bodies (widgets +
       * chip trays, layout + density picker, share dialog with grants).
       * The old 400px default cramped every row and forced two-line wraps
       * on labels; 480px gives the compound API real breathing room while
       * still leaving the main canvas usable on a 1440px viewport.
       */
      asideDefaultSize="480px"
      asideMaxSize="640px"
      asideMinSize="360px"
      asideMobile="sheet"
      asideOpen={aside.isOpen}
      asideResizable
      asideResizeBehavior="preserve-pixel-size"
      // Bind default aside to closed — the cookie can flip it back
      // open on next paint if the user resized/opened it before.
      defaultAsideOpen={false}
      navbar={<AppNavbar />}
      onAsideOpenChange={aside.setOpen}
      resizableAutoSaveId="academorix.app-layout"
      scrollMode="content"
      sidebar={<AppSidebar />}
      sidebarCollapsible="icon"
    >
      <div className="mx-auto w-full max-w-[1440px] px-4 pt-5 pb-10 sm:px-6 sm:pb-12 lg:px-8">
        {/* WHY the banner sits INSIDE the shell scroll container (not
            outside): keeping it inside the scrollable region means it
            respects the same 1440px max-width as the rest of the
            page chrome and doesn't fight the navbar's own sticky
            behaviour. Rendered above `children` so it's always the
            first thing the caller sees. */}
        <EmailVerificationBanner />
        <Suspense fallback={<PageFallback />}>{children}</Suspense>
      </div>
    </AppLayout>
  );
}
