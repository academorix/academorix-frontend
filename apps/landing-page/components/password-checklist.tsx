/**
 * @file password-checklist.tsx
 * @module components/password-checklist
 *
 * @description
 * Live checklist under the password field. Consumes pre-compiled rules
 * from `@/lib/marketing/password` (compiled by the parent from
 * `getPasswordRules()`).
 */

import { CheckCircleIcon, XCircleIcon } from "@academorix/ui/icons/outline";

import type { CompiledPasswordRule } from "@/lib/marketing/password";
import type { ReactNode } from "react";

/** Props for {@link PasswordChecklist}. */
interface PasswordChecklistProps {
  value: string;
  rules: readonly CompiledPasswordRule[];
}

/** Renders every rule with a checkmark (satisfied) or cross (not yet). */
export function PasswordChecklist({ value, rules }: PasswordChecklistProps): ReactNode {
  return (
    <ul className="flex flex-col gap-1.5 text-xs">
      {rules.map((rule) => {
        const isSatisfied = rule.test(value);

        return (
          <li key={rule.id} className="flex items-center gap-2">
            {isSatisfied ? (
              <CheckCircleIcon aria-hidden="true" className="size-4 text-success" />
            ) : (
              <XCircleIcon aria-hidden="true" className="size-4 text-muted" />
            )}
            <span className={isSatisfied ? "text-foreground" : "text-muted"}>{rule.label}</span>
          </li>
        );
      })}
    </ul>
  );
}
