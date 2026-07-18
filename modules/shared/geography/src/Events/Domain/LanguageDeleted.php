<?php

declare(strict_types=1);

namespace Academorix\Geography\Events\Domain;

use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * Fired after a language row is deleted.
 *
 * @category Geography
 *
 * @since    0.1.0
 */
final readonly class LanguageDeleted implements ShouldDispatchAfterCommit
{
    use Dispatchable;

    /**
     * @param  int     $languageId  Numeric primary key of the removed row.
     * @param  string  $code        ISO-639-1 alpha-2 of the removed row.
     */
    public function __construct(
        public int $languageId,
        public string $code,
    ) {
    }
}
