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
        
       $user = User::updateOrCreate(
            ['email' => 'admin@mail.com'],
            [
                'name' => "Admin Tiarana Farma",
                'password' => bcrypt('admin123'),
            ]
        );
        $user->assignRole('super-admin');
    }
}    
