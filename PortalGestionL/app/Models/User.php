<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens; // Para los tokens de la API-first
use Spatie\Permission\Traits\HasRoles; // El paquete mágico de Spatie para roles

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasApiTokens, HasFactory, Notifiable, HasRoles;

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
        'position',
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

    // Relaciones
    // Un usuario pertenece a un departamento
    public function department()
    {
        return $this->belongsTo(Department::class);
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
}
