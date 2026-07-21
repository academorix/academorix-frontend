<?php

declare(strict_types=1);

namespace Stackra\Storage\Contracts\Services;

use Stackra\Storage\Enums\FileKind;
use Stackra\Storage\Services\DefaultMimeTypeAllowlist;
use Illuminate\Container\Attributes\Bind;

/**
 * Contract for the MIME-type allow-list.
 *
 * Reads the `#[FileKind]` recipe from
 * {@see FileKindRegistryInterface} and enforces the per-kind
 * allow-list on every upload. Used by
 * {@see \Stackra\Storage\Middleware\StorageMimeValidate} +
 * the `ValidMimeForKind` validation rule.
 *
 * `#[Bind(DefaultMimeTypeAllowlist::class)]` — Pattern A per
 * `.kiro/steering/php-attributes.md` §"Bind vs Overrides". The
 * interface owns the wiring; the concrete stays free of the binding
 * attribute and only carries its lifetime attribute (`#[Singleton]`).
 *
 * @category Storage
 *
 * @since    0.1.0
 */
#[Bind(DefaultMimeTypeAllowlist::class)]
interface MimeTypeAllowlistInterface
{
    /**
     * Whether the given MIME is allowed for the given kind.
     */
    public function isAllowed(string $mime, FileKind $kind): bool;

    /**
     * Whether the given MIME is allowed for a runtime-registered
     * kind key (not necessarily one of the {@see FileKind} enum
     * cases).
     */
    public function isAllowedForKey(string $mime, string $kindKey): bool;
}
