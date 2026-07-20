<?php

declare(strict_types=1);

namespace Academorix\Forms\Contracts\Services;

use Academorix\Forms\Data\FormValidationResultData;
use Academorix\Forms\Models\FormVersion;
use Academorix\Forms\Services\FormValidator;
use Illuminate\Container\Attributes\Bind;

/**
 * Answer validator for a submitted form payload.
 *
 * Every completed submission runs through this service before the
 * `FormSubmissionCompleted` event fires. The validator composes:
 *
 *  - **Type rules**  — Laravel rule strings the FieldTypeRegistry
 *    ships with each field type.
 *  - **Field rules** — per-field overrides authored on the
 *    FormVersion (e.g. `required`, `max:60`, `in:red,green,blue`).
 *  - **Conditional presence** — a field is required only when its
 *    `visible_when` expression evaluates truthy against earlier
 *    answers (the form runtime handles branching UI; this service
 *    is the server-side truth).
 *
 * On failure the validator returns a rich result (which fields
 * failed, which messages, which visible-when was falsey so
 * expected-missing) instead of throwing — the caller decides
 * whether to fire `FormSubmissionValidationFailed` or bubble a 422.
 *
 * Concrete: {@see FormValidator}.
 *
 * @category Forms
 *
 * @since    0.1.0
 */
#[Bind(FormValidator::class)]
interface FormValidatorInterface
{
    /**
     * Validate a submission's answers against its FormVersion.
     *
     * @param  FormVersion            $version  The immutable version the
     *                                          submission is bound to.
     * @param  array<string, mixed>   $answers  Field key -> answer value.
     */
    public function validate(FormVersion $version, array $answers): FormValidationResultData;
}
