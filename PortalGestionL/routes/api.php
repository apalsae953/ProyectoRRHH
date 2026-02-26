<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\EmployeeController;
use App\Http\Resources\V1\EmployeeResource;

Route::prefix('v1')->group(function () {
    
    // Rutas públicas de Autenticación
    Route::prefix('auth')->group(function () {
        Route::post('/login', [AuthController::class, 'login']);
    });

    // Rutas protegidas (Requieren el token de Sanctum)
    Route::middleware('auth:sanctum')->group(function () {
        
        // Logout
        Route::post('/auth/logout', [AuthController::class, 'logout']);
        
        // Obtener perfil actual
        Route::get('/auth/me', function (Request $request) {
            return response()->json($request->user());
        });

        // --- EMPLEADOS ---
        
        // Perfil propio del empleado autenticado
        Route::get('/employees/me', function (Request $request) {
            // Usamos el Resource que creamos para que devuelva el mismo formato JSON exacto
            return new EmployeeResource($request->user()->load('department'));
        });

        // CRUD completo de empleados (index, store, show, update, destroy)
        // Esto genera automáticamente las rutas GET, POST, PUT/PATCH y DELETE para /employees
        Route::apiResource('employees', EmployeeController::class);
    });
});