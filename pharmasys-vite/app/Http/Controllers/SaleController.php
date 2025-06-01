<?php

namespace App\Http\Controllers;

use App\Models\Sale;
use App\Models\Produk;
use App\Models\Setting;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use App\Models\SaleItem;
use Exception;
use Illuminate\Support\Facades\Log;

class SaleController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth');
        $this->middleware('permission:view-sales-list')->only(['index']);
        $this->middleware('permission:view-sales-details')->only(['show']);
        $this->middleware('permission:create-sale')->only(['create', 'store']);
        $this->middleware('permission:delete-sale')->only(['destroy']);
    }

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $filters = $request->only(['search', 'perPage']);
        $search = $filters['search'] ?? null;
        $perPage = $filters['perPage'] ?? 10;

        $sales = Sale::with(['user', 'items.produk'])
                    ->when($search, function ($query, $search) {
                        return $query->where('id', 'like', '%'.$search.'%');
                    })
                    ->latest()
                    ->paginate((int)$perPage)
                    ->withQueryString();

        return Inertia::render('Sales/Index', [
            'sales' => $sales,
            'filters' => [
                'search' => $search,
                'perPage' => (int)$perPage,
            ]
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        $today = now()->format('Y-m-d');
        
        $products = Produk::with(['purchaseDetails' => function($query) use ($today) {
            $query->where('jumlah', '>', 0)
                ->where(function($q) use ($today) {
                    $q->where('expired', '>', $today)
                      ->orWhereNull('expired');
                });
        }])
        ->where('status', Produk::STATUS_ACTIVE)
        ->whereHas('purchaseDetails', function($query) use ($today) {
            $query->where('jumlah', '>', 0)
                ->where(function($q) use ($today) {
                    $q->where('expired', '>', $today)
                      ->orWhereNull('expired');
                });
        })
        ->orderBy('nama')
        ->get()
        ->filter(function($product) {
            // Hanya ambil produk yang memiliki stok valid (tidak kadaluarsa)
            return $product->purchaseDetails->sum('jumlah') > 0;
        })
        ->map(function($product) {
            $validStock = $product->purchaseDetails->sum('jumlah');
            
            return [
                'id' => $product->id,
                'nama' => $product->nama,
                'harga' => $product->harga,
                'quantity' => $validStock,
                'image' => $product->image,
            ];
        });
        
        return Inertia::render('Sales/Create', [
            'products' => $products
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'items' => 'required|array|min:1',
            'items.*.produk_id' => 'required|exists:produk,id',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.price' => 'required|numeric|min:0',
            'payment_method' => 'nullable|string',
            'amount_paid' => 'nullable|numeric|min:0',
        ]);

        // Hitung total price di backend
        $calculatedTotalPrice = 0;
        $today = now()->format('Y-m-d');
        $produkIds = array_column($validated['items'], 'produk_id');
        
        // Ambil produk dengan stok yang valid (tidak kadaluarsa)
        $produksInDb = Produk::with(['purchaseDetails'])
            ->whereIn('id', $produkIds)
            ->get()
            ->map(function($produk) use ($today) {
                // Filter stok yang valid secara manual
                $validPurchaseDetails = $produk->purchaseDetails->filter(function($detail) use ($today) {
                    return $detail->jumlah > 0 && 
                           ($detail->expired === null || $detail->expired > $today);
                })->sortBy('expired'); // Urutkan berdasarkan yang paling dekat kadaluarsanya
                
                $validStock = $validPurchaseDetails->sum('jumlah');
                
                return [
                    'id' => $produk->id,
                    'harga' => $produk->harga,
                    'stock' => $validStock,
                    'purchaseDetails' => $validPurchaseDetails
                ];
            })
            ->keyBy('id');

        // Validasi stok yang tersedia
        foreach ($validated['items'] as $itemData) {
            $produkInfo = $produksInDb[$itemData['produk_id']] ?? null;
            
            if (!$produkInfo) {
                throw new Exception('Produk tidak ditemukan atau sudah tidak tersedia');
            }
            
            // Pastikan quantity valid
            if ($itemData['quantity'] <= 0) {
                throw new Exception('Jumlah pembelian tidak valid');
            }
            
            // Dapatkan data produk lengkap untuk perhitungan stok
            $produk = Produk::with(['purchaseDetails', 'saleItems'])->findOrFail($itemData['produk_id']);
            
            // Hitung stok yang tersedia dengan lebih akurat
            $totalPurchased = $produk->purchaseDetails->sum('jumlah');
            $totalSold = $produk->saleItems->sum('quantity');
            $availableStock = $totalPurchased - $totalSold;
            
            // Cek stok yang tersedia setelah transaksi ini
            $stockAfterTransaction = $availableStock - $itemData['quantity'];
            
            if ($availableStock < $itemData['quantity']) {
                throw new Exception('Stok tidak mencukupi untuk produk: ' . $produk->nama . '. Stok tersedia: ' . $availableStock);
            }
            
            // Peringatan jika stok akan menjadi rendah setelah transaksi
            $lowStockThreshold = (int) Setting::getValue('low_stock_threshold', 10);
            if ($stockAfterTransaction <= $lowStockThreshold) {
                Log::warning('Produk ' . $produk->nama . ' akan menjadi low stock setelah transaksi. Stok tersisa: ' . $stockAfterTransaction);
            }
            
            $price = $produkInfo['harga'];
            $calculatedTotalPrice += $price * $itemData['quantity'];
        }

        DB::beginTransaction();

        try {
            $sale = Sale::create([
                'user_id' => Auth::id(),
                'total_price' => $calculatedTotalPrice,
                'payment_method' => $validated['payment_method'] ?? 'Cash',
                'amount_paid' => $validated['amount_paid'] ?? $calculatedTotalPrice,
            ]);

            $lowStockProducts = [];
            
            foreach ($validated['items'] as $itemData) {
                $produk = Produk::with('purchaseDetails')->findOrFail($itemData['produk_id']);
                $price = $produksInDb[$itemData['produk_id']]['harga'];
                
                // Create sale item
                SaleItem::create([
                    'sale_id' => $sale->id,
                    'produk_id' => $itemData['produk_id'],
                    'quantity' => $itemData['quantity'],
                    'price' => $price,
                ]);

                // Reduce stock from purchase details with additional validation
                $remainingQty = $itemData['quantity'];
                $deductedDetails = [];
                
                // Sort by expired date (FIFO - First In First Out)
                $purchaseDetails = $produk->purchaseDetails->sortBy('expired');
                
                foreach ($purchaseDetails as $detail) {
                    if ($remainingQty <= 0) break;
                    
                    // Pastikan jumlah yang akan dikurangi tidak melebihi stok yang ada
                    $deductQty = min($remainingQty, max(0, $detail->jumlah));
                    
                    if ($deductQty > 0) {
                        $detail->jumlah -= $deductQty;
                        $detail->save();
                        $deductedDetails[] = [
                            'purchase_detail_id' => $detail->id,
                            'quantity' => $deductQty,
                            'before' => $detail->jumlah + $deductQty,
                            'after' => $detail->jumlah
                        ];
                        $remainingQty -= $deductQty;
                    }
                }
                
                // Jika masih ada sisa yang belum terpotong (seharusnya tidak terjadi karena sudah divalidasi)
                if ($remainingQty > 0) {
                    Log::error('Insufficient stock for product ID: ' . $produk->id . 
                              '. Remaining quantity: ' . $remainingQty);
                    throw new Exception('Stok tidak mencukupi untuk produk: ' . $produk->nama);
                }
                
                // Log detail pengurangan stok untuk audit
                Log::info('Stock deduction for product ID ' . $produk->id . ':', [
                    'sale_id' => $sale->id,
                    'product_name' => $produk->nama,
                    'total_quantity' => $itemData['quantity'],
                    'deductions' => $deductedDetails
                ]);
                
                // Refresh to get latest stock data
                $produk->refresh();
                
                // Collect products that are now low in stock
                if ($produk->is_low_stock) {
                    $lowStockProducts[] = $produk;
                }
            }
            
            // Create notifications for low stock products
            if (!empty($lowStockProducts)) {
                $notificationService = app(\App\Services\NotificationService::class);
                foreach ($lowStockProducts as $produk) {
                    $lowStockThreshold = (int) \App\Models\Setting::getValue('low_stock_threshold', 10);
                    $title = 'Stok Produk Menipis';
                    $description = "Stok {$produk->nama} tersisa {$produk->available_stock} (minimum: {$lowStockThreshold})";
                    $link = route('produk.edit', $produk->id);
                    
                    $notificationService->createAdminNotification(
                        $title, 
                        $description, 
                        'low_stock', 
                        $link, 
                        [
                            'product_id' => $produk->id,
                            'current_stock' => $produk->available_stock,
                            'min_stock' => $lowStockThreshold
                        ]
                    );
                }
            }

            DB::commit();
            return redirect()->route('sales.index')->with('success', 'Sale completed successfully.');

        } catch (Exception $e) {
            DB::rollBack();
            Log::error('Failed to process sale: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
                'request_data' => $request->all()
            ]);
            return back()->withInput()->with('error', 'Failed to process sale: ' . $e->getMessage());
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(Sale $sale)
    {
        $sale->load(['user', 'items.produk']);
        return Inertia::render('Sales/Show', [
            'sale' => $sale,
            'canDelete' => Auth::user()->hasRole('admin')
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Sale $sale)
    {
        return redirect()->route('sales.index');
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Sale $sale)
    {
        return redirect()->route('sales.index');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Sale $sale)
    {
        if (!Auth::user()->can('delete-sale')) {
            return redirect()->back()->with('error', 'You do not have permission to delete sales transactions');
        }

        DB::beginTransaction();
        try {
            // Return stock for each item
            foreach ($sale->items as $item) {
                if ($item->produk) {
                    $remainingQty = $item->quantity;
                    foreach ($item->produk->purchaseDetails->sortBy('expired') as $detail) {
                        if ($remainingQty <= 0) break;

                        // Calculate how much stock to return to this detail
                        $returnQty = min($remainingQty, $item->quantity);
                        $detail->jumlah += $returnQty;
                        $detail->save();

                        $remainingQty -= $returnQty;
                    }
                }
            }

            // Delete the sale items
            $sale->items()->delete();
            // Delete the sale
            $sale->delete();

            DB::commit();
            return redirect()->back()->with('success', 'Transaksi berhasil dihapus.');
        } catch (Exception $e) {
            DB::rollback();
            Log::error('Error deleting sale: ' . $e->getMessage());
            return redirect()->back()->with('error', 'Gagal menghapus transaksi');
        }
    }
}
