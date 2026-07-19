<?php

declare(strict_types=1);

namespace Academorix\Settings\Contracts\Services;

use Academorix\Settings\Services\SettingsService;
use Illuminate\Container\Attributes\Bind;

/**
 * Public settings facade.
 *
 * The single public API every consumer reaches for — reads flow
 * through the resolver, writes flow through the writer. Consumers
 * should type-hint this interface rather than the concrete
 * {@see \Academorix\Settings\Services\SettingsService}.
 *
 * @category Settings
 *
 * @since    0.1.0
 */
#[Bind(SettingsService::class)]
interface SettingsServiceInterface
{
    /**
     * Read a single setting by key.
     *
     * Walks the resolver cascade (user → tenant → system) and falls
     * back to the field's declared default when no override exists.
     *
     * @param  string       $key      Field slug (e.g. `default_locale`).
     * @param  mixed        $default  Fallback when no cascade layer + schema default match.
     * @return mixed  Resolved value.
     */
    public function get(string $key, mixed $default = null): mixed;

    /**
     * Persist a value at the caller's active scope.
     *
     * Fires {@see \Academorix\Settings\Events\SettingsChangeEvent} on
     * successful commit — activity + audit modules subscribe.
     *
     * @param  string  $key    Field slug.
     * @param  mixed   $value  New value (validated against the schema's rules).
     */
    public function set(string $key, mixed $value): void;

    /**
     * Every resolved value for a group at the caller's scope.
     *
     * @param  string  $group  Group slug.
     * @return array<string, mixed>  Map of field key → resolved value.
     */
    public function all(string $group): array;

    /**
     * Full admin-UI schema for a group.
     *
     * Combines the group metadata + every registered field's control
     * type, label, validation rules, and default value.
     *
     * @param  string  $group  Group slug.
     * @return array<string, mixed>  Structured schema payload.
     */
    public function schema(string $group): array;
}
