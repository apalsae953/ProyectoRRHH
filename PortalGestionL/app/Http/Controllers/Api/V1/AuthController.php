<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

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

        //Devolvemos el usuario
        $user = Auth::user();

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
}