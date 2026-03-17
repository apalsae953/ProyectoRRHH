<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class SettingController extends Controller
{
    public function index(Request $request)
    {
        // Todos los empleados autenticados deben poder ver la configuración básica
        $settings = \App\Models\Setting::all()->pluck('value', 'key')->toArray();
        
        // Valores por defecto si no existen en la BD
        $defaults = [
            'vacation_days_per_year' => '22',
            'probation_months_default' => '6',
            'allow_overtime_request' => 'true',
            'max_vacation_carryover' => '5'
        ];

        return response()->json(array_merge($defaults, $settings));
    }

    public function update(Request $request)
    {
        if (!$request->user()->hasRole(['admin'])) {
            return response()->json(['message' => 'Acceso denegado. Solo Admin puede modificar.'], 403);
        }

        $data = $request->validate([
            'settings' => 'required|array',
        ]);

        foreach ($data['settings'] as $key => $value) {
            \App\Models\Setting::updateOrCreate(
                ['key' => $key],
                ['value' => is_array($value) ? json_encode($value) : $value]
            );
        }

        return response()->json(['message' => 'Configuración actualizada']);
    }
}
