<?php

declare(strict_types=1);

namespace Stackra\Geography\Models;

use Stackra\Geography\Contracts\Data\StateInterface;
use Stackra\Geography\Database\Factories\StateFactory;
use Stackra\Geography\Observers\StateObserver;
use Stackra\Geography\Policies\StatePolicy;
use Illuminate\Database\Eloquent\Attributes\ObservedBy;
use Illuminate\Database\Eloquent\Attributes\UseFactory;
use Illuminate\Database\Eloquent\Attributes\UsePolicy;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Nnjeim\World\Models\State as WorldState;
use OwenIt\Auditing\Auditable;
use OwenIt\Auditing\Contracts\Auditable as AuditableContract;

/**
 * Eloquent model for a {@see StateInterface}.
 *
 * SUBCLASSES vendor `Nnjeim\World\Models\State`. Vendor uses integer
 * PKs + `$timestamps = false` — we do NOT override either. Vendor
 * ships no translations for state names, so this model does NOT
 * compose {@see \Stackra\Geography\Concerns\HasWorldLocalizedName}.
 *
 * @category Geography
 *
 * @since    0.1.0
 */
#[UseFactory(StateFactory::class)]
#[UsePolicy(StatePolicy::class)]
#[ObservedBy([StateObserver::class])]
class State extends WorldState implements AuditableContract, StateInterface
{
    use Auditable;
    use HasFactory;
}
