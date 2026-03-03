import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
    const { user, logout } = useAuth();
    
    // Comprobamos si el usuario es administrador para mostrarle cosas especiales
    const isAdmin = user?.roles?.some(r => r.name === 'admin' || r.name === 'hr_director');

    return (
        <div className="flex h-screen bg-gray-50 font-sans">
            
            {/* 1. MENÚ LATERAL (Sidebar Oscuro) */}
            <aside className="w-64 bg-slate-900 text-white flex-col shadow-2xl z-10 hidden md:flex">
                <div className="p-6 border-b border-slate-800 flex items-center gap-3">
                    <div className="w-10 h-10 bg-corporate rounded-xl flex items-center justify-center font-bold text-xl shadow-lg">
                        G
                    </div>
                    <span className="text-2xl font-extrabold tracking-tight">Globomatik</span>
                </div>
                
                <nav className="flex-1 p-4 space-y-2 mt-4">
                    <a href="#" className="flex items-center gap-3 px-4 py-3 bg-corporate/20 text-corporate-light rounded-xl font-bold transition-all border border-corporate/30">
                        🏠 Inicio
                    </a>
                    {/* Estos enlaces aún no hacen nada, pero ya dejamos el hueco preparado */}
                    <a href="#" className="flex items-center gap-3 px-4 py-3 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl font-medium transition-all">
                        👥 Empleados
                    </a>
                    <a href="#" className="flex items-center gap-3 px-4 py-3 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl font-medium transition-all">
                        ✈️ Vacaciones
                    </a>
                </nav>

                <div className="p-4 border-t border-slate-800">
                    <button 
                        onClick={logout} 
                        className="w-full flex items-center justify-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 py-3 rounded-xl transition-all font-bold"
                    >
                        🚪 Cerrar Sesión
                    </button>
                </div>
            </aside>

            {/* 2. ZONA PRINCIPAL (Derecha) */}
            <main className="flex-1 flex flex-col h-screen overflow-hidden">
                
                {/* Cabecera Superior */}
                <header className="bg-white border-b border-gray-200 h-20 flex items-center justify-between px-8 shrink-0">
                    <h1 className="text-2xl font-bold text-gray-800 tracking-tight">Panel de Control</h1>
                    
                    <div className="flex items-center gap-4">
                        <div className="text-right hidden sm:block">
                            <p className="text-sm font-bold text-gray-900">{user?.name} {user?.surname}</p>
                            <p className="text-xs text-corporate font-semibold uppercase tracking-wider">{user?.position || 'Empleado'}</p>
                        </div>
                        {/* Avatar redondo con las iniciales */}
                        <div className="w-11 h-11 bg-gradient-to-br from-corporate to-corporate-dark text-white rounded-full flex items-center justify-center font-bold shadow-md border-2 border-white ring-2 ring-gray-100">
                            {user?.name?.charAt(0)}{user?.surname?.charAt(0)}
                        </div>
                    </div>
                </header>

                {/* Zona de contenido con scroll */}
                <div className="flex-1 overflow-auto p-8">
                    
                    {/* Banner de Bienvenida con degradado */}
                    <div className="bg-gradient-to-r from-corporate to-slate-800 rounded-3xl p-8 text-white shadow-xl mb-8 border border-slate-700 relative overflow-hidden">
                        {/* Decoración de fondo */}
                        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-white opacity-5 rounded-full blur-2xl"></div>
                        <div className="relative z-10">
                            <h2 className="text-3xl font-extrabold mb-2">¡Bienvenido de nuevo, {user?.name}! 👋</h2>
                            <p className="text-corporate-light text-lg opacity-90">Aquí tienes tu resumen personal y las herramientas de gestión rápida.</p>
                        </div>
                    </div>

                    {/* Alerta si es Administrador */}
                    {isAdmin && (
                        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-8 flex gap-4 items-center shadow-sm">
                            <div className="text-4xl">👑</div>
                            <div>
                                <h3 className="font-bold text-amber-900 text-lg">Modo Administrador activado</h3>
                                <p className="text-amber-700 text-sm mt-1">Tienes acceso sin restricciones a todo el portal. Puedes gestionar a los usuarios y aprobar solicitudes.</p>
                            </div>
                        </div>
                    )}

                    {/* Tarjeta de Datos Personales */}
                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <h3 className="text-xl font-bold text-gray-800">Información del Perfil</h3>
                            <span className="px-4 py-1.5 bg-green-100 text-green-700 font-bold rounded-full text-sm flex items-center gap-2 border border-green-200">
                                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span> Activo
                            </span>
                        </div>
                        
                        <div className="p-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                            <div>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">DNI Registrado</p>
                                <p className="text-lg font-bold text-gray-900">{user?.dni}</p>
                            </div>
                            <div>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Correo Electrónico</p>
                                <p className="text-lg font-bold text-gray-900 truncate">{user?.email}</p>
                            </div>
                            <div>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Puesto Actual</p>
                                <p className="text-lg font-bold text-gray-900">{user?.position || 'Pendiente'}</p>
                            </div>
                            <div>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Departamento</p>
                                <p className="text-lg font-bold text-gray-900">{user?.department_id ? `Dep. #${user.department_id}` : 'No asignado'}</p>
                            </div>
                        </div>
                    </div>

                </div>
            </main>
        </div>
    );
};

export default Dashboard;