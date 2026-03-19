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
    const [newHoliday, setNewHoliday] = useState({ date: '', date_end: '', description: '', scope: 'national', center_id: null });

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

    // Selección múltiple y paginación para festivos
    const [selectedHolidays, setSelectedHolidays] = useState([]);
    const [holidaysPage, setHolidaysPage] = useState(1);
    const holidaysPerPage = 9;

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
            setNewHoliday({ date: '', date_end: '', description: '', scope: 'national', center_id: null });
            setSelectedHolidays([]); // Limpiar selección al recargar
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
            setSelectedHolidays(prev => prev.filter(item => item !== id));
            fetchData();
        } catch (err) {
            setError('Error al eliminar festivo.');
        }
    };

    const handleBulkDeleteHolidays = async () => {
        if (selectedHolidays.length === 0) return;
        if (!window.confirm(`¿Seguro que deseas eliminar los ${selectedHolidays.length} festivos seleccionados?`)) return;

        setError(''); setSuccess('');
        try {
            await axios.post('/api/v1/holidays/bulk-delete', { ids: selectedHolidays });
            setSuccess(`${selectedHolidays.length} festivos eliminados.`);
            setSelectedHolidays([]);
            setHolidaysPage(1); // Volver a la primera página
            fetchData();
        } catch (err) {
            setError('Error al realizar el borrado masivo.');
        }
    };

    const handleSelectHoliday = (id) => {
        setSelectedHolidays(prev =>
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        );
    };

    const handleSelectAllHolidays = () => {
        if (selectedHolidays.length === holidays.length) {
            setSelectedHolidays([]);
        } else {
            setSelectedHolidays(holidays.map(h => h.id));
        }
    };

    // Lógica de Paginación para Festivos
    const indexOfLastHoliday = holidaysPage * holidaysPerPage;
    const indexOfFirstHoliday = indexOfLastHoliday - holidaysPerPage;
    const currentHolidays = holidays.slice(indexOfFirstHoliday, indexOfLastHoliday);
    const totalHolidayPages = Math.ceil(holidays.length / holidaysPerPage);

    const handleSaveSettings = async (e) => {
        if (e) e.preventDefault();
        setError(''); setSuccess('');
        try {
            await axios.patch('/api/v1/settings', { settings });
            setSuccess('Políticas globales actualizadas correctamente.');
            window.alert('✅ ¡Éxito! Las políticas globales se han guardado correctamente.');
        } catch (err) {
            console.error("Error al guardar configuracion", err);
            const errorMsg = err.response?.data?.message || 'Error al guardar las políticas.';
            setError(errorMsg);
            window.alert('❌ Error: ' + errorMsg);
        }
    };

    if (loading) return <div className="p-8 font-bold text-gray-500">Cargando listas...</div>;

    return (
        <div className="max-w-5xl mx-auto space-y-8 mb-20 animate-fade-in">
            {/* ALERTAS GLOBALES */}
            {(error || success) && (
                <div className="fixed top-24 right-8 z-[60] w-96 space-y-4 pointer-events-none">
                    {error && (
                        <div className="p-4 bg-red-50 text-red-700 rounded-2xl border border-red-200 shadow-xl flex items-start gap-3 animate-slide-in pointer-events-auto">
                            <i className="fa-solid fa-triangle-exclamation mt-1"></i>
                            <p className="text-sm font-bold">{error}</p>
                        </div>
                    )}
                    {success && (
                        <div className="p-4 bg-emerald-50 text-emerald-700 rounded-2xl border border-emerald-200 shadow-xl flex items-start gap-3 animate-slide-in pointer-events-auto">
                            <i className="fa-solid fa-check mt-1"></i>
                            <p className="text-sm font-bold">{success}</p>
                        </div>
                    )}
                </div>
            )}

            {/* SECCIÓN 1: ESTRUCTURA ORGANIZATIVA */}
            <div className="bg-white rounded-[2.5rem] shadow-md border border-slate-200 overflow-hidden">
                <div className="p-6 md:p-8 border-b border-slate-200 bg-slate-100/50 flex items-center gap-4">
                    <div className="w-12 h-12 bg-corporate/10 text-corporate rounded-2xl flex items-center justify-center text-xl shadow-inner border border-corporate/10">
                        <i className="fa-solid fa-sitemap"></i>
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-slate-800 tracking-tight">Estructura Organizativa</h2>
                        <p className="text-slate-500 text-xs font-medium">Gestiona los departamentos y los puestos disponibles en la empresa.</p>
                    </div>
                </div>

                <div className="p-6 md:p-8">
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
            </div>
        </div>

        {/* SECCIÓN 2: GESTIÓN DE CALENDARIO (FESTIVOS) */}
            <div className="bg-white rounded-[2.5rem] shadow-md border border-slate-200 overflow-hidden" id="festivos-section">
                <div className="p-6 md:p-8 border-b border-slate-200 bg-slate-100/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center text-xl shadow-inner border border-amber-100">
                            <i className="fa-solid fa-calendar-day"></i>
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-slate-800 tracking-tight">Calendario de Festivos</h2>
                            <p className="text-slate-500 text-xs font-medium">Días nacionales y locales que no se descuentan del saldo.</p>
                        </div>
                    </div>
                    {holidays.length > 0 && (
                        <div className="flex items-center gap-3 w-full sm:w-auto">
                            <button
                                onClick={handleSelectAllHolidays}
                                className="flex-1 sm:flex-none px-4 py-2 border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 transition-colors"
                            >
                                {selectedHolidays.length === holidays.length ? 'Deseleccionar' : 'Seleccionar Todo'}
                            </button>
                            {selectedHolidays.length > 0 && (
                                <button
                                    onClick={handleBulkDeleteHolidays}
                                    className="flex-1 sm:flex-none px-4 py-2 bg-red-50 text-red-600 rounded-xl text-[10px] font-black uppercase tracking-widest border border-red-100 hover:bg-red-500 hover:text-white transition-all shadow-sm"
                                >
                                    <i className="fa-solid fa-trash-can mr-2"></i>
                                    Borrar ({selectedHolidays.length})
                                </button>
                            )}
                        </div>
                    )}
                </div>

                <div className="p-6 md:p-8">
                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-6 italic">Nota: Los periodos aquí marcados son inhábiles para el cálculo de vacaciones.</p>

                    <form onSubmit={handleAddHoliday} className="grid grid-cols-1 sm:grid-cols-5 gap-3 mb-6 bg-slate-50 p-6 rounded-2xl border border-slate-200">
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
                            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Descripción</label>
                            <input
                                type="text" required
                                value={newHoliday.description}
                                onChange={(e) => setNewHoliday({ ...newHoliday, description: e.target.value })}
                                className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-corporate/20 focus:border-corporate outline-none bg-white font-medium shadow-sm transition-all"
                                placeholder="Ej: Festivo Local..."
                            />
                        </div>
                        <div className="sm:col-span-1">
                            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Ámbito</label>
                            <select
                                value={newHoliday.scope}
                                onChange={(e) => setNewHoliday({ ...newHoliday, scope: e.target.value })}
                                className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-corporate/20 focus:border-corporate outline-none bg-white font-medium shadow-sm transition-all"
                            >
                                <option value="national">Nacional</option>
                                <option value="center">Local / Centro</option>
                            </select>
                        </div>
                        <div className="sm:col-span-1 flex items-end">
                            <button type="submit" className="w-full h-[42px] bg-corporate text-white font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-corporate-dark transition-all shadow-lg shadow-corporate/10 flex items-center justify-center gap-2 active:scale-[0.98]">
                                <i className="fa-solid fa-calendar-plus"></i>
                                Guardar
                            </button>
                        </div>
                    </form>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {holidays.length === 0 ? (
                            <p className="col-span-full p-4 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-300">No hay festivos registrados.</p>
                        ) : (
                            currentHolidays.map(h => (
                                <div key={h.id} className={`p-4 bg-white border rounded-2xl shadow-sm flex justify-between items-center group transition-all ${selectedHolidays.includes(h.id) ? 'border-corporate ring-2 ring-corporate/10 bg-corporate/5' : 'border-slate-100 hover:border-corporate/30 hover:shadow-md'}`}>
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <div className="flex-shrink-0">
                                            <input
                                                type="checkbox"
                                                checked={selectedHolidays.includes(h.id)}
                                                onChange={() => handleSelectHoliday(h.id)}
                                                className="w-5 h-5 rounded-lg border-slate-300 text-corporate focus:ring-corporate cursor-pointer transition-all"
                                            />
                                        </div>
                                        <div className="w-10 h-10 bg-slate-50 rounded-xl flex flex-col items-center justify-center text-corporate shrink-0 border border-slate-100 group-hover:bg-corporate group-hover:text-white transition-colors">
                                            <span className="text-xs font-black leading-none">{new Date(h.date).getDate()}</span>
                                            <span className="text-[8px] font-bold uppercase leading-none mt-0.5">{new Date(h.date).toLocaleString('es', { month: 'short' })}</span>
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-bold text-slate-700 text-sm truncate">{h.description}</p>
                                            <span className={`text-[8px] font-black uppercase tracking-tighter px-1.5 py-0.5 rounded-md border ${h.scope === 'national' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-purple-50 text-purple-600 border-purple-100'}`}>
                                                {h.scope === 'national' ? 'Nacional' : 'Local / Centro'}
                                            </span>
                                        </div>
                                    </div>
                                    <button onClick={() => handleDeleteHoliday(h.id)} className="w-8 h-8 rounded-full bg-red-50 text-red-500 flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-red-500 hover:text-white transition-all transform hover:scale-110 ml-2">
                                        <i className="fa-solid fa-trash-can text-sm"></i>
                                    </button>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Paginación de Festivos */}
                    {totalHolidayPages > 1 && (
                        <div className="mt-8 flex items-center justify-between p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                Página <span className="text-corporate">{holidaysPage}</span> de {totalHolidayPages}
                            </span>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setHolidaysPage(prev => Math.max(prev - 1, 1))}
                                    disabled={holidaysPage === 1}
                                    className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:border-corporate hover:text-corporate disabled:opacity-30 transition-all font-black shadow-sm"
                                >
                                    <i className="fa-solid fa-chevron-left"></i>
                                </button>
                                <button
                                    onClick={() => setHolidaysPage(prev => Math.min(prev + 1, totalHolidayPages))}
                                    disabled={holidaysPage === totalHolidayPages}
                                    className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:border-corporate hover:text-corporate disabled:opacity-30 transition-all font-black shadow-sm"
                                >
                                    <i className="fa-solid fa-chevron-right"></i>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* SECCIÓN 3: POLÍTICAS GLOBALES */}
            <div className="bg-white rounded-[2.5rem] shadow-md border border-slate-200 overflow-hidden mb-10">
                <div className="p-6 md:p-8 border-b border-slate-200 bg-slate-100/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-indigo-50 text-indigo-500 rounded-2xl flex items-center justify-center text-xl shadow-inner border border-indigo-100">
                            <i className="fa-solid fa-sliders"></i>
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-slate-800 tracking-tight">Políticas del Sistema</h2>
                            <p className="text-slate-500 text-xs font-medium">Configura los parámetros maestros y reglas de la plataforma.</p>
                        </div>
                    </div>
                    <button
                        onClick={handleSaveSettings}
                        className="w-full md:w-auto px-8 py-3 bg-corporate text-white font-black text-[10px] uppercase tracking-[0.2em] rounded-2xl hover:bg-corporate-dark transition-all shadow-lg shadow-corporate/20 active:scale-95 flex items-center justify-center gap-2"
                    >
                        <i className="fa-solid fa-cloud-arrow-up"></i>
                        Actualizar Cambios
                    </button>
                </div>

                <div className="p-6 md:p-8 pt-10">
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
                                    onChange={(e) => setSettings({ ...settings, vacation_days_per_year: e.target.value })}
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
                                    onChange={(e) => setSettings({ ...settings, probation_months_default: e.target.value })}
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
                                    onChange={(e) => setSettings({ ...settings, max_vacation_carryover: e.target.value })}
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
                                    onClick={() => setSettings({ ...settings, allow_overtime_request: settings.allow_overtime_request === 'true' ? 'false' : 'true' })}
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
