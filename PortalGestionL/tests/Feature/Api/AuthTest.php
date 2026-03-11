<?php

namespace Tests\Feature\Api;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        // Crear roles básicos para los tests
        Role::create(['name' => 'admin']);
        Role::create(['name' => 'employee']);
        Role::create(['name' => 'hr_director']);
    }

    /** @test */
    public function a_user_can_login_with_valid_dni_and_password()
    {
        $user = User::factory()->create([
            'dni' => '12345678Z', // DNI válido (12345678 % 23 = 14 -> Z)
            'password' => bcrypt('password123'),
        ]);

        $response = $this->postJson('/api/v1/auth/login', [
            'dni' => '12345678Z',
            'password' => 'password123',
        ]);

        $response->assertStatus(200)
                 ->assertJsonStructure(['message', 'user']);
    }

    /** @test */
    public function a_user_cannot_login_with_invalid_dni_letter()
    {
        $user = User::factory()->create([
            'dni' => '12345678Z',
            'password' => bcrypt('password123'),
        ]);

        // Intentar con letra incorrecta
        $response = $this->postJson('/api/v1/auth/login', [
            'dni' => '12345678A',
            'password' => 'password123',
        ]);

        $response->assertStatus(422)
                 ->assertJsonValidationErrors(['dni']);
    }

    /** @test */
    public function login_requires_totp_if_enabled()
    {
        $user = User::factory()->create([
            'dni' => '12345678Z',
            'password' => bcrypt('password123'),
            'two_factor_secret' => 'SECRET123',
        ]);

        $response = $this->postJson('/api/v1/auth/login', [
            'dni' => '12345678Z',
            'password' => 'password123',
        ]);

        $response->assertStatus(403)
                 ->assertJson(['requires_2fa' => true]);
    }

    /** @test */
    public function user_can_get_their_own_profile()
    {
        $user = User::factory()->create(['dni' => '12345678Z']);
        $user->assignRole('employee');

        $response = $this->actingAs($user)->getJson('/api/v1/auth/me');

        $response->assertStatus(200)
                 ->assertJsonPath('id', $user->id);
    }
}
