<?php

declare(strict_types=1);

namespace Stackra\Compliance\Models;

use Stackra\Compliance\Contracts\Data\SafeguardingIncidentInterface;
use Stackra\Compliance\Database\Factories\SafeguardingIncidentFactory;
use Stackra\Compliance\Enums\SafeguardingIncidentState;
use Stackra\Compliance\Enums\SafeguardingSeverity;
use Stackra\Compliance\Observers\SafeguardingIncidentObserver;
use Stackra\Compliance\Policies\SafeguardingIncidentPolicy;
use Stackra\Database\Concerns\HasMetadata;
use Stackra\Database\Concerns\HasPrefixedUlid;
use Stackra\Tenancy\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\ObservedBy;
use Illuminate\Database\Eloquent\Attributes\Table;
use Illuminate\Database\Eloquent\Attributes\UseFactory;
use Illuminate\Database\Eloquent\Attributes\UsePolicy;
use Illuminate\Database\Eloquent\Attributes\WithoutIncrementing;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Wildside\Userstamps\Traits\Userstamps;
use OwenIt\Auditing\Auditable;
use OwenIt\Auditing\Contracts\Auditable as AuditableContract;

/**
 * Eloquent model for a {@see SafeguardingIncidentInterface}.
 *
 * Minor-safeguarding report. Severity drives the escalation SLA;
 * `pending_external_referral` flag lets the platform-admin
 * dashboard surface critical cases needing human handoff.
 *
 * @category Compliance
 *
 * @since    0.1.0
 */
#[Table(
    name: SafeguardingIncidentInterface::TABLE,
    key: SafeguardingIncidentInterface::PRIMARY_KEY,
    keyType: SafeguardingIncidentInterface::KEY_TYPE,
)]
#[Fillable([
    SafeguardingIncidentInterface::ATTR_TENANT_ID,
    SafeguardingIncidentInterface::ATTR_SUBJECT_TYPE,
    SafeguardingIncidentInterface::ATTR_SUBJECT_ID,
    SafeguardingIncidentInterface::ATTR_SEVERITY,
    SafeguardingIncidentInterface::ATTR_STATE,
    SafeguardingIncidentInterface::ATTR_TITLE,
    SafeguardingIncidentInterface::ATTR_DESCRIPTION,
    SafeguardingIncidentInterface::ATTR_KEYWORDS,
    SafeguardingIncidentInterface::ATTR_REPORTED_BY_USER_ID,
    SafeguardingIncidentInterface::ATTR_ASSIGNED_TO_USER_ID,
    SafeguardingIncidentInterface::ATTR_REPORTED_AT,
    SafeguardingIncidentInterface::ATTR_ESCALATED_AT,
    SafeguardingIncidentInterface::ATTR_RESOLVED_AT,
    SafeguardingIncidentInterface::ATTR_ESCALATION_DEADLINE_AT,
    SafeguardingIncidentInterface::ATTR_PENDING_EXTERNAL_REFERRAL,
    SafeguardingIncidentInterface::ATTR_EXTERNAL_REFERRAL_REFERENCE,
    SafeguardingIncidentInterface::ATTR_METADATA,
])]
#[UseFactory(SafeguardingIncidentFactory::class)]
#[UsePolicy(SafeguardingIncidentPolicy::class)]
#[ObservedBy([SafeguardingIncidentObserver::class])]
#[WithoutIncrementing]
final class SafeguardingIncident extends Model implements AuditableContract, SafeguardingIncidentInterface
{
    use Auditable;
    use BelongsToTenant;
    use HasFactory;
    use HasMetadata;
    use HasPrefixedUlid;
    use SoftDeletes;
    use Userstamps;

    /**
     * Cast map — enums + booleans + datetimes + JSON coerced on
     * hydrate.
     *
     * @var array<string, string>
     */
    protected $casts = [
        SafeguardingIncidentInterface::ATTR_SEVERITY                  => SafeguardingSeverity::class,
        SafeguardingIncidentInterface::ATTR_STATE                     => SafeguardingIncidentState::class,
        SafeguardingIncidentInterface::ATTR_REPORTED_AT               => 'datetime',
        SafeguardingIncidentInterface::ATTR_ESCALATED_AT              => 'datetime',
        SafeguardingIncidentInterface::ATTR_RESOLVED_AT               => 'datetime',
        SafeguardingIncidentInterface::ATTR_ESCALATION_DEADLINE_AT    => 'datetime',
        SafeguardingIncidentInterface::ATTR_PENDING_EXTERNAL_REFERRAL => 'boolean',
        SafeguardingIncidentInterface::ATTR_KEYWORDS                  => 'array',
    ];
}
