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
        Schema::create('documents', function (Blueprint $table) {
            $table->id();
            //Llave externa para el usuario
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();

            //Tipo de documento
            $table->enum('type', ['payroll', 'contract', 'certificate', 'other']);

            //Periodo
            $table->integer('period_year')->nullable();
            $table->integer('period_month')->nullable();

            //Datos del archivo
            $table->string('title');
            $table->string('path'); //Ruta donde se guarda el archivo
            $table->unsignedBigInteger('size'); //Tamaño del archivo
            $table->string('mime'); //Tipo MIME del archivo

            //Llave externa para saber quien lo subio
            $table->foreignId('uploaded_by')->nullable()->constrained('users')->nullOnDelete();

            //Visibilidad del documento
            $table->enum('visibility', ['owner', 'hr'])->default('owner');
            $table->timestamp('signed_url_expires_at')->nullable(); // Para documentos con URL firmada

            $table->timestamps();

            //Indices para optimizar consultas
            $table->index(['user_id', 'period_year', 'period_month']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('documents');
    }
};
