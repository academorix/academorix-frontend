<?php

declare(strict_types=1);

namespace Academorix\Storage\Concerns;

use Academorix\Storage\Contracts\Data\FileInterface;
use Academorix\Storage\Models\File;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphMany;

/**
 * Trait for consumer models that own files.
 *
 * Composed onto any Eloquent model that declares `#[Attachable]`
 * properties (or that just wants a polymorphic `MorphMany<File>`
 * pipe). Exposes:
 *
 *  - `files(): MorphMany` — the whole set of attached files.
 *  - `file(string $kind): ?File` — the newest file of a kind.
 *  - `attach(File $file, string $kind): void` — reparent a file
 *    row onto this model.
 *  - `detach(string $kind): void` — soft-delete every file of a
 *    kind on this model.
 *
 * The trait does not include the storage upload path — that goes
 * through the module's Actions and Services layer. `attach()` /
 * `detach()` are for wiring an existing `File` row to a different
 * parent (rare — mostly for tests and admin surgery).
 *
 * @category Storage
 *
 * @since    0.1.0
 *
 * @mixin  Model
 */
trait HasFiles
{
    /**
     * Every file attached to this model.
     *
     * @return MorphMany<File, $this>
     */
    public function files(): MorphMany
    {
        /** @var MorphMany<File, $this> $relation */
        $relation = $this->morphMany(File::class, 'fileable', FileInterface::ATTR_FILEABLE_TYPE, FileInterface::ATTR_FILEABLE_ID);

        return $relation;
    }

    /**
     * Freshest file of a kind attached to this model.
     */
    public function file(string $kind): ?File
    {
        /** @var File|null $result */
        $result = $this->files()
            ->where(FileInterface::ATTR_KIND, $kind)
            ->latest()
            ->first();

        return $result;
    }

    /**
     * Attach an existing File to this model — reparents the row
     * onto the current instance.
     */
    public function attach(File $file, string $kind): void
    {
        $file->{FileInterface::ATTR_FILEABLE_TYPE} = static::class;
        $file->{FileInterface::ATTR_FILEABLE_ID}   = $this->getKey();
        $file->{FileInterface::ATTR_KIND}          = $kind;
        $file->save();
    }

    /**
     * Detach every file of a kind on this model — soft-delete each
     * row (the observer decrements the content-addressable refcount).
     */
    public function detach(string $kind): void
    {
        $this->files()
            ->where(FileInterface::ATTR_KIND, $kind)
            ->get()
            ->each(static fn (File $f): mixed => $f->delete());
    }
}
