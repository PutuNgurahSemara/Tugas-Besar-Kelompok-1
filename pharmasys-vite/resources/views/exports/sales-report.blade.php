<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Laporan Penjualan</title>
    <style>
        body { font-family: DejaVu Sans, sans-serif; font-size: 12px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #333; padding: 6px; text-align: left; }
        th { background: #eee; }
        h2 { margin-bottom: 0; }
    </style>
</head>
<body>
    <h2>Laporan Penjualan</h2>
    <p>Periode: {{ $startDate->format('d/m/Y') }} - {{ $endDate->format('d/m/Y') }}</p>
    <table>
        <thead>
            <tr>
                <th>ID</th>
                <th>Tanggal</th>
                <th>Produk</th>
                <th>Total</th>
            </tr>
        </thead>
        <tbody>
            @foreach($sales as $sale)
            <tr>
                <td>{{ $sale->id }}</td>
                <td>{{ $sale->created_at->format('d/m/Y H:i') }}</td>
                <td>
                    @php
                        $produkList = $sale->items->map(function($item) {
                            return $item->produk->nama ?? '-';
                        })->implode(', ');
                    @endphp
                    {{ $produkList }}
                </td>
                <td>Rp {{ number_format($sale->total_price, 0, ',', '.') }}</td>
            </tr>
            @endforeach
        </tbody>
        <tfoot>
            <tr>
                <td colspan="3" style="text-align:right"><b>Total Pendapatan</b></td>
                <td><b>Rp {{ number_format($sales->sum('total_price'), 0, ',', '.') }}</b></td>
            </tr>
        </tfoot>
    </table>
</body>
</html> 