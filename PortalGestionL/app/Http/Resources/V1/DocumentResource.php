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
            'title' => $this->title,
            'type' => $this->type,
            'mime' => $this->mime,
            'size' => $this->size,
            'period_year' => $this->period_year,
            'period_month' => $this->period_month,
            'visibility' => $this->visibility,
            'created_at' => $this->created_at->format('Y-m-d H:i:s'),
            'url_descarga' => url("/api/v1/documents/{$this->id}/download"), 
            // Mantener compatibilidad si se usaba en otros sitios
            'titulo' => $this->title,
            'tipo' => $this->type,
        ];
    }
}