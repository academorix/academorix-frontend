/**
 * @file devtools-panel-empty.component.tsx
 * @module @stackra/devtools/react/components
 * @description Rendered inside the panel viewport when the registry
 *   is empty (no panels contributed yet) or when no panel is
 *   selected.
 */

import { type ReactElement } from "react";
import { EmptyState } from "@stackra/ui/react";
import { CubeTransparentIcon } from "@stackra/ui/icons/heroicon/outline";

import type { DevtoolsPanelEmptyProps } from "./devtools-panel-empty.interface";

/**
 * Panel-viewport empty state.
 */
export function DevtoolsPanelEmpty({ title, description }: DevtoolsPanelEmptyProps): ReactElement {
  return (
    <div
      className="flex h-full w-full items-center justify-center p-6"
      data-devtools-panel-empty=""
    >
      <EmptyState>
        <EmptyState.Header>
          <EmptyState.Media>
            <CubeTransparentIcon aria-hidden="true" className="text-muted size-8" />
          </EmptyState.Media>
          <EmptyState.Title>{title ?? "No panel selected"}</EmptyState.Title>
          <EmptyState.Description>
            {description ??
              "Select a panel from the rail on the left, or contribute one from a package with @DevtoolsPanel(...)."}
          </EmptyState.Description>
        </EmptyState.Header>
      </EmptyState>
    </div>
  );
}
