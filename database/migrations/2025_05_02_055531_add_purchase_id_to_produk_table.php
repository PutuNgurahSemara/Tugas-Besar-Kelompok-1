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
            // Tambahkan kolom purchase_id yang nullable
            $table->foreignId('purchase_id')->nullable()->after('category_id');
            
            // Tambahkan foreign key ke tabel purchases
            $table->foreign('purchase_id')->references('id')->on('purchases')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('produk', function (Blueprint $table) {
            // Hapus foreign key
            $table->dropForeign(['purchase_id']);
            
            // Hapus kolom
            $table->dropColumn('purchase_id');
        });
    }
};
