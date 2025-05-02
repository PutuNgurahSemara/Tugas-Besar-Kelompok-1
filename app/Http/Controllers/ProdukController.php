<?php

namespace App\Http\Controllers;

use App\Models\Produk;
use App\Models\Category; // Untuk dropdown
use App\Models\Purchase; // Tambahkan Purchase model
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Storage; // Tambahkan ini
use Illuminate\Support\Facades\DB; // Tambahkan ini
use Carbon\Carbon;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class ProdukController extends Controller
{
    public function index(Request $request)
    {
        // Ambil filter dari request, sediakan default
        $filters = $request->only(['search', 'perPage']);
        $search = $filters['search'] ?? null;
        $perPage = $filters['perPage'] ?? 10;

        $produk = Produk::with('category')
                        ->select('id', 'nama', 'harga', 'expired_at', 'category_id', 'image', 'quantity', 'margin', 'created_at', 'updated_at')
                        // Terapkan filter pencarian jika ada
                        ->when($search, function ($query, $search) {
                            return $query->where('nama', 'like', '%'.$search.'%');
                            // Atau cari di beberapa kolom:
                            // return $query->where(function($q) use ($search) {
                            //     $q->where('nama', 'like', '%'.$search.'%')
                            //       ->orWhere('deskripsi', 'like', '%'.$search.'%'); // Jika ada kolom deskripsi
                            // });
                        })
                        ->latest()
                        ->paginate((int)$perPage) // Gunakan nilai perPage
                        ->withQueryString(); // Pertahankan query string di link pagination
        
        return Inertia::render('Produk/Index', [
            'produk' => $produk,
            'filters' => [ // Kirim filter kembali ke view
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
        
        // Ambil semua purchase beserta detail itemnya
        $allPurchases = Purchase::with(['items'])->get();
        
        // Hitung available quantity per item (jika diperlukan)
        $availablePurchases = $allPurchases->map(function($purchase) {
            $purchase->items->map(function($item) use ($purchase) {
                $item->available_quantity = $item->quantity; // Atur logika sesuai kebutuhan stok
                return $item;
            });
            return $purchase;
        });
        
        return Inertia::render('Produk/Create', [
            'categories' => $categories,
            'availablePurchases' => $availablePurchases
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'nama' => 'required|string|max:50',
            'custom_nama' => 'nullable|string|max:50', // Tambahkan validasi untuk nama custom
            'harga' => 'required|integer|min:0',
            'quantity' => 'required|integer|min:0',
            'margin' => 'nullable|numeric|min:0|max:100', // Validasi margin
            'expired_at' => 'nullable|date',
            'category_id' => 'nullable|exists:categories,id',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,gif,svg|max:2048', // Validasi gambar
            'purchase_id' => 'nullable|exists:purchases,id', // Purchase yang dipilih
        ]);

        // Validasi bahwa jumlah produk tidak melebihi purchase jika ada purchase_id
        if (isset($validated['purchase_id']) && $validated['quantity'] > 0) {
            $purchase = Purchase::find($validated['purchase_id']);
            
            if ($purchase) {
                // Dapatkan jumlah tersedia berdasarkan relasi
                $availableQuantity = $purchase->quantity - $purchase->produk()->sum('quantity');
                
                if ($validated['quantity'] > $availableQuantity) {
                    throw ValidationException::withMessages([
                        'quantity' => 'Jumlah melebihi stok pembelian yang tersedia. Maksimum yang diizinkan: ' . $availableQuantity,
                    ]);
                }
                
                // Set tanggal kadaluarsa dari purchase jika tidak ada input
                if (empty($validated['expired_at']) && $purchase->expiry_date) {
                    $validated['expired_at'] = $purchase->expiry_date;
                }
                
                // Set kategori dari purchase jika tidak ada input
                if (empty($validated['category_id']) && $purchase->category_id) {
                    $validated['category_id'] = $purchase->category_id;
                }
                
                // Gunakan nama custom jika diisi, jika tidak gunakan nama asli
                if (!empty($validated['custom_nama'])) {
                    $validated['nama'] = $validated['custom_nama'];
                }
                
                // Hapus custom_nama karena tidak ada di tabel
                unset($validated['custom_nama']);
            }
        } else {
            // Jika tidak ada purchase yang dipilih, hapus custom_nama
            unset($validated['custom_nama']);
        }

        if ($request->hasFile('image')) {
            // Simpan gambar ke direktori produk_images di storage public
            $validated['image'] = $request->file('image')->store('produk_images', 'public');
        }

        // Simpan produk dengan relasi ke purchase
        $produk = Produk::create($validated);

        return redirect()->route('produk.index')->with('success', 'Produk berhasil dibuat.');
    }

    public function edit(Produk $produk)
    {
        $categories = Category::orderBy('name')->get(['id', 'name']);
        $produk->load(['category', 'purchase']); 
        $currentPurchase = $produk->purchase;
        $allPurchases = Purchase::with(['items'])->get();
        $availablePurchases = $allPurchases->map(function($purchase) {
            $purchase->items->map(function($item) use ($purchase) {
                $item->available_quantity = $item->quantity; // Atur logika sesuai kebutuhan stok
                return $item;
            });
            return $purchase;
        });
        return Inertia::render('Produk/Edit', [
            'categories' => $categories,
            'availablePurchases' => $availablePurchases,
            'produk' => $produk
        ]);
    }

    public function update(Request $request, Produk $produk)
    {
        $validated = $request->validate([
            'nama' => 'required|string|max:50',
            'custom_nama' => 'nullable|string|max:50', // Tambahkan validasi untuk nama custom
            'harga' => 'required|integer|min:0',
            'quantity' => 'required|integer|min:0',
            'margin' => 'nullable|numeric|min:0|max:100',
            'expired_at' => 'nullable|date',
            'category_id' => 'nullable|exists:categories,id',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,gif,svg|max:2048',
            'purchase_id' => 'nullable|exists:purchases,id', // Purchase yang dipilih
        ]);

        // Validasi bahwa jumlah yang diupdate tidak melebihi jumlah purchase
        if (isset($validated['purchase_id'])) {
            $purchase = Purchase::find($validated['purchase_id']);
            
            if ($purchase) {
                // Hitung total produk yang sudah dibuat dari purchase ini, tidak termasuk produk yang sedang diupdate
                $usedQuantity = $purchase->produk()
                                        ->where('id', '!=', $produk->id)
                                        ->sum('quantity');
                
                $availableQuantity = (int)$purchase->quantity - $usedQuantity;
                
                if ($validated['quantity'] > $availableQuantity) {
                    throw ValidationException::withMessages([
                        'quantity' => 'Total jumlah melebihi pembelian. Maksimum yang diizinkan: ' . $availableQuantity,
                    ]);
                }
                
                // Gunakan nama custom jika diisi
                if (!empty($validated['custom_nama'])) {
                    $validated['nama'] = $validated['custom_nama'];
                }
                
                // Hapus custom_nama karena tidak ada di tabel
                unset($validated['custom_nama']);
            }
        } else {
            // Jika tidak ada purchase yang dipilih, hapus custom_nama
            unset($validated['custom_nama']);
        }

        // Handle image update
        if ($request->hasFile('image')) {
            // Hapus gambar lama jika ada
            if ($produk->image) {
                Storage::disk('public')->delete($produk->image);
            }
            // Simpan gambar ke direktori produk_images di storage public
            $validated['image'] = $request->file('image')->store('produk_images', 'public');
        }

        // Update produk dengan data yang sudah divalidasi
        $produk->update($validated);

        return redirect()->route('produk.index')->with('success', 'Produk berhasil diperbarui.');
    }

    public function destroy(Produk $produk)
    {
        // Hapus gambar dari storage jika ada sebelum delete produk
        if ($produk->image) {
            Storage::disk('public')->delete('produk_images/' . $produk->image);
        }

        // Hati-hati jika produk ini ada di tabel sales atau purchase
        // Mungkin perlu validasi atau set null foreign key terkait
        $produk->delete(); // Soft delete jika model pakai SoftDeletes
        return redirect()->route('produk.index')->with('success', 'Product deleted successfully.');
    }

    /**
     * Display the specified resource.
     */
    public function show(Produk $produk)
    {
        // Load relasi jika diperlukan
        $produk->load('category');
        
        return Inertia::render('Produk/Show', [
            'produk' => $produk
        ]);
    }

    // Method untuk menampilkan produk yang habis stok
    public function outstock(Request $request)
    {
        $filters = $request->only(['search', 'perPage']);
        $search = $filters['search'] ?? null;
        $perPage = $filters['perPage'] ?? 10;

        $produk = Produk::with('category')
                        ->select('id', 'nama', 'harga', 'expired_at', 'category_id', 'image', 'quantity', 'margin', 'created_at', 'updated_at')
                        ->where('quantity', '=', 0) // Filter produk out stock
                        ->when($search, function ($query, $search) {
                            return $query->where('nama', 'like', '%'.$search.'%');
                        })
                        ->latest()
                        ->paginate((int)$perPage)
                        ->withQueryString(); 
        
        // Gunakan view Index yang sama, mungkin perlu penyesuaian di frontend untuk judul
        return Inertia::render('Produk/Index', [
            'produk' => $produk,
            'filters' => [
                'search' => $search,
                'perPage' => (int)$perPage,
            ],
            'pageTitle' => 'Out of Stock Products',
            'links' => [
                'all' => route('produk.index'),
                'expired' => route('produk.expired'),
            ]
        ]);
    }

    // Method untuk menampilkan produk yang sudah expired
    public function expired(Request $request)
    {
        $filters = $request->only(['search', 'perPage']);
        $search = $filters['search'] ?? null;
        $perPage = $filters['perPage'] ?? 10;

        $produk = Produk::with('category')
                        ->select('id', 'nama', 'harga', 'expired_at', 'category_id', 'image', 'quantity', 'margin', 'created_at', 'updated_at')
                        ->whereNotNull('expired_at') // Pastikan expired_at tidak null
                        ->whereDate('expired_at', '<=', Carbon::today()) // Filter produk expired
                        ->when($search, function ($query, $search) {
                            return $query->where('nama', 'like', '%'.$search.'%');
                        })
                        ->latest('expired_at') // Urutkan berdasarkan tanggal expired
                        ->paginate((int)$perPage)
                        ->withQueryString();
        
        // Gunakan view Index yang sama
        return Inertia::render('Produk/Index', [
            'produk' => $produk,
            'filters' => [
                'search' => $search,
                'perPage' => (int)$perPage,
            ],
            'pageTitle' => 'Expired Products',
            'links' => [
                'all' => route('produk.index'),
                'outstock' => route('produk.outstock'),
            ]
        ]);
    }
} 