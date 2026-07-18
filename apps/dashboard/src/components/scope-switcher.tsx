/**
 * @file scope-switcher.tsx
 * @module components/scope-switcher
 *
 * @description
 * Navbar-level scope switcher pill. Renders the active org context
 * (Tenant → Region → Org → Branch) as a compact pill and opens a
 * searchable popover on click for switching branches, regions, or
 * organizations. This is a *first-class* control — the same choice
 * still exists inside the user menu for redundancy on account tasks,
 * but the navbar pill is the canonical way to change scope.
 *
 * Branch selection goes through {@link useBranchSwitcher}: it mutates
 * the shared identity snapshot, invalidates Refine's identity query
 * so `useGetIdentity()` refetches, and invalidates every scoped data
 * query so lists refresh under the new branch — all without a full
 * page reload. When the real backend lands, swap the store call for
 * `POST /api/me/active-branch` and everything downstream stays the same.
 */

import { Button, Chip, Label, ListBox, Popover, SearchField, Separator } from "@heroui/react";
import { useGetIdentity } from "@refinedev/core";
import { useMemo, useState } from "react";
import { useNavigate } from "@stackra/routing/react";

import type { Key } from "react";

import type { Identity, UserBranchEntry } from "@/refine/auth-provider";

import { useBranchSwitcher } from "@/hooks/use-branch-switcher";
import { Iconify } from "@/icons/iconify";

// -----------------------------------------------------------------------------
// Public component
// -----------------------------------------------------------------------------

/**
 * Compact scope pill for the navbar. Shows region → org → branch
 * chevrons and opens a rich Popover for switching branches.
 */
export function ScopeSwitcher() {
  const { data: identity } = useGetIdentity<Identity>();
  const switchBranch = useBranchSwitcher();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const workspace = identity?.workspace;
  const branches: UserBranchEntry[] = identity?.branches ?? [];
  const activeBranchId = workspace?.activeBranchId;
  const activeBranch = branches.find((b) => b.id === activeBranchId);

  const filtered = useMemo(() => {
    if (!query.trim()) return branches;
    const q = query.toLowerCase();

    return branches.filter(
      (b) => b.name.toLowerCase().includes(q) || (b.city ?? "").toLowerCase().includes(q),
    );
  }, [branches, query]);

  const groupedByRegion = useMemo(() => {
    const groups = new Map<string, UserBranchEntry[]>();
    const region = workspace?.region ?? "Other";

    // In the seeded fixture every branch belongs to the workspace's
    // region — production JSON will have a `regionId` per branch and
    // this group logic will lift accordingly.
    for (const branch of filtered) {
      const bucket = groups.get(region) ?? [];

      bucket.push(branch);
      groups.set(region, bucket);
    }

    return Array.from(groups.entries());
  }, [filtered, workspace?.region]);

  if (!identity || branches.length === 0) return null;

  const handleSelect = (branchId: string) => {
    switchBranch(branchId);
    setIsOpen(false);
    setQuery("");
  };

  return (
    <Popover isOpen={isOpen} onOpenChange={setIsOpen}>
      <Button
        aria-label="Change active scope"
        className="hidden gap-2 px-2.5 md:inline-flex"
        size="sm"
        variant="secondary"
      >
        <Iconify className="size-4 text-muted" icon="office-building" />
        <span className="flex min-w-0 items-center gap-1 text-xs">
          <span className="max-w-[7rem] truncate font-medium text-foreground">
            {workspace?.name}
          </span>
          {activeBranch ? (
            <>
              <Iconify className="size-3 text-muted" icon="chevron-right" />
              <span className="max-w-[7rem] truncate text-foreground">{activeBranch.name}</span>
            </>
          ) : null}
        </span>
        <Iconify className="ms-0.5 size-3 text-muted" icon="chevron-down" />
      </Button>

      <Popover.Content className="w-[360px] p-0" placement="bottom start">
        <div className="border-b border-border p-3">
          <div className="mb-2 flex items-center gap-2">
            <Iconify className="size-4 text-muted" icon="office-building" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-foreground">
                {workspace?.name ?? "Workspace"}
              </p>
              <p className="truncate text-xs text-muted">
                {workspace?.plan ? `${workspace.plan} plan` : "Workspace"}
                {workspace?.region ? ` · ${workspace.region}` : ""}
              </p>
            </div>
            {identity.permissions.includes("*") ? (
              <Chip color="accent" size="sm" variant="soft">
                <Chip.Label>Owner</Chip.Label>
              </Chip>
            ) : null}
          </div>
          {/*
           * WHY SearchField.Input (not a raw <Input>): SearchField.Group
           * only wires its flex-1 sizing + focus-ring coordination to
           * SearchField.Input. A raw Input renders visually but drops
           * that plumbing, which is what produced the truncated
           * "earch branches, cities" placeholder in the earlier build.
           * Also widened the popover from 340px → 360px so the input
           * has real breathing room even at long placeholders.
           */}
          <SearchField
            aria-label="Search branches"
            onChange={setQuery}
            value={query}
            variant="secondary"
          >
            <SearchField.Group>
              <SearchField.SearchIcon />
              <SearchField.Input placeholder="Search branches, cities…" />
              <SearchField.ClearButton />
            </SearchField.Group>
          </SearchField>
        </div>

        <div className="max-h-[320px] overflow-y-auto">
          {groupedByRegion.length === 0 ? (
            <div className="flex flex-col items-center gap-1 px-4 py-8 text-xs text-muted">
              <Iconify className="size-6 opacity-50" icon="magnifier" />
              <span>No branches match "{query}"</span>
            </div>
          ) : (
            <ListBox
              aria-label="Branches"
              className="p-1"
              onAction={(key: Key) => handleSelect(String(key))}
              selectedKeys={activeBranchId ? new Set([activeBranchId]) : undefined}
              selectionMode="single"
            >
              {groupedByRegion.map(([region, list]) => (
                <ListBox.Section key={region}>
                  <div className="px-2 pt-2 pb-1 text-[10px] font-semibold tracking-wide text-muted uppercase">
                    {region}
                  </div>
                  {list.map((branch) => (
                    <ListBox.Item key={branch.id} id={branch.id} textValue={branch.name}>
                      <Iconify className="size-4" icon="location" />
                      <div className="flex flex-col items-start gap-0 leading-tight">
                        <Label>{branch.name}</Label>
                        {branch.city ? (
                          <span className="text-[10px] text-muted">{branch.city}</span>
                        ) : null}
                      </div>
                      {branch.id === activeBranchId ? (
                        <Iconify className="ms-auto size-4 text-accent" icon="check" />
                      ) : (
                        <ListBox.ItemIndicator />
                      )}
                    </ListBox.Item>
                  ))}
                </ListBox.Section>
              ))}
            </ListBox>
          )}
        </div>

        <Separator />

        <div className="flex items-center justify-between gap-2 p-2">
          <Button
            className="flex-1"
            onPress={() => {
              setIsOpen(false);
              navigate("/settings/general");
            }}
            size="sm"
            variant="ghost"
          >
            <Iconify className="size-3.5" icon="gear" />
            Manage
          </Button>
          <Button
            className="flex-1"
            onPress={() => {
              setIsOpen(false);
              navigate("/facilities");
            }}
            size="sm"
            variant="ghost"
          >
            <Iconify className="size-3.5" icon="plus" />
            New branch
          </Button>
        </div>
      </Popover.Content>
    </Popover>
  );
}
