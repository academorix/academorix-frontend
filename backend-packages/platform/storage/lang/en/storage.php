<?php

/**
 * @file modules/platform/storage/lang/en/storage.php
 *
 * @description
 * English translations for the `academorix/storage` module. Loaded
 * under the `storage::` namespace.
 */

declare(strict_types=1);

return [
    'errors' => [
        'not_found'              => 'The requested file does not exist.',
        'quarantined'            => 'This file is quarantined by the antivirus scanner and cannot be read.',
        'signed_url_expired'     => 'This signed URL has expired.',
        'signed_url_revoked'     => 'This signed URL has been revoked.',
        'chunked_upload_expired' => 'This chunked upload has expired. Initiate a new upload to continue.',
        'quota_exceeded'         => 'Storage quota exceeded. Contact your administrator to increase your plan.',
        'mime_not_allowed'       => 'This MIME type is not permitted for the requested file kind.',
        'size_exceeded'          => 'This file exceeds the size limit for the requested kind.',
        'kind_unknown'           => 'The requested file kind is not registered.',
    ],

    'validation' => [
        'valid_mime_for_kind'          => 'The :attribute MIME type is not allowed for this file kind.',
        'max_size_for_kind'            => 'The :attribute exceeds the maximum size for this kind.',
        'valid_file_kind'              => 'The :attribute is not a registered file kind.',
        'unique_sha256_within_tenant'  => 'A file with identical content already exists in this tenant.',
    ],

    'labels' => [
        'file'             => 'File',
        'files'            => 'Files',
        'file_variant'     => 'File Variant',
        'file_variants'    => 'File Variants',
        'signed_url_audit' => 'Signed URL Audit',
        'chunked_upload'   => 'Chunked Upload',
    ],
];
