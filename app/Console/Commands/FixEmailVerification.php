<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\User;

class FixEmailVerification extends Command
{
    protected $signature = 'fix:email-verification {email}';
    protected $description = 'Fix email verification for a specific user';

    public function handle()
    {
        $email = $this->argument('email');

        $user = User::where('email', $email)->first();

        if (!$user) {
            $this->error("User with email {$email} not found.");
            return 1;
        }

        $user->email_verified_at = now();
        $user->approved = 1;
        $user->save();

        $this->info("Email verification fixed for {$email}");
        $this->info("email_verified_at: " . $user->email_verified_at);

        return 0;
    }
}
