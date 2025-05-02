<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('produk', function (Blueprint $table) {
            $table->string('image')->nullable()->after('nama'); // Path gambar, bisa null
            $table->integer('quantity')->default(0)->after('harga'); // Jumlah stok, default 0
            $table->decimal('margin', 5, 2)->nullable()->after('quantity'); // Margin persentase (e.g., 15.00), bisa null
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('produk', function (Blueprint $table) {
            $table->dropColumn(['image', 'quantity', 'margin']);
        });
    }
};
