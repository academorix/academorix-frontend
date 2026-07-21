<?php

declare(strict_types=1);

namespace Stackra\Tenancy\Data;

use Stackra\Tenancy\Contracts\Data\TenantContactInterface;
use Stackra\Tenancy\Enums\TenantContactKind;
use Stackra\Tenancy\Models\TenantContact;
use Spatie\LaravelData\Attributes\MapOutputName;
use Spatie\LaravelData\Attributes\WithCast;
use Spatie\LaravelData\Casts\DateTimeInterfaceCast;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Wire-visible output DTO for {@see TenantContact}.
 *
 * `metadata` is hidden by omission (matches the model's
 * `x-wire.hidden` list in the blueprint).
 *
 * @category Tenancy
 *
 * @since    0.1.0
 */
#[MapOutputName(SnakeCaseMapper::class)]
final class TenantContactData extends Data
{
    /**
     * @param  string             $id           `wct_<ulid>`.
     * @param  string             $tenantId     Owning tenant.
     * @param  TenantContactKind  $kind         Contact role.
     * @param  string             $name         Person or team name.
     * @param  string             $email        Primary email.
     * @param  bool               $isPrimary    Whether primary of its kind.
     * @param  \DateTimeInterface $createdAt    Row creation timestamp.
     * @param  \DateTimeInterface $updatedAt    Last mutation timestamp.
     * @param  string|null        $phone        Contact phone (E.164 preferred).
     * @param  string|null        $jobTitle     Job title.
     * @param  array<string, mixed>|null $address  Structured address bag.
     * @param  string|null        $notes        Free-form notes.
     * @param  \DateTimeInterface|null $verifiedAt  Email verification timestamp.
     * @param  \DateTimeInterface|null $deletedAt   Soft-delete marker.
     */
    public function __construct(
        public string $id,
        public string $tenantId,
        public TenantContactKind $kind,
        public string $name,
        public string $email,
        public bool $isPrimary,
        #[WithCast(DateTimeInterfaceCast::class)]
        public \DateTimeInterface $createdAt,
        #[WithCast(DateTimeInterfaceCast::class)]
        public \DateTimeInterface $updatedAt,
        public ?string $phone = null,
        public ?string $jobTitle = null,
        public ?array $address = null,
        public ?string $notes = null,
        #[WithCast(DateTimeInterfaceCast::class)]
        public ?\DateTimeInterface $verifiedAt = null,
        #[WithCast(DateTimeInterfaceCast::class)]
        public ?\DateTimeInterface $deletedAt = null,
    ) {
    }

    /**
     * Build from a Model.
     */
    public static function fromModel(TenantContact $contact): self
    {
        $kindValue = $contact->{TenantContactInterface::ATTR_KIND};
        $kind = $kindValue instanceof TenantContactKind
            ? $kindValue
            : (TenantContactKind::tryFrom((string) $kindValue) ?? TenantContactKind::Support);

        return new self(
            id: (string) $contact->getKey(),
            tenantId: (string) $contact->{TenantContactInterface::ATTR_TENANT_ID},
            kind: $kind,
            name: (string) $contact->{TenantContactInterface::ATTR_NAME},
            email: (string) $contact->{TenantContactInterface::ATTR_EMAIL},
            isPrimary: (bool) $contact->{TenantContactInterface::ATTR_IS_PRIMARY},
            createdAt: $contact->{TenantContactInterface::ATTR_CREATED_AT},
            updatedAt: $contact->{TenantContactInterface::ATTR_UPDATED_AT},
            phone: $contact->{TenantContactInterface::ATTR_PHONE},
            jobTitle: $contact->{TenantContactInterface::ATTR_JOB_TITLE},
            address: $contact->{TenantContactInterface::ATTR_ADDRESS},
            notes: $contact->{TenantContactInterface::ATTR_NOTES},
            verifiedAt: $contact->{TenantContactInterface::ATTR_VERIFIED_AT},
            deletedAt: $contact->{TenantContactInterface::ATTR_DELETED_AT},
        );
    }
}
