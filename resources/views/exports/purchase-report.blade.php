<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Laporan Pembelian</title>
    <style>
        body { font-family: DejaVu Sans, sans-serif; font-size: 12px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #333; padding: 6px; text-align: left; }
        th { background: #eee; }
        h2 { margin-bottom: 0; }
    </style>
</head>
<body>
    <h2>Laporan Pembelian</h2>
    <p>Periode: {{ $startDate->format('d/m/Y') }} - {{ $endDate->format('d/m/Y') }}</p>
    <table>
        <thead>
            <tr>
                <th>ID</th>
                <th>Tanggal</th>
                <th>Supplier</th>
                <th>Kategori</th>
                <th>Produk</th>
                <th>Harga</th>
                <th>Jumlah</th>
                <th>Total</th>
            </tr>
        </thead>
        <tbody>
            @php $grandTotal = 0; @endphp
            @foreach($purchases as $purchase)
                @foreach($purchase->items as $item)
                <tr>
                    <td>{{ $purchase->id }}</td>
                    <td>{{ $purchase->created_at->format('d/m/Y H:i') }}</td>
                    <td>{{ $purchase->supplier->name ?? '-' }}</td>
                    <td>{{ $purchase->category->name ?? '-' }}</td>
                    <td>{{ $item->product_name ?? '-' }}</td>
                    <td>Rp {{ number_format($item->unit_price, 0, ',', '.') }}</td>
                    <td>{{ $item->quantity }}</td>
                    <td>Rp {{ number_format($item->total, 0, ',', '.') }}</td>
                </tr>
                @php $grandTotal += $item->total; @endphp
                @endforeach
            @endforeach
        </tbody>
        <tfoot>
            <tr>
                <td colspan="7" style="text-align:right"><b>Total Pembelian</b></td>
                <td><b>Rp {{ number_format($grandTotal, 0, ',', '.') }}</b></td>
            </tr>
        </tfoot>
    </table>
</body>
</html> 