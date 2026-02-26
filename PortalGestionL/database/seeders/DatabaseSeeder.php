<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            RoleAndPermissionSeeder::class, // Primero crea los roles y el Admin
            DummyDataSeeder::class,         // Luego crea los departamentos y 50 empleados
        ]);
    }
}