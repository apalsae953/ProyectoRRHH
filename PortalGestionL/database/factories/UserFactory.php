<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\User>
 */
class UserFactory extends Factory
{
    /**
     * The current password being used by the factory.
     */
    protected static ?string $password;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $dni = $this->faker->unique()->randomNumber(8, true) . $this->faker->randomLetter();
        $dniNormalizado = strtoupper($dni);

        return [
            'name' => fake()->firstName(),
            'surname' => fake()->lastName() . ' ' . fake()->lastName(),
            'email' => fake()->unique()->safeEmail(),
            'dni' => $dni,
            'dni_normalizado' => $dniNormalizado,
            'email_verified_at' => now(),
            'password' => static::$password ??= \Illuminate\Support\Facades\Hash::make('password123'),
            'phone' => fake()->mobileNumber(),
            'position' => fake()->jobTitle(),
            'status' => fake()->randomElement(['active', 'active', 'active', 'inactive']), 
            'hired_at' => fake()->dateTimeBetween('-5 years', 'now'),
            'remember_token' => \Illuminate\Support\Str::random(10),
        ];
    }

    /**
     * Indicate that the model's email address should be unverified.
     */
    public function unverified(): static
    {
        return $this->state(fn (array $attributes) => [
            'email_verified_at' => null,
        ]);
    }
}
