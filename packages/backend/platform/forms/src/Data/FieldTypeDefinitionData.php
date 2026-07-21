<?php

declare(strict_types=1);

namespace Stackra\Forms\Data;

use Spatie\LaravelData\Attributes\MapOutputName;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Metadata describing one registered form field type.
 *
 * Emitted by
 * {@see \Stackra\Forms\Services\FieldTypeRegistry::get} and
 * consumed by the FormValidator (validation rules), the
 * FormRenderer (SDUI widget mapping), and the AnswerCipher
 * (sensitivity flag).
 *
 * @category Forms
 *
 * @since    0.1.0
 */
#[MapOutputName(SnakeCaseMapper::class)]
final class FieldTypeDefinitionData extends Data
{
    /**
     * @param  string        $type            Machine identifier — `text`, `number`, `athlete_data`, ...
     * @param  string        $label           Human-readable name for admin surfaces.
     * @param  string        $control         Frontend widget hint (`text`, `select`, `date`, `file`, ...).
     * @param  list<string>  $baseRules       Laravel rule strings applied to every instance.
     * @param  bool          $sensitive       When true, AnswerCipher encrypts the value at rest.
     * @param  bool          $composite       When true, the value is a nested map (multiple sub-fields).
     * @param  bool          $repeatable      When true, the value is an array of the composite shape.
     */
    public function __construct(
        public string $type,
        public string $label,
        public string $control,
        public array $baseRules,
        public bool $sensitive = false,
        public bool $composite = false,
        public bool $repeatable = false,
    ) {
    }
}
