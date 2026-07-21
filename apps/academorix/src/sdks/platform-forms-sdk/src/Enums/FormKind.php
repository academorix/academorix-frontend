<?php

declare(strict_types=1);

namespace Stackra\PlatformFormsSdk\Enums;

/**
 * Wire-visible backed enum for `form.kind`.
 *
 * Backing type: string. Values are the exact snake_case tokens
 * the server emits.
 *
 * @category FormsSdk
 *
 * @since    0.1.0
 */
enum FormKind: string
{
    case SeasonRegistration = 'season_registration';
    case WaiverUpdate = 'waiver_update';
    case MedicalQuestionnaire = 'medical_questionnaire';
    case FeedbackSurvey = 'feedback_survey';
    case TrialRequest = 'trial_request';
    case Custom = 'custom';
}
