<?php

declare(strict_types=1);

namespace Stackra\Settings\Listeners;

use Stackra\Audit\Contracts\Data\AuditInterface;
use Stackra\Audit\Models\Audit;
use Stackra\Settings\Events\SettingsChangeEvent;
use Illuminate\Container\Attributes\Bind;
use Illuminate\Container\Attributes\Scoped;
use Illuminate\Contracts\Auth\Factory as AuthFactory;
use Illuminate\Http\Request;
use Psr\Log\LoggerInterface;
use Throwable;

/**
 * Compliance-trail audit listener — writes one `audits` row per
 * changed field for every `SettingsChangeEvent`.
 *
 * Sink for the compliance / DPO console. Settings aren't
 * Eloquent models, so `owen-it/laravel-auditing`'s automatic
 * `Auditable` observer path doesn't apply — this listener writes
 * to the `audits` table directly using a synthetic
 * `auditable_type = "Stackra\\Settings\\Group\\<group>"` and
 * `auditable_id = <field_key>`. That lets the compliance
 * `/api/v1/audits?filter[auditable_type]=...` query slice by
 * group cleanly, and preserves the field-level diff shape.
 *
 * Retention is 7 years — the shared `Audit` model composes
 * `#[RetentionPolicy]` with `RetentionAction::Archive`,
 * discovered by the retention package's runner.
 *
 * ## Failure semantics
 *
 * Same as the sibling listener — every write is wrapped in a
 * `try { ... } catch (Throwable) { log }` so a broken audits
 * table never blocks the settings mutation. In practice the
 * compliance table is more durable than the activity feed, so
 * this catch is defensive.
 *
 * ## Octane safety
 *
 * `#[Scoped]` — resolves fresh per request. Reads the current
 * request (for URL / IP / User-Agent capture) via constructor
 * injection, not a facade.
 *
 * @category Settings
 *
 * @since    0.1.0
 */
#[Bind(self::class)]
#[Scoped]
final class WriteSettingsChangeToAudit
{
    /**
     * @param  AuthFactory  $auth  Injected auth factory — resolves the current authenticated user id + class.
     * @param  Request  $request  Injected request — captures url / ip / user-agent for the audit row.
     * @param  LoggerInterface  $log  Fallback log channel — used when the audit insert fails.
     */
    public function __construct(
        private readonly AuthFactory $auth,
        private readonly Request $request,
        private readonly LoggerInterface $log,
    ) {}

    /**
     * Handle the settings-change event.
     *
     * Writes one audit row per changed field. Every row carries
     * the same synthetic auditable_type (`Stackra\Settings\Group\<group>`)
     * so the compliance console can filter by group.
     */
    public function handle(SettingsChangeEvent $event): void
    {
        $user = $this->auth->guard()->user();
        $userId = $user?->getAuthIdentifier();
        $userType = $user !== null ? $user::class : null;

        $auditableType = sprintf('Stackra\\Settings\\Group\\%s', $event->group);

        $url = (string) $this->request->fullUrl();
        $ip = $this->request->ip();
        $userAgent = (string) ($this->request->userAgent() ?? '');

        foreach ($event->changedFields as $fieldKey) {
            try {
                /** @var mixed $newValue */
                $newValue = $event->values[$fieldKey] ?? null;

                Audit::query()->create([
                    AuditInterface::ATTR_TENANT_ID => $event->tenantId !== null
                        ? (string) $event->tenantId
                        : null,
                    AuditInterface::ATTR_USER_ID => $userId,
                    AuditInterface::ATTR_USER_TYPE => $userType,
                    AuditInterface::ATTR_EVENT => 'updated',
                    AuditInterface::ATTR_AUDITABLE_TYPE => $auditableType,
                    AuditInterface::ATTR_AUDITABLE_ID => $fieldKey,
                    // Old snapshot is unknown at this seam — the settings
                    // service dispatched only the new values. Compliance
                    // consumers reading paired rows for a diff are
                    // expected to correlate against the previous audit
                    // row for the same (auditable_type, auditable_id).
                    AuditInterface::ATTR_OLD_VALUES => null,
                    AuditInterface::ATTR_NEW_VALUES => [$fieldKey => $newValue],
                    AuditInterface::ATTR_URL => $url,
                    AuditInterface::ATTR_IP_ADDRESS => $ip,
                    AuditInterface::ATTR_USER_AGENT => $userAgent,
                    AuditInterface::ATTR_TAGS => 'settings',
                ]);
            } catch (Throwable $e) {
                $this->log->warning('SettingsChangeAuditWriteFailed', [
                    'group' => $event->group,
                    'field_key' => $fieldKey,
                    'exception' => $e::class,
                    'message' => $e->getMessage(),
                ]);
            }
        }
    }
}
