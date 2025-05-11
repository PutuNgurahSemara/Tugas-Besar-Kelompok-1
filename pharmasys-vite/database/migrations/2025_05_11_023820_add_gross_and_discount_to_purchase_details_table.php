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
        Schema::table('purchase_details', function (Blueprint $table) {
            $table->decimal('gross_amount', 15, 2)->default(0)->after('harga_satuan')->comment('Total amount before item discount (qty * harga_satuan)');
            $table->decimal('discount_percentage', 5, 2)->nullable()->default(0)->after('gross_amount')->comment('Item discount percentage');
            // The existing 'total' column will represent the sub_total for the item (gross_amount - discount_amount)
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('purchase_details', function (Blueprint $table) {
            $table->dropColumn('gross_amount');
            $table->dropColumn('discount_percentage');
        });
    }
};
