import type { ReactNode } from "react";

interface ProvidersProps {
  children: ReactNode;
}

/**
 * Application-wide context providers.
 * Compose additional providers (query client, auth, theme, ...) here.
 */
export function Providers({ children }: ProvidersProps) {
  return <>{children}</>;
}
