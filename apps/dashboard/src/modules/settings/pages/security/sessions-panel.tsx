/**
 * @file sessions-panel.tsx
 * @module modules/settings/pages/security/sessions-panel
 *
 * @description
 * "Active sessions" panel inside the Security settings page. Lists
 * every Sanctum PAT tied to the caller, tags the current one, and
 * lets the caller revoke individual sessions or all-but-current.
 *
 * ## Password confirm gate
 *
 * Every revoke action is gated behind {@link usePasswordConfirm} so a
 * lost / stolen device can't clear other trusted sessions without
 * proof of the current password. Server-side, the
 * `password.confirm` middleware also enforces the gate — the
 * confirmation is cached against the caller's Sanctum token id for
 * 15 minutes so back-to-back revokes don't re-prompt.
 */

import { Button, Chip, Spinner, toast } from "@heroui/react";
import { useCallback, useEffect, useState } from "react";

import type { ReactNode } from "react";
import type { SessionEntry } from "@/lib/api/auth-api";

import { ApiError } from "@/lib/api/http-client";
import { Iconify } from "@/icons/iconify";
import { authApi } from "@/lib/api/auth-api";
import { usePasswordConfirm } from "@/hooks/use-password-confirm";

/**
 * Best-effort user-agent → device label mapping. Kept as tiny
 * heuristic groups so the UI shows "iPhone" rather than the full
 * UA string. Falls back to "Unknown device" so the row is never
 * blank.
 */
function labelDevice(userAgent: string | null): { label: string; icon: string } {
  if (!userAgent) return { label: "Unknown device", icon: "circle-question" };

  const ua = userAgent.toLowerCase();

  if (ua.includes("iphone")) return { label: "iPhone", icon: "mobile" };
  if (ua.includes("ipad")) return { label: "iPad", icon: "tablet" };
  if (ua.includes("android") && ua.includes("mobile"))
    return { label: "Android phone", icon: "mobile" };
  if (ua.includes("android")) return { label: "Android tablet", icon: "tablet" };
  if (ua.includes("mac")) return { label: "Mac", icon: "laptop" };
  if (ua.includes("windows")) return { label: "Windows PC", icon: "desktop" };
  if (ua.includes("linux")) return { label: "Linux", icon: "desktop" };

  return { label: "Web browser", icon: "browser" };
}

/**
 * Format a relative "time ago" string without a runtime dep. Falls
 * back to the ISO date on anything > 30 days.
 */
function timeAgo(iso: string | null): string {
  if (!iso) return "Never";

  const then = Date.parse(iso);

  if (!Number.isFinite(then)) return iso;

  const seconds = Math.floor((Date.now() - then) / 1000);

  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86_400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 30 * 86_400) return `${Math.floor(seconds / 86_400)}d ago`;

  return new Date(then).toISOString().slice(0, 10);
}

export function SessionsPanel(): ReactNode {
  const [sessions, setSessions] = useState<readonly SessionEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [revokingId, setRevokingId] = useState<number | null>(null);
  const [isRevokingAll, setRevokingAll] = useState<boolean>(false);

  const confirmPassword = usePasswordConfirm();

  const reload = useCallback(async (): Promise<void> => {
    try {
      setError(null);
      const { sessions: next } = await authApi.listSessions();

      setSessions(next);
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : "We couldn't load your sessions. Please refresh.",
      );
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const handleRevoke = async (session: SessionEntry): Promise<void> => {
    if (session.is_current) return;

    const { label } = labelDevice(session.user_agent);

    const ok = await confirmPassword({
      title: `Revoke ${session.device_name || label}?`,
      description: `The device will need to sign in again the next time it's used. Enter your password to confirm.`,
      confirmLabel: "Revoke session",
      variant: "danger",
      icon: "trash-bin",
    });

    if (!ok) return;

    setRevokingId(session.id);

    try {
      await authApi.revokeSession(session.id);
      toast.success("Session revoked");
      await reload();
    } catch (caught) {
      toast.danger(
        caught instanceof ApiError ? caught.message : "We couldn't revoke that session.",
      );
    } finally {
      setRevokingId(null);
    }
  };

  const handleRevokeOthers = async (): Promise<void> => {
    const ok = await confirmPassword({
      title: "Sign out on every other device?",
      description:
        "Every session except this one gets revoked. Anyone signed in elsewhere will have to sign back in.",
      confirmLabel: "Sign out others",
      variant: "danger",
      icon: "arrow-right-from-square",
    });

    if (!ok) return;

    setRevokingAll(true);

    try {
      await authApi.revokeOtherSessions();
      toast.success("Other sessions signed out");
      await reload();
    } catch (caught) {
      toast.danger(
        caught instanceof ApiError ? caught.message : "We couldn't sign out other sessions.",
      );
    } finally {
      setRevokingAll(false);
    }
  };

  if (sessions === null && !error) {
    return (
      <div className="flex items-center justify-center py-16">
        <Spinner color="accent" size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-start gap-3 rounded-2xl border border-danger/40 bg-danger/10 p-4 text-sm">
        <Iconify className="mt-0.5 size-5 shrink-0 text-danger" icon="triangle-exclamation" />
        <div className="flex flex-col gap-1">
          <p className="font-medium text-foreground">Couldn't load sessions</p>
          <p className="text-xs text-muted">{error}</p>
        </div>
        <Button className="ms-auto" onPress={reload} size="sm" variant="secondary">
          Retry
        </Button>
      </div>
    );
  }

  const otherCount = (sessions ?? []).filter((session) => !session.is_current).length;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h3 className="text-base font-semibold text-foreground">Active sessions</h3>
        <p className="text-sm text-muted">
          Every device signed in to your account. Revoke anything you don't recognise.
        </p>
      </div>

      <ul className="flex flex-col gap-2">
        {(sessions ?? []).map((session) => {
          const device = labelDevice(session.user_agent);
          const isCurrent = session.is_current;

          return (
            <li
              key={session.id}
              className={`flex items-start gap-3 rounded-xl border border-border p-3 sm:items-center sm:gap-4 ${
                isCurrent ? "bg-accent/5" : "bg-surface"
              }`}
            >
              <span
                className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${
                  isCurrent ? "bg-accent/15 text-accent" : "bg-surface-secondary text-muted"
                }`}
              >
                <Iconify className="size-5" icon={device.icon} />
              </span>

              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="truncate text-sm font-medium text-foreground">
                    {session.device_name || device.label}
                  </span>
                  {isCurrent ? (
                    <Chip color="accent" size="sm" variant="soft">
                      <Chip.Label>Current session</Chip.Label>
                    </Chip>
                  ) : null}
                </div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted">
                  <span>{device.label}</span>
                  {session.ip_address ? <span>· {session.ip_address}</span> : null}
                  <span>· Last active {timeAgo(session.last_used_at)}</span>
                </div>
              </div>

              {isCurrent ? null : (
                <Button
                  isPending={revokingId === session.id}
                  onPress={() => handleRevoke(session)}
                  size="sm"
                  variant="secondary"
                >
                  Revoke
                </Button>
              )}
            </li>
          );
        })}
      </ul>

      {otherCount > 0 ? (
        <div className="flex flex-col gap-2 rounded-xl border border-border bg-surface-secondary/40 p-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-medium text-foreground">Sign out everywhere else</span>
            <span className="text-xs text-muted">
              Revokes every session except this one. Recommended after a lost device.
            </span>
          </div>
          <Button isPending={isRevokingAll} onPress={handleRevokeOthers} size="sm" variant="danger">
            Sign out others
          </Button>
        </div>
      ) : null}
    </div>
  );
}
