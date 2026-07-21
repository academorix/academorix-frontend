<?php

declare(strict_types=1);

namespace Stackra\Localization\Contracts\Services;

use Stackra\Localization\Data\LocaleResolutionResultData;
use Stackra\Localization\Services\LocaleResolver;
use Illuminate\Container\Attributes\Bind;
use Illuminate\Http\Request;

/**
 * Front-door service the middleware calls to pick the active locale.
 *
 * Walks the chain declared in `config('localization.resolve.chain')`
 * and returns the first strategy hit. Downstream consumers rely on
 * the deterministic ordering — moving a strategy in the chain is a
 * behaviour change, not a config tweak.
 *
 * @category Localization
 *
 * @since    0.1.0
 */
#[Bind(LocaleResolver::class)]
interface LocaleResolverInterface
{
    /**
     * Resolve the active locale for a request.
     *
     * @param  Request  $request  The inbound HTTP request.
     * @return LocaleResolutionResultData  The winning locale + the
     *                                     strategy that produced it.
     */
    public function resolve(Request $request): LocaleResolutionResultData;
}
