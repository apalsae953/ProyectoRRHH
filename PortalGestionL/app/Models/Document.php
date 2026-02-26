<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Document extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'type',
        'period_year',
        'period_month',
        'title',
        'path',
        'size',
        'mime',
        'uploaded_by',
        'visibility',
        'signed_url_expires_at',
    ];

    protected $casts = [
        'signed_url_expires_at' => 'datetime', // Laravel lo convertirá a un objeto Carbon automáticamente(para poder usar métodos de fecha fácilmente)
    ];

    // El empleado dueño del documento
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    // El usuario de RRHH/Admin que subió el documento
    public function uploader(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }
}
