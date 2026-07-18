<?php

declare(strict_types=1);

namespace Academorix\Storage\Concerns;

/**
 * Marker trait for anything acting file-like.
 *
 * Composed onto {@see \Academorix\Storage\Models\File}; rarely
 * useful outside that class. Kept as a trait so downstream consumers
 * can `use IsFile` on a bespoke satellite record and have the module
 * recognise it as file-shaped (documentation-heavy, behaviour-light).
 *
 * @category Storage
 *
 * @since    0.1.0
 */
trait IsFile
{
    /**
     * Whether this instance represents a file. Consumers may
     * override, but the trait's presence is enough for discovery.
     */
    public function isFile(): bool
    {
        return true;
    }
}
