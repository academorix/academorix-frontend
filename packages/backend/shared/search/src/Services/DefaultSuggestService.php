<?php

declare(strict_types=1);

namespace Academorix\Search\Services;

use Academorix\Search\Contracts\Services\SuggestServiceInterface;
use Illuminate\Container\Attributes\Scoped;

/**
 * Minimum-viable {@see SuggestServiceInterface}.
 *
 * Returns an empty completion set. Real prefix-match dispatch lands
 * with the engine-adapter build-out.
 *
 * `#[Scoped]` — the service depends on the resolved tenant + user
 * scope for permission filtering.
 *
 * @category Search
 *
 * @since    0.1.0
 */
#[Scoped]
final class DefaultSuggestService implements SuggestServiceInterface
{
    /**
     * {@inheritDoc}
     */
    public function suggest(string $prefix, array $options = []): array
    {
        // Scaffold — empty completion set until the engine adapters
        // ship. Callers get a stable shape and can wire the UI
        // against it today.
        unset($prefix, $options); // suppress unused-param warnings.

        return [];
    }
}
