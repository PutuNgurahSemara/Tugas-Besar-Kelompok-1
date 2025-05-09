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
            // Attempt to drop the foreign key by its conventional name
            // If it doesn't exist, this might throw an error on some DBs,
            // but it's generally safer than the previous method.
            // Alternatively, wrap this in a try-catch or check if the column exists first.
            // For simplicity, we'll try dropping directly.
            try {
                 // Check if the column exists before trying to drop the foreign key
                 if (Schema::hasColumn('produk', 'purchase_id')) {
                    $table->dropForeign(['purchase_id']); // Laravel default naming convention
                 }
            } catch (\Exception $e) {
                // Log or ignore if the foreign key doesn't exist
                \Illuminate\Support\Facades\Log::warning("Could not drop foreign key 'produk_purchase_id_foreign': " . $e->getMessage());
            }

            // Drop the columns if they exist
            if (Schema::hasColumn('produk', 'quantity')) {
                $table->dropColumn('quantity');
            }
            if (Schema::hasColumn('produk', 'purchase_id')) {
                $table->dropColumn('purchase_id');
            }
            if (Schema::hasColumn('produk', 'expired_at')) {
                $table->dropColumn('expired_at');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('produk', function (Blueprint $table) {
            // Add the columns back
            $table->integer('quantity')->default(0)->after('harga');
            $table->date('expired_at')->nullable()->after('margin');
            $table->foreignId('purchase_id')->nullable()->after('category_id');

            // Add the foreign key back
            $table->foreign('purchase_id')->references('id')->on('purchases')->onDelete('set null');
        });
    }
};
