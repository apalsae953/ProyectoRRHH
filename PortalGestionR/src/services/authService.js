import axios from '../api/axios';

const authService = {
    //Paso obligatorio por usar Sactum
    getCsrfCookie: async () => {
        return await axios.get('/sanctum/csrf-cookie');
    },

    //Peticion de Login
    login: async (credentials) => {
        // Primero pedimos la cookie de seguridad
        await authService.getCsrfCookie();
        
        // Luego hacemos el POST a la ruta que creamos en api.php
        const response = await axios.post('/api/v1/auth/login', credentials);
        return response.data;
    },

    //Obtener los datos del usuario logueado
    getUser: async () => {
        const response = await axios.get('/api/v1/auth/me');
        return response.data;
    },

    //Cerrar sesión
    logout: async () => {
        const response = await axios.post('/api/v1/auth/logout');
        return response.data;
    }
};

export default authService;