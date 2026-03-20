<?php

namespace App\Providers;

use App\Utility\EmailUtility;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Schema;
use Illuminate\Pagination\Paginator;

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

      $mailDriver = (string) (config('mail.default') ?? config('mail.driver') ?? env('MAIL_MAILER') ?? env('MAIL_DRIVER', 'smtp'));
      $mailUsername = strtolower(trim((string) env('MAIL_USERNAME')));
      $mailPassword = strtolower(trim((string) env('MAIL_PASSWORD')));
      $mailHost = strtolower(trim((string) env('MAIL_HOST')));

      if (in_array($mailDriver, ['smtp', 'sendmail'], true) && ($mailUsername === '' || $mailUsername === 'null' || $mailPassword === '' || $mailPassword === 'null' || $mailHost === '' || $mailHost === 'null')) {
          config([
              'mail.default' => 'log',
              'mail.driver' => 'log',
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
