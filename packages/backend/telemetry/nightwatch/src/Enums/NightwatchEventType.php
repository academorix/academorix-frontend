<?php

declare(strict_types=1);

/**
 * Nightwatch Event Type Enum.
 *
 * Defines the event types that Laravel Nightwatch captures during
 * application execution. Used by filters and redactors to target
 * specific event types for exclusion or data sanitization.
 *
 * Each case maps to a Nightwatch `reject*` or `redact*` method
 * on the `Laravel\Nightwatch\Facades\Nightwatch` facade.
 *
 * @category Enums
 *
 * @since    1.0.0
 *
 * @method static REQUEST()          Returns the REQUEST enum instance
 * @method static QUERY()            Returns the QUERY enum instance
 * @method static JOB()              Returns the JOB enum instance
 * @method static CACHE()            Returns the CACHE enum instance
 * @method static MAIL()             Returns the MAIL enum instance
 * @method static NOTIFICATION()     Returns the NOTIFICATION enum instance
 * @method static OUTGOING_REQUEST() Returns the OUTGOING_REQUEST enum instance
 * @method static EXCEPTION()        Returns the EXCEPTION enum instance
 * @method static COMMAND()          Returns the COMMAND enum instance
 */

namespace Academorix\Nightwatch\Enums;

use Academorix\Enum\Attributes\Description;
use Academorix\Enum\Attributes\Label;
use Academorix\Enum\Enum;

enum NightwatchEventType: string
{
    use Enum;

    // =========================================================================
    // Entry Points (Execution Contexts)
    // =========================================================================

    /**
     * HTTP Request event.
     *
     * Represents incoming HTTP requests handled by the application.
     * Supports both filtering (via sampling) and redaction of URLs,
     * IP addresses, headers, and payload data.
     *
     * @see \Laravel\Nightwatch\Facades\Nightwatch::redactRequests()
     */
    #[Label('Request')]
    #[Description('HTTP requests handled by the application. Supports redaction of URLs, IPs, headers, and payloads.')]
    case Request = 'request';

    /**
     * Artisan Command event.
     *
     * Represents CLI commands executed via `php artisan`.
     * Supports redaction of command arguments that may contain
     * sensitive data like passwords or tokens.
     *
     * @see \Laravel\Nightwatch\Facades\Nightwatch::redactCommands()
     */
    #[Label('Command')]
    #[Description('Artisan CLI commands. Supports redaction of command arguments containing sensitive data.')]
    case Command = 'command';

    // =========================================================================
    // Child Events (Captured Within Execution Contexts)
    // =========================================================================

    /**
     * Database Query event.
     *
     * Represents SQL queries executed through Laravel's query builder,
     * Eloquent ORM, or raw SQL. Captures the SQL statement, execution
     * time, and connection name. Bindings are intentionally NOT captured
     * by Nightwatch for security.
     *
     * @see \Laravel\Nightwatch\Facades\Nightwatch::rejectQueries()
     * @see \Laravel\Nightwatch\Facades\Nightwatch::redactQueries()
     */
    #[Label('Query')]
    #[Description('Database queries via query builder, Eloquent, or raw SQL. Supports filtering and SQL redaction.')]
    case Query = 'query';

    /**
     * Queued Job event.
     *
     * Represents jobs dispatched to Laravel's queue system.
     * Captures job class, queue name, and execution metrics.
     * Supports filtering to exclude low-priority or noisy jobs.
     *
     * @see \Laravel\Nightwatch\Facades\Nightwatch::rejectQueuedJobs()
     */
    #[Label('Job')]
    #[Description('Queued jobs dispatched via Laravel queue system. Supports filtering by job class.')]
    case Job = 'job';

    /**
     * Cache event.
     *
     * Represents interactions with the application cache including
     * get, put, forget, and flush operations. Supports filtering
     * by cache key patterns and redaction of key names.
     *
     * @see \Laravel\Nightwatch\Facades\Nightwatch::rejectCacheKeys()
     * @see \Laravel\Nightwatch\Facades\Nightwatch::rejectCacheEvents()
     * @see \Laravel\Nightwatch\Facades\Nightwatch::redactCacheEvents()
     */
    #[Label('Cache')]
    #[Description('Cache interactions (get, put, forget, flush). Supports filtering by key pattern and key redaction.')]
    case Cache = 'cache';

    /**
     * Mail event.
     *
     * Represents mail sent from the application via Laravel's
     * mail system. Supports filtering by subject or recipient
     * and redaction of mail subjects.
     *
     * @see \Laravel\Nightwatch\Facades\Nightwatch::rejectMail()
     * @see \Laravel\Nightwatch\Facades\Nightwatch::redactMail()
     */
    #[Label('Mail')]
    #[Description('Mail sent from the application. Supports filtering by subject/recipient and subject redaction.')]
    case Mail = 'mail';

    /**
     * Notification event.
     *
     * Represents notifications sent via Laravel's notification system.
     * Supports filtering by notification channel (mail, database,
     * broadcast, etc.).
     *
     * @see \Laravel\Nightwatch\Facades\Nightwatch::rejectNotifications()
     */
    #[Label('Notification')]
    #[Description('Notifications sent via Laravel notification system. Supports filtering by channel.')]
    case Notification = 'notification';

    /**
     * Outgoing HTTP Request event.
     *
     * Represents HTTP calls made to external APIs via Laravel's
     * HTTP client. Supports filtering by URL pattern and redaction
     * of URLs containing sensitive parameters.
     *
     * @see \Laravel\Nightwatch\Facades\Nightwatch::rejectOutgoingRequests()
     * @see \Laravel\Nightwatch\Facades\Nightwatch::redactOutgoingRequests()
     */
    #[Label('Outgoing Request')]
    #[Description('Outgoing HTTP calls to external APIs. Supports filtering by URL and URL redaction.')]
    case OutgoingRequest = 'outgoing_request';

    /**
     * Exception event.
     *
     * Represents errors and exceptions thrown during execution.
     * Nightwatch auto-creates issues for unhandled exceptions.
     * Supports redaction of exception messages containing sensitive data.
     *
     * @see \Laravel\Nightwatch\Facades\Nightwatch::redactExceptions()
     */
    #[Label('Exception')]
    #[Description('Errors and exceptions. Auto-creates issues for unhandled exceptions. Supports message redaction.')]
    case Exception = 'exception';

    // =========================================================================
    // Helper Methods
    // =========================================================================

    /**
     * Check if this event type supports filtering (reject* methods).
     *
     * Entry points (Request, Command) use sampling instead of filtering.
     * Exceptions use sampling rate, not reject callbacks.
     *
     * @return bool True if the event type supports reject callbacks
     */
    public function supportsFiltering(): bool
    {
        return match ($this) {
            self::Query,
            self::Job,
            self::Cache,
            self::Mail,
            self::Notification,
            self::OutgoingRequest => true,
            default => false,
        };
    }

    /**
     * Check if this event type supports redaction (redact* methods).
     *
     * Most event types support redaction. Jobs and Notifications
     * do not have dedicated redaction methods in Nightwatch.
     *
     * @return bool True if the event type supports redact callbacks
     */
    public function supportsRedaction(): bool
    {
        return match ($this) {
            self::Request,
            self::Query,
            self::Cache,
            self::Command,
            self::Mail,
            self::OutgoingRequest,
            self::Exception => true,
            default => false,
        };
    }

    /**
     * Check if this event type is an entry point (execution context).
     *
     * Entry points trigger traces. All child events within an entry
     * point are captured when the entry point is sampled.
     *
     * @return bool True if this is an entry point event type
     */
    public function isEntryPoint(): bool
    {
        return match ($this) {
            self::Request,
            self::Command => true,
            default => false,
        };
    }

    /**
     * Get the corresponding Nightwatch environment variable for
     * disabling collection of this event type entirely.
     *
     * @return string|null The env var name, or null if not applicable
     */
    public function ignoreEnvVar(): ?string
    {
        return match ($this) {
            self::Query => 'NIGHTWATCH_IGNORE_QUERIES',
            self::Cache => 'NIGHTWATCH_IGNORE_CACHE_EVENTS',
            self::Mail => 'NIGHTWATCH_IGNORE_MAIL',
            self::Notification => 'NIGHTWATCH_IGNORE_NOTIFICATIONS',
            self::OutgoingRequest => 'NIGHTWATCH_IGNORE_OUTGOING_REQUESTS',
            default => null,
        };
    }
}
