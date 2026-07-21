<?php

declare(strict_types=1);

namespace Stackra\Notifications\Sms\Jobs;

use Stackra\Notifications\Sms\Contracts\Repositories\SmsOptOutRepositoryInterface;
use Stackra\Notifications\Sms\Contracts\Services\SmsCostCalculatorInterface;
use Stackra\Notifications\Sms\Contracts\Services\SmsTransportManagerInterface;
use Stackra\Notifications\Sms\Data\SmsEnvelope;
use Stackra\Notifications\Sms\Enums\SmsProvider;
use Stackra\Notifications\Sms\Events\SmsFailed;
use Stackra\Notifications\Sms\Events\SmsSent;
use Stackra\Notifications\Sms\Events\SmsUndeliverable;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldBeUnique;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\Attributes\Backoff;
use Illuminate\Queue\Attributes\Queue;
use Illuminate\Queue\Attributes\Tries;
use Illuminate\Queue\Attributes\UniqueFor;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Throwable;

/**
 * Deliver one SMS via the configured provider.
 *
 * ## Flow
 *
 *  1. Check the opt-out registry — refuse if the phone is opted out.
 *  2. Check the cost cap — refuse if the tenant is over budget.
 *  3. Resolve the provider driver + call `send()`.
 *  4. Fire the appropriate event based on {@see SmsSendResult}.
 *
 * @category NotificationsSms
 *
 * @since    0.1.0
 */
#[Queue('notifications')]
#[Tries(3)]
#[Backoff([60, 300, 1800])]
final class SendSmsJob implements ShouldBeUnique, ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    public function __construct(
        public readonly string $notificationId,
        public readonly string $deliveryId,
        public readonly string $tenantId,
        public readonly string $provider,
        public readonly string $phone,
        public readonly string $body,
        public readonly ?string $senderId = null,
    ) {
    }

    #[UniqueFor(300)]
    public function uniqueId(): string
    {
        return $this->deliveryId;
    }

    public function handle(
        SmsOptOutRepositoryInterface $optOuts,
        SmsCostCalculatorInterface $costCalculator,
        SmsTransportManagerInterface $manager,
    ): void {
        // Opt-out gate — refuse silently. The delivery is marked
        // permanently_failed by the notifications core listener that consumes
        // `SmsFailed(errorCode=OPTED_OUT)`.
        if ($optOuts->isOptedOut($this->phone, $this->tenantId)) {
            event(new SmsFailed(
                notificationId: $this->notificationId,
                deliveryId: $this->deliveryId,
                provider: $this->provider,
                errorCode: 'OPTED_OUT',
                errorMessage: 'Recipient has opted out of SMS notifications.',
            ));

            return;
        }

        // Cost-cap gate.
        $countryCode = $this->deriveCountryCode();
        if ($costCalculator->wouldExceedCap($this->tenantId, $this->provider, $countryCode)) {
            event(new SmsFailed(
                notificationId: $this->notificationId,
                deliveryId: $this->deliveryId,
                provider: $this->provider,
                errorCode: 'COST_CAP_EXCEEDED',
                errorMessage: 'Tenant would exceed monthly SMS cost cap.',
            ));

            return;
        }

        $envelope = new SmsEnvelope(
            notificationId: $this->notificationId,
            deliveryId: $this->deliveryId,
            provider: SmsProvider::from($this->provider),
            phone: $this->phone,
            body: $this->body,
            senderId: $this->senderId,
            tenantId: $this->tenantId,
        );

        try {
            $result = $manager->driver($this->provider)->send($envelope);
        } catch (Throwable $e) {
            event(new SmsFailed(
                notificationId: $this->notificationId,
                deliveryId: $this->deliveryId,
                provider: $this->provider,
                errorCode: 'provider_exception',
                errorMessage: $e->getMessage(),
            ));

            return;
        }

        if ($result->undeliverable) {
            event(new SmsUndeliverable(
                notificationId: $this->notificationId,
                deliveryId: $this->deliveryId,
                provider: $this->provider,
                phone: $this->phone,
                errorCode: (string) $result->errorCode,
            ));

            return;
        }

        if (! $result->accepted) {
            event(new SmsFailed(
                notificationId: $this->notificationId,
                deliveryId: $this->deliveryId,
                provider: $this->provider,
                errorCode: (string) $result->errorCode,
                errorMessage: (string) $result->errorMessage,
            ));

            return;
        }

        event(new SmsSent(
            notificationId: $this->notificationId,
            deliveryId: $this->deliveryId,
            provider: $this->provider,
            providerMessageId: (string) $result->providerMessageId,
            phone: $this->phone,
            costMicroUnits: $result->costMicroUnits,
        ));
    }

    /**
     * Cheap country-code derivation from the E.164 prefix. Consumers can
     * override via a real libphonenumber-backed calculator.
     */
    private function deriveCountryCode(): string
    {
        return match (true) {
            \str_starts_with($this->phone, '+1')  => 'US',
            \str_starts_with($this->phone, '+44') => 'GB',
            \str_starts_with($this->phone, '+33') => 'FR',
            \str_starts_with($this->phone, '+49') => 'DE',
            \str_starts_with($this->phone, '+34') => 'ES',
            \str_starts_with($this->phone, '+61') => 'AU',
            default                                => 'ZZ',
        };
    }
}
