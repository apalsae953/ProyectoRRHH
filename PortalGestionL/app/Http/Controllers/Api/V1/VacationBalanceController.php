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
        $year = $request->query('year', Carbon::now()->year);
        
        // Buscar el saldo. Si no existe en la BD para este año, lo crea con valores por defecto.
        $defaultVacationDays = \App\Models\Setting::where('key', 'vacation_days_per_year')->value('value') ?? 22;

        $balance = VacationBalance::firstOrCreate(
            ['user_id' => $request->user()->id, 'year' => $year],
            [
                'accrued_days' => (int)$defaultVacationDays,
                'taken_days' => 0, 
                'carried_over_days' => 0
            ]
        );

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