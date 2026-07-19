"""One-shot script — register Wave 4 (finance tier) + Wave 6 (observability
tier) ULID prefixes in the foundation registry. 31 new prefixes total:
- Observability (2): arp_ (AuditRetentionPolicy), art_ (ActivityRetentionPolicy)
- Monitoring (6): hck_, hcr_, mal_, map_, mci_, mpr_
- Finance/tax (4): txr_, txj_, txe_, txc_
- Finance/coupon (2): cpn_, crd_
- Finance/membership (4): mbr_, mbp_, mbn_, pss_
- Finance/invoice (3): ivc_, ivl_, crn_
- Finance/transaction (2): trx_, tld_
- Finance/payment (4): pay_, pmt_, pit_, pdi_
- Finance/refund (2): rfd_, rfl_
- Finance/chargeback (2): cbk_, cev_

Idempotent — running twice adds nothing on the second run. Note: aud_ (Audit)
and act_ (Activity) are ALREADY registered from prior waves — this script does
NOT re-register them; the audit/activity modules REUSE the existing entries.
"""
import json
from pathlib import Path
from datetime import date

REG = Path(__file__).resolve().parent.parent / "modules/shared/blueprints/foundation/data/ulid-prefixes.json"
today = date.today().isoformat()

# Retention policy prefixes owned by audit + activity modules.
RETENTION_POLICIES = {
    "arp_": {
        "module": "audit",
        "entity": "AuditRetentionPolicy",
        "description": "Per-tenant retention policy override for the audit lane. Enterprise-only (audit_retention_extended entitlement). retention_years 1..10; override_reason free-text ≥ 20 chars for compliance-officer justification; override_starts_at + optional override_ends_at time bounds. Partial unique index (tenant_id) WHERE deleted_at IS NULL — one active policy per tenant. Composed via HasUlids + BelongsToTenant + HasUserstamps + Auditable + IsRetentionAware + SoftDeletes.",
    },
    "art_": {
        "module": "activity",
        "entity": "ActivityRetentionPolicy",
        "description": "Per-tenant, per-log_name retention policy override for the activity lane. Enterprise entitlement activity_retention_extended gates the write path. retention_days 30..730; override_reason free-text ≥ 20 chars; optional expires_at wall-clock reversion. Distinct from arp_ (AuditRetentionPolicy) — activity feeds the tenant UX vs audit's regulator feed. Composed via HasUlids + BelongsToTenant + HasUserstamps + Auditable + SoftDeletes.",
    },
}

# New prefixes owned by the observability::monitoring module (Wave 6).
MONITORING = {
    "hck_": {
        "module": "monitoring",
        "entity": "HealthCheck",
        "description": "Per-tenant health check configuration. check_type IN {db_ping, redis_ping, queue_depth, memory_usage, cpu_usage, disk_usage, http_endpoint, dns_lookup, tls_expiry, custom_script}. interval_seconds >= 15 (rate-limit floor). timeout_seconds <= interval. Encrypted target column (contains connection strings). Retained while active + 90d grace. Composed via HasUlids + BelongsToTenant + Auditable + SoftDeletes.",
    },
    "hcr_": {
        "module": "monitoring",
        "entity": "HealthCheckRun",
        "description": "Append-only per-execution health check result. status IN {healthy, degraded, unhealthy, timeout, error}. Response body PII-redacted + truncated to 8KB. 7d hot / 30d cold retention (30d hot / 90d cold Enterprise via monitoring_extended_retention). Composed via HasUlids + BelongsToTenant + BelongsToHealthCheck. NO SoftDeletes — hard-purged via retention job.",
    },
    "mal_": {
        "module": "monitoring",
        "entity": "MonitoringAlert",
        "description": "Fired alert record. Linked to a MonitoringAlertPolicy + optionally grouped into a MonitoringIncident. status IN {firing, acknowledged, resolved, suppressed, expired}. severity IN {p1, p2, p3, p4}. 30d hot / 90d cold retention (90d hot / 1y cold Enterprise). Composed via HasUlids + BelongsToTenant + BelongsToMonitoringAlertPolicy + BelongsToMonitoringIncident (nullable) + Auditable.",
    },
    "map_": {
        "module": "monitoring",
        "entity": "MonitoringAlertPolicy",
        "description": "Per-tenant threshold configuration. signal_type IN {health_check_status, error_rate, latency_p95, latency_p99, queue_depth, worker_health, custom_metric}. threshold_operator + threshold_value + window_seconds + consecutive_breaches_required. suppression_config supports after-hours + weekend + silenced_until. Retained while active + 90d grace. Composed via HasUlids + BelongsToTenant + Auditable + SoftDeletes.",
    },
    "mci_": {
        "module": "monitoring",
        "entity": "MonitoringIncident",
        "description": "Grouped alert timeline. Multiple related alerts within 5min window + same severity collapse into one incident. status IN {open, acknowledged, investigating, mitigating, resolved, postmortem}. Auto-resolves when last firing alert clears. P1 incident + resolved → dispatches MonitoringPostmortemRequiredNotification. 90d hot / 1y cold retention (indefinite Enterprise). Composed via HasUlids + BelongsToTenant + HasMonitoringAlerts + Auditable + SoftDeletes.",
    },
    "mpr_": {
        "module": "monitoring",
        "entity": "MonitoringProviderConfig",
        "description": "Per-tenant per-provider connection. provider IN {sentry, datadog, pagerduty, opsgenie, prometheus, custom_webhook}. AES-256 encrypted config (DSN / API key / HMAC secret). enabled_severities filter subset of p1..p4. Circuit-breaker state + retry_config per row. Test-mode dispatches to provider sandbox. Retained while active + 90d grace after soft-delete. Composed via HasUlids + BelongsToTenant + Auditable + SoftDeletes. Distinct from mpc_ (MarketingProviderConfig, Wave 5) — different consent tier + retention.",
    },
}

# New prefixes owned by the finance::tax module (Wave 4).
TAX = {
    "txr_": {
        "module": "tax",
        "entity": "TaxRate",
        "description": "Per-jurisdiction tax rate row with effective_from/effective_to time bounds — supports VAT changes at fiscal-year boundaries. rate_type IN {vat, gst, sales_tax, consumption_tax, digital_services_tax, withholding_tax, stamp_duty, customs, other}. percentage as decimal 5,4 (0.2000 = 20%). is_inclusive vs additive. source IN {manual, provider_synced, import, migration}. Composed via HasUlids + BelongsToTenant + Auditable + SoftDeletes.",
    },
    "txj_": {
        "module": "tax",
        "entity": "TaxJurisdiction",
        "description": "Country/state/city rule catalog. tenant_id nullable — null = platform-wide reference data; non-null = tenant custom (requires tax_jurisdiction_custom Enterprise entitlement). tax_type IN {vat, gst, sales_tax, consumption_tax, digital_services_tax}. nexus_type IN {physical, economic, marketplace} for US sales-tax nexus. Composed via HasUlids + BelongsToTenant + Auditable + SoftDeletes.",
    },
    "txe_": {
        "module": "tax",
        "entity": "TaxExemption",
        "description": "Per-tenant exemption certificate. exemption_type IN {reseller, non_profit, diplomatic, rural, religious, educational, government, medical, disability}. Polymorphic customer (User / Athlete / Organization). Encrypted certificate_document_url (S3 signed). verification_status IN {pending, verified, rejected, expired} with async cross-check against issuing jurisdiction's public registry. 7-year retention post-expiry. Composed via HasUlids + BelongsToTenant + Auditable + SoftDeletes.",
    },
    "txc_": {
        "module": "tax",
        "entity": "TaxCalculation",
        "description": "Immutable per-invoice-line tax computation audit trail. Freezes tax_rate_snapshot + exemption_applied (jsonb) at commit — tax rate changes after invoice issuance never retroactively re-tax historical invoices. provider IN {taxjar, avalara, stripe_tax, native_calculator, custom_webhook}. Referenced by finance::invoice.tax_calculation_id (RESTRICT) + finance::membership.tax_calculation_id. NO SoftDeletes — hard-purge FORBIDDEN inside the module; migrates to tax_calculations_archive on 7y (10y Enterprise). Composed via HasUlids + BelongsToTenant + Auditable.",
    },
}

# New prefixes owned by the finance::coupon module (Wave 4).
COUPON = {
    "cpn_": {
        "module": "coupon",
        "entity": "Coupon",
        "description": "Per-tenant discount code config. discount_type IN {percent, fixed_amount, free_period, first_month_free, bogo, free_shipping}. applicability IN {any, membership_only, specific_membership_plans, minimum_order_value}. Composite unique (tenant_id, code) partial WHERE deleted_at IS NULL AND valid_from <= NOW() AND (valid_until IS NULL OR valid_until >= NOW()) — one ACTIVE coupon per code. issuance_source IN {manual, referral, marketing_campaign, import, api}. Composed via HasUlids + BelongsToTenant + Auditable + SoftDeletes.",
    },
    "crd_": {
        "module": "coupon",
        "entity": "CouponRedemption",
        "description": "Per-use redemption record. Composite unique (tenant_id, coupon_id, customer_type, customer_id, applied_to_type, applied_to_id) prevents double-redeem. Polymorphic customer (User / Athlete) + polymorphic applied_to (Membership / Invoice / Transaction). Frozen discount_snapshot jsonb at redemption. Atomic redemption via SELECT FOR UPDATE row lock. Immutable audit — no SoftDeletes. Distinct from rcd_ (ReferralCode, Wave 5 referrals). Composed via HasUlids + BelongsToTenant + BelongsToCoupon + Auditable.",
    },
}

# New prefixes owned by the finance::membership module (Wave 4).
MEMBERSHIP = {
    "mbr_": {
        "module": "membership",
        "entity": "Membership",
        "description": "Customer's paid subscription contract with the academy. FUNDAMENTALLY DISTINCT from TenantSubscription (SaaS billing). Belongs to Tenant + Region + Branch + Athlete + MembershipPlan. Lifecycle: pending → active → paused → cancelled/lapsed/refunded/expired. Frozen price_snapshot_cents + coupon_snapshot + tax_calculation_snapshot at signing — plan price / VAT changes never retroactively re-price. Atomic invoice creation on create via CreateInvoiceOnMembershipCreated hook (same DB transaction). Renewal retry ladder: day+3 / day+7 / day+14 → lapsed after 3 failures. Cancellation: soft (period-end) vs hard (prorated refund, Enterprise). Composite unique (tenant_id, athlete_id, membership_plan_id) WHERE status IN (pending, active, paused). Composed via HasPrefixedUlid + BelongsToTenant + BelongsToRegion + BelongsToBranch + BelongsToAthlete + BelongsToMembershipPlan + Auditable + HasActivityLog + SoftDeletes.",
    },
    "mbp_": {
        "module": "membership",
        "entity": "MembershipPlan",
        "description": "The SKU catalog. Per-branch — plans NEVER cross branches. billing_interval IN {monthly, quarterly, annual, lifetime}. Optional trial_days (Medium+ via membership_trial_periods). passes_per_period + passes_carry_over. refund_policy IN {no_refund, prorated, full_within_grace, by_admin_approval} + refund_grace_days. Optional age_group_id restriction. max_active_members capacity cap + current_active_members running counter. Composite unique (tenant_id, branch_id, slug) partial. Composed via HasPrefixedUlid + HasSlug + BelongsToTenant + BelongsToBranch + Auditable + HasActivityLog + SoftDeletes.",
    },
    "mbn_": {
        "module": "membership",
        "entity": "MembershipRenewal",
        "description": "APPEND-ONLY per-period billing audit. attempt_number 1..4 progression (retry ladder). status IN {pending, attempting, succeeded, failed_transient, failed_permanent, cancelled}. next_attempt_at computed from retry_config. Recomputes tax + coupon for NEW period (not membership's frozen snapshots). NO SoftDeletes — 7-year financial audit retention. Composed via HasPrefixedUlid + BelongsToTenant + BelongsToMembership + Auditable.",
    },
    "pss_": {
        "module": "membership",
        "entity": "Pass",
        "description": "Per-session admission credit. pass_type IN {standard, trial, bonus, carryover, event, promotional}. valid_from/valid_until time bounds. consumed_at + consumed_by_session_id polymorphic session ref (Wave 3+ sessions). Idempotent consumption — refuses when already consumed OR outside valid window OR parent membership paused. refunded_at (admin override — pass returns to available). Composed via HasPrefixedUlid + BelongsToTenant + BelongsToMembership + Auditable + HasActivityLog + SoftDeletes.",
    },
}

# New prefixes owned by the finance::invoice module (Wave 4).
INVOICE = {
    "ivc_": {
        "module": "invoice",
        "entity": "Invoice",
        "description": "The money-owed record. DISTINCT from `inv_` which is Invitations (auth module) — this uses `ivc_` to disambiguate. Belongs to Tenant. Polymorphic customer (User / Athlete / Organization). Optional membership_id + membership_renewal_id references. Sequential invoice_number per tenant per year (YYYY-000001 or SERIES-YYYY-000001) via Postgres advisory lock. Frozen billing_address + shipping_address + customer_tax_id + currency at issuance. status IN {draft, open, paid, partially_paid, void, uncollectible, pastdue, refunded, disputed, written_off}. Void FORBIDDEN post-payment — use credit note. 7y retention (10y Enterprise). Composed via HasUlids + BelongsToTenant + HasInvoiceLines + HasCreditNotes + Auditable + HasActivityLog + SoftDeletes.",
    },
    "ivl_": {
        "module": "invoice",
        "entity": "InvoiceLine",
        "description": "Per-invoice line item. item_type IN {membership_charge, addon, setup_fee, late_fee, adjustment, one_time_service, tax_line, discount_line}. Draft-only mutation — post-finalize lines are immutable. quantity decimal 10,4 supports fractional (0.5 for half-hour). unit_price_cents may be negative only for discount_line/adjustment. Bankers' rounding on subtotal. Composite unique (tenant_id, invoice_id, line_number) contiguous 1..N. Composed via HasUlids + BelongsToTenant + BelongsToInvoice + Auditable + SoftDeletes.",
    },
    "crn_": {
        "module": "invoice",
        "entity": "CreditNote",
        "description": "Reversal invoice for refunds / adjustments / write-offs. IMMUTABLE after issuance. NO SoftDeletes — retained indefinitely (financial audit). Positive amount_cents (represents money OWED BACK to customer). Sequential credit_note_number per tenant per year (CN-YYYY-000001) via advisory lock. reason IN {refund, adjustment, write_off, duplicate, customer_dispute_resolved, accounting_correction}. status transitions draft → issued → applied (with applied_to polymorphic — refund / invoice / customer_balance). Composed via HasUlids + BelongsToTenant + BelongsToInvoice + Auditable + HasActivityLog.",
    },
}

# New prefixes owned by the finance::transaction module (Wave 4).
TRANSACTION = {
    "trx_": {
        "module": "transaction",
        "entity": "Transaction",
        "description": "The money-movement ledger root. One row per business-level money movement. IMMUTABLE after status='posted'. kind IN {invoice_payment, refund_issued, chargeback_debit, coupon_credit, tax_remittance, fee_charge, adjustment, write_off, bank_deposit, bank_withdrawal, currency_conversion, opening_balance}. Reversal via NEW offsetting transaction (source_transaction_id + reversal_reason). Sequential transaction_number 'TXN-YYYY-NNNNNNNN' per (tenant, year) via advisory lock. Cross-currency freezes exchange_rate_to_base + base_amount_cents (IAS 21). NO SoftDeletes — 7y financial audit (10y Enterprise). Composed via HasUlids + BelongsToTenant + HasLedgerEntries + Auditable + HasActivityLog.",
    },
    "tld_": {
        "module": "transaction",
        "entity": "TransactionLedgerEntry",
        "description": "Double-entry line item. Debit XOR credit per row (DB CHECK + observer). SUM(debits) == SUM(credits) per transaction (load-bearing invariant). account IN 14-entry chart-of-accounts (revenue, accounts_receivable, cash, refunds_owed, refunds_expense, tax_payable, gateway_fees, bank_deposits, write_offs, coupons_expense, chargebacks_expense, accounts_payable, prepayments, deferred_revenue). account_currency matches parent transaction.currency EXCEPT for currency_conversion (mixed-currency invariant exception). IMMUTABLE post-create. Composed via HasUlids + BelongsToTenant + BelongsToTransaction + Auditable.",
    },
}

# New prefixes owned by the finance::payment module (Wave 4).
PAYMENT = {
    "pay_": {
        "module": "payment",
        "entity": "Payment",
        "description": "Successful capture record. IMMUTABLE after create except amount_refunded_cents + amount_disputed_cents + transaction_id (recorded atomically). Belongs to Tenant + Invoice + PaymentIntent (unique 1:1). NEVER carries card PAN/CVV/magnetic-stripe (PCI-DSS Level 1). payment_method_last4 exactly 4 digits. device_fingerprint_hash SHA-256. three_ds_result IN {not_attempted, authenticated, rejected, not_supported, bypassed}. Fires atomic 3-step side effect chain on create: TransactionRecorder.record + Invoice.mark_paid + growth::marketing::CaptureMembershipPurchasedMarketingEvent. 7y retention (10y Enterprise). Composed via HasUlids + BelongsToTenant + BelongsToInvoice + BelongsToPaymentIntent + BelongsToPaymentMethod + HasPaymentDisputes + Auditable + HasActivityLog.",
    },
    "pmt_": {
        "module": "payment",
        "entity": "PaymentMethod",
        "description": "Saved payment token. NEVER card PAN/CVV — provider-scoped tokens only (pm_..., etc.). AES-256 encrypted provider_reference_id. Deduplicated per customer via SHA-256 fingerprint_hash — duplicate detected → re-activate existing. Polymorphic customer (User / Athlete). method_type IN {card, bank_debit, bank_transfer, wallet, installment}. Bank_debit requires verified_at (micro-deposit verification). SoftDeletes with 90d grace + provider-side detach. Composed via HasUlids + BelongsToTenant + Auditable + HasActivityLog + SoftDeletes.",
    },
    "pit_": {
        "module": "payment",
        "entity": "PaymentIntent",
        "description": "In-flight payment intent object. AES-256 encrypted client_secret + provider_reference_id at rest. State machine: initialized → requires_action → requires_confirmation → requires_capture → succeeded (terminal) / cancelled (terminal) / failed (terminal). 3DS2 step-up via next_action_type IN {redirect_to_url, use_stripe_sdk, three_d_secure_redirect, verify_with_micro_deposits, oxxo_display_details}. Atomic Payment.create on transition → succeeded (same DB txn). 90d retention (transient state). Composed via HasUlids + BelongsToTenant + BelongsToInvoice + BelongsToPaymentMethod + Auditable + HasActivityLog + SoftDeletes.",
    },
    "pdi_": {
        "module": "payment",
        "entity": "PaymentDispute",
        "description": "Tenant-visible pre-chargeback lifecycle. State machine: warning_needs_response → warning_under_review → warning_closed (terminal); needs_response → under_review → won / lost / charge_refunded (terminal). Warning states = provider early-warning (funds not yet withdrawn). Full states = funds provisionally withdrawn. On lost: dispatches EscalateDisputeToChargebackJob → creates Chargeback (cbk_). On accept: creates Refund (rfd_) via /accept path. Evidence encrypted at rest. 7y retention (10y Enterprise). Composed via HasUlids + BelongsToTenant + BelongsToPayment + Auditable + HasActivityLog + SoftDeletes.",
    },
}

# New prefixes owned by the finance::refund module (Wave 4).
REFUND = {
    "rfd_": {
        "module": "refund",
        "entity": "Refund",
        "description": "Merchant-initiated money-out. Complementary to Payment (money-in). State machine: pending → awaiting_approval → approved → processing → succeeded (terminal, IMMUTABLE) / failed / cancelled / provider_error / rejected. reason IN {customer_requested, product_not_received, product_unacceptable, duplicate_charge, fraud_confirmed, subscription_cancelled, admin_correction, chargeback_prevention, regulator_required, accounting_correction}. refund_type IN {full, partial, prorated}. refunded_to IN {original_payment_method, customer_balance, bank_transfer, check}. Approval gated by amount/staleness thresholds + always-approve reasons. Segregation of duties enforced (approver ≠ initiator). Sequential 'REF-YYYY-00000001' per tenant per year. On succeeded: 5-step finalization chain (TransactionRecorder offset + CreditNoteIssuer + InvoiceStateUpdater + ClawbackCoordinator + marketing::RefundIssued negative-value). 7y retention (10y Enterprise). Composed via HasUlids + BelongsToTenant + HasRefundLines + Auditable + HasActivityLog + SoftDeletes.",
    },
    "rfl_": {
        "module": "refund",
        "entity": "RefundLine",
        "description": "Per-invoice-line partial refund detail. Freezes proration_config jsonb for period-based refunds (unused_period + pass_credit). Composite unique (tenant_id, refund_id, invoice_line_id). SUM of refund_lines.amount_cents == parent refund.amount_cents (observer invariant). billing_interval IN {daily, weekly, monthly, quarterly, annual, one_time}. IMMUTABLE post-create — corrections require cancelling parent refund + new. NO SoftDeletes — cascade delete via parent refund purge only. Composed via HasUlids + BelongsToTenant + BelongsToRefund + Auditable.",
    },
}

# New prefixes owned by the finance::chargeback module (Wave 4).
CHARGEBACK = {
    "cbk_": {
        "module": "chargeback",
        "entity": "Chargeback",
        "description": "Bank-forced money-out. Complementary to Refund (merchant-initiated). Escalated from PaymentDispute (pdi_) on payment::PaymentDisputeLost, or filed directly via provider webhook. State machine: pending_evidence → evidence_submitted → under_bank_review → won / lost (terminal, IMMUTABLE) / expired (auto-loss) / accepted_refund (RDR path — Visa auto-refund). network IN {visa, mastercard, amex, discover, jcb, unionpay, diners, other} × reason_code catalogue (40+ codes). reason_category IN {fraud, authorization, processing_errors, consumer_disputes, card_recovery}. Sequential 'CBK-YYYY-00000001'. On lost/expired: 5-step finalization chain (2 offsetting transactions — disputed amount + network fee + invoice-disputed + clawback fan-out + marketing::ChargebackFiled negative-value + fraud signal). rdr_eligible (Visa RDR auto-refund, Medium+). ce3_eligible (Compelling Evidence 3.0, Visa fraud, Medium+). Rate monitoring (0.9% Visa VDMP / 1.5% Mastercard MDMP thresholds). 7y retention (10y Enterprise). Composed via HasUlids + BelongsToTenant + HasChargebackEvidence + Auditable + HasActivityLog + EncryptsSensitiveFields + SoftDeletes.",
    },
    "cev_": {
        "module": "chargeback",
        "entity": "ChargebackEvidence",
        "description": "Per-submission evidence bundle. IMMUTABLE at creation — resubmissions create new attempts with submission_attempt_number + 1. Composite unique (tenant_id, chargeback_id, submission_attempt_number). 8 evidence sections: invoice_evidence, receipt_evidence, service_documentation, refund_policy, communication_log, shipping_docs (nullable), customer_signature_evidence (SHA-256 device fingerprint), uncategorized_text. PCI-DSS Req 3.4 scan refuses PAN patterns. Optional ce3_bundle metadata for Compelling Evidence 3.0. Encrypted provider_response. NO SoftDeletes — 7y retention cascade from parent chargeback. Composed via HasUlids + BelongsToTenant + BelongsToChargeback + Auditable + EncryptsSensitiveFields.",
    },
}

doc = json.loads(REG.read_text())
prefixes = doc["prefixes"]
reserved = doc.get("reserved_for_future", {})
history = doc.get("renaming_history", [])

added = 0

# Register every prefix — retention-policies + monitoring + finance tier.
# Idempotent — existing entries are skipped.
for wave_name, entries in (
    ("retention-policies", RETENTION_POLICIES),
    ("monitoring", MONITORING),
    ("tax", TAX),
    ("coupon", COUPON),
    ("membership", MEMBERSHIP),
    ("invoice", INVOICE),
    ("transaction", TRANSACTION),
    ("payment", PAYMENT),
    ("refund", REFUND),
    ("chargeback", CHARGEBACK),
):
    for prefix, meta in entries.items():
        if prefix in prefixes:
            continue
        prefixes[prefix] = {
            "module": meta["module"],
            "entity": meta["entity"],
            "description": meta["description"],
        }
        added += 1

doc["prefixes"] = dict(sorted(prefixes.items()))
if reserved:
    doc["reserved_for_future"] = reserved
else:
    doc.pop("reserved_for_future", None)
doc["renaming_history"] = history

REG.write_text(json.dumps(doc, indent=2, ensure_ascii=False) + "\n")
print("added:", added)
print("total active prefixes now:", len(prefixes))
print("reserved_for_future remaining:", list(doc.get("reserved_for_future", {}).keys()))
