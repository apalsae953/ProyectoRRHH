<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Department;
use App\Models\VacationBalance;
use Spatie\Permission\Models\Role;

class DummyDataSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Asegurarnos de que el rol de empleado existe
        $employeeRole = Role::firstOrCreate(['name' => 'employee']);

        // 2. Crear 5 departamentos falsos
        $departments = ['Ventas', 'IT', 'Marketing', 'Recursos Humanos', 'Logística'];
        $createdDepartments = [];
        foreach ($departments as $deptName) {
            $createdDepartments[] = Department::create(['name' => $deptName]);
        }

        // 3. Crear 50 usuarios usando la Factory
        User::factory(50)->create()->each(function ($user) use ($createdDepartments, $employeeRole) {
            
            // Asignarle un departamento al azar
            $user->update([
                'department_id' => $createdDepartments[array_rand($createdDepartments)]->id
            ]);

            // Asignarle el rol de empleado
            $user->assignRole($employeeRole);

            // Generarle un saldo de vacaciones aleatorio para este año
            VacationBalance::create([
                'user_id' => $user->id,
                'year' => date('Y'),
                'accrued_days' => 22,
                'taken_days' => rand(0, 15), // Entre 0 y 15 días ya gastados
                'carried_over_days' => rand(0, 3), // Algunos días arrastrados del año anterior
            ]);
        });
    }
}