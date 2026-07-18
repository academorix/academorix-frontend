/**
 * @file install-qr-code.component.tsx
 * @module @stackra/pwa/react/components
 * @description Lazy QR-code renderer wrapping the optional `qrcode`
 *   peer inside a HeroUI `Card`.
 *
 *   The `qrcode` npm package is loaded via the variable-specifier
 *   `await import(/* @vite-ignore *​/ moduleName)` pattern so ESLint's
 *   `no-require-imports` rule stays satisfied and the peer stays
 *   truly optional — apps that don't render a QR code don't install
 *   the package.
 */

import { useEffect, useRef, useState, type ReactElement } from 'react';
import { Card } from '@stackra/ui/react';

import type { InstallQrCodeProps } from './install-qr-code.interface';

/**
 * Install QR code.
 *
 * @example
 * ```tsx
 * import { InstallQrCode } from '@stackra/pwa/react';
 *
 * function DesktopInstallHint() {
 *   return (
 *     <InstallQrCode
 *       url="https://app.stackra.com/"
 *       title="Install on your phone"
 *       description="Scan the code with your phone camera to install."
 *     />
 *   );
 * }
 * ```
 */
export function InstallQrCode({
  url,
  size = 200,
  errorCorrection = 'M',
  className,
  title,
  description,
}: InstallQrCodeProps): ReactElement {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    // Variable-specifier import — ESLint's `no-require-imports` rule
    // permits only `import(<literal>)` for optional peers, but we
    // rely on the `@vite-ignore` hint so the bundler doesn't try to
    // resolve `qrcode` statically. The specifier is deliberately a
    // dynamic string so tsc doesn't ambient-resolve it either.
    const moduleName = 'qrcode';
    void (async () => {
      try {
        // Cast to a structural interface — the `qrcode` peer isn't
        // declared as a devDep at type-check time; we import at
        // runtime and rely on the API's stable surface (`toCanvas`).
        const mod = (await import(/* @vite-ignore */ moduleName)) as {
          readonly toCanvas: (
            canvas: HTMLCanvasElement,
            text: string,
            options: { readonly width: number; readonly errorCorrectionLevel: string }
          ) => Promise<void>;
        };
        if (cancelled) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        await mod.toCanvas(canvas, url, {
          width: size,
          errorCorrectionLevel: errorCorrection,
        });
      } catch (e: unknown) {
        // fail-soft — the peer might be missing. Show a message so
        // consumers can see what's wrong.
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [url, size, errorCorrection]);

  return (
    <Card className={className} data-pwa-qr>
      {title || description ? (
        <Card.Header>
          {title ? <Card.Title>{title}</Card.Title> : null}
          {description ? <Card.Description>{description}</Card.Description> : null}
        </Card.Header>
      ) : null}
      <Card.Content className="flex items-center justify-center p-4">
        {error ? (
          <span className="text-sm text-danger">{error}</span>
        ) : (
          <canvas ref={canvasRef} width={size} height={size} aria-label={`QR code for ${url}`} />
        )}
      </Card.Content>
    </Card>
  );
}
