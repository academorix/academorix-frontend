<?php

declare(strict_types=1);

use Academorix\Notifications\Sms\Contracts\Data\SmsOptOutInterface;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Create the `sms_opt_outs` table.
 *
 * TCPA + CASL evidence-grade opt-out records. `tenant_id` is nullable so a
 * row with `tenant_id = NULL` is a platform-wide opt-out. `is_system` marks
 * platform-managed rows immutable from the tenant surface.
 */
return new class() extends Migration
{
    public function up(): void
    {
        Schema::create(SmsOptOutInterface::TABLE, function (Blueprint $table): void {
            // Prefixed ULID `sopt_<26 chars>`.
            $table->string(SmsOptOutInterface::ATTR_ID, 64)->primary();

            // Nullable — platform-wide opt-outs sit at tenant_id=NULL.
            $table->string(SmsOptOutInterface::ATTR_TENANT_ID, 64)->nullable();
            $table->foreign(SmsOptOutInterface::ATTR_TENANT_ID)
                ->references('id')
                ->on('tenants')
                ->cascadeOnUpdate()
                ->cascadeOnDelete();

            // Phone in E.164. On GDPR erasure this becomes a SHA-256 hex
            // hash of the E.164 value so the opt-out row survives as
            // regulatory evidence without the raw PII.
            $table->string(SmsOptOutInterface::ATTR_PHONE, 32);
            $table->string(SmsOptOutInterface::ATTR_PHONE_COUNTRY_CODE, 8);

            // Enum-string reason + optional inbound context.
            $table->string(SmsOptOutInterface::ATTR_REASON, 32);
            $table->string(SmsOptOutInterface::ATTR_PROVIDER, 32)->nullable();
            $table->string(SmsOptOutInterface::ATTR_SOURCE_DELIVERY_ID, 64)->nullable();
            $table->text(SmsOptOutInterface::ATTR_INBOUND_MESSAGE_BODY)->nullable();

            $table->boolean(SmsOptOutInterface::ATTR_IS_SYSTEM)->default(false);
            $table->timestampTz(SmsOptOutInterface::ATTR_OPTED_OUT_AT);
            $table->timestampTz(SmsOptOutInterface::ATTR_EXPIRES_AT)->nullable();

            $table->jsonb(SmsOptOutInterface::ATTR_METADATA)->nullable();

            $table->uuid(SmsOptOutInterface::ATTR_CREATED_BY)->nullable();
            $table->uuid(SmsOptOutInterface::ATTR_UPDATED_BY)->nullable();
            $table->uuid(SmsOptOutInterface::ATTR_DELETED_BY)->nullable();
            $table->softDeletesTz();
            $table->timestampsTz();

            // ── Indexes ───────────────────────────────────────────

            // Uniqueness — one active row per (tenant, phone). The composite
            // index tolerates soft-delete because the softDeletesTz column is
            // NOT in the key; a revoked row can coexist with a new one for
            // the same phone.
            $table->unique(
                [SmsOptOutInterface::ATTR_TENANT_ID, SmsOptOutInterface::ATTR_PHONE],
                'sms_opt_outs_tenant_phone_unique',
            );

            // Fast lookup during dispatch — "is this phone blocked for this
            // tenant?"
            $table->index(
                [SmsOptOutInterface::ATTR_TENANT_ID, SmsOptOutInterface::ATTR_PHONE],
                'sms_opt_outs_tenant_phone_index',
            );

            // Country-scoped cost aggregation.
            $table->index(
                [SmsOptOutInterface::ATTR_PHONE_COUNTRY_CODE, SmsOptOutInterface::ATTR_CREATED_AT],
                'sms_opt_outs_country_created_at_index',
            );

            // Reason filter for admin views.
            $table->index(
                SmsOptOutInterface::ATTR_REASON,
                'sms_opt_outs_reason_index',
            );
        });
    }

    public function down(): void
    {
        Schema::dropIfExists(SmsOptOutInterface::TABLE);
    }
};
