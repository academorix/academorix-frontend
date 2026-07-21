<?php

declare(strict_types=1);

namespace Stackra\Localization\Enums;

use Stackra\Enum\Attributes\Description;
use Stackra\Enum\Attributes\Label;
use Stackra\Enum\Attributes\Meta;
use Stackra\Enum\Enum;

/**
 * Machine-translation driver identifiers registered with
 * {@see \Stackra\Localization\Services\TranslatorDriverManager}.
 *
 * The backing string is the key `TenantLocale.auto_translate_driver`
 * stores AND the config key inside `config('localization.drivers.*')`.
 *
 * ## Cases
 *
 *  * {@see self::OpenAi}          — LLM-based, context-aware, best for UI copy.
 *  * {@see self::Google}          — broad coverage, cheapest at scale.
 *  * {@see self::Deepl}           — highest quality on European languages.
 *  * {@see self::AwsTranslate}    — AWS-native.
 *  * {@see self::AzureTranslator} — Azure-native with custom-terminology support.
 *  * {@see self::NullDriver}      — no-op for tests + fallback.
 *
 * @category Localization
 *
 * @since    0.1.0
 */
#[Meta([Label::class, Description::class])]
enum TranslatorDriverName: string
{
    use Enum;

    #[Label('OpenAI')]
    #[Description('LLM-based translation via openai-php/laravel. Best for UI copy + domain-specific terminology.')]
    case OpenAi = 'openai';

    #[Label('Google Cloud Translation')]
    #[Description('Neural machine translation via google/cloud-translate. Broadest language coverage.')]
    case Google = 'google';

    #[Label('DeepL')]
    #[Description('European-language-focused via deeplcom/deepl-php. Highest quality on EU pairs.')]
    case Deepl = 'deepl';

    #[Label('AWS Translate')]
    #[Description('AWS-native translation via aws/aws-sdk-php.')]
    case AwsTranslate = 'aws-translate';

    #[Label('Azure Translator')]
    #[Description('Azure Translator REST API with region routing + custom-terminology support.')]
    case AzureTranslator = 'azure-translator';

    #[Label('Null (No-op)')]
    #[Description('Returns the source string unchanged. Used in tests + as a fallback when auto-translate is off.')]
    case NullDriver = 'null';
}
