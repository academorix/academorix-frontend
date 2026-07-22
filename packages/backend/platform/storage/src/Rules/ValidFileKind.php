<?php

declare(strict_types=1);

namespace Stackra\Storage\Rules;

use Stackra\Storage\Contracts\Registry\FileKindRegistryInterface;
use Stackra\Storage\Enums\FileKind;
use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

/**
 * Assert that the incoming `kind` is either a well-known
 * {@see FileKind} case or a runtime-registered kind key.
 *
 * @category Storage
 *
 * @since    0.1.0
 */
final class ValidFileKind implements ValidationRule
{
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (! \is_string($value) || $value === '') {
            $fail(__('storage::validation.valid_file_kind'));

            return;
        }

        // Enum case OR registered runtime kind.
        if (FileKind::tryFrom($value) !== null) {
            return;
        }

        try {
            /** @var FileKindRegistryInterface $registry */
            $registry = \app(FileKindRegistryInterface::class);
            if ($registry->has($value)) {
                return;
            }
        } catch (\Throwable) {
            // fail-soft on missing container binding — still fall
            // through to the fail() below.
        }

        $fail(__('storage::validation.valid_file_kind'));
    }
}
