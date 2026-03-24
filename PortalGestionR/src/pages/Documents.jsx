import { useState, useEffect } from 'react';
import axios from '../api/axios';
import ModalPortal from '../components/ModalPortal';
import { motion, AnimatePresence } from 'framer-motion';

const Documents = () => {
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState({ type: '', year: new Date().getFullYear() });
    const [previewDoc, setPreviewDoc] = useState(null);

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

    const handleDownload = (doc) => {
        if (doc.url_descarga) {
            window.open(doc.url_descarga, '_blank');
        } else {
            alert("Enlace de descarga no disponible");
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

    const SkeletonCard = () => (
        <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] border border-slate-100 dark:border-slate-700 p-8 shadow-sm flex flex-col relative overflow-hidden animate-pulse">
            <div className="absolute top-6 right-8 w-16 h-4 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
            <div className="flex items-start gap-6 mb-8">
                <div className="w-16 h-16 bg-slate-200 dark:bg-slate-700 rounded-[1.5rem] shrink-0"></div>
                <div className="min-w-0 flex-1 pt-2 space-y-2">
                    <div className="w-3/4 h-5 bg-slate-200 dark:bg-slate-700 rounded"></div>
                    <div className="w-1/2 h-4 bg-slate-200 dark:bg-slate-700 rounded"></div>
                </div>
            </div>
            <div className="mt-auto flex items-center justify-between pt-6 border-t border-slate-50 dark:border-slate-700/50">
                <div className="flex flex-col gap-1.5">
                    <div className="w-10 h-2 bg-slate-200 dark:bg-slate-700 rounded"></div>
                    <div className="w-14 h-3 bg-slate-200 dark:bg-slate-700 rounded"></div>
                </div>
                <div className="w-28 h-10 bg-slate-200 dark:bg-slate-700 rounded-2xl"></div>
            </div>
        </div>
    );

    return (
        <div className="animate-fade-in pb-10 space-y-8">
            {/* Cabecera Inspiradora */}
            <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-700 p-8 md:p-10 relative overflow-hidden transition-colors">
                <div className="absolute top-0 right-0 w-64 h-64 bg-corporate opacity-[0.02] dark:opacity-[0.05] rounded-full translate-x-20 -translate-y-20"></div>
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="text-center md:text-left">
                        <h2 className="text-4xl font-black text-slate-800 dark:text-white tracking-tight transition-colors">Expediente Digital</h2>
                        <p className="text-slate-500 dark:text-slate-400 text-lg mt-2 font-medium max-w-lg transition-colors">Gestiona y descarga tus documentos oficiales de forma segura y centralizada.</p>
                    </div>
                    <div className="flex gap-4">
                        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-slate-100 dark:border-slate-700 text-center transition-colors">
                            <span className="block text-2xl font-black text-slate-800 dark:text-white transition-colors">{documents.length}</span>
                            <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest transition-colors">Archivos</span>
                        </div>
                        <div className="px-6 py-4 bg-corporate/5 dark:bg-corporate/10 rounded-3xl border border-corporate/10 dark:border-corporate/20 text-center transition-colors">
                            <span className="block text-2xl font-black text-corporate dark:text-corporate-light transition-colors">{filter.year || 'Hist.'}</span>
                            <span className="text-[10px] font-black text-corporate/60 dark:text-corporate/40 uppercase tracking-widest transition-colors">{filter.year ? 'Año Fiscal' : 'Historial Total'}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filtros Premium */}
            <div className="bg-white dark:bg-slate-800 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-700 p-4 flex flex-wrap items-center gap-4 transition-colors">
                <div className="px-4 py-2 border-r border-slate-100 dark:border-slate-700 hidden md:block">
                    <i className="fa-solid fa-filter text-slate-300 dark:text-slate-600"></i>
                </div>

                <div className="flex-1 flex flex-wrap gap-3">
                    <select
                        value={filter.type}
                        onChange={(e) => setFilter({ ...filter, type: e.target.value })}
                        className="px-6 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-corporate/5 focus:border-corporate outline-none text-xs font-black text-slate-600 dark:text-slate-300 uppercase tracking-wider transition-all cursor-pointer color-scheme-light dark:color-scheme-dark"
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
                        className="px-6 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-corporate/5 focus:border-corporate outline-none text-xs font-black text-slate-600 dark:text-slate-300 uppercase tracking-wider transition-all cursor-pointer color-scheme-light dark:color-scheme-dark"
                    >
                        <option value="">Todos los años</option>
                        {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                </div>

                <button
                    onClick={fetchDocuments}
                    className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-900 text-slate-400 dark:text-slate-500 hover:bg-corporate hover:text-white dark:hover:bg-corporate transition-all duration-300 flex items-center justify-center border border-slate-100 dark:border-slate-700 shadow-sm"
                    title="Actualizar lista"
                >
                    <i className="fa-solid fa-rotate"></i>
                </button>
            </div>

            {/* Listado de Documentos */}
            <div className="min-h-[400px]">
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[1, 2, 3, 4, 5, 6].map(i => <SkeletonCard key={i} />)}
                    </div>
                ) : documents.length === 0 ? (
                    <div className="bg-slate-50/50 dark:bg-slate-800/50 rounded-[3rem] border-2 border-dashed border-slate-200 dark:border-slate-700 py-32 text-center max-w-2xl mx-auto px-10">
                        <div className="w-24 h-24 bg-white dark:bg-slate-700 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-sm border border-slate-100 dark:border-slate-600 transition-colors">
                            <i className="fa-regular fa-folder-open text-4xl text-slate-200 dark:text-slate-500"></i>
                        </div>
                        <h3 className="text-2xl font-black text-slate-800 dark:text-white transition-colors">Carpeta Vacía</h3>
                        <p className="text-slate-400 dark:text-slate-400 font-medium mt-3 text-lg transition-colors">No hemos encontrado documentos con los filtros aplicados. Prueba a cambiar el año o la categoría.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {documents.map(doc => (
                            <div key={doc.id} className="bg-white dark:bg-slate-800 rounded-[2.5rem] border border-slate-100 dark:border-slate-700 p-8 shadow-sm hover:shadow-2xl hover:border-corporate/20 transition-all duration-500 group flex flex-col relative overflow-hidden">
                                {/* Badge de tipo */}
                                <div className="absolute top-6 right-8">
                                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${doc.type === 'payroll' ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800' :
                                        doc.type === 'contract' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-800' :
                                            'bg-slate-50 dark:bg-slate-700 text-slate-500 dark:text-slate-300 border border-slate-100 dark:border-slate-600'
                                        }`}>
                                        {getTypeName(doc.type)}
                                    </span>
                                </div>

                                <div className="flex items-start gap-6 mb-8">
                                    <div className="w-16 h-16 bg-slate-50 dark:bg-slate-700 rounded-[1.5rem] flex items-center justify-center text-2xl shrink-0 group-hover:bg-corporate group-hover:text-white transition-all duration-500 shadow-inner border border-slate-100 dark:border-slate-600 group-hover:border-corporate group-hover:-translate-y-1">
                                        <i className={`fa-solid ${getIcon(doc.type, doc.mime)} transition-colors duration-500 group-hover:text-white`}></i>
                                    </div>
                                    <div className="min-w-0 flex-1 pt-2">
                                        <h4 className="font-black text-slate-800 dark:text-slate-100 text-xl truncate leading-tight mb-1" title={doc.title}>
                                            {doc.title}
                                        </h4>
                                        <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500 font-bold text-[11px] uppercase tracking-wide">
                                            {doc.period_month && <span>{months[doc.period_month - 1]}</span>}
                                            {doc.period_year && <span className="opacity-40">•</span>}
                                            {doc.period_year && <span>{doc.period_year}</span>}
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-auto flex items-center justify-between pt-6 border-t border-slate-50 dark:border-slate-700/50">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-tighter">Tamaño</span>
                                        <span className="text-xs font-black text-slate-600 dark:text-slate-300">{(doc.size / 1024 / 1024).toFixed(2)} MB</span>
                                    </div>

                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setPreviewDoc(doc)}
                                            className="w-12 h-12 bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 rounded-2xl hover:bg-corporate hover:text-white transition-all flex items-center justify-center border border-slate-200 dark:border-slate-600"
                                            title="Previsualizar"
                                        >
                                            <i className="fa-solid fa-eye text-lg"></i>
                                        </button>
                                        <button
                                            onClick={() => handleDownload(doc)}
                                            className="px-6 py-3 bg-slate-900 dark:bg-slate-700 text-white text-[11px] font-black uppercase tracking-widest rounded-2xl hover:bg-corporate dark:hover:bg-corporate transition-all shadow-lg shadow-slate-200 dark:shadow-none hover:shadow-corporate/20 hover:-translate-y-1 active:scale-95 flex items-center gap-2"
                                        >
                                            <i className="fa-solid fa-cloud-arrow-down text-sm"></i>
                                            Descargar
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Modal de Previsualización */}
            <AnimatePresence>
                {previewDoc && (
                    <ModalPortal>
                        <div className="fixed inset-0 z-[10000] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 md:p-10 pointer-events-auto">
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className="bg-white dark:bg-slate-800 w-full max-w-6xl h-full rounded-[2.5rem] shadow-2xl border border-white/20 dark:border-slate-700 flex flex-col overflow-hidden"
                            >
                                <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800/80">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-corporate text-white rounded-xl flex items-center justify-center text-xl shadow-lg">
                                            <i className="fa-solid fa-file-pdf"></i>
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-black text-slate-800 dark:text-white leading-tight">{previewDoc.title}</h3>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Vista Previa • {(previewDoc.size / 1024 / 1024).toFixed(2)} MB</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <button 
                                            onClick={() => handleDownload(previewDoc)}
                                            className="px-5 py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-corporate hover:text-white transition-all shadow-sm"
                                        >
                                            Descargar
                                        </button>
                                        <button 
                                            onClick={() => setPreviewDoc(null)} 
                                            className="w-11 h-11 flex items-center justify-center rounded-xl bg-red-50 dark:bg-red-900/20 text-red-500 hover:bg-red-500 hover:text-white transition-all group"
                                        >
                                            <i className="fa-solid fa-xmark text-lg transition-transform group-hover:rotate-90"></i>
                                        </button>
                                    </div>
                                </div>
                                <div className="flex-1 bg-slate-100 dark:bg-slate-900 overflow-hidden relative">
                                    {previewDoc.url_descarga ? (
                                        <iframe 
                                            src={previewDoc.url_descarga} 
                                            className="w-full h-full border-none"
                                            title={previewDoc.title}
                                        />
                                    ) : (
                                        <div className="absolute inset-0 flex items-center justify-center text-slate-400 font-bold italic">
                                            No se pudo cargar el documento para previsualizar.
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        </div>
                    </ModalPortal>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Documents;