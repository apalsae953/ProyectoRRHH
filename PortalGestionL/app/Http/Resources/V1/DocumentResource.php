<?php

namespace App\Http\Resources\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DocumentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'titulo' => $this->title,
            'tipo' => $this->type, // payroll, contract, certificate, other
            'periodo' => [
                'anio' => $this->period_year,
                'mes' => $this->period_month,
            ],
            'tamano_bytes' => $this->size,
            'visibilidad' => $this->visibility,
            'fecha_subida' => $this->created_at->format('Y-m-d H:i:s'),
            //En lugar de enviar la ruta física del servidor, enviamos una URL de nuestro endpoint de descarga
            //El endpoint es algo que definiremos en nuestro DocumentController, por ejemplo: GET /api/v1/documents/{id}/download
            'url_descarga' => url("/api/v1/documents/{$this->id}/download"), 
        ];
    }
}