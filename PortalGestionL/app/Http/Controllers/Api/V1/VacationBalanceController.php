<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\VacationBalance;
use Illuminate\Http\Request;
use App\Http\Resources\V1\VacationBalanceResource;
use App\Http\Requests\Api\V1\UpdateVacationBalanceRequest;
use Carbon\Carbon;

class VacationBalanceController extends Controller
{
    
    public function myBalance(Request $request)
    {
        $user = $request->user();
        $year = $request->query('year', Carbon::now()->year);
        
        // Buscar el saldo actual
        $balance = VacationBalance::where('user_id', $user->id)->where('year', $year)->first();

        // Si no existe, lo creamos calculando la parte proporcional y el arrastre
        if (!$balance) {
            $defaultVacationDays = \App\Models\Setting::where('key', 'vacation_days_per_year')->value('value') ?? 22;
            $maxCarryover = \App\Models\Setting::where('key', 'max_vacation_carryover')->value('value') ?? 5;

            $carriedOver = 0;
            // Intentar buscar el saldo del año anterior para el arrastre (días no disfrutados)
            $prevBalance = VacationBalance::where('user_id', $user->id)->where('year', $year - 1)->first();
            if ($prevBalance) {
                // El sobrante es (Asignados + Arrastrados del anterior) - Ya disfrutados
                $remaining = ($prevBalance->accrued_days + $prevBalance->carried_over_days) - $prevBalance->taken_days;
                $carriedOver = max(0, min($remaining, (float)$maxCarryover));
            }

            // Expiración por defecto del arrastre: 31 de Marzo del año actual
            $expiresAt = Carbon::createFromDate($year, 3, 31);

            $balance = VacationBalance::create([
                'user_id' => $user->id,
                'year' => $year,
                'accrued_days' => (int)$defaultVacationDays,
                'taken_days' => 0, 
                'carried_over_days' => $carriedOver,
                'expires_at' => $expiresAt
            ]);
        }

        return new VacationBalanceResource($balance);
    }

    // Solo RRHH/Admin pueden modificar los saldos manualmente
    public function update(UpdateVacationBalanceRequest $request, VacationBalance $balance)
    {
        $balance->update($request->validated());
        
        return response()->json([ // Devolvemos el nuevo saldo actualizado
            'message' => 'Saldo de vacaciones actualizado correctamente.',
            'data' => new VacationBalanceResource($balance)
        ]);
    }
}