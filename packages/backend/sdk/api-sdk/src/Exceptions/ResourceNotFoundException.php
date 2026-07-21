<?php

/**
 * @file packages/sdk/api-sdk/src/Exceptions/ResourceNotFoundException.php
 *
 * @description
 * Thrown on HTTP 404 responses AND on the client-side dispatch
 * failure when `$api->{$name}()` references a resource that
 * wasn't discovered.
 *
 * ## Two roles, one exception
 *
 * The SDK reuses the same exception type for both "the API
 * returned 404" and "there's no such SDK resource registered"
 * because from a consumer's perspective the shape is identical:
 * something they asked for doesn't exist. The `statusCode()`
 * accessor lets code distinguish the two — client-side dispatch
 * failure carries status 0.
 */

declare(strict_types=1);

namespace Stackra\ApiSdk\Exceptions;

/**
 * HTTP 404 or client-side "unknown SDK resource".
 */
final class ResourceNotFoundException extends ApiRequestException
{
}
