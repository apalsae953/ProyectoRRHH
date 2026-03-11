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

        // Calcular fin de periodo de prueba si no viene
        $probationUntil = $request->probation_until;
        if (!$probationUntil && isset($validatedData['hired_at'])) {
            $months = \App\Models\Setting::where('key', 'probation_months_default')->value('value') ?? 6;
            $probationUntil = \Carbon\Carbon::parse($validatedData['hired_at'])->addMonths((int)$months);
        }

        $user = User::create([
            'name' => $validatedData['name'],
            'surname' => $validatedData['surname'],
            'email' => $validatedData['email'],
            'dni' => $validatedData['dni'],
            'dni_normalizado' => $dniNormalizado,
            'password' => Hash::make($rawPassword),
            'phone' => $validatedData['phone'] ?? null,
            'address' => $validatedData['address'] ?? null,
            'position_id' => $validatedData['position_id'] ?? null,
            'department_id' => $validatedData['department_id'] ?? null,
            'hired_at' => $validatedData['hired_at'] ?? null,
            'probation_until' => $probationUntil,
            'status' => $validatedData['status'] ?? 'active',
        ]);

        // Asignar roles si vienen en la petición
        // Solo los administradores pueden asignar roles distintos a 'employee'
        $currentUser = $request->user();
        if ($request->has('roles')) {
            if ($currentUser && $currentUser->hasRole('admin')) {
                $user->syncRoles($request->roles);
            } else {
                // Si no es admin, ignoramos los roles enviados y ponemos el por defecto
                $user->assignRole('employee');
            }
        } else {
            $user->assignRole('employee'); // Este es el rol por defecto
        }

        // --- INICIALIZAR SALDO DE VACACIONES ---
        // Obtenemos los días por defecto de la configuración global
        $defaultVacationDays = \App\Models\Setting::where('key', 'vacation_days_per_year')->value('value') ?? 22;

        VacationBalance::create([
            'user_id' => $user->id,
            'year' => date('Y'),
            'accrued_days' => (int)$defaultVacationDays,
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
            return response()->json(['message' => 'Acceso denegado. No tienes permisos para editar empleados.'], 403);
        }

        $validatedData = $request->validate([
            'name' => 'required|string|max:255',
            'surname' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email,' . $employee->id,
            'dni' => ['required', 'string', 'unique:users,dni,' . $employee->id, new \App\Rules\ValidDni], // Permitir editar DNI
            'phone' => 'nullable|string',
            'address' => 'nullable|string|max:255',
            'position_id' => 'required|exists:positions,id',
            'department_id' => 'required|exists:departments,id',
            'status' => 'required|in:active,inactive',
            'hired_at' => 'required|date',
            'probation_until' => 'nullable|date',
            'roles' => 'sometimes|array', // Validar roles si vienen
        ]);

        // Normalizar DNI si ha cambiado
        $dniNormalizado = strtoupper(str_replace(['-', ' '], '', $validatedData['dni']));

        // Solo actualizar campos básicos
        $employee->update([
            'name' => $validatedData['name'],
            'surname' => $validatedData['surname'],
            'email' => $validatedData['email'],
            'dni' => $validatedData['dni'],
            'dni_normalizado' => $dniNormalizado,
            'phone' => $validatedData['phone'] ?? null,
            'address' => $validatedData['address'] ?? null,
            'position_id' => $validatedData['position_id'],
            'department_id' => $validatedData['department_id'],
            'status' => $validatedData['status'],
            'hired_at' => $validatedData['hired_at'],
            'probation_until' => $validatedData['probation_until'] ?? $employee->probation_until,
        ]);

        // Manejo de roles: Solo los administradores pueden cambiar roles
        if ($request->has('roles')) {
            if ($user->hasRole('admin')) {
                $employee->syncRoles($validatedData['roles']);
            } else {
                // Si es HR pero no admin, y trata de cambiar roles, podríamos devolver error o simplemente ignorar.
                // Según el requerimiento "Solo los admin pueden editar los roles", lo ignoramos o avisamos.
                // Aquí optamos por no cambiar nada si no es admin.
            }
        }

        return new EmployeeResource($employee->load(['department', 'position', 'roles']));
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

    /**
     * POST /api/v1/employees/{id}/reset-2fa
     */
    public function resetTwoFactor(Request $request, User $employee)
    {
        $user = $request->user();
        if (!$user->hasRole(['admin', 'hr_director'])) {
            return response()->json(['message' => 'Acceso denegado.'], 403);
        }

        $employee->two_factor_secret = null;
        $employee->save();

        return response()->json(['message' => 'La autenticación de doble factor ha sido desactivada para este empleado.']);
    }
}