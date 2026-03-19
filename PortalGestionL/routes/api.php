<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\DocumentController;
use App\Http\Controllers\Api\V1\EmployeeController;
use App\Http\Controllers\Api\V1\HolidayDateController;
use App\Http\Controllers\Api\V1\VacationBalanceController;
use App\Http\Controllers\Api\V1\VacationController;
use App\Http\Controllers\Api\V1\ReportController;
use App\Http\Controllers\Api\V1\LogController;
use App\Http\Controllers\Api\V1\DepartmentController;
use App\Http\Controllers\Api\V1\PositionController;
use App\Http\Resources\V1\EmployeeResource;

Route::prefix('v1')->group(function () {
    
    // Rutas públicas de Autenticación
    Route::prefix('auth')->group(function () {
        Route::post('/login', [AuthController::class, 'login']);
        Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
    });

    // Ruta de descarga de documentos (con URL temporal firmada para visualización directa)
    Route::get('/documents/{document}/download', [DocumentController::class, 'download'])
        ->name('documents.download')
        ->middleware('signed');

    // Rutas protegidas (Requieren el token de Sanctum)
    Route::middleware('auth:sanctum')->group(function () {
        
        // Logout
        Route::post('/auth/logout', [AuthController::class, 'logout']);
        
        Route::get('/auth/me', function (Request $request) {
            return response()->json($request->user()->load('roles', 'department', 'position'));
        });

        Route::post('/auth/change-password', [AuthController::class, 'changePassword']);
        Route::post('/auth/profile', [AuthController::class, 'updateProfile']);
        
        // 2FA Routes
        Route::post('/auth/2fa/enable', [AuthController::class, 'generate2FA']);
        Route::post('/auth/2fa/confirm', [AuthController::class, 'confirm2FA']);
        Route::post('/auth/2fa/disable', [AuthController::class, 'disable2FA']);

        // --- EMPLEADOS ---
        
        // Perfil propio del empleado autenticado
        Route::get('/employees/me', function (Request $request) {
            // Usamos el Resource que creamos para que devuelva el mismo formato JSON exacto
            return new EmployeeResource($request->user()->load('department'));
        });

        // CRUD completo de empleados (index, store, show, update, destroy)
        // Esto genera automáticamente las rutas GET, POST, PUT/PATCH y DELETE para /employees
        Route::apiResource('employees', EmployeeController::class);
        Route::post('/employees/{employee}/reset-2fa', [EmployeeController::class, 'resetTwoFactor']);
        
        // --- DEPARTAMENTOS Y PUESTOS ---
        Route::apiResource('departments', DepartmentController::class);
        Route::apiResource('positions', PositionController::class);
        
        // --- DOCUMENTOS Y NÓMINAS ---
        
        // El empleado ve sus propios documentos (con filtros)
        Route::get('/employees/me/documents', [DocumentController::class, 'myDocuments']);
        
        // RRHH o Admin gestionan documentos de un empleado específico
        Route::get('/employees/{employee}/documents-list', [DocumentController::class, 'employeeDocuments']);
        Route::post('/employees/{employee}/documents', [DocumentController::class, 'store']);
        
        // RRHH o Admin gestionan documentos de un empleado específico
        Route::patch('/documents/{document}', [DocumentController::class, 'update']);
        Route::delete('/documents/{document}', [DocumentController::class, 'destroy']);

        // --- VACACIONES ---
        // Acciones del propio Empleado
        Route::get('/vacations/me', [VacationController::class, 'myVacations']); 
        Route::post('/vacations', [VacationController::class, 'store']); 
        Route::patch('/vacations/{vacation}', [VacationController::class, 'update']);
        Route::delete('/vacations/{vacation}', [VacationController::class, 'destroy']);

        // Acciones de RRHH / Admin
        Route::get('/vacations', [VacationController::class, 'index']);
        Route::get('/vacations/calendar', [VacationController::class, 'calendar']);
        Route::post('/vacations/{vacation}/approve', [VacationController::class, 'approve']); 
        Route::post('/vacations/{vacation}/reject', [VacationController::class, 'reject']);

        // --- SALDOS DE VACACIONES ---
        Route::get('/vacation-balances/me', [VacationBalanceController::class, 'myBalance']);
        Route::patch('/vacation-balances/{balance}', [VacationBalanceController::class, 'update']);

        // --- CALENDARIO LABORAL (Festivos) ---
        // Usamos solo los métodos index, store y destroy
        Route::post('/holidays/bulk-delete', [HolidayDateController::class, 'bulkDestroy']);
        Route::apiResource('holidays', HolidayDateController::class)->only(['index', 'store', 'destroy']);

        // --- CONFIGURACIÓN GLOBAL ---
        Route::get('/settings', [\App\Http\Controllers\Api\V1\SettingController::class, 'index']);
        Route::patch('/settings', [\App\Http\Controllers\Api\V1\SettingController::class, 'update']);
        
        // --- REPORTES Y AUDITORÍA ---
        Route::get('/reports/dashboard', [ReportController::class, 'dashboard']);
        Route::get('/logs', [LogController::class, 'index']);
    });
});