<?php

declare(strict_types=1);

namespace Academorix\Geography\Models;

use Academorix\Geography\Contracts\Data\CityInterface;
use Academorix\Geography\Database\Factories\CityFactory;
use Academorix\Geography\Observers\CityObserver;
use Academorix\Geography\Policies\CityPolicy;
use Illuminate\Database\Eloquent\Attributes\ObservedBy;
use Illuminate\Database\Eloquent\Attributes\UseFactory;
use Illuminate\Database\Eloquent\Attributes\UsePolicy;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Nnjeim\World\Models\City as WorldCity;
use OwenIt\Auditing\Auditable;
use OwenIt\Auditing\Contracts\Auditable as AuditableContract;

/**
 * Eloquent model for a {@see CityInterface}.
 *
 * SUBCLASSES vendor `Nnjeim\World\Models\City`. High-volume (~150k
 * rows). Repository refuses unscoped `index()` reads to protect the
 * DB — every catalog lookup MUST come pre-filtered by `country_id`
 * or `state_id`.
 *
 * @category Geography
 *
 * @since    0.1.0
 */
#[UseFactory(CityFactory::class)]
#[UsePolicy(CityPolicy::class)]
#[ObservedBy([CityObserver::class])]
class City extends WorldCity implements AuditableContract, CityInterface
{
    use Auditable;
    use HasFactory;
}
