import { Logo, subtitle, title } from "@academorix/ui";
import { Button } from "@heroui/react";

import { siteConfig } from "@/config/site";

function openExternal(url: string): void {
  window.open(url, "_blank", "noopener,noreferrer");
}

export function HomePage() {
  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center gap-8 px-6 py-16 text-center">
      <div className="flex items-center gap-2 text-accent">
        <Logo size={40} />
        <span className="text-xl font-bold tracking-tight text-foreground">
          {siteConfig.name}
        </span>
      </div>

      <div className="max-w-2xl">
        <h1>
          <span className={title({ size: "lg" })}>
            The operating system for{" "}
          </span>
          <span className={title({ color: "blue", size: "lg" })}>
            modern academies
          </span>
        </h1>
        <p className={subtitle({ class: "mx-auto mt-6" })}>
          {siteConfig.description}
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button
          variant="primary"
          onPress={() => openExternal(siteConfig.links.github)}
        >
          Get started
        </Button>
        <Button
          variant="tertiary"
          onPress={() => openExternal(siteConfig.api.baseUrl)}
        >
          API status
        </Button>
      </div>

      <p className="text-xs text-muted">
        Environment: {siteConfig.environment} · API: {siteConfig.api.baseUrl}
      </p>
    </main>
  );
}
