<?php

namespace App\Http\Resources\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class VacationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'fecha_inicio' => $this->start_date->format('Y-m-d'),
            'fecha_fin' => $this->end_date->format('Y-m-d'),
            'dias_solicitados' => $this->days,
            'estado' => $this->status, // draft, pending, approved, rejected, canceled
            'nota' => $this->note,
            'fecha_solicitud' => $this->created_at->format('Y-m-d H:i:s'),
            
            // Quién la aprobó (si ya fue aprobada)
            'aprobado_por' => $this->whenLoaded('approver', function () {
                return [
                    'id' => $this->approver->id,
                    'nombre' => $this->approver->name . ' ' . $this->approver->surname,
                ];
            }),
            
            // El empleado (útil para la vista global de RRHH)
            'empleado' => $this->whenLoaded('user', function () {
                return [
                    'id' => $this->user->id,
                    'nombre' => $this->user->name . ' ' . $this->user->surname,
                ];
            }),
        ];
    }
}