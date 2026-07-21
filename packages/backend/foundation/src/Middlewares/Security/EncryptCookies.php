<?php

declare(strict_types=1);

/**
 * Encrypt Cookies Middleware
 *
 * Security middleware that enforces protective measures on incoming requests.
 * Runs in the HTTP pipeline to guard against common attack vectors.
 *
 * @category Middlewares
 *
 * @since    1.0.0
 */
namespace Stackra\Foundation\Middlewares\Security;

use Illuminate\Cookie\Middleware\EncryptCookies as BaseEncryptCookies;
use Stackra\Routing\Attributes\AsMiddleware;

/**
 * Encrypt Cookies Middleware.
 *
 * Automatically encrypts outgoing cookies and decrypts incoming cookies
 * to protect sensitive data from tampering and inspection.
 *
 * ## Security Benefits:
 * - Prevents cookie tampering (integrity)
 * - Hides cookie values from client inspection (confidentiality)
 * - Uses Laravel's encryption key from APP_KEY
 * - Automatic encryption/decryption (transparent to application)
 *
 * ## How It Works:
 * 1. Outgoing: Encrypts cookie values before sending to client
 * 2. Incoming: Decrypts cookie values before application access
 * 3. Invalid cookies: Automatically discarded (tampered or corrupted)
 *
 * ## Excluded Cookies:
 * Some cookies should NOT be encrypted:
 * - Third-party cookies (analytics, ads)
 * - Cookies read by JavaScript that need plain values
 * - Cookies shared with external services
 *
 * Add cookie names to `$except` array to skip encryption.
 *
 * @since 1.0.0
 */
#[AsMiddleware(
    alias: 'encrypt.cookies',
    groups: ['web'],
    priority: 5
)]
class EncryptCookies extends BaseEncryptCookies
{
    /**
     * The names of the cookies that should not be encrypted.
     *
     * Add cookie names that need to be readable by JavaScript or
     * external services without decryption.
     *
     * @var array<int, string>
     */
    protected $except = [
        // Example: 'analytics_id',
        // Example: 'third_party_token',
    ];
}
