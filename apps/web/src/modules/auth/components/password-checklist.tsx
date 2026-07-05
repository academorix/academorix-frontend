/**
 * @file password-checklist.tsx
 * @module modules/auth/components/password-checklist
 *
 * @description
 * A live checklist of the password-policy rules, ticking each item green as
 * the user types. Uses the same rule set the backend enforces (see
 * `providers/auth/password-policy`), so the form only submits when the client
 * predicates already pass and 422s are rare.
 */

import { CheckCircleIcon, XCircleIcon } from "@academorix/ui/icons/outline";

import type { ReactNode } from "react";

import { PASSWORD_RULES } from "@/providers/auth/password-policy";

/** Props for {@link PasswordChecklist}. */
interface PasswordChecklistProps {
  /** The password value the checklist evaluates against. */
  value: string;
}

/**
 * Renders every rule with a checkmark (satisfied) or cross (not yet).
 *
 * @param props - The current password value.
 */
export function PasswordChecklist({ value }: PasswordChecklistProps): ReactNode {
  return (
    <ul className="flex flex-col gap-1.5 text-xs">
      {PASSWORD_RULES.map((rule) => {
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
