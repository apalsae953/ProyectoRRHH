<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\VacationBalance;
use Carbon\Carbon;
use Illuminate\Http\Request;
use App\Http\Resources\V1\EmployeeResource;
use App\Http\Requests\Api\V1\StoreEmployeeRequest;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Support\Facades\Mail;
use App\Mail\WelcomeNewEmployee;

class EmployeeController extends Controller
{
    
    /**
     * GET /api/v1/employees (RRHH/Admin)
     */
    public function index()
    {
        // En lugar de paginar, traemos todos los empleados para que el filtro de React funcione correctamente sobre la lista completa
        $employees = User::with(['department', 'position'])->get();
        
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
        
        // Generar una contraseña aleatoria de 8 caracteres
        $rawPassword = $request->password ?? Str::random(8);

        $user = User::create([
            'name' => $validatedData['name'],
            'surname' => $validatedData['surname'],
            'email' => $validatedData['email'],
            'dni' => $validatedData['dni'],
            'dni_normalizado' => $dniNormalizado,
            'password' => Hash::make($rawPassword),
            'phone' => $validatedData['phone'] ?? null,
            'position_id' => $validatedData['position_id'] ?? null,
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

        // --- INICIALIZAR SALDO DE VACACIONES ---
        // Al crear un empleado, le asignamos por defecto el saldo del año actual (Normalmente 22 días según el word)
        VacationBalance::create([
            'user_id' => $user->id,
            'year' => date('Y'),
            'accrued_days' => 22,
            'taken_days' => 0,
            'carried_over_days' => 0,
        ]);

        // Enviar email de bienvenida con la contraseña aleatoria
        try {
            Mail::to($user->email)->send(new WelcomeNewEmployee($user, $rawPassword));
        } catch (\Exception $e) {
            \Log::error('Error enviando correo de bienvenida: ' . $e->getMessage());
        }

        return new EmployeeResource($user->load(['department', 'position']));
    }

    /**
     * GET /api/v1/employees/{id}
     */
    public function show(User $employee)
    {
        return new EmployeeResource($employee->load(['department', 'position']));
    }

    /**
     * PUT/PATCH /api/v1/employees/{id} (Admin/RRHH)
     */
    public function update(Request $request, User $employee)
    {
        $user = $request->user();
        if (!$user->hasRole(['admin', 'hr_director'])) {
            return response()->json(['message' => 'Acceso denegado.'], 403);
        }

        $validatedData = $request->validate([
            'name' => 'required|string|max:255',
            'surname' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email,' . $employee->id,
            'phone' => 'nullable|string',
            'position_id' => 'required|exists:positions,id',
            'department_id' => 'required|exists:departments,id',
            'status' => 'required|in:active,inactive',
            'hired_at' => 'required|date',
        ]);

        $employee->update($validatedData);

        return new EmployeeResource($employee->load(['department', 'position']));
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