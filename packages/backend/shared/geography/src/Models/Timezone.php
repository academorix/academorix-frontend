<?php

declare(strict_types=1);

namespace Stackra\Geography\Models;

use Stackra\Geography\Contracts\Data\TimezoneInterface;
use Stackra\Geography\Database\Factories\TimezoneFactory;
use Stackra\Geography\Observers\TimezoneObserver;
use Stackra\Geography\Policies\TimezonePolicy;
use Illuminate\Database\Eloquent\Attributes\ObservedBy;
use Illuminate\Database\Eloquent\Attributes\UseFactory;
use Illuminate\Database\Eloquent\Attributes\UsePolicy;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Nnjeim\World\Models\Timezone as WorldTimezone;
use OwenIt\Auditing\Auditable;
use OwenIt\Auditing\Contracts\Auditable as AuditableContract;

/**
 * Eloquent model for a {@see TimezoneInterface}.
 *
 * SUBCLASSES vendor `Nnjeim\World\Models\Timezone`. Route binding
 * accepts BOTH the numeric PK AND the URL-encoded IANA name (e.g.
 * `Europe%2FParis`).
 *
 * @category Geography
 *
 * @since    0.1.0
 */
#[UseFactory(TimezoneFactory::class)]
#[UsePolicy(TimezonePolicy::class)]
#[ObservedBy([TimezoneObserver::class])]
class Timezone extends WorldTimezone implements AuditableContract, TimezoneInterface
{
    use Auditable;
    use HasFactory;

    /**
     * Route-model-binding resolver — accepts numeric PK or IANA name.
     * The IANA form is URL-decoded first (`Europe%2FParis` →
     * `Europe/Paris`) before the DB lookup.
     *
     * @param  mixed        $value  URL segment.
     * @param  string|null  $field  Optional explicit binding field.
     * @return $this|null
     */
    public function resolveRouteBinding($value, $field = null): ?self
    {
        if ($field !== null) {
            /** @var self|null $model */
            $model = static::query()->where($field, $value)->first();

            return $model;
        }

        if (\is_numeric($value)) {
            /** @var self|null $model */
            $model = static::query()
                ->where(TimezoneInterface::ATTR_ID, (int) $value)
                ->first();

            return $model;
        }

        // URL-decode the IANA name — the router may present it either
        // URL-encoded (`Europe%2FParis`) or plain when only one path
        // segment is used with a wildcard match.
        $name = \rawurldecode((string) $value);

        /** @var self|null $model */
        $model = static::query()
            ->where(TimezoneInterface::ATTR_NAME, $name)
            ->first();

        return $model;
    }
}
