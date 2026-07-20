<?php

declare(strict_types=1);

namespace Academorix\Database\Concerns;

use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia as MediaLibraryInteractsWithMedia;

/**
 * Adds file/media attachments to any model (spatie/laravel-medialibrary v11).
 *
 * Wraps the vendor trait so the whole codebase references one Foundation concern
 * — a single place to adjust behaviour, decoupled from the package — mirroring
 * {@see HasMetadata}. This is the standard for all images/files in Academorix.
 *
 * Files are recorded in the central, polymorphic `media` table and stored on the
 * configured disk (`MEDIA_DISK`). On tenant-suffixed disks (see
 * config/tenancy.php `filesystem.disks`) the stored files are isolated per
 * tenant automatically, so a tenant-owned model's media never bleeds across
 * tenants.
 *
 * A consuming model MUST also implement {@see HasMedia} — a trait cannot supply
 * an interface — and declare its collections:
 *
 * ```php
 * use Academorix\Database\Concerns\InteractsWithMedia;
 * use Illuminate\Database\Eloquent\Model;
 * use Spatie\MediaLibrary\HasMedia;
 *
 * final class Example extends Model implements HasMedia
 * {
 *     use InteractsWithMedia;
 *
 *     public function registerMediaCollections(): void
 *     {
 *         $this->addMediaCollection('logo')->singleFile();
 *     }
 * }
 * ```
 */
trait InteractsWithMedia
{
    use MediaLibraryInteractsWithMedia;
}
