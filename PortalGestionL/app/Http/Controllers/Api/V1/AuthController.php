<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use App\Mail\PasswordResetMail;
use Illuminate\Support\Str;
use App\Models\User;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        //Validamos que nos envíen el DNI
        $request->validate([
            'dni' => 'required|string',
            'password' => 'required|string',
        ]);

        //Le decimos a Laravel que busque al usuario por la columna 'dni'
        if (!Auth::attempt($request->only('dni', 'password'))) {
            return response()->json([
                'message' => 'Credenciales incorrectas. Revisa tu DNI o contraseña.'
            ], 401);
        }

        //Devolvemos el usuario cargando sus roles
        $user = Auth::user()->load('roles');

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
        $request->validate(['dni' => 'required|string']);

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
}