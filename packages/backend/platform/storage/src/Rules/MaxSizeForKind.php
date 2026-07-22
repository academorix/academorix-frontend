<?php

declare(strict_types=1);

namespace Stackra\Storage\Rules;

use Stackra\Storage\Contracts\Registry\FileKindRegistryInterface;
use Stackra\Storage\Enums\FileKind;
use Closure;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Http\UploadedFile;

/**
 * Assert an uploaded file's size fits the target kind's cap.
 *
 * Pairs with the `storage.size.validate` middleware — either can
 * enforce the check; the rule is available for surface-specific
 * DTOs where the middleware isn't wired.
 *
 * @category Storage
 *
 * @since    0.1.0
 */
final class MaxSizeForKind implements ValidationRule
{
    public function __construct(
        private readonly string $kindKey,
    ) {
    }

    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (! $value instanceof UploadedFile) {
            return;
        }

        try {
            /** @var FileKindRegistryInterface $registry */
            $registry = \app(FileKindRegistryInterface::class);
            $config   = $registry->get($this->kindKey);
        } catch (\Throwable) {
            $config = [];
        }

        $maxMb = (int) ($config['maxSizeMb'] ?? (FileKind::tryFrom($this->kindKey)?->defaultMaxSizeMb() ?? 0));
        if ($maxMb <= 0) {
            return;
        }

        if ($value->getSize() > $maxMb * 1024 * 1024) {
            $fail(__('storage::validation.max_size_for_kind'));
        }
    }
}
