<?php

declare(strict_types=1);

namespace Academorix\Search\Contracts\Services;

use Academorix\Search\Services\DefaultSuggestService;
use Illuminate\Container\Attributes\Bind;

/**
 * Autocomplete / suggest surface.
 *
 * Consumers reach this contract from `GET /api/v1/search/suggest`.
 * The default implementation delegates to the resolved engine
 * adapter's native prefix-match capability.
 *
 * @category Search
 *
 * @since    0.1.0
 */
#[Bind(DefaultSuggestService::class)]
interface SuggestServiceInterface
{
    /**
     * Suggest completions for a prefix.
     *
     * @param  string               $prefix   Query prefix.
     * @param  array<string, mixed> $options  Options — `index`, `limit`,
     *                                        `language`.
     * @return list<array<string, mixed>>
     */
    public function suggest(string $prefix, array $options = []): array;
}
