<?php

namespace App\Exports;

use App\Models\Purchase;
use Carbon\Carbon;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;

class PurchaseReportExport implements FromCollection, WithHeadings
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
        $data = [];
        $purchases = Purchase::with(['supplier', 'category', 'items'])
            ->whereBetween('created_at', [$this->startDate, $this->endDate]);
        if ($this->supplierId) {
            $purchases->where('supplier_id', $this->supplierId);
        }
        $purchases = $purchases->get();
        foreach ($purchases as $purchase) {
            foreach ($purchase->items as $item) {
                $data[] = [
                    'ID' => $purchase->id,
                    'Tanggal' => $purchase->created_at->format('Y-m-d H:i'),
                    'Supplier' => $purchase->supplier->name ?? '-',
                    'Kategori' => $purchase->category->name ?? '-',
                    'Produk' => $item->product_name,
                    'Harga' => $item->unit_price,
                    'Jumlah' => $item->quantity,
                    'Total' => $item->total,
                ];
            }
        }
        $total = array_sum(array_column($data, 'Total'));
        $data[] = [
            'ID' => '',
            'Tanggal' => '',
            'Supplier' => '',
            'Kategori' => '',
            'Produk' => '',
            'Harga' => '',
            'Jumlah' => 'TOTAL',
            'Total' => $total,
        ];
        return collect($data);
    }

    public function headings(): array
    {
        return ['ID', 'Tanggal', 'Supplier', 'Kategori', 'Produk', 'Harga', 'Jumlah', 'Total'];
    }
} 