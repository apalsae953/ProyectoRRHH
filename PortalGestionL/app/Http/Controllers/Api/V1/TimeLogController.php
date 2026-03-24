<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\TimeLog;
use Illuminate\Http\Request;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;

class TimeLogController extends Controller
{
    /**
     * Devuelve todos los fichajes (Vista Admin/RRHH)
     */
    public function index(Request $request)
    {
        $user = $request->user();
        if (!$user->hasRole(['admin', 'hr_director'])) {
            return response()->json(['message' => 'Acceso denegado.'], 403);
        }

        $date = $request->query('date', Carbon::today()->toDateString());
        $perPage = $request->query('per_page', 15);

        $logs = TimeLog::with(['user:id,name,surname'])
            ->whereDate('check_in_at', $date)
            ->latest('check_in_at')
            ->paginate($perPage);

        return response()->json($logs);
    }

    /**
     * Exportar fichajes a CSV (compatible con Excel)
     */
    public function export(Request $request)
    {
        $user = $request->user();
        if (!$user->hasRole(['admin', 'hr_director'])) {
            return response()->json(['message' => 'Acceso denegado.'], 403);
        }

        $date = $request->query('date', Carbon::today()->toDateString());
        $logs = TimeLog::with(['user:id,name,surname'])
            ->whereDate('check_in_at', $date)
            ->orderBy('check_in_at', 'asc')
            ->get();

        $fileName = "Fichajes_{$date}.csv";

        $headers = [
            "Content-type"        => "text/csv; charset=UTF-8",
            "Content-Disposition" => "attachment; filename=$fileName",
            "Pragma"              => "no-cache",
            "Cache-Control"       => "must-revalidate, post-check=0, pre-check=0",
            "Expires"             => "0"
        ];

        $callback = function() use($logs) {
            $file = fopen('php://output', 'w');
            // BOM para que Excel detecte UTF-8 correctamente
            fprintf($file, chr(0xEF).chr(0xBB).chr(0xBF));
            
            fputcsv($file, ['ID Empleado', 'Nombre', 'Apellidos', 'Entrada', 'Salida', 'IP'], ';');

            foreach ($logs as $log) {
                fputcsv($file, [
                    $log->user->id,
                    $log->user->name,
                    $log->user->surname,
                    $log->check_in_at->format('H:i:s'),
                    $log->check_out_at ? $log->check_out_at->format('H:i:s') : 'EN CURSO',
                    $log->ip_address
                ], ';');
            }

            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }

    /**
     * Devuelve el estado actual de fichaje para el usuario logueado
     */
    public function status(Request $request)
    {
        $user = $request->user();
        $today = Carbon::today();

        // Buscamos el último registro de hoy
        $latest = TimeLog::where('user_id', $user->id)
            ->whereDate('check_in_at', $today)
            ->latest('check_in_at')
            ->first();

        return response()->json([
            'status' => $latest ? ($latest->check_out_at ? 'out' : 'in') : 'out',
            'latest_log' => $latest,
            'today_logs' => TimeLog::where('user_id', $user->id)
                ->whereDate('check_in_at', $today)
                ->orderBy('check_in_at', 'asc')
                ->get()
        ]);
    }

    /**
     * Fichar entrada
     */
    public function checkIn(Request $request)
    {
        try {
            $user = $request->user();
            $today = Carbon::today();

            // Verificar si ya hay un fichaje abierto hoy
            $activeLog = TimeLog::where('user_id', $user->id)
                ->whereDate('check_in_at', $today)
                ->whereNull('check_out_at')
                ->first();

            if ($activeLog) {
                return response()->json(['message' => 'Ya tienes un fichaje activo en este momento.'], 422);
            }

            $log = TimeLog::create([
                'user_id' => $user->id,
                'check_in_at' => Carbon::now(),
                'ip_address' => $request->ip(),
                'location' => $request->location,
            ]);

            return response()->json([
                'message' => 'Entrada fichada correctamente a las ' . $log->check_in_at->format('H:i:s'),
                'data' => $log
            ]);
        } catch (\Exception $e) {
            \Log::error("Error en checkIn: " . $e->getMessage());
            return response()->json(['message' => "ERROR BACKEND: " . $e->getMessage()], 500);
        }
    }

    /**
     * Fichar salida
     */
    public function checkOut(Request $request)
    {
        try {
            $user = $request->user();
            $today = Carbon::today();

            // Buscar el fichaje abierto
            $activeLog = TimeLog::where('user_id', $user->id)
                ->whereDate('check_in_at', $today)
                ->whereNull('check_out_at')
                ->latest()
                ->first();

            if (!$activeLog) {
                return response()->json(['message' => 'No tienes ningún fichaje activo para cerrar.'], 422);
            }

            $activeLog->update([
                'check_out_at' => Carbon::now()
            ]);

            return response()->json([
                'message' => 'Salida fichada correctamente a las ' . $activeLog->check_out_at->format('H:i:s'),
                'data' => $activeLog
            ]);
        } catch (\Exception $e) {
            \Log::error("Error en checkOut: " . $e->getMessage());
            return response()->json(['message' => "ERROR BACKEND: " . $e->getMessage()], 500);
        }
    }
}
