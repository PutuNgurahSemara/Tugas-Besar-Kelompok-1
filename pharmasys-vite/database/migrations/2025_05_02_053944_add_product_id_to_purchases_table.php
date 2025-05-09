<?php

use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    public function up(): void
    {
        // Migration ini sudah tidak diperlukan karena kolom product, product_id, dan quantity sudah dihapus dari purchases
    }

    public function down(): void
    {
        // Tidak ada rollback
    }
};
