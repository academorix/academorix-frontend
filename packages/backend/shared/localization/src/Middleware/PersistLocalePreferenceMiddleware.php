<?php

declare(strict_types=1);

namespace Stackra\Localization\Middleware;

use Stackra\Localization\Events\LocaleChanged;
use Stackra\Routing\Attributes\AsMiddleware;
use Stackra\Tenancy\Contracts\Services\TenantContextInterface;
use Closure;
use Illuminate\Container\Attributes\Config;
use Illuminate\Contracts\Auth\Factory as AuthFactory;
use Illuminate\Contracts\Events\Dispatcher;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Post-response middleware — persists the resolved locale to the
 * user's `profile.preferred_locale` when the caller submitted an
 * explicit `?locale=` / `X-Locale` header AND the value differs
 * from the stored preference.
 *
 * Skipped for stateless requests (no authenticated user) and when
 * `config('localization.resolve.persist_user_preference')=false`.
 *
 * `priority: 55` — after auth (35) so the resolved user is
 * available. Not auto-applied — consumer apps opt in per-route via
 * the alias `locale.persist`.
 *
 * @category Localization
 *
 * @since    0.1.0
 */
#[AsMiddleware(alias: 'locale.persist', priority: 55)]
final class PersistLocalePreferenceMiddleware
{
    public function __construct(
        private readonly AuthFactory $auth,
        private readonly Dispatcher $events,
        private readonly TenantContextInterface $tenantContext,
        #[Config('localization.resolve.persist_user_preference', true)] private readonly bool $enabled,
        #[Config('localization.resolve.query_key', 'locale')] private readonly string $queryKey,
        #[Config('localization.resolve.header_name', 'X-Locale')] private readonly string $headerName,
    ) {
    }

    /**
     * Persist the preference — runs BEFORE the response so we can
     * short-circuit cleanly on any read failure.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        if (! $this->enabled) {
            return $response;
        }

        // Only act on explicit overrides — implicit resolution paths
        // (accept-language, subdomain) shouldn't rewrite the user's
        // stored preference.
        $override = $request->query($this->queryKey) ?? $request->header($this->headerName);
        if (! \is_string($override) || $override === '') {
            return $response;
        }

        try {
            $user = $this->auth->guard()->user();
        } catch (\Throwable) {
            return $response;
        }

        if ($user === null) {
            return $response;
        }

        $current = $user->getAttribute('preferred_locale');
        if ($current === $override) {
            return $response;
        }

        // Persist. Wrapped in try/catch — a persistence failure
        // shouldn't fail the underlying business flow.
        try {
            $user->setAttribute('preferred_locale', $override);
            $user->save();

            $tenant = $this->tenantContext->current();

            $this->events->dispatch(new LocaleChanged(
                userId: (string) ($user->getAttribute('id') ?? ''),
                tenantId: $tenant === null ? '' : (string) $tenant->getKey(),
                fromLocale: (string) ($current ?? ''),
                toLocale: $override,
            ));
        } catch (\Throwable) {
            // Silent — persistence failures are diagnostics, not
            // request failures.
        }

        return $response;
    }
}
