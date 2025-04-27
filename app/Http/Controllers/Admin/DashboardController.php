<?php

namespace App\Http\Controllers\Admin;

use App\Models\Sale;
use App\Models\Category;
use App\Models\Purchase;
use App\Models\Supplier;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use App\Http\Controllers\Controller;

class DashboardController extends Controller
{
    public function index(){
        $title = 'dashboard';
        $total_purchases = Purchase::count();
        $total_categories = Category::count();
        $total_suppliers = Supplier::count();
        $total_sales = Sale::count();
        
        $pieChart = app()->chartjs
                ->name('pieChart')
                ->type('pie')
                ->size(['width' => 400, 'height' => 200])
                ->labels(['Total Purchases', 'Total Suppliers','Total Sales'])
                ->datasets([
                    [
                        'backgroundColor' => ['#FF6384', '#36A2EB','#7bb13c'],
                        'hoverBackgroundColor' => ['#FF6384', '#36A2EB','#7bb13c'],
                        'data' => [$total_purchases, $total_suppliers,$total_sales]
                    ]
                ])
                ->options([]);
        
        $total_expired_products = Purchase::whereDate('expiry_date', '<=', Carbon::now())->count();
        $latest_sales = Sale::latest()->take(5)->get();
        $today_sales_raw = Sale::whereDate('created_at','=',Carbon::today())->sum('total_price');
        $today_sales_formatted = 'Rp ' . number_format($today_sales_raw, 0, ',', '.');

        $monthlySales = Sale::select(
                            DB::raw("DATE_TRUNC('month', created_at) as month_year"),
                            DB::raw('SUM(total_price) as total')
                        )
                        ->groupBy('month_year')
                        ->orderBy('month_year', 'asc')
                        ->get();

        $monthlyLabels = $monthlySales->map(function($sale) {
            return Carbon::parse($sale->month_year)->format('M Y');
        })->toArray();

        $monthlyData = $monthlySales->pluck('total')->toArray();

        return view('admin.dashboard',compact(
            'title','pieChart','total_expired_products',
            'latest_sales','today_sales_formatted','total_categories',
            'monthlyLabels', 'monthlyData'
        ));
    }
}
