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
        Schema::table('vacations', function (Blueprint $table) {
            $table->text('cancel_reason')->nullable()->after('note');
            $table->text('admin_message')->nullable()->after('cancel_reason');
            $table->string('type')->default('vacation')->after('id'); // e.g. vacation, sick_leave
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('vacations', function (Blueprint $table) {
            $table->dropColumn(['cancel_reason', 'admin_message', 'type']);
        });
    }
};
