<?php

/**
 * @file packages/compliance/retention/src/Attributes/AsRetentionPolicy.php
 *
 * @description
 * `#[AsRetentionPolicy]` — class-level marker placed on Eloquent
 * model classes to declare a data-retention policy.
 *
 * The framework-tier version of the AI-local attribute that
 * previously lived at
 * `apps/ai-service/src/modules/ai/src/Attributes/AsRetentionPolicy.php`.
 * Every domain module now imports from
 * `Stackra\Retention\Attributes\AsRetentionPolicy` so a
 * single, cross-package retention scanner can discover every
 * marker in the monorepo.
 *
 * ## Why on the model
 *
 * The model IS the retention subject — the compliance module
 * needs the model class to build the retention query, and the
 * `retentionDays` threshold applies to the row's `created_at`
 * (or a configurable date column) on that table. Declaring the
 * policy on the model keeps the "what does this policy cover?"
 * question answerable at a glance without cross-referencing a
 * separate contributor list.
 *
 * ## Discovery
 *
 * {@see \Stackra\Retention\Bootstrappers\RetentionPolicyBootstrapper}
 * walks every class carrying this attribute via the shared
 * {@see \Stackra\Foundation\Contracts\DiscoversAttributes}
 * seam and emits a
 * {@see \Stackra\Retention\Support\RetentionPolicyDescriptor}
 * into the
 * {@see \Stackra\Retention\Registry\RetentionPolicyRegistry}.
 *
 * ## Actions
 *
 * See {@see \Stackra\Retention\Enums\RetentionAction}. The
 * `Delete` case is the only one with a working v1 implementation;
 * `Archive` and `Anonymize` are legitimate deferrals that log a
 * warning and no-op until per-model transform logic ships.
 *
 * @see \Stackra\Retention\Enums\RetentionAction Backing enum for the `action` argument.
 * @see \Stackra\Retention\Registry\RetentionPolicyRegistry Discovery target.
 */

declare(strict_types=1);

namespace Stackra\Retention\Attributes;

use Stackra\Retention\Enums\RetentionAction;
use Attribute;

/**
 * Data-retention policy marker for Eloquent models.
 *
 * ## What this class owns
 *
 *  * `key` — stable machine-readable identifier (`ai.run`).
 *  * `label` — human label for admin surfaces.
 *  * `description` — prose rationale.
 *  * `retentionDays` — age threshold in days before the policy
 *    fires.
 *  * `action` — {@see RetentionAction} case (delete / archive /
 *    anonymize).
 *  * `dateColumn` — the date column the runner compares against
 *    `now() - retentionDays`. Defaults to `created_at`, override
 *    for models using a different age column
 *    (e.g. `completed_at` on a job table).
 *  * `enabled` — feature-flag toggle. `false` skips the policy at
 *    discovery time without deleting the marker (kept for
 *    audit-trail continuity).
 *
 * @category Retention
 *
 * @since    0.1.0
 */
#[Attribute(Attribute::TARGET_CLASS)]
final readonly class AsRetentionPolicy
{
    /**
     * @param  string  $key
     *                       Stable dot-separated identifier the compliance module
     *                       uses to reference the policy in audit logs and admin
     *                       surfaces (e.g. `ai.run`, `ai.tool_call`, `ai.draft`).
     *                       Must be unique across the monorepo — the registry
     *                       throws on duplicate keys at boot for clear
     *                       diagnostics.
     * @param  string  $label
     *                         Human-readable label rendered by admin surfaces —
     *                         `GET /admin/compliance/retention-policies` lists these.
     * @param  string  $description
     *                               Prose rationale for the policy — why the retention
     *                               period was chosen, what the operational impact
     *                               is. Displayed on admin surfaces alongside the label
     *                               and included in the compliance audit trail.
     * @param  int  $retentionDays
     *                              Age threshold in days beyond which the policy fires.
     *                              The scheduled retention runner computes
     *                              `$dateColumn < now() - retentionDays` on the
     *                              target model.
     * @param  RetentionAction  $action
     *                                   Retention action — one of {@see RetentionAction::Delete}
     *                                   (hard-delete), {@see RetentionAction::Archive}
     *                                   (cold-storage move — v1 deferral), or
     *                                   {@see RetentionAction::Anonymize} (strip PII —
     *                                   v1 deferral). Defaults to Delete — the most
     *                                   common policy for high-churn audit tables.
     * @param  string  $dateColumn
     *                              Column on the target model the runner compares
     *                              against the cutoff timestamp. Defaults to
     *                              `created_at`. Override when the row's meaningful
     *                              age lives on a different column (e.g.
     *                              `completed_at` on a job row, `sent_at` on a
     *                              notification row).
     * @param  bool  $enabled
     *                         Feature-flag toggle at discovery time. `false` skips
     *                         the marker without deleting it — useful for staging
     *                         a policy that isn't ready to fire in production
     *                         yet, without losing the marker's history.
     */
    public function __construct(
        public string $key,
        public string $label,
        public string $description,
        public int $retentionDays,
        public RetentionAction $action = RetentionAction::Delete,
        public string $dateColumn = 'created_at',
        public bool $enabled = true,
    ) {}
}
