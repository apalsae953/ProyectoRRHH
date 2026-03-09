<x-mail::message>
# Hola, {{ $user->name }}

Has solicitado restablecer tu contraseña. Hemos generado una contraseña temporal nueva para que puedas acceder al portal.

Tu nueva contraseña es: **{{ $newPassword }}**

Por seguridad, te recomendamos cambiarla nada más acceder desde el apartado de "Seguridad".

<x-mail::button :url="config('app.frontend_url') . '/login'">
Ir al Login
</x-mail::button>

Gracias,<br>
{{ config('app.name') }}
</x-mail::message>
