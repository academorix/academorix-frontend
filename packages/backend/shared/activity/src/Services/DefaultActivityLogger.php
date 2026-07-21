<?php

declare(strict_types=1);

namespace Stackra\Activity\Services;

use Stackra\Activity\Contracts\Data\ActivityInterface;
use Stackra\Activity\Contracts\Services\ActivityLoggerInterface;
use Stackra\Activity\Models\Activity;
use Stackra\Tenancy\Contracts\Services\TenantContextInterface;
use Illuminate\Container\Attributes\Auth;
use Illuminate\Container\Attributes\Scoped;
use Illuminate\Contracts\Auth\Factory as AuthFactory;
use Illuminate\Database\Eloquent\Model;
use Spatie\Activitylog\Contracts\Activity as SpatieActivityContract;

/**
 * Default implementation of {@see ActivityLoggerInterface}.
 *
 * Thin facade over spatie's `activity()` helper — the caller passes
 * the log_name + description + optional subject / causer; we auto-fill
 * `tenant_id` from the resolved TenantContext and (when the caller
 * omitted `$causer`) the current auth user.
 *
 * `#[Scoped]` because the resolved context is per-request state under
 * Octane. A singleton here would capture the boot-time TenantContext
 * and serve stale tenants to every subsequent request (see
 * `.kiro/steering/octane-first-di.md`).
 *
 * @category Activity
 *
 * @since    0.1.0
 */
#[Scoped]
final class DefaultActivityLogger implements ActivityLoggerInterface
{
    /**
     * @param  TenantContextInterface  $tenantContext  Request-scoped
     *                                                 tenant resolver.
     * @param  AuthFactory             $authFactory    Auth guard factory
     *                                                 (attribute-injected).
     */
    public function __construct(
        private readonly TenantContextInterface $tenantContext,
        #[Auth] private readonly AuthFactory $authFactory,
    ) {
    }

    /**
     * {@inheritDoc}
     */
    public function record(
        string $logName,
        string $description,
        array $properties = [],
        ?Model $subject = null,
        ?Model $causer = null,
    ): Activity {
        // Master kill-switch — when activity is off (typically during
        // an incident where the log volume IS the incident), return a
        // synthetic row without persisting. Callers can still branch
        // on the returned model but the DB stays untouched.
        if (! (bool) \config('activity.enabled', true)) {
            $synthetic = new Activity();
            $synthetic->setAttribute(ActivityInterface::ATTR_LOG_NAME, $logName);
            $synthetic->setAttribute(ActivityInterface::ATTR_DESCRIPTION, $description);

            return $synthetic;
        }

        // Resolve the causer — caller override wins; otherwise fall
        // back to the current Sanctum user; otherwise null (system).
        $resolvedCauser = $causer ?? $this->resolveCauser();

        // Kick off spatie's fluent builder. The chain is safe to call
        // even when $subject / $resolvedCauser are null — spatie
        // no-ops those branches.
        $logger = \activity($logName);

        if ($resolvedCauser !== null) {
            $logger->causedBy($resolvedCauser);
        }

        if ($subject !== null) {
            $logger->performedOn($subject);
        }

        if ($properties !== []) {
            $logger->withProperties($properties);
        }

        // spatie's `log(...)` returns their Activity model instance;
        // our Activity model extends theirs, so the returned instance
        // is a subclass. Cast for the typed return.
        /** @var SpatieActivityContract|null $row */
        $row = $logger->log($description);

        // spatie can return null when the log is filtered out by an
        // upstream event listener. Return a synthetic detached model
        // rather than propagating null — callers rely on the typed
        // return.
        if ($row === null) {
            $detached = new Activity();
            $detached->setAttribute(ActivityInterface::ATTR_LOG_NAME, $logName);
            $detached->setAttribute(ActivityInterface::ATTR_DESCRIPTION, $description);

            return $detached;
        }

        /** @var Activity $row */
        return $row;
    }

    /**
     * Resolve the causer via the configured auth guard.
     *
     * Failure to resolve is intentionally silent — activity logging
     * MUST NOT fail an unrelated business flow because auth wasn't
     * bound in the current context (queue worker, console command).
     */
    private function resolveCauser(): ?Model
    {
        $guardName = (string) \config('activity.causer.guard', 'sanctum');

        try {
            $user = $this->authFactory->guard($guardName)->user();
        } catch (\Throwable) {
            return null;
        }

        return $user instanceof Model ? $user : null;
    }
}
