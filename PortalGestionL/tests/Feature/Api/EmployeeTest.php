<?php

namespace Tests\Feature\Api;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class EmployeeTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Role::create(['name' => 'admin']);
        Role::create(['name' => 'hr_director']);
        Role::create(['name' => 'employee']);

        // Crear departamento y puesto para evitar fallos de integridad
        \App\Models\Department::create(['name' => 'Test Dept']);
        \App\Models\Position::create(['name' => 'Test Pos', 'department_id' => 1]);
    }

    /** @test */
    public function admin_can_create_a_new_employee()
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');

        $response = $this->actingAs($admin)->postJson('/api/v1/employees', [
            'name' => 'Test',
            'surname' => 'User',
            'email' => 'test@example.com',
            'dni' => '12345678Z', // Válido
            'phone' => '600000000',
            'address' => 'Test Street 123',
            'status' => 'active',
        ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('users', ['email' => 'test@example.com', 'dni' => '12345678Z']);
    }

    /** @test */
    public function standard_employee_cannot_create_employees()
    {
        $employee = User::factory()->create();
        $employee->assignRole('employee');

        $response = $this->actingAs($employee)->postJson('/api/v1/employees', [
            'name' => 'Illegal',
            'surname' => 'Entry',
            'email' => 'bad@example.com',
            'dni' => '11111111H',
        ]);

        $response->assertStatus(403);
    }

    /** @test */
    public function hr_director_can_update_employee_but_not_roles()
    {
        $hr = User::factory()->create();
        $hr->assignRole('hr_director');

        $target = User::factory()->create(['name' => 'Old Name']);
        $target->assignRole('employee');

        $response = $this->actingAs($hr)->putJson('/api/v1/employees/' . $target->id, [
            'name' => 'New Name',
            'surname' => 'New Surname',
            'email' => $target->email,
            'dni' => '12345678Z', // Usar uno válido explícito
            'phone' => '655655655',
            'status' => 'active',
            'hired_at' => now()->format('Y-m-d'),
            'position_id' => 1, // Simulamos IDs válidos (aunque no existan, la validación exists suele ser indulgente en sqlite si no hay constraints activas o si los creamos)
            'department_id' => 1,
            'roles' => ['admin'] // Intentar escalar privilegios
        ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('users', ['id' => $target->id, 'name' => 'New Name']);
        
        // Verificar que NO se cambió el rol
        $this->assertTrue($target->fresh()->hasRole('employee'));
        $this->assertFalse($target->fresh()->hasRole('admin'));
    }

    /** @test */
    public function admin_can_reset_an_employee_2fa()
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');

        $employee = User::factory()->create(['two_factor_secret' => 'HAS_SECRET']);

        $response = $this->actingAs($admin)->postJson("/api/v1/employees/{$employee->id}/reset-2fa");

        $response->assertStatus(200);
        $this->assertNull($employee->fresh()->two_factor_secret);
    }
}
