<?php

/**
 * @file modules/compliance/compliance/database/migrations/2026_07_15_000300_create_consent_categories_table.php
 *
 * @description
 * Create the `consent_categories` table.
 *
 * Platform-default rows carry `tenant_id=NULL`; tenant overrides
 * carry a tenant_id. Composite index on `(tenant_id, key)` supports
 * the platform + override lookup.
 */

declare(strict_types=1);

use Academorix\Compliance\Contracts\Data\ConsentCategoryInterface;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class() extends Migration
{
    public function up(): void
    {
        Schema::create(ConsentCategoryInterface::TABLE, function (Blueprint $table): void {
            $table->string(ConsentCategoryInterface::ATTR_ID, 64)->primary();

            $table->string(ConsentCategoryInterface::ATTR_TENANT_ID, 64)->nullable();
            $table->string(ConsentCategoryInterface::ATTR_KEY, 100);
            $table->string(ConsentCategoryInterface::ATTR_LABEL, 200);
            $table->text(ConsentCategoryInterface::ATTR_DESCRIPTION)->nullable();

            $table->boolean(ConsentCategoryInterface::ATTR_REQUIRES_GUARDIAN)->default(false);
            $table->boolean(ConsentCategoryInterface::ATTR_IS_SYSTEM)->default(false);
            $table->boolean(ConsentCategoryInterface::ATTR_IS_WITHDRAWABLE)->default(true);

            $table->jsonb(ConsentCategoryInterface::ATTR_METADATA)->nullable();

            $table->uuid(ConsentCategoryInterface::ATTR_CREATED_BY)->nullable();
            $table->uuid(ConsentCategoryInterface::ATTR_UPDATED_BY)->nullable();
            $table->timestampsTz();

            $table->index(
                [ConsentCategoryInterface::ATTR_TENANT_ID, ConsentCategoryInterface::ATTR_KEY],
                'consent_categories_tenant_key_index',
            );
        });
    }

    public function down(): void
    {
        Schema::dropIfExists(ConsentCategoryInterface::TABLE);
    }
};
