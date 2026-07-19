<?php

declare(strict_types=1);

namespace Academorix\Invitations\Database\Factories;

use Academorix\Invitations\Contracts\Data\InvitationInterface;
use Academorix\Invitations\Enums\InvitationChannel;
use Academorix\Invitations\Enums\InvitationStatus;
use Academorix\Invitations\Models\Invitation;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * Factory for {@see Invitation}.
 *
 * @extends Factory<Invitation>
 *
 * @category Invitations
 *
 * @since    0.1.0
 */
final class InvitationFactory extends Factory
{
    /**
     * @var class-string<Invitation>
     */
    protected $model = Invitation::class;

    /**
     * Default row shape — a pending invitation for a `tenant` target
     * with a 14-day expiry window and an already-generated token.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $rawToken = \bin2hex(\random_bytes(32));

        return [
            InvitationInterface::ATTR_ID             => 'inv_' . Str::ulid()->toBase32(),
            InvitationInterface::ATTR_APPLICATION_ID => (string) Str::uuid(),
            InvitationInterface::ATTR_TENANT_ID      => 'ten_' . Str::ulid()->toBase32(),
            InvitationInterface::ATTR_TARGET_TYPE    => 'tenant',
            InvitationInterface::ATTR_TARGET_ID      => 'ten_' . Str::ulid()->toBase32(),
            InvitationInterface::ATTR_INVITER_TYPE   => 'system',
            InvitationInterface::ATTR_INVITER_ID     => null,
            InvitationInterface::ATTR_EMAIL          => 'invitee-' . \bin2hex(\random_bytes(4)) . '@example.test',
            InvitationInterface::ATTR_CHANNEL        => InvitationChannel::Email->value,
            InvitationInterface::ATTR_ROLE_KEY       => 'member',
            InvitationInterface::ATTR_GRANTS         => [],
            InvitationInterface::ATTR_STATE          => InvitationStatus::Pending->value,
            InvitationInterface::ATTR_TOKEN_HASH     => \hash('sha256', $rawToken),
            InvitationInterface::ATTR_TOKEN_PREFIX   => \substr($rawToken, 0, 8),
            InvitationInterface::ATTR_EXPIRES_AT     => \now()->addDays(14),
            InvitationInterface::ATTR_RESEND_COUNT   => 0,
        ];
    }

    /**
     * State: mark the invitation delivered.
     */
    public function delivered(): static
    {
        return $this->state(fn (): array => [
            InvitationInterface::ATTR_STATE        => InvitationStatus::Delivered->value,
            InvitationInterface::ATTR_SENT_AT      => \now()->subMinutes(5),
            InvitationInterface::ATTR_DELIVERED_AT => \now(),
        ]);
    }

    /**
     * State: mark the invitation accepted.
     */
    public function accepted(): static
    {
        return $this->state(fn (): array => [
            InvitationInterface::ATTR_STATE               => InvitationStatus::Accepted->value,
            InvitationInterface::ATTR_ACCEPTED_AT         => \now(),
            InvitationInterface::ATTR_ACCEPTED_BY_USER_ID => (string) Str::uuid(),
        ]);
    }

    /**
     * State: mark the invitation revoked.
     */
    public function revoked(): static
    {
        return $this->state(fn (): array => [
            InvitationInterface::ATTR_STATE           => InvitationStatus::Revoked->value,
            InvitationInterface::ATTR_REVOKED_AT      => \now(),
            InvitationInterface::ATTR_REVOKED_REASON  => 'no_longer_needed',
        ]);
    }

    /**
     * State: mark the invitation expired.
     */
    public function expired(): static
    {
        return $this->state(fn (): array => [
            InvitationInterface::ATTR_STATE       => InvitationStatus::Expired->value,
            InvitationInterface::ATTR_EXPIRES_AT  => \now()->subDay(),
            InvitationInterface::ATTR_EXPIRED_AT  => \now(),
        ]);
    }

    /**
     * State: attach a specific target type + id.
     */
    public function targeting(string $type, string $id): static
    {
        return $this->state(fn (): array => [
            InvitationInterface::ATTR_TARGET_TYPE => $type,
            InvitationInterface::ATTR_TARGET_ID   => $id,
        ]);
    }
}
