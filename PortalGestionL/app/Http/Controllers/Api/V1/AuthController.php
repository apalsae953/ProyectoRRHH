<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use App\Mail\PasswordResetMail;
use Illuminate\Support\Str;
use App\Models\User;
use PragmaRX\Google2FA\Google2FA;
use BaconQrCode\Renderer\ImageRenderer;
use BaconQrCode\Renderer\Image\SvgImageBackEnd;
use BaconQrCode\Renderer\RendererStyle\RendererStyle;
use BaconQrCode\Writer;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        //Validamos que nos envíen el DNI
        $request->validate([
            'dni' => ['required', 'string', new \App\Rules\ValidDni],
            'password' => 'required|string',
        ]);

        //Le decimos a Laravel que busque al usuario por la columna 'dni'
        if (!Auth::attempt($request->only('dni', 'password'))) {
            return response()->json([
                'message' => 'Credenciales incorrectas. Revisa tu DNI o contraseña.'
            ], 401);
        }

        $user = Auth::user();

        // Si el usuario tiene 2FA activado, validamos el código
        if (!empty($user->two_factor_secret)) {
            if (!$request->has('totp_code')) {
                // Cerramos la sesión temporal porque se requiere el 2FA
                Auth::guard('web')->logout();
                return response()->json([
                    'message' => 'Código 2FA requerido.',
                    'requires_2fa' => true
                ], 403);
            }

            $google2fa = new Google2FA();
            $valid = $google2fa->verifyKey($user->two_factor_secret, $request->totp_code);

            if (!$valid) {
                // Cerramos la sesión temporal porque falló el 2FA
                Auth::guard('web')->logout();
                return response()->json([
                    'message' => 'El código 2FA proporcionado es incorrecto.'
                ], 401);
            }
        }

        //Devolvemos el usuario cargando sus roles
        $user->load('roles');

        return response()->json([
            'message' => 'Login exitoso',
            'user' => $user
        ]);
    }

    public function logout(Request $request)
    {
        Auth::guard('web')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json(['message' => 'Sesión cerrada correctamente']);
    }

    public function changePassword(Request $request)
    {
        $request->validate([
            'current_password' => 'required',
            'new_password' => 'required|min:6|confirmed',
        ]);

        $user = $request->user();

        if (!\Illuminate\Support\Facades\Hash::check($request->current_password, $user->password)) {
            return response()->json(['message' => 'La contraseña actual es incorrecta.'], 400);
        }

        $user->update([
            'password' => \Illuminate\Support\Facades\Hash::make($request->new_password)
        ]);

        return response()->json(['message' => 'Contraseña actualizada correctamente.']);
    }

    public function forgotPassword(Request $request)
    {
        $request->validate(['dni' => ['required', 'string', new \App\Rules\ValidDni]]);

        $user = User::where('dni', $request->dni)->first();

        if (!$user) {
            return response()->json(['message' => 'No se ha encontrado ningún empleado con ese DNI.'], 404);
        }

        $newPassword = Str::random(10);
        $user->password = Hash::make($newPassword);
        $user->save();

        try {
            \Illuminate\Support\Facades\Mail::to($user->email)->send(new PasswordResetMail($user, $newPassword));
        } catch (\Exception $e) {
            \Log::error('Error enviando reset de contraseña: ' . $e->getMessage());
            return response()->json(['message' => 'La contraseña se ha reseteado pero hubo un error enviando el email. Contacta con RRHH.'], 500);
        }

        return response()->json(['message' => 'Se ha enviado una nueva contraseña a tu correo electrónico.']);
    }

    public function updateProfile(Request $request)
    {
        $request->validate([
            'name' => 'sometimes|string|max:255',
            'surname' => 'sometimes|string|max:255',
            'email' => 'sometimes|email|max:255',
            'phone' => 'nullable|string|max:20',
            'address' => 'nullable|string|max:255',
            'photo' => 'nullable|image|max:2048', // 2MB max
        ]);

        $user = $request->user();

        // Solo admin o hr_director pueden cambiar su propio nombre, apellido o email desde aquí.
        if ($user->hasRole(['admin', 'hr_director'])) {
            if ($request->has('name')) $user->name = $request->name;
            if ($request->has('surname')) $user->surname = $request->surname;
            if ($request->has('email')) $user->email = $request->email;
        }

        if ($request->has('phone')) $user->phone = $request->phone;
        if ($request->has('address')) $user->address = $request->address;

        if ($request->hasFile('photo')) {
            $path = $request->file('photo')->store('profiles', 'public');
            $user->photo = url(\Illuminate\Support\Facades\Storage::url($path));
        }

        $user->save();

        return response()->json([
            'message' => 'Perfil actualizado correctamente.',
            'user' => $user->load('roles')
        ]);
    }

    // --- 2FA Methods ---

    public function generate2FA(Request $request)
    {
        $user = $request->user();

        if (!empty($user->two_factor_secret)) {
            return response()->json(['message' => 'El 2FA ya está activado en tu cuenta.'], 400);
        }

        $google2fa = new Google2FA();
        // Generamos un secreto temporal que se guardará sólo cuando se confirme
        $secret = $google2fa->generateSecretKey();

        // Generamos la URL del QR
        $qrCodeUrl = $google2fa->getQRCodeUrl(
            config('app.name'),
            $user->email,
            $secret
        );

        $renderer = new ImageRenderer(
            new RendererStyle(250),
            new SvgImageBackEnd()
        );
        $writer = new Writer($renderer);
        $svg = $writer->writeString($qrCodeUrl);

        return response()->json([
            'secret' => $secret,
            'qr_svg' => base64_encode($svg),
            'qr_url' => $qrCodeUrl, // para apps que prefieran leer la uri
        ]);
    }

    public function confirm2FA(Request $request)
    {
        $request->validate([
            'secret' => 'required|string',
            'totp_code' => 'required|string',
        ]);

        $user = $request->user();
        $google2fa = new Google2FA();

        $valid = $google2fa->verifyKey($request->secret, $request->totp_code);

        if ($valid) {
            $user->two_factor_secret = $request->secret;
            $user->save();

            return response()->json(['message' => 'Doble factor de autenticación activado con éxito.']);
        }

        return response()->json(['message' => 'El código proporcionado es incorrecto.'], 400);
    }

    public function disable2FA(Request $request)
    {
        // Require current password or TOTP to disable, here we simplify to avoid complex logic, 
        // relying on current active Sanctum session.
        $user = $request->user();
        $user->two_factor_secret = null;
        $user->save();

        return response()->json(['message' => 'Doble factor de autenticación desactivado correctamente.']);
    }
}