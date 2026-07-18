<?php

declare(strict_types=1);

namespace Academorix\Localization\Middleware;

use Academorix\Localization\Contracts\Services\LocaleResolverInterface;
use Academorix\Localization\Events\LocaleResolved;
use Academorix\Localization\Services\CachedTranslator;
use Academorix\Routing\Attributes\AsMiddleware;
use Academorix\Tenancy\Contracts\Services\TenantContextInterface;
use Closure;
use Illuminate\Contracts\Auth\Factory as AuthFactory;
use Illuminate\Contracts\Container\Container;
use Illuminate\Contracts\Events\Dispatcher;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Resolves the active locale for the request via the
 * {@see LocaleResolverInterface}, calls `App::setLocale($code)`, and
 * fires `LocaleResolved` for telemetry.
 *
 * When the resolved translator is our
 * {@see CachedTranslator}, this middleware also propagates the
 * active tenant id so the translator can look up tenant-scoped
 * overrides.
 *
 * `priority: 12` — after `request.id` (10) and before `tenant.resolve`
 * (15) so the tenant-default strategy has a resolved tenant to
 * consult. `auto_applied: true` — applied to every `api` + `web`
 * route via the Routing package's middleware discovery.
 *
 * @category Localization
 *
 * @since    0.1.0
 */
#[AsMiddleware(alias: 'locale.resolve', groups: ['api', 'web'], priority: 12)]
final class ResolveLocaleMiddleware
{
    public function __construct(
        private readonly LocaleResolverInterface $resolver,
        private readonly Container $container,
        private readonly Dispatcher $events,
        private readonly TenantContextInterface $tenantContext,
        private readonly AuthFactory $auth,
    ) {
    }

    /**
     * Resolve + apply the locale, then pass control to the next
     * middleware.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $result = $this->resolver->resolve($request);

        // Apply the resolved locale to Laravel's global.
        \app()->setLocale($result->localeCode);

        // Propagate the active tenant id to the decorated translator
        // when one is bound.
        if ($this->container->bound('translator')) {
            $translator = $this->container->make('translator');
            if ($translator instanceof CachedTranslator) {
                $tenant = $this->tenantContext->current();
                $translator->setActiveTenantId($tenant === null ? null : (string) $tenant->getKey());
            }
        }

        // Fire the resolution event for telemetry.
        $tenant = $this->tenantContext->current();
        $user   = null;
        try {
            $user = $this->auth->guard()->user();
        } catch (\Throwable) {
            // Silent — auth may not resolve for anonymous routes.
        }

        $this->events->dispatch(new LocaleResolved(
            tenantId: $tenant === null ? null : (string) $tenant->getKey(),
            userId: $user === null ? null : (string) ($user->getAttribute('id') ?? ''),
            localeCode: $result->localeCode,
            source: $result->source->value,
            fallbackCode: $result->fallbackCode,
        ));

        return $next($request);
    }
}
