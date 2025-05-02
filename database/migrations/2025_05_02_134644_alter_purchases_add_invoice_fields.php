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
            if (!Schema::hasColumn('purchases', 'invoice_number')) {
                $table->string('invoice_number')->unique()->nullable(false);
            }
            if (!Schema::hasColumn('purchases', 'supplier_id')) {
                $table->foreignId('supplier_id')->nullable(false)->constrained()->onDelete('cascade');
            }
            if (!Schema::hasColumn('purchases', 'invoice_date')) {
                $table->date('invoice_date')->nullable(false);
            }
            if (!Schema::hasColumn('purchases', 'due_date')) {
                $table->date('due_date')->nullable();
            }
            if (!Schema::hasColumn('purchases', 'payment_date')) {
                $table->date('payment_date')->nullable();
            }
            if (!Schema::hasColumn('purchases', 'total')) {
                $table->decimal('total', 18, 2)->default(0);
            }
            if (!Schema::hasColumn('purchases', 'status')) {
                $table->enum('status', ['UNPAID', 'PAID'])->default('UNPAID');
            }
            if (!Schema::hasColumn('purchases', 'note')) {
                $table->string('note')->nullable();
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('purchases', function (Blueprint $table) {
            if (Schema::hasColumn('purchases', 'invoice_number')) {
                $table->dropColumn('invoice_number');
            }
            if (Schema::hasColumn('purchases', 'supplier_id')) {
                $table->dropForeign(['supplier_id']);
                $table->dropColumn('supplier_id');
            }
            if (Schema::hasColumn('purchases', 'invoice_date')) {
                $table->dropColumn('invoice_date');
            }
            if (Schema::hasColumn('purchases', 'due_date')) {
                $table->dropColumn('due_date');
            }
            if (Schema::hasColumn('purchases', 'payment_date')) {
                $table->dropColumn('payment_date');
            }
            if (Schema::hasColumn('purchases', 'total')) {
                $table->dropColumn('total');
            }
            if (Schema::hasColumn('purchases', 'status')) {
                $table->dropColumn('status');
            }
            if (Schema::hasColumn('purchases', 'note')) {
                $table->dropColumn('note');
            }
        });
    }
};
