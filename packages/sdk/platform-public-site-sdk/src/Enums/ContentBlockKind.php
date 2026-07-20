<?php

declare(strict_types=1);

namespace Academorix\PlatformPublicSiteSdk\Enums;

/**
 * Wire-visible backed enum for `content-block.kind`.
 *
 * Backing type: string. Values are the exact snake_case tokens
 * the server emits.
 *
 * @category PublicSiteSdk
 *
 * @since    0.1.0
 */
enum ContentBlockKind: string
{
    case Hero = 'hero';
    case Text = 'text';
    case Gallery = 'gallery';
    case Cta = 'cta';
    case Testimonials = 'testimonials';
    case ResultsWidget = 'results_widget';
    case RosterWidget = 'roster_widget';
    case RegistrationForm = 'registration_form';
}
