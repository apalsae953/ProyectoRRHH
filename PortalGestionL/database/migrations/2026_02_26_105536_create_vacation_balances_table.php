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
        Schema::create('vacation_balances', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();

            $table->integer('year');
            $table->integer('accrued_days')->default(0); // Días que se acumulan cada año
            $table->integer('taken_days')->default(0); // Días que el empleado ha tomado
            $table->integer('carried_over_days')->default(0); // Días que se han llevado al siguiente año
            $table->date('expires_at')->nullable(); // Fecha en la que los días acumulados expiran
            
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('vacation_balances');
    }
};
