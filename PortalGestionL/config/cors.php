<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Cross-Origin Resource Sharing (CORS) Configuration
    |--------------------------------------------------------------------------
    */

    // Rutas a las que React podrá acceder
    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    // Métodos HTTP permitidos (GET, POST, PUT, DELETE, etc.)
    'allowed_methods' => ['*'],

    // Los orígenes permitidos. Aquí ponemos los puertos por defecto de React
    'allowed_origins' => [
        'http://localhost:3000', 
        'http://localhost:5173',
    ],

    'allowed_origins_patterns' => [],

    // Cabeceras permitidas en la petición
    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    //Debe estar en true para permitir el envío de tokens/cookies entre puertos
    'supports_credentials' => true,

];