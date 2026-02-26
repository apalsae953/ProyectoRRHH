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
        Schema::create('vacations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();

            $table->date('start_date');
            $table->date('end_date');
            $table->integer('days');

            //Estado de la solicitud
            $table->enum('status', ['draft', 'pending', 'approved', 'rejected', 'canceled'])->default('draft');

            //Director que aprueba o rechaza la solicitud
            $table->foreignId('approver_id')->nullable()->constrained('users')->nullOnDelete();

            $table->text('note')->nullable(); //Nota del empleado al solicitar las vacaciones
            $table->timestamps();

            //Indices para optimizar consultas
            $table->index(['user_id', 'start_date']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('vacations');
    }
};
