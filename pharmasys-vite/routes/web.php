<?php

use App\Http\Controllers\ProfileController;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
// Import model yang relevan (contoh - sesuaikan dengan nama model Anda)
use App\Models\Sale;       // Ganti jika nama model Sale berbeda
use App\Models\Category;   // Ganti jika nama model Category berbeda
use App\Models\Produk;    // Ganti jika nama model Produk berbeda
use App\Models\User;       // Ganti jika nama model User berbeda
use Carbon\Carbon;
use App\Http\Controllers\DashboardController; // Import controller
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\PurchaseController;
use App\Http\Controllers\ProdukController;
use App\Http\Controllers\SupplierController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\SettingController;
use App\Http\Controllers\SaleController;
use App\Http\Controllers\RoleController;
use App\Http\Controllers\PermissionController;
use App\Http\Controllers\NotificationViewController;

// Mengarahkan root ke halaman login
Route::get('/', function () {
    // Jika pengguna sudah login, arahkan ke dashboard
    if (Auth::check()) {
        return redirect()->route('dashboard');
    }
    // Jika belum login, arahkan ke halaman login
    return redirect()->route('login');
});

Route::get('/dashboard', [DashboardController::class, 'index'])
    ->middleware(['auth', 'verified'])
    ->name('dashboard');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

Route::middleware(['auth', 'verified'])->group(function () {
    // Dashboard (Sudah ada)
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');
    
    // Notifications
    Route::get('/notifications', [NotificationViewController::class, 'index'])->name('notifications.index');

    // Profile (Sudah ada)
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    // Resource Routes dengan permission middleware
    Route::middleware('permission:view-category')->group(function() {
        Route::resource('categories', CategoryController::class);
    });
    
    Route::middleware('permission:view-purchase')->group(function() {
        // Import/Export routes first
        Route::get('purchases/import-page', [PurchaseController::class, 'importPage'])
            ->middleware('permission:import-purchase')
            ->name('purchases.import-page');
        Route::post('purchases/import', [PurchaseController::class, 'import'])
            ->middleware('permission:import-purchase')
            ->name('purchases.import');
        Route::post('purchases/import-images', [PurchaseController::class, 'importImages'])
            ->middleware('permission:import-purchase')
            ->name('purchases.import-images');
        Route::get('purchases/download-template', [PurchaseController::class, 'downloadTemplate'])
            ->middleware('permission:import-purchase')
            ->name('purchases.download-template');
        Route::get('purchases/{id}/export', [PurchaseController::class, 'export'])
            ->middleware('permission:export-purchase')
            ->name('purchases.export');
        
        // New route for bulk purchase reports
        Route::get('purchases/export-report', [PurchaseController::class, 'exportReport'])
            ->middleware('permission:export-purchase') // Assuming same permission for now
            ->name('purchases.exportReport');

        Route::get('purchases/products', [PurchaseController::class, 'purchasedProducts'])
            ->name('purchases.products');
            
        // Then the resource route
        Route::resource('purchases', PurchaseController::class);
        // Secure create route with additional permission
        Route::get('purchases/create', [PurchaseController::class, 'create'])
            ->middleware('permission:create-purchase')
            ->name('purchases.create');
    });
    
    Route::middleware('permission:view-products')->group(function() {
        // Draft products
        Route::get('produk/drafts', [ProdukController::class, 'drafts'])
            ->name('produk.drafts');
            
        // Activate product
        Route::post('produk/{produk}/activate', [ProdukController::class, 'activate'])
            ->middleware('permission:edit-products')
            ->name('produk.activate');
            
        Route::get('produk/outstock', [ProdukController::class, 'outstock'])
            ->middleware('permission:view-outstock-products')
            ->name('produk.outstock');
            
        Route::get('produk/expired', [ProdukController::class, 'expired'])
            ->middleware('permission:view-expired-products')
            ->name('produk.expired');
        Route::resource('produk', ProdukController::class);
        // Mengamankan rute create dengan permission tambahan
        Route::get('produk/create', [ProdukController::class, 'create'])
            ->middleware('permission:create-product')
            ->name('produk.create');
    });
    
    Route::middleware('permission:view-supplier')->group(function() {
        Route::resource('suppliers', SupplierController::class);
    });
    
    Route::middleware('permission:view-sales-list')->group(function() {
        // List, create and store routes
        Route::get('sales', [SaleController::class, 'index'])->name('sales.index');
        Route::get('sales/create', [SaleController::class, 'create'])->middleware('permission:create-sale')->name('sales.create');
        Route::post('sales', [SaleController::class, 'store'])->middleware('permission:create-sale')->name('sales.store');
        
        // Show route with view-sales-details permission
        Route::get('sales/{sale}', [SaleController::class, 'show'])
            ->middleware('permission:view-sales-details')
            ->name('sales.show');
        
        // Delete route with delete-sale permission
        Route::delete('sales/{sale}', [SaleController::class, 'destroy'])
            ->middleware('permission:delete-sale')
            ->name('sales.destroy');
            
        // No edit/update routes needed as sales cannot be edited
        Route::match(['get', 'put', 'patch'], 'sales/{sale}/edit', [SaleController::class, 'edit'])
            ->name('sales.edit');
    });

    // Group akses kontrol - dilindungi dengan middleware view-access-control
    Route::middleware('permission:view-access-control')->group(function() {
        // Routes Khusus Admin - Users
        Route::middleware('permission:view-users')->group(function() {
            Route::resource('users', UserController::class)->except(['show']);
        });
        
        // Routes Khusus Admin - Roles
        Route::middleware('permission:view-role')->group(function() {
            Route::resource('roles', RoleController::class);
        });
        
        // Routes Khusus Admin - Permissions
        Route::middleware('permission:view-permission')->group(function() {
            Route::resource('permissions', PermissionController::class);
            // Rute tambahan untuk permission
            Route::post('permissions/assign-user', [PermissionController::class, 'assignUser'])
                ->name('permissions.assign-user');
            Route::delete('permissions/remove-user', [PermissionController::class, 'removeUser'])
                ->name('permissions.remove-user');
        });
    });

    // Reports routes
    Route::middleware('permission:view-sales-reports')->group(function() {
        Route::get('/reports/sales', [ReportController::class, 'salesReport'])->name('reports.sales');
        Route::get('/reports/sales/export/excel', [ReportController::class, 'exportSalesExcel'])->name('reports.sales.export.excel');
        Route::get('/reports/sales/export/pdf', [ReportController::class, 'exportSalesPdf'])->name('reports.sales.export.pdf');
    });

    Route::middleware('permission:view-purchase')->group(function() {
        Route::get('/reports/purchase', [ReportController::class, 'purchaseReport'])->name('reports.purchase');
        Route::get('/reports/purchase/export/excel', [ReportController::class, 'exportPurchaseExcel'])->name('reports.purchase.export.excel');
        Route::get('/reports/purchase/export/pdf', [ReportController::class, 'exportPurchasePdf'])->name('reports.purchase.export.pdf');
    });

    // Settings dengan middleware permission
    Route::middleware('permission:view-settings')->group(function() {
        Route::get('/settings', [SettingController::class, 'index'])->name('settings.index');
        Route::post('/settings', [SettingController::class, 'update'])->name('settings.update');
    });
});

require __DIR__.'/auth.php';
