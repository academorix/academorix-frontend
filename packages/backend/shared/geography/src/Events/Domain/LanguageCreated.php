<?php

declare(strict_types=1);

namespace Stackra\Geography\Events\Domain;

use Illuminate\Contracts\Events\ShouldDispatchAfterCommit;
use Illuminate\Foundation\Events\Dispatchable;

use Stackra\Events\Attributes\AsEvent;
/**
 * Fired after a language row is persisted.
 *
 * @category Geography
 *
 * @since    0.1.0
 */
#[AsEvent]
final readonly class LanguageCreated implements ShouldDispatchAfterCommit
{
    use Dispatchable;

    /**
     * @param  int     $languageId  Numeric primary key.
     * @param  string  $code        ISO-639-1 alpha-2.
     */
    public function __construct(
        public int $languageId,
        public string $code,
    ) {
    }
}
