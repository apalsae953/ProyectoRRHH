<!DOCTYPE html>
<html>
<head>
    <title>Bienvenido a Globomatik</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-top: 4px solid #0056b3; border-radius: 5px;">
        <h2 style="color: #0056b3;">¡Bienvenido/a a Globomatik, {{ $user->name }}!</h2>
        
        <p>Tu cuenta corporativa ha sido creada exitosamente. Ya puedes iniciar sesión en el <strong>Portal de Empleados</strong> con las siguientes credenciales:</p>
        
        <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 0;"><strong>Enlace de acceso:</strong> <a href="{{ config('app.frontend_url', 'http://localhost:5173') }}">{{ config('app.frontend_url', 'http://localhost:5173') }}</a></p>
            <p style="margin: 5px 0;"><strong>DNI / Email:</strong> {{ $user->dni }} / {{ $user->email }}</p>
            <p style="margin: 0;"><strong>Contraseña temporal:</strong> {{ $password }}</p>
        </div>
        
        <p><em>⚠️ Por razones de seguridad, te recomendamos iniciar sesión por primera vez y cambiar tu contraseña inmediatamente a una de tu preferencia desde el panel de perfil.</em></p>
        
        <p>Si tienes alguna pregunta o problema para acceder, no dudes en contactar con el departamento de Recursos Humanos.</p>
        
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="font-size: 12px; color: #777; text-align: center;">Este es un mensaje automático. Por favor no respondas a este correo.</p>
    </div>
</body>
</html>
