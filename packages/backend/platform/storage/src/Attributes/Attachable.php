<?php

declare(strict_types=1);

namespace Stackra\Storage\Attributes;

use Attribute;

/**
 * Marks a model class or property as attachable to a
 * {@see \Stackra\Storage\Models\File} of the named kind.
 *
 * Applied on the property, `#[Attachable(kind: 'avatar')]` on a
 * `User::$avatarFile` accessor declares "this model has an avatar"
 * — the `HasFiles` trait exposes `$user->avatar()` returning the
 * resolved `File`.
 *
 * Applied on the class, the module scanner registers the kind with
 * {@see \Stackra\Storage\Contracts\Registry\FileKindRegistryInterface}
 * so the API layer validates the upload MIME + size without
 * per-controller code.
 *
 * @category Storage
 *
 * @since    0.1.0
 */
#[Attribute(Attribute::TARGET_CLASS | Attribute::TARGET_PROPERTY | Attribute::IS_REPEATABLE)]
final readonly class Attachable
{
    /**
     * @param  string                $kind               File-kind key (`avatar`, `logo`, …).
     * @param  int|null              $max                Optional cap in megabytes; falls back to `FileKind::defaultMaxSizeMb()`.
     * @param  array<int, string>|null $mime             Optional allow-list of MIME types; falls back to `FileKind::defaultMimes()`.
     * @param  array<int, string>    $generatesVariants  Variant recipe keys to run on upload.
     * @param  bool                  $requiresVirusScan  Force antivirus scan (default true).
     * @param  bool                  $single             Whether the attachment is single-slot (uploading replaces).
     */
    public function __construct(
        public string $kind,
        public ?int $max = null,
        public ?array $mime = null,
        public array $generatesVariants = [],
        public bool $requiresVirusScan = true,
        public bool $single = false,
    ) {
    }
}
