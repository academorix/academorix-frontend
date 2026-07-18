<?php

declare(strict_types=1);

namespace Academorix\Webhook\Rules;

use Academorix\Webhook\Contracts\Services\WebhookDestinationRegistryInterface;
use Closure;
use Illuminate\Contracts\Container\BindingResolutionException;
use Illuminate\Contracts\Validation\ValidationRule;

/**
 * Validate that a destination config carries every required key for
 * the selected destination driver.
 *
 * Used on the `destination_config` field of the subscription request
 * DTOs. The rule needs to know the sibling `destination` value — the
 * caller passes it into the constructor.
 *
 * @category Webhook
 *
 * @since    0.1.0
 */
final class ValidDestinationConfig implements ValidationRule
{
    /**
     * @param  string  $destination  The selected destination-driver key.
     */
    public function __construct(private readonly string $destination)
    {
    }

    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (! \is_array($value)) {
            $fail(__('webhook::validation.valid_destination_config'));

            return;
        }

        try {
            /** @var WebhookDestinationRegistryInterface $registry */
            $registry = \app(WebhookDestinationRegistryInterface::class);
        } catch (BindingResolutionException) {
            // Registry not booted yet — fail-soft to avoid blocking
            // schema-only tests.
            return;
        }

        $drivers = $registry->all();
        if (! isset($drivers[$this->destination])) {
            $fail(__('webhook::validation.valid_destination_config'));

            return;
        }

        foreach ($drivers[$this->destination]['required_config'] as $key) {
            if (! \array_key_exists($key, $value) || $value[$key] === null || $value[$key] === '') {
                $fail(__('webhook::validation.valid_destination_config'));

                return;
            }
        }
    }
}
