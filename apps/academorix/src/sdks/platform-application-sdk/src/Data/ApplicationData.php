<?php

declare(strict_types=1);

namespace Stackra\PlatformApplicationSdk\Data;

use Spatie\LaravelData\Attributes\MapInputName;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Wire-visible response DTO for {@see \Stackra\Application\Models\Application}.
 *
 * Mirrors `schemas/application.schema.json` column-for-column, minus
 * the fields declared under `x-wire.hidden` (`metadata`,
 * `created_by`, `updated_by`, `deleted_by`) which never leave the
 * server. Wire format is snake_case; PHP property names are
 * camelCase — the `SnakeCaseMapper` bridges the two.
 *
 * ## What this DTO owns
 *
 * A read-only, immutable projection of an Application row as the
 * Platform service emits it. Consumers never instantiate this DTO by
 * hand — the SDK's request classes hydrate it from the response
 * envelope inside `createDtoFromResponse()`.
 *
 * ## Computed fields
 *
 * `central_url` + `platform_admin_url` are server-computed (per
 * `x-wire.computed`); they arrive already resolved to `https://...`.
 *
 * ## Example
 *
 * ```php
 * use Stackra\PlatformSdk\Client\PlatformSdk;
 *
 * $app = app(PlatformSdk::class)->application()->applications()->show('sports');
 * $app->slug;             // 'sports'
 * $app->defaultCurrency;  // 'USD'
 * $app->centralUrl;       // 'https://sports.stackra.app'
 * ```
 *
 * @category PlatformApplicationSdk
 *
 * @since    0.1.0
 */
#[MapInputName(SnakeCaseMapper::class)]
final class ApplicationData extends Data
{
    /**
     * @param  string       $id                    Prefixed ULID (`app_<26 chars>`).
     * @param  string       $slug                  URL-safe application identifier — matches `^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$`.
     * @param  string       $name                  Display name shown in admin surfaces (e.g. "Stackra", "Stackra EU").
     * @param  string       $centralHost           Marketing + tenant-picker host (e.g. "stackra.app").
     * @param  string       $platformAdminHost     Stackra-staff host (e.g. "admin.stackra.app").
     * @param  string       $defaultLocale         Default IETF locale tag (e.g. "en", "fr-FR").
     * @param  string       $defaultTimezone       Default IANA timezone name (e.g. "UTC").
     * @param  string       $defaultCurrency       Default ISO-4217 currency code (three uppercase letters).
     * @param  bool         $isDefault             `true` for the fallback row used when host resolution finds no other match.
     * @param  bool         $isSystem              `true` for platform-owned rows; write endpoints refuse mutation.
     * @param  string       $createdAt             ISO-8601 timestamp — row creation.
     * @param  string       $updatedAt             ISO-8601 timestamp — most recent mutation.
     * @param  string|null  $description           Optional free-form description.
     * @param  string|null  $defaultBusinessType   Optional pre-selected BusinessType key for the self-serve picker.
     * @param  array<string, mixed>|null $config   Application-scoped config bag (branding tokens, feature-flag overrides, deployment metadata).
     * @param  string|null  $centralUrl            Server-computed `https://{central_host}` — never null when emitted.
     * @param  string|null  $platformAdminUrl      Server-computed `https://{platform_admin_host}` — never null when emitted.
     * @param  string|null  $deletedAt             ISO-8601 timestamp — soft-delete marker; null when active.
     */
    public function __construct(
        public string $id,
        public string $slug,
        public string $name,
        public string $centralHost,
        public string $platformAdminHost,
        public string $defaultLocale,
        public string $defaultTimezone,
        public string $defaultCurrency,
        public bool $isDefault,
        public bool $isSystem,
        public string $createdAt,
        public string $updatedAt,
        public ?string $description = null,
        public ?string $defaultBusinessType = null,
        public ?array $config = null,
        public ?string $centralUrl = null,
        public ?string $platformAdminUrl = null,
        public ?string $deletedAt = null,
    ) {
    }

    /**
     * Hydrate from a raw wire record (already unwrapped from the
     * `{ "data": ... }` envelope).
     *
     * Useful for callers that received the payload from somewhere
     * other than a Saloon response (fixtures, webhooks, message
     * broker payloads). Prefer the Saloon path
     * ({@see \Stackra\PlatformApplicationSdk\Requests\Applications\ShowApplicationRequest::createDtoFromResponse()})
     * when the record came from an HTTP response.
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
