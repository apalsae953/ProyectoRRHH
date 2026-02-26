<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;
use App\Models\User;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        //Validamos los datos que nos manda react
        $request->validate([
            'email' => 'required|string|email',
            'password' => 'required|string',
            'dni' => 'required|string',
        ]);

        // autenticar con email y password
        if (!Auth::attempt($request->only('email', 'password'))) {
            throw ValidationException::withMessages([
                'email' => ['Las credenciales proporcionadas son incorrectas.'],
            ]);
        }

        // Obtenemos el usuario(Por email) autenticado despues de haber verificado email y password
        $user = User::where('email', $request->email)->firstOrFail();

        // Comprobamos que el DNI proporcionado por React coincida con el DNI del usuario autenticado
        if (strtoupper($user->dni) !== strtoupper($request->dni)) {
            Auth::logout(); 
            throw ValidationException::withMessages([
                'dni' => ['El DNI proporcionado no coincide con el registrado en este perfil.'],
            ]);
        }

        //Generar un token de acceso para el usuario autenticado (usaremos Sanctum para esto)
        $token = $user->createToken('auth_token')->plainTextToken;

        // Devolvemos la respuesta al fronted (React)
        return response()->json([
            'message' => 'Inicio de sesión exitoso',
            'access_token' => $token,
            'token_type' => 'Bearer',
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'dni' => $user->dni,
                'roles' => $user->getRoleNames(), // Spatie nos devuelve si es admin, hr_director, etc.
            ]
        ]);
    }

    public function logout(Request $request)
    {
        // Borrar el token actual que está usando React
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Sesión cerrada correctamente'
        ]);
    }
}