<?php

declare(strict_types=1);

namespace Academorix\Notifications\Sms\Database\Factories;

use Academorix\Notifications\Sms\Contracts\Data\SmsOptOutInterface;
use Academorix\Notifications\Sms\Enums\SmsOptOutReason;
use Academorix\Notifications\Sms\Enums\SmsProvider;
use Academorix\Notifications\Sms\Models\SmsOptOut;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * Factory for {@see SmsOptOut}.
 *
 * Produces a US-country tenant-scoped opt-out with reason=admin. States
 * (`->stopKeyword()`, `->system()`, `->invalidNumber()`) attach the reason /
 * flag variants tests need.
 *
 * @extends Factory<SmsOptOut>
 *
 * @category NotificationsSms
 *
 * @since    0.1.0
 */
final class SmsOptOutFactory extends Factory
{
    /**
     * @var class-string<SmsOptOut>
     */
    protected $model = SmsOptOut::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        // Random plausible-looking E.164 US phone.
        $phone = '+1' . $this->faker->numerify('##########');

        return [
            SmsOptOutInterface::ATTR_ID                 => 'sopt_' . Str::ulid()->toBase32(),
            SmsOptOutInterface::ATTR_TENANT_ID          => 'ten_' . Str::ulid()->toBase32(),
            SmsOptOutInterface::ATTR_PHONE              => $phone,
            SmsOptOutInterface::ATTR_PHONE_COUNTRY_CODE => 'US',
            SmsOptOutInterface::ATTR_REASON             => SmsOptOutReason::Admin->value,
            SmsOptOutInterface::ATTR_PROVIDER           => SmsProvider::Twilio->value,
            SmsOptOutInterface::ATTR_IS_SYSTEM          => false,
            SmsOptOutInterface::ATTR_OPTED_OUT_AT       => now(),
        ];
    }

    /**
     * State: STOP-keyword row (TCPA-protected).
     */
    public function stopKeyword(): static
    {
        return $this->state(fn (): array => [
            SmsOptOutInterface::ATTR_REASON               => SmsOptOutReason::StopKeyword->value,
            SmsOptOutInterface::ATTR_INBOUND_MESSAGE_BODY => 'STOP',
        ]);
    }

    /**
     * State: platform-wide system row (tenant_id NULL).
     */
    public function system(): static
    {
        return $this->state(fn (): array => [
            SmsOptOutInterface::ATTR_TENANT_ID => null,
            SmsOptOutInterface::ATTR_IS_SYSTEM => true,
        ]);
    }

    /**
     * State: invalid-number row with 30d expiry.
     */
    public function invalidNumber(): static
    {
        return $this->state(fn (): array => [
            SmsOptOutInterface::ATTR_REASON     => SmsOptOutReason::InvalidNumber->value,
            SmsOptOutInterface::ATTR_EXPIRES_AT => now()->addDays(30),
        ]);
    }
}
