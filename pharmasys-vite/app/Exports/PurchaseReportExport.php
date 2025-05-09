<?php

namespace App\Exports;

use App\Models\Purchase;
use Carbon\Carbon;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithTitle;
use Illuminate\Support\Facades\DB;

class PurchaseReportExport implements FromCollection, WithHeadings, WithTitle
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
        $query = DB::table('purchase_details')
            ->join('purchases', 'purchase_details.purchase_id', '=', 'purchases.id')
            ->join('suppliers', 'purchases.supplier_id', '=', 'suppliers.id')
            ->whereBetween('purchases.created_at', [$this->startDate, $this->endDate]);

        if ($this->supplierId && $this->supplierId !== 'all') {
            $query->where('purchases.supplier_id', $this->supplierId);
        }

        $data = $query->select([
            'purchases.id',
            'purchases.created_at',
            'suppliers.company as supplier_name',
            'purchase_details.nama_produk',
            'purchase_details.harga_satuan',
            'purchase_details.jumlah',
            DB::raw('purchase_details.harga_satuan * purchase_details.jumlah as total')
        ])->get()->map(function ($purchase) {
            return [
                'ID' => $purchase->id,
                'Tanggal' => Carbon::parse($purchase->created_at)->format('Y-m-d H:i'),
                'Supplier' => $purchase->supplier_name,
                'Produk' => $purchase->nama_produk,
                'Harga' => $purchase->harga_satuan,
                'Jumlah' => $purchase->jumlah,
                'Total' => $purchase->total,
            ];
        })->toArray();

        $total = array_sum(array_column($data, 'Total'));
        $data[] = [
            'ID' => '',
            'Tanggal' => '',
            'Supplier' => '',
            'Produk' => 'TOTAL',
            'Harga' => '',
            'Jumlah' => '',
            'Total' => $total,
        ];
        return collect($data);
    }

    public function headings(): array
    {
        return ['ID', 'Tanggal', 'Supplier', 'Produk', 'Harga', 'Jumlah', 'Total'];
    }

    public function title(): string
    {
        return 'Laporan Pembelian';
    }
}