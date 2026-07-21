<?php

declare(strict_types=1);

namespace Stackra\Versioning\Observers;

use Stackra\Versioning\Contracts\Data\ApiVersionInterface;
use Stackra\Versioning\Enums\ApiVersionStatus;
use Stackra\Versioning\Events\ApiVersionDeprecated;
use Stackra\Versioning\Events\ApiVersionReleased;
use Stackra\Versioning\Events\ApiVersionSunset;
use Stackra\Versioning\Models\ApiVersion;

/**
 * Lifecycle side effects on {@see ApiVersion}.
 *
 * Emits the transition event on `updating -> updated` when the
 * `status` column changes. Uses `updating` to capture the pre-update
 * status so `updated` fires with an accurate `from -> to` transition.
 *
 * @category Versioning
 *
 * @since    0.1.0
 */
final class ApiVersionObserver
{
    /**
     * Per-instance memo of the pre-update status. Populated in
     * `updating`, consumed in `updated` so status-change events fire
     * with the accurate `from -> to` transition.
     *
     * @var array<string, string>
     */
    private array $priorStatus = [];

    /**
     * `updating` — snapshot the pre-update status.
     */
    public function updating(ApiVersion $apiVersion): void
    {
        $current = (string) $apiVersion->getOriginal(ApiVersionInterface::ATTR_STATUS);
        $this->priorStatus[(string) $apiVersion->getKey()] = $current;
    }

    /**
     * `updated` — dispatch the transition event when status changed.
     */
    public function updated(ApiVersion $apiVersion): void
    {
        $key = (string) $apiVersion->getKey();
        if (! isset($this->priorStatus[$key])) {
            return;
        }

        $before = $this->priorStatus[$key];
        $after  = $this->normaliseStatus($apiVersion->{ApiVersionInterface::ATTR_STATUS});
        unset($this->priorStatus[$key]);

        if ($before === $after) {
            return;
        }

        // Fire the transition event that matches the new state.
        match ($after) {
            ApiVersionStatus::Released->value   => ApiVersionReleased::dispatch($apiVersion),
            ApiVersionStatus::Deprecated->value => ApiVersionDeprecated::dispatch($apiVersion),
            ApiVersionStatus::Sunset->value     => ApiVersionSunset::dispatch($apiVersion),
            default                             => null,
        };
    }

    /**
     * Coerce a status value (enum or raw string) to its scalar.
     */
    private function normaliseStatus(mixed $value): string
    {
        if ($value instanceof ApiVersionStatus) {
            return $value->value;
        }

        return (string) $value;
    }
}
