<?php

/**
 * @file modules/platform/storage/database/migrations/2026_07_15_000062_create_signed_url_audits_table.php
 *
 * @description
 * Create the `signed_url_audits` table — append-only log of every
 * signed URL issued. Powers revocation + compliance reporting.
 */

declare(strict_types=1);

use Academorix\Storage\Contracts\Data\FileInterface;
use Academorix\Storage\Contracts\Data\SignedUrlAuditInterface;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class() extends Migration
{
    public function up(): void
    {
        Schema::create(SignedUrlAuditInterface::TABLE, function (Blueprint $table): void {
            $table->string(SignedUrlAuditInterface::ATTR_ID, 64)->primary();

            $table->string(SignedUrlAuditInterface::ATTR_FILE_ID, 64);
            $table->foreign(SignedUrlAuditInterface::ATTR_FILE_ID)
                ->references(FileInterface::ATTR_ID)
                ->on(FileInterface::TABLE)
                ->cascadeOnUpdate()
                ->cascadeOnDelete();

            $table->string(SignedUrlAuditInterface::ATTR_VARIANT_KEY, 64)->nullable();

            $table->string(SignedUrlAuditInterface::ATTR_TENANT_ID, 64);
            $table->foreign(SignedUrlAuditInterface::ATTR_TENANT_ID)
                ->references('id')
                ->on('tenants')
                ->cascadeOnUpdate()
                ->cascadeOnDelete();

            $table->string(SignedUrlAuditInterface::ATTR_ISSUED_TO_USER_ID, 64)->nullable();
            $table->string(SignedUrlAuditInterface::ATTR_ISSUED_BY_USER_ID, 64)->nullable();
            $table->string(SignedUrlAuditInterface::ATTR_ISSUED_BY_SERVICE, 128)->nullable();

            $table->string(SignedUrlAuditInterface::ATTR_PURPOSE, 24);
            $table->string(SignedUrlAuditInterface::ATTR_SIGNATURE_HASH, 64);
            $table->integer(SignedUrlAuditInterface::ATTR_TTL_SECONDS);

            $table->timestampTz(SignedUrlAuditInterface::ATTR_ISSUED_AT);
            $table->timestampTz(SignedUrlAuditInterface::ATTR_EXPIRES_AT);

            $table->string(SignedUrlAuditInterface::ATTR_IP_LOCK, 128)->nullable();
            $table->string(SignedUrlAuditInterface::ATTR_USER_LOCK, 64)->nullable();

            $table->boolean(SignedUrlAuditInterface::ATTR_ONE_TIME_USE)->default(false);
            $table->integer(SignedUrlAuditInterface::ATTR_HIT_COUNT)->default(0);
            $table->timestampTz(SignedUrlAuditInterface::ATTR_LAST_HIT_AT)->nullable();
            $table->timestampTz(SignedUrlAuditInterface::ATTR_REVOKED_AT)->nullable();
            $table->string(SignedUrlAuditInterface::ATTR_REVOKED_REASON, 128)->nullable();

            $table->jsonb(SignedUrlAuditInterface::ATTR_METADATA)->nullable();

            $table->uuid(SignedUrlAuditInterface::ATTR_CREATED_BY)->nullable();
            $table->uuid(SignedUrlAuditInterface::ATTR_UPDATED_BY)->nullable();
            $table->timestampsTz();

            // ── Indexes ───────────────────────────────────────────

            $table->unique(
                SignedUrlAuditInterface::ATTR_SIGNATURE_HASH,
                'signed_url_audits_signature_unique',
            );

            $table->index(
                [SignedUrlAuditInterface::ATTR_FILE_ID, SignedUrlAuditInterface::ATTR_EXPIRES_AT],
                'signed_url_audits_file_expires_idx',
            );

            $table->index(
                SignedUrlAuditInterface::ATTR_EXPIRES_AT,
                'signed_url_audits_expires_idx',
            );

            $table->index(
                [SignedUrlAuditInterface::ATTR_TENANT_ID, SignedUrlAuditInterface::ATTR_ISSUED_AT],
                'signed_url_audits_tenant_issued_idx',
            );

            $table->index(
                [SignedUrlAuditInterface::ATTR_ISSUED_TO_USER_ID, SignedUrlAuditInterface::ATTR_ISSUED_AT],
                'signed_url_audits_user_issued_idx',
            );
        });
    }

    public function down(): void
    {
        Schema::dropIfExists(SignedUrlAuditInterface::TABLE);
    }
};
