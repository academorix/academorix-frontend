<?php

declare(strict_types=1);

namespace Stackra\Application\Data;

use Stackra\Application\Contracts\Data\ApplicationInterface;
use Stackra\Application\Enums\BusinessTypeEnum;
use Stackra\Application\Models\Application;
use Spatie\LaravelData\Attributes\Computed;
use Spatie\LaravelData\Attributes\MapOutputName;
use Spatie\LaravelData\Attributes\WithCast;
use Spatie\LaravelData\Casts\DateTimeInterfaceCast;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Wire-visible output DTO for {@see Application}.
 *
 * snake_case on the wire, camelCase on the PHP side — `MapOutputName`
 * bridges. Hidden fields (`metadata`, `created_by`, `updated_by`,
 * `deleted_by`) are dropped by omission; NEVER add them here even if
 * the model exposes them.
 *
 * @category Application
 *
 * @since    0.1.0
 */
#[MapOutputName(SnakeCaseMapper::class)]
final class ApplicationData extends Data
{
    /**
     * @param  string  $id  Prefixed ULID (`app_<26 chars>`).
     * @param  string  $slug  URL-safe identifier.
     * @param  string  $name  Display name.
     * @param  string  $centralHost  Marketing + tenant-picker host.
     * @param  string  $platformAdminHost  Stackra staff surface host.
     * @param  string  $defaultLocale  IETF locale tag.
     * @param  string  $defaultTimezone  IANA timezone name.
     * @param  string  $defaultCurrency  ISO-4217 currency code.
     * @param  bool    $isDefault  True for the fallback row used when host resolution finds no match.
     * @param  bool    $isSystem   True for platform-owned rows.
     * @param  \DateTimeInterface  $createdAt  Row creation.
     * @param  \DateTimeInterface  $updatedAt  Most recent mutation.
     * @param  string|null  $description  Optional free-form description.
     * @param  BusinessTypeEnum|null  $defaultBusinessType  Preselected picker option.
     * @param  array<string, mixed>|null  $config  Application-scoped config bag.
     * @param  \DateTimeInterface|null  $deletedAt  Soft-delete marker.
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
        #[WithCast(DateTimeInterfaceCast::class)]
        public \DateTimeInterface $createdAt,
        #[WithCast(DateTimeInterfaceCast::class)]
        public \DateTimeInterface $updatedAt,
        public ?string $description = null,
        public ?BusinessTypeEnum $defaultBusinessType = null,
        public ?array $config = null,
        #[WithCast(DateTimeInterfaceCast::class)]
        public ?\DateTimeInterface $deletedAt = null,

        /**
         * Computed `https://{central_host}` URL. Included on every emit.
         */
        #[Computed]
        public string $centralUrl = '',

        /**
         * Computed `https://{platform_admin_host}` URL.
         */
        #[Computed]
        public string $platformAdminUrl = '',
    ) {
        // Populate computed URLs on construction so consumers see stable values.
        $this->centralUrl = $this->centralUrl ?: 'https://'.$this->centralHost;
        $this->platformAdminUrl = $this->platformAdminUrl ?: 'https://'.$this->platformAdminHost;
    }

    /**
     * Custom mapping from an Application model to this DTO. Explicit is
     * safer than Spatie's auto-mapping when we want to control exactly
     * which fields land on the wire.
     */
    public static function fromModel(Application $application): self
    {
        return new self(
            id: (string) $application->getKey(),
            slug: (string) $application->{ApplicationInterface::ATTR_SLUG},
            name: (string) $application->{ApplicationInterface::ATTR_NAME},
            centralHost: (string) $application->{ApplicationInterface::ATTR_CENTRAL_HOST},
            platformAdminHost: (string) $application->{ApplicationInterface::ATTR_PLATFORM_ADMIN_HOST},
            defaultLocale: (string) $application->{ApplicationInterface::ATTR_DEFAULT_LOCALE},
            defaultTimezone: (string) $application->{ApplicationInterface::ATTR_DEFAULT_TIMEZONE},
            defaultCurrency: (string) $application->{ApplicationInterface::ATTR_DEFAULT_CURRENCY},
            isDefault: (bool) $application->{ApplicationInterface::ATTR_IS_DEFAULT},
            isSystem: (bool) $application->{ApplicationInterface::ATTR_IS_SYSTEM},
            createdAt: $application->{ApplicationInterface::ATTR_CREATED_AT},
            updatedAt: $application->{ApplicationInterface::ATTR_UPDATED_AT},
            description: $application->{ApplicationInterface::ATTR_DESCRIPTION},
            defaultBusinessType: $application->{ApplicationInterface::ATTR_DEFAULT_BUSINESS_TYPE},
            config: $application->{ApplicationInterface::ATTR_CONFIG},
            deletedAt: $application->{ApplicationInterface::ATTR_DELETED_AT},
        );
    }
}
