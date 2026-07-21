<?php

declare(strict_types=1);

use Stackra\Notifications\Contracts\Data\NotificationTemplateInterface;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Create the `notification_templates` table.
 *
 * Versioned reusable template — one row per (key, channel, locale,
 * version). Platform defaults have `tenant_id = NULL, is_system = true`.
 */
return new class() extends Migration
{
    public function up(): void
    {
        Schema::create(NotificationTemplateInterface::TABLE, function (Blueprint $table): void {
            // Primary key — prefixed ULID `tpl_<26 chars>`.
            $table->string(NotificationTemplateInterface::ATTR_ID, 64)->primary();

            // Boundaries — nullable tenant_id lets platform defaults coexist.
            $table->string(NotificationTemplateInterface::ATTR_TENANT_ID, 64)->nullable();

            // Identifying tuple.
            $table->string(NotificationTemplateInterface::ATTR_KEY, 191);
            $table->string(NotificationTemplateInterface::ATTR_CATEGORY_SLUG, 128);
            $table->string(NotificationTemplateInterface::ATTR_CHANNEL, 32);
            $table->string(NotificationTemplateInterface::ATTR_LOCALE, 8);
            $table->integer(NotificationTemplateInterface::ATTR_VERSION)->default(1);

            // Lifecycle.
            $table->string(NotificationTemplateInterface::ATTR_STATE, 32)->default('draft');
            $table->boolean(NotificationTemplateInterface::ATTR_IS_SYSTEM)->default(false);

            // Body.
            $table->text(NotificationTemplateInterface::ATTR_SUBJECT_TEMPLATE)->nullable();
            $table->longText(NotificationTemplateInterface::ATTR_BODY_RENDERED_HTML)->nullable();
            $table->string(NotificationTemplateInterface::ATTR_PROVIDER_TEMPLATE_ID, 191)->nullable();
            $table->timestampTz(NotificationTemplateInterface::ATTR_PUBLISHED_AT)->nullable();

            // Free-form metadata.
            $table->jsonb(NotificationTemplateInterface::ATTR_METADATA)->nullable();

            // Userstamps + timestamps + soft delete.
            $table->uuid(NotificationTemplateInterface::ATTR_CREATED_BY)->nullable();
            $table->uuid(NotificationTemplateInterface::ATTR_UPDATED_BY)->nullable();
            $table->uuid(NotificationTemplateInterface::ATTR_DELETED_BY)->nullable();
            $table->softDeletesTz();
            $table->timestampsTz();

            // ── Indexes ───────────────────────────────────────────

            // Resolver hot path — deepest-wins on (tenant, key, channel, locale, version).
            $table->index(
                [
                    NotificationTemplateInterface::ATTR_TENANT_ID,
                    NotificationTemplateInterface::ATTR_KEY,
                    NotificationTemplateInterface::ATTR_CHANNEL,
                    NotificationTemplateInterface::ATTR_LOCALE,
                    NotificationTemplateInterface::ATTR_VERSION,
                ],
                'notification_templates_resolve_index',
            );

            $table->index(
                [
                    NotificationTemplateInterface::ATTR_STATE,
                    NotificationTemplateInterface::ATTR_IS_SYSTEM,
                ],
                'notification_templates_state_system_index',
            );
        });
    }

    public function down(): void
    {
        Schema::dropIfExists(NotificationTemplateInterface::TABLE);
    }
};
