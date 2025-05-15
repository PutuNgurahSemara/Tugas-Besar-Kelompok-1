<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use App\Models\Produk;
use App\Models\Purchase;
use App\Observers\ProdukObserver;
use App\Observers\PurchaseObserver;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Mendaftarkan observer
        Produk::observe(ProdukObserver::class);
        Purchase::observe(PurchaseObserver::class);
    }
}
