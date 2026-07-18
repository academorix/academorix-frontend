/**
 * subscription.json — auto-scaffolded from the mock fixture shape.
 *
 * Every field mirrors an observed field in subscription.json. Nullability and
 * optionality reflect the actual JSON (a field is nullable if it ever
 * appears as null; optional if it is missing from at least one record).
 * ID fields are branded — see ../ids.ts. Closed enums live in ../enums.ts.
 */
import { z } from "zod";

import { Timestamp } from "../common.js";
import { BillingPeriod, SubscriptionStatus } from "../enums.js";
import { PlanTierId, SubscriptionId, TenantId } from "../ids.js";

import { collectionHelpers } from "./_helpers.js";

export const Subscription = z
  .object({
    id: SubscriptionId,
    tenant_id: TenantId,
    plan_key: z.enum(["pro", "starter"]),
    plan_id: PlanTierId,
    status: SubscriptionStatus,
    billing_period: BillingPeriod,
    currency: z.enum(["USD"]),
    price_minor: z.number(),
    provider: z.enum(["paddle"]),
    provider_subscription_id: SubscriptionId,
    trial_ends_at: Timestamp.nullable(),
    current_period_starts_at: Timestamp,
    current_period_ends_at: Timestamp,
    next_bill_at: Timestamp.nullable(),
    grace_ends_at: Timestamp.nullable(),
    canceled_at: Timestamp.nullable(),
    cancel_at_period_end: z.boolean(),
    created_at: Timestamp,
    updated_at: Timestamp,
    last_payment_failure_reason: z.string().optional(),
    last_payment_failed_at: Timestamp.optional(),
    retry_count: z.number().optional(),
    cancellation_reason: z.string().optional(),
    paused_at: Timestamp.optional(),
    pause_reason: z.string().optional(),
    resume_scheduled_at: Timestamp.optional(),
    paddle_customer_id: z.string().optional(),
    paddle_subscription_id: SubscriptionId.optional(),
    notes: z.string().optional(),
    previous_subscription_id: SubscriptionId.optional(),
  })
  .loose();
export type Subscription = z.infer<typeof Subscription>;

export const { array: SubscriptionList, parse: parseSubscriptionJson } =
  collectionHelpers(Subscription);
