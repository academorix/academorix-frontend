/**
 * payment-methods.json — auto-scaffolded from the mock fixture shape.
 *
 * Every field mirrors an observed field in payment-methods.json. Nullability and
 * optionality reflect the actual JSON (a field is nullable if it ever
 * appears as null; optional if it is missing from at least one record).
 * ID fields are branded — see ../ids.ts. Closed enums live in ../enums.ts.
 */
import { z } from "zod";

import { Timestamp } from "../common.js";
import { CardBrand, PaymentMethodStatus } from "../enums.js";
import { PaymentMethodId, TenantId, UserId } from "../ids.js";

import { collectionHelpers } from "./_helpers.js";

export const PaymentMethod = z
  .object({
    id: PaymentMethodId,
    tenant_id: TenantId,
    payer_user_id: UserId,
    gateway: z.enum(["stripe"]),
    gateway_customer_id: z.string(),
    gateway_pm_id: PaymentMethodId,
    brand: CardBrand,
    last4: z.enum(["0005", "0007", "1111", "2222", "3009", "4242", "4444", "5555", "8321", "9995"]),
    exp_month: z.number(),
    exp_year: z.number(),
    is_default: z.boolean(),
    active: z.boolean(),
    created_at: Timestamp,
    updated_at: Timestamp,
    wallet_type: z.string().optional(),
    device_label: z.string().optional(),
    expired_at: Timestamp.optional(),
    expiry_notified_at: Timestamp.optional(),
    status: PaymentMethodStatus.optional(),
    needs_reauth: z.boolean().optional(),
    needs_reauth_reason: z.string().optional(),
    last_decline_code: z.string().optional(),
    last_declined_at: Timestamp.optional(),
    reauth_requested_at: Timestamp.optional(),
    consecutive_decline_count: z.number().optional(),
    removed_from_default_at: Timestamp.optional(),
  })
  .loose();
export type PaymentMethod = z.infer<typeof PaymentMethod>;

export const { array: PaymentMethodList, parse: parsePaymentMethodsJson } =
  collectionHelpers(PaymentMethod);
