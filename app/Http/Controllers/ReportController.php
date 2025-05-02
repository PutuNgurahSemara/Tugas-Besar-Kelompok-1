<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Sale;
use App\Models\Purchase;
use App\Models\Produk;
use App\Models\Category;
use App\Models\Supplier;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use App\Exports\SalesReportExport;
use App\Exports\PurchaseReportExport;
use Maatwebsite\Excel\Facades\Excel;
use Barryvdh\DomPDF\Facade\Pdf;

class ReportController extends Controller
{
    public function salesReport(Request $request)
    {
        // Filter berdasarkan tanggal
        $startDate = $request->input('start_date') ? Carbon::parse($request->input('start_date')) : Carbon::now()->startOfMonth();
        $endDate = $request->input('end_date') ? Carbon::parse($request->input('end_date')) : Carbon::now()->endOfMonth();

        // Query untuk data penjualan dengan filter periode
        $sales = Sale::with(['user', 'items.produk'])
                     ->whereBetween('created_at', [$startDate, $endDate])
                     ->latest()
                    ->paginate(10);

        // Chart data: penjualan per hari dalam range tanggal yang dipilih
        $dailySales = Sale::whereBetween('created_at', [$startDate, $endDate])
                        ->select(DB::raw('DATE(created_at) as date'), DB::raw('SUM(total_price) as total'))
                        ->groupBy('date')
                        ->orderBy('date')
                        ->get();

        // Data untuk chart kategori produk terjual
        $categorySales = DB::table('sale_items')
                            ->join('produk', 'sale_items.produk_id', '=', 'produk.id')
                            ->join('categories', 'produk.category_id', '=', 'categories.id')
                            ->join('sales', 'sale_items.sale_id', '=', 'sales.id')
                            ->whereBetween('sales.created_at', [$startDate, $endDate])
                            ->select('categories.name', DB::raw('SUM(sale_items.quantity) as total_quantity'))
                            ->groupBy('categories.name')
                            ->orderBy('total_quantity', 'desc')
                            ->limit(5)
                            ->get();

        // Ringkasan data penjualan
        $summary = [
            'total_sales' => Sale::whereBetween('created_at', [$startDate, $endDate])->sum('total_price'),
            'total_transactions' => Sale::whereBetween('created_at', [$startDate, $endDate])->count(),
            'avg_transaction' => round(Sale::whereBetween('created_at', [$startDate, $endDate])->avg('total_price') ?? 0),
            'top_product' => DB::table('sale_items')
                                ->join('produk', 'sale_items.produk_id', '=', 'produk.id')
                                ->join('sales', 'sale_items.sale_id', '=', 'sales.id')
                                ->whereBetween('sales.created_at', [$startDate, $endDate])
                                ->select('produk.nama', DB::raw('SUM(sale_items.quantity) as total_quantity'))
                                ->groupBy('produk.nama')
                                ->orderBy('total_quantity', 'desc')
                                ->first(),
        ];

        return Inertia::render('Reports/Sales', [
            'sales' => $sales,
            'filters' => [
                'start_date' => $startDate->format('Y-m-d'),
                'end_date' => $endDate->format('Y-m-d'),
            ],
            'chartData' => [
                'dailySales' => $dailySales,
                'categorySales' => $categorySales,
            ],
            'summary' => $summary
        ]);
    }

    public function purchaseReport(Request $request)
    {
        // Filter berdasarkan tanggal
        $startDate = $request->input('start_date') ? Carbon::parse($request->input('start_date')) : Carbon::now()->startOfMonth();
        $endDate = $request->input('end_date') ? Carbon::parse($request->input('end_date')) : Carbon::now()->endOfMonth();
        
        // Filter berdasarkan supplier (opsional)
        $supplierId = $request->input('supplier_id');

        // Query untuk data pembelian dengan filter
        $purchasesQuery = Purchase::with(['supplier', 'category', 'items'])
                             ->whereBetween('created_at', [$startDate, $endDate]);
        
        // Tambahkan filter supplier jika ada
        if ($supplierId) {
            $purchasesQuery->where('supplier_id', $supplierId);
        }
        
        $purchases = $purchasesQuery->latest()->paginate(10);

        // Chart data: pembelian per hari dalam range tanggal
        $dailyPurchases = DB::table('purchases as p')
            ->join('purchase_items as pi', 'pi.purchase_id', '=', 'p.id')
            ->select(DB::raw('DATE(p.created_at) as date'), DB::raw('SUM(pi.unit_price * pi.quantity) as total'))
            ->whereBetween('p.created_at', [$startDate, $endDate])
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        // Data untuk chart pembelian per supplier
        $supplierPurchases = DB::table('purchases as p')
            ->join('purchase_items as pi', 'pi.purchase_id', '=', 'p.id')
            ->join('suppliers as s', 'p.supplier_id', '=', 's.id')
            ->whereBetween('p.created_at', [$startDate, $endDate])
            ->select('s.name', DB::raw('SUM(pi.unit_price * pi.quantity) as total'))
            ->groupBy('s.name')
            ->orderBy('total', 'desc')
            ->limit(5)
            ->get();

        // Ringkasan data pembelian
        $summary = [
            'total_purchases' => DB::table('purchases as p')
                ->join('purchase_items as pi', 'pi.purchase_id', '=', 'p.id')
                ->whereBetween('p.created_at', [$startDate, $endDate])
                ->sum(DB::raw('pi.unit_price * pi.quantity')),
            'total_transactions' => Purchase::whereBetween('created_at', [$startDate, $endDate])->count(),
            'avg_transaction' => round(
                DB::table('purchases as p')
                    ->join('purchase_items as pi', 'pi.purchase_id', '=', 'p.id')
                    ->whereBetween('p.created_at', [$startDate, $endDate])
                    ->avg(DB::raw('pi.unit_price * pi.quantity')) ?? 0
            ),
            'top_supplier' => DB::table('purchases as p')
                ->join('purchase_items as pi', 'pi.purchase_id', '=', 'p.id')
                ->join('suppliers as s', 'p.supplier_id', '=', 's.id')
                ->whereBetween('p.created_at', [$startDate, $endDate])
                ->select('s.name', DB::raw('SUM(pi.unit_price * pi.quantity) as total_amount'))
                ->groupBy('s.name')
                ->orderBy('total_amount', 'desc')
                ->first(),
        ];

        // Daftar supplier untuk filter dropdown
        $suppliers = Supplier::orderBy('name')->get(['id', 'name']);

        return Inertia::render('Reports/Purchase', [
            'purchases' => $purchases,
            'filters' => [
                'start_date' => $startDate->format('Y-m-d'),
                'end_date' => $endDate->format('Y-m-d'),
                'supplier_id' => $supplierId,
            ],
            'chartData' => [
                'dailyPurchases' => $dailyPurchases,
                'supplierPurchases' => $supplierPurchases,
            ],
            'summary' => $summary,
            'suppliers' => $suppliers,
        ]);
    }

    // Fungsi untuk mengekspor laporan sales ke Excel
    public function exportSalesExcel(Request $request)
    {
        $startDate = $request->input('start_date') ? Carbon::parse($request->input('start_date')) : Carbon::now()->startOfMonth();
        $endDate = $request->input('end_date') ? Carbon::parse($request->input('end_date')) : Carbon::now()->endOfMonth();
        try {
            return Excel::download(new SalesReportExport($startDate, $endDate), 'laporan-penjualan.xlsx');
        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'Export Excel gagal: ' . $e->getMessage());
        }
    }

    // Fungsi untuk mengekspor laporan sales ke PDF
    public function exportSalesPdf(Request $request)
    {
        $startDate = $request->input('start_date') ? Carbon::parse($request->input('start_date')) : Carbon::now()->startOfMonth();
        $endDate = $request->input('end_date') ? Carbon::parse($request->input('end_date')) : Carbon::now()->endOfMonth();
        try {
            $sales = Sale::with(['items.produk'])
                ->whereBetween('created_at', [$startDate, $endDate])
                ->get();
            $pdf = Pdf::loadView('exports.sales-report', compact('sales', 'startDate', 'endDate'));
            return $pdf->download('laporan-penjualan.pdf');
        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'Export PDF gagal: ' . $e->getMessage());
        }
    }

    // Fungsi untuk mengekspor laporan purchase ke Excel
    public function exportPurchaseExcel(Request $request)
    {
        $startDate = $request->input('start_date') ? Carbon::parse($request->input('start_date')) : Carbon::now()->startOfMonth();
        $endDate = $request->input('end_date') ? Carbon::parse($request->input('end_date')) : Carbon::now()->endOfMonth();
        $supplierId = $request->input('supplier_id');
        return Excel::download(new PurchaseReportExport($startDate, $endDate, $supplierId), 'laporan-pembelian.xlsx');
    }

    // Fungsi untuk mengekspor laporan purchase ke PDF
    public function exportPurchasePdf(Request $request)
    {
        $startDate = $request->input('start_date') ? Carbon::parse($request->input('start_date')) : Carbon::now()->startOfMonth();
        $endDate = $request->input('end_date') ? Carbon::parse($request->input('end_date')) : Carbon::now()->endOfMonth();
        $supplierId = $request->input('supplier_id');
        $purchasesQuery = Purchase::with(['supplier', 'category'])
            ->whereBetween('created_at', [$startDate, $endDate]);
        if ($supplierId) {
            $purchasesQuery->where('supplier_id', $supplierId);
        }
        $purchases = $purchasesQuery->get();
        $pdf = Pdf::loadView('exports.purchase-report', compact('purchases', 'startDate', 'endDate'));
        return $pdf->download('laporan-pembelian.pdf');
    }
} 