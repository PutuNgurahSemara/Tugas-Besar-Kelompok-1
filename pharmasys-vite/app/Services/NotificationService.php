<?php

namespace App\Services;

use App\Models\Notification;
use App\Models\Produk;
use App\Models\Purchase;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class NotificationService
{
    /**
     * Membuat notifikasi untuk semua admin
     */
    public function createAdminNotification(string $title, string $description, string $type, ?string $link = null, array $data = [])
    {
        $admins = User::whereHas('roles', function ($query) {
            $query->where('name', 'Admin');
        })->get();

        foreach ($admins as $admin) {
            $this->createNotification($admin->id, $title, $description, $type, $link, $data);
        }
    }

    /**
     * Membuat notifikasi untuk user tertentu
     */
    public function createNotification(int $userId, string $title, string $description, string $type, ?string $link = null, array $data = [])
    {
        return Notification::create([
            'user_id' => $userId,
            'title' => $title,
            'description' => $description,
            'type' => $type,
            'link' => $link,
            'data' => $data,
            'unread' => true
        ]);
    }

    /**
     * Memeriksa produk yang stoknya menipis
     */
    public function checkLowStock()
    {
        $produk = Produk::where('stok', '<=', DB::raw('stok_minimum'))
            ->where('stok', '>', 0) // pastikan stok belum nol
            ->get();

        if ($produk->count() > 0) {
            foreach ($produk as $item) {
                $title = 'Stok Produk Menipis';
                $description = "Stok {$item->nama_produk} tersisa {$item->stok} (minimum: {$item->stok_minimum})";
                $link = route('produk.edit', $item->id);
                
                $this->createAdminNotification($title, $description, 'low_stock', $link, [
                    'product_id' => $item->id,
                    'current_stock' => $item->stok,
                    'min_stock' => $item->stok_minimum
                ]);
            }
        }

        return $produk->count();
    }

    /**
     * Memeriksa produk yang habis stok
     */
    public function checkOutOfStock()
    {
        $produk = Produk::where('stok', '=', 0)->get();

        if ($produk->count() > 0) {
            foreach ($produk as $item) {
                $title = 'Stok Produk Habis';
                $description = "{$item->nama_produk} telah habis stok";
                $link = route('produk.edit', $item->id);
                
                $this->createAdminNotification($title, $description, 'out_of_stock', $link, [
                    'product_id' => $item->id
                ]);
            }
        }

        return $produk->count();
    }

    /**
     * Memeriksa produk yang hampir kadaluarsa
     */
    public function checkExpiringSoon()
    {
        $threshold = Carbon::now()->addDays(30); // Produk yang akan kadaluarsa dalam 30 hari
        
        $produk = Produk::where('tanggal_kadaluarsa', '<=', $threshold)
            ->where('tanggal_kadaluarsa', '>=', Carbon::now())
            ->where('stok', '>', 0)
            ->get();

        if ($produk->count() > 0) {
            foreach ($produk as $item) {
                $daysLeft = Carbon::now()->diffInDays($item->tanggal_kadaluarsa);
                $title = 'Produk Hampir Kadaluarsa';
                $description = "{$item->nama_produk} akan kadaluarsa dalam {$daysLeft} hari";
                $link = route('produk.edit', $item->id);
                
                $this->createAdminNotification($title, $description, 'expiring_soon', $link, [
                    'product_id' => $item->id,
                    'expiry_date' => $item->tanggal_kadaluarsa,
                    'days_left' => $daysLeft
                ]);
            }
        }

        return $produk->count();
    }

    /**
     * Memeriksa produk yang sudah kadaluarsa
     */
    public function checkExpired()
    {
        $produk = Produk::where('tanggal_kadaluarsa', '<', Carbon::now())
            ->where('stok', '>', 0)
            ->get();

        if ($produk->count() > 0) {
            foreach ($produk as $item) {
                $title = 'Produk Kadaluarsa';
                $description = "{$item->nama_produk} telah kadaluarsa pada {$item->tanggal_kadaluarsa->format('d/m/Y')}";
                $link = route('produk.edit', $item->id);
                
                $this->createAdminNotification($title, $description, 'expired', $link, [
                    'product_id' => $item->id,
                    'expiry_date' => $item->tanggal_kadaluarsa
                ]);
            }
        }

        return $produk->count();
    }

    /**
     * Memeriksa faktur yang mendekati tenggat pembayaran
     */
    public function checkPaymentDue()
    {
        $threshold = Carbon::now()->addDays(7); // Faktur yang jatuh tempo dalam 7 hari
        
        $purchases = Purchase::where('payment_status', '!=', 'paid')
            ->where('payment_due', '<=', $threshold)
            ->where('payment_due', '>=', Carbon::now())
            ->get();

        if ($purchases->count() > 0) {
            foreach ($purchases as $purchase) {
                $daysLeft = Carbon::now()->diffInDays($purchase->payment_due);
                $title = 'Tagihan Mendekati Jatuh Tempo';
                $description = "Faktur pembelian #{$purchase->invoice_number} akan jatuh tempo dalam {$daysLeft} hari";
                $link = route('purchases.edit', $purchase->id);
                
                $this->createAdminNotification($title, $description, 'payment_due_soon', $link, [
                    'purchase_id' => $purchase->id,
                    'invoice_number' => $purchase->invoice_number,
                    'due_date' => $purchase->payment_due,
                    'days_left' => $daysLeft
                ]);
            }
        }

        return $purchases->count();
    }

    /**
     * Memeriksa faktur yang telah melewati tenggat pembayaran
     */
    public function checkOverduePayment()
    {
        $purchases = Purchase::where('payment_status', '!=', 'paid')
            ->where('payment_due', '<', Carbon::now())
            ->get();

        if ($purchases->count() > 0) {
            foreach ($purchases as $purchase) {
                $daysOverdue = Carbon::now()->diffInDays($purchase->payment_due);
                $title = 'Tagihan Melewati Jatuh Tempo';
                $description = "Faktur pembelian #{$purchase->invoice_number} telah melewati jatuh tempo sebanyak {$daysOverdue} hari";
                $link = route('purchases.edit', $purchase->id);
                
                $this->createAdminNotification($title, $description, 'payment_overdue', $link, [
                    'purchase_id' => $purchase->id,
                    'invoice_number' => $purchase->invoice_number,
                    'due_date' => $purchase->payment_due,
                    'days_overdue' => $daysOverdue
                ]);
            }
        }

        return $purchases->count();
    }

    /**
     * Jalankan semua pemeriksaan notifikasi
     */
    public function runAllChecks()
    {
        $stats = [
            'low_stock' => $this->checkLowStock(),
            'out_of_stock' => $this->checkOutOfStock(),
            'expiring_soon' => $this->checkExpiringSoon(),
            'expired' => $this->checkExpired(),
            'payment_due_soon' => $this->checkPaymentDue(),
            'payment_overdue' => $this->checkOverduePayment()
        ];

        return $stats;
    }
}
