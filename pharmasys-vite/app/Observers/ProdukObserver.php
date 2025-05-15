<?php

namespace App\Observers;

use App\Models\Produk;
use App\Services\NotificationService;
use Carbon\Carbon;

class ProdukObserver
{
    protected $notificationService;

    public function __construct(NotificationService $notificationService)
    {
        $this->notificationService = $notificationService;
    }

    /**
     * Handle the Produk "created" event.
     */
    public function created(Produk $produk)
    {
        //
    }

    /**
     * Handle the Produk "updated" event.
     */
    public function updated(Produk $produk)
    {
        // Periksa jika stok diperbaharui dan sekarang di bawah batas minimum
        if ($produk->isDirty('stok') && $produk->stok <= $produk->stok_minimum && $produk->stok > 0) {
            $title = 'Stok Produk Menipis';
            $description = "Stok {$produk->nama_produk} tersisa {$produk->stok} (minimum: {$produk->stok_minimum})";
            $link = route('produk.edit', $produk->id);
            
            $this->notificationService->createAdminNotification($title, $description, 'low_stock', $link, [
                'product_id' => $produk->id,
                'current_stock' => $produk->stok,
                'min_stock' => $produk->stok_minimum
            ]);
        }

        // Periksa jika stok habis
        if ($produk->isDirty('stok') && $produk->stok === 0) {
            $title = 'Stok Produk Habis';
            $description = "{$produk->nama_produk} telah habis stok";
            $link = route('produk.edit', $produk->id);
            
            $this->notificationService->createAdminNotification($title, $description, 'out_of_stock', $link, [
                'product_id' => $produk->id
            ]);
        }

        // Periksa jika tanggal kadaluarsa diperbarui dan sekarang dalam waktu dekat
        if ($produk->isDirty('tanggal_kadaluarsa')) {
            $threshold = Carbon::now()->addDays(30);
            
            // Hampir kadaluarsa
            if ($produk->tanggal_kadaluarsa <= $threshold && $produk->tanggal_kadaluarsa >= Carbon::now()) {
                $daysLeft = Carbon::now()->diffInDays($produk->tanggal_kadaluarsa);
                $title = 'Produk Hampir Kadaluarsa';
                $description = "{$produk->nama_produk} akan kadaluarsa dalam {$daysLeft} hari";
                $link = route('produk.edit', $produk->id);
                
                $this->notificationService->createAdminNotification($title, $description, 'expiring_soon', $link, [
                    'product_id' => $produk->id,
                    'expiry_date' => $produk->tanggal_kadaluarsa,
                    'days_left' => $daysLeft
                ]);
            }
            
            // Sudah kadaluarsa
            if ($produk->tanggal_kadaluarsa < Carbon::now()) {
                $title = 'Produk Kadaluarsa';
                $description = "{$produk->nama_produk} telah kadaluarsa pada {$produk->tanggal_kadaluarsa->format('d/m/Y')}";
                $link = route('produk.edit', $produk->id);
                
                $this->notificationService->createAdminNotification($title, $description, 'expired', $link, [
                    'product_id' => $produk->id,
                    'expiry_date' => $produk->tanggal_kadaluarsa
                ]);
            }
        }
    }

    /**
     * Handle the Produk "deleted" event.
     */
    public function deleted(Produk $produk)
    {
        //
    }

    /**
     * Handle the Produk "restored" event.
     */
    public function restored(Produk $produk)
    {
        //
    }

    /**
     * Handle the Produk "force deleted" event.
     */
    public function forceDeleted(Produk $produk)
    {
        //
    }
}
