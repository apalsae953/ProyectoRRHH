import { useState, useEffect } from 'react';
import axios from '../api/axios';
import { useAuth } from '../context/AuthContext';

const AdminSettings = () => {
    const { user } = useAuth();
    const [departments, setDepartments] = useState([]);
    const [positions, setPositions] = useState([]);

    const [newDepartmentName, setNewDepartmentName] = useState('');
    const [newPositionName, setNewPositionName] = useState('');

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [deptRes, posRes] = await Promise.all([
                axios.get('/api/v1/departments'),
                axios.get('/api/v1/positions')
            ]);
            setDepartments(deptRes.data);
            setPositions(posRes.data);
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
            </div>
        </div>
    );
};

export default AdminSettings;
