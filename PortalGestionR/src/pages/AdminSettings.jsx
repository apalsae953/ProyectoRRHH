import { useState, useEffect } from 'react';
import axios from '../api/axios';
import { useAuth } from '../context/AuthContext';

const AdminSettings = () => {
    const { user } = useAuth();
    const [departments, setDepartments] = useState([]);
    const [positions, setPositions] = useState([]);
    const [holidays, setHolidays] = useState([]);

    const [newDepartmentName, setNewDepartmentName] = useState('');
    const [newPositionName, setNewPositionName] = useState('');
    const [newHoliday, setNewHoliday] = useState({ date: '', date_end: '', description: '', scope: 'national' });

    // Políticas Globales
    const [settings, setSettings] = useState({
        vacation_days_per_year: '22',
        probation_months_default: '6',
        allow_overtime_request: 'true',
        max_vacation_carryover: '5'
    });

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [deptRes, posRes, holidayRes, settingRes] = await Promise.all([
                axios.get('/api/v1/departments'),
                axios.get('/api/v1/positions'),
                axios.get('/api/v1/holidays'),
                axios.get('/api/v1/settings')
            ]);
            setDepartments(deptRes.data);
            setPositions(posRes.data);
            setHolidays(holidayRes.data?.data || []);
            
            if (settingRes.data && Object.keys(settingRes.data).length > 0) {
                setSettings(prev => ({ ...prev, ...settingRes.data }));
            }
        } catch (err) {
            console.error("Error cargando config", err);
            setError('Error al cargar la configuración.');
        } finally {
            setLoading(false);
        }
    };

    const handleAddDepartment = async (e) => {
        e.preventDefault();
        setError(''); setSuccess('');
        try {
            await axios.post('/api/v1/departments', { name: newDepartmentName });
            setSuccess('Departamento añadido correctamente.');
            setNewDepartmentName('');
            fetchData();
        } catch (err) {
            setError(err.response?.data?.message || 'Error al añadir el departamento.');
        }
    };

    const handleDeleteDepartment = async (id) => {
        if (!window.confirm('¿Seguro que deseas eliminar este departamento?')) return;
        setError(''); setSuccess('');
        try {
            await axios.delete(`/api/v1/departments/${id}`);
            setSuccess('Departamento eliminado correctamente.');
            fetchData();
        } catch (err) {
            setError(err.response?.data?.message || 'Error al eliminar. Puede que tenga empleados asignados.');
        }
    };

    const handleAddPosition = async (e) => {
        e.preventDefault();
        setError(''); setSuccess('');
        try {
            await axios.post('/api/v1/positions', { name: newPositionName });
            setSuccess('Puesto añadido correctamente.');
            setNewPositionName('');
            fetchData();
        } catch (err) {
            setError(err.response?.data?.message || 'Error al añadir el puesto.');
        }
    };

    const handleDeletePosition = async (id) => {
        if (!window.confirm('¿Seguro que deseas eliminar este puesto?')) return;
        setError(''); setSuccess('');
        try {
            await axios.delete(`/api/v1/positions/${id}`);
            setSuccess('Puesto eliminado correctamente.');
            fetchData();
        } catch (err) {
            setError(err.response?.data?.message || 'Error al eliminar. Puede que tenga empleados asignados.');
        }
    };

    const handleAddHoliday = async (e) => {
        e.preventDefault();
        setError(''); setSuccess('');
        try {
            await axios.post('/api/v1/holidays', newHoliday);
            setSuccess('Festivos añadidos correctamente.');
            setNewHoliday({ date: '', date_end: '', description: '', scope: 'national' });
            fetchData();
        } catch (err) {
            setError(err.response?.data?.message || 'Error al añadir el festivo.');
        }
    };

    const handleDeleteHoliday = async (id) => {
        if (!window.confirm('¿Eliminar este festivo?')) return;
        setError(''); setSuccess('');
        try {
            await axios.delete(`/api/v1/holidays/${id}`);
            setSuccess('Festivo eliminado.');
            fetchData();
        } catch (err) {
            setError('Error al eliminar festivo.');
        }
    };

    const handleSaveSettings = async (e) => {
        e.preventDefault();
        setError(''); setSuccess('');
        try {
            await axios.post('/api/v1/settings', { settings });
            setSuccess('Políticas globales actualizadas correctamente.');
        } catch (err) {
            setError('Error al guardar las políticas.');
        }
    };

    if (loading) return <div className="p-8 font-bold text-gray-500">Cargando listas...</div>;

    return (
        <div className="bg-white rounded-3xl shadow-lg overflow-hidden border border-slate-100 mb-10 max-w-5xl mx-auto">
            <div className="p-6 md:p-8 border-b border-slate-100 bg-slate-50">
                <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">Configuración de Listas</h2>
                <p className="text-slate-500 text-sm mt-1">Gestiona los departamentos y los puestos disponibles a la hora de dar de alta a un empleado.</p>
            </div>

            <div className="p-6 md:p-8">
                {error && <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-xl border border-red-200"><i className="fa-solid fa-triangle-exclamation mr-2"></i>{error}</div>}
                {success && <div className="mb-6 p-4 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-200"><i className="fa-solid fa-check mr-2"></i>{success}</div>}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">

                    {/* COLUMNA PUESTOS */}
                    <div>
                        <h3 className="text-xl font-bold text-slate-700 mb-4 border-b pb-2">Puestos a desempeñar</h3>
                        <form onSubmit={handleAddPosition} className="flex gap-2 mb-4">
                            <input
                                type="text" required
                                value={newPositionName}
                                onChange={(e) => setNewPositionName(e.target.value)}
                                className="flex-1 px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-corporate/20 focus:border-corporate outline-none transition-all"
                                placeholder="Nuevo puesto..."
                            />
                            <button type="submit" className="px-4 py-2 bg-corporate text-white font-bold rounded-xl hover:bg-corporate-dark transition-colors">
                                <i className="fa-solid fa-plus"></i>
                            </button>
                        </form>

                        <div className="border border-slate-100 rounded-2xl overflow-hidden bg-slate-50">
                            {positions.length === 0 ? (
                                <p className="p-4 text-center text-slate-400">No hay puestos registrados.</p>
                            ) : (
                                <ul className="divide-y divide-slate-100">
                                    {positions.map(pos => (
                                        <li key={pos.id} className="p-4 flex justify-between items-center hover:bg-white transition-colors">
                                            <span className="font-medium text-slate-700">{pos.name}</span>
                                            <button onClick={() => handleDeletePosition(pos.id)} className="w-8 h-8 rounded-full bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-colors">
                                                <i className="fa-solid fa-trash-can text-sm"></i>
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>

                    {/* COLUMNA DEPARTAMENTOS */}
                    <div>
                        <h3 className="text-xl font-bold text-slate-700 mb-4 border-b pb-2">Departamentos</h3>
                        <form onSubmit={handleAddDepartment} className="flex gap-2 mb-4">
                            <input
                                type="text" required
                                value={newDepartmentName}
                                onChange={(e) => setNewDepartmentName(e.target.value)}
                                className="flex-1 px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-corporate/20 focus:border-corporate outline-none transition-all"
                                placeholder="Nuevo departamento..."
                            />
                            <button type="submit" className="px-4 py-2 bg-corporate text-white font-bold rounded-xl hover:bg-corporate-dark transition-colors">
                                <i className="fa-solid fa-plus"></i>
                            </button>
                        </form>

                        <div className="border border-slate-100 rounded-2xl overflow-hidden bg-slate-50">
                            {departments.length === 0 ? (
                                <p className="p-4 text-center text-slate-400">No hay departamentos registrados.</p>
                            ) : (
                                <ul className="divide-y divide-slate-100">
                                    {departments.map(dept => (
                                        <li key={dept.id} className="p-4 flex justify-between items-center hover:bg-white transition-colors">
                                            <span className="font-medium text-slate-700">{dept.name}</span>
                                            <button onClick={() => handleDeleteDepartment(dept.id)} className="w-8 h-8 rounded-full bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-colors">
                                                <i className="fa-solid fa-trash-can text-sm"></i>
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>

                </div>

                {/* SECCIÓN FESTIVOS */}
                <div className="mt-12">
                    <h3 className="text-xl font-bold text-slate-700 mb-4 border-b pb-2 flex items-center gap-2">
                        <i className="fa-solid fa-calendar-day text-corporate"></i>
                        Calendario de Festivos (Nacionales/Locales)
                    </h3>
                    <p className="text-slate-500 text-sm mb-6 italic">Nota: Los días marcados aquí no se descontarán del saldo de vacaciones al solicitarlas.</p>

                    <form onSubmit={handleAddHoliday} className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-6 bg-slate-50 p-6 rounded-2xl border border-slate-200">
                        <div className="sm:col-span-1">
                            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Desde</label>
                            <input
                                type="date" required
                                value={newHoliday.date}
                                onChange={(e) => setNewHoliday({ ...newHoliday, date: e.target.value })}
                                className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-corporate/20 focus:border-corporate outline-none bg-white font-medium shadow-sm transition-all"
                            />
                        </div>
                        <div className="sm:col-span-1">
                            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Hasta (Opcional)</label>
                            <input
                                type="date"
                                value={newHoliday.date_end}
                                onChange={(e) => setNewHoliday({ ...newHoliday, date_end: e.target.value })}
                                className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-corporate/20 focus:border-corporate outline-none bg-white font-medium shadow-sm transition-all"
                            />
                        </div>
                        <div className="sm:col-span-1">
                            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Descripción / Motivo</label>
                            <input
                                type="text" required
                                value={newHoliday.description}
                                onChange={(e) => setNewHoliday({ ...newHoliday, description: e.target.value })}
                                className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-corporate/20 focus:border-corporate outline-none bg-white font-medium shadow-sm transition-all"
                                placeholder="Ej: Semana Santa..."
                            />
                        </div>
                        <div className="sm:col-span-1 flex items-end">
                            <button type="submit" className="w-full h-[42px] bg-corporate text-white font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-corporate-dark transition-all shadow-lg shadow-corporate/10 flex items-center justify-center gap-2 active:scale-[0.98]">
                                <i className="fa-solid fa-calendar-plus"></i>
                                Guardar Periodo
                            </button>
                        </div>
                    </form>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {holidays.length === 0 ? (
                            <p className="col-span-full p-4 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-300">No hay festivos registrados.</p>
                        ) : (
                            holidays.map(h => (
                                <div key={h.id} className="p-4 bg-white border border-slate-100 rounded-2xl shadow-sm flex justify-between items-center group hover:border-corporate/30 hover:shadow-md transition-all">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-slate-50 rounded-xl flex flex-col items-center justify-center text-corporate shrink-0 border border-slate-100 group-hover:bg-corporate group-hover:text-white transition-colors">
                                            <span className="text-xs font-black leading-none">{new Date(h.date).getDate()}</span>
                                            <span className="text-[8px] font-bold uppercase leading-none mt-0.5">{new Date(h.date).toLocaleString('es', { month: 'short' })}</span>
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-700 text-sm">{h.description}</p>
                                            <p className="text-[10px] text-slate-400 font-medium">Festivo {h.scope === 'national' ? 'Nacional' : 'Local'}</p>
                                        </div>
                                    </div>
                                    <button onClick={() => handleDeleteHoliday(h.id)} className="w-8 h-8 rounded-full bg-red-50 text-red-500 flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-red-500 hover:text-white transition-all transform hover:scale-110">
                                        <i className="fa-solid fa-trash-can text-sm"></i>
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* SECCIÓN POLÍTICAS GLOBALES */}
                <div className="mt-16 pt-12 border-t border-slate-100">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                        <div>
                            <h3 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                                <div className="w-10 h-10 bg-corporate/10 text-corporate rounded-2xl flex items-center justify-center">
                                    <i className="fa-solid fa-sliders"></i>
                                </div>
                                Políticas Globales (Parámetros)
                            </h3>
                            <p className="text-slate-500 text-sm mt-1 font-medium">Configura las reglas maestras que rigen el comportamiento de la plataforma.</p>
                        </div>
                        <button 
                            onClick={handleSaveSettings}
                            className="px-8 py-3 bg-corporate text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-corporate-dark transition-all shadow-lg shadow-corporate/20 active:scale-95"
                        >
                            <i className="fa-solid fa-cloud-arrow-up mr-2"></i> Guardar Políticas
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* Política 1: Días de vacaciones */}
                        <div className="bg-slate-50 border border-slate-200 p-6 rounded-3xl hover:bg-white hover:shadow-xl hover:shadow-slate-200/50 transition-all group">
                            <i className="fa-solid fa-plane text-corporate/30 text-3xl mb-4 group-hover:text-corporate transition-colors"></i>
                            <h4 className="font-bold text-slate-800 mb-1">Días de Vacaciones / Año</h4>
                            <p className="text-[11px] text-slate-500 mb-4 leading-relaxed">Cantidad estándar de días naturales que se asignan a cada empleado anualmente.</p>
                            <div className="relative">
                                <input 
                                    type="number"
                                    value={settings.vacation_days_per_year}
                                    onChange={(e) => setSettings({...settings, vacation_days_per_year: e.target.value})}
                                    className="w-full pl-4 pr-12 py-3 bg-white border border-slate-200 rounded-2xl font-black text-slate-700 outline-none focus:ring-4 focus:ring-corporate/5 focus:border-corporate transition-all"
                                />
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400 uppercase">Días</span>
                            </div>
                        </div>

                        {/* Política 2: Periodo de prueba */}
                        <div className="bg-slate-50 border border-slate-200 p-6 rounded-3xl hover:bg-white hover:shadow-xl hover:shadow-slate-200/50 transition-all group">
                            <i className="fa-solid fa-hourglass-start text-corporate/30 text-3xl mb-4 group-hover:text-corporate transition-colors"></i>
                            <h4 className="font-bold text-slate-800 mb-1">Periodo Prueba (Efecto)</h4>
                            <p className="text-[11px] text-slate-500 mb-4 leading-relaxed">Meses sugeridos por defecto para nuevos contratos antes de pasar a indefinido.</p>
                            <div className="relative">
                                <input 
                                    type="number"
                                    value={settings.probation_months_default}
                                    onChange={(e) => setSettings({...settings, probation_months_default: e.target.value})}
                                    className="w-full pl-4 pr-12 py-3 bg-white border border-slate-200 rounded-2xl font-black text-slate-700 outline-none focus:ring-4 focus:ring-corporate/5 focus:border-corporate transition-all"
                                />
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400 uppercase">Meses</span>
                            </div>
                        </div>

                        {/* Política 3: Arrastre de vacaciones */}
                        <div className="bg-slate-50 border border-slate-200 p-6 rounded-3xl hover:bg-white hover:shadow-xl hover:shadow-slate-200/50 transition-all group">
                            <i className="fa-solid fa-forward-step text-corporate/30 text-3xl mb-4 group-hover:text-corporate transition-colors"></i>
                            <h4 className="font-bold text-slate-800 mb-1">Días Arrastrables (Máx)</h4>
                            <p className="text-[11px] text-slate-500 mb-4 leading-relaxed">Días máximos que un empleado puede pasar de un año al siguiente.</p>
                            <div className="relative">
                                <input 
                                    type="number"
                                    value={settings.max_vacation_carryover}
                                    onChange={(e) => setSettings({...settings, max_vacation_carryover: e.target.value})}
                                    className="w-full pl-4 pr-12 py-3 bg-white border border-slate-200 rounded-2xl font-black text-slate-700 outline-none focus:ring-4 focus:ring-corporate/5 focus:border-corporate transition-all"
                                />
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400 uppercase">Días</span>
                            </div>
                        </div>

                        {/* Política 4: Horas extra (Toggle) */}
                        <div className="bg-slate-50 border border-slate-200 p-6 rounded-3xl hover:bg-white hover:shadow-xl hover:shadow-slate-200/50 transition-all group flex flex-col justify-between">
                            <div>
                                <i className="fa-solid fa-clock text-corporate/30 text-3xl mb-4 group-hover:text-corporate transition-colors"></i>
                                <h4 className="font-bold text-slate-800 mb-1">Permitir Horas Extra</h4>
                                <p className="text-[11px] text-slate-500 mb-4 leading-relaxed">Habilita o deshabilita la opción de que los empleados soliciten compensación de horas.</p>
                            </div>
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => setSettings({...settings, allow_overtime_request: settings.allow_overtime_request === 'true' ? 'false' : 'true'})}
                                    className={`relative w-14 h-8 rounded-full transition-all flex items-center px-1 ${settings.allow_overtime_request === 'true' ? 'bg-corporate' : 'bg-slate-300'}`}
                                >
                                    <div className={`w-6 h-6 bg-white rounded-full shadow-md transition-all transform ${settings.allow_overtime_request === 'true' ? 'translate-x-6' : 'translate-x-0'}`}></div>
                                </button>
                                <span className="font-bold text-sm text-slate-700">{settings.allow_overtime_request === 'true' ? 'Activado' : 'Desactivado'}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminSettings;
