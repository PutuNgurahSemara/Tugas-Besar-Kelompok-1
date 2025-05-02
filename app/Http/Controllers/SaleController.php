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
        $products = Produk::where('quantity', '>', 0)
                          ->orderBy('nama')
                          ->get(['id', 'nama', 'harga', 'quantity', 'image']);
        
        return Inertia::render('Sales/Create', [
            'products' => $products
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        // Dump raw input stream before Laravel processes it
        $rawInput = file_get_contents('php://input');
        // dd($rawInput);

        // Kode di bawah ini tidak akan dijalankan
        // dd($request->all()); 
        Log::info('Request data received in SaleController@store:', $request->all());

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
        $produksInDb = Produk::whereIn('id', $produkIds)->pluck('harga', 'id'); // Ambil harga dari DB

        foreach ($validated['items'] as $itemData) {
            // Gunakan harga dari DB untuk keamanan, atau harga dari request jika diperbolehkan
            $price = $produksInDb[$itemData['produk_id']] ?? $itemData['price']; // Prioritaskan harga DB
            $calculatedTotalPrice += $price * $itemData['quantity'];
        }

        DB::beginTransaction();

        try {
            $sale = Sale::create([
                'user_id' => Auth::id(),
                'total_price' => $calculatedTotalPrice, // GUNAKAN total yang dihitung
                'payment_method' => $validated['payment_method'] ?? 'Cash',
                // Sesuaikan logika amount_paid jika total_price tidak ada di request
                'amount_paid' => $validated['amount_paid'] ?? $calculatedTotalPrice, 
            ]);

            foreach ($validated['items'] as $itemData) {
                $produk = Produk::lockForUpdate()->find($itemData['produk_id']);
                $price = $produksInDb[$itemData['produk_id']] ?? $itemData['price']; // Gunakan harga yg sama

                if (!$produk || $produk->quantity < $itemData['quantity']) {
                    throw new Exception('Insufficient stock for product ID: ' . $itemData['produk_id']);
                }

                SaleItem::create([
                    'sale_id' => $sale->id,
                    'produk_id' => $itemData['produk_id'],
                    'quantity' => $itemData['quantity'],
                    'price' => $price, // Gunakan harga yang konsisten
                ]);

                $produk->decrement('quantity', $itemData['quantity']);
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
        return redirect()->route('sales.index');
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
