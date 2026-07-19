<?php

declare(strict_types=1);

namespace Academorix\Localization\Strategies;

use Academorix\Localization\Attributes\AsLocaleResolutionStrategy;
use Academorix\Localization\Contracts\Services\LocaleResolutionStrategyInterface;
use Illuminate\Container\Attributes\Config;
use Illuminate\Container\Attributes\Scoped;
use Illuminate\Http\Request;

/**
 * Resolve the active locale from a request header (default: `X-Locale`).
 *
 * Used by SPA + mobile clients that want to pin a locale without
 * touching the URL. Header name configurable via
 * `config('localization.resolve.header_name')`.
 *
 * @category Localization
 *
 * @since    0.1.0
 */
#[AsLocaleResolutionStrategy(name: 'header')]
#[Scoped]
final class HeaderStrategy implements LocaleResolutionStrategyInterface
{
    /**
     * @param  string  $headerName  Request-header name.
     */
    public function __construct(
        #[Config('localization.resolve.header_name', 'X-Locale')] private readonly string $headerName,
    ) {
    }

    /**
     * {@inheritDoc}
     */
    public function resolve(Request $request): ?string
    {
        $value = $request->header($this->headerName);
        if (! \is_string($value) || $value === '') {
            return null;
        }

        return $value;
    }

    /**
     * {@inheritDoc}
     */
    public function name(): string
    {
        return 'header';
    }
}
