/**
 * @file overview-panel.component.tsx
 * @module @stackra/devtools/native/components
 * @description Content of the built-in "Overview" devtools panel on
 *   native. Mirrors the web version — a summary of registered
 *   panels + inspector sources + session uptime — using HeroUI
 *   Native `Card` + `Chip` primitives.
 */

import { useEffect, useState, type ReactElement } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { Card, Chip } from '@stackra/ui/native';
import { Env, Num } from '@stackra/support';

import { useNativeDevtoolsContext } from '../../hooks/use-native-devtools-context.hook';
import { useNativeDevtoolsPanels } from '../../hooks/use-native-devtools-panels.hook';
import type { OverviewPanelProps } from './overview-panel.interface';

/**
 * Format a millisecond-uptime value as a short human-readable
 * string ("42s", "3m", "1.4h").
 */
function formatUptime(ms: number): string {
  if (ms < 60_000) return `${Math.floor(ms / 1000)}s`;
  if (ms < 3_600_000) return `${Math.floor(ms / 60_000)}m`;
  return `${(ms / 3_600_000).toFixed(1)}h`;
}

/**
 * Render a single stat tile.
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
    <Card className="flex-1">
      <Card.Header>
        <Card.Description>{label}</Card.Description>
        <Card.Title className="text-2xl">{value}</Card.Title>
      </Card.Header>
      {hint ? (
        <Card.Body>
          <Text className="text-xs text-muted">{hint}</Text>
        </Card.Body>
      ) : null}
    </Card>
  );
}

/**
 * The native Overview panel.
 *
 * @example
 * ```tsx
 * // Registered automatically by <Devtools />.
 * ```
 */
export function OverviewPanel({ className }: OverviewPanelProps): ReactElement {
  const { mountedAt } = useNativeDevtoolsContext();
  const { panels, byCategory } = useNativeDevtoolsPanels();

  // Uptime ticker — 1s resolution is plenty for a dev tool. Uses
  // `setInterval` (not `sleep` — we need cancellation for
  // component unmount).
  const [nowTick, setNowTick] = useState<number>(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNowTick(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const uptime = nowTick - mountedAt;
  const nodeEnv = Env.get('NODE_ENV', 'development');

  return (
    <ScrollView className={className} contentContainerStyle={{ padding: 16, gap: 12 }}>
      <View className="flex-row items-center justify-between">
        <View className="flex-1 gap-1">
          <Text className="text-base font-semibold text-foreground">Stackra Devtools</Text>
          <Text className="text-xs text-muted">
            Panels + inspector sources contributed by every module in this app.
          </Text>
        </View>
        <Chip size="sm" variant="secondary">
          <Chip.Label>{nodeEnv}</Chip.Label>
        </Chip>
      </View>

      <View className="flex-row gap-3">
        <StatCard
          label="Panels"
          value={Num.abbreviate(panels.length)}
          hint={`${byCategory.size} categor${byCategory.size === 1 ? 'y' : 'ies'}`}
        />
        <StatCard label="Uptime" value={formatUptime(uptime)} />
      </View>
    </ScrollView>
  );
}
