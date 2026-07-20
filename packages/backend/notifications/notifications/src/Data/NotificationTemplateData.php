<?php

declare(strict_types=1);

namespace Academorix\Notifications\Data;

use Academorix\Notifications\Contracts\Data\NotificationTemplateInterface;
use Academorix\Notifications\Enums\NotificationChannel;
use Academorix\Notifications\Enums\TemplateState;
use Academorix\Notifications\Models\NotificationTemplate;
use Spatie\LaravelData\Attributes\MapOutputName;
use Spatie\LaravelData\Attributes\WithCast;
use Spatie\LaravelData\Casts\DateTimeInterfaceCast;
use Spatie\LaravelData\Data;
use Spatie\LaravelData\Mappers\SnakeCaseMapper;

/**
 * Wire-visible output DTO for {@see NotificationTemplate}.
 *
 * @category Notifications
 *
 * @since    0.1.0
 */
#[MapOutputName(SnakeCaseMapper::class)]
final class NotificationTemplateData extends Data
{
    /**
     * @param  string                    $id                   `tpl_<ulid>`.
     * @param  string|null               $tenantId             Owning tenant (null = platform default).
     * @param  string                    $key                  Template key.
     * @param  string                    $categorySlug         Owning category slug.
     * @param  NotificationChannel       $channel              Delivery channel.
     * @param  string                    $locale               Locale (ISO 639-1).
     * @param  int                       $version              Version number.
     * @param  TemplateState             $state                Lifecycle state.
     * @param  bool                      $isSystem             Whether this is a platform default.
     * @param  string|null               $subjectTemplate      Subject line template.
     * @param  string|null               $bodyRenderedHtml     Pre-rendered HTML.
     * @param  \DateTimeInterface        $createdAt            Row creation.
     * @param  \DateTimeInterface        $updatedAt            Last mutation.
     * @param  \DateTimeInterface|null   $publishedAt          When published.
     */
    public function __construct(
        public string $id,
        public ?string $tenantId,
        public string $key,
        public string $categorySlug,
        public NotificationChannel $channel,
        public string $locale,
        public int $version,
        public TemplateState $state,
        public bool $isSystem,
        public ?string $subjectTemplate,
        public ?string $bodyRenderedHtml,
        #[WithCast(DateTimeInterfaceCast::class)]
        public \DateTimeInterface $createdAt,
        #[WithCast(DateTimeInterfaceCast::class)]
        public \DateTimeInterface $updatedAt,
        #[WithCast(DateTimeInterfaceCast::class)]
        public ?\DateTimeInterface $publishedAt = null,
    ) {
    }

    /**
     * Build the DTO from a NotificationTemplate model.
     */
    public static function fromModel(NotificationTemplate $template): self
    {
        $channelValue = $template->{NotificationTemplateInterface::ATTR_CHANNEL};
        $channel = $channelValue instanceof NotificationChannel
            ? $channelValue
            : (NotificationChannel::tryFrom((string) $channelValue) ?? NotificationChannel::Mail);

        $stateValue = $template->{NotificationTemplateInterface::ATTR_STATE};
        $state = $stateValue instanceof TemplateState
            ? $stateValue
            : (TemplateState::tryFrom((string) $stateValue) ?? TemplateState::Draft);

        return new self(
            id: (string) $template->getKey(),
            tenantId: $template->{NotificationTemplateInterface::ATTR_TENANT_ID},
            key: (string) $template->{NotificationTemplateInterface::ATTR_KEY},
            categorySlug: (string) $template->{NotificationTemplateInterface::ATTR_CATEGORY_SLUG},
            channel: $channel,
            locale: (string) $template->{NotificationTemplateInterface::ATTR_LOCALE},
            version: (int) $template->{NotificationTemplateInterface::ATTR_VERSION},
            state: $state,
            isSystem: (bool) $template->{NotificationTemplateInterface::ATTR_IS_SYSTEM},
            subjectTemplate: $template->{NotificationTemplateInterface::ATTR_SUBJECT_TEMPLATE},
            bodyRenderedHtml: $template->{NotificationTemplateInterface::ATTR_BODY_RENDERED_HTML},
            createdAt: $template->{NotificationTemplateInterface::ATTR_CREATED_AT},
            updatedAt: $template->{NotificationTemplateInterface::ATTR_UPDATED_AT},
            publishedAt: $template->{NotificationTemplateInterface::ATTR_PUBLISHED_AT},
        );
    }
}
