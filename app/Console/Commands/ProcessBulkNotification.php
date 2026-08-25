<?php

namespace App\Console\Commands;

use App\Services\BulkNotificationService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class ProcessBulkNotification extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'bulk-notifications:process {log_id : The ID of the bulk notification log}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Process a bulk notification log entry asynchronously in the background';

    /**
     * Execute the console command.
     */
    public function handle(BulkNotificationService $service): int
    {
        $logId = (int) $this->argument('log_id');

        $this->info("Starting background processing for bulk notification log #{$logId}...");

        try {
            $service->processBulkNotificationLog($logId);
            $this->info("Completed bulk notification log #{$logId}.");

            return 0;
        } catch (\Throwable $e) {
            Log::error("ProcessBulkNotification command failed for log #{$logId}: ".$e->getMessage());
            $this->error("Failed to process bulk notification log #{$logId}: ".$e->getMessage());

            return 1;
        }
    }
}
