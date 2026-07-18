<?php

declare(strict_types=1);

namespace Academorix\Storage\Rules;

use Academorix\Storage\Contracts\Services\MimeTypeAllowlistInterface;
use Closure;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Http\UploadedFile;

/**
 * Assert an uploaded file's sniffed MIME is in the target kind's
 * allow-list.
 *
 * @category Storage
 *
 * @since    0.1.0
 */
final class ValidMimeForKind implements ValidationRule
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
            /** @var MimeTypeAllowlistInterface $allowlist */
            $allowlist = \app(MimeTypeAllowlistInterface::class);
        } catch (\Throwable) {
            // fail-soft on missing binding — treat as unable to
            // verify rather than accidentally rejecting.
            return;
        }

        $mime = (string) $value->getMimeType();
        if ($mime === '' || ! $allowlist->isAllowedForKey($mime, $this->kindKey)) {
            $fail(__('storage::validation.valid_mime_for_kind'));
        }
    }
}
