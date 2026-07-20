/**
 * @file overview-panel.component.tsx
 * @module @stackra/devtools/react/components
 * @description Content of the built-in "Overview" devtools panel.
 *
 *   Renders a summary grid — total panels, categories in use,
 *   inspector sources, session uptime — plus a quick-links row.
 *   Reads exclusively from the ambient devtools context; requires
 *   no external DI.
 */

import { useEffect, useState, type ReactElement } from "react";
import { Button, Card, Chip } from "@stackra/ui/react";
import { Env, Num } from "@stackra/support";
import { ArrowPathIcon, BookOpenIcon } from "@stackra/ui/icons/heroicon/outline";

import { useDevtoolsContext } from "../../hooks/use-devtools-context.hook";
import { useDevtoolsInspector } from "../../hooks/use-devtools-inspector.hook";
import { useDevtoolsPanels } from "../../hooks/use-devtools-panels.hook";
import type { OverviewPanelProps } from "./overview-panel.interface";

/** Session-uptime label helper. */
function formatUptime(ms: number): string {
  if (ms < 60_000) return `${Math.floor(ms / 1000)}s`;
  if (ms < 3_600_000) return `${Math.floor(ms / 60_000)}m`;
  return `${(ms / 3_600_000).toFixed(1)}h`;
}

/**
 * Render one stat card.
 */
function StatCard({
  label,
  value,
  hint,
}: {
  readonly label: string;
  readonly value: string;
  readonly hint?: string;
}): ReactElement {
  return (
    <Card>
      <Card.Header>
        <Card.Description>{label}</Card.Description>
        <Card.Title className="text-2xl tabular-nums">{value}</Card.Title>
      </Card.Header>
      {hint ? (
        <Card.Content>
          <span className="text-muted text-xs">{hint}</span>
        </Card.Content>
      ) : null}
    </Card>
  );
}

/**
 * The built-in Overview panel content.
 */
export function OverviewPanel({ className }: OverviewPanelProps): ReactElement {
  const { mountedAt } = useDevtoolsContext();
  const { panels, byCategory } = useDevtoolsPanels();
  const { regions } = useDevtoolsInspector();

  // Uptime ticker — 1s resolution is plenty for a dev tool. Uses
  // `setInterval` (not `sleep` — we need cancellation for
  // component unmount).
  const [nowTick, setNowTick] = useState<number>(() => Date.now());
  useEffect(() => {
    if (typeof window === "undefined") return;
    const id = window.setInterval(() => setNowTick(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const uptime = nowTick - mountedAt;

  const nodeEnv = Env.get("NODE_ENV", "development");
  const mode = Env.get("MODE", nodeEnv);

  return (
    <div className={className ?? "flex flex-col gap-4"}>
      <header className="flex items-center justify-between">
        <div>
          <h3 className="text-foreground text-base font-semibold">Stackra Devtools</h3>
          <p className="text-muted text-xs">
            Overview of the panels + inspector sources contributed by every module in this app.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Chip size="sm" variant="secondary">
            <Chip.Label>{nodeEnv}</Chip.Label>
          </Chip>
          {mode !== nodeEnv ? (
            <Chip size="sm" variant="secondary">
              <Chip.Label>{mode}</Chip.Label>
            </Chip>
          ) : null}
        </div>
      </header>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Panels"
          value={Num.abbreviate(panels.length)}
          hint={`${byCategory.size} categor${byCategory.size === 1 ? "y" : "ies"}`}
        />
        <StatCard
          label="Inspector sources"
          value={Num.abbreviate(regions.length)}
          hint={`${regions.length} region${regions.length === 1 ? "" : "s"}`}
        />
        <StatCard label="Session uptime" value={formatUptime(uptime)} />
        <StatCard label="Categories" value={Num.abbreviate(byCategory.size)} />
      </div>

      <section className="border-border flex items-center gap-2 border-t pt-3">
        <Button
          size="sm"
          variant="tertiary"
          onPress={() => {
            if (typeof window !== "undefined") window.location.reload();
          }}
        >
          <ArrowPathIcon aria-hidden="true" className="size-4" />
          Reload page
        </Button>
        <Button
          size="sm"
          variant="tertiary"
          onPress={() => {
            if (typeof window !== "undefined") {
              window.open("https://github.com/stackra-inc/core", "_blank");
            }
          }}
        >
          <BookOpenIcon aria-hidden="true" className="size-4" />
          Docs
        </Button>
      </section>
    </div>
  );
}
