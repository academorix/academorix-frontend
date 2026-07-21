<?php

declare(strict_types=1);

namespace Stackra\Forms\Services;

use Stackra\Forms\Contracts\Data\FormVersionInterface;
use Stackra\Forms\Contracts\Services\FieldTypeRegistryInterface;
use Stackra\Forms\Contracts\Services\FormValidatorInterface;
use Stackra\Forms\Data\FieldTypeDefinitionData;
use Stackra\Forms\Data\FormValidationResultData;
use Stackra\Forms\Models\FormVersion;
use Illuminate\Container\Attributes\Log;
use Illuminate\Container\Attributes\Scoped;
use Illuminate\Contracts\Validation\Factory as ValidatorFactory;
use Psr\Log\LoggerInterface;

/**
 * Composes per-field-type rules + per-field overrides + conditional
 * visibility into a single Laravel validator invocation.
 *
 * Algorithm:
 *  1. Read the FormVersion's `fields` payload — the array of field
 *     definitions frozen at publish time.
 *  2. For each field, evaluate `visible_when` against the caller's
 *     answers so far. Falsey -> the field is skipped (not required,
 *     not validated).
 *  3. Merge the field type's `baseRules` (from FieldTypeRegistry)
 *     with the field's own `rules` overrides. `required` /
 *     `sometimes` gates come from the field-level shape.
 *  4. Hand the merged rules to Laravel's Validator factory. Return
 *     the pass/fail + error map.
 *
 * Fail-open on unknown field types is a security posture violation
 * (unvalidated writes leak into `form_submissions.answers`) — so we
 * emit an explicit error entry keyed on the field with a
 * `forms.unknown_field_type` message and fail the submission.
 *
 * `#[Scoped]` — reads active request state via injected validator.
 *
 * @category Forms
 *
 * @since    0.1.0
 */
#[Scoped]
final class FormValidator implements FormValidatorInterface
{
    public function __construct(
        private readonly FieldTypeRegistryInterface $fieldTypes,
        private readonly ValidatorFactory $validators,
        #[Log('forms')] private readonly LoggerInterface $log,
    ) {
    }

    /**
     * {@inheritDoc}
     */
    public function validate(FormVersion $version, array $answers): FormValidationResultData
    {
        /** @var array<int, array<string, mixed>> $fields */
        $fields = (array) $version->getAttribute(FormVersionInterface::ATTR_FIELDS);

        $rules = [];
        $messages = [];
        $skipped = [];
        $unknownFieldErrors = [];

        foreach ($fields as $field) {
            $key = (string) ($field['key'] ?? '');
            if ($key === '') {
                continue;
            }

            // 1. Conditional visibility. Falsey `visible_when` means
            //    the field was hidden — no answer expected. Absent
            //    `visible_when` means always visible.
            if (! $this->isVisible($field, $answers)) {
                $skipped[] = $key;
                continue;
            }

            // 2. Unknown field type — fail-closed with an explicit
            //    error entry (never silently accept the answer).
            $typeName = (string) ($field['type'] ?? '');
            $definition = $this->fieldTypes->get($typeName);
            if ($definition === null) {
                $this->log->warning('form validator received unknown field type', [
                    'field'       => $key,
                    'type'        => $typeName,
                    'version_id'  => $version->getKey(),
                ]);
                $unknownFieldErrors[$key] = [
                    "Field `{$key}` uses unknown type `{$typeName}`.",
                ];
                continue;
            }

            // 3. Merge base type rules with field-level overrides.
            $rules[$key] = $this->composeRules($field, $definition);

            // 4. Custom messages authored on the field.
            /** @var array<string, string> $fieldMessages */
            $fieldMessages = (array) ($field['messages'] ?? []);
            foreach ($fieldMessages as $ruleName => $message) {
                $messages["{$key}.{$ruleName}"] = (string) $message;
            }
        }

        $validator = $this->validators->make($answers, $rules, $messages);

        if ($unknownFieldErrors === [] && $validator->passes()) {
            return new FormValidationResultData(
                passed: true,
                errors: [],
                skipped: array_values(array_unique($skipped)),
            );
        }

        /** @var array<string, list<string>> $laravelErrors */
        $laravelErrors = $validator->errors()->messages();

        return new FormValidationResultData(
            passed: false,
            errors: array_merge($laravelErrors, $unknownFieldErrors),
            skipped: array_values(array_unique($skipped)),
        );
    }

    /**
     * Evaluate a field's `visible_when` clause. Supports the two
     * shapes the FE authoring surface commits: (a) omitted / null =
     * always visible; (b) an object `{field, operator, value}`
     * comparing an earlier answer against a scalar.
     *
     * @param  array<string, mixed>  $field
     * @param  array<string, mixed>  $answers
     */
    private function isVisible(array $field, array $answers): bool
    {
        if (! isset($field['visible_when']) || $field['visible_when'] === null) {
            return true;
        }
        /** @var array<string, mixed> $when */
        $when = (array) $field['visible_when'];
        $referenceKey = (string) ($when['field'] ?? '');
        $operator = (string) ($when['operator'] ?? '==');
        $expected = $when['value'] ?? null;
        $actual = $answers[$referenceKey] ?? null;

        return match ($operator) {
            '=='       => $actual == $expected,       // phpcs:ignore
            '==='      => $actual === $expected,
            '!='       => $actual != $expected,       // phpcs:ignore
            '!=='      => $actual !== $expected,
            'in'       => is_array($expected) && in_array($actual, $expected, true),
            'notin'    => ! (is_array($expected) && in_array($actual, $expected, true)),
            'truthy'   => (bool) $actual,
            'falsey'   => ! (bool) $actual,
            default    => true,   // Unknown operator — fail-open visibility (never hide erroneously).
        };
    }

    /**
     * Merge the field type's base rules with per-field overrides.
     *
     * @param  array<string, mixed>  $field
     * @return list<string>
     */
    private function composeRules(array $field, FieldTypeDefinitionData $definition): array
    {
        $rules = $definition->baseRules;
        if (($field['required'] ?? false) === true) {
            array_unshift($rules, 'required');
        } else {
            array_unshift($rules, 'sometimes', 'nullable');
        }
        /** @var list<string> $override */
        $override = (array) ($field['rules'] ?? []);
        foreach ($override as $rule) {
            if (is_string($rule) && ! in_array($rule, $rules, true)) {
                $rules[] = $rule;
            }
        }

        return array_values($rules);
    }
}
