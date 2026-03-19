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
            'fecha_inicio' => $this->start_date ? $this->start_date->format('Y-m-d') : null,
            'fecha_fin' => $this->end_date ? $this->end_date->format('Y-m-d') : null,
            'dias_solicitados' => $this->days,
            'horas' => $this->hours,
            'estado' => $this->status, // draft, pending, approved, rejected, canceled
            'tipo' => $this->type ?? 'vacation', // vacation, sick_leave
            'nota' => $this->note,
            'motivo_cancelacion' => $this->cancel_reason,
            'mensaje_admin' => $this->admin_message,
            'adjunto' => $this->attachment_path ? asset('storage/' . $this->attachment_path) : null,
            'fecha_solicitud' => $this->created_at ? $this->created_at->format('Y-m-d H:i:s') : null,
            
            // Quién la aprobó (si ya fue aprobada)
            'aprobado_por' => $this->whenLoaded('approver', function () {
                return $this->approver ? [
                    'id' => $this->approver->id,
                    'nombre' => $this->approver->name . ' ' . $this->approver->surname,
                ] : null;
            }),
            
            // El empleado (útil para la vista global de RRHH)
            'empleado' => $this->whenLoaded('user', function () {
                return $this->user ? [
                    'id' => $this->user->id,
                    'nombre' => $this->user->name . ' ' . $this->user->surname,
                ] : null;
            }),
        ];
    }
}