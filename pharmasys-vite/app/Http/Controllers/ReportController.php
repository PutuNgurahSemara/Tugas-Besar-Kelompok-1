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
            'today_sales' => Sale::whereDate('created_at', Carbon::today())->sum('total_price'),
            'current_month_sales' => Sale::whereMonth('created_at', Carbon::now()->month)->whereYear('created_at', Carbon::now()->year)->sum('total_price'),
            'current_year_sales' => Sale::whereYear('created_at', Carbon::now()->year)->sum('total_price'),
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
        $startDate = $request->input('start_date') ? Carbon::parse($request->input('start_date')) : Carbon::now()->startOfMonth();
        $endDate = $request->input('end_date') ? Carbon::parse($request->input('end_date')) : Carbon::now()->endOfMonth();
        
        $supplierId = $request->input('supplier_id'); // This might be 'all', an ID, or empty

        $purchasesQuery = Purchase::with(['supplier', 'category', 'details'])
                             ->whereBetween('purchases.created_at', [$startDate, $endDate]); // Specify table for created_at
        
        if ($supplierId && $supplierId !== 'all' && $supplierId !== '') {
            $purchasesQuery->where('purchases.supplier_id', $supplierId); // Specify table for supplier_id
        }
        
        $purchases = $purchasesQuery->latest('purchases.created_at')->paginate(10); // Specify table for ordering

        // Chart data: pembelian per hari dalam range tanggal
        $dailyPurchases = DB::table('purchase_details')
                            ->join('purchases', 'purchase_details.purchase_id', '=', 'purchases.id')
                            ->whereBetween('purchases.created_at', [$startDate, $endDate])
                            ->select(DB::raw('DATE(purchases.created_at) as date'), 
                                    DB::raw('SUM(purchase_details.harga_satuan * purchase_details.jumlah) as total'))
                            ->groupBy('date')
                            ->orderBy('date')
                            ->get();

        // Data untuk chart pembelian per supplier
        $supplierPurchases = DB::table('purchase_details')
                                ->join('purchases', 'purchase_details.purchase_id', '=', 'purchases.id')
                                ->join('suppliers', 'purchases.supplier_id', '=', 'suppliers.id')
                                ->whereBetween('purchases.created_at', [$startDate, $endDate])
                                ->select('suppliers.company as name', 
                                        DB::raw('SUM(purchase_details.harga_satuan * purchase_details.jumlah) as total'))
                                ->groupBy('suppliers.company')
                                ->orderBy('total', 'desc')
                                ->limit(5)
                                ->get();

        // Ringkasan data pembelian
        $summary = [
            'total_purchases' => DB::table('purchase_details')
                                    ->join('purchases', 'purchase_details.purchase_id', '=', 'purchases.id')
                                    ->whereBetween('purchases.created_at', [$startDate, $endDate])
                                    ->sum(DB::raw('purchase_details.harga_satuan * purchase_details.jumlah')),
            'total_transactions' => Purchase::whereBetween('created_at', [$startDate, $endDate])->count(),
            'avg_transaction' => round(DB::table('purchases')
                                    ->join('purchase_details', 'purchases.id', '=', 'purchase_details.purchase_id')
                                    ->whereBetween('purchases.created_at', [$startDate, $endDate])
                                    ->avg(DB::raw('purchase_details.harga_satuan * purchase_details.jumlah')) ?? 0),
            'top_supplier' => DB::table('purchase_details')
                                ->join('purchases', 'purchase_details.purchase_id', '=', 'purchases.id')
                                ->join('suppliers', 'purchases.supplier_id', '=', 'suppliers.id')
                                ->whereBetween('purchases.created_at', [$startDate, $endDate])
                                ->select('suppliers.company as name', 
                                        DB::raw('SUM(purchase_details.harga_satuan * purchase_details.jumlah) as total_amount'))
                                ->groupBy('suppliers.company')
                                ->orderBy('total_amount', 'desc')
                                ->first(),
            'today_purchases' => Purchase::whereDate('tanggal_faktur', Carbon::today())->sum('total'), // Using purchase total
            'current_month_purchases' => Purchase::whereMonth('tanggal_faktur', Carbon::now()->month)->whereYear('tanggal_faktur', Carbon::now()->year)->sum('total'),
            'current_year_purchases' => Purchase::whereYear('tanggal_faktur', Carbon::now()->year)->sum('total'),
        ];

        $suppliers = Supplier::orderBy('company')->get(['id', 'company as name']);

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
        $validated = $request->validate([
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'supplier_id' => 'nullable|string', // Can be 'all', an ID, or empty
            'report_type' => 'required|string|in:detail,summary',
        ]);

        $startDate = Carbon::parse($validated['start_date']);
        $endDate = Carbon::parse($validated['end_date']);
        $supplierId = $validated['supplier_id'] ?? null;
        $reportType = $validated['report_type'];
        
        $timestamp = now()->format('Ymd_His');
        $filename = "laporan_pembelian_{$reportType}_{$timestamp}.xlsx";
        $exportClass = null;

        if ($reportType === 'detail') {
            $exportClass = new \App\Exports\PurchaseReportExport($startDate, $endDate, $supplierId);
        } elseif ($reportType === 'summary') {
            $exportClass = new \App\Exports\PurchaseOrderSummaryExport($startDate, $endDate, $supplierId);
        } else {
            return redirect()->back()->withErrors(['report_type' => 'Jenis laporan tidak valid.']);
        }
        
        try {
            return Excel::download($exportClass, $filename);
        } catch (\Exception $e) {
            Log::error("Excel Export Error: " . $e->getMessage());
            return redirect()->back()->with('error', 'Export Excel gagal: ' . $e->getMessage());
        }
    }

    // Fungsi untuk mengekspor laporan purchase ke PDF
    public function exportPurchasePDF(Request $request)
    {
        $validated = $request->validate([
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'supplier_id' => 'nullable|string', // Can be 'all', an ID, or empty
            'report_type' => 'required|string|in:detail,summary', // Assuming PDF also needs report type
        ]);

        $startDate = Carbon::parse($validated['start_date']);
        $endDate = Carbon::parse($validated['end_date']);
        $supplierId = $validated['supplier_id'] ?? null;
        $reportType = $validated['report_type']; // Added report_type

        // Note: PDF export logic needs to be significantly different for summary vs detail
        // The current PDF export is for a detailed list.
        // A new Blade view or modified logic would be needed for a summary PDF.
        // For now, this will only correctly export 'detail' type to PDF using existing structure.
        // If 'summary' is chosen for PDF, it will attempt to use the 'detail' structure.

        if ($reportType === 'summary') {
            // Placeholder: PDF for summary report needs a different view/logic
            // For now, let's use the PurchaseOrderSummaryExport data and a generic view or adapt.
            // This is a simplified approach; a dedicated PDF view for summary is better.
            $exportData = (new \App\Exports\PurchaseOrderSummaryExport($startDate, $endDate, $supplierId))->collection();
            $headings = (new \App\Exports\PurchaseOrderSummaryExport($startDate, $endDate, $supplierId))->headings();
            // You would need a Blade view like 'exports.purchase-summary-report.blade.php'
            // $pdf = PDF::loadView('exports.purchase-summary-report', compact('exportData', 'headings', 'startDate', 'endDate'));
            // return $pdf->download("laporan_ringkasan_pembelian_{$timestamp}.pdf");
            return redirect()->back()->with('error', 'PDF export untuk laporan ringkasan belum diimplementasikan sepenuhnya.');
        }

        // Existing detail PDF export logic
        $query = DB::table('purchase_details')
            ->join('purchases', 'purchase_details.purchase_id', '=', 'purchases.id')
            ->join('suppliers', 'purchases.supplier_id', '=', 'suppliers.id')
            ->whereBetween('purchases.created_at', [$startDate, $endDate]);

        if ($supplierId && $supplierId !== 'all' && $supplierId !== '') {
            $query->where('purchases.supplier_id', $supplierId);
        }

        // This query is for the *detailed* PDF report.
        $purchaseDetails = $query->select([
            'purchases.id as purchase_id_col',
            'purchases.no_faktur',
            'purchases.created_at as purchase_created_at',
            'suppliers.company as supplier_name',
            'purchase_details.nama_produk',
            'purchase_details.expired',
            'purchase_details.jumlah',
            'purchase_details.kemasan',
            'purchase_details.harga_satuan',
            'purchase_details.total as detail_total'
        ])->orderBy('purchases.created_at')->orderBy('purchase_details.id')->get();
        
        $timestamp = now()->format('Ymd_His');
        $filename = "laporan_detail_pembelian_{$timestamp}.pdf";

        try {
            // Assuming 'exports.purchase-report' is the Blade view for the detailed PDF.
            $pdf = PDF::loadView('exports.purchase-report', compact('purchaseDetails', 'startDate', 'endDate', 'supplierId'));
            return $pdf->download($filename);
        } catch (\Exception $e) {
            Log::error("PDF Export Error: " . $e->getMessage());
            return redirect()->back()->with('error', 'Export PDF gagal: ' . $e->getMessage());
        }
    }
}
