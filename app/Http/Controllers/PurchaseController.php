<?php

namespace App\Http\Controllers;

use App\Models\Purchase;
use App\Models\Category; // Untuk dropdown
use App\Models\Supplier; // Untuk dropdown
use App\Models\Produk; // Tambahkan model Produk
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;
use App\Models\PurchaseItem;

class PurchaseController extends Controller
{
    public function index()
    {
        // Eager load relasi untuk efisiensi
        $purchases = Purchase::with(['category', 'supplier'])
                        ->withCount(['produk as used_quantity' => function($query) {
                            $query->select(DB::raw('COALESCE(SUM(quantity), 0)'));
                        }])
                        ->latest()
                        ->paginate(10);

        // Tambahkan perhitungan available_quantity
        $purchases->getCollection()->transform(function ($purchase) {
            $purchase->available_quantity = (int)$purchase->quantity - (int)$purchase->used_quantity;
            return $purchase;
        });
        
        return Inertia::render('Purchases/Index', ['purchases' => $purchases]);
    }

    public function create()
    {
        // Kirim data untuk dropdown form
        $categories = Category::orderBy('name')->get(['id', 'name']);
        $suppliers = Supplier::orderBy('name')->get(['id', 'name']);
        
        // Dapatkan daftar produk yang sudah ada untuk autocomplete suggestion
        $existingProducts = Produk::select('nama')
                            ->distinct()
                            ->orderBy('nama')
                            ->pluck('nama');
        
        return Inertia::render('Purchases/Create', [
            'categories' => $categories,
            'suppliers' => $suppliers,
            'existingProducts' => $existingProducts,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'invoice_number' => 'required|string|unique:purchases,invoice_number',
            'supplier_id' => 'required|exists:suppliers,id',
            'invoice_date' => 'required|date',
            'due_date' => 'nullable|date',
            'payment_date' => 'nullable|date',
            'status' => 'required|in:UNPAID,PAID',
            'note' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.product_name' => 'required|string',
            'items.*.expired' => 'nullable|date',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.unit' => 'nullable|string',
            'items.*.unit_price' => 'required|numeric|min:0',
            'items.*.total' => 'required|numeric|min:0',
        ]);

        \DB::transaction(function () use ($validated) {
            $purchase = Purchase::create([
                'invoice_number' => $validated['invoice_number'],
                'supplier_id' => $validated['supplier_id'],
                'invoice_date' => $validated['invoice_date'],
                'due_date' => $validated['due_date'],
                'payment_date' => $validated['payment_date'],
                'status' => $validated['status'],
                'note' => $validated['note'] ?? null,
                'total' => collect($validated['items'])->sum('total'),
            ]);

            foreach ($validated['items'] as $item) {
                $purchase->items()->create($item);
            }
        });

        return redirect()->route('purchases.index')->with('success', 'Faktur pembelian berhasil disimpan.');
    }

    public function edit(Purchase $purchase)
    {
        $categories = Category::orderBy('name')->get(['id', 'name']);
        $suppliers = Supplier::orderBy('name')->get(['id', 'name']);
        
        // Hitung jumlah produk yang sudah digunakan dari purchase ini
        $usedQuantity = $purchase->produk()->sum('quantity');
        
        // Dapatkan daftar produk yang sudah ada untuk autocomplete
        $existingProducts = Produk::select('nama')
                            ->distinct()
                            ->orderBy('nama')
                            ->pluck('nama');
                            
        return Inertia::render('Purchases/Edit', [
            'purchase' => $purchase,
            'categories' => $categories,
            'suppliers' => $suppliers,
            'usedQuantity' => $usedQuantity,
            'existingProducts' => $existingProducts,
            'remainingQuantity' => (int)$purchase->quantity - (int)$usedQuantity,
        ]);
    }

    public function update(Request $request, Purchase $purchase)
    {
        // Jika hanya update status (misal dari tombol Tandai Lunas)
        if ($request->has('status') && count($request->all()) === 1) {
            $purchase->update(['status' => $request->status]);
            return redirect()->route('purchases.index')->with('success', 'Status faktur berhasil diubah.');
        }

        // Validasi data master dan detail
        $validated = $request->validate([
            'invoice_number' => 'required|string',
            'supplier_id' => 'required|exists:suppliers,id',
            'invoice_date' => 'required|date',
            'due_date' => 'nullable|date',
            'payment_date' => 'nullable|date',
            'status' => 'required|in:UNPAID,PAID',
            'note' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.product_name' => 'required|string',
            'items.*.expired' => 'nullable|date',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.unit' => 'nullable|string',
            'items.*.unit_price' => 'required|numeric|min:0',
            'items.*.total' => 'required|numeric|min:0',
        ]);

        DB::transaction(function () use ($purchase, $validated) {
            // Update data master
            $purchase->update([
                'invoice_number' => $validated['invoice_number'],
                'supplier_id' => $validated['supplier_id'],
                'invoice_date' => $validated['invoice_date'],
                'due_date' => $validated['due_date'],
                'payment_date' => $validated['payment_date'],
                'status' => $validated['status'],
                'note' => $validated['note'] ?? null,
                'total' => collect($validated['items'])->sum('total'),
            ]);

            // Sinkronisasi items
            $itemIds = [];
            foreach ($validated['items'] as $itemData) {
                if (isset($itemData['id'])) {
                    // Update item lama
                    $item = $purchase->items()->find($itemData['id']);
                    if ($item) {
                        $item->update($itemData);
                        $itemIds[] = $item->id;
                    }
                } else {
                    // Tambah item baru
                    $newItem = $purchase->items()->create($itemData);
                    $itemIds[] = $newItem->id;
                }
            }
            // Hapus item yang tidak ada di request
            $purchase->items()->whereNotIn('id', $itemIds)->delete();
        });

        return redirect()->route('purchases.index')->with('success', 'Faktur pembelian berhasil diperbarui.');
    }

    public function destroy(Purchase $purchase)
    {
        // Periksa apakah purchase ini sudah digunakan untuk produk
        $usedQuantity = $purchase->produk()->sum('quantity');
        
        if ($usedQuantity > 0) {
            return back()->withErrors([
                'delete' => 'Tidak dapat menghapus pembelian ini karena sudah digunakan untuk produk. Hapus produk terkait terlebih dahulu.'
            ]);
        }
        
        // Hapus file gambar jika ada sebelum delete
        $purchase->delete();
        return redirect()->route('purchases.index')->with('success', 'Pembelian berhasil dihapus.');
    }
} 