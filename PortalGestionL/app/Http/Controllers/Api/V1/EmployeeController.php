<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use App\Http\Resources\V1\EmployeeResource;
use App\Http\Requests\Api\V1\StoreEmployeeRequest;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;

class EmployeeController extends Controller
{
    
    /**
     * GET /api/v1/employees (RRHH/Admin)
     */
    public function index()
    {
        // Usamos Eager Loading ('department') para evitar el problema de consultas N+1 
        $employees = User::with('department')->paginate(15);
        
        return EmployeeResource::collection($employees);
    }

    /**
     * POST /api/v1/employees (Admin)
     */
    public function store(StoreEmployeeRequest $request)
    {
        $validatedData = $request->validated();

        // Normalizar el DNI (mayúsculas, sin guiones/espacios)
        $dniNormalizado = strtoupper(str_replace(['-', ' '], '', $validatedData['dni']));

        $user = User::create([
            'name' => $validatedData['name'],
            'surname' => $validatedData['surname'],
            'email' => $validatedData['email'],
            'dni' => $validatedData['dni'],
            'dni_normalizado' => $dniNormalizado,
            'password' => Hash::make($validatedData['password']),
            'phone' => $validatedData['phone'] ?? null,
            'position' => $validatedData['position'] ?? null,
            'department_id' => $validatedData['department_id'] ?? null,
            'hired_at' => $validatedData['hired_at'] ?? null,
            'status' => $validatedData['status'] ?? 'active',
        ]);

        // Asignar roles si vienen en la petición
        if ($request->has('roles')) {
            $user->assignRole($request->roles);
        } else {
            $user->assignRole('employee'); // Este es el rol por defecto
        }

        return new EmployeeResource($user->load('department'));
    }

    /**
     * GET /api/v1/employees/{id}
     */
    public function show(User $employee)
    {
        return new EmployeeResource($employee->load('department'));
    }

  /**
     * DELETE /api/v1/employees/{id} (Admin)
     */
    public function destroy(Request $request, User $employee)
    {
        //Obtenemos el usuario que hace la petición
        $user = $request->user();

        //Comprobamos si no está logueado O si no tiene el rol de admin
        if (!$user || !$user->hasRole('admin')) {
            return response()->json([
                'message' => 'Acceso denegado. Solo los administradores pueden borrar empleados.'
            ], 403);
        }
        
        // Si todo está bien, borramos al empleado
        $employee->delete();
        
        return response()->json(['message' => 'Empleado eliminado correctamente'], 200);
    }
}