<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Sale;
use App\Models\Category;
use App\Models\Produk; // Ganti ke Produk
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB; // Import DB facade jika perlu
use App\Models\SaleItem;

class DashboardController extends Controller
{
    public function index()
    {
        // --- AWAL LOGIKA PENGAMBILAN DATA ---
        $todaySales = Sale::whereDate('created_at', Carbon::today())->sum('total_price') ?? 0;
        $totalCategories = Category::count();
        $expiredMedicines = Produk::where('expired_at', '<', Carbon::now())->count(); // Gunakan kolom expired_at
        $systemUsers = User::count();

        $recentSales = SaleItem::with(['produk'])
            ->latest()
            ->take(10)
            ->get()
            ->map(fn ($item) => [
                'medicine' => $item->produk->nama ?? 'Product Deleted',
                'quantity' => $item->quantity,
                'total_price' => $item->price * $item->quantity,
                'date' => $item->created_at->format('Y-m-d'),
            ]);

        // Query Sales By Category (Contoh - Perlu disesuaikan!)
        // Asumsi: Produk punya category_id, Sale punya product_id
        $salesByCategory = \App\Models\Category::select('categories.name as label', DB::raw('SUM(sale_items.quantity) as value'))
            ->join('produk', 'categories.id', '=', 'produk.category_id')
            ->join('sale_items', 'produk.id', '=', 'sale_items.produk_id')
            ->groupBy('categories.id', 'categories.name')
            ->orderBy('value', 'desc')
            ->take(5)
            ->get();
            // Jika tidak ada penjualan, koleksi akan kosong, yang akan ditangani di frontend

        // --- AKHIR LOGIKA PENGAMBILAN DATA ---

        return Inertia::render('Dashboard', [
            'todaySales' => (float) $todaySales,
            'totalCategories' => (int) $totalCategories,
            'expiredMedicines' => (int) $expiredMedicines,
            'systemUsers' => (int) $systemUsers,
            'recentSales' => $recentSales,
            'salesByCategory' => $salesByCategory,
        ]);
    }
}
