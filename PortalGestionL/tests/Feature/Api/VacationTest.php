<?php

namespace Tests\Feature\Api;

use App\Models\User;
use App\Models\Vacation;
use App\Models\VacationBalance;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;
use Carbon\Carbon;

class VacationTest extends TestCase
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
    public function employee_can_request_vacations_with_enough_balance()
    {
        $user = User::factory()->create();
        $user->assignRole('employee');

        VacationBalance::create([
            'user_id' => $user->id,
            'year' => date('Y'),
            'accrued_days' => 22,
            'taken_days' => 0,
            'carried_over_days' => 0,
        ]);

        $response = $this->actingAs($user)->postJson('/api/v1/vacations', [
            'start_date' => date('Y-m-d', strtotime('next monday')),
            'end_date' => date('Y-m-d', strtotime('next monday + 4 days')), // 5 días laborables
            'note' => 'Mis vacaciones de prueba',
        ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('vacations', [
            'user_id' => $user->id,
            'days' => 5,
            'status' => 'pending'
        ]);
    }

    /** @test */
    public function employee_cannot_request_vacations_without_balance()
    {
        $user = User::factory()->create();
        $user->assignRole('employee');

        VacationBalance::create([
            'user_id' => $user->id,
            'year' => date('Y'),
            'accrued_days' => 2,
            'taken_days' => 0,
            'carried_over_days' => 0,
        ]);

        $response = $this->actingAs($user)->postJson('/api/v1/vacations', [
            'start_date' => date('Y-m-d', strtotime('next monday')),
            'end_date' => date('Y-m-d', strtotime('next monday + 10 days')),
        ]);

        $response->assertStatus(422)
                 ->assertJsonFragment(['message' => 'No tienes saldo suficiente. Días solicitados: 9. Saldo disponible: 2.']);
    }

    /** @test */
    public function hr_director_can_approve_vacation_and_balance_is_updated()
    {
        $hr = User::factory()->create();
        $hr->assignRole('hr_director');

        $employee = User::factory()->create();
        $balance = VacationBalance::create([
            'user_id' => $employee->id,
            'year' => date('Y'),
            'accrued_days' => 22,
            'taken_days' => 0,
            'carried_over_days' => 0,
        ]);

        $vacation = Vacation::create([
            'user_id' => $employee->id,
            'start_date' => date('Y-m-d'),
            'end_date' => date('Y-m-d', strtotime('+2 days')),
            'days' => 3,
            'status' => 'pending'
        ]);

        $response = $this->actingAs($hr)->postJson("/api/v1/vacations/{$vacation->id}/approve", [
            'admin_message' => 'Disfruta tus días'
        ]);

        $response->assertStatus(200);
        $this->assertEquals('approved', $vacation->fresh()->status);
        $this->assertEquals(3, $balance->fresh()->taken_days);
    }
}
