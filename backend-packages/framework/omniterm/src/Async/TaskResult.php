<?php

declare(strict_types=1);

/**
 * Task Result
 *
 * Support class providing Task Result utilities for the Omniterm module.
 * Contains helper logic used across multiple components in this module.
 *
 * @category Support
 *
 * @since    1.0.0
 */
namespace Academorix\OmniTerm\Async;

class TaskResult
{
    public function __construct(
        public readonly string $state,
        public readonly string $message,
        public readonly string $details = '',
        public readonly array $data = [],
    ) {}

    public static function fromArray(array $result, string $defaultMessage = ''): self
    {
        return new self(
            state: $result['state'] ?? 'success',
            message: $result['message'] ?? $defaultMessage,
            details: $result['details'] ?? '',
            data: $result['data'] ?? [],
        );
    }

    public static function success(string $message, string $details = ''): self
    {
        return new self('success', $message, $details);
    }

    public static function error(string $message, string $details = ''): self
    {
        return new self('error', $message, $details);
    }

    public static function warning(string $message, string $details = ''): self
    {
        return new self('warning', $message, $details);
    }

    public function isSuccess(): bool
    {
        return $this->state === 'success';
    }

    public function isError(): bool
    {
        return $this->state === 'error';
    }

    public function isWarning(): bool
    {
        return $this->state === 'warning';
    }
}
