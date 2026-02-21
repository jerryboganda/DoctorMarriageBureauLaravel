<?php

namespace App\Providers;

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
