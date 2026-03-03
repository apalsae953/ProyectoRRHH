import axios from 'axios';

const axiosInstance = axios.create({
    // La URL base de tu API de Laravel
    baseURL: 'http://localhost:8000', 
    
    // Le dice a Axios que envíe las cookies de sesión en cada petición.
    withCredentials: true, 
    
    // Obligatorio en Axios 1.x+ para que envíe el header X-XSRF-TOKEN a un origen distinto
    withXSRFToken: true,
    
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    }
});

export default axiosInstance;