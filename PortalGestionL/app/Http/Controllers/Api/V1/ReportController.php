<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User;
use App\Models\Vacation;
use App\Models\Document;
use Carbon\Carbon;

class ReportController extends Controller
{
    /**
     * GET /api/v1/reports/dashboard
     * RRHH o Admin: Ver reportes de ausencias, vacaciones y documentos.
     */
    public function dashboard(Request $request)
    {
        $user = $request->user();

        if (!$user->hasRole(['admin', 'hr_director'])) {
            return response()->json(['message' => 'Acceso denegado'], 403);
        }

        // Estadisticas de Empleados
        $totalEmployees = User::count();
        $activeEmployees = User::where('status', 'active')->count();
        $inactiveEmployees = $totalEmployees - $activeEmployees;

        // Estadisticas de Vacaciones/Ausencias en el año actual
        $currentYear = Carbon::now()->year;
        
        // Asumiendo que las solicitudes de tipo 'vacation' son vacaciones estandar
        $vacations = Vacation::whereYear('start_date', $currentYear)->get();
        
        $pendingVacations = $vacations->where('status', 'pending')->count();
        $approvedVacations = $vacations->where('status', 'approved')->count();
        $rejectedVacations = $vacations->where('status', 'rejected')->count();
        $canceledVacations = $vacations->where('status', 'canceled')->count();

        // Tipos de ausencias comprobando aquellos cuyo campo type pueda ser distinto (si implementado)
        // Por simplificar, reportaremos el ratio de días aprobados mes a mes
        $vacationsByMonth = [];
        for ($i = 1; $i <= 12; $i++) {
            $vacationsByMonth[$i] = Vacation::whereYear('start_date', $currentYear)
                                            ->whereMonth('start_date', $i)
                                            ->where('status', 'approved')
                                            ->sum('days');
        }

        // Estadisticas de Documentos
        $totalDocuments = Document::count();
        
        // Documentos por categoria ('payroll', 'contract', 'certificate', 'other')
        $docsByType = Document::selectRaw('type, count(*) as count')->groupBy('type')->pluck('count', 'type')->toArray();

        // Empleados de alta en los ultimos 6 meses
        $recentHires = User::where('created_at', '>=', Carbon::now()->subMonths(6))->count();

        return response()->json([
            'employees' => [
                'total' => $totalEmployees,
                'active' => $activeEmployees,
                'inactive' => $inactiveEmployees,
                'recent_hires_6m' => $recentHires,
            ],
            'vacations' => [
                'pending' => $pendingVacations,
                'approved' => $approvedVacations,
                'rejected' => $rejectedVacations,
                'canceled' => $canceledVacations,
                'approved_days_by_month' => $vacationsByMonth,
            ],
            'documents' => [
                'total' => $totalDocuments,
                'by_type' => [
                    'payroll' => $docsByType['payroll'] ?? 0,
                    'contract' => $docsByType['contract'] ?? 0,
                    'certificate' => $docsByType['certificate'] ?? 0,
                    'other' => $docsByType['other'] ?? 0,
                ],
            ]
        ]);
    }
}
