<?php

declare(strict_types=1);

namespace Stackra\Geography\Observers;

use Stackra\Geography\Contracts\Data\LanguageInterface;
use Stackra\Geography\Events\Domain\LanguageCreated;
use Stackra\Geography\Events\Domain\LanguageDeleted;
use Stackra\Geography\Events\Domain\LanguageUpdated;
use Stackra\Geography\Models\Language;

/**
 * Lifecycle side effects for {@see Language}.
 *
 * Lowercases the ISO-639-1 code, auto-derives `is_rtl` from `dir`
 * when only one is set, and fires the matching domain events.
 *
 * @category Geography
 *
 * @since    0.1.0
 */
final class LanguageObserver
{
    /**
     * `saving` — normalise code + derive `is_rtl`.
     */
    public function saving(Language $language): void
    {
        $code = $language->{LanguageInterface::ATTR_CODE} ?? null;
        if (\is_string($code) && $code !== '') {
            $language->{LanguageInterface::ATTR_CODE} = \strtolower($code);
        }

        // Derive `is_rtl` from `dir` when caller set `dir` but did
        // NOT explicitly set `is_rtl`. Keeps the two columns consistent
        // without overwriting an explicit boolean.
        $dir = $language->{LanguageInterface::ATTR_DIR} ?? null;
        if (\is_string($dir) && ! $language->isDirty(LanguageInterface::ATTR_IS_RTL)) {
            $language->{LanguageInterface::ATTR_IS_RTL} = ($dir === 'rtl');
        }
    }

    /**
     * `created` — fire the domain event.
     */
    public function created(Language $language): void
    {
        LanguageCreated::dispatch(
            (int) $language->getKey(),
            (string) $language->{LanguageInterface::ATTR_CODE},
        );
    }

    /**
     * `updated` — fire the domain event with the dirty field list.
     */
    public function updated(Language $language): void
    {
        $changes = \array_keys($language->getChanges());
        if ($changes === []) {
            return;
        }

        LanguageUpdated::dispatch(
            (int) $language->getKey(),
            (string) $language->{LanguageInterface::ATTR_CODE},
            $changes,
        );
    }

    /**
     * `deleted` — fire the domain event.
     */
    public function deleted(Language $language): void
    {
        LanguageDeleted::dispatch(
            (int) $language->getKey(),
            (string) $language->{LanguageInterface::ATTR_CODE},
        );
    }
}
