<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Database\Seeder;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        // Gunakan firstOrCreate untuk memastikan user tidak duplikat
        $user = User::firstOrCreate(
            ['email' => 'admin@mail.com'], // kondisi pencarian berdasarkan email
            [
                'name' => 'CodeAstro',
                'password' => Hash::make('codeastro.com'),
            ]
        );

        // Pastikan role 'super-admin' diberikan jika belum ada
        $user->assignRole('super-admin');
    }
}