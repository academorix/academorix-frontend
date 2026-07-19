<?php

declare(strict_types=1);

namespace Academorix\Settings\Contracts\Services;

use Academorix\Settings\Models\SettingValue;
use Academorix\Settings\Services\DefaultSettingsWriter;
use Illuminate\Container\Attributes\Bind;

/**
 * Write orchestrator — the mutation side of the settings platform.
 *
 * Persists a value at a specific scope, fires
 * {@see \Academorix\Settings\Events\SettingsChangeEvent} on commit
 * (which the activity + audit modules consume for the dual-write),
 * and refuses cross-scope writes at the wrong scope level.
 *
 * @category Settings
 *
 * @since    0.1.0
 */
#[Bind(DefaultSettingsWriter::class)]
interface SettingsWriterInterface
{
    /**
     * Persist a value.
     *
     * @param  string       $key        Field slug.
     * @param  mixed        $value      New value (must satisfy the schema's rules).
     * @param  string       $scopeKind  One of `system` / `tenant` / `user`.
     * @param  string|null  $scopeId    Concrete owner id, or NULL for system scope.
     * @return SettingValue  The persisted (or upserted) row.
     *
     * @throws \Academorix\Settings\Exceptions\SettingsWriteRefusedException  On policy / validation failure.
     */
    public function write(string $key, mixed $value, string $scopeKind, ?string $scopeId): SettingValue;
}
