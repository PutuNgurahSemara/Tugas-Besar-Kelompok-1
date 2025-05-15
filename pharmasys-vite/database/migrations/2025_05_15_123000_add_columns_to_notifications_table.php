<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddColumnsToNotificationsTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::table('notifications', function (Blueprint $table) {
            $table->bigInteger('user_id')->after('notifiable_id')->nullable();
            $table->string('title')->after('data')->nullable();
            $table->string('description')->after('title')->nullable();
            $table->string('type')->after('description')->nullable();
            $table->string('link')->after('type')->nullable();
            $table->boolean('unread')->after('link')->default(true);
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::table('notifications', function (Blueprint $table) {
            $table->dropColumn(['user_id', 'title', 'description', 'type', 'link', 'unread']);
        });
    }
}
