<?php

declare(strict_types=1);

/**
 * Archivable Attribute
 *
 * PHP 8 attribute for compile-time metadata annotation in the Framework module.
 * Discovered by the compiler to configure runtime behavior automatically.
 *
 * @category Attributes
 *
 * @since    1.0.0
 */
namespace Stackra\Database\Attributes;

use Attribute;

/**
 * Archivable Attribute for Model Classes.
 *
 * Configures the archiving behaviour for the
 * {@see \Stackra\Database\Concerns\Model\HasArchive} trait. When applied,
 * the attribute values override the trait's hardcoded defaults.
 *
 * ```php
 * #[Archivable]
 * class Project extends Model
 * {
 *     use HasArchive;
 * }
 * ```
 *
 * Custom column and opt-out of the global scope:
 *
 * ```php
 * #[Archivable(column: 'hidden_at', excludeByDefault: false)]
 * class Report extends Model
 * {
 *     use HasArchive;
 * }
 * ```
 *
 * @category Attributes
 *
 * @since    2.0.0
 *
 * @see \Stackra\Database\Concerns\Model\HasArchive
 */
#[Attribute(Attribute::TARGET_CLASS)]
final readonly class Archivable
{
    /**
     * @param  string  $column            Column that stores the archived timestamp.
     * @param  bool    $excludeByDefault  Whether to add a global scope excluding archived records.
     */
    public function __construct(
        public string $column = 'archived_at',
        public bool $excludeByDefault = true,
    ) {}
}
