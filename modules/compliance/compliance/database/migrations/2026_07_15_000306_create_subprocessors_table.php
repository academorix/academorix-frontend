<?php

/**
 * @file modules/compliance/compliance/database/migrations/2026_07_15_000306_create_subprocessors_table.php
 *
 * @description
 * Create the `subprocessors` table. Platform-level registry.
 */

declare(strict_types=1);

use Academorix\Compliance\Contracts\Data\SubprocessorInterface;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class() extends Migration
{
    public function up(): void
    {
        Schema::create(SubprocessorInterface::TABLE, function (Blueprint $table): void {
            $table->string(SubprocessorInterface::ATTR_ID, 64)->primary();

            $table->string(SubprocessorInterface::ATTR_NAME, 191);
            $table->string(SubprocessorInterface::ATTR_ROLE, 32);
            $table->text(SubprocessorInterface::ATTR_PURPOSE);
            $table->jsonb(SubprocessorInterface::ATTR_DATA_CLASSES)->default('[]');
            $table->string(SubprocessorInterface::ATTR_LOCATION, 128);
            $table->string(SubprocessorInterface::ATTR_LEGAL_BASIS, 64)->default('contract');
            $table->string(SubprocessorInterface::ATTR_DPA_URL, 500)->nullable();
            $table->string(SubprocessorInterface::ATTR_WEBSITE_URL, 500)->nullable();

            $table->timestampTz(SubprocessorInterface::ATTR_ACTIVE_FROM);
            $table->timestampTz(SubprocessorInterface::ATTR_ACTIVE_UNTIL)->nullable();
            $table->integer(SubprocessorInterface::ATTR_VERSION)->default(1);
            $table->string(SubprocessorInterface::ATTR_LAST_UPDATED_BY_USER_ID, 64)->nullable();
            $table->boolean(SubprocessorInterface::ATTR_IS_SYSTEM)->default(false);

            $table->jsonb(SubprocessorInterface::ATTR_METADATA)->nullable();

            $table->uuid(SubprocessorInterface::ATTR_CREATED_BY)->nullable();
            $table->uuid(SubprocessorInterface::ATTR_UPDATED_BY)->nullable();
            $table->uuid(SubprocessorInterface::ATTR_DELETED_BY)->nullable();
            $table->softDeletesTz();
            $table->timestampsTz();

            $table->index(
                [SubprocessorInterface::ATTR_ROLE],
                'subprocessors_role_index',
            );

            $table->index(
                [SubprocessorInterface::ATTR_NAME],
                'subprocessors_name_index',
            );
        });
    }

    public function down(): void
    {
        Schema::dropIfExists(SubprocessorInterface::TABLE);
    }
};
