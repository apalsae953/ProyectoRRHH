@component('mail::message')
# Hola Admin,

El empleado **{{ $vacation->user->name }} {{ $vacation->user->surname }}** ha cancelado su solicitud de vacaciones.

**Detalles de la Solicitud Cancelada:**
- **Desde:** {{ \Carbon\Carbon::parse($vacation->start_date)->format('d/m/Y') }}
- **Hasta:** {{ \Carbon\Carbon::parse($vacation->end_date)->format('d/m/Y') }}
- **Días solicitados:** {{ $vacation->days }}
- **Motivo de cancelación:** {{ $vacation->cancel_reason }}

Los saldos de vacaciones se han actualizado automáticamente si correspondía.

Puedes revisar todas las cancelaciones en el panel de administración.

@component('mail::button', ['url' => env('FRONTEND_URL') . '/gestion-vacaciones'])
Ver Panel de Gestión
@endcomponent

Gracias,<br>
{{ config('app.name') }}
@endcomponent
