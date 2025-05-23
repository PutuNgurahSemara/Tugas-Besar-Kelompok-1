<?php

namespace App\Http\Controllers;

use App\Models\Produk;
use Illuminate\Support\Facades\Log;
use App\Models\Category;
use App\Models\Purchase;
use App\Models\PurchaseDetail;
use App\Models\SaleItem;
use App\Models\Setting; // Added Setting model
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Inertia\Inertia;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Carbon\Carbon;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class ProdukController extends Controller
{
    public function index(Request $request)
    {
        // Get filters from request, provide defaults
        $filters = $request->only(['search', 'perPage', 'sort_price']);
        $search = $filters['search'] ?? null;
        $perPage = $filters['perPage'] ?? 10;
        $sortPrice = $filters['sort_price'] ?? null; // 'asc' or 'desc'


        // Debug log untuk memeriksa parameter request
        Log::info('Memuat daftar produk', [
            'search' => $search,
            'perPage' => $perPage,
            'sort_price' => $sortPrice,
            'all_params' => $request->all()
        ]);
        
        // Log semua status produk yang ada di database
        $statusCounts = \DB::table('produk')
            ->select('status', \DB::raw('count(*) as total'))
            ->groupBy('status')
            ->get();
            
        Log::info('Jumlah produk per status:', $statusCounts->toArray());

        // Get all active products with their categories and purchase details
        $produkQuery = Produk::with(['category', 'purchaseDetails'])
                        ->select('produk.*')
                        ->where('produk.status', Produk::STATUS_ACTIVE) // Hanya tampilkan produk aktif
                        ->when($search, function ($query, $search) {
                            return $query->where('produk.nama', 'like', '%'.$search.'%');
                        });
                        
        // Add stock calculation
        $produkQuery->addSelect([
            'total_stock' => function($query) {
                $query->selectRaw('COALESCE(SUM(jumlah), 0)')
                    ->from('purchase_details')
                    ->whereColumn('produk_id', 'produk.id')
                    ->where('jumlah', '>', 0);
            },
            'batch_count' => function($query) {
                $query->selectRaw('COUNT(*)')
                    ->from('purchase_details')
                    ->whereColumn('produk_id', 'produk.id')
                    ->where('jumlah', '>', 0);
            }
        ]);
                        
        // Log the raw SQL query
        $rawQuery = Str::replaceArray('?', $produkQuery->getBindings(), $produkQuery->toSql());
        Log::info('Query Produk:', ['query' => $rawQuery]);
                        
        // Tambahkan log untuk mengecek jumlah produk yang ditemukan
        $produkCount = (clone $produkQuery)->count();
        Log::info('Jumlah produk yang akan ditampilkan: ' . $produkCount);
        
        // Urutkan berdasarkan nama atau harga
        if ($sortPrice && in_array($sortPrice, ['asc', 'desc'])) {
            $produkQuery->orderBy('produk.harga', $sortPrice);
        } else {
            $produkQuery->orderBy('produk.nama');
        }
        
        $produk = $produkQuery->paginate((int)$perPage)->withQueryString();
        
        // Fetch low stock threshold setting
        $lowStockThreshold = (int) Setting::getValue('low_stock_threshold', 10);

        // Transform products to include stock information from purchase details
        $produk->getCollection()->transform(function ($item) {
            // Reload purchaseDetails if they are not fully loaded due to groupBy
            $item->load('purchaseDetails');
            $totalStock = $item->purchaseDetails->sum('jumlah');
            
            $earliestExpiry = $item->purchaseDetails()
                ->where('jumlah', '>', 0) // Consider only batches with stock for expiry
                ->whereNotNull('expired')
                ->orderBy('expired')
                ->first();
                
            $item->total_stock = $totalStock;
            $item->earliest_expiry = $earliestExpiry ? $earliestExpiry->expired : null;
            
            return $item;
        });
        
        return Inertia::render('Produk/Index', [
            'produk' => $produk,
            'filters' => [
                'search' => $search,
                'perPage' => (int)$perPage,
                'sort_price' => $sortPrice,
            ],
            'pageTitle' => 'All Products',
            'lowStockThreshold' => $lowStockThreshold, // Pass the threshold to the view
            'links' => [
                'outstock' => route('produk.outstock'),
                'expired' => route('produk.expired'),
                'drafts' => route('produk.drafts'),
            ]
        ]);
    }

    /**
     * List all draft products that need to be reviewed and activated
     */
    public function drafts(Request $request)
    {
        $filters = $request->only(['search', 'perPage']);
        $search = $filters['search'] ?? null;
        $perPage = $filters['perPage'] ?? 10;

        // Get draft products with their purchase details
        $produkQuery = Produk::with(['category', 'purchaseDetails'])
                        ->select('produk.*')
                        ->leftJoin('purchase_details', 'produk.id', '=', 'purchase_details.produk_id')
                        ->where('produk.status', Produk::STATUS_DRAFT)
                        ->groupBy('produk.id')
                        ->when($search, function ($query, $search) {
                            return $query->where('produk.nama', 'like', '%'.$search.'%');
                        })
                        ->orderBy('produk.created_at', 'desc');

        $produk = $produkQuery->paginate((int)$perPage)->withQueryString();

        // Transform products to include stock information
        $produk->getCollection()->transform(function ($item) {
            $item->load('purchaseDetails');
            $totalStock = $item->purchaseDetails->sum('jumlah');
            
            $earliestExpiry = $item->purchaseDetails()
                ->where('jumlah', '>', 0)
                ->whereNotNull('expired')
                ->orderBy('expired')
                ->first();
                
            $item->total_stock = $totalStock;
            $item->earliest_expiry = $earliestExpiry ? $earliestExpiry->expired : null;
            
            return $item;
        });

        return Inertia::render('Produk/Drafts', [
            'produk' => $produk,
            'filters' => [
                'search' => $search,
                'perPage' => (int)$perPage,
            ],
            'pageTitle' => 'Draft Products',
            'links' => [
                'index' => route('produk.index'),
            ]
        ]);
    }

    public function create(Request $request) // Added Request $request
    {
        $categories = Category::orderBy('name')->get(['id', 'name']);
        $defaultProfitMargin = (float) Setting::getValue('default_profit_margin', 20);
        
        $purchaseDetails = PurchaseDetail::with(['purchase'])
            ->whereNull('produk_id')
            ->orWhere(function($query) {
                $query->whereNotNull('produk_id')
                      ->where('jumlah', '>', 0);
            })
            ->get();
        
        $availablePurchaseDetails = $purchaseDetails->map(function($detail) {
            return [
                'id' => $detail->id,
                'purchase_id' => $detail->purchase_id,
                'purchase_no' => $detail->purchase->no_faktur ?? 'Unknown',
                'supplier' => $detail->purchase->pbf ?? 'Unknown',
                'nama_produk' => $detail->nama_produk,
                'jumlah' => $detail->jumlah,
                'kemasan' => $detail->kemasan,
                'harga_satuan' => $detail->harga_satuan,
                'expired' => $detail->expired ? $detail->expired->format('Y-m-d') : null,
                'available_quantity' => $detail->jumlah,
            ];
        });
        
        // Get all products and create a mapping of product names to their data
        $existingProductsData = Produk::select('id', 'nama', 'category_id', 'margin', 'image')
                                    ->get()
                                    ->mapWithKeys(function ($produk) {
                                        return [
                                            $produk->nama => [
                                                'id' => $produk->id,
                                                'category_id' => $produk->category_id,
                                                'margin' => $produk->margin,
                                                'image' => $produk->image,
                                            ]
                                        ];
                                    })
                                    ->toArray();

        // Prepare initial data for prefilling form if source_product_id is provided
        $initialCategoryId = null;
        $initialProductName = null;
        $initialProductImage = null;
        $initialMargin = $defaultProfitMargin; // Default to system's default margin

        $sourceProductId = $request->query('source_product_id');
        if ($sourceProductId) {
            $sourceProduct = Produk::find($sourceProductId);
            if ($sourceProduct) {
                $initialProductName = $sourceProduct->nama;
                $initialCategoryId = $sourceProduct->category_id;
                $initialProductImage = $sourceProduct->image;
                // Use product's own margin if set, otherwise fall back to default
                $initialMargin = $sourceProduct->margin ?? $defaultProfitMargin; 
            }
        }

        return Inertia::render('Produk/Create', [
            'categories' => $categories,
            'availablePurchaseDetails' => $availablePurchaseDetails,
            'existingProductsData' => $existingProductsData,
            'defaultProfitMargin' => $defaultProfitMargin,
            'initialCategoryId' => $initialCategoryId,
            'initialProductName' => $initialProductName,
            'initialProductImage' => $initialProductImage,
            'initialMargin' => $initialMargin,
        ]);
    }

    public function store(Request $request)
    {
        if ($request->input('category_id') === '_none') {
            $request->merge(['category_id' => null]);
        }

        $validated = $request->validate([
            'nama' => 'required|string|max:50', // This will be set based on custom_nama or purchaseDetail name
            'custom_nama' => 'nullable|string|max:50',
            // 'harga' => 'required|integer|min:0', // Harga will be calculated
            'margin' => 'nullable|numeric|min:0|max:100',
            'category_id' => 'nullable|exists:categories,id',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,gif,svg|max:2048',
            'purchase_detail_id' => 'required|exists:purchase_details,id',
            'quantity' => 'required|integer|min:1', // This is the quantity to take from the purchase_detail for this new product
        ]);

        // Get the selected purchase detail (source batch)
        $sourcePurchaseDetail = PurchaseDetail::findOrFail($validated['purchase_detail_id']);
        
        // Validate that the requested quantity doesn't exceed available quantity in the source purchase detail
        Log::info('Memeriksa ketersediaan stok', [
            'requested_quantity' => $validated['quantity'],
            'available_quantity' => $sourcePurchaseDetail->jumlah,
            'product_name' => $sourcePurchaseDetail->nama_produk,
            'purchase_detail_id' => $sourcePurchaseDetail->id
        ]);
        
        if ($validated['quantity'] > $sourcePurchaseDetail->jumlah) {
            $errorMessage = 'Jumlah melebihi stok pembelian yang tersedia. Maksimum yang diizinkan: ' . $sourcePurchaseDetail->jumlah;
            Log::error($errorMessage, [
                'requested' => $validated['quantity'],
                'available' => $sourcePurchaseDetail->jumlah,
                'product' => $sourcePurchaseDetail->nama_produk
            ]);
            throw ValidationException::withMessages([
                'quantity' => $errorMessage,
            ]);
        }      
        $finalProductName = !empty($validated['custom_nama']) ? $validated['custom_nama'] : $sourcePurchaseDetail->nama_produk;

        DB::beginTransaction();
        try {
            
            Log::info('Mencari produk dengan nama: ' . $finalProductName);
            $produk = Produk::where('nama', $finalProductName)->first();
            $isNewProduct = !$produk;
            
            if ($isNewProduct) {
                Log::info('Produk baru akan dibuat: ' . $finalProductName);
            } else {
                Log::info('Produk sudah ada, akan direstock: ' . $finalProductName . ' (ID: ' . $produk->id . ')');
            }

            if ($isNewProduct) {
                // Creating a new product
                $costPrice = (float) $sourcePurchaseDetail->harga_satuan;
                $marginPercentage = (float) ($validated['margin'] ?? 0);
                $sellingPrice = (float) round($costPrice * (1 + $marginPercentage / 100), 2);

                Log::info('Menghitung harga jual', [
                    'harga_beli' => $costPrice,
                    'margin' => $marginPercentage . '%',
                    'harga_jual' => $sellingPrice
                ]);

                // Pastikan status selalu aktif untuk produk baru yang dibuat dari gudang
                $productDataForCreate = [
                    'nama' => $finalProductName,
                    'harga' => $sellingPrice,
                    'margin' => $marginPercentage,
                    'category_id' => $validated['category_id'] ?? null,
                    'image' => null,
                    'status' => Produk::STATUS_ACTIVE, // Use the status constant from the Produk model
                ];
                
                Log::info('Membuat produk baru dengan status: ' . $productDataForCreate['status'], $productDataForCreate);
                
                Log::debug('Data produk yang akan dibuat', $productDataForCreate);
                if ($request->hasFile('image')) {
                    $productDataForCreate['image'] = $request->file('image')->store('produk_images', 'public');
                }
                $produk = Produk::create($productDataForCreate);
            } else {
                // Restocking an existing product. We use the existing $produk.
                // We do not update its name, category, margin, image, or harga from this form.
                // These are managed via the "Edit Product" page.
                
                // Update status to active if it was draft
                if ($produk->status === Produk::STATUS_DRAFT) {
                    Log::info('Mengubah status produk dari draft ke active', [
                        'produk_id' => $produk->id,
                        'produk_nama' => $produk->nama
                    ]);
                    $produk->status = Produk::STATUS_ACTIVE;
                    $produk->save();
                }
            }
            
            $batchQuantity = $validated['quantity']; 

            // Reduce quantity from the source purchase detail
            $sourcePurchaseDetail->jumlah -= $batchQuantity;
            if ($sourcePurchaseDetail->jumlah > 0) {
                $sourcePurchaseDetail->save();
            } else {
                // If source is depleted, delete it.
                // This assumes source details with produk_id=NULL are pure warehouse stock.
                $sourcePurchaseDetail->delete();
            }
            
            // Create a new PurchaseDetail record for this batch, linked to the product
            $newProductBatch = new PurchaseDetail();
            $newProductBatch->purchase_id = (int) $sourcePurchaseDetail->purchase_id;
            $newProductBatch->produk_id = (int) $produk->id;
            $newProductBatch->nama_produk = $produk->nama; // Use the product's name
            $newProductBatch->expired = $sourcePurchaseDetail->expired;
            $newProductBatch->jumlah = (int) $batchQuantity;
            $newProductBatch->kemasan = $sourcePurchaseDetail->kemasan;
            $newProductBatch->harga_satuan = (float) $sourcePurchaseDetail->harga_satuan; // Cost for this batch
            $newProductBatch->total = (float) ($sourcePurchaseDetail->harga_satuan * $batchQuantity); // Total cost for this batch
            
            Log::debug('Menyimpan detail pembelian baru', [
                'produk_id' => $newProductBatch->produk_id,
                'nama_produk' => $newProductBatch->nama_produk,
                'jumlah' => $newProductBatch->jumlah,
                'harga_satuan' => $newProductBatch->harga_satuan,
                'total' => $newProductBatch->total
            ]);
            
            $newProductBatch->save();

            DB::commit();

            $successMessage = sprintf(
                'Produk %s %s dengan stok %d. %s',
                $produk->nama,
                $isNewProduct ? 'berhasil dibuat' : 'berhasil direstok',
                $batchQuantity,
                $newProductBatch->expired ? 'Tanggal kadaluwarsa: ' . Carbon::parse($newProductBatch->expired)->format('d/m/Y') : 'Tidak ada tanggal kadaluwarsa'
            );
            
            Log::info('Produk berhasil diproses', [
                'produk_id' => $produk->id,
                'produk_nama' => $produk->nama,
                'stok_ditambahkan' => $batchQuantity,
                'is_new' => $isNewProduct
            ]);

            // Prepare success message
            $successMessage = "Produk {$produk->nama} berhasil " . ($isNewProduct ? 'dibuat' : 'direstok') . " dengan stok {$batchQuantity}.";
            if ($newProductBatch->expired) {
                $successMessage .= " Tanggal kadaluwarsa: " . Carbon::parse($newProductBatch->expired)->format('d/m/Y');
            }

            // Return Inertia response
            return redirect()->route('produk.index')
                ->with('success', $successMessage);
                
        } catch (\Exception $e) {
            DB::rollBack();
            $errorContext = [
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString(),
                'request_data' => $request->all(),
                'final_product_name' => $finalProductName ?? 'not set',
                'is_new_product' => $isNewProduct ?? 'not set',
                'source_purchase_detail' => isset($sourcePurchaseDetail) ? [
                    'id' => $sourcePurchaseDetail->id,
                    'product_name' => $sourcePurchaseDetail->nama_produk,
                    'quantity' => $sourcePurchaseDetail->jumlah,
                    'purchase_id' => $sourcePurchaseDetail->purchase_id
                ] : 'not set'
            ];
            
            Log::error('Error in ProdukController@store: ' . $e->getMessage(), $errorContext);
            
            return back()
                ->with('error', 'Terjadi kesalahan: ' . $e->getMessage())
                ->withInput();
        }
    }

    public function edit(Produk $produk)
    {
        $categories = Category::orderBy('name')->get(['id', 'name']);
        $defaultProfitMargin = (float) Setting::getValue('default_profit_margin', 20); // Get default margin
        
        // Eager load relations
        $produk->load(['category', 'purchaseDetails']);
        
        // Get current purchase details for this product
        $currentPurchaseDetails = $produk->purchaseDetails;
        
        // Get all available purchase details (not assigned to any product or with remaining stock)
        $availablePurchaseDetails = PurchaseDetail::with(['purchase'])
            ->where(function($query) use ($produk) {
                $query->whereNull('produk_id')
                      ->orWhere(function($q) use ($produk) {
                          $q->where('produk_id', $produk->id)
                            ->where('jumlah', '>', 0);
                      })
                      ->orWhere(function($q) {
                          $q->whereNotNull('produk_id')
                            ->where('jumlah', '>', 0);
                      });
            })
            ->get();
        
        // Transform purchase details to a format suitable for the frontend
        $formattedPurchaseDetails = $availablePurchaseDetails->map(function($detail) use ($produk) {
            $isCurrentDetail = $detail->produk_id === $produk->id;
            
            return [
                'id' => $detail->id,
                'purchase_id' => $detail->purchase_id,
                'purchase_no' => $detail->purchase->no_faktur ?? 'Unknown',
                'supplier' => $detail->purchase->pbf ?? 'Unknown',
                'nama_produk' => $detail->nama_produk,
                'jumlah' => $detail->jumlah,
                'kemasan' => $detail->kemasan,
                'harga_satuan' => $detail->harga_satuan,
                'expired' => $detail->expired ? $detail->expired->format('Y-m-d') : null,
                'is_current' => $isCurrentDetail,
                'available_quantity' => $detail->jumlah,
            ];
        });
        
        // Calculate total stock from all purchase details for this product
        $totalStock = $currentPurchaseDetails->sum('jumlah');
        
        return Inertia::render('Produk/Edit', [
            'produk' => $produk,
            'categories' => $categories,
            'availablePurchaseDetails' => $formattedPurchaseDetails,
            'totalStock' => $totalStock,
            'currentPurchaseDetails' => $currentPurchaseDetails,
            'defaultProfitMargin' => $defaultProfitMargin, // Pass to view
        ]);
    }

    public function update(Request $request, Produk $produk)
    {
        // Start database transaction
        DB::beginTransaction();
        try {
            if ($request->input('category_id') === '_none') {
                $request->merge(['category_id' => null]);
            }

            $validated = $request->validate([
                'nama' => 'required|string|max:50',
                'custom_nama' => 'nullable|string|max:50',
                'harga' => 'required|integer|min:0',
                'margin' => 'nullable|numeric|min:0|max:100',
                'category_id' => 'nullable|exists:categories,id',
                'image' => 'nullable|image|mimes:jpeg,png,jpg,gif,svg|max:2048',
                'purchase_details' => 'array',
                'purchase_details.*.id' => 'required|exists:purchase_details,id',
                'purchase_details.*.quantity' => 'required|integer|min:0',
            ]);

            // Use custom name if provided
            if (!empty($validated['custom_nama'])) {
                $validated['nama'] = $validated['custom_nama'];
            }
            
            // Remove fields not in the Produk model
            unset($validated['custom_nama']);
            $purchaseDetails = $validated['purchase_details'] ?? [];
            unset($validated['purchase_details']);

            // Handle image update
            if ($request->hasFile('image')) {
                if ($produk->image) {
                    Storage::disk('public')->delete($produk->image);
                }
                $validated['image'] = $request->file('image')->store('produk_images', 'public');
            }

            // Update product with validated data
            $produk->update($validated);
            
            // Process purchase details
            if (!empty($purchaseDetails)) {
                // Get current purchase details for this product
                $currentDetails = $produk->purchaseDetails()->get();
                
                foreach ($purchaseDetails as $detailData) {
                    $purchaseDetail = PurchaseDetail::findOrFail($detailData['id']);
                    $requestedQuantity = (int)$detailData['quantity'];
                    
                    // Find if this detail is currently associated with the product
                    $currentDetail = $currentDetails->firstWhere('id', $purchaseDetail->id);
                    
                    if ($currentDetail) {
                        // This is an existing detail - handle quantity changes
                        if ($requestedQuantity === 0) {
                            // Return stock to warehouse by removing product association
                            $purchaseDetail->produk_id = null;
                            $purchaseDetail->save();
                        } else if ($requestedQuantity !== $currentDetail->jumlah) {
                            // Quantity changed
                            if ($requestedQuantity < $currentDetail->jumlah) {
                                // Stock decreased - return difference to warehouse
                                $returnQuantity = $currentDetail->jumlah - $requestedQuantity;
                                
                                // Create or update warehouse record
                                $warehouseDetail = PurchaseDetail::firstOrNew([
                                    'purchase_id' => $purchaseDetail->purchase_id,
                                    'produk_id' => null,
                                    'nama_produk' => $purchaseDetail->nama_produk,
                                    'kemasan' => $purchaseDetail->kemasan,
                                    'harga_satuan' => $purchaseDetail->harga_satuan,
                                    'expired' => $purchaseDetail->expired,
                                ]);
                                
                                $warehouseDetail->jumlah = ($warehouseDetail->jumlah ?? 0) + $returnQuantity;
                                $warehouseDetail->save();
                                
                                // Update product detail quantity
                                $purchaseDetail->jumlah = $requestedQuantity;
                                $purchaseDetail->save();
                            } else {
                                // Stock increased - check if we have enough in warehouse
                                $increaseQuantity = $requestedQuantity - $currentDetail->jumlah;
                                
                                // Look for available stock in warehouse
                                $warehouseDetail = PurchaseDetail::where('purchase_id', $purchaseDetail->purchase_id)
                                    ->whereNull('produk_id')
                                    ->where('nama_produk', $purchaseDetail->nama_produk)
                                    ->where('jumlah', '>=', $increaseQuantity)
                                    ->first();
                                    
                                if (!$warehouseDetail) {
                                    throw ValidationException::withMessages([
                                        'purchase_details' => 'Insufficient stock in warehouse for ' . $purchaseDetail->nama_produk
                                    ]);
                                }
                                
                                // Reduce warehouse stock
                                $warehouseDetail->jumlah -= $increaseQuantity;
                                $warehouseDetail->save();
                                
                                // Update product detail quantity
                                $purchaseDetail->jumlah = $requestedQuantity;
                                $purchaseDetail->save();
                            }
                        }
                    } else {
                        // This is a new detail being added to the product
                        if ($requestedQuantity > 0) {
                            // Check warehouse stock
                            $warehouseDetail = PurchaseDetail::where('purchase_id', $purchaseDetail->purchase_id)
                                ->whereNull('produk_id')
                                ->where('nama_produk', $purchaseDetail->nama_produk)
                                ->where('jumlah', '>=', $requestedQuantity)
                                ->first();
                                
                            if (!$warehouseDetail) {
                                throw ValidationException::withMessages([
                                    'purchase_details' => 'Insufficient stock in warehouse for ' . $purchaseDetail->nama_produk
                                ]);
                            }
                            
                            // Create new product detail
                            $newDetail = $warehouseDetail->replicate();
                            $newDetail->produk_id = $produk->id;
                            $newDetail->jumlah = $requestedQuantity;
                            $newDetail->save();
                            
                            // Reduce warehouse stock
                            $warehouseDetail->jumlah -= $requestedQuantity;
                            $warehouseDetail->save();
                        }
                    }
                }
            }

            DB::commit();
            return redirect()->route('produk.index')
                   ->with('success', 'Product updated successfully.');
        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()
                   ->with('error', 'Failed to update product: ' . $e->getMessage())
                   ->withInput();
        }
    }

    public function destroy(Produk $produk)
    {
        // Start a database transaction
        DB::beginTransaction();
        try {
            // Delete image from storage if exists
            if ($produk->image) {
                Storage::disk('public')->delete($produk->image);
            }

            // Return all stock to original purchase details by setting produk_id to null
            $produk->purchaseDetails()->update(['produk_id' => null]);
            
            // Check if product is used in sales
            $salesCount = SaleItem::where('produk_id', $produk->id)->count();
            if ($salesCount > 0) {
                // If product is used in sales, use soft delete to maintain history
                $produk->delete();
                DB::commit();
                return redirect()->route('produk.index')
                       ->with('success', 'Product has been archived and stock returned to warehouse.');
            } else {
                // If product is not used in sales, we can hard delete it
                $produk->forceDelete();
                DB::commit();
                return redirect()->route('produk.index')
                       ->with('success', 'Product has been deleted and stock returned to warehouse.');
            }
        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->route('produk.index')
                   ->with('error', 'Failed to delete product: ' . $e->getMessage());
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(Produk $produk)
    {
        // Load relations
        $produk->load(['category', 'purchaseDetails.purchase']);
        
        // Calculate total stock from purchase details
        $totalStock = $produk->purchaseDetails->sum('jumlah');
        
        // Get purchase details grouped by expiry date
        $stockByExpiry = $produk->purchaseDetails
            ->where('jumlah', '>', 0)
            ->groupBy(function($detail) {
                return $detail->expired ? $detail->expired->format('Y-m-d') : 'No Expiry';
            })
            ->map(function($group) {
                return [
                    'quantity' => $group->sum('jumlah'),
                    'details' => $group->map(function($detail) {
                        return [
                            'id' => $detail->id,
                            'purchase_no' => $detail->purchase->no_faktur ?? 'Unknown',
                            'supplier' => $detail->purchase->pbf ?? 'Unknown',
                            'jumlah' => $detail->jumlah,
                            'kemasan' => $detail->kemasan,
                            'harga_satuan' => $detail->harga_satuan,
                        ];
                    }),
                ];
            });

        // Determine the single earliest expiry date for simple display
        $earliestExpiryDate = null;
        if ($produk->purchaseDetails->isNotEmpty()) {
            $earliestDetail = $produk->purchaseDetails
                ->whereNotNull('expired')
                ->filter(fn($detail) => $detail->jumlah > 0) // Consider only details with stock
                ->sortBy('expired')
                ->first();
            if ($earliestDetail) {
                $earliestExpiryDate = $earliestDetail->expired; // Carbon instance or null
            }
        }
        
        return Inertia::render('Produk/Show', [
            'produk' => $produk,
            'totalStock' => $totalStock,
            'stockByExpiry' => $stockByExpiry, // For detailed breakdown if needed
            'earliestExpiryDate' => $earliestExpiryDate ? $earliestExpiryDate->toISOString() : null, // Pass as ISO string
        ]);
    }

    // Method to display products that are out of stock
    public function outstock(Request $request)
    {
        $filters = $request->only(['search', 'perPage']);
        $search = $filters['search'] ?? null;
        $perPage = $filters['perPage'] ?? 10;

        // Fetch low stock threshold setting
        $lowStockThreshold = (int) Setting::getValue('low_stock_threshold', 10);

        // Get products with low stock (total quantity from purchase_details)
        $produk = Produk::with(['category', 'purchaseDetails'])
            ->select('produk.*')
            ->leftJoin('purchase_details', 'produk.id', '=', 'purchase_details.produk_id')
            ->groupBy('produk.id')
            ->havingRaw('COALESCE(SUM(purchase_details.jumlah), 0) <= ?', [$lowStockThreshold])  // Use dynamic threshold
            ->when($search, function ($query, $search) {
                return $query->where('produk.nama', 'like', '%'.$search.'%');
            })
            ->latest()
            ->paginate((int)$perPage)
            ->withQueryString();

        // Add total stock information to each product
        $produk->getCollection()->transform(function ($item) {
            $item->total_stock = $item->purchaseDetails->sum('jumlah');
            return $item;
        });

        return Inertia::render('Produk/Index', [
            'produk' => $produk,
            'filters' => [
                'search' => $search,
                'perPage' => (int)$perPage,
            ],
            'pageTitle' => 'Low Stock Products',
            'lowStockThreshold' => $lowStockThreshold, // Pass the threshold to the view
            'links' => [
                'all' => route('produk.index'),
                'expired' => route('produk.expired'),
            ]
        ]);
    }

    // Method to display products with expired or near-expiry items
    public function expired(Request $request)
    {
        $filters = $request->only(['search', 'perPage']);
        $search = $filters['search'] ?? null;
        $perPage = $filters['perPage'] ?? 10;

        // Get products that have expired or will expire within 30 days
        $produk = Produk::with(['category', 'purchaseDetails'])
                        ->where('status', 'active') // Hanya tampilkan produk aktif
                        ->whereHas('purchaseDetails', function($query) {
                            $query->whereNotNull('expired')
                                  ->where(function($q) {
                                      $q->whereDate('expired', '<=', Carbon::today()->addDays(30))
                                        ->where('jumlah', '>', 0);
                                  });
                        })
                        ->when($search, function ($query, $search) {
                            return $query->where('nama', 'like', '%'.$search.'%');
                        })
                        ->latest()
                        ->paginate((int)$perPage)
                        ->withQueryString();

        // Transform collection to include expiry information
        $produk->getCollection()->transform(function ($item) {
            // Ensure purchaseDetails are loaded for each item
            $item->load('purchaseDetails');

            $item->expiry_statuses = $item->purchaseDetails
                ->where('jumlah', '>', 0)
                ->whereNotNull('expired')
                ->groupBy(function($detail) {
                    $daysUntilExpiry = Carbon::parse($detail->expired)->diffInDays(Carbon::today(), false);
                    // Note: diffInDays returns positive if date1 is before date2.
                    // If expired is in the past, $daysUntilExpiry will be negative.
                    if ($daysUntilExpiry < 0) { // Expired
                        return 'expired';
                    } else { // Near expiry or not (daysUntilExpiry >= 0)
                        return 'near_expiry'; // The controller query already filters for <= 30 days
                    }
                })
                ->map(function($group) {
                    return $group->sum('jumlah');
                });

            // Also calculate and set earliest_expiry for consistency with Index view
            $earliestExpiry = $item->purchaseDetails()
                ->where('jumlah', '>', 0)
                ->whereNotNull('expired')
                ->orderBy('expired')
                ->first();
            $item->earliest_expiry = $earliestExpiry ? $earliestExpiry->expired : null;
            $item->total_stock = $item->purchaseDetails->sum('jumlah'); // Also add total_stock
            
            return $item;
        });

        return Inertia::render('Produk/Index', [ // Changed view to Produk/Index
            'produk' => $produk,
            'filters' => [
                'search' => $search,
                'perPage' => (int)$perPage,
            ],
            'pageTitle' => 'Expired and Near-Expiry Products',
            'links' => [
                'all' => route('produk.index'),
                'outstock' => route('produk.outstock'),
            ]
        ]);
    }
    
    /**
     * Activate a draft product
     *
     * @param  \App\Models\Produk  $produk
     * @return \Illuminate\Http\Response
     */
    public function activate(Produk $produk)
    {
        // Check if the product is in draft status
        if ($produk->status !== Produk::STATUS_DRAFT) {
            return response()->json([
                'message' => 'Only draft products can be activated',
            ], 422);
        }
        
        // Update the status to active
        $produk->status = Produk::STATUS_ACTIVE;
        $produk->save();
        
        return response()->json([
            'message' => 'Product activated successfully',
            'data' => $produk->fresh(),
        ]);
    }
}
