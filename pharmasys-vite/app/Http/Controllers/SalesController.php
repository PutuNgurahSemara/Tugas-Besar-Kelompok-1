<?php

namespace App\Http\Controllers;

use App\Models\Sale;
use App\Models\Produk;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use App\Models\SaleItem;
use Exception;
use Illuminate\Support\Facades\Log;

class SaleController extends Controller
{
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
        $products = Produk::with(['purchaseDetails'])
            ->whereHas('purchaseDetails', function($query) {
                $query->where('jumlah', '>', 0)
                    ->whereNull('deleted_at');
            })
            ->orWhereHas('purchaseDetails', function($query) {
                $query->where('produk_id', '!=', null)
                    ->whereNull('deleted_at');
            })
            ->orderBy('nama')
            ->get()
            ->map(function($product) {
                $totalStock = $product->purchaseDetails->sum('jumlah');
                return [
                    'id' => $product->id,
                    'nama' => $product->nama,
                    'harga' => $product->harga,
                    'quantity' => $totalStock,
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
        $produkIds = array_column($validated['items'], 'produk_id');
        $produksInDb = Produk::with('purchaseDetails')
            ->whereIn('id', $produkIds)
            ->get()
            ->mapWithKeys(function($produk) {
                $totalStock = $produk->purchaseDetails->sum('jumlah');
                return [$produk->id => [
                    'harga' => $produk->harga,
                    'stock' => $totalStock
                ]];
            });

        foreach ($validated['items'] as $itemData) {
            $produkInfo = $produksInDb[$itemData['produk_id']] ?? null;
            if (!$produkInfo || $produkInfo['stock'] < $itemData['quantity']) {
                throw new Exception('Insufficient stock for product ID: ' . $itemData['produk_id']);
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

                // Reduce stock from purchase details
                $remainingQty = $itemData['quantity'];
                foreach ($produk->purchaseDetails->sortBy('expired') as $detail) {
                    if ($remainingQty <= 0) break;
                    
                    $deductQty = min($remainingQty, $detail->jumlah);
                    $detail->jumlah -= $deductQty;
                    $detail->save();
                    
                    $remainingQty -= $deductQty;
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
        $sale->load(['user', 'items.produk']); // Ensure relations are loaded
        return Inertia::render('Sales/Show', [
            'sale' => $sale // Pass the full sale object
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
        $sale->delete();
        return redirect()->route('sales.index')->with('success', 'Sale deleted successfully.');
    }
}
