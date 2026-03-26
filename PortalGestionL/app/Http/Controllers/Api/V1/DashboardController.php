<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\News;
use App\Models\Vacation;
use App\Models\VacationBalance;
use Illuminate\Http\Request;
use Carbon\Carbon;
use App\Http\Resources\V1\VacationBalanceResource;
use App\Http\Resources\V1\VacationResource;
use App\Http\Resources\V1\NewsResource;

class DashboardController extends Controller
{
    public function summary(Request $request)
    {
        $user = $request->user();
        $today = Carbon::today();
        $year = $today->year;

        // 1. Balance de vacaciones (Usamos la lógica de VacationBalanceController si fuera posible, o la replicamos resumida)
        $balance = VacationBalance::where('user_id', $user->id)->where('year', $year)->first();
        // Si no existe, no lo creamos aquí para no ensuciar, dejamos que el frontend lo maneje o devolvemos nulo
        
        // 2. Últimas noticias (Límite 5)
        $news = News::with('user')->latest()->limit(5)->get();

        // 3. Quién está fuera hoy (Solo aprobadas)
        $whoIsOut = Vacation::with('user')
            ->where('status', 'approved')
            ->whereDate('start_date', '<=', $today)
            ->whereDate('end_date', '>=', $today)
            ->get();

        // 4. Mis próximas vacaciones (Límite 3)
        $myUpcomingVacations = Vacation::where('user_id', $user->id)
            ->where('start_date', '>=', $today)
            ->whereIn('status', ['approved', 'pending'])
            ->orderBy('start_date', 'asc')
            ->limit(3)
            ->get();

        // 5. Mis horas extra aprobadas (Total acumulado este año)
        $overtimeHours = Vacation::where('user_id', $user->id)
            ->where('type', 'overtime')
            ->where('status', 'approved')
            ->whereYear('start_date', $year)
            ->sum('hours');

        return response()->json([
            'balance' => $balance ? new VacationBalanceResource($balance) : null,
            'news' => NewsResource::collection($news),
            'who_is_out' => $whoIsOut->map(function($v) {
                return [
                    'id' => $v->id,
                    'empleado' => [
                        'id' => $v->user->id,
                        'nombre' => $v->user->name,
                        'surname' => $v->user->surname,
                    ],
                    'tipo' => $v->type,
                    'fecha_inicio' => $v->start_date->toDateString(),
                    'fecha_fin' => $v->end_date->toDateString(),
                ];
            }),
            'my_upcoming' => VacationResource::collection($myUpcomingVacations),
            'total_overtime_hours' => $overtimeHours,
        ]);
    }
}
