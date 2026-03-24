<?php

namespace App\Http\Resources\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class NewsResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'content' => $this->content,
            'type' => $this->type,
            'image' => $this->image,
            'pinned' => (bool)$this->pinned,
            'published_at' => $this->published_at ? $this->published_at->format('Y-m-d H:i:s') : null,
            'author' => [
                'id' => $this->user->id,
                'name' => $this->user->name . ' ' . $this->user->surname,
            ],
            'created_at' => $this->created_at ? $this->created_at->format('Y-m-d H:i:s') : null,
        ];
    }
}
