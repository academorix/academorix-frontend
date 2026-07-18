<?php

declare(strict_types=1);

namespace Academorix\Settings\Contracts\Services;

use Academorix\Settings\Services\DefaultSettingsResolver;
use Illuminate\Container\Attributes\Bind;

/**
 * Hierarchy resolver — the read side of the settings cascade.
 *
 * Given a field key + the caller's active tenant + user, returns the
 * deepest-matching value. Search order is user → tenant → system,
 * falling back to the field's declared default when no override row
 * exists in any layer.
 *
 * `org` and `branch` levels are reserved for the scope module wave;
 * this interface pins the shape now so consumers don't churn later.
 *
 * @category Settings
 *
 * @since    0.1.0
 */
#[Bind(DefaultSettingsResolver::class)]
interface SettingsResolverInterface
{
    /**
     * Resolve a value for the caller's scope tuple.
     *
     * @param  string       $key       Field slug.
     * @param  string|null  $tenantId  Active tenant id (null = system read).
     * @param  string|null  $userId    Active user id (null = tenant-or-system read).
     * @return mixed  Deepest-matching value or the field default.
     */
    public function resolve(string $key, ?string $tenantId, ?string $userId): mixed;
}
