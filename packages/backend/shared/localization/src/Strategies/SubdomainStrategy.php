<?php

declare(strict_types=1);

namespace Stackra\Localization\Strategies;

use Stackra\Localization\Attributes\AsLocaleResolutionStrategy;
use Stackra\Localization\Contracts\Services\LocaleResolutionStrategyInterface;
use Illuminate\Container\Attributes\Config;
use Illuminate\Container\Attributes\Scoped;
use Illuminate\Http\Request;

/**
 * Resolve the active locale from a subdomain hint in the Host
 * header (`fr.example.com` → `fr`).
 *
 * Regex configurable via
 * `config('localization.resolve.subdomain_pattern')`. The default
 * matches BCP-47 language + optional script/region subtags.
 *
 * @category Localization
 *
 * @since    0.1.0
 */
#[AsLocaleResolutionStrategy(name: 'subdomain')]
#[Scoped]
final class SubdomainStrategy implements LocaleResolutionStrategyInterface
{
    /**
     * @param  string  $pattern  Regex applied to the Host header.
     */
    public function __construct(
        #[Config('localization.resolve.subdomain_pattern', '/^([a-z]{2}(-[A-Z]{2,4})?)\\./')] private readonly string $pattern,
    ) {
    }

    /**
     * {@inheritDoc}
     */
    public function resolve(Request $request): ?string
    {
        $host = $request->getHost();
        $matches = [];
        if (\preg_match($this->pattern, $host, $matches) !== 1) {
            return null;
        }

        $capture = $matches[1] ?? null;
        if (! \is_string($capture) || $capture === '') {
            return null;
        }

        return $capture;
    }

    /**
     * {@inheritDoc}
     */
    public function name(): string
    {
        return 'subdomain';
    }
}
