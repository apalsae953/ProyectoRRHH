<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\PermissionRegistrar;

class RoleAndPermissionSeeder extends Seeder
{
    public function run(): void
    {
        // Limpiamos la caché de permisos para asegurarnos de que se recarguen los nuevos permisos y roles
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        // Creamos los roles
        $roleAdmin = Role::create(['name' => 'admin']);
        $roleHrDirector = Role::create(['name' => 'hr_director']);
        $roleEmployee = Role::create(['name' => 'employee']);

        // Creamos un administrador por defecto para que podamos acceder al sistema después de correr el seeder
        $admin = User::create([
            'name' => 'Super',
            'surname' => 'Administrador',
            'email' => 'admin@portalrrhh.com',
            'dni' => '12345678Z',
            'dni_normalizado' => '12345678Z',
            'password' => Hash::make('password123'), 
            'phone' => '600000000',
            'position_id' => null,
            'status' => 'active',
            // department_id y hired_at quedan nulos por defecto como configuramos en la migración
        ]);

        // Asignarle el rol de admin al usuario que acabamos de crear
        $admin->assignRole($roleAdmin);
    }
}