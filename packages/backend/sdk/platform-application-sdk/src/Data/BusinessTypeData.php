<?php

declare(strict_types=1);

namespace Stackra\PlatformApplicationSdk\Data;

use Spatie\LaravelData\Attributes\MapInputName;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Wire-visible response DTO for a BusinessType catalogue entry.
 *
 * Mirrors `schemas/business-type.schema.json`. BusinessType is
 * **config-backed** (not an Eloquent model) — the catalogue is
 * sourced from `data/business-types.json`, mirrored into
 * `config/workspaces.php`, and served through the same admin surface
 * as Application. `x-wire.hidden` is empty, so every property in the
 * schema surfaces here.
 *
 * ## What this DTO owns
 *
 * A read-only projection of one BusinessType catalogue entry — the
 * key + human-readable copy + `default_config` bag applied at
 * workspace provisioning time (features / terminology / seeded roles
 * / entitlements / onboarding steps / sports).
 *
 * ## Translations
 *
 * `translations` and `labelTranslations` arrive only when the request
 * carries `?include=translations`; both are `null` otherwise. The
 * `labelTranslations` property is deprecated per the schema — a
 * server-side normaliser hoists it into `translations[<locale>].label`
 * when both are present. Consumers should read from `translations`.
 *
 * ## Example
 *
 * ```php
 * use Stackra\PlatformSdk\Client\PlatformSdk;
 *
 * $type = app(PlatformSdk::class)
 *     ->application()
 *     ->businessTypes()
 *     ->show('academy');
 * $type->label;                      // 'Academy'
 * $type->defaultConfig['features'];  // ['athletes', 'teams', ...]
 * ```
 *
 * @category PlatformApplicationSdk
 *
 * @since    0.1.0
 */
#[MapInputName(SnakeCaseMapper::class)]
final class BusinessTypeData extends Data
{
    /**
     * @param  string                                                       $key                 Enum key — also the value written to `workspaces.business_type`.
     * @param  string                                                       $label               Active-locale human label; full per-locale map lives on `translations` when included.
     * @param  string                                                       $description         Active-locale description; full per-locale map lives on `translations` when included.
     * @param  array{
     *     features?: list<string>,
     *     terminology?: array<string, string>,
     *     roles?: list<string>,
     *     entitlements?: array<string, array{kind?: string, limit?: int|null, enabled?: bool|null}>,
     *     onboarding_steps?: list<string>,
     *     sports?: list<string>
     * }                                                                    $defaultConfig       Bag applied at workspace provisioning time — features + terminology + seeded roles + entitlements + onboarding steps + sports.
     * @param  string|null                                                  $icon                Iconify token (e.g. "academic-cap", "dumbbell").
     * @param  string|null                                                  $heroImageUrl        Optional hero image used on the self-serve `/sign-up` screen.
     * @param  int|null                                                     $priority            Sort order on the picker (ascending). Defaults to 100 on the server.
     * @param  bool|null                                                    $isVisible           When `false`, hidden from the self-serve picker and assignable only by platform admins. Defaults to `true`.
     * @param  array<string, array<string, string|null>>|null               $translations        Optional `{ locale: { label, description } }` map. Present only when `?include=translations`.
     * @param  array<string, string>|null                                   $labelTranslations   DEPRECATED — superseded by `translations`. Kept for one release; server normalises into `translations[<locale>].label` when both are present.
     */
    public function __construct(
        public string $key,
        public string $label,
        public string $description,
        public array $defaultConfig,
        public ?string $icon = null,
        public ?string $heroImageUrl = null,
        public ?int $priority = null,
        public ?bool $isVisible = null,
        public ?array $translations = null,
        public ?array $labelTranslations = null,
    ) {
    }

    /**
     * Hydrate from a raw wire record (already unwrapped from the
     * `{ "data": ... }` envelope). See {@see ApplicationData::fromRecord()}
     * for the rationale; prefer the Saloon-driven path in production.
     *
     * @param  array<string, mixed>  $row  The raw snake_case record.
     * @return self                        The hydrated DTO.
     */
    public static function fromRecord(array $row): self
    {
        return self::from($row);
    }
}
