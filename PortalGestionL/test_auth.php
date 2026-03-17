<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

// Simular una sesión de usuario
$user = App\Models\User::first();
if ($user) {
    Auth::login($user);
    $response = response()->json($user->load('roles', 'department', 'position'));
    echo $response->getContent();
}
else {
    echo "No user found";
}
