<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Spatie\Activitylog\Traits\LogsActivity;
use Spatie\Activitylog\LogOptions;

class Vacation extends Model
{
    use HasFactory, LogsActivity;

    protected $fillable = [
        'user_id',
        'start_date',
        'end_date',
        'type',
        'days',
        'status',
        'approver_id',
        'note',
        'cancel_reason',
        'admin_message',
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
    ];

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logFillable() // Registra automáticamente cualquier cambio en los campos de arriba
            ->logOnlyDirty() // Solo crea el registro si el valor realmente ha cambiado
            ->dontSubmitEmptyLogs(); // Evita llenar la base de datos con registros vacíos
    }

    // El empleado que solicita las vacaciones
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    // El director de RRHH que aprueba/rechaza
    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approver_id');
    }
}