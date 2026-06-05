<?php

namespace App\Console\Commands;

use App\Services\ReferralService;
use Illuminate\Console\Command;

class ProcessPendingReferrals extends Command
{
    protected $signature = 'referrals:process-pending';

    protected $description = 'Check pending referrals against active qualification rules and apply rewards when eligible';

    public function handle(ReferralService $referralService): int
    {
        $processed = $referralService->processPendingReferrals();

        $this->info("Processed {$processed} pending referrals.");

        return 0;
    }
}
