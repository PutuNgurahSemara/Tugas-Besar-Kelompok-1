<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan; // Untuk membersihkan cache config
use Illuminate\Support\Facades\File; // Untuk menulis ke file .env (hati-hati!)
use Inertia\Inertia;
// use App\Models\Setting; // Komentari model untuk sementara
use Illuminate\Support\Facades\Config; // Untuk akses config

class SettingController extends Controller
{
    public function index()
    {
        // Kembalikan data statis untuk tes
        $settings = [
            'app_name' => 'Testing Settings Page', 
        ];

        // Pastikan view path benar
        return Inertia::render('Settings/Index', [
            'settings' => $settings
        ]);
    }

    public function update(Request $request)
    {
        // Logika update di-skip untuk tes
        $validated = $request->validate([
            'app_name' => 'required|string|max:50',
        ]);
        return redirect()->route('settings.index')->with('success', 'Settings update simulated.'); 
    }

    // Helper function dihapus
} 