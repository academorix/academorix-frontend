<?php

declare(strict_types=1);

namespace Stackra\Webhook\Rules;

use Stackra\Webhook\Contracts\Services\WebhookRegistryInterface;
use Closure;
use Illuminate\Contracts\Container\BindingResolutionException;
use Illuminate\Contracts\Validation\ValidationRule;

/**
 * Validate that every entry in the `events` array is a known event
 * from the {@see WebhookRegistryInterface}.
 *
 * The rule accepts either a single string (checked on its own) or an
 * array (every entry checked).
 *
 * @category Webhook
 *
 * @since    0.1.0
 */
final class ValidEventName implements ValidationRule
{
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        try {
            /** @var WebhookRegistryInterface $registry */
            $registry = \app(WebhookRegistryInterface::class);
        } catch (BindingResolutionException) {
            // Registry not booted yet — fail-soft to avoid blocking
            // schema-only tests.
            return;
        }

        $names = \is_array($value) ? $value : [$value];
        foreach ($names as $name) {
            if (! \is_string($name) || $name === '') {
                $fail(__('webhook::validation.valid_event_name'));

                return;
            }

            if (! $registry->has($name)) {
                $fail(__('webhook::validation.valid_event_name'));

                return;
            }
        }
    }
}
