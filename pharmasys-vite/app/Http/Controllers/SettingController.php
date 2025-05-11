<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan; // Untuk membersihkan cache config
use Illuminate\Support\Facades\File; // Untuk menulis ke file .env (hati-hati!) - Will remove .env update for now
use Inertia\Inertia;
use App\Models\Setting; // Uncommented model
use Illuminate\Support\Facades\Config; // Untuk akses config
use Illuminate\Support\Facades\Log;

class SettingController extends Controller
{
    public function index()
    {
        $settings = [
            'app_name' => Setting::getValue('app_name', Config::get('app.name', 'Pharmasys')),
            'low_stock_threshold' => (int) Setting::getValue('low_stock_threshold', 10),
            'default_profit_margin' => (float) Setting::getValue('default_profit_margin', 20),
            // Add other settings as needed
        ];

        return Inertia::render('Settings/Index', [
            'settings' => $settings
        ]);
    }

    public function update(Request $request)
    {
        $validated = $request->validate([
            'app_name' => 'required|string|max:50',
            'low_stock_threshold' => 'required|integer|min:0',
            'default_profit_margin' => 'required|numeric|min:0',
        ]);

        try {
            Setting::updateOrCreate(['key' => 'app_name'], ['value' => $validated['app_name']]);
            Setting::updateOrCreate(['key' => 'low_stock_threshold'], ['value' => $validated['low_stock_threshold']]);
            Setting::updateOrCreate(['key' => 'default_profit_margin'], ['value' => $validated['default_profit_margin']]);

            // Clear config cache if app_name changed, as it might be used by config('app.name')
            // Note: Directly modifying .env is generally discouraged in production controllers.
            // If .env modification is truly needed, it should be handled with extreme care
            // and potentially restricted to specific CLI commands or admin actions with warnings.
            // For now, we only update the DB setting. The application should preferably read from DB.
            if ($request->has('app_name') && Config::get('app.name') !== $validated['app_name']) {
                 // This updates the live config, but not .env.
                 Config::set('app.name', $validated['app_name']);
                 // Consider if .env update is critical or if reading from DB/config cache is sufficient.
                 // Artisan::call('config:cache'); // Re-cache config
            }

            return redirect()->route('settings.index')->with('success', 'Pengaturan berhasil diperbarui.');

        } catch (\Exception $e) {
            Log::error('Error updating settings: ' . $e->getMessage());
            return redirect()->route('settings.index')->with('error', 'Gagal memperbarui pengaturan: ' . $e->getMessage());
        }
    }
}
