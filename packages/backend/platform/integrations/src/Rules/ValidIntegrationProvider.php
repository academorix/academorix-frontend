<?php

declare(strict_types=1);

namespace Stackra\Integrations\Rules;

use Stackra\Integrations\Enums\IntegrationKind;
use Closure;
use Illuminate\Contracts\Validation\DataAwareRule;
use Illuminate\Contracts\Validation\ValidationRule;

/**
 * Validate that a `provider` key is allow-listed for the given
 * `kind`.
 *
 * Reads `config('integrations.providers')` — a map of
 * `IntegrationKind::value → list<string>`. When the caller's payload
 * carries a `kind` that isn't a known enum case, or a `provider` that
 * isn't in the whitelist for that kind, the rule fails.
 *
 * @category Integrations
 *
 * @since    0.1.0
 */
final class ValidIntegrationProvider implements DataAwareRule, ValidationRule
{
    /**
     * Sibling payload made available by the validator so we can
     * inspect the `kind` alongside the `provider` under validation.
     *
     * @var array<string, mixed>
     */
    private array $data = [];

    /**
     * {@inheritDoc}
     *
     * @param  array<string, mixed>  $data
     */
    public function setData(array $data): static
    {
        $this->data = $data;

        return $this;
    }

    /**
     * {@inheritDoc}
     */
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (! \is_string($value) || $value === '') {
            $fail(__('integrations::validation.valid_integration_provider'));

            return;
        }

        $kindValue = $this->data['kind'] ?? null;
        if (! \is_string($kindValue) || IntegrationKind::tryFrom($kindValue) === null) {
            $fail(__('integrations::validation.valid_integration_provider'));

            return;
        }

        /** @var array<string, array<int, string>> $providers */
        $providers = (array) \config('integrations.providers', []);
        $allowed   = $providers[$kindValue] ?? [];

        if (! \in_array($value, $allowed, true)) {
            $fail(__('integrations::validation.valid_integration_provider'));
        }
    }
}
