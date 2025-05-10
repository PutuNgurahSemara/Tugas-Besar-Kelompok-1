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
            // Store the sum of purchase_details totals before PPN
            $table->decimal('subtotal', 15, 2)->default(0)->after('total'); 
            // PPN percentage, e.g., 10 for 10%
            $table->decimal('ppn_percentage', 5, 2)->nullable()->default(0)->after('subtotal');
            // Calculated PPN amount
            $table->decimal('ppn_amount', 15, 2)->nullable()->default(0)->after('ppn_percentage');
            
            // Note: The existing 'total' column will now represent the grand total (subtotal + ppn_amount).
            // We might need to update existing records if 'total' previously meant subtotal.
            // For new records, the controller will calculate and store these correctly.
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('purchases', function (Blueprint $table) {
            $table->dropColumn(['subtotal', 'ppn_percentage', 'ppn_amount']);
        });
    }
};
