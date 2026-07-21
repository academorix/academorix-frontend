<?php

/**
 * @file packages/architecture/src/Attributes/AllowsDirectModelAccess.php
 *
 * @description
 * Explicit escape hatch: this class is allowed to import Model
 * classes DIRECTLY, bypassing the
 * {@see \Stackra\Architecture\Rules\NoDirectModelAccessRule}.
 *
 * ## When to use
 *
 * Reach for this attribute only when the alternatives —
 * introducing a Repository, moving the code, or adding the file
 * to the config allowlist — are all worse than a one-off
 * exception. Legitimate reasons:
 *
 *   - Ad-hoc console commands doing DBA-style maintenance.
 *   - Test-only helpers that don't live under `tests/`.
 *   - Legacy code kept intact during a migration to the layered
 *     architecture.
 *
 * ## Requires a reason
 *
 * The `$reason` argument is REQUIRED. It's echoed in the scanner
 * output when it wants to remind you why the exception exists —
 * "temporary — remove after billing v2 lands" is more useful in
 * a diff than a bare marker.
 *
 * ## Usage
 *
 * ```php
 * use Stackra\Architecture\Attributes\AllowsDirectModelAccess;
 *
 * #[AllowsDirectModelAccess(reason: 'One-off DBA script — remove after billing v2 lands.')]
 * final class BackfillInvoiceStatusCommand extends Command
 * {
 *     public function handle(): int
 *     {
 *         Invoice::query()->whereNull('status')->update(['status' => 'pending']);
 *
 *         return self::SUCCESS;
 *     }
 * }
 * ```
 *
 * @see \Stackra\Architecture\Attributes\Domain      Marker for the Model side.
 * @see \Stackra\Architecture\Attributes\Repository  Preferred alternative to this attribute.
 */

declare(strict_types=1);

namespace Stackra\Architecture\Attributes;

use Attribute;
use InvalidArgumentException;

/**
 * Waive the Model-access rule on this class. Requires an
 * explanation — see class docblock.
 *
 * @final
 */
#[Attribute(Attribute::TARGET_CLASS)]
final class AllowsDirectModelAccess
{
    /**
     * @param  string  $reason  Human-readable justification. Kept
     *                          in code so reviewers see it in the
     *                          diff. The scanner echoes it in
     *                          verbose output.
     *
     * @throws InvalidArgumentException When `$reason` is empty
     *                                  after trimming — no
     *                                  silent escape hatches.
     */
    public function __construct(public readonly string $reason)
    {
        if (trim($reason) === '') {
            throw new InvalidArgumentException(
                '#[AllowsDirectModelAccess] requires a non-empty `reason` argument.',
            );
        }
    }
}
