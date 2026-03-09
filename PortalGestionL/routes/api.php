<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\DocumentController;
use App\Http\Controllers\Api\V1\EmployeeController;
use App\Http\Controllers\Api\V1\HolidayDateController;
use App\Http\Controllers\Api\V1\VacationBalanceController;
use App\Http\Controllers\Api\V1\VacationController;
use App\Http\Controllers\Api\V1\DepartmentController;
use App\Http\Controllers\Api\V1\PositionController;
use App\Http\Resources\V1\EmployeeResource;

Route::prefix('v1')->group(function () {
    
    // Rutas públicas de Autenticación
    Route::prefix('auth')->group(function () {
        Route::post('/login', [AuthController::class, 'login']);
        Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
    });

    // Rutas protegidas (Requieren el token de Sanctum)
    Route::middleware('auth:sanctum')->group(function () {
        
        // Logout
        Route::post('/auth/logout', [AuthController::class, 'logout']);
        
        Route::get('/auth/me', function (Request $request) {
            return response()->json($request->user()->load('roles'));
        });

        Route::post('/auth/change-password', [AuthController::class, 'changePassword']);
        Route::post('/auth/profile', [AuthController::class, 'updateProfile']);

        // --- EMPLEADOS ---
        
        // Perfil propio del empleado autenticado
        Route::get('/employees/me', function (Request $request) {
            // Usamos el Resource que creamos para que devuelva el mismo formato JSON exacto
            return new EmployeeResource($request->user()->load('department'));
        });

        // CRUD completo de empleados (index, store, show, update, destroy)
        // Esto genera automáticamente las rutas GET, POST, PUT/PATCH y DELETE para /employees
        Route::apiResource('employees', EmployeeController::class);
        
        // --- DEPARTAMENTOS Y PUESTOS ---
        Route::apiResource('departments', DepartmentController::class);
        Route::apiResource('positions', PositionController::class);
        
        // --- DOCUMENTOS Y NÓMINAS ---
        
        // El empleado ve sus propios documentos (con filtros)
        Route::get('/employees/me/documents', [DocumentController::class, 'myDocuments']);
        
        // RRHH o Admin suben un documento a un empleado específico
        Route::post('/employees/{employee}/documents', [DocumentController::class, 'store']);
        
        // Descargar un documento (validando permisos)
        Route::get('/documents/{document}/download', [DocumentController::class, 'download']);
    
        // RRHH o Admin borran un documento
        Route::delete('/documents/{document}', [DocumentController::class, 'destroy']);

        // --- VACACIONES ---
        // Acciones del propio Empleado
        Route::get('/vacations/me', [VacationController::class, 'myVacations']); 
        Route::post('/vacations', [VacationController::class, 'store']); 
        Route::patch('/vacations/{vacation}', [VacationController::class, 'update']);
        Route::delete('/vacations/{vacation}', [VacationController::class, 'destroy']);

        // Acciones de RRHH / Admin
        Route::get('/vacations', [VacationController::class, 'index']);
        Route::post('/vacations/{vacation}/approve', [VacationController::class, 'approve']); 
        Route::post('/vacations/{vacation}/reject', [VacationController::class, 'reject']);

        // --- SALDOS DE VACACIONES ---
        Route::get('/vacation-balances/me', [VacationBalanceController::class, 'myBalance']);
        Route::patch('/vacation-balances/{balance}', [VacationBalanceController::class, 'update']);

        // --- CALENDARIO LABORAL (Festivos) ---
        // Usamos solo los métodos index, store y destroy
        Route::apiResource('holidays', HolidayDateController::class)->only(['index', 'store', 'destroy']);
    });
});