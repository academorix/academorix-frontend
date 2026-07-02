import { AcademicCapIcon } from "@academorix/ui/icons/outline";
import { Button, StatusBadge } from "@academorix/ui/react";

import { siteConfig } from "@/config/site";

function openExternal(url: string): void {
  window.open(url, "_blank", "noopener,noreferrer");
}

export function HomePage() {
  const isProduction = siteConfig.environment === "production";

  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center gap-8 px-6 py-16 text-center">
      <div className="flex items-center gap-2 text-accent">
        <AcademicCapIcon aria-hidden="true" className="size-10" />
        <span className="text-2xl font-bold tracking-tight text-foreground">{siteConfig.name}</span>
      </div>

      <div className="max-w-2xl space-y-4">
        <h1 className="text-4xl font-semibold tracking-tight text-foreground lg:text-6xl">
          The operating system for modern academies
        </h1>
        <p className="text-lg text-muted lg:text-xl">{siteConfig.description}</p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button variant="primary" onPress={() => openExternal(siteConfig.links.github)}>
          Get started
        </Button>
        <Button variant="tertiary" onPress={() => openExternal(siteConfig.api.baseUrl)}>
          API status
        </Button>
      </div>

      <div className="flex items-center gap-2 text-xs text-muted">
        <StatusBadge color={isProduction ? "success" : "warning"} label={siteConfig.environment} />
        <span>API: {siteConfig.api.baseUrl}</span>
      </div>
    </main>
  );
}
