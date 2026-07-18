<?php

declare(strict_types=1);

/**
 * @file packages/framework/database/src/Concerns/Enumable.php
 *
 * @description
 * Generic enum-to-table seeding loop. Composed by any seeder whose
 * job is to project one or more PHP enums into a database table
 * — one row per enum case, idempotent via `updateOrCreate`.
 *
 * Owns the LOOP; consumer traits (e.g.
 * {@see \Academorix\Authorization\Database\Seeders\Concerns\SeedsPermissionEnum})
 * own the mapping from an enum case to the target model's columns.
 *
 * Composes {@see \Academorix\Foundation\Concerns\Lifecyclable} so
 * consumers get before/after hooks for cache invalidation, event
 * dispatch, or any pre/post book-keeping — override only the phase
 * you actually use.
 *
 * ## Contract
 *
 * A consumer supplies three abstract methods:
 *
 *   - {@see enums()} — the list of enum class-strings to seed.
 *   - {@see modelClass()} — the target Eloquent model class-string.
 *   - {@see keysFor()} — the unique-lookup columns for one case
 *     (drives the `updateOrCreate` first argument).
 *
 * Optional:
 *
 *   - {@see valuesFor()} — non-key columns to fill on create AND
 *     refresh on update. Defaults to empty (lookup-key-only rows).
 *
 * @category Concerns
 *
 * @since    0.1.0
 */

namespace Academorix\Database\Concerns;

use Academorix\Foundation\Concerns\Lifecyclable;
use UnitEnum;

/**
 * Enum-to-table seeding loop with idempotent `updateOrCreate` writes.
 *
 * ## Usage
 *
 * ```php
 * use Academorix\Database\Concerns\Enumable;
 * use Illuminate\Database\Seeder;
 *
 * #[AsSeeder(priority: 44)]
 * final class BusinessTypeSeeder extends Seeder
 * {
 *     use Enumable;
 *
 *     protected function enums(): array
 *     {
 *         return [BusinessTypeEnum::class];
 *     }
 *
 *     protected function modelClass(): string
 *     {
 *         return BusinessType::class;
 *     }
 *
 *     protected function keysFor(\UnitEnum $case): array
 *     {
 *         return [BusinessTypeInterface::ATTR_SLUG => $case->value];
 *     }
 *
 *     protected function valuesFor(\UnitEnum $case): array
 *     {
 *         return [
 *             BusinessTypeInterface::ATTR_LABEL     => $case->label(),
 *             BusinessTypeInterface::ATTR_IS_SYSTEM => true,
 *         ];
 *     }
 * }
 * ```
 *
 * @category Concerns
 *
 * @since    0.1.0
 */
trait Enumable
{
    use Lifecyclable;

    /**
     * The enum class-strings this seeder projects.
     *
     * @return list<class-string<UnitEnum>>
     */
    abstract protected function enums(): array;

    /**
     * The target Eloquent model class-string.
     *
     * @return class-string
     */
    abstract protected function modelClass(): string;

    /**
     * Unique-lookup columns for one enum case. Drives
     * `updateOrCreate`'s first argument — a row matching these
     * columns is updated in place; otherwise a new row is inserted.
     *
     * @return array<string, mixed>
     */
    abstract protected function keysFor(UnitEnum $case): array;

    /**
     * Non-key columns to fill on create + refresh on update. Default
     * is empty — consumers that only need the lookup keys leave this
     * unimplemented.
     *
     * @return array<string, mixed>
     */
    protected function valuesFor(UnitEnum $case): array
    {
        return [];
    }

    /**
     * Seed every enum's cases into the target table.
     *
     * Runs {@see \Academorix\Foundation\Concerns\Lifecyclable::before()}
     * → the enum walk → {@see \Academorix\Foundation\Concerns\Lifecyclable::after()}.
     * Each case becomes one idempotent `updateOrCreate` write.
     */
    public function run(): void
    {
        $this->before();

        /** @var class-string $model */
        $model = $this->modelClass();

        foreach ($this->enums() as $enumClass) {
            foreach ($enumClass::cases() as $case) {
                $model::query()->updateOrCreate(
                    $this->keysFor($case),
                    $this->valuesFor($case),
                );
            }
        }

        $this->after();
    }
}
