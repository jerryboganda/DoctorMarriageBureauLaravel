<?php

$root = __DIR__;
$excluded = [
    $root.DIRECTORY_SEPARATOR.'vendor'.DIRECTORY_SEPARATOR,
    $root.DIRECTORY_SEPARATOR.'vendor_local_bak'.DIRECTORY_SEPARATOR,
    $root.DIRECTORY_SEPARATOR.'storage'.DIRECTORY_SEPARATOR,
    $root.DIRECTORY_SEPARATOR.'bootstrap'.DIRECTORY_SEPARATOR.'cache'.DIRECTORY_SEPARATOR,
];
$excludedDirectoryNames = [
    'node_modules',
    'vendor',
    'vendor_local_bak',
    'storage',
];

$iterator = new RecursiveIteratorIterator(
    new RecursiveCallbackFilterIterator(
        new RecursiveDirectoryIterator($root, FilesystemIterator::SKIP_DOTS),
        static function (SplFileInfo $current) use ($excluded, $excludedDirectoryNames): bool {
            $path = $current->getPathname();
            foreach ($excluded as $prefix) {
                if (str_starts_with($path, $prefix)) {
                    return false;
                }
            }

            if ($current->isDir() && in_array($current->getFilename(), $excludedDirectoryNames, true)) {
                return false;
            }

            return true;
        },
    ),
);

$failed = false;
foreach ($iterator as $file) {
    if (! $file instanceof SplFileInfo || $file->getExtension() !== 'php') {
        continue;
    }

    $path = $file->getPathname();
    $command = escapeshellarg(PHP_BINARY).' -l '.escapeshellarg($path);
    passthru($command, $exitCode);
    if ($exitCode !== 0) {
        $failed = true;
    }
}

exit($failed ? 1 : 0);
