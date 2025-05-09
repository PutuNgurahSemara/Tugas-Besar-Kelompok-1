<?php

namespace App\Http\Controllers;

use App\Models\Produk;
use App\Models\Category;
use App\Models\Purchase;
use App\Models\PurchaseDetail;
use App\Models\SaleItem;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class ProdukController extends Controller
{
    public function index(Request $request)
    {
        // Get filters from request, provide defaults
        $filters = $request->only(['search', 'perPage']);
        $search = $filters['search'] ?? null;
        $perPage = $filters['perPage'] ?? 10;

        // Get all products with their categories and purchase details
        $produk = Produk::with(['category', 'purchaseDetails'])
                        ->when($search, function ($query, $search) {
                            return $query->where('nama', 'like', '%'.$search.'%');
                        })
                        ->latest()
                        ->paginate((int)$perPage)
                        ->withQueryString();
        
        // Transform products to include stock information from purchase details
        $produk->getCollection()->transform(function ($item) {
            // Calculate total stock from purchase details
            $totalStock = $item->purchaseDetails->sum('jumlah');
            
            // Get earliest expiry date from purchase details
            $earliestExpiry = $item->purchaseDetails()
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
            ],
            'pageTitle' => 'All Products',
            'links' => [
                'outstock' => route('produk.outstock'),
                'expired' => route('produk.expired'),
            ]
        ]);
    }

    public function create()
    {
        $categories = Category::orderBy('name')->get(['id', 'name']);
        
        // Get purchase details with available stock
        $purchaseDetails = PurchaseDetail::with(['purchase'])
            ->whereNull('produk_id') // Only get details not yet assigned to a product
            ->orWhere(function($query) {
                $query->whereNotNull('produk_id')
                      ->where('jumlah', '>', 0); // Or details with remaining stock
            })
            ->get();
        
        // Transform purchase details to a format suitable for the frontend
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
                'available_quantity' => $detail->jumlah, // For now, all quantity is available
            ];
        });
        
        return Inertia::render('Produk/Create', [
            'categories' => $categories,
            'availablePurchaseDetails' => $availablePurchaseDetails
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'nama' => 'required|string|max:50',
            'custom_nama' => 'nullable|string|max:50',
            'harga' => 'required|integer|min:0',
            'margin' => 'nullable|numeric|min:0|max:100',
            'category_id' => 'nullable|exists:categories,id',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,gif,svg|max:2048',
            'purchase_detail_id' => 'required|exists:purchase_details,id',
            'quantity' => 'required|integer|min:1',
        ]);

        // Get the selected purchase detail
        $purchaseDetail = PurchaseDetail::findOrFail($validated['purchase_detail_id']);
        
        // Validate that the requested quantity doesn't exceed available quantity
        if ($validated['quantity'] > $purchaseDetail->jumlah) {
            throw ValidationException::withMessages([
                'quantity' => 'Jumlah melebihi stok pembelian yang tersedia. Maksimum yang diizinkan: ' . $purchaseDetail->jumlah,
            ]);
        }
        
        // Use custom name if provided, otherwise use the purchase detail product name
        if (!empty($validated['custom_nama'])) {
            $validated['nama'] = $validated['custom_nama'];
        } elseif (!empty($purchaseDetail->nama_produk)) {
            $validated['nama'] = $purchaseDetail->nama_produk;
        }
        
        // Set category from purchase detail if not provided
        if (empty($validated['category_id']) && $purchaseDetail->purchase->category_id) {
            $validated['category_id'] = $purchaseDetail->purchase->category_id;
        }
        
        // Remove fields not in the Produk model
        unset($validated['custom_nama']);
        unset($validated['purchase_detail_id']);
        $quantity = $validated['quantity']; // Save quantity before unsetting
        unset($validated['quantity']);

        // Handle image upload
        if ($request->hasFile('image')) {
            $validated['image'] = $request->file('image')->store('produk_images', 'public');
        }

        // Create the product
        $produk = Produk::create($validated);
        
        // Update the purchase detail to link it to this product and reduce available quantity
        $purchaseDetail->produk_id = $produk->id;
        $purchaseDetail->jumlah = $purchaseDetail->jumlah - $quantity;
        $purchaseDetail->save();
        
        // Create a new purchase detail for the product with the requested quantity
        $newDetail = $purchaseDetail->replicate();
        $newDetail->produk_id = $produk->id;
        $newDetail->jumlah = $quantity;
        $newDetail->save();

        // Format the success message with quantity and expiry date
        $successMessage = sprintf(
            'Produk %s berhasil dibuat dengan stok awal %d. %s',
            $produk->nama,
            $quantity,
            $purchaseDetail->expired ? 'Tanggal kadaluarsa: ' . $purchaseDetail->expired->format('d/m/Y') : 'Tidak ada tanggal kadaluarsa'
        );

        return redirect()->route('produk.index')->with('success', $successMessage);
    }

    public function edit(Produk $produk)
    {
        $categories = Category::orderBy('name')->get(['id', 'name']);
        
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
        ]);
    }

    public function update(Request $request, Produk $produk)
    {
        // Start database transaction
        DB::beginTransaction();
        try {
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
        
        return Inertia::render('Produk/Show', [
            'produk' => $produk,
            'totalStock' => $totalStock,
            'stockByExpiry' => $stockByExpiry,
        ]);
    }

    // Method to display products that are out of stock
    public function outstock(Request $request)
    {
        $filters = $request->only(['search', 'perPage']);
        $search = $filters['search'] ?? null;
        $perPage = $filters['perPage'] ?? 10;

        // Get products with low stock (total quantity from purchase_details)
        $produk = Produk::with(['category', 'purchaseDetails'])
            ->select('produk.*')
            ->leftJoin('purchase_details', 'produk.id', '=', 'purchase_details.produk_id')
            ->groupBy('produk.id')
            ->havingRaw('COALESCE(SUM(purchase_details.jumlah), 0) <= ?', [10])  // Consider stock as low if <= 10
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
            $item->expiry_statuses = $item->purchaseDetails
                ->where('jumlah', '>', 0)
                ->whereNotNull('expired')
                ->groupBy(function($detail) {
                    $daysUntilExpiry = Carbon::parse($detail->expired)->diffInDays(Carbon::today(), false);
                    if ($daysUntilExpiry > 0) {
                        return 'near_expiry';
                    } else {
                        return 'expired';
                    }
                })
                ->map(function($group) {
                    return $group->sum('jumlah');
                });
            
            return $item;
        });

        return Inertia::render('Produk/Expired', [
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
}
