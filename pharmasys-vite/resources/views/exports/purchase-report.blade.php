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
        .total-row { font-weight: bold; background: #f5f5f5; }
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
                <th>Produk</th>
                <th>Harga</th>
                <th>Jumlah</th>
                <th>Total</th>
            </tr>
        </thead>
        <tbody>
            @foreach($purchases as $purchase)
                <tr>
                    <td>{{ $purchase->id }}</td>
                    <td>{{ \Carbon\Carbon::parse($purchase->created_at)->format('Y-m-d H:i') }}</td>
                    <td>{{ $purchase->supplier_name }}</td>
                    <td>{{ $purchase->nama_produk }}</td>
                    <td>Rp {{ number_format($purchase->harga_satuan, 0, ',', '.') }}</td>
                    <td>{{ $purchase->jumlah }}</td>
                    <td>Rp {{ number_format($purchase->harga_satuan * $purchase->jumlah, 0, ',', '.') }}</td>
                </tr>
            @endforeach
        </tbody>
        <tfoot>
            <tr class="total-row">
                <td colspan="6" align="right"><strong>Total:</strong></td>
                <td><strong>Rp {{ number_format($purchases->sum(function($p) { return $p->harga_satuan * $p->jumlah; }), 0, ',', '.') }}</strong></td>
            </tr>
        </tfoot>
    </table>
</body>
</html>