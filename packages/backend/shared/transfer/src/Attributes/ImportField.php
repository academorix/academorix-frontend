<?php

declare(strict_types=1);

namespace Stackra\Transfer\Attributes;

use Attribute;

/**
 * Declares an importable column on a model.
 *
 * `IS_REPEATABLE` — a model may carry many `#[ImportField]` attributes,
 * one per column the transfer engine reads.
 *
 * ## Example
 *
 * ```php
 * #[ImportField(name: 'email', header: 'Email', required: true, unique: true)]
 * #[ImportField(name: 'first_name', header: 'First name')]
 * #[ImportField(name: 'team_id', header: 'Team', lookup: 'team.name')]
 * final class Athlete extends Model {}
 * ```
 *
 * @category Transfer
 *
 * @since    0.1.0
 */
#[Attribute(Attribute::TARGET_CLASS | Attribute::IS_REPEATABLE)]
final readonly class ImportField
{
    /**
     * @param  string        $name        Column key on the model.
     * @param  string|null   $header      Human-readable header the template writer uses.
     * @param  bool          $required    Whether the column must be present + non-null.
     * @param  bool          $unique      Whether the value is unique inside the tenant.
     * @param  string|null   $lookup      Dotted lookup path (e.g. `team.name`) for FK resolution.
     * @param  string|null   $lookupBy    Column on the lookup model to match against (default `name`).
     * @param  list<string>  $rules       Extra Laravel validation rules.
     * @param  string|null   $cast        Explicit cast class-string when the model's cast map isn't enough.
     * @param  string|null   $example     Example value for the template + docs.
     * @param  bool          $sensitive   Redact from log / error messages.
     */
    public function __construct(
        public string $name,
        public ?string $header = null,
        public bool $required = false,
        public bool $unique = false,
        public ?string $lookup = null,
        public ?string $lookupBy = null,
        public array $rules = [],
        public ?string $cast = null,
        public ?string $example = null,
        public bool $sensitive = false,
    ) {
    }
}
