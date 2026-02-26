<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class VacationBalance extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'year',
        'accrued_days',
        'taken_days',
        'carried_over_days',
        'expires_at',
    ];

    protected $casts = [
        'expires_at' => 'date',
    ];

    // El empleado al que pertenece este saldo
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}