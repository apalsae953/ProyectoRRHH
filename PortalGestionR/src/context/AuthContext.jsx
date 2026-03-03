import { createContext, useState, useEffect, useContext } from 'react';
import authService from '../services/authService';

// Creamos el contexto
// El contexto es un objeto que contiene toda la información relacionada con la autenticación, como el usuario actual, las funciones de login y logout, y el estado de carga.
const AuthContext = createContext();

// Creamos un hook personalizado para usarlo fácilmente en cualquier componente
//El hook es una función que nos permite acceder al contexto de autenticación desde cualquier componente sin tener que importar useContext y AuthContext cada vez.
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Al arrancar la app, comprobamos si ya hay una sesión activa en Laravel
    useEffect(() => {
        const checkUser = async () => {
            try {
                const userData = await authService.getUser();
                setUser(userData);
            } catch (error) {
                setUser(null);
            } finally {
                setLoading(false);
            }
        };

        checkUser();
    }, []);

    // Función global para hacer login
    const login = async (credentials) => {
        await authService.login(credentials);
        const userData = await authService.getUser();
        setUser(userData);
    };

    // Función global para cerrar sesión
    const logout = async () => {
        await authService.logout();
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};