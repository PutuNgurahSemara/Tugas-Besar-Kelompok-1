<?php

require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';

$kernel = $app->make(Illwarehousen\Contracts\Http\Kernel::class);

$response = $kernel->handle(
    $request = Illuminate\Http\Request::capture()
);

// Check Afrika product
echo "=== CEK STOK PRODUK AFRIKA ===\n";

// Get product ID for Afrika
$produk = DB::table('produk')
    ->where('nama', 'like', '%Afrika%')
    ->first();

if (!$produk) {
    echo "Produk Afrika tidak ditemukan\n";
    exit;
}

echo "ID Produk: " . $produk->id . "\n";
echo "Nama: " . $produk->nama . "\n";

// Get total purchase
$totalPembelian = DB::table('purchase_details')
    ->where('produk_id', $produk->id)
    ->sum('jumlah');

echo "Total Pembelian: " . $totalPembelian . "\n";

// Get total sales
$totalPenjualan = DB::table('sale_items')
    ->where('produk_id', $produk->id)
    ->sum('quantity');

echo "Total Penjualan: " . $totalPenjualan . "\n";

// Calculate available stock
$stokTersedia = $totalPembelian - $totalPenjualan;
echo "Stok Tersedia: " . $stokTersedia . "\n";

// Check if stock is negative
if ($stokTersedia < 0) {
    echo "\nPERINGATAN: Stok negatif terdeteksi!\n";
    
    // Option to fix the stock
    echo "\nApakah Anda ingin memperbaiki stok menjadi 3? (y/n) ";
    $handle = fopen ("php://stdin","r");
    $line = fgets($handle);
    
    if(trim($line) == 'y'){
        // Calculate the difference needed to make stock = 3
        $difference = 3 - $stokTersedia;
        
        // Add a new purchase record
        DB::table('purchase_details')->insert([
            'produk_id' => $produk->id,
            'purchase_id' => 1, // You may need to adjust this
            'jumlah' => $difference,
            'harga' => $produk->harga,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        
        echo "Stok telah diperbaiki menjadi 3\n";
    } else {
        echo "Perbaikan stok dibatalkan\n";
    }
}

// Check notification status
$notificationService = app(\App\Services\NotificationService::class);
$isLowStock = $notificationService->checkLowStock();
echo "\nStatus Notifikasi Low Stock: " . ($isLowStock > 0 ? 'Aktif' : 'Tidak Aktif') . "\n";
