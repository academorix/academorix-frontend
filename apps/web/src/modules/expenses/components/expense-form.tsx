/**
 * @file expense-form.tsx
 * @module modules/expenses/components/expense-form
 *
 * @description
 * Shared create/edit form for a money-out expense. Controlled form seeded from
 * optional initial values; the branch is taken from the active scope. A
 * recurrence interval is only meaningful when the expense is marked recurring.
 */

import {
  Button,
  Card,
  Form,
  Input,
  Label,
  ListBox,
  Select,
  Switch,
  TextField,
} from "@academorix/ui/react";
import { useState } from "react";

import type { Expense, ExpenseCategory, ExpenseStatus } from "@/types";
import type { Key, ReactNode } from "react";

import {
  EXPENSE_CATEGORIES,
  EXPENSE_CATEGORY_LABELS,
  EXPENSE_STATUS_LABELS,
  EXPENSE_STATUSES,
} from "@/types";

/** Recurrence intervals a recurring expense can bill on. */
const RECURRENCES: ReadonlyArray<"monthly" | "quarterly" | "yearly"> = [
  "monthly",
  "quarterly",
  "yearly",
];

/** Editable fields of an expense (excludes server-managed columns). */
export interface ExpenseFormValues {
  category: ExpenseCategory;
  amount: string;
  currency: string;
  status: ExpenseStatus;
  description: string;
  is_recurring: boolean;
  /** Recurrence interval; `""` means "no interval" and maps to `null`. */
  recurrence: "" | "monthly" | "quarterly" | "yearly";
  incurred_at: string;
}

/** Builds the initial form state, merging any provided record over defaults. */
function toFormValues(initial?: Partial<Expense>): ExpenseFormValues {
  return {
    category: initial?.category ?? "other",
    amount: initial?.amount ?? "0.00",
    currency: initial?.currency ?? "USD",
    status: initial?.status ?? "draft",
    description: initial?.description ?? "",
    is_recurring: initial?.is_recurring ?? false,
    recurrence: initial?.recurrence ?? "",
    incurred_at: initial?.incurred_at ?? new Date().toISOString().slice(0, 10),
  };
}

/** Converts form values into an expense API payload. */
export function toExpensePayload(
  values: ExpenseFormValues,
  branchId: string | null,
): Partial<Expense> {
  return {
    category: values.category,
    amount: values.amount.trim() || "0.00",
    currency: values.currency.trim() || "USD",
    status: values.status,
    description: values.description.trim(),
    is_recurring: values.is_recurring,
    recurrence: values.is_recurring && values.recurrence !== "" ? values.recurrence : null,
    receipt_document_id: null,
    incurred_at: values.incurred_at,
    ...(branchId ? { branch_id: branchId } : {}),
  };
}

/** Props for {@link ExpenseForm}. */
interface ExpenseFormProps {
  initialValues?: Partial<Expense>;
  isSubmitting: boolean;
  onSubmit: (values: ExpenseFormValues) => void;
  submitLabel?: string;
}

/**
 * A controlled expense create/edit form.
 *
 * @param props - Initial values, submit state, and submit handler.
 */
export function ExpenseForm({
  initialValues,
  isSubmitting,
  onSubmit,
  submitLabel = "Save",
}: ExpenseFormProps): ReactNode {
  const [values, setValues] = useState<ExpenseFormValues>(() => toFormValues(initialValues));

  const setField = <K extends keyof ExpenseFormValues>(
    key: K,
    value: ExpenseFormValues[K],
  ): void => {
    setValues((current) => ({ ...current, [key]: value }));
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    onSubmit(values);
  };

  return (
    <Card>
      <Form onSubmit={handleSubmit}>
        <Card.Content>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Select
              className="w-full"
              placeholder="Select category"
              value={values.category}
              variant="secondary"
              onChange={(key: Key | null) => setField("category", key as ExpenseCategory)}
            >
              <Label>Category</Label>
              <Select.Trigger>
                <Select.Value />
                <Select.Indicator />
              </Select.Trigger>
              <Select.Popover>
                <ListBox>
                  {EXPENSE_CATEGORIES.map((category) => (
                    <ListBox.Item
                      key={category}
                      id={category}
                      textValue={EXPENSE_CATEGORY_LABELS[category]}
                    >
                      {EXPENSE_CATEGORY_LABELS[category]}
                      <ListBox.ItemIndicator />
                    </ListBox.Item>
                  ))}
                </ListBox>
              </Select.Popover>
            </Select>

            <Select
              className="w-full"
              placeholder="Select status"
              value={values.status}
              variant="secondary"
              onChange={(key: Key | null) => setField("status", key as ExpenseStatus)}
            >
              <Label>Status</Label>
              <Select.Trigger>
                <Select.Value />
                <Select.Indicator />
              </Select.Trigger>
              <Select.Popover>
                <ListBox>
                  {EXPENSE_STATUSES.map((status) => (
                    <ListBox.Item
                      key={status}
                      id={status}
                      textValue={EXPENSE_STATUS_LABELS[status]}
                    >
                      {EXPENSE_STATUS_LABELS[status]}
                      <ListBox.ItemIndicator />
                    </ListBox.Item>
                  ))}
                </ListBox>
              </Select.Popover>
            </Select>

            <TextField
              isRequired
              name="amount"
              value={values.amount}
              variant="secondary"
              onChange={(value) => setField("amount", value)}
            >
              <Label>Amount</Label>
              <Input placeholder="2500.00" />
            </TextField>

            <TextField
              name="currency"
              value={values.currency}
              variant="secondary"
              onChange={(value) => setField("currency", value)}
            >
              <Label>Currency</Label>
              <Input placeholder="USD" />
            </TextField>

            <TextField
              isRequired
              className="sm:col-span-2"
              name="description"
              value={values.description}
              variant="secondary"
              onChange={(value) => setField("description", value)}
            >
              <Label>Description</Label>
              <Input placeholder="Monthly facility rent" />
            </TextField>

            <TextField
              isRequired
              name="incurred_at"
              type="date"
              value={values.incurred_at}
              variant="secondary"
              onChange={(value) => setField("incurred_at", value)}
            >
              <Label>Incurred on</Label>
              <Input />
            </TextField>

            <Select
              className="w-full"
              isDisabled={!values.is_recurring}
              placeholder="Select interval"
              value={values.recurrence}
              variant="secondary"
              onChange={(key: Key | null) =>
                setField("recurrence", (key as "monthly" | "quarterly" | "yearly" | null) ?? "")
              }
            >
              <Label>Recurrence</Label>
              <Select.Trigger>
                <Select.Value />
                <Select.Indicator />
              </Select.Trigger>
              <Select.Popover>
                <ListBox>
                  {RECURRENCES.map((recurrence) => (
                    <ListBox.Item key={recurrence} id={recurrence} textValue={recurrence}>
                      {recurrence}
                      <ListBox.ItemIndicator />
                    </ListBox.Item>
                  ))}
                </ListBox>
              </Select.Popover>
            </Select>

            <div className="flex items-center sm:col-span-2">
              <Switch
                isSelected={values.is_recurring}
                onChange={(selected) => setField("is_recurring", selected)}
              >
                <Switch.Content>
                  <Switch.Control>
                    <Switch.Thumb />
                  </Switch.Control>
                  Recurring
                </Switch.Content>
              </Switch>
            </div>
          </div>
        </Card.Content>

        <Card.Footer className="mt-4 justify-end">
          <Button isDisabled={isSubmitting} isPending={isSubmitting} type="submit">
            {submitLabel}
          </Button>
        </Card.Footer>
      </Form>
    </Card>
  );
}
