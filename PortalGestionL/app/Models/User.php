<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens; 
use Spatie\Permission\Traits\HasRoles; 
use Spatie\Activitylog\Traits\LogsActivity; 
use Spatie\Activitylog\LogOptions; 

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable, HasRoles, LogsActivity; //

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'surname',
        'email',
        'dni',
        'dni_normalizado',
        'password',
        'phone',
        'position_id',
        'department_id',
        'hired_at',
        'status',
        'two_factor_secret',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
        'two_factor_secret',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected $casts = [
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
        'hired_at' => 'date',
    ];

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logFillable() // Registra automáticamente cualquier cambio en los campos de arriba
            ->logOnlyDirty() // Solo crea el registro si el valor realmente ha cambiado
            ->dontSubmitEmptyLogs(); // Evita llenar la base de datos con registros vacíos
    }

    // Relaciones
    // Un usuario pertenece a un departamento
    public function department()
    {
        return $this->belongsTo(Department::class);
    }

    // Un usuario pertenece a un puesto
    public function position()
    {
        return $this->belongsTo(Position::class);
    }

    // Un usuario tiene muchos documentos
    public function documents()
    {
        return $this->hasMany(Document::class);
    }

    // Un usuario tiene muchas solicitudes de vacaciones
    public function vacations()
    {
        return $this->hasMany(Vacation::class);
    }

    // Un usuario tiene un registro de saldos de vacaciones
    public function vacationBalances()
    {
        return $this->hasMany(VacationBalance::class);
    }

    public function getFullNameAttribute()
    {
        return "{$this->name} {$this->surname}";
    }
}