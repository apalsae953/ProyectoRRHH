import { useState, useEffect } from 'react';
import axios from '../api/axios';

const Documents = () => {
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState({ type: '', year: new Date().getFullYear() });

    const fetchDocuments = async () => {
        setLoading(true);
        try {
            const params = {};
            if (filter.type) params.type = filter.type;
            if (filter.year) params.period_year = filter.year;

            const response = await axios.get('/api/v1/employees/me/documents', { params });
            setDocuments(response.data?.data || []);
        } catch (error) {
            console.error("Error cargando documentos", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDocuments();
    }, [filter]);

    const handleDownload = async (doc) => {
        try {
            const response = await axios.get(`/api/v1/documents/${doc.id}/download`, {
                responseType: 'blob'
            });
            const isImage = ['jpg', 'jpeg', 'png'].includes(doc.mime?.split('/')[1]?.toLowerCase());
            const extension = isImage ? doc.mime.split('/')[1] : 'pdf';

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${doc.title}.${extension}`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            alert("Error al descargar el archivo");
        }
    };

    const getIcon = (type, mime) => {
        const isImage = mime?.includes('image');
        if (isImage) return 'fa-file-image text-indigo-500';

        switch (type) {
            case 'payroll': return 'fa-file-invoice-dollar text-emerald-500';
            case 'contract': return 'fa-file-signature text-blue-500';
            case 'certificate': return 'fa-award text-amber-500';
            default: return 'fa-file-lines text-slate-400';
        }
    };

    const getTypeName = (type) => {
        switch (type) {
            case 'payroll': return 'Nómina';
            case 'contract': return 'Contrato';
            case 'certificate': return 'Certificado';
            case 'other': return 'Documento';
            default: return 'Archivo';
        }
    };

    const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

    return (
        <div className="animate-fade-in pb-10 space-y-8">
            {/* Cabecera Inspiradora */}
            <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 p-8 md:p-10 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-corporate opacity-[0.02] rounded-full translate-x-20 -translate-y-20"></div>
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="text-center md:text-left">
                        <h2 className="text-4xl font-black text-slate-800 tracking-tight">Expediente Digital</h2>
                        <p className="text-slate-500 text-lg mt-2 font-medium max-w-lg">Gestiona y descarga tus documentos oficiales de forma segura y centralizada.</p>
                    </div>
                    <div className="flex gap-4">
                        <div className="px-6 py-4 bg-slate-50 rounded-3xl border border-slate-100 text-center">
                            <span className="block text-2xl font-black text-slate-800">{documents.length}</span>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Archivos</span>
                        </div>
                        <div className="px-6 py-4 bg-corporate/5 rounded-3xl border border-corporate/10 text-center">
                            <span className="block text-2xl font-black text-corporate">{filter.year || 'Hist.'}</span>
                            <span className="text-[10px] font-black text-corporate/60 uppercase tracking-widest">{filter.year ? 'Año Fiscal' : 'Historial Total'}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filtros Premium */}
            <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 p-4 flex flex-wrap items-center gap-4">
                <div className="px-4 py-2 border-r border-slate-100 hidden md:block">
                    <i className="fa-solid fa-filter text-slate-300"></i>
                </div>

                <div className="flex-1 flex flex-wrap gap-3">
                    <select
                        value={filter.type}
                        onChange={(e) => setFilter({ ...filter, type: e.target.value })}
                        className="px-6 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-corporate/5 focus:border-corporate outline-none text-xs font-black text-slate-600 uppercase tracking-wider transition-all cursor-pointer"
                    >
                        <option value="">Todas las Categorías</option>
                        <option value="payroll">Nóminas</option>
                        <option value="contract">Contratos</option>
                        <option value="certificate">Certificados</option>
                        <option value="other">Otros</option>
                    </select>

                    <select
                        value={filter.year}
                        onChange={(e) => setFilter({ ...filter, year: e.target.value })}
                        className="px-6 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-corporate/5 focus:border-corporate outline-none text-xs font-black text-slate-600 uppercase tracking-wider transition-all cursor-pointer"
                    >
                        <option value="">Todos los años</option>
                        {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                </div>

                <button
                    onClick={fetchDocuments}
                    className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-400 hover:bg-corporate hover:text-white transition-all duration-300 flex items-center justify-center border border-slate-100 shadow-sm"
                    title="Actualizar lista"
                >
                    <i className="fa-solid fa-rotate"></i>
                </button>
            </div>

            {/* Listado de Documentos */}
            <div className="min-h-[400px]">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-32 gap-6">
                        <div className="w-16 h-16 border-4 border-slate-100 border-t-corporate rounded-full animate-spin"></div>
                        <span className="text-sm font-black text-slate-400 uppercase tracking-widest">Sincronizando Archivos...</span>
                    </div>
                ) : documents.length === 0 ? (
                    <div className="bg-slate-50/50 rounded-[3rem] border-2 border-dashed border-slate-200 py-32 text-center max-w-2xl mx-auto px-10">
                        <div className="w-24 h-24 bg-white rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-sm border border-slate-100">
                            <i className="fa-regular fa-folder-open text-4xl text-slate-200"></i>
                        </div>
                        <h3 className="text-2xl font-black text-slate-800">Carpeta Vacía</h3>
                        <p className="text-slate-400 font-medium mt-3 text-lg">No hemos encontrado documentos con los filtros aplicados. Prueba a cambiar el año o la categoría.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {documents.map(doc => (
                            <div key={doc.id} className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm hover:shadow-2xl hover:border-corporate/20 transition-all duration-500 group flex flex-col relative overflow-hidden">
                                {/* Badge de tipo */}
                                <div className="absolute top-6 right-8">
                                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${doc.type === 'payroll' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                                        doc.type === 'contract' ? 'bg-blue-50 text-blue-600 border border-blue-100' :
                                            'bg-slate-50 text-slate-500 border border-slate-100'
                                        }`}>
                                        {getTypeName(doc.type)}
                                    </span>
                                </div>

                                <div className="flex items-start gap-6 mb-8">
                                    <div className="w-16 h-16 bg-slate-50 rounded-[1.5rem] flex items-center justify-center text-2xl shrink-0 group-hover:bg-corporate group-hover:text-white transition-all duration-500 shadow-inner border border-slate-100 group-hover:border-corporate group-hover:-translate-y-1">
                                        <i className={`fa-solid ${getIcon(doc.type, doc.mime)} transition-colors duration-500 group-hover:text-white`}></i>
                                    </div>
                                    <div className="min-w-0 flex-1 pt-2">
                                        <h4 className="font-black text-slate-800 text-xl truncate leading-tight mb-1" title={doc.title}>
                                            {doc.title}
                                        </h4>
                                        <div className="flex items-center gap-2 text-slate-400 font-bold text-[11px] uppercase tracking-wide">
                                            {doc.period_month && <span>{months[doc.period_month - 1]}</span>}
                                            {doc.period_year && <span className="opacity-40">•</span>}
                                            {doc.period_year && <span>{doc.period_year}</span>}
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-auto flex items-center justify-between pt-6 border-t border-slate-50">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] text-slate-400 font-black uppercase tracking-tighter">Tamaño</span>
                                        <span className="text-xs font-black text-slate-600">{(doc.size / 1024 / 1024).toFixed(2)} MB</span>
                                    </div>

                                    <button
                                        onClick={() => handleDownload(doc)}
                                        className="px-6 py-3 bg-slate-900 text-white text-[11px] font-black uppercase tracking-widest rounded-2xl hover:bg-corporate transition-all shadow-lg shadow-slate-200 hover:shadow-corporate/20 hover:-translate-y-1 active:scale-95 flex items-center gap-2 overflow-hidden relative group/btn"
                                    >
                                        <i className="fa-solid fa-cloud-arrow-down text-sm"></i>
                                        Descargar
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Documents;