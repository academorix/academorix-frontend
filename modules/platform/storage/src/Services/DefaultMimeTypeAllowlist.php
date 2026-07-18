<?php

declare(strict_types=1);

namespace Academorix\Storage\Services;

use Academorix\Storage\Contracts\Services\FileKindRegistryInterface;
use Academorix\Storage\Contracts\Services\MimeTypeAllowlistInterface;
use Academorix\Storage\Enums\FileKind;
use Illuminate\Container\Attributes\Singleton;

/**
 * MIME-type allow-list backed by the {@see FileKindRegistryInterface}.
 *
 * For a known kind, `isAllowed()` reads the registered
 * `allowedMimes` list; when absent falls back to
 * `FileKind::defaultMimes()`. A wildcard entry (`* / *` without the
 * spaces) in the allow-list disables the check for that kind.
 *
 * `#[Singleton]` — the allow-list itself is stateless; it reads
 * per-check from the (also singleton) registry. The interface
 * declares the container binding via
 * `#[Bind(DefaultMimeTypeAllowlist::class)]` (Pattern A per
 * `.kiro/steering/php-attributes.md`), so this concrete carries only
 * its lifetime attribute.
 *
 * @category Storage
 *
 * @since    0.1.0
 */
#[Singleton]
final class DefaultMimeTypeAllowlist implements MimeTypeAllowlistInterface
{
    public function __construct(
        private readonly FileKindRegistryInterface $registry,
    ) {
    }

    /**
     * {@inheritDoc}
     */
    public function isAllowed(string $mime, FileKind $kind): bool
    {
        // Fetch from the registry first (per-consumer recipe wins).
        $config = $this->registry->get($kind->value);
        /** @var array<int, string> $allowed */
        $allowed = $config['allowedMimes'] ?? $kind->defaultMimes();

        return $this->matches($mime, $allowed);
    }

    /**
     * {@inheritDoc}
     */
    public function isAllowedForKey(string $mime, string $kindKey): bool
    {
        $config = $this->registry->get($kindKey);
        /** @var array<int, string> $allowed */
        $allowed = $config['allowedMimes'] ?? [];

        if ($allowed === []) {
            // No registered recipe — fall back to the enum default
            // when the key happens to match an enum case.
            $enum = FileKind::tryFrom($kindKey);

            $allowed = $enum?->defaultMimes() ?? ['*/*'];
        }

        return $this->matches($mime, $allowed);
    }

    /**
     * Whether `$mime` matches any entry in `$allowed`. A wildcard
     * entry (star slash star, no spaces) disables the check.
     *
     * @param  array<int, string>  $allowed
     */
    private function matches(string $mime, array $allowed): bool
    {
        if (\in_array('*/*', $allowed, true)) {
            return true;
        }

        return \in_array($mime, $allowed, true);
    }
}
