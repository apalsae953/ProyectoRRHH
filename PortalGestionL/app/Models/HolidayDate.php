<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class HolidayDate extends Model
{
    use HasFactory;

    protected $fillable = [
        'date',
        'scope',
        'center_id',
        'description',
    ];

    protected $casts = [
        'date' => 'date',
    ];
}