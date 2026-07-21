<?php

declare(strict_types=1);

/**
 * Horizon Filter Interface.
 *
 * Defines a contract for filtering Horizon components based on
 * custom logic (role-based visibility, environment filtering, etc.).
 *
 * @category Contracts
 *
 * @since    1.0.0
 */

namespace Stackra\Horizon\Filters;

/**
 * Horizon Filter Interface.
 *
 * Defines a contract for filtering Horizon components based on custom logic.
 *
 * ## Use Cases:
 * - Hide metrics based on user role
 * - Filter tags by environment
 * - Control dashboard visibility
 * - Implement feature flags
 *
 * ## Example:
 * ```php
 * class AdminOnlyFilter implements HorizonFilter
 * {
 *     public function shouldShow(string $componentName): bool
 *     {
 *         return auth()->user()?->isAdmin() ?? false;
 *     }
 * }
 * ```
 */
interface HorizonFilter
{
    /**
     * Determine if a component should be shown.
     *
     * @param  string $componentName The name of the component to check
     * @return bool   True if the component should be shown, false otherwise
     */
    public function shouldShow(string $componentName): bool;
}
