import { useEffect, useState } from "react";
import { useRouteError } from "react-router";

const GENERATION_STATE_MESSAGE_TYPE = "HEROUI_PREVIEW_GENERATION_STATE";
const GENERATION_STATE_REQUEST_TYPE = "HEROUI_PREVIEW_GENERATION_STATE_REQUEST";

function useIsFixing() {
  const [isFixing, setIsFixing] = useState(false);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const data = event.data;

      if (!data || typeof data !== "object" || data.type !== GENERATION_STATE_MESSAGE_TYPE) {
        return;
      }

      setIsFixing(Boolean((data as { running?: unknown }).running));
    };

    window.addEventListener("message", handleMessage);
    window.parent?.postMessage({ type: GENERATION_STATE_REQUEST_TYPE }, "*");

    return () => window.removeEventListener("message", handleMessage);
  }, []);

  return isFixing;
}

function useReloadOnHotUpdate() {
  useEffect(() => {
    const hot = (
      import.meta as {
        hot?: {
          on?(event: string, cb: () => void): void;
          off?(event: string, cb: () => void): void;
        };
      }
    ).hot;

    if (!hot?.on) return;

    const reload = () => window.location.reload();

    hot.on("vite:afterUpdate", reload);

    return () => hot.off?.("vite:afterUpdate", reload);
  }, []);
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;

  if (error && typeof error === "object" && "message" in error) {
    return String((error as { message?: unknown }).message ?? "");
  }

  return typeof error === "string" ? error : "";
}

export function PreviewErrorBoundary() {
  const error = useRouteError();
  const isFixing = useIsFixing();

  useReloadOnHotUpdate();

  const message = getErrorMessage(error);

  return (
    <main className="flex min-h-dvh items-center justify-center bg-background p-6 text-foreground">
      <section className="flex w-full max-w-md flex-col items-center gap-4 rounded-2xl border border-border bg-background p-8 text-center shadow-surface">
        {isFixing ? (
          <>
            <span
              aria-hidden
              className="size-6 animate-spin rounded-full border-2 border-default border-t-foreground"
            />
            <div className="flex flex-col gap-1">
              <h1 className="text-base font-medium">Fixing this error…</h1>
              <p className="text-sm text-muted">
                HeroUI is updating the code. The preview refreshes automatically when it&apos;s
                ready.
              </p>
            </div>
          </>
        ) : (
          <>
            <div
              aria-hidden
              className="flex size-10 items-center justify-center rounded-full bg-danger/10 text-xl font-semibold text-danger"
            >
              !
            </div>
            <div className="flex flex-col gap-1">
              <h1 className="text-base font-medium">Something went wrong</h1>
              <p className="text-sm text-muted">The preview hit an error while rendering.</p>
            </div>
            {message ? (
              <pre className="max-h-40 w-full overflow-auto rounded-xl border border-border bg-default/40 p-3 text-left text-xs break-words whitespace-pre-wrap text-muted">
                {message}
              </pre>
            ) : null}
          </>
        )}
      </section>
    </main>
  );
}
