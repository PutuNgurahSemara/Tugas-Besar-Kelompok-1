<?php

namespace App\Exports;

use App\Models\Sale;
use Carbon\Carbon;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;

class SalesReportExport implements FromCollection, WithHeadings
{
    protected $startDate;
    protected $endDate;

    public function __construct($startDate, $endDate)
    {
        $this->startDate = $startDate;
        $this->endDate = $endDate;
    }

    public function collection()
    {
        $data = Sale::with(['items.produk'])
            ->whereBetween('created_at', [$this->startDate, $this->endDate])
            ->get()
            ->map(function ($sale) {
                $produkList = $sale->items->map(function($item) {
                    return $item->produk->nama ?? '-';
                })->implode(', ');
                return [
                    'ID' => $sale->id,
                    'Tanggal' => $sale->created_at->format('Y-m-d H:i'),
                    'Produk' => $produkList,
                    'Total' => $sale->total_price,
                ];
            })->toArray();

        $total = array_sum(array_column($data, 'Total'));
        $data[] = [
            'ID' => '',
            'Tanggal' => '',
            'Produk' => 'TOTAL',
            'Total' => $total,
        ];
        return collect($data);
    }

    public function headings(): array
    {
        return ['ID', 'Tanggal', 'Produk', 'Total'];
    }
} 