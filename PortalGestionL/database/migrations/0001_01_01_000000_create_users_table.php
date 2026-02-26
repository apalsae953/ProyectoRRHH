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
        Schema::create('users', function (Blueprint $table) {
            //Añadimos el campo 'surname' a la tabla 'users'
            $table->id();
            $table->string('name');
            $table->string('surname');
            $table->string('email')->unique();
            //Metemos los campos necesarios para dni
            $table->string('dni')->unique();
            $table->string('dni_normalizado');

            $table->string('password');
            $table->string('phone')->nullable();
            $table->string('position')->nullable();

            //Llave externa para el departamento
            $table->foreignId('department_id')->nullable()->constrained('departments')->nullOnDelete();

            $table->date('hired_at')->nullable();// Campo para la fecha de contratación (lo pongo en ingles porque no me fio)

            //Estado del usuario
            $table->enum('status', ['active', 'inactive'])->default('active');

            //Autenticación en 2 pasos
            $table->text('two_factor_secret')->nullable();

            $table->timestamp('email_verified_at')->nullable();
            $table->rememberToken();
            $table->timestamps();
        });

        Schema::create('password_reset_tokens', function (Blueprint $table) {
            $table->string('email')->primary();
            $table->string('token');
            $table->timestamp('created_at')->nullable();
        });

        Schema::create('sessions', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->foreignId('user_id')->nullable()->index();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->longText('payload');
            $table->integer('last_activity')->index();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('users');
        Schema::dropIfExists('password_reset_tokens');
        Schema::dropIfExists('sessions');
    }
};
