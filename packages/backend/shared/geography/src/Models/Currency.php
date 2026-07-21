<?php

declare(strict_types=1);

namespace Stackra\Geography\Models;

use Stackra\Geography\Contracts\Data\CurrencyInterface;
use Stackra\Geography\Database\Factories\CurrencyFactory;
use Stackra\Geography\Observers\CurrencyObserver;
use Stackra\Geography\Policies\CurrencyPolicy;
use Illuminate\Database\Eloquent\Attributes\ObservedBy;
use Illuminate\Database\Eloquent\Attributes\UseFactory;
use Illuminate\Database\Eloquent\Attributes\UsePolicy;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Nnjeim\World\Models\Currency as WorldCurrency;
use OwenIt\Auditing\Auditable;
use OwenIt\Auditing\Contracts\Auditable as AuditableContract;

/**
 * Eloquent model for a {@see CurrencyInterface}.
 *
 * SUBCLASSES vendor `Nnjeim\World\Models\Currency`. Route binding
 * accepts BOTH the numeric PK AND the ISO-4217 alpha code
 * (case-insensitive).
 *
 * @category Geography
 *
 * @since    0.1.0
 */
#[UseFactory(CurrencyFactory::class)]
#[UsePolicy(CurrencyPolicy::class)]
#[ObservedBy([CurrencyObserver::class])]
class Currency extends WorldCurrency implements AuditableContract, CurrencyInterface
{
    use Auditable;
    use HasFactory;

    /**
     * Cast map — precision is an integer count of decimal places.
     *
     * @var array<string, string>
     */
    protected $casts = [
        CurrencyInterface::ATTR_PRECISION => 'integer',
    ];

    /**
     * Route-model-binding resolver — accepts numeric PK or ISO-4217
     * alpha code (uppercased).
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
                ->where(CurrencyInterface::ATTR_ID, (int) $value)
                ->first();

            return $model;
        }

        /** @var self|null $model */
        $model = static::query()
            ->where(CurrencyInterface::ATTR_CODE, \strtoupper((string) $value))
            ->first();

        return $model;
    }
}
