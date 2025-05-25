<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Produk;
use App\Models\Purchase;
use App\Models\PurchaseDetail;
use App\Models\Supplier;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class FixNegativeStock extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'stock:fix-negative {product_id? : ID produk yang akan diperbaiki} {--all : Perbaiki semua produk dengan stok negatif} {--yes : Konfirmasi otomatis untuk semua pertanyaan}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Memperbaiki stok negatif dengan menambahkan pembelian otomatis';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        try {
            DB::beginTransaction();
            
            $query = Produk::where('status', Produk::STATUS_ACTIVE)
                ->whereHas('purchaseDetails')
                ->withCount(['purchaseDetails as total_purchases' => function($q) {
                    $q->select(DB::raw('COALESCE(SUM(jumlah), 0)'));
                }])
                ->withCount(['saleItems as total_sales' => function($q) {
                    $q->select(DB::raw('COALESCE(SUM(quantity), 0)'));
                }]);
            
            if ($this->option('all')) {
                $query->havingRaw('total_sales > total_purchases');
            } elseif ($this->argument('product_id')) {
                $query->where('id', $this->argument('product_id'));
            } else {
                $this->error('Harap tentukan product_id atau gunakan opsi --all');
                return 1;
            }
            
            $products = $query->get();
            
            if ($products->isEmpty()) {
                $this->info('Tidak ada produk dengan stok negatif yang ditemukan.');
                return 0;
            }
            
            $this->info('Menemukan ' . $products->count() . ' produk dengan stok negatif:');
            
            $supplier = Supplier::first();
            
            if (!$supplier) {
                $supplier = Supplier::create([
                    'kode' => 'SUP-' . time(),
                    'nama' => 'Supplier Otomatis',
                    'alamat' => 'Alamat default',
                    'telepon' => '081234567890',
                    'email' => 'supplier@default.com',
                    'kontak_person' => 'Admin',
                    'status' => 'active'
                ]);
            }
            
            foreach ($products as $product) {
                $missingStock = $product->total_sales - $product->total_purchases;
                
                if ($missingStock <= 0) continue;
                
                $this->line("\nMemproses produk: {$product->nama} (ID: {$product->id})");
                $this->line("Stok saat ini: " . ($product->total_purchases - $product->total_sales));
                $this->line("Kekurangan stok: {$missingStock}");
                
                $shouldProceed = $this->option('yes') || $this->confirm("Apakah Anda ingin menambahkan pembelian untuk menutupi kekurangan stok?");
                
                if ($shouldProceed) {
                    // Buat pembelian baru
                    $purchase = Purchase::create([
                        'supplier_id' => $supplier->id,
                        'no_faktur' => 'AUTO-' . time() . '-' . $product->id,
                        'pbf' => 'Sistem Otomatis',
                        'tanggal_faktur' => now()->format('Y-m-d'),
                        'jatuh_tempo' => now()->addDays(30)->format('Y-m-d'),
                        'jumlah' => $missingStock,
                        'total' => 0, // Harga 0 karena koreksi
                        'subtotal' => 0,
                        'ppn_percentage' => 0,
                        'ppn_amount' => 0,
                        'keterangan' => 'Pembelian otomatis untuk menutupi stok negatif',
                        'created_at' => now(),
                        'updated_at' => now()
                    ]);
                    
                    // Tambahkan detail pembelian
                    PurchaseDetail::create([
                        'purchase_id' => $purchase->id,
                        'produk_id' => $product->id,
                        'nama_produk' => $product->nama,
                        'jumlah' => $missingStock,
                        'expired' => now()->addYears(2)->format('Y-m-d'), // Default 2 tahun dari sekarang
                        'kemasan' => 'PCS',
                        'harga_satuan' => 0, // Harga 0 karena koreksi
                        'gross_amount' => 0,
                        'discount_percentage' => 0,
                        'total' => 0,
                        'created_at' => now(),
                        'updated_at' => now()
                    ]);
                    
                    $this->info("✅ Berhasil menambahkan pembelian untuk {$product->nama} sebanyak {$missingStock} pcs");
                }
            }
            
            DB::commit();
            $this->info("\n✅ Proses perbaikan stok selesai");
            
        } catch (\Exception $e) {
            DB::rollBack();
            $this->error("❌ Terjadi kesalahan: " . $e->getMessage());
            Log::error('Error in FixNegativeStock: ' . $e->getMessage() . '\n' . $e->getTraceAsString());
            return 1;
        }
        
        return 0;
    }
}
