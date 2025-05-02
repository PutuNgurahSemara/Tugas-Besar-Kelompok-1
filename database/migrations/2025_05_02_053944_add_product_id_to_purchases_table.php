<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('purchases', function (Blueprint $table) {
            // Tambahkan kolom product_id yang nullable
            $table->foreignId('product_id')->nullable()->after('product');
            
            // Tambahkan foreign key ke tabel produk
            $table->foreign('product_id')->references('id')->on('produk')->onDelete('set null');
        });
        
        // Untuk PostgreSQL, perlu menggunakan raw SQL query untuk mengubah tipe data kolom
        if (DB::getDriverName() === 'pgsql') {
            // PostgreSQL - Ubah tipe kolom
            DB::statement('ALTER TABLE purchases ALTER COLUMN quantity TYPE INTEGER USING (quantity::integer)');
        } else {
            // MySQL atau driver lain
            Schema::table('purchases', function (Blueprint $table) {
                $table->integer('quantity')->change();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Untuk PostgreSQL, perlu menggunakan raw SQL query untuk mengembalikan tipe data kolom
        if (DB::getDriverName() === 'pgsql') {
            // PostgreSQL - Ubah tipe kolom kembali ke varchar
            DB::statement('ALTER TABLE purchases ALTER COLUMN quantity TYPE VARCHAR(255)');
        } else {
            // MySQL atau driver lain
            Schema::table('purchases', function (Blueprint $table) {
                $table->string('quantity')->change();
            });
        }
        
        Schema::table('purchases', function (Blueprint $table) {
            // Hapus foreign key
            $table->dropForeign(['product_id']);
            
            // Hapus kolom
            $table->dropColumn('product_id');
        });
    }
};
