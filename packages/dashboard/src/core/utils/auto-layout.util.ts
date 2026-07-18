/**
 * @file auto-layout.util.ts
 * @module @stackra/dashboard/core/utils
 * @description Auto-layout a widget set — walk the sequence and assign
 *   successive positions in a `columns`-wide grid.
 *
 *   Widgets marked `full` take the whole row, `half` two columns of a
 *   four-column row (or six of twelve), and `third` a third. The
 *   auto-layout is deterministic and fast enough to run on every open.
 */

import type { ILayoutItem } from "@/core/interfaces/layout-item.interface";
import type { IWidgetInstance } from "@/core/interfaces/widget-instance.interface";
import type { WidgetSpan } from "@/core/types/widget-span.type";

import { stableWidgetInstance } from "./stable-widget-instance.util";

/**
 * Auto-layout a sequence of widget catalogue keys.
 *
 * @param keys - Ordered catalogue keys.
 * @param ownerId - Synthetic owner id (feeds deterministic widget ids).
 * @param spanFor - Catalogue accessor mapping a widget key to its span.
 * @param columns - Total column count for the target breakpoint.
 * @returns Auto-laid-out items + the widget instance list.
 */
export function autoLayout(
  keys: readonly string[],
  ownerId: string,
  spanFor: (key: string) => WidgetSpan,
  columns: number,
): { items: ILayoutItem[]; widgets: IWidgetInstance[] } {
  const widgets: IWidgetInstance[] = keys.map((key) => stableWidgetInstance(key, ownerId));
  const items: ILayoutItem[] = [];

  const widthFor = (span: WidgetSpan): number => {
    switch (span) {
      case "full":
        return columns;
      case "half":
        // At `sm` (4 cols) half is 2. At `md` (8) it's 4. At `lg` (12) it's 6.
        return Math.max(1, Math.floor(columns / 2));
      case "third":
        return Math.max(1, Math.floor(columns / 3));
    }
  };

  let cursorX = 0;
  let cursorY = 0;

  for (const widget of widgets) {
    const span = spanFor(widget.widgetType);
    const w = widthFor(span);
    // Full-width widgets get 3 rows; everyone else gets 4 (KPI-card height).
    const h = span === "full" ? 3 : 4;

    // Wrap to the next row when the current one is full.
    if (cursorX + w > columns) {
      cursorX = 0;
      cursorY += 4;
    }

    items.push({ widgetId: widget.id, x: cursorX, y: cursorY, w, h });
    cursorX += w;

    if (cursorX >= columns) {
      cursorX = 0;
      cursorY += h;
    }
  }

  return { items, widgets };
}
