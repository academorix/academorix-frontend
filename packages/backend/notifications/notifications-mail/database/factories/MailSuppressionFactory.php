<?php

declare(strict_types=1);

namespace Stackra\Notifications\Mail\Database\Factories;

use Stackra\Notifications\Mail\Contracts\Data\MailSuppressionInterface;
use Stackra\Notifications\Mail\Enums\MailProvider;
use Stackra\Notifications\Mail\Enums\MailSuppressionReason;
use Stackra\Notifications\Mail\Models\MailSuppression;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * Factory for {@see MailSuppression}.
 *
 * Produces rows with `reason = hard_bounce`, `provider = mailgun`,
 * `tenant_id` set (tenant-scoped) by default. Callers use factory
 * states (`platformWide()`, `complaint()`, `softBounce()`,
 * `manual()`, `spamTrap()`, `expired()`) for the common test
 * variants.
 *
 * @extends Factory<MailSuppression>
 *
 * @category NotificationsMail
 *
 * @since    0.1.0
 */
final class MailSuppressionFactory extends Factory
{
    /**
     * The model this factory builds.
     *
     * @var class-string<MailSuppression>
     */
    protected $model = MailSuppression::class;

    /**
     * Return the default model attribute values.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $email  = $this->faker->unique()->safeEmail();
        $domain = \substr((string) \strrchr($email, '@'), 1);

        return [
            MailSuppressionInterface::ATTR_TENANT_ID          => (string) $this->faker->uuid(),
            MailSuppressionInterface::ATTR_EMAIL              => \strtolower($email),
            MailSuppressionInterface::ATTR_EMAIL_DOMAIN       => \strtolower($domain),
            MailSuppressionInterface::ATTR_REASON             => MailSuppressionReason::HardBounce->value,
            MailSuppressionInterface::ATTR_PROVIDER           => MailProvider::Mailgun->value,
            MailSuppressionInterface::ATTR_SOURCE_DELIVERY_ID => null,
            MailSuppressionInterface::ATTR_BOUNCE_REASON      => 'User mailbox is full',
            MailSuppressionInterface::ATTR_IS_SYSTEM          => false,
            MailSuppressionInterface::ATTR_METADATA           => null,
            MailSuppressionInterface::ATTR_EXPIRES_AT         => null,
        ];
    }

    /**
     * Platform-wide row — no tenant, `is_system = true`.
     */
    public function platformWide(): self
    {
        return $this->state(fn (): array => [
            MailSuppressionInterface::ATTR_TENANT_ID => null,
            MailSuppressionInterface::ATTR_IS_SYSTEM => true,
        ]);
    }

    /**
     * Complaint row — retained P5Y.
     */
    public function complaint(): self
    {
        return $this->state(fn (): array => [
            MailSuppressionInterface::ATTR_REASON        => MailSuppressionReason::Complaint->value,
            MailSuppressionInterface::ATTR_BOUNCE_REASON => 'Recipient marked message as spam',
        ]);
    }

    /**
     * Soft-bounce row — auto-expires at now()+7d by default.
     */
    public function softBounce(): self
    {
        return $this->state(fn (): array => [
            MailSuppressionInterface::ATTR_REASON        => MailSuppressionReason::SoftBounce->value,
            MailSuppressionInterface::ATTR_BOUNCE_REASON => 'Recipient mailbox temporarily unavailable',
            MailSuppressionInterface::ATTR_EXPIRES_AT    => \now()->addDays(7),
        ]);
    }

    /**
     * Manual admin block.
     */
    public function manual(): self
    {
        return $this->state(fn (): array => [
            MailSuppressionInterface::ATTR_REASON        => MailSuppressionReason::Manual->value,
            MailSuppressionInterface::ATTR_PROVIDER      => null,
            MailSuppressionInterface::ATTR_BOUNCE_REASON => null,
        ]);
    }

    /**
     * Spam-trap platform-wide row.
     */
    public function spamTrap(): self
    {
        return $this->state(fn (): array => [
            MailSuppressionInterface::ATTR_TENANT_ID => null,
            MailSuppressionInterface::ATTR_REASON    => MailSuppressionReason::SpamTrap->value,
            MailSuppressionInterface::ATTR_PROVIDER  => null,
            MailSuppressionInterface::ATTR_IS_SYSTEM => true,
        ]);
    }

    /**
     * Expired soft-bounce — used to test the pruner.
     */
    public function expired(): self
    {
        return $this->state(fn (): array => [
            MailSuppressionInterface::ATTR_REASON     => MailSuppressionReason::SoftBounce->value,
            MailSuppressionInterface::ATTR_EXPIRES_AT => \now()->subDays(1),
        ]);
    }
}
