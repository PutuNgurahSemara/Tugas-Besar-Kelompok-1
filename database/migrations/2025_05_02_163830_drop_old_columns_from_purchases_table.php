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
        Schema::table('purchases', function (Blueprint $table) {
            if (Schema::hasColumn('purchases', 'product')) {
                $table->dropColumn('product');
            }
            if (Schema::hasColumn('purchases', 'category_id')) {
                $table->dropColumn('category_id');
            }
            if (Schema::hasColumn('purchases', 'cost_price')) {
                $table->dropColumn('cost_price');
            }
            if (Schema::hasColumn('purchases', 'quantity')) {
                $table->dropColumn('quantity');
            }
            if (Schema::hasColumn('purchases', 'image')) {
                $table->dropColumn('image');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Tidak perlu menambah kembali kolom lama
    }
};
