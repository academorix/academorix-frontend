# =============================================================================
# docker/service.Dockerfile
# =============================================================================
#
# Multi-stage container for every Stackra Laravel Octane service.
#
# ONE Dockerfile, six services. Each service's docker-compose block
# passes its own SERVICE_NAME + SERVICE_PORT via `args:`; the same
# image build shape produces identity / commerce / notifications /
# observability / academorix-api / academorix-ai.
#
# ## Stages
#
#   1. `composer-vendor`  — Composer install with dev deps disabled.
#                           Cache-friendly: runs BEFORE the source copy so
#                           `composer install` doesn't rerun on every code
#                           change, only when composer.json/lock change.
#   2. `swoole-build`      — Build the Swoole PECL extension (C compile).
#                           Isolated so the runtime stage doesn't ship
#                           gcc, autoconf, or linux-headers.
#   3. `runtime`           — Final production image. Copies vendor/ from
#                           stage 1 + swoole.so from stage 2 + application
#                           code from build context. No dev deps, no build
#                           toolchain.
#
# ## Build args
#
#   * `SERVICE_NAME` — required. One of `identity` / `commerce` /
#     `notifications` / `observability` / `academorix-api` /
#     `academorix-ai`. Selects the build-context sub-directory + the
#     WORKDIR inside the container.
#   * `SERVICE_PATH` — required. Relative path to the service under
#     `services/<name>/` (shared) or `apps/<name>/` (per-Application).
#   * `SERVICE_PORT` — default 8000. The HTTP port Octane binds to.
#   * `PHP_VERSION`  — default 8.3. Track Laravel's supported range.
#
# ## Doppler
#
# The runtime stage does NOT copy .env — every secret comes from Doppler
# at runtime via `doppler run --` wrapping the entry command. The
# Docker Compose service block injects the Doppler service token via
# env; the entrypoint sources it before `octane:start`.
#
# ## Runtime user
#
# Everything runs as UID 1001 (`stackra`). Never root — matches the
# k8s pod security policy that rejects root containers.
#
# ## Health probe
#
# The runtime stage exposes `/health/ping` which is the health-check
# endpoint every service inherits from `packages/backend/telemetry/health`.
# Docker Compose uses this for `healthcheck:`.
#
# ## Related
#
#   * ADR-0028 — Runtime target: Laravel Octane.
#   * ADR-0034 — Octane driver: Swoole.
#   * ADR-0032 — Six-service split (Option B).
#   * `docker/compose.dev.yml` — how build args are wired per service.
#   * `services/<name>/config/octane.php` — worker pool + max-requests.

# =============================================================================
# Stage 1 — composer-vendor
# =============================================================================
#
# Install Composer dependencies against the service's composer.json +
# the workspace's path-repositories. Result: a fully-hydrated `vendor/`
# directory + `bootstrap/cache/services.php` provider manifest.
#
# Cache invalidation: this stage re-runs only when composer.json /
# composer.lock OR any linked path-repo composer.json changes. Source
# code changes below this stage do NOT bust the cache.
#
# ## PHP version pinned to 8.3
#
# The official `composer:2` image tracks the LATEST PHP release —
# currently 8.5. Some workspace dependencies (transfer's maatwebsite/
# excel → phpoffice/phpspreadsheet 1.x) declare `php <8.5.0` and fail
# to resolve on 8.5. We use the `php:8.3-cli-alpine` base + install
# composer manually so the composer stage sees the SAME PHP version
# the runtime does.

# Baseline PHP version — every stage uses this. Bump when the
# workspace-wide `php: "^X.Y"` constraint changes. Currently 8.4
# because several stackra/* packages require ^8.4|^8.5 and
# phpspreadsheet 1.30.x supports only up to 8.4.
ARG PHP_VERSION=8.4

FROM php:${PHP_VERSION}-cli-alpine AS composer-vendor

# Composer itself + minimal tools the install needs.
#
#   * `curl`  — the getcomposer.org installer script is fetched via curl.
#   * `git`   — Composer's git-source path (rare in this workspace since
#              most internal packages are path-repos, but some vendors
#              like laravel/tinker still git-clone at install time).
#   * `unzip` — Composer unpacks --prefer-dist archives via unzip.
RUN apk add --no-cache curl git unzip \
    && curl -sS https://getcomposer.org/installer \
        | php -- --install-dir=/usr/local/bin --filename=composer \
    && composer --version

WORKDIR /workspace

# Build args — arrive from docker-compose's `args:` block.
ARG SERVICE_NAME
ARG SERVICE_PATH

# Copy the ENTIRE workspace so path-repositories can resolve.
# Composer's path-repo needs to see the target packages on disk during
# install; we can't just copy the service's own directory.
COPY . /workspace

# Run install inside the service's own directory (its composer.json is
# the install root). --no-dev keeps the runtime vendor slim.
# --no-scripts skips post-install-cmd hooks that would run artisan
# (artisan needs the app booted; we do that in the runtime stage).
#
# --ignore-platform-req=ext-{pcntl,swoole,redis,pdo_pgsql,intl}:
#   the composer:2 image ships PHP-CLI without these extensions. The
#   RUNTIME stage installs them via `install-php-extensions` — Composer
#   at install time only needs to WRITE the vendor tree, not exercise
#   the extensions. Skipping the platform check here lets install
#   complete against the runtime target's actual extension list.
RUN cd "/workspace/${SERVICE_PATH}" \
    && composer install \
        --no-dev \
        --no-interaction \
        --no-progress \
        --no-scripts \
        --prefer-dist \
        --optimize-autoloader \
        --ignore-platform-req=ext-pcntl \
        --ignore-platform-req=ext-swoole \
        --ignore-platform-req=ext-redis \
        --ignore-platform-req=ext-pdo_pgsql \
        --ignore-platform-req=ext-intl \
        --ignore-platform-req=ext-bcmath \
        --ignore-platform-req=ext-opcache \
        --ignore-platform-req=ext-gd \
        --ignore-platform-req=ext-zip \
        --ignore-platform-req=ext-mbstring

# =============================================================================
# Stage 2 — swoole-build
# =============================================================================
#
# Compile the Swoole PECL extension against the target PHP version.
# Isolated build environment: gcc, autoconf, linux-headers all stay
# here and never reach the runtime image.

FROM php:${PHP_VERSION}-fpm-alpine AS swoole-build

# Build toolchain — needed for `pecl install swoole`.
# openssl-dev enables https support inside swoole's own HTTP client;
# curl-dev + pcre-dev enable the extension's optional features.
RUN apk add --no-cache \
        autoconf \
        gcc \
        g++ \
        make \
        openssl-dev \
        curl-dev \
        pcre-dev \
        linux-headers

# Install swoole. --enable-openssl gives HTTPS support in Octane's
# Swoole HTTP server. --enable-http2 gates the HTTP/2 codepath (still
# fronted by nginx/Caddy at ingress in production, but useful in dev).
#
# `printf` feeds the interactive prompts: enable OpenSSL / HTTP/2 /
# CARES / mysqlnd — accept all defaults except we want SSL + HTTP/2.
RUN printf "yes\nyes\nno\nno\nno\n" | pecl install swoole \
    && docker-php-ext-enable swoole

# =============================================================================
# Stage 3 — runtime
# =============================================================================
#
# Final production image. Contains PHP + swoole.so + the vendor/
# directory + the service's own source. NO build toolchain, NO
# composer, NO dev deps.

FROM php:${PHP_VERSION}-fpm-alpine AS runtime

# ── Runtime OS packages ─────────────────────────────────────────────
#
# Everything a Laravel + Octane request actually needs. Keep this list
# short; every added package widens the CVE surface.
RUN apk add --no-cache \
        # Doppler CLI — resolves secrets at container start.
        # curl -Ls https://cli.doppler.com/install.sh | sh installs into /usr/local/bin.
        curl \
        # gnupg — the Doppler installer signature-verifies its own
        # tarball. Without gpg the install script exits with
        # "Unable to find gpg binary for signature verification".
        gnupg \
        # tini — a proper PID 1 init that reaps zombies + forwards signals.
        # Octane spawns worker children; without tini they'd zombify on shutdown.
        tini \
        # For Laravel's file caching + session storage on ephemeral volumes.
        ca-certificates \
        # icu-libs — Carbon date localization; Laravel loads it lazily.
        icu-libs \
        # oniguruma — mbstring extension dependency.
        oniguruma \
        # postgresql-libs — pdo_pgsql runtime.
        postgresql-libs

# Install Doppler CLI (bundled once here; every service reuses it).
# Pin the version to lock the CLI contract — bumping the CLI is an
# explicit choice, never a "latest" pull.
RUN curl -Ls https://cli.doppler.com/install.sh | sh -s -- --scope /usr/local

# ── PHP extensions ──────────────────────────────────────────────────
#
# Every extension Laravel + our packages hard-require. Missing any of
# these breaks boot at `artisan --version`.
#
# `install-php-extensions` is a community helper that handles PECL
# dependencies, ABI matching, and cache invalidation. Faster than
# hand-rolled `docker-php-ext-install` chains.
COPY --from=mlocati/php-extension-installer:latest /usr/bin/install-php-extensions /usr/local/bin/
RUN install-php-extensions \
        pdo_pgsql \
        pcntl \
        bcmath \
        intl \
        opcache \
        redis \
        mbstring \
        zip \
        gd

# Copy the pre-built Swoole extension from stage 2.
# The .so file is the compiled C extension; the .ini enables it.
COPY --from=swoole-build /usr/local/lib/php/extensions/*/swoole.so \
    /usr/local/lib/php/extensions/no-debug-non-zts-20230831/
COPY --from=swoole-build /usr/local/etc/php/conf.d/docker-php-ext-swoole.ini \
    /usr/local/etc/php/conf.d/

# ── OPcache production tuning ───────────────────────────────────────
#
# Under Octane the whole framework stays warm in a persistent worker.
# OPcache still helps for the initial compile of every PHP file in
# `vendor/` + our `packages/backend/**` source. Numbers below match
# the workspace-standard baseline (see docs/deployment.md).
RUN { \
        echo 'opcache.enable=1'; \
        echo 'opcache.enable_cli=0'; \
        echo 'opcache.memory_consumption=256'; \
        echo 'opcache.interned_strings_buffer=16'; \
        echo 'opcache.max_accelerated_files=20000'; \
        echo 'opcache.validate_timestamps=0'; \
        echo 'opcache.save_comments=1'; \
        echo 'opcache.jit_buffer_size=64M'; \
        echo 'opcache.jit=tracing'; \
    } > /usr/local/etc/php/conf.d/opcache.ini

# ── Runtime user ────────────────────────────────────────────────────
#
# Never root. Matches the k8s pod-security-policy that rejects UID 0.
# UID 1001 to sidestep host UID collisions on macOS bind-mounts.
RUN addgroup -g 1001 stackra \
    && adduser -u 1001 -G stackra -s /sbin/nologin -D stackra

# ── Build args (re-declared per stage — Docker requires this) ───────
ARG SERVICE_NAME
ARG SERVICE_PATH
ARG SERVICE_PORT=8000

# WORKDIR is per-service. Inside the container the app lives at
# /var/www/<name> regardless of whether the source tree was under
# services/<name>/ or apps/<name>/. That way `octane:start` doesn't
# need to know which top-level tree it came from.
WORKDIR /var/www/${SERVICE_NAME}

# Copy the ENTIRE workspace so path-repositories resolve at runtime
# (composer autoloader references paths inside packages/backend/**).
# Ownership goes to stackra:stackra so writes to storage/ + bootstrap/cache/
# work without a chmod dance.
COPY --chown=stackra:stackra . /workspace

# Link the service's tree into WORKDIR + copy the pre-installed vendor.
# Symlink instead of copy: the source is already under /workspace; the
# WORKDIR just needs to point at the right sub-directory.
RUN ln -s /workspace/${SERVICE_PATH}/* /var/www/${SERVICE_NAME}/ \
    && ln -s /workspace/${SERVICE_PATH}/.doppler.yaml /var/www/${SERVICE_NAME}/.doppler.yaml
COPY --from=composer-vendor --chown=stackra:stackra \
    /workspace/${SERVICE_PATH}/vendor /var/www/${SERVICE_NAME}/vendor

# ── Filesystem prep ─────────────────────────────────────────────────
#
# Laravel writes to storage/ + bootstrap/cache/ at runtime. Make sure
# both are writable by the runtime user before the container starts.
RUN mkdir -p /var/www/${SERVICE_NAME}/storage/logs \
             /var/www/${SERVICE_NAME}/storage/framework/cache \
             /var/www/${SERVICE_NAME}/storage/framework/sessions \
             /var/www/${SERVICE_NAME}/storage/framework/views \
             /var/www/${SERVICE_NAME}/bootstrap/cache \
    && chown -R stackra:stackra /var/www/${SERVICE_NAME}/storage \
                                 /var/www/${SERVICE_NAME}/bootstrap/cache

# Doppler expects its config at ~/.doppler; the runtime user's home is
# /home/stackra by default. Create the dir so `doppler configure` works.
RUN mkdir -p /home/stackra/.doppler && chown -R stackra:stackra /home/stackra

USER stackra

# ── Runtime env ─────────────────────────────────────────────────────
ENV OCTANE_SERVER=swoole \
    OCTANE_HOST=0.0.0.0 \
    OCTANE_PORT=${SERVICE_PORT} \
    APP_ENV=production

EXPOSE ${SERVICE_PORT}

# Docker's health check pings the service's shared health probe. The
# `packages/backend/telemetry/health` package registers `/health/ping`
# on every service; a 200 response = the framework has booted.
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:${SERVICE_PORT}/health/ping || exit 1

# ── Entry ───────────────────────────────────────────────────────────
#
# tini is PID 1 so it can reap Octane's worker children on shutdown.
# `doppler run --` resolves secrets THEN execs octane:start.
# `--host` + `--port` are set from the ENV above; `--workers` +
# `--max-requests` come from services/<name>/config/octane.php.
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["doppler", "run", "--", "php", "artisan", "octane:start", \
     "--server=swoole", "--host=0.0.0.0", "--port=8000"]
