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
        Schema::table('notifications', function (Blueprint $table) {
            if (!Schema::hasColumn('notifications', 'user_id')) {
                $table->bigInteger('user_id')->after('notifiable_id')->nullable();
            }
            if (!Schema::hasColumn('notifications', 'title')) {
                $table->string('title')->after('data')->nullable();
            }
            if (!Schema::hasColumn('notifications', 'description')) {
                $table->string('description')->after('title')->nullable();
            }
            if (!Schema::hasColumn('notifications', 'type')) {
                $table->string('type')->after('description')->nullable();
            }
            if (!Schema::hasColumn('notifications', 'link')) {
                $table->string('link')->after('type')->nullable();
            }
            if (!Schema::hasColumn('notifications', 'unread')) {
                $table->boolean('unread')->after('link')->default(true);
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Tidak perlu melakukan apa-apa di sini karena kita tidak ingin menghapus kolom yang sudah ada
    }
};
