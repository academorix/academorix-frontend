<?php

/**
 * @file packages/exceptions/src/Data/FieldError.php
 *
 * @description
 * Single field-level validation entry inside a 422 response. Kept as a
 * plain readonly class (no `spatie/laravel-data` dependency) so the
 * exceptions package can be consumed by services that don't include
 * that library.
 */

declare(strict_types=1);

namespace Academorix\Exceptions\Data;

use JsonSerializable;

final readonly class FieldError implements JsonSerializable
{
    /**
     * @param list<string> $messages
     */
    public function __construct(
        public string $field,
        public array $messages,
    ) {
    }

    /** @return array{field: string, messages: list<string>} */
    public function jsonSerialize(): array
    {
        return [
            'field' => $this->field,
            'messages' => $this->messages,
        ];
    }
}
