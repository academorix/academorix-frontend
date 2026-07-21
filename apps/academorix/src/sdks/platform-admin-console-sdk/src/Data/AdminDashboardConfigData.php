<?php

declare(strict_types=1);

namespace Stackra\PlatformAdminConsoleSdk\Data;

use Spatie\LaravelData\Attributes\MapInputName;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Wire-visible response DTO for {@see \App\Models\AdminDashboardConfig}.
 *
 * Mirrors `schemas/admin-dashboard-config.schema.json` column-for-column, minus
 * the fields declared under `x-wire.hidden` which never leave the
 * server. Wire format is snake_case; PHP property names are
 * camelCase — the `SnakeCaseMapper` bridges the two.
 *
 * ## What this DTO owns
 *
 * A read-only, immutable projection of the row as the
 * Platform service emits it. Consumers never instantiate
 * this DTO by hand — the SDK's request classes hydrate it from the
 * response envelope inside `createDtoFromResponse()`.
 *
 * ## Example
 *
 * ```php
 * use Stackra\PlatformSdk\Client\PlatformSdk;
 *
 * $row = app(PlatformSdk::class)->adminConsole()->adminDashboardConfigs()->show($id);
 * ```
 *
 * @category AdminConsoleSdk
 *
 * @since    0.1.0
 */
#[MapInputName(SnakeCaseMapper::class)]
final class AdminDashboardConfigData extends Data
{
    /**
     * @param  string                       $id
     * @param  string                       $tenantId
     * @param  array<string, mixed>         $layout                     Grid layout {widgets: [{key, x, y, w, h}]}.
     * @param  array<string, mixed>         $enabledWidgets
     * @param  string                       $createdAt
     * @param  string                       $updatedAt
     * @param  ?string                      $userId                     NULL = tenant default; otherwise user-specific override.
     * @param  ?string                      $themePreference
     * @param  array<string, mixed>|null    $recentActionsCache
     * @param  array<string, mixed>|null    $metadata
     * @param  ?string                      $deletedAt
     */
    public function __construct(
        public string $id,
        public string $tenantId,
        public array $layout,
        public array $enabledWidgets,
        public string $createdAt,
        public string $updatedAt,
        public ?string $userId = null,
        public ?string $themePreference = null,
        public ?array $recentActionsCache = null,
        public ?array $metadata = null,
        public ?string $deletedAt = null,
    ) {
    }

    /**
     * Hydrate from a raw wire record (already unwrapped from the
     * `{ "data": ... }` envelope).
     *
     * @param  array<string, mixed>  $row  The raw snake_case record.
     * @return self                        The hydrated DTO.
     */
    public static function fromRecord(array $row): self
    {
        // Delegate to Spatie Data's canonical hydration path so
        // `#[MapInputName]` fires and every property is normalised
        // through the same mapper the response-side uses.
        return self::from($row);
    }
}
