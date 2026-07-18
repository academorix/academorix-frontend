<?php

declare(strict_types=1);

namespace Academorix\Compliance\Attributes;

use Attribute;

/**
 * Declare that a model class supports legal hold.
 *
 * The `LegalHoldGate` scans registered classes at boot; runtime
 * calls check the `LegalHold` table for freezes on this model's
 * rows before any purge / erase / hard-delete action.
 *
 * ```php
 * #[LegalHoldable(
 *     subject: 'owner_id',
 *     scopesSupported: ['subject', 'tenant', 'case'],
 * )]
 * final class Message extends Model
 * {
 * }
 * ```
 *
 * @category Compliance
 *
 * @since    0.1.0
 */
#[Attribute(Attribute::TARGET_CLASS)]
final readonly class LegalHoldable
{
    /**
     * @param  string|null   $subject         Column pointing at the subject id (nullable for class-scope-only rows).
     * @param  list<string>  $scopesSupported Supported hold scopes.
     * @param  string        $onSoftDelete    `allow` / `refuse` when soft-deleting a held row.
     */
    public function __construct(
        public ?string $subject = null,
        public array $scopesSupported = ['subject', 'tenant', 'case', 'class'],
        public string $onSoftDelete = 'allow',
    ) {
    }
}
