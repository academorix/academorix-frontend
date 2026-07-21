<?php

declare(strict_types=1);

namespace Stackra\Localization\Data\Resources;

use Stackra\Localization\Contracts\Data\PlatformLanguageInterface;
use Stackra\Localization\Enums\TextDirection;
use Stackra\Localization\Models\PlatformLanguage;
use Spatie\LaravelData\Attributes\MapOutputName;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Wire-visible output DTO for {@see PlatformLanguage}.
 *
 * Chains through the geography relation to surface ISO-639 metadata
 * (`iso639`, `name`, `nativeName`) + the direction accessor without
 * exposing the join structure to callers.
 *
 * @category Localization
 *
 * @since    0.1.0
 */
#[MapOutputName(SnakeCaseMapper::class)]
final class PlatformLanguageData extends Data
{
    /**
     * @param  string         $id                  `lng_<ulid>`.
     * @param  string         $bcp47Code           BCP-47 tag.
     * @param  string|null    $iso639              ISO-639-1 code (from geography).
     * @param  string|null    $name                English name (from geography).
     * @param  string|null    $nativeName          Native display name (from geography).
     * @param  TextDirection  $direction           Text direction (from geography).
     * @param  string|null    $script              ISO-15924 script code.
     * @param  string|null    $flagEmoji           Regional-variant flag emoji (null on base languages).
     * @param  bool           $isPlatformActive    Row is enabled for tenants.
     * @param  bool           $isBeta              Row is beta / preview.
     * @param  bool           $isSystem            Row is system-shipped.
     * @param  int            $sortOrder           UI ordering hint.
     */
    public function __construct(
        public string $id,
        public string $bcp47Code,
        public ?string $iso639,
        public ?string $name,
        public ?string $nativeName,
        public TextDirection $direction,
        public ?string $script,
        public ?string $flagEmoji,
        public bool $isPlatformActive,
        public bool $isBeta,
        public bool $isSystem,
        public int $sortOrder,
    ) {
    }

    /**
     * Build the DTO from a {@see PlatformLanguage} model.
     */
    public static function fromModel(PlatformLanguage $language): self
    {
        return new self(
            id: (string) $language->getKey(),
            bcp47Code: (string) $language->{PlatformLanguageInterface::ATTR_BCP47_CODE},
            iso639: $language->iso_639_1,
            name: $language->name,
            nativeName: $language->native_name,
            direction: $language->direction,
            script: $language->{PlatformLanguageInterface::ATTR_SCRIPT},
            flagEmoji: $language->flag_emoji,
            isPlatformActive: (bool) $language->{PlatformLanguageInterface::ATTR_IS_PLATFORM_ACTIVE},
            isBeta: (bool) $language->{PlatformLanguageInterface::ATTR_IS_BETA},
            isSystem: (bool) $language->{PlatformLanguageInterface::ATTR_IS_SYSTEM},
            sortOrder: (int) $language->{PlatformLanguageInterface::ATTR_SORT_ORDER},
        );
    }
}
