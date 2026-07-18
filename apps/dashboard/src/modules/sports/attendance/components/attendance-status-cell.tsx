/**
 * @file attendance-status-cell.tsx
 * @module modules/sports/attendance/components/attendance-status-cell
 *
 * @description
 * Inline attendance capture control: a compact select that patches a record's
 * attendance status via Refine's `useUpdate`. This makes the list a capture
 * surface — coaches mark present/absent/late/excused directly in the grid.
 */

import { Label, ListBox, Select } from "@stackra/ui/react";
import { useUpdate } from "@refinedev/core";

import type { Attendance } from "@/types";
import type { Key, ReactNode } from "react";

import { ATTENDANCE_STATUS_LABELS, ATTENDANCE_STATUSES } from "@/types";

/** An inline select that captures/updates a record's attendance status. */
export function AttendanceStatusCell({ record }: { record: Attendance }): ReactNode {
  const { mutate: update } = useUpdate();

  return (
    <Select
      aria-label="Attendance status"
      className="w-[140px]"
      value={record.status}
      variant="secondary"
      onChange={(key: Key | null) => {
        if (key) {
          update({ resource: "attendance", id: record.id, values: { status: key } });
        }
      }}
    >
      <Label className="sr-only">Attendance status</Label>
      <Select.Trigger>
        <Select.Value />
        <Select.Indicator />
      </Select.Trigger>
      <Select.Popover>
        <ListBox>
          {ATTENDANCE_STATUSES.map((status) => (
            <ListBox.Item key={status} id={status} textValue={ATTENDANCE_STATUS_LABELS[status]}>
              {ATTENDANCE_STATUS_LABELS[status]}
              <ListBox.ItemIndicator />
            </ListBox.Item>
          ))}
        </ListBox>
      </Select.Popover>
    </Select>
  );
}
