<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class SettingController extends Controller
{
    public function index(Request $request)
    {
        if (!$request->user()->hasRole(['admin', 'hr_director'])) {
            return response()->json(['message' => 'Acceso denegado'], 403);
        }

        $settings = \App\Models\Setting::all()->pluck('value', 'key');
        return response()->json($settings);
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
