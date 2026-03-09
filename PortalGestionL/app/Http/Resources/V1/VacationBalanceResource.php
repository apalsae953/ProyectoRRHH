<?php

namespace App\Http\Resources\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class VacationBalanceResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $now = \Carbon\Carbon::now();
        $user = $this->user;
        $hiredAt = $user->hired_at ? \Carbon\Carbon::parse($user->hired_at) : null;
        
        // El año del que estamos calculando el saldo (normalmente el actual)
        $yearOfBalance = (int) $this->year;
        $startOfYear = \Carbon\Carbon::createFromDate($yearOfBalance, 1, 1)->startOfDay();
        $endOfYear = \Carbon\Carbon::createFromDate($yearOfBalance, 12, 31)->endOfDay();

        // Si el empleado fue contratado antes de este año, se le dan los 22 días completos de golpe
        if (!$hiredAt || $hiredAt->year < $yearOfBalance) {
            $diasGenerados = (float) $this->accrued_days;
        } 
        // Si fue contratado en un año futuro (error de datos o empieza más tarde), 0 días
        else if ($hiredAt->year > $yearOfBalance) {
            $diasGenerados = 0;
        } 
        // Si fue contratado ESTE MISMO AÑO, calculamos la parte proporcional desde que entró hasta final de año
        else {
            $calcStart = $hiredAt->copy()->startOfDay();
            $totalDaysInYear = $startOfYear->diffInDays($endOfYear) + 1;
            
            // Días que va a estar contratado en este año
            $daysEmployedThisYear = $calcStart->diffInDays($endOfYear) + 1;
            
            // Días proporcionales que le corresponden por lo que queda de año
            $diasGenerados = round(($this->accrued_days * ($daysEmployedThisYear / $totalDaysInYear)), 1);
        }

        // Saldo Disponible = (Generados para este año + Arrastrados del año pasado) - Ya disfrutados
        $diasDisponibles = round(($diasGenerados + $this->carried_over_days - $this->taken_days), 1);

        return [
            'id' => $this->id,
            'anio' => $this->year,
            'dias_base_anuales' => $this->accrued_days, // El total del convenio (ej. 22)
            'dias_generados_hasta_hoy' => $diasGenerados,
            'dias_disfrutados' => $this->taken_days,
            'dias_arrastrados_año_anterior' => $this->carried_over_days,
            'dias_totales_disponibles' => $diasDisponibles, // Lo que puede pedir hoy
            'fecha_expiracion_arrastrados' => $this->expires_at ? $this->expires_at->format('Y-m-d') : null,
        ];
    }
}