<?php

declare(strict_types=1);

namespace Stackra\Storage\Enums;

use Stackra\Enum\Attributes\Description;
use Stackra\Enum\Attributes\Label;
use Stackra\Enum\Attributes\Meta;
use Stackra\Enum\Enum;

/**
 * Well-known top-level file kinds.
 *
 * The kind taxonomy the module ships. Downstream modules extend the
 * catalogue at runtime via the `#[FileKind]` class attribute, which
 * registers a per-key recipe with
 * {@see \Stackra\Storage\Contracts\Registry\FileKindRegistryInterface}.
 *
 * ## Cases
 *
 *  * {@see self::Avatar}     — profile / user avatar imagery.
 *  * {@see self::Logo}       — tenant / branding logos.
 *  * {@see self::Document}   — PDF / DOC / XLS artefacts (documents,
 *    contracts, waivers).
 *  * {@see self::Image}      — general images not covered by
 *    {@see self::Avatar} or {@see self::Logo}.
 *  * {@see self::Attachment} — generic file attached to an
 *    aggregate (email attachment, note attachment).
 *  * {@see self::Video}      — video assets.
 *  * {@see self::Audio}      — audio assets.
 *  * {@see self::Other}      — first-class fallback for anything
 *    outside the shipped taxonomy.
 *
 * @category Storage
 *
 * @since    0.1.0
 */
#[Meta([Label::class, Description::class])]
enum FileKind: string
{
    use Enum;

    #[Label('Avatar')]
    #[Description('Profile / user avatar imagery. Small, image-only.')]
    case Avatar = 'avatar';

    #[Label('Logo')]
    #[Description('Tenant / brand logo. Rendered on tenant surfaces.')]
    case Logo = 'logo';

    #[Label('Document')]
    #[Description('PDF / DOC / XLS documents; contracts, waivers, forms.')]
    case Document = 'document';

    #[Label('Image')]
    #[Description('General-purpose image not tied to avatar or logo.')]
    case Image = 'image';

    #[Label('Attachment')]
    #[Description('Generic file attached to another aggregate (note, email, thread).')]
    case Attachment = 'attachment';

    #[Label('Video')]
    #[Description('Video asset. Chunked-upload eligible by default.')]
    case Video = 'video';

    #[Label('Audio')]
    #[Description('Audio asset.')]
    case Audio = 'audio';

    #[Label('Other')]
    #[Description('Fallback bucket for anything outside the shipped taxonomy.')]
    case Other = 'other';

    /**
     * Default max size in megabytes for this kind.
     *
     * Downstream `#[FileKind(maxSizeMb: ...)]` recipes override this
     * on a per-consumer basis; the value here is the platform-safe
     * default that keeps the upload path bounded.
     */
    public function defaultMaxSizeMb(): int
    {
        return match ($this) {
            self::Avatar     => 5,
            self::Logo       => 5,
            self::Document   => 25,
            self::Image      => 15,
            self::Attachment => 50,
            self::Video      => 500,
            self::Audio      => 100,
            self::Other      => 50,
        };
    }

    /**
     * Default allowed MIME types for this kind.
     *
     * @return list<string>
     */
    public function defaultMimes(): array
    {
        return match ($this) {
            self::Avatar,
            self::Logo,
            self::Image      => ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'],

            self::Document   => [
                'application/pdf',
                'application/msword',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'application/vnd.ms-excel',
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'text/plain',
                'text/csv',
            ],

            self::Attachment => ['*/*'],

            self::Video      => ['video/mp4', 'video/webm', 'video/quicktime'],

            self::Audio      => ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/webm'],

            self::Other      => ['*/*'],
        };
    }
}
