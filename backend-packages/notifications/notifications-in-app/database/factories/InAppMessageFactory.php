<?php

declare(strict_types=1);

namespace Academorix\Notifications\InApp\Database\Factories;

use Academorix\Notifications\InApp\Contracts\Data\InAppMessageInterface;
use Academorix\Notifications\InApp\Models\InAppMessage;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * Factory for {@see InAppMessage}.
 *
 * Produces a plausible inbox row without a specific addressee /
 * notification — tests call factory states to bind those:
 *
 *   - `->forAddressee($userId, $type)` — pin the addressee.
 *   - `->forNotification($id)` — pin the source notification.
 *   - `->withCategory('billing.invoice_paid')` — pin the category.
 *
 * @extends Factory<InAppMessage>
 *
 * @category NotificationsInApp
 *
 * @since    0.1.0
 */
final class InAppMessageFactory extends Factory
{
    /**
     * @var class-string<InAppMessage>
     */
    protected $model = InAppMessage::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            InAppMessageInterface::ATTR_ID              => 'iam_' . Str::ulid()->toBase32(),
            InAppMessageInterface::ATTR_TENANT_ID       => 'ten_' . Str::ulid()->toBase32(),
            InAppMessageInterface::ATTR_APPLICATION_ID  => 'app_' . Str::ulid()->toBase32(),
            InAppMessageInterface::ATTR_NOTIFICATION_ID => 'not_' . Str::ulid()->toBase32(),
            InAppMessageInterface::ATTR_ADDRESSEE_ID    => 'usr_' . Str::ulid()->toBase32(),
            InAppMessageInterface::ATTR_ADDRESSEE_TYPE  => 'user',
            InAppMessageInterface::ATTR_CATEGORY_SLUG   => 'default',
            InAppMessageInterface::ATTR_PRIORITY        => 'product',
            InAppMessageInterface::ATTR_TITLE           => $this->faker->sentence(4),
            InAppMessageInterface::ATTR_BODY_PREVIEW    => $this->faker->paragraph(2),
            InAppMessageInterface::ATTR_ACTION_URL      => null,
            InAppMessageInterface::ATTR_ICON            => null,
            InAppMessageInterface::ATTR_PAYLOAD         => null,
            InAppMessageInterface::ATTR_DELIVERED_AT    => \now(),
            InAppMessageInterface::ATTR_METADATA        => null,
        ];
    }

    /**
     * State: pin the addressee to a specific user id + type.
     *
     * @param  string  $addresseeId    Recipient id.
     * @param  string  $addresseeType  Polymorphic addressee type.
     */
    public function forAddressee(string $addresseeId, string $addresseeType = 'user'): static
    {
        return $this->state(fn (): array => [
            InAppMessageInterface::ATTR_ADDRESSEE_ID   => $addresseeId,
            InAppMessageInterface::ATTR_ADDRESSEE_TYPE => $addresseeType,
        ]);
    }

    /**
     * State: pin the source notification id.
     */
    public function forNotification(string $notificationId): static
    {
        return $this->state(fn (): array => [
            InAppMessageInterface::ATTR_NOTIFICATION_ID => $notificationId,
        ]);
    }

    /**
     * State: pin the category slug + priority pair.
     */
    public function withCategory(string $slug, string $priority = 'product'): static
    {
        return $this->state(fn (): array => [
            InAppMessageInterface::ATTR_CATEGORY_SLUG => $slug,
            InAppMessageInterface::ATTR_PRIORITY      => $priority,
        ]);
    }
}
