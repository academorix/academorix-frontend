<?php

declare(strict_types=1);

namespace Stackra\Notifications\InApp\Database\Factories;

use Stackra\Notifications\InApp\Contracts\Data\InAppMessageReadInterface;
use Stackra\Notifications\InApp\Models\InAppMessageRead;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * Factory for {@see InAppMessageRead}.
 *
 * Produces an unread row by default (`read_at = null`). States flip
 * the row into the read / dismissed shape.
 *
 * @extends Factory<InAppMessageRead>
 *
 * @category NotificationsInApp
 *
 * @since    0.1.0
 */
final class InAppMessageReadFactory extends Factory
{
    /**
     * @var class-string<InAppMessageRead>
     */
    protected $model = InAppMessageRead::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            InAppMessageReadInterface::ATTR_ID                => 'iar_' . Str::ulid()->toBase32(),
            InAppMessageReadInterface::ATTR_TENANT_ID         => 'ten_' . Str::ulid()->toBase32(),
            InAppMessageReadInterface::ATTR_IN_APP_MESSAGE_ID => 'iam_' . Str::ulid()->toBase32(),
            InAppMessageReadInterface::ATTR_ADDRESSEE_ID      => 'usr_' . Str::ulid()->toBase32(),
            InAppMessageReadInterface::ATTR_ADDRESSEE_TYPE    => 'user',
            InAppMessageReadInterface::ATTR_READ_AT           => null,
            InAppMessageReadInterface::ATTR_DISMISSED_AT      => null,
            InAppMessageReadInterface::ATTR_METADATA          => null,
        ];
    }

    /**
     * State: mark the row as read at the given time (defaults to now).
     */
    public function read(?\DateTimeInterface $at = null): static
    {
        return $this->state(fn (): array => [
            InAppMessageReadInterface::ATTR_READ_AT => $at ?? \now(),
        ]);
    }

    /**
     * State: mark the row as dismissed at the given time.
     */
    public function dismissed(?\DateTimeInterface $at = null): static
    {
        return $this->state(fn (): array => [
            InAppMessageReadInterface::ATTR_DISMISSED_AT => $at ?? \now(),
        ]);
    }
}
