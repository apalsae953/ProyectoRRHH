<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Vacation;
use App\Models\VacationBalance;
use Illuminate\Http\Request;
use App\Http\Resources\V1\VacationResource;
use App\Http\Requests\Api\V1\StoreVacationRequest;
use Carbon\Carbon;
use Illuminate\Support\Facades\Mail;
use App\Mail\VacationRequestProcessed;
use App\Mail\VacationRequestedAdmin;
use App\Models\User;

class VacationController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        //Validar permisos: Solo la directiva puede ver las vacaciones de todos
        if (!$user->hasRole(['admin', 'hr_director'])) {
            return response()->json(['message' => 'Acceso denegado. Solo RRHH o Admin pueden ver todas las vacaciones.'], 403);
        }

        // Iniciar la consulta cargando al empleado y al aprobador 
        $query = Vacation::with(['user', 'approver']);

        // Aplicar filtros dinámicos si vienen en la URL (ej: /vacations?status=pending)
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }
        
        if ($request->has('user_id')) {
            $query->where('user_id', $request->user_id);
        }

        // Ordenar por fecha de inicio más reciente y paginar
        $vacations = $query->latest('start_date')->paginate(15);

        return VacationResource::collection($vacations);
    }

    public function myVacations(Request $request)
    {
        // Traemos sus vacaciones ordenadas por las más recientes y cargamos quién las aprobó
        $vacations = $request->user()->vacations()->with('approver')->latest('start_date')->paginate(10);
        
        return VacationResource::collection($vacations);
    }

    public function store(StoreVacationRequest $request)
    {
        $user = $request->user(); // El usuario que solicita las vacaciones
        $startDate = Carbon::parse($request->start_date); // Convertimos a Carbon para facilitar cálculos
        $endDate = Carbon::parse($request->end_date);
        
        // Evitamos que se solapen
        $hasOverlap = Vacation::where('user_id', $user->id)
            ->whereIn('status', ['pending', 'approved']) // Solo comprobamos las pendientes o aprobadas
            ->where(function ($query) use ($startDate, $endDate) {
                $query->whereBetween('start_date', [$startDate, $endDate])
                      ->orWhereBetween('end_date', [$startDate, $endDate])
                      ->orWhere(function ($q) use ($startDate, $endDate) {
                          $q->where('start_date', '<=', $startDate)
                            ->where('end_date', '>=', $endDate);
                      });
            })->exists();

        if ($hasOverlap) {
            return response()->json(['message' => 'Ya tienes una solicitud pendiente o aprobada que se solapa con estas fechas.'], 422);
        }

        // --- CÁLCULO DE DÍAS ---
        // Obtenemos los festivos registrados en esas fechas
        $holidays = \App\Models\HolidayDate::whereBetween('date', [$startDate, $endDate])
            ->pluck('date')
            ->map(function($date) {
                return $date->format('Y-m-d');
            })
            ->toArray();

        // Aquí calculamos los días laborables restando fines de semana y la tabla 'holiday_dates'
        $daysRequested = $startDate->diffInDaysFiltered(function (Carbon $date) use ($holidays) {
            return $date->isWeekday() && !in_array($date->format('Y-m-d'), $holidays); // Solo cuenta de lunes a viernes y no festivos
        }, $endDate) + 1; // +1 para incluir el día de inicio

        // --- Validar Saldo ---
        $currentYear = $startDate->year;
        $balance = VacationBalance::where('user_id', $user->id)->where('year', $currentYear)->first();

        // Asumimos que si no tiene registro de saldo, tiene 0 días
        $diasDisponibles = $balance ? ($balance->accrued_days + $balance->carried_over_days - $balance->taken_days) : 0;

        if ($daysRequested > $diasDisponibles) {
            return response()->json([
                'message' => "No tienes saldo suficiente. Días solicitados: {$daysRequested}. Saldo disponible: {$diasDisponibles}."
            ], 422);
        }

        // --- CREACIÓN ---
        $vacation = Vacation::create([
            'user_id' => $user->id,
            'start_date' => $startDate,
            'end_date' => $endDate,
            'days' => $daysRequested,
            'status' => 'pending', // Entra como pendiente directamente a RRHH
            'note' => $request->note,
        ]);

        // Enviar aviso al Admin (jefesupremogm@gmail.com)
        try {
            Mail::to('jefesupremogm@gmail.com')->send(new VacationRequestedAdmin($vacation));
        } catch (\Exception $e) {
            \Log::error('Error avisando al admin de nueva solicitud: ' . $e->getMessage());
        }

        return new VacationResource($vacation);
    }

    /**
     * PATCH /api/v1/vacations/{id}
     * El empleado cancela su solicitud si está pendiente [cite: 113-114, 142]
     */
    public function update(Request $request, Vacation $vacation)
    {
        $user = $request->user();

        // Validar que la solicitud pertenece al usuario que la intenta cancelar
        if ($vacation->user_id !== $user->id) {
            return response()->json(['message' => 'Acceso denegado. No es tu solicitud.'], 403);
        }

        // Si la petición incluye el cambio de estado a cancelado
        if ($request->has('status') && $request->status === 'canceled') {
            
            // Regla: Cancelar solo si 'pending' o 'approved' y NO ha empezado el periodo
            if (!in_array($vacation->status, ['pending', 'approved'])) {
                return response()->json(['message' => 'Solo se pueden cancelar solicitudes pendientes o aprobadas.'], 422);
            }

            $startDate = Carbon::parse($vacation->start_date);
            if ($startDate->isPast() || $startDate->isToday()) {
                return response()->json(['message' => 'No puedes cancelar vacaciones que ya han empezado o han pasado.'], 422);
            }

            // Exigimos motivo de cancelación
            $request->validate(['cancel_reason' => 'required|string|min:5']);

            // Si estaba aprobada, RESTAURAMOS el saldo al trabajador
            if ($vacation->status === 'approved') {
                $year = $startDate->year;
                $balance = VacationBalance::where('user_id', $vacation->user_id)->where('year', $year)->first();
                if ($balance) {
                    $balance->taken_days -= $vacation->days;
                    $balance->save();
                }
            }

            $vacation->update([
                'status' => 'canceled',
                'cancel_reason' => $request->cancel_reason
            ]);

            return response()->json([
                'message' => 'Solicitud cancelada correctamente y saldo actualizado.', 
                'data' => new VacationResource($vacation)
            ]);
        }

        return response()->json(['message' => 'Operación de actualización no soportada.'], 400);
    }

    /**
     * POST /api/v1/vacations/{id}/approve
     * RRHH aprueba la solicitud [cite: 115, 142]
     */
    public function approve(Request $request, Vacation $vacation)
    {
        $user = $request->user();

        // Validar permisos (Solo RRHH o Admin) 
        if (!$user->hasRole(['admin', 'hr_director'])) {
            return response()->json(['message' => 'Acceso denegado. Solo RRHH puede aprobar.'], 403);
        }

        if ($vacation->status !== 'pending') {
            return response()->json(['message' => 'La solicitud no está en estado pendiente.'], 422);
        }

        // Descontar saldo de vacaciones del año correspondiente 
        $currentYear = \Carbon\Carbon::parse($vacation->start_date)->year;
        $balance = VacationBalance::where('user_id', $vacation->user_id)->where('year', $currentYear)->first();

        if ($balance) {
            $balance->taken_days += $vacation->days;
            $balance->save();
        }

        // Actualizar el estado y guardar quién lo aprobó
        $vacation->update([
            'status' => 'approved',
            'approver_id' => $user->id,
            'admin_message' => $request->admin_message,
        ]);

        // Disparar evento de notificación al empleado por email 
        try {
            Mail::to($vacation->user->email)->send(new VacationRequestProcessed($vacation));
        } catch (\Exception $e) {
            \Log::error('Error enviando correo de vacaciones: ' . $e->getMessage());
        }

        return response()->json([
            'message' => 'Vacaciones aprobadas y saldo descontado correctamente.', 
            'data' => new VacationResource($vacation)
        ]);
    }

    public function reject(Request $request, Vacation $vacation)
    {
        $user = $request->user();

        // Validar permisos
        if (!$user->hasRole(['admin', 'hr_director'])) {
            return response()->json(['message' => 'Acceso denegado. Solo RRHH puede rechazar.'], 403);
        }

        if ($vacation->status !== 'pending') {
            return response()->json(['message' => 'La solicitud no está en estado pendiente.'], 422);
        }

        // Actualizar el estado y guardar quién lo rechazó
        $vacation->update([
            'status' => 'rejected',
            'approver_id' => $user->id,
            'admin_message' => $request->admin_message,
        ]);

        // Disparar evento de notificación al empleado por email 
        try {
            Mail::to($vacation->user->email)->send(new VacationRequestProcessed($vacation));
        } catch (\Exception $e) {
            \Log::error('Error enviando correo de rechazo de vacaciones: ' . $e->getMessage());
        }

        return response()->json([
            'message' => 'Vacaciones rechazadas.', 
            'data' => new VacationResource($vacation)
        ]);
    }

    /**
     * DELETE /api/v1/vacations/{id}
     * Borrar del historial si está cancelada, rechazada o es pasada
     */
    public function destroy(Request $request, Vacation $vacation)
    {
        $user = $request->user();

        // Solo puede borrar su propia solicitud
        if ($vacation->user_id !== $user->id) {
            return response()->json(['message' => 'Solo puedes borrar tus propias solicitudes.'], 403);
        }

        $canDelete = false;

        // 1. Si está cancelada o rechazada
        if (in_array($vacation->status, ['canceled', 'rejected'])) {
            $canDelete = true;
        }

        // 2. Si ya ha pasado la fecha de fin (histórico)
        if (Carbon::parse($vacation->end_date)->isPast()) {
            $canDelete = true;
        }

        if (!$canDelete) {
            return response()->json(['message' => 'No puedes borrar una solicitud activa o pendiente.'], 422);
        }

        $vacation->delete();

        return response()->json(['message' => 'Solicitud eliminada del historial.']);
    }
}