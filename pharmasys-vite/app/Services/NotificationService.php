<?php

namespace App\Services;

use App\Models\Notification;
use App\Models\Produk;
use App\Models\Purchase;
use App\Models\User;
use App\Models\Setting;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class NotificationService
{
    /**
     * Membuat notifikasi untuk semua admin
     */
    public function createAdminNotification(string $title, string $description, string $type, ?string $link = null, array $data = [])
    {
        try {
            $admins = User::whereHas('roles', function ($query) {
                $query->where('name', 'Admin');
            })->get();

            foreach ($admins as $admin) {
                $this->createNotification($admin->id, $title, $description, $type, $link, $data);
            }
            
            return true;
        } catch (\Exception $e) {
            Log::error('Error creating admin notification: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Membuat notifikasi untuk user tertentu
     */
    public function createNotification(int $userId, string $title, string $description, string $type, ?string $link = null, array $data = [])
    {
        try {
            return Notification::create([
                'user_id' => $userId,
                'title' => $title,
                'description' => $description,
                'type' => $type,
                'link' => $link,
                'data' => $data,
                'unread' => true
            ]);
        } catch (\Exception $e) {
            Log::error('Error creating notification: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Memeriksa produk yang stoknya menipis
     */
    public function checkLowStock()
    {
        try {
            // Dapatkan threshold dari settings
            $lowStockThreshold = (int) Setting::getValue('low_stock_threshold', 10);
            
            // Gunakan accessor is_low_stock yang sudah ada di model Produk
            $produk = Produk::where('is_low_stock', true)
                ->where('available_stock', '>', 0)
                ->get();

            Log::info('Checking low stock products. Found: ' . $produk->count());

            if ($produk->count() > 0) {
                foreach ($produk as $item) {
                    $title = 'Stok Produk Menipis';
                    $description = "Stok {$item->nama} tersisa {$item->available_stock} (minimum: {$lowStockThreshold})";
                    $link = route('produk.edit', $item->id);
                    
                    $this->createAdminNotification($title, $description, 'low_stock', $link, [
                        'product_id' => $item->id,
                        'current_stock' => $item->available_stock,
                        'min_stock' => $lowStockThreshold
                    ]);
                }
            }

            return $produk->count();
        } catch (\Exception $e) {
            Log::error('Error checking low stock: ' . $e->getMessage());
            return 0;
        }
    }

    /**
     * Memeriksa produk yang habis stok
     */
    public function checkOutOfStock()
    {
        try {
            // Gunakan accessor is_out_of_stock yang sudah ada di model Produk
            $produk = Produk::where('is_out_of_stock', true)->get();

            Log::info('Checking out of stock products. Found: ' . $produk->count());

            if ($produk->count() > 0) {
                foreach ($produk as $item) {
                    $title = 'Stok Produk Habis';
                    $description = "{$item->nama} telah habis stok";
                    $link = route('produk.edit', $item->id);
                    
                    $this->createAdminNotification($title, $description, 'out_of_stock', $link, [
                        'product_id' => $item->id
                    ]);
                }
            }

            return $produk->count();
        } catch (\Exception $e) {
            Log::error('Error checking out of stock: ' . $e->getMessage());
            return 0;
        }
    }

    /**
     * Memeriksa produk yang hampir kadaluarsa
     */
    public function checkExpiringSoon()
    {
        try {
            $threshold = Carbon::now()->addDays(30); // Produk yang akan kadaluarsa dalam 30 hari
            
            // Gunakan earliest_expiry accessor dari model Produk
            $produk = Produk::whereNotNull('earliest_expiry')
                ->where('earliest_expiry', '<=', $threshold)
                ->where('earliest_expiry', '>=', Carbon::now())
                ->where('available_stock', '>', 0)
                ->get();

            Log::info('Checking expiring soon products. Found: ' . $produk->count());

            if ($produk->count() > 0) {
                foreach ($produk as $item) {
                    $daysLeft = Carbon::now()->diffInDays($item->earliest_expiry);
                    $title = 'Produk Hampir Kadaluarsa';
                    $description = "{$item->nama} akan kadaluarsa dalam {$daysLeft} hari";
                    $link = route('produk.edit', $item->id);
                    
                    $this->createAdminNotification($title, $description, 'expiring_soon', $link, [
                        'product_id' => $item->id,
                        'expiry_date' => $item->earliest_expiry,
                        'days_left' => $daysLeft
                    ]);
                }
            }

            return $produk->count();
        } catch (\Exception $e) {
            Log::error('Error checking expiring soon: ' . $e->getMessage());
            return 0;
        }
    }

    /**
     * Memeriksa produk yang sudah kadaluarsa
     */
    public function checkExpired()
    {
        try {
            // Gunakan has_expired_items accessor dari model Produk
            $produk = Produk::where('has_expired_items', true)
                ->where('available_stock', '>', 0)
                ->get();

            Log::info('Checking expired products. Found: ' . $produk->count());

            if ($produk->count() > 0) {
                foreach ($produk as $item) {
                    $title = 'Produk Kadaluarsa';
                    $description = "{$item->nama} telah kadaluarsa pada {$item->earliest_expiry->format('d/m/Y')}";
                    $link = route('produk.edit', $item->id);
                    
                    $this->createAdminNotification($title, $description, 'expired', $link, [
                        'product_id' => $item->id,
                        'expiry_date' => $item->earliest_expiry
                    ]);
                }
            }

            return $produk->count();
        } catch (\Exception $e) {
            Log::error('Error checking expired products: ' . $e->getMessage());
            return 0;
        }
    }

    /**
     * Memeriksa faktur yang mendekati tenggat pembayaran
     */
    public function checkPaymentDue()
    {
        try {
            $threshold = Carbon::now()->addDays(7); // Faktur yang jatuh tempo dalam 7 hari
            
            $purchases = Purchase::whereNull('tanggal_pembayaran') // Belum dibayar
                ->whereNotNull('jatuh_tempo')
                ->where('jatuh_tempo', '<=', $threshold)
                ->where('jatuh_tempo', '>=', Carbon::now())
                ->get();

            Log::info('Checking payment due invoices. Found: ' . $purchases->count());

            if ($purchases->count() > 0) {
                foreach ($purchases as $purchase) {
                    $daysLeft = Carbon::now()->diffInDays($purchase->jatuh_tempo);
                    $title = 'Tagihan Mendekati Jatuh Tempo';
                    $description = "Faktur pembelian #{$purchase->no_faktur} akan jatuh tempo dalam {$daysLeft} hari";
                    $link = route('purchases.edit', $purchase->id);
                    
                    $this->createAdminNotification($title, $description, 'payment_due_soon', $link, [
                        'purchase_id' => $purchase->id,
                        'invoice_number' => $purchase->no_faktur,
                        'due_date' => $purchase->jatuh_tempo,
                        'days_left' => $daysLeft
                    ]);
                }
            }

            return $purchases->count();
        } catch (\Exception $e) {
            Log::error('Error checking payment due: ' . $e->getMessage());
            return 0;
        }
    }

    /**
     * Memeriksa faktur yang telah melewati tenggat pembayaran
     */
    public function checkOverduePayment()
    {
        try {
            $purchases = Purchase::whereNull('tanggal_pembayaran') // Belum dibayar
                ->whereNotNull('jatuh_tempo')
                ->where('jatuh_tempo', '<', Carbon::now())
                ->get();

            Log::info('Checking overdue payment invoices. Found: ' . $purchases->count());

            if ($purchases->count() > 0) {
                foreach ($purchases as $purchase) {
                    $daysOverdue = Carbon::now()->diffInDays($purchase->jatuh_tempo);
                    $title = 'Tagihan Melewati Jatuh Tempo';
                    $description = "Faktur pembelian #{$purchase->no_faktur} telah melewati jatuh tempo sebanyak {$daysOverdue} hari";
                    $link = route('purchases.edit', $purchase->id);
                    
                    $this->createAdminNotification($title, $description, 'payment_overdue', $link, [
                        'purchase_id' => $purchase->id,
                        'invoice_number' => $purchase->no_faktur,
                        'due_date' => $purchase->jatuh_tempo,
                        'days_overdue' => $daysOverdue
                    ]);
                }
            }

            return $purchases->count();
        } catch (\Exception $e) {
            Log::error('Error checking overdue payment: ' . $e->getMessage());
            return 0;
        }
    }

    /**
     * Jalankan semua pemeriksaan notifikasi
     */
    public function runAllChecks()
    {
        try {
            Log::info('Running all notification checks');
            
            $stats = [
                'low_stock' => $this->checkLowStock(),
                'out_of_stock' => $this->checkOutOfStock(),
                'expiring_soon' => $this->checkExpiringSoon(),
                'expired' => $this->checkExpired(),
                'payment_due_soon' => $this->checkPaymentDue(),
                'payment_overdue' => $this->checkOverduePayment()
            ];
            
            Log::info('Notification check results: ' . json_encode($stats));
            return $stats;
        } catch (\Exception $e) {
            Log::error('Error running all checks: ' . $e->getMessage());
            return [];
        }
    }
}
