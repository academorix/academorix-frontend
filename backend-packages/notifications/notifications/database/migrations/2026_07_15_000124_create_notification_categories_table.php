<?php

declare(strict_types=1);

use Academorix\Notifications\Contracts\Data\NotificationCategoryInterface;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Create the `notification_categories` table.
 *
 * Module-fed category registry. `tenant_id` is nullable — NULL rows
 * are platform defaults; tenant overrides use the same slug with a
 * tenant_id set.
 */
return new class() extends Migration
{
    public function up(): void
    {
        Schema::create(NotificationCategoryInterface::TABLE, function (Blueprint $table): void {
            // Primary key — prefixed ULID `cat_<26 chars>`.
            $table->string(NotificationCategoryInterface::ATTR_ID, 64)->primary();

            // Nullable tenant scope — NULL = platform default.
            $table->string(NotificationCategoryInterface::ATTR_TENANT_ID, 64)->nullable();

            // Identifying columns.
            $table->string(NotificationCategoryInterface::ATTR_SLUG, 128);
            $table->string(NotificationCategoryInterface::ATTR_DISPLAY_NAME, 191);
            $table->text(NotificationCategoryInterface::ATTR_DESCRIPTION)->nullable();
            $table->string(NotificationCategoryInterface::ATTR_OWNING_MODULE, 128);

            // Defaults.
            $table->jsonb(NotificationCategoryInterface::ATTR_DEFAULT_CHANNELS)->nullable();
            $table->string(NotificationCategoryInterface::ATTR_PRIORITY, 32)->default('product');
            $table->string(NotificationCategoryInterface::ATTR_CONSENT_TIER, 32)->default('product_opt_out');
            $table->boolean(NotificationCategoryInterface::ATTR_OPT_OUT_ALLOWED)->default(true);
            $table->boolean(NotificationCategoryInterface::ATTR_IS_SYSTEM)->default(false);

            // Free-form metadata.
            $table->jsonb(NotificationCategoryInterface::ATTR_METADATA)->nullable();

            // Userstamps + timestamps + soft delete.
            $table->uuid(NotificationCategoryInterface::ATTR_CREATED_BY)->nullable();
            $table->uuid(NotificationCategoryInterface::ATTR_UPDATED_BY)->nullable();
            $table->uuid(NotificationCategoryInterface::ATTR_DELETED_BY)->nullable();
            $table->softDeletesTz();
            $table->timestampsTz();

            // ── Indexes ───────────────────────────────────────────

            // Uniqueness — one row per (tenant, slug); NULL tenant
            // rows are platform defaults. A tenant override coexists
            // with the platform default via the different tenant_id.
            $table->unique(
                [
                    NotificationCategoryInterface::ATTR_TENANT_ID,
                    NotificationCategoryInterface::ATTR_SLUG,
                ],
                'notification_categories_tenant_slug_unique',
            );

            $table->index(
                NotificationCategoryInterface::ATTR_OWNING_MODULE,
                'notification_categories_owning_module_index',
            );
        });
    }

    public function down(): void
    {
        Schema::dropIfExists(NotificationCategoryInterface::TABLE);
    }
};
