<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Department;
use Illuminate\Http\Request;

class DepartmentController extends Controller
{
    public function index()
    {
        return response()->json(Department::orderBy('name')->get());
    }

    public function store(Request $request)
    {
        if (!$request->user()->hasRole(['admin', 'hr_director'])) {
            return response()->json(['message' => 'Acceso denegado.'], 403);
        }

        $request->validate([
            'name' => 'required|string|max:255|unique:departments,name'
        ]);

        $department = Department::create(['name' => $request->name]);
        return response()->json($department, 201);
    }

    public function destroy(Request $request, Department $department)
    {
        if (!$request->user()->hasRole(['admin', 'hr_director'])) {
            return response()->json(['message' => 'Acceso denegado.'], 403);
        }

        // Evitar borrar si tiene empleados (la bbdd tiene nullOnDelete pero si el cliente quiere validar lo puede hacer aquí)
        if ($department->users()->count() > 0) {
            return response()->json(['message' => 'No puedes borrar un departamento que tiene empleados asignados.'], 422);
        }

        $department->delete();
        return response()->json(['message' => 'Departamento borrado correctamente']);
    }
}
