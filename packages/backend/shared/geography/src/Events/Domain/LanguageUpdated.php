<?php

declare(strict_types=1);

namespace Academorix\Geography\Events\Domain;

use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;

use Academorix\Events\Attributes\AsEvent;
/**
 * Fired after a language row is updated.
 *
 * @category Geography
 *
 * @since    0.1.0
 */
#[AsEvent]
final readonly class LanguageUpdated implements ShouldDispatchAfterCommit
{
    use Dispatchable;

    /**
     * @param  int           $languageId     Numeric primary key.
     * @param  string        $code           ISO-639-1 alpha-2.
     * @param  list<string>  $changedFields  Column names touched by the update.
     */
    public function __construct(
        public int $languageId,
        public string $code,
        public array $changedFields,
    ) {
    }
}
