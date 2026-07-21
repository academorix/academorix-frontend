<?php

declare(strict_types=1);

namespace Stackra\Notifications\Mail\Data;

use Stackra\Notifications\Mail\Contracts\Data\MailSuppressionInterface;
use Stackra\Notifications\Mail\Models\MailSuppression;
use Spatie\LaravelData\Attributes\MapOutputName;
use Spatie\LaravelData\Attributes\WithCast;
use Spatie\LaravelData\Casts\DateTimeInterfaceCast;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Wire-visible output DTO for {@see MailSuppression}.
 *
 * Renders the row admin surfaces + the API expose. The `email`
 * field is preserved verbatim — admins need to identify the exact
 * address for support. Never emit this DTO to a non-admin surface.
 *
 * @category NotificationsMail
 *
 * @since    0.1.0
 */
#[MapOutputName(SnakeCaseMapper::class)]
final class MailSuppressionData extends Data
{
    /**
     * @param  string                    $id                 `msp_<ulid>`.
     * @param  string|null               $tenantId           Owning tenant, or NULL for platform-wide.
     * @param  string                    $email              Suppressed email (normalised).
     * @param  string                    $emailDomain        Denormalised domain part.
     * @param  string                    $reason             `MailSuppressionReason` backing value.
     * @param  string|null               $provider           Provider that reported the suppression.
     * @param  string|null               $sourceDeliveryId   Delivery id that produced the bounce.
     * @param  string|null               $bounceReason       Sanitised provider bounce reason.
     * @param  bool                      $isSystem           `true` for platform-wide seed rows.
     * @param  array<string, mixed>|null $metadata           Provider-specific bounce metadata.
     * @param  \DateTimeInterface|null   $expiresAt          Soft-bounce expiry, or NULL for permanent.
     * @param  \DateTimeInterface        $createdAt          Row creation timestamp.
     */
    public function __construct(
        public string $id,
        public ?string $tenantId,
        public string $email,
        public string $emailDomain,
        public string $reason,
        public ?string $provider,
        public ?string $sourceDeliveryId,
        public ?string $bounceReason,
        public bool $isSystem,
        public ?array $metadata,
        #[WithCast(DateTimeInterfaceCast::class)]
        public ?\DateTimeInterface $expiresAt,
        #[WithCast(DateTimeInterfaceCast::class)]
        public \DateTimeInterface $createdAt,
    ) {
    }

    /**
     * Build the DTO from a {@see MailSuppression} model.
     */
    public static function fromModel(MailSuppression $row): self
    {
        $reasonRaw = $row->{MailSuppressionInterface::ATTR_REASON};
        $reason = \is_object($reasonRaw) && \property_exists($reasonRaw, 'value')
            ? (string) $reasonRaw->value
            : (string) $reasonRaw;

        $providerRaw = $row->{MailSuppressionInterface::ATTR_PROVIDER};
        $provider = null;
        if ($providerRaw !== null) {
            $provider = \is_object($providerRaw) && \property_exists($providerRaw, 'value')
                ? (string) $providerRaw->value
                : (string) $providerRaw;
        }

        return new self(
            id: (string) $row->getKey(),
            tenantId: self::nullableString($row, MailSuppressionInterface::ATTR_TENANT_ID),
            email: (string) $row->{MailSuppressionInterface::ATTR_EMAIL},
            emailDomain: (string) $row->{MailSuppressionInterface::ATTR_EMAIL_DOMAIN},
            reason: $reason,
            provider: $provider,
            sourceDeliveryId: self::nullableString($row, MailSuppressionInterface::ATTR_SOURCE_DELIVERY_ID),
            bounceReason: self::nullableString($row, MailSuppressionInterface::ATTR_BOUNCE_REASON),
            isSystem: (bool) $row->{MailSuppressionInterface::ATTR_IS_SYSTEM},
            metadata: self::nullableArray($row, MailSuppressionInterface::ATTR_METADATA),
            expiresAt: $row->{MailSuppressionInterface::ATTR_EXPIRES_AT},
            createdAt: $row->{MailSuppressionInterface::ATTR_CREATED_AT},
        );
    }

    /**
     * Coerce a nullable string attribute; empty strings collapse
     * to null for a clean wire payload.
     */
    private static function nullableString(MailSuppression $row, string $key): ?string
    {
        $value = $row->{$key} ?? null;

        if ($value === null || $value === '') {
            return null;
        }

        return (string) $value;
    }

    /**
     * Coerce a nullable array attribute; normalises `Collection`
     * casts to plain arrays for JSON serialisation.
     *
     * @return array<string, mixed>|null
     */
    private static function nullableArray(MailSuppression $row, string $key): ?array
    {
        $raw = $row->{$key} ?? null;

        if ($raw === null) {
            return null;
        }

        if (\is_array($raw)) {
            /** @var array<string, mixed> $raw */
            return $raw;
        }

        if (\is_object($raw) && \method_exists($raw, 'toArray')) {
            /** @var array<string, mixed> $result */
            $result = $raw->toArray();

            return $result;
        }

        return null;
    }
}
