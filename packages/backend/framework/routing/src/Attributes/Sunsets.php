<?php

/**
 * @file packages/routing/src/Attributes/Sunsets.php
 *
 * @description
 * Deprecation metadata: declare when a controller or action is
 * scheduled to be REMOVED, and (optionally) which successor
 * replaces it. Read by the response emitter to attach the
 * `Sunset` HTTP header (RFC 8594) and, when we're within the
 * warning window, a `Deprecation` header (draft-ietf-httpapi-deprecation-header).
 *
 * ## Attribute target
 *
 * Both `TARGET_CLASS` and `TARGET_METHOD`. Class-level
 * declarations apply to every action on the controller; a
 * method-level `#[Sunsets]` overrides the class-level one for
 * just that action (useful when tightening the sunset date for a
 * specific action ahead of the rest of the controller).
 *
 * ## Semantics
 *
 *   - `date`          — ISO-8601 date (`YYYY-MM-DD`) after which
 *                       the endpoint is expected to disappear.
 *                       Emitted verbatim in the `Sunset` header.
 *   - `replacedBy`    — Optional successor. When provided, the
 *                       emitter adds a `Link: <url>;rel="successor-version"`
 *                       header pointing at the successor version's
 *                       equivalent route (URL resolution happens
 *                       in the response emitter, not here — this
 *                       attribute just carries the label).
 *   - `warnOnAccess`  — When `true`, the emitter ALSO adds a
 *                       `Deprecation: true` header on every hit
 *                       so clients see the flag without waiting
 *                       for the sunset date. Defaults to `true`
 *                       — hiding deprecation from callers is
 *                       almost never desirable.
 *
 * ## What this attribute does NOT do
 *
 *   - Does not BLOCK access after the sunset date. Enforcement is
 *     the middleware's job — after the date, the version detector
 *     raises {@see \Academorix\Routing\Http\Exceptions\SunsetApiVersionException}
 *     (410 Gone) when the app is configured to enforce sunsets.
 *   - Does not emit console noise / logs on every hit. Sunset
 *     tracking happens through the emitted headers; observability
 *     is the reporter's concern.
 *
 * ## Usage
 *
 * ```php
 * #[ApiVersion(['v1'])]
 * #[Sunsets(date: '2027-01-01', replacedBy: 'v2')]
 * class InvoicesV1Controller extends BaseController
 * {
 *     #[Get('/api/v1/invoices')]
 *     public function index() { }
 *
 *     // This one gets a *tighter* sunset than the controller.
 *     #[Delete('/api/v1/invoices/{id}')]
 *     #[Sunsets(date: '2026-10-01', replacedBy: 'v2')]
 *     public function destroy(string $id) { }
 * }
 * ```
 *
 * @see ApiVersion Version metadata the emitter reads alongside this.
 * @see \Academorix\Routing\Http\Exceptions\SunsetApiVersionException
 *      Thrown by the detector when a sunset endpoint is hit past
 *      its date AND enforcement is enabled.
 */

declare(strict_types=1);

namespace Academorix\Routing\Attributes;

use Attribute;
use DateTimeImmutable;
use InvalidArgumentException;

/**
 * Declare an endpoint sunset date + optional successor.
 *
 * Attribute values are validated at construction time — a bogus
 * date raises immediately at boot when the attribute scanner
 * instantiates the annotation, giving developers a fast fail
 * loop.
 *
 * @final
 */
#[Attribute(Attribute::TARGET_CLASS | Attribute::TARGET_METHOD)]
final class Sunsets
{
    /**
     * Sunset date parsed to an immutable value. The RFC 8594
     * emitter serialises it as an HTTP-date (`Sun, 06 Nov 1994
     * 08:49:37 GMT`) at response time, but we normalise to
     * midnight UTC here so comparisons in the middleware are
     * total-ordered.
     */
    public readonly DateTimeImmutable $date;

    /**
     * @param  string       $date         ISO-8601 date, `YYYY-MM-DD`. Anything
     *                                    beyond a date is stripped — the
     *                                    sunset date is a day, not a
     *                                    moment.
     * @param  string|null  $replacedBy   Successor version label
     *                                    (`'v2'`). Optional. The emitter uses
     *                                    this to build the
     *                                    `Link: <...>; rel="successor-version"`
     *                                    header. `null` means no successor
     *                                    is advertised.
     * @param  bool         $warnOnAccess When `true`, the emitter also
     *                                    attaches a `Deprecation: true`
     *                                    header before the sunset date. Set
     *                                    to `false` for endpoints that
     *                                    should quietly disappear (rare).
     *
     * @throws InvalidArgumentException When `$date` isn't parseable as an
     *                                  ISO-8601 date.
     */
    public function __construct(
        string $date,
        public readonly ?string $replacedBy = null,
        public readonly bool $warnOnAccess = true,
    ) {
        // Validate the successor label EARLIER than the date so a
        // bogus successor doesn't get silently swallowed if the
        // date is also bad.
        if ($replacedBy !== null && trim($replacedBy) === '') {
            throw new InvalidArgumentException(
                '#[Sunsets(replacedBy: ...)] must be non-empty when provided.',
            );
        }

        try {
            // Force UTC + midnight so equality comparisons work
            // regardless of the runtime timezone. `!` in the format
            // string resets time components to 00:00:00.
            $parsed = DateTimeImmutable::createFromFormat(
                '!Y-m-d',
                trim($date),
                new \DateTimeZone('UTC'),
            );
        } catch (\Throwable $previous) {
            throw new InvalidArgumentException(
                sprintf('#[Sunsets] date "%s" could not be parsed.', $date),
                0,
                $previous,
            );
        }

        if ($parsed === false) {
            throw new InvalidArgumentException(
                sprintf('#[Sunsets] date "%s" is not a valid YYYY-MM-DD date.', $date),
            );
        }

        $this->date = $parsed;
    }

    /**
     * Convenience — `true` when the sunset date is in the past
     * relative to the supplied "now". Callers pass a real
     * `DateTimeImmutable` (usually the request-time clock) so the
     * check is deterministic and testable.
     */
    public function hasPassed(DateTimeImmutable $now): bool
    {
        return $now > $this->date;
    }
}
