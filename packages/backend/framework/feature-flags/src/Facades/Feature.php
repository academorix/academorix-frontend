<?php

declare(strict_types=1);

namespace Academorix\FeatureFlags\Facades;

use Academorix\FeatureFlags\Contracts\FeatureCheckerInterface;
use Academorix\FeatureFlags\Resolver\FeatureResolution;
use Academorix\Tenancy\Models\Tenant;
use Academorix\User\Models\User;
use BackedEnum;
use Illuminate\Support\Facades\Facade;

/**
 * Static facade over {@see FeatureCheckerInterface}.
 *
 * Pure delegate — every static call resolves the interface
 * binding out of the container and forwards. Property 6 (facade
 * equals contract) holds structurally: no logic lives here.
 *
 * @method static bool                active(string|BackedEnum $flag, ?Tenant $tenant = null, ?User $user = null)
 * @method static bool                inactive(string|BackedEnum $flag, ?Tenant $tenant = null, ?User $user = null)
 * @method static array<string,bool>  values(array $flags, ?Tenant $tenant = null, ?User $user = null)
 * @method static FeatureResolution   resolution(string|BackedEnum $flag, ?Tenant $tenant = null, ?User $user = null)
 *
 * @see FeatureCheckerInterface
 *
 * @category FeatureFlags
 *
 * @since    0.1.0
 */
final class Feature extends Facade
{
    /**
     * Return the container binding this facade resolves to.
     *
     * @return string
     */
    protected static function getFacadeAccessor(): string
    {
        return FeatureCheckerInterface::class;
    }
}
