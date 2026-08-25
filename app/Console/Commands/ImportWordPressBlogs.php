<?php

namespace App\Console\Commands;

use App\Services\WordPressSyncService;
use Illuminate\Console\Command;

class ImportWordPressBlogs extends Command
{
    protected $signature = 'wp:import-blogs';

    protected $description = 'Import published WordPress posts into the Laravel admin blog management area.';

    public function handle(WordPressSyncService $service): int
    {
        $result = $service->importFromWordPress();

        $this->info("Import complete: {$result['created']} created, {$result['skipped']} skipped.");

        return self::SUCCESS;
    }
}
