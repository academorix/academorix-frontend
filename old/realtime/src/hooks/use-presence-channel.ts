/**
 * @file use-presence-channel.ts
 * @module @academorix/realtime/hooks/use-presence-channel
 *
 * @description
 * `usePresenceChannel<TMember>` — subscribes to a presence channel and
 * tracks the connected members list. Emits three lifecycle callbacks
 * matching Laravel's Echo presence API:
 *
 *   - `onHere(members)` — the initial member list on subscribe.
 *   - `onJoining(member)` — a new member connected.
 *   - `onLeaving(member)` — a member disconnected.
 *
 * The hook also returns a stateful `members` array so consumers that
 * just want to render a "typing" or "online now" list don't have to
 * wire the three callbacks themselves.
 *
 * @example
 * ```tsx
 * import { usePresenceChannel } from "@academorix/realtime/hooks";
 * import { useRealtimeClient } from "@/lib/realtime";
 *
 * interface Presence { id: string; name: string; avatarUrl?: string; }
 *
 * function CoachingSessionPresence({ sessionId }: { sessionId: string }) {
 *   const client = useRealtimeClient();
 *   const { members } = usePresenceChannel<Presence>(client, `session.${sessionId}`);
 *
 *   return <ul>{members.map((m) => <li key={m.id}>{m.name}</li>)}</ul>;
 * }
 * ```
 */

import { useEffect, useState } from "react";

import type { RealtimeClient } from "../client/realtime-client.type";

/** Options passed to `usePresenceChannel`. */
export interface UsePresenceChannelOptions<TMember> {
  /** Called with the full member list on first join. */
  onHere?: (members: readonly TMember[]) => void;
  /** Called when another member connects to the channel. */
  onJoining?: (member: TMember) => void;
  /** Called when another member disconnects from the channel. */
  onLeaving?: (member: TMember) => void;
  /** Optional event handlers, same shape as `useChannel`. */
  handlers?: Readonly<Record<string, (payload: unknown) => void>>;
}

/** Return value of `usePresenceChannel`. */
export interface UsePresenceChannelResult<TMember> {
  /** The current member list. Kept in sync with join/leave events. */
  readonly members: readonly TMember[];
}

/**
 * Subscribes to a presence channel and tracks the member list.
 *
 * The returned `members` array is a snapshot — React re-renders on
 * every change, so consumers can render it directly.
 */
export function usePresenceChannel<TMember>(
  client: RealtimeClient,
  channelName: string,
  options: UsePresenceChannelOptions<TMember> = {},
): UsePresenceChannelResult<TMember> {
  const [members, setMembers] = useState<readonly TMember[]>([]);

  useEffect(() => {
    if (!channelName) {
      return undefined;
    }

    const channel = client.presence(channelName);

    channel.here?.((initial) => {
      const typed = initial as readonly TMember[];

      setMembers(typed);
      options.onHere?.(typed);
    });

    channel.joining?.((member) => {
      const typed = member as TMember;

      setMembers((current) => [...current, typed]);
      options.onJoining?.(typed);
    });

    channel.leaving?.((member) => {
      const typed = member as TMember;

      setMembers((current) => current.filter((existing) => existing !== typed));
      options.onLeaving?.(typed);
    });

    if (options.handlers) {
      for (const [event, callback] of Object.entries(options.handlers)) {
        channel.listen(event, callback);
      }
    }

    return () => {
      client.leave(`presence-${channelName}`);
    };
    // Options are intentionally not in the dep array — the effect
    // re-subscribes on channel identity changes only. Callers who
    // need the callbacks to reflect changing state should use refs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client, channelName]);

  return { members };
}
