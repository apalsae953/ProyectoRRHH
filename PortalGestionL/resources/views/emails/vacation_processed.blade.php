<!DOCTYPE html>
<html>
<head>
    <title>Actualización de tu solicitud de vacaciones</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-top: 4px solid #0056b3; border-radius: 5px;">
        <h2 style="color: #0056b3;">Resolución de solicitud de {{ $vacation->type === 'overtime' ? 'horas extra' : 'vacaciones' }}</h2>
        
        <p>Hola {{ $vacation->user->name }},</p>
        <p>Tu solicitud de {{ $vacation->type === 'overtime' ? 'compensación por horas extra' : 'vacaciones' }} del <strong>{{ $vacation->start_date->format('d/m/Y') }}</strong> al <strong>{{ $vacation->end_date->format('d/m/Y') }}</strong> ha sido actualizada.</p>
        
        <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 0; font-size: 16px;">
                <strong>Estado:</strong> 
                @if($vacation->status === 'approved')
                    <span style="color: green;">APROBADA</span>
                @else
                    <span style="color: red;">RECHAZADA</span>
                @endif
            </p>
            
            @if($vacation->admin_message)
            <p style="margin: 10px 0 0 0;">
                <strong>Mensaje de tu responsable:</strong>
            </p>
            <p style="margin: 5px 0 0 0; padding: 10px; background-color: #fff; border-left: 3px solid #0056b3;">
                <em>{{ $vacation->admin_message }}</em>
            </p>
            @endif
        </div>
        
        <p>Puedes acceder al <a href="{{ config('app.frontend_url', 'http://localhost:5173') }}/vacaciones">Portal de Vacaciones</a> para ver más detalles técnicos o tu saldo de días actualizados.</p>
        
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="font-size: 12px; color: #777; text-align: center;">Este es un mensaje automático del Portal de RRHH. Por favor no respondas a este correo.</p>
    </div>
</body>
</html>
