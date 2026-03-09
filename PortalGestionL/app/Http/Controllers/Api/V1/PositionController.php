<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Position;
use Illuminate\Http\Request;

class PositionController extends Controller
{
    public function index()
    {
        return response()->json(Position::orderBy('name')->get());
    }

    public function store(Request $request)
    {
        if (!$request->user()->hasRole(['admin', 'hr_director'])) {
            return response()->json(['message' => 'Acceso denegado.'], 403);
        }

        $request->validate([
            'name' => 'required|string|max:255|unique:positions,name'
        ]);

        $position = Position::create(['name' => $request->name]);
        return response()->json($position, 201);
    }

    public function destroy(Request $request, Position $position)
    {
        if (!$request->user()->hasRole(['admin', 'hr_director'])) {
            return response()->json(['message' => 'Acceso denegado.'], 403);
        }

        if ($position->users()->count() > 0) {
            return response()->json(['message' => 'No puedes borrar un puesto de trabajo que tiene empleados asignados.'], 422);
        }

        $position->delete();
        return response()->json(['message' => 'Puesto borrado correctamente']);
    }
}
