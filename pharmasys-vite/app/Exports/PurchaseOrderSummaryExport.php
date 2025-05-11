<?php

namespace App\Exports;

use App\Models\Purchase; // Eloquent model
use Carbon\Carbon;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithTitle;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;

class PurchaseOrderSummaryExport implements FromCollection, WithHeadings, WithMapping, WithTitle, ShouldAutoSize
{
    protected $startDate;
    protected $endDate;
    protected $supplierId;

    public function __construct($startDate, $endDate, $supplierId = null)
    {
        $this->startDate = $startDate;
        $this->endDate = $endDate;
        $this->supplierId = $supplierId;
    }

    public function collection()
    {
        $query = Purchase::with('supplier') // Eager load supplier
            ->whereBetween('tanggal_faktur', [$this->startDate, $this->endDate]); // Assuming filter by tanggal_faktur

        if ($this->supplierId && $this->supplierId !== 'all' && $this->supplierId !== '') {
            $query->where('supplier_id', $this->supplierId);
        }

        return $query->orderBy('tanggal_faktur', 'desc')->orderBy('id', 'desc')->get();
    }

    public function headings(): array
    {
        return [
            'No.',
            'PBF (Supplier)',
            'No Faktur',
            'Jumlah Tagihan (Rp)',
            'Total Pembayaran (Rp)',
            'Sisa Tagihan (Rp)',
            'Tanggal Faktur',
            'Jatuh Tempo',
            'Tanggal Pembayaran',
            'Status Pembayaran',
            'Keterangan',
        ];
    }

    /**
    * @var Purchase $purchase
    */
    public function map($purchase): array
    {
        static $rowNumber = 0;
        $rowNumber++;

        $statusPembayaran = '';
        if ($purchase->tanggal_pembayaran) {
            if ($purchase->sisa <= 0) {
                $statusPembayaran = 'Lunas';
            } else {
                $statusPembayaran = 'Bayar Sebagian';
            }
        } else {
            if ($purchase->total > 0) {
                $statusPembayaran = 'Belum Bayar';
            } else {
                 $statusPembayaran = '-'; // Or 'Tidak Ada Tagihan' if total is 0
            }
        }
        
        return [
            $rowNumber,
            $purchase->supplier ? $purchase->supplier->company : 'N/A',
            $purchase->no_faktur,
            is_numeric($purchase->total) ? floatval($purchase->total) : 0,
            is_numeric($purchase->bayar) ? floatval($purchase->bayar) : 0,
            is_numeric($purchase->sisa) ? floatval($purchase->sisa) : 0,
            $purchase->tanggal_faktur ? Carbon::parse($purchase->tanggal_faktur)->format('d M Y') : '-',
            $purchase->jatuh_tempo ? Carbon::parse($purchase->jatuh_tempo)->format('d M Y') : '-',
            $purchase->tanggal_pembayaran ? Carbon::parse($purchase->tanggal_pembayaran)->format('d M Y') : '-',
            $statusPembayaran,
            $purchase->keterangan ?? '-',
        ];
    }

    public function title(): string
    {
        return 'Laporan Ringkasan Pembelian';
    }
}
