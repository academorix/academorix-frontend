/**
 * @file use-leader-key.ts
 * @module hooks/use-leader-key
 *
 * @description
 * Two-key leader sequence hook (`G X` / `N X` etc.). After the leader key
 * fires (default: 800ms window), the second keystroke resolves the binding.
 * Sequences live on {@link "@/modules/registry".appShortcuts}, so a module
 * simply declares `meta.shortcuts: {navigate: "G A"}` to opt in.
 */

import { useEffect, useMemo, useRef } from "react";
import { useNavigate } from "@stackra/routing/react";

import type { ResolvedShortcut } from "@/modules/registry";

import { isEditableTarget, splitSequence } from "@/lib/keyboard";
import { appShortcuts } from "@/modules/registry";

/** How long the second key has to arrive after the leader (ms). */
const LEADER_TIMEOUT_MS = 800;

/** Extract the leader (first token) from a sequence. */
function leaderOf(shortcut: ResolvedShortcut): string | undefined {
  return splitSequence(shortcut.keys)[0]?.toUpperCase();
}

/** Extract the follow-up (second token) from a sequence. */
function followOf(shortcut: ResolvedShortcut): string | undefined {
  return splitSequence(shortcut.keys)[1]?.toUpperCase();
}

/**
 * Attach the global leader-key listener. Mount once, near the shell root —
 * the hook returns nothing (side-effect only) so it composes naturally.
 */
export function useLeaderKey(): void {
  const navigate = useNavigate();
  const leaderRef = useRef<{ key: string; expiresAt: number } | null>(null);

  // Group bindings by leader for O(1) lookup on the follow-up keystroke.
  const bindingsByLeader = useMemo(() => {
    const map = new Map<string, ResolvedShortcut[]>();

    for (const binding of appShortcuts) {
      const leader = leaderOf(binding);

      if (!leader || !followOf(binding)) continue;

      const bucket = map.get(leader) ?? [];

      bucket.push(binding);
      map.set(leader, bucket);
    }

    return map;
  }, []);

  useEffect(() => {
    const listener = (event: KeyboardEvent) => {
      if (isEditableTarget(event.target)) return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (event.key.length !== 1) return;

      const pressed = event.key.toUpperCase();

      // Second keystroke — resolve a pending leader.
      const pending = leaderRef.current;

      if (pending && pending.expiresAt >= Date.now()) {
        const candidates = bindingsByLeader.get(pending.key);

        leaderRef.current = null;

        if (!candidates) return;

        const match = candidates.find((binding) => followOf(binding) === pressed);

        if (!match || !match.route) return;

        event.preventDefault();
        navigate(match.route);

        return;
      }

      // First keystroke — arm the leader if it corresponds to a binding.
      if (bindingsByLeader.has(pressed)) {
        leaderRef.current = { key: pressed, expiresAt: Date.now() + LEADER_TIMEOUT_MS };
      } else {
        leaderRef.current = null;
      }
    };

    window.addEventListener("keydown", listener);

    return () => window.removeEventListener("keydown", listener);
  }, [bindingsByLeader, navigate]);
}
