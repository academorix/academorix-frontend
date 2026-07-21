<?php

declare(strict_types=1);

namespace Stackra\Localization\Contracts\Services;

use Illuminate\Http\Request;

/**
 * One link in the locale-resolution chain.
 *
 * Every implementer is discovered via
 * {@see \Stackra\Localization\Attributes\AsLocaleResolutionStrategy}
 * and hydrated into
 * {@see LocaleResolutionStrategyRegistryInterface} at boot. The
 * {@see LocaleResolverInterface} iterates the config chain and asks
 * each named strategy in turn — first non-null wins.
 *
 * @category Localization
 *
 * @since    0.1.0
 */
interface LocaleResolutionStrategyInterface
{
    /**
     * Attempt to resolve the caller's active locale from the passed
     * request. Return null when the strategy has no opinion (miss);
     * return a BCP-47 tag when the strategy owns the answer.
     *
     * @param  Request  $request  The inbound HTTP request.
     * @return string|null  BCP-47 tag or null.
     */
    public function resolve(Request $request): ?string;

    /**
     * The strategy's identifier — matches an entry in the config
     * chain. Present so the resolver can report the winning
     * strategy in {@see \Stackra\Localization\Data\LocaleResolutionResultData}.
     */
    public function name(): string;
}
