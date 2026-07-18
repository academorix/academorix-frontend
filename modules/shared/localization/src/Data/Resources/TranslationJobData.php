<?php

declare(strict_types=1);

namespace Academorix\Localization\Data\Resources;

use Academorix\Localization\Contracts\Data\TranslationJobInterface;
use Academorix\Localization\Models\TranslationJob;
use Spatie\LaravelData\Attributes\MapOutputName;
use Spatie\LaravelData\Attributes\WithCast;
use Spatie\LaravelData\Casts\DateTimeInterfaceCast;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Wire-visible output DTO for {@see TranslationJob}.
 *
 * @category Localization
 *
 * @since    0.1.0
 */
#[MapOutputName(SnakeCaseMapper::class)]
final class TranslationJobData extends Data
{
    /**
     * @param  string                    $id             `tjb_<ulid>`.
     * @param  string                    $tenantId       Owning tenant.
     * @param  string|null               $initiatorId    User id or null on cron dispatches.
     * @param  string                    $kind           Job kind (see TranslationJobKind).
     * @param  string                    $driver         Driver identifier.
     * @param  string|null               $driverModel    Optional model / engine variant.
     * @param  string                    $sourceLocale   BCP-47 source tag.
     * @param  string                    $targetLocale   BCP-47 target tag.
     * @param  string                    $status         Job status (see TranslationJobStatus).
     * @param  int                       $totalKeys      Total keys planned.
     * @param  int                       $translatedKeys Keys resolved successfully.
     * @param  int                       $failedKeys     Keys that failed.
     * @param  string|null               $namespaceFilter Optional namespace filter.
     * @param  string|null               $groupFilter    Optional group filter.
     * @param  \DateTimeInterface|null   $startedAt      Wall-clock start.
     * @param  \DateTimeInterface|null   $finishedAt     Wall-clock finish.
     * @param  string|null               $errorMessage   Failure summary.
     * @param  \DateTimeInterface        $createdAt      Row creation.
     */
    public function __construct(
        public string $id,
        public string $tenantId,
        public ?string $initiatorId,
        public string $kind,
        public string $driver,
        public ?string $driverModel,
        public string $sourceLocale,
        public string $targetLocale,
        public string $status,
        public int $totalKeys,
        public int $translatedKeys,
        public int $failedKeys,
        public ?string $namespaceFilter,
        public ?string $groupFilter,
        #[WithCast(DateTimeInterfaceCast::class)]
        public ?\DateTimeInterface $startedAt,
        #[WithCast(DateTimeInterfaceCast::class)]
        public ?\DateTimeInterface $finishedAt,
        public ?string $errorMessage,
        #[WithCast(DateTimeInterfaceCast::class)]
        public \DateTimeInterface $createdAt,
    ) {
    }

    /**
     * Build the DTO from a {@see TranslationJob} model.
     */
    public static function fromModel(TranslationJob $job): self
    {
        $kindEnum = $job->{TranslationJobInterface::ATTR_KIND};
        $driverEnum = $job->{TranslationJobInterface::ATTR_DRIVER};
        $statusEnum = $job->{TranslationJobInterface::ATTR_STATUS};

        return new self(
            id: (string) $job->getKey(),
            tenantId: (string) $job->{TranslationJobInterface::ATTR_TENANT_ID},
            initiatorId: $job->{TranslationJobInterface::ATTR_INITIATOR_ID},
            kind: \is_object($kindEnum) && \property_exists($kindEnum, 'value')
                ? (string) $kindEnum->value
                : (string) $kindEnum,
            driver: \is_object($driverEnum) && \property_exists($driverEnum, 'value')
                ? (string) $driverEnum->value
                : (string) $driverEnum,
            driverModel: $job->{TranslationJobInterface::ATTR_DRIVER_MODEL},
            sourceLocale: (string) $job->{TranslationJobInterface::ATTR_SOURCE_LOCALE},
            targetLocale: (string) $job->{TranslationJobInterface::ATTR_TARGET_LOCALE},
            status: \is_object($statusEnum) && \property_exists($statusEnum, 'value')
                ? (string) $statusEnum->value
                : (string) $statusEnum,
            totalKeys: (int) $job->{TranslationJobInterface::ATTR_TOTAL_KEYS},
            translatedKeys: (int) $job->{TranslationJobInterface::ATTR_TRANSLATED_KEYS},
            failedKeys: (int) $job->{TranslationJobInterface::ATTR_FAILED_KEYS},
            namespaceFilter: $job->{TranslationJobInterface::ATTR_NAMESPACE_FILTER},
            groupFilter: $job->{TranslationJobInterface::ATTR_GROUP_FILTER},
            startedAt: $job->{TranslationJobInterface::ATTR_STARTED_AT},
            finishedAt: $job->{TranslationJobInterface::ATTR_FINISHED_AT},
            errorMessage: $job->{TranslationJobInterface::ATTR_ERROR_MESSAGE},
            createdAt: $job->{TranslationJobInterface::ATTR_CREATED_AT},
        );
    }
}
