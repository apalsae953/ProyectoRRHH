<?php

namespace App\Http\Resources\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class VacationBalanceResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        // Calculamos los días que realmente puede gastar
        $diasDisponibles = $this->accrued_days + $this->carried_over_days - $this->taken_days;

        return [
            'id' => $this->id,
            'anio' => $this->year,
            'dias_base' => $this->accrued_days,
            'dias_disfrutados' => $this->taken_days,
            'dias_arrastrados_año_anterior' => $this->carried_over_days,
            'dias_totales_disponibles' => $diasDisponibles,
            'fecha_expiracion_arrastrados' => $this->expires_at ? $this->expires_at->format('Y-m-d') : null,
        ];
    }
}