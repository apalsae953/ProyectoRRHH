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
        Schema::create('holiday_dates', function (Blueprint $table) {
            $table->id();
            $table->date('date');

            //Tipo de festividad
            $table->enum('scope', ['national', 'center', 'custom']);

            $table->unsignedBigInteger('center_id')->nullable(); // Solo para festividades de centro

            $table->string('description')->nullable(); // Descripción de la festividad
            $table->timestamps();

            // Índice para optimizar consultas por fecha
            $table->index('date');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('holiday_dates');
    }
};
