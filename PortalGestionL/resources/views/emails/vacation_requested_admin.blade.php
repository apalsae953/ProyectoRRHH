<x-mail::message>
# Nueva Solicitud de Vacaciones

Hola, Admin. Se ha registrado una nueva solicitud de vacaciones en el portal.

**Empleado:** {{ $vacation->user->full_name }}
**Desde:** {{ \Carbon\Carbon::parse($vacation->start_date)->format('d/m/Y') }}
**Hasta:** {{ \Carbon\Carbon::parse($vacation->end_date)->format('d/m/Y') }}
**Total días:** {{ $vacation->days }}

<x-mail::button :url="config('app.frontend_url') . '/gestion-vacaciones'">
Revisar Solicitud
</x-mail::button>

Gracias,<br>
{{ config('app.name') }}
</x-mail::message>
