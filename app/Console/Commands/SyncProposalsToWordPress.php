<?php

namespace App\Console\Commands;

use App\Services\WordPressSyncService;
use Illuminate\Console\Command;

class SyncProposalsToWordPress extends Command
{
    protected $signature = 'wp:sync-proposals
                            {--count=15 : Number of proposals to sync (max 30)}';

    protected $description = 'Push the daily random proposals to the WordPress marketing site.';

    public function handle(WordPressSyncService $service): int
    {
        $count = (int) $this->option('count');
        $result = $service->syncProposals($count);

        if (! empty($result['error']) && ($result['synced'] ?? 0) === 0) {
            $this->error($result['error']);

            return self::FAILURE;
        }

        $this->info("Synced {$result['synced']} proposals to WordPress.");

        if (! empty($result['error'])) {
            $this->warn($result['error']);
        }

        return self::SUCCESS;
    }
}
