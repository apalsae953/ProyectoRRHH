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

        // Iniciar la consulta cargando al empleado y al aprobador 
        $query = Vacation::with(['user', 'approver']);

        // Si NO es admin/rrhh, solo puede ver las aprobadas o las suyas propias
        if (!$user->hasRole(['admin', 'hr_director'])) {
            $query->where(function ($q) use ($user) {
                $q->where('status', 'approved')
                  ->orWhere('user_id', $user->id);
            });
        }

        // Aplicar filtros dinámicos si vienen en la URL (ej: /vacations?status=pending)
        if ($request->has('status')) {
            // Si es un empleado normal y pide 'pending', no debería ver las de otros
            if (!$user->hasRole(['admin', 'hr_director']) && $request->status === 'pending') {
                $query->where('status', 'pending')->where('user_id', $user->id);
            } else {
                $query->where('status', $request->status);
            }
        }
        
        if ($request->has('user_id')) {
            // Un empleado solo puede filtrar por su propio ID
            if (!$user->hasRole(['admin', 'hr_director']) && (int)$request->user_id !== $user->id) {
                 return response()->json(['message' => 'No tienes permiso para ver las vacaciones de este usuario.'], 403);
            }
            $query->where('user_id', $request->user_id);
        }

        // Ordenamos por fecha de inicio para que las más recientes aparezcan primero
        $vacations = $query->latest('start_date')->get();

        return VacationResource::collection($vacations);
    }

    public function calendar(Request $request)
    {
        $user = $request->user();

        // Validar permisos: Solo la directiva puede ver el calendario global de vacaciones completo
        if (!$user->hasRole(['admin', 'hr_director'])) {
             return response()->json(['message' => 'Acceso denegado. Solo RRHH o Admin pueden ver el calendario global.'], 403);
        }

        // Devolvemos las vacaciones aprobadas o pendientes, cargando usuario
        $vacations = Vacation::with('user')
            ->whereIn('status', ['approved', 'pending'])
            ->get();

        return response()->json([
            'data' => $vacations->map(function ($vacation) {
                return [
                    'id' => $vacation->id,
                    'title' => $vacation->user->name . ' ' . $vacation->user->surname,
                    'start' => $vacation->start_date,
                    'end' => Carbon::parse($vacation->end_date)->addDay()->format('Y-m-d'), // Calendarios suelen ser exclusivos en el fin
                    'status' => $vacation->status,
                    'user_id' => $vacation->user_id,
                    'type' => $vacation->type,
                    'days_used' => $vacation->days_used,
                ];
            })
        ]);
    }

    public function myVacations(Request $request)
    {
        // Recuperamos todas las solicitudes del usuario autenticado para que el frontend gestione la visualización
        $vacations = $request->user()->vacations()->with('approver')->latest('start_date')->get();
        
        return VacationResource::collection($vacations);
    }

    public function store(StoreVacationRequest $request)
    {
        $user = $request->user(); // El usuario que solicita las vacaciones
        $startDate = Carbon::parse($request->start_date); // Convertimos a Carbon para facilitar cálculos
        $endDate = Carbon::parse($request->end_date);
        
        // Comprobar solapamiento con otras solicitudes (pendientes o aprobadas)
        $hasOverlap = Vacation::where('user_id', $user->id)
            ->whereIn('status', ['pending', 'approved'])
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

        // --- VALIDAR POLÍTICA DE HORAS EXTRA ---
        $type = $request->input('type', 'vacation');
        $hours = null;
        $daysRequested = 0;

        if ($type === 'overtime') {
            $allowOvertime = \App\Models\Setting::where('key', 'allow_overtime_request')->value('value') ?? 'true';
            if ($allowOvertime === 'false') {
                return response()->json(['message' => 'Las solicitudes de compensación por horas extra están desactivadas globalmente.'], 403);
            }
            $hours = $request->input('hours');
            if (!$hours) {
                // Si no viene en campo aparte, intentar extraerlo de la nota (por compatibilidad temporal)
                preg_match('/Compensación: ([\d.]+) horas/', $request->note, $matches);
                $hours = isset($matches[1]) ? (float)$matches[1] : 0;
            }
            // Estimación de días: 8h = 1 día (o lo guardamos como decimal)
            $hoursPerDay = \App\Models\Setting::where('key', 'hours_per_working_day')->value('value') ?? 8;
            $daysRequested = $hours / (float)$hoursPerDay;
        } else {
            // --- CÁLCULO DE DÍAS (SOLO PARA VACACIONES O ENFERMEDAD) ---
            // Obtener festivos en el rango para no descontarlos del saldo
            $holidays = \App\Models\HolidayDate::whereBetween('date', [$startDate, $endDate])
                ->get()
                ->pluck('date')
                ->map(function($date) {
                    return $date->format('Y-m-d');
                })
                ->toArray();

            // Aquí calculamos los días laborables restando fines de semana y la tabla 'holiday_dates'
            $daysRequested = $startDate->diffInDaysFiltered(function (Carbon $date) use ($holidays) {
                return $date->isWeekday() && !in_array($date->format('Y-m-d'), $holidays); 
            }, $endDate) + 1;
        }

        // --- Validar Saldo (SOLO PARA VACACIONES) ---
        if ($type === 'vacation') {
            $currentYear = $startDate->year;
            $balance = VacationBalance::where('user_id', $user->id)->where('year', $currentYear)->first();
            $diasDisponibles = $balance ? ($balance->accrued_days + $balance->carried_over_days - $balance->taken_days) : 0;

            if ($daysRequested > $diasDisponibles) {
                return response()->json([
                    'message' => "No tienes saldo suficiente. Días solicitados: {$daysRequested}. Saldo disponible: {$diasDisponibles}."
                ], 422);
            }
        }

        // --- CREACIÓN ---
        $vacation = Vacation::create([
            'user_id' => $user->id,
            'start_date' => $startDate,
            'end_date' => $endDate,
            'type' => $type,
            'days' => $daysRequested,
            'hours' => $hours,
            'status' => 'pending', 
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

        $isHrOrAdmin = $user->hasRole(['admin', 'hr_director']);

        // Validar que la solicitud pertenece al usuario que la intenta cancelar, a menos que sea Admin/RRHH
        if ($vacation->user_id !== $user->id && !$isHrOrAdmin) {
            return response()->json(['message' => 'Acceso denegado. No tienes permiso para cancelar esta solicitud.'], 403);
        }

        // Si la petición incluye el cambio de estado a cancelado
        if ($request->has('status') && $request->status === 'canceled') {
            
            // Regla: Cancelar solo si 'pending' o 'approved' y NO ha empezado el periodo
            if (!in_array($vacation->status, ['pending', 'approved'])) {
                return response()->json(['message' => 'Solo se pueden cancelar solicitudes pendientes o aprobadas.'], 422);
            }

            $startDate = Carbon::parse($vacation->start_date);
            // Si el día ya ha pasado/es hoy, el empleado NO puede cancelar, pero el ADMIN SÍ (por si no se hicieron las horas, etc)
            if (($startDate->isPast() || $startDate->isToday()) && !$isHrOrAdmin) {
                return response()->json(['message' => 'No puedes cancelar solicitudes que ya han empezado o han pasado. Contacta con RRHH.'], 422);
            }

            // Exigimos motivo de cancelación
            $request->validate(['cancel_reason' => 'required|string|min:5']);

            // Ajustar saldo si la solicitud ya estaba aprobada
            if ($vacation->status === 'approved') {
                $year = $startDate->year;
                $balance = VacationBalance::where('user_id', $vacation->user_id)->where('year', $year)->first();
                
                if ($balance) {
                    if ($vacation->type === 'vacation') {
                        // Restauramos días de vacaciones (quitamos de los disfrutados)
                        $balance->taken_days -= $vacation->days;
                    } elseif ($vacation->type === 'overtime') {
                        // Quitamos los días compensatorios que se habían sumado
                        $balance->accrued_days -= $vacation->days;
                    }
                    $balance->save();
                }
            }

            $vacation->update([
                'status' => 'canceled',
                'cancel_reason' => $request->cancel_reason
            ]);

            // Notificamos a RRHH de la cancelación
            try {
                Mail::to('jefesupremogm@gmail.com')->send(new \App\Mail\VacationCanceledAdmin($vacation));
            } catch (\Exception $e) {
                \Log::error('Error avisando al admin de cancelación: ' . $e->getMessage());
            }

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

        // Gestionar saldo según el tipo
        if ($vacation->type === 'vacation') {
            // Descontar del tomado
            $currentYear = \Carbon\Carbon::parse($vacation->start_date)->year;
            $balance = VacationBalance::where('user_id', $vacation->user_id)->where('year', $currentYear)->first();

            if ($balance) {
                $balance->taken_days += $vacation->days;
                $balance->save();
            }
        } elseif ($vacation->type === 'overtime') {
            // INCREMENTAR el saldo acumulado (compensatorio)
            $currentYear = \Carbon\Carbon::parse($vacation->start_date)->year;
            $balance = VacationBalance::firstOrCreate(
                ['user_id' => $vacation->user_id, 'year' => $currentYear],
                ['accrued_days' => 0, 'taken_days' => 0, 'carried_over_days' => 0]
            );
            
            // Si trabajó horas extra, se le suman a sus días acumulados
            $balance->accrued_days += (float)$vacation->days;
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