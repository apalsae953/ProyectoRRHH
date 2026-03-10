<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\HolidayDate;

class HolidayDateSeeder extends Seeder
{
    public function run(): void
    {
        $holidays = [
            ['date' => '2026-01-01', 'description' => 'Año Nuevo', 'scope' => 'national'],
            ['date' => '2026-01-06', 'description' => 'Epifanía del Señor (Reyes)', 'scope' => 'national'],
            ['date' => '2026-04-02', 'description' => 'Jueves Santo', 'scope' => 'national'],
            ['date' => '2026-04-03', 'description' => 'Viernes Santo', 'scope' => 'national'],
            ['date' => '2026-05-01', 'description' => 'Fiesta del Trabajo', 'scope' => 'national'],
            ['date' => '2026-08-15', 'description' => 'Asunción de la Virgen', 'scope' => 'national'],
            ['date' => '2026-10-12', 'description' => 'Fiesta Nacional de España', 'scope' => 'national'],
            ['date' => '2026-11-01', 'description' => 'Todos los Santos', 'scope' => 'national'],
            ['date' => '2026-12-06', 'description' => 'Día de la Constitución Española', 'scope' => 'national'],
            ['date' => '2026-12-08', 'description' => 'Inmaculada Concepción', 'scope' => 'national'],
            ['date' => '2026-12-25', 'description' => 'Natividad del Señor (Navidad)', 'scope' => 'national'],
        ];

        foreach ($holidays as $holiday) {
            HolidayDate::updateOrCreate(['date' => $holiday['date']], $holiday);
        }
    }
}
