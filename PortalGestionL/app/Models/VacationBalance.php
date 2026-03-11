<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

use Spatie\Activitylog\Traits\LogsActivity;
use Spatie\Activitylog\LogOptions;

class VacationBalance extends Model
{
    use HasFactory, LogsActivity;

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logFillable()
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs();
    }

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

    /**
     * Set the carried over days, enforcing the global limit.
     */
    public function setCarriedOverDaysAttribute($value)
    {
        // Si no existe el setting, usamos 5 por defecto
        $maxCarryover = \App\Models\Setting::where('key', 'max_vacation_carryover')->value('value') ?? 5;
        $this->attributes['carried_over_days'] = min((float)$value, (float)$maxCarryover);
    }
}