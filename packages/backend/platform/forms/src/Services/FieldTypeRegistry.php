<?php

declare(strict_types=1);

namespace Stackra\Forms\Services;

use Stackra\Forms\Contracts\Services\FieldTypeRegistryInterface;
use Stackra\Forms\Data\FieldTypeDefinitionData;
use Illuminate\Container\Attributes\Singleton;

/**
 * Ships the canonical + academy-specific field type set.
 *
 * The closed vocabulary is:
 *
 * **Generic**
 *  - `text`        — single-line free text (max 255 chars by default).
 *  - `textarea`    — multi-line free text (max 4000 chars).
 *  - `number`      — numeric input (integer or decimal).
 *  - `date`        — ISO Y-m-d.
 *  - `datetime`    — ISO 8601.
 *  - `email`       — RFC 5322 lax check.
 *  - `phone`       — E.164 lax check.
 *  - `select`      — single-select from an option list.
 *  - `multiselect` — multi-select from an option list.
 *  - `toggle`      — boolean.
 *  - `file`        — single file upload (any MIME).
 *  - `image`       — single image upload.
 *  - `signature`   — SVG signature capture (sensitive).
 *  - `location`    — GeoJSON point.
 *
 * **Sports-native**
 *  - `athlete_data`     — composite: name / dob / gender / height / weight.
 *  - `guardian_pair`    — composite: primary_guardian + secondary_guardian (repeatable).
 *  - `consent_bundle`   — composite: list of {consent_key, agreed_bool, agreed_at, ip}.
 *  - `medical_upload`   — sensitive file + optional expiry date (medical clearance, etc.).
 *  - `waiver_signature` — sensitive: signature + waiver_version + signed_at.
 *
 * `#[Singleton]` — pure lookup, no request state. Register-once
 * process-lifetime table.
 *
 * @category Forms
 *
 * @since    0.1.0
 */
#[Singleton]
final class FieldTypeRegistry implements FieldTypeRegistryInterface
{
    /** @var array<string, FieldTypeDefinitionData> */
    private array $types;

    public function __construct()
    {
        $this->types = [
            // ── Generic types ─────────────────────────────────
            'text' => new FieldTypeDefinitionData(
                type: 'text',
                label: 'Text',
                control: 'text',
                baseRules: ['string', 'max:255'],
            ),
            'textarea' => new FieldTypeDefinitionData(
                type: 'textarea',
                label: 'Long text',
                control: 'textarea',
                baseRules: ['string', 'max:4000'],
            ),
            'number' => new FieldTypeDefinitionData(
                type: 'number',
                label: 'Number',
                control: 'number',
                baseRules: ['numeric'],
            ),
            'date' => new FieldTypeDefinitionData(
                type: 'date',
                label: 'Date',
                control: 'date',
                baseRules: ['date_format:Y-m-d'],
            ),
            'datetime' => new FieldTypeDefinitionData(
                type: 'datetime',
                label: 'Date and time',
                control: 'datetime',
                baseRules: ['date'],
            ),
            'email' => new FieldTypeDefinitionData(
                type: 'email',
                label: 'Email address',
                control: 'email',
                baseRules: ['email:rfc', 'max:254'],
            ),
            'phone' => new FieldTypeDefinitionData(
                type: 'phone',
                label: 'Phone number',
                control: 'text',
                // Lax E.164 — leading + optional, 6-15 digits.
                baseRules: ['string', 'regex:/^\+?[1-9]\d{5,14}$/'],
            ),
            'select' => new FieldTypeDefinitionData(
                type: 'select',
                label: 'Single choice',
                control: 'select',
                baseRules: ['string'],
            ),
            'multiselect' => new FieldTypeDefinitionData(
                type: 'multiselect',
                label: 'Multiple choice',
                control: 'multiselect',
                baseRules: ['array'],
                repeatable: true,
            ),
            'toggle' => new FieldTypeDefinitionData(
                type: 'toggle',
                label: 'Yes / No',
                control: 'toggle',
                baseRules: ['boolean'],
            ),
            'file' => new FieldTypeDefinitionData(
                type: 'file',
                label: 'File upload',
                control: 'file',
                // File-payload shape: {path: string, mime: string, size: int}
                baseRules: ['array', 'array:path,mime,size'],
                composite: true,
            ),
            'image' => new FieldTypeDefinitionData(
                type: 'image',
                label: 'Image upload',
                control: 'file',
                baseRules: ['array', 'array:path,mime,size,width,height'],
                composite: true,
            ),
            'signature' => new FieldTypeDefinitionData(
                type: 'signature',
                label: 'Signature',
                control: 'signature',
                // SVG string. Sensitive — encrypted at rest.
                baseRules: ['string', 'max:65535'],
                sensitive: true,
            ),
            'location' => new FieldTypeDefinitionData(
                type: 'location',
                label: 'Location',
                control: 'location',
                baseRules: ['array', 'array:lat,lng'],
                composite: true,
            ),

            // ── Sports-native types ───────────────────────────
            'athlete_data' => new FieldTypeDefinitionData(
                type: 'athlete_data',
                label: 'Athlete profile',
                control: 'athlete_data',
                // Nested shape validated in FormValidator per its
                // sub-fields (name / dob / gender / height / weight).
                baseRules: ['array', 'array:name,dob,gender,height_cm,weight_kg'],
                composite: true,
            ),
            'guardian_pair' => new FieldTypeDefinitionData(
                type: 'guardian_pair',
                label: 'Guardians',
                control: 'guardian_pair',
                // Two guardian entries (primary required, secondary optional).
                baseRules: ['array', 'array:primary,secondary'],
                composite: true,
                repeatable: false,
            ),
            'consent_bundle' => new FieldTypeDefinitionData(
                type: 'consent_bundle',
                label: 'Consent bundle',
                control: 'consent_bundle',
                // Array of consent entries — each `{key, agreed, agreed_at, ip}`.
                baseRules: ['array'],
                composite: true,
                repeatable: true,
            ),
            'medical_upload' => new FieldTypeDefinitionData(
                type: 'medical_upload',
                label: 'Medical document',
                control: 'file',
                baseRules: ['array', 'array:path,mime,size,expires_at'],
                sensitive: true,
                composite: true,
            ),
            'waiver_signature' => new FieldTypeDefinitionData(
                type: 'waiver_signature',
                label: 'Waiver signature',
                control: 'signature',
                baseRules: ['array', 'array:svg,waiver_version,signed_at'],
                sensitive: true,
                composite: true,
            ),
        ];
    }

    /**
     * {@inheritDoc}
     */
    public function get(string $type): ?FieldTypeDefinitionData
    {
        return $this->types[$type] ?? null;
    }

    /**
     * {@inheritDoc}
     */
    public function all(): array
    {
        return $this->types;
    }

    /**
     * {@inheritDoc}
     */
    public function has(string $type): bool
    {
        return isset($this->types[$type]);
    }
}
