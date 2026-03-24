<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class News extends Model
{
    use \Illuminate\Database\Eloquent\Factories\HasFactory;

    protected $fillable = [
        'title',
        'content',
        'type',
        'image',
        'user_id',
        'pinned',
        'published_at',
    ];

    protected $casts = [
        'published_at' => 'datetime',
        'pinned' => 'boolean',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
