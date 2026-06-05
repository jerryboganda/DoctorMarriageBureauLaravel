<?php

namespace App\Providers;

use App\Utility\EmailUtility;
use Illuminate\Pagination\Paginator;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Bootstrap any application services.
     *
     * @return void
     */
    public function boot()
    {
        Schema::defaultStringLength(191);
        Paginator::useBootstrap();

        config([
            'mail.from.address' => EmailUtility::fromAddress(),
            'mail.from.name' => EmailUtility::fromName(),
        ]);

        $mailDriver = (string) config('mail.default', 'smtp');

        if ($mailDriver === 'smtp' && ! EmailUtility::hasSmtpCredentials()) {
            config([
                'mail.default' => 'log',
            ]);
        }
    }

    /**
     * Register any application services.
     *
     * @return void
     */
    public function register()
    {
        // Only load Debugbar in local development
        if ($this->app->environment('local') && class_exists(\Barryvdh\Debugbar\ServiceProvider::class)) {
            $this->app->register(\Barryvdh\Debugbar\ServiceProvider::class);
        }
    }
}
