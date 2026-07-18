<?php

declare(strict_types=1);

namespace Academorix\Versioning\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

/**
 * Validate that a value references a class with a public
 * `transform(array): array` method — the payload-transformer
 * signature contract.
 *
 * Fails when the class doesn't exist, doesn't expose a public
 * `transform()` method, or the method signature is incompatible with
 * `array -> array`.
 *
 * @category Versioning
 *
 * @since    0.1.0
 */
final class ValidTransformerSignature implements ValidationRule
{
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (! \is_string($value) || $value === '' || ! \class_exists($value)) {
            $fail((string) \__('versioning::validation.valid_transformer_signature'));

            return;
        }

        try {
            $reflection = new \ReflectionClass($value);
        } catch (\ReflectionException) {
            $fail((string) \__('versioning::validation.valid_transformer_signature'));

            return;
        }

        if (! $reflection->hasMethod('transform')) {
            $fail((string) \__('versioning::validation.valid_transformer_signature'));

            return;
        }

        $method = $reflection->getMethod('transform');
        if (! $method->isPublic()) {
            $fail((string) \__('versioning::validation.valid_transformer_signature'));

            return;
        }

        $parameters = $method->getParameters();
        if (\count($parameters) < 1) {
            $fail((string) \__('versioning::validation.valid_transformer_signature'));

            return;
        }

        $firstParamType = $parameters[0]->getType();
        if (! $firstParamType instanceof \ReflectionNamedType || $firstParamType->getName() !== 'array') {
            $fail((string) \__('versioning::validation.valid_transformer_signature'));

            return;
        }

        $returnType = $method->getReturnType();
        if (! $returnType instanceof \ReflectionNamedType || $returnType->getName() !== 'array') {
            $fail((string) \__('versioning::validation.valid_transformer_signature'));
        }
    }
}
