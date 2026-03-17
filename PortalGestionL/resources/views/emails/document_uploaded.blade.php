<x-mail::message>
# Hola {{ $document->user->name }},

Te informamos que se ha subido un nuevo documento a tu expediente personal en el portal de Globomatik.

**Detalles del documento:**
- **Tipo:** {{ $typeLabel }}
- **Título:** {{ $document->title }}
- **Periodo:** {{ $document->period_month }}/{{ $document->period_year }}

Puedes consultar y descargar este documento accediendo a tu área privada.

<x-mail::button :url="$url">
Ver mis documentos
</x-mail::button>

Gracias,<br>
El equipo de RRHH de Globomatik
</x-mail::message>
