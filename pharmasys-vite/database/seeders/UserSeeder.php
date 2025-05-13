<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Support\Str;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        // Create Super Admin
        $admin = User::updateOrCreate(
            ['email' => 'admin@mail.com'],
            [
                'name' => "Admin Tiarana Farma",
                'password' => Hash::make('admin123'),
            ]
        );
        $admin->assignRole('admin');

        // Create Cashier
        $cashier = User::updateOrCreate(
            ['email' => 'udin@mail.com'],
            [
                'name' => "Udin",
                'password' => Hash::make('Udin12345678'),
            ]
        );
        $cashier->assignRole('cashier');
    }
}    
