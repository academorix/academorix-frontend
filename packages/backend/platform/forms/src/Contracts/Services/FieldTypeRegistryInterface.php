<?php

declare(strict_types=1);

namespace Academorix\Forms\Contracts\Services;

use Academorix\Forms\Data\FieldTypeDefinitionData;
use Academorix\Forms\Services\FieldTypeRegistry;
use Illuminate\Container\Attributes\Bind;

/**
 * Closed-set registry of field types a form can compose.
 *
 * Every field on a form version references a `type` string that
 * lands here. The registry answers:
 *  - "does this type exist?"       (validators reject unknown types)
 *  - "what does it validate to?"   (Laravel rule strings per field)
 *  - "how should the UI render it?" (control widget hint for the SDUI layer)
 *  - "is the value sensitive?"     (drives AnswerCipher encryption)
 *  - "is it a sports-native type?"  (athlete_data / guardian_pair /
 *    consent_bundle / medical_upload have composite validation rules
 *    the platform ships out of the box).
 *
 * Concrete: {@see FieldTypeRegistry}.
 *
 * @category Forms
 *
 * @since    0.1.0
 */
#[Bind(FieldTypeRegistry::class)]
interface FieldTypeRegistryInterface
{
    /**
     * Return the definition for a field type, or null when unknown.
     */
    public function get(string $type): ?FieldTypeDefinitionData;

    /**
     * Return every registered field type.
     *
     * @return array<string, FieldTypeDefinitionData>
     */
    public function all(): array;

    /**
     * True when the type is registered.
     */
    public function has(string $type): bool;
}
