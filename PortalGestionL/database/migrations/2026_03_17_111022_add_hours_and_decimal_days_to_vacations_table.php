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
            $table->decimal('days', 8, 2)->change();
            $table->decimal('hours', 8, 2)->nullable()->after('days');
        });

        Schema::table('vacation_balances', function (Blueprint $table) {
            $table->decimal('accrued_days', 8, 2)->change();
            $table->decimal('taken_days', 8, 2)->change();
            $table->decimal('carried_over_days', 8, 2)->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('vacation_balances', function (Blueprint $table) {
            $table->integer('accrued_days')->change();
            $table->integer('taken_days')->change();
            $table->integer('carried_over_days')->change();
        });

        Schema::table('vacations', function (Blueprint $table) {
            $table->integer('days')->change();
            $table->dropColumn('hours');
        });
    }
};
