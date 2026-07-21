<?php

declare(strict_types=1);

namespace Stackra\Invitations\Database\Factories;

use Stackra\Invitations\Contracts\Data\InvitationEventInterface;
use Stackra\Invitations\Models\InvitationEvent;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * Factory for {@see InvitationEvent}.
 *
 * @extends Factory<InvitationEvent>
 *
 * @category Invitations
 *
 * @since    0.1.0
 */
final class InvitationEventFactory extends Factory
{
    /**
     * @var class-string<InvitationEvent>
     */
    protected $model = InvitationEvent::class;

    /**
     * Default row shape — a `sent` event for a freshly-issued
     * invitation.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            InvitationEventInterface::ATTR_ID             => 'ive_' . Str::ulid()->toBase32(),
            InvitationEventInterface::ATTR_INVITATION_ID  => 'inv_' . Str::ulid()->toBase32(),
            InvitationEventInterface::ATTR_APPLICATION_ID => (string) Str::uuid(),
            InvitationEventInterface::ATTR_TENANT_ID      => 'ten_' . Str::ulid()->toBase32(),
            InvitationEventInterface::ATTR_EVENT          => 'sent',
            InvitationEventInterface::ATTR_OCCURRED_AT    => \now(),
            InvitationEventInterface::ATTR_ACTOR_TYPE     => 'system',
            InvitationEventInterface::ATTR_ACTOR_ID       => null,
            InvitationEventInterface::ATTR_TRANSPORT      => 'mail',
            InvitationEventInterface::ATTR_METADATA       => [],
        ];
    }

    /**
     * State: attach a specific `event` kind.
     */
    public function event(string $event): static
    {
        return $this->state(fn (): array => [
            InvitationEventInterface::ATTR_EVENT => $event,
        ]);
    }

    /**
     * State: attach a mail-transport signal_id + transport pair
     * (drives the idempotency unique index).
     */
    public function fromTransport(string $transport, string $signalId): static
    {
        return $this->state(fn (): array => [
            InvitationEventInterface::ATTR_TRANSPORT => $transport,
            InvitationEventInterface::ATTR_SIGNAL_ID => $signalId,
        ]);
    }
}
