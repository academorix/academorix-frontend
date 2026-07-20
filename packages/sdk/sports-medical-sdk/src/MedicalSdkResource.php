<?php

declare(strict_types=1);

namespace Academorix\SportsMedicalSdk;

use Academorix\ApiSdk\Attributes\AsSdkResource;
use Academorix\ApiSdk\Resources\BaseSdkResource;

/**
 * Top-level SDK Resource for the `medical` module.
 *
 * Registered under `#[AsSdkResource(name: 'medical', service: 'sports')]`
 * so the Sports service umbrella auto-discovers it at boot
 * and consumers dispatch every call via `$sdk->medical()->...`.
 *
 * ## Peer Resources
 *
 * - AllergiesResource — peer resource for `allergies`.
 * - InjuriesResource — peer resource for `injuries`.
 * - MedicalClearancesResource — peer resource for `medical-clearances`.
 * - MedicalRecordsResource — peer resource for `medical-records`.
 * - MedicationsResource — peer resource for `medications`.
 * - TreatmentsResource — peer resource for `treatments`.
 *
 * @category MedicalSdk
 *
 * @since    0.1.0
 */
#[AsSdkResource(name: 'medical', service: 'sports')]
final class MedicalSdkResource extends BaseSdkResource
{
    private ?Resources\AllergiesResource $allergies = null;
    private ?Resources\InjuriesResource $injuries = null;
    private ?Resources\MedicalClearancesResource $medicalClearances = null;
    private ?Resources\MedicalRecordsResource $medicalRecords = null;
    private ?Resources\MedicationsResource $medications = null;
    private ?Resources\TreatmentsResource $treatments = null;

    /**
     * Access Allergies peer Resource.
     */
    public function allergies(): Resources\AllergiesResource
    {
        return $this->allergies ??= new Resources\AllergiesResource($this->connector);
    }

    /**
     * Access Injuries peer Resource.
     */
    public function injuries(): Resources\InjuriesResource
    {
        return $this->injuries ??= new Resources\InjuriesResource($this->connector);
    }

    /**
     * Access MedicalClearances peer Resource.
     */
    public function medicalClearances(): Resources\MedicalClearancesResource
    {
        return $this->medicalClearances ??= new Resources\MedicalClearancesResource($this->connector);
    }

    /**
     * Access MedicalRecords peer Resource.
     */
    public function medicalRecords(): Resources\MedicalRecordsResource
    {
        return $this->medicalRecords ??= new Resources\MedicalRecordsResource($this->connector);
    }

    /**
     * Access Medications peer Resource.
     */
    public function medications(): Resources\MedicationsResource
    {
        return $this->medications ??= new Resources\MedicationsResource($this->connector);
    }

    /**
     * Access Treatments peer Resource.
     */
    public function treatments(): Resources\TreatmentsResource
    {
        return $this->treatments ??= new Resources\TreatmentsResource($this->connector);
    }
}
