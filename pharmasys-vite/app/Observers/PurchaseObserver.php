<?php

namespace App\Observers;

use App\Models\Purchase;
use App\Services\NotificationService;
use Carbon\Carbon;

class PurchaseObserver
{
    protected $notificationService;

    public function __construct(NotificationService $notificationService)
    {
        $this->notificationService = $notificationService;
    }

    /**
     * Handle the Purchase "created" event.
     */
    public function created(Purchase $purchase)
    {
        $this->checkPaymentDue($purchase);
    }

    /**
     * Handle the Purchase "updated" event.
     */
    public function updated(Purchase $purchase)
    {
        // Jika status pembayaran diubah menjadi paid, tidak perlu notifikasi lagi
        if ($purchase->isDirty('payment_status') && $purchase->payment_status === 'paid') {
            return;
        }
        
        // Jika tanggal jatuh tempo berubah, periksa kembali
        if ($purchase->isDirty('payment_due')) {
            $this->checkPaymentDue($purchase);
        }
    }

    /**
     * Periksa status tenggat pembayaran
     */
    private function checkPaymentDue(Purchase $purchase)
    {
        // Hanya periksa jika pembayaran belum lunas
        if ($purchase->payment_status === 'paid') {
            return;
        }
        
        $threshold = Carbon::now()->addDays(7);
        
        // Mendekati jatuh tempo
        if ($purchase->payment_due <= $threshold && $purchase->payment_due >= Carbon::now()) {
            $daysLeft = Carbon::now()->diffInDays($purchase->payment_due);
            $title = 'Tagihan Mendekati Jatuh Tempo';
            $description = "Faktur pembelian #{$purchase->invoice_number} akan jatuh tempo dalam {$daysLeft} hari";
            $link = route('purchases.edit', $purchase->id);
            
            $this->notificationService->createAdminNotification($title, $description, 'payment_due_soon', $link, [
                'purchase_id' => $purchase->id,
                'invoice_number' => $purchase->invoice_number,
                'due_date' => $purchase->payment_due,
                'days_left' => $daysLeft
            ]);
        }
        
        // Sudah melewati jatuh tempo
        if ($purchase->payment_due < Carbon::now()) {
            $daysOverdue = Carbon::now()->diffInDays($purchase->payment_due);
            $title = 'Tagihan Melewati Jatuh Tempo';
            $description = "Faktur pembelian #{$purchase->invoice_number} telah melewati jatuh tempo sebanyak {$daysOverdue} hari";
            $link = route('purchases.edit', $purchase->id);
            
            $this->notificationService->createAdminNotification($title, $description, 'payment_overdue', $link, [
                'purchase_id' => $purchase->id,
                'invoice_number' => $purchase->invoice_number,
                'due_date' => $purchase->payment_due,
                'days_overdue' => $daysOverdue
            ]);
        }
    }

    /**
     * Handle the Purchase "deleted" event.
     */
    public function deleted(Purchase $purchase)
    {
        //
    }
}
