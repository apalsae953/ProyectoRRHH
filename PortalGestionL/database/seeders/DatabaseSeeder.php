<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Llamamos al seeder de roles
        $this->call([
            RoleAndPermissionSeeder::class,
        ]);
    }
}