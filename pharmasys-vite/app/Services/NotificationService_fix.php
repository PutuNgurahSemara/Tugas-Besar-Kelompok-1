<?php

namespace App\Services;

use App\Models\Notification;
use App\Models\Produk;
use App\Models\Purchase;
use App\Models\PurchaseDetail;
use App\Models\SaleItem;
use App\Models\Setting;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class NotificationServiceFix
{
    // ... (method-method lainnya tetap sama)


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

            if ($purchases->isNotEmpty()) {
                foreach ($purchases as $purchase) {
                    $daysLeft = Carbon::now()->diffInDays($purchase->jatuh_tempo, false);
                    
                    // Bulatkan ke hari terdekat dan pastikan minimal 1 hari
                    $daysLeft = max(1, round($daysLeft));
                    
                    $title = 'Faktur #' . $purchase->no_faktur . ' Akan Jatuh Tempo';
                    $description = "Faktur #{$purchase->no_faktur} akan jatuh tempo dalam {$daysLeft} hari lagi.";
                    $link = route('purchases.show', $purchase->id);
                    
                    $this->createAdminNotification($title, $description, 'payment_due', $link, [
                        'purchase_id' => $purchase->id,
                        'invoice_number' => $purchase->no_faktur,
                        'due_date' => $purchase->jatuh_tempo,
                        'days_left' => $daysLeft,
                        'formatted_due_date' => $purchase->jatuh_tempo->format('d/m/Y')
                    ]);
                }
            }

            return $purchases->count();
        } catch (\Exception $e) {
            Log::error('Error checking payment due: ' . $e->getMessage() . '\n' . $e->getTraceAsString());
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

            if ($purchases->isNotEmpty()) {
                foreach ($purchases as $purchase) {
                    $daysOverdue = Carbon::now()->diffInDays($purchase->jatuh_tempo);
                    
                    // Bulatkan ke hari terdekat dan pastikan minimal 1 hari
                    $daysOverdue = max(1, round($daysOverdue));
                    
                    $title = 'Faktur #' . $purchase->no_faktur . ' Melewati Jatuh Tempo';
                    $description = "Faktur #{$purchase->no_faktur} telah melewati jatuh tempo {$daysOverdue} hari yang lalu.";
                    $link = route('purchases.show', $purchase->id);
                    
                    $this->createAdminNotification($title, $description, 'payment_overdue', $link, [
                        'purchase_id' => $purchase->id,
                        'invoice_number' => $purchase->no_faktur,
                        'due_date' => $purchase->jatuh_tempo,
                        'days_overdue' => $daysOverdue,
                        'formatted_due_date' => $purchase->jatuh_tempo->format('d/m/Y')
                    ]);
                }
            }

            return $purchases->count();
        } catch (\Exception $e) {
            Log::error('Error checking overdue payment: ' . $e->getMessage() . '\n' . $e->getTraceAsString());
            return 0;
        }
    }
}
