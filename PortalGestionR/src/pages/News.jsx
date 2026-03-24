import { useState, useEffect } from 'react';
import axios from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import ModalPortal from '../components/ModalPortal';

const News = () => {
    const { user } = useAuth();
    const [news, setNews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newPost, setNewPost] = useState({ title: '', content: '', type: 'news', pinned: false });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const isAdmin = user?.roles?.some(r => r && (r === 'admin' || r === 'hr_director' || r.name === 'admin' || r.name === 'hr_director'));

    const fetchNews = async () => {
        setLoading(true);
        try {
            const res = await axios.get('/api/v1/news');
            setNews(res.data?.data || []);
        } catch (error) {
            console.error("Error cargando noticias", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNews();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await axios.post('/api/v1/news', newPost);
            setIsModalOpen(false);
            setNewPost({ title: '', content: '', type: 'news', pinned: false });
            fetchNews();
        } catch (error) {
            alert(error.response?.data?.message || "Error al publicar noticia.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("¿Seguro que quieres borrar esta noticia?")) return;
        try {
            await axios.delete(`/api/v1/news/${id}`);
            fetchNews();
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div className="animate-fade-in pb-20 space-y-10">
            {/* Cabecera */}
            <div className="bg-white dark:bg-slate-800 rounded-[3rem] p-10 border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="text-center md:text-left">
                    <h2 className="text-4xl font-black text-slate-800 dark:text-white tracking-tight">Comunicación Interna</h2>
                    <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">Mantente al día con las últimas noticias y eventos del equipo.</p>
                </div>
                {isAdmin && (
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="px-8 py-4 bg-corporate text-white rounded-[1.5rem] font-black text-xs uppercase tracking-widest hover:bg-corporate-dark transition-all shadow-xl shadow-corporate/20"
                    >
                        <i className="fa-solid fa-plus-circle mr-2"></i>
                        Publicar Noticia
                    </button>
                )}
            </div>

            {/* Listado de Noticias */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {loading ? (
                    <div className="col-span-full py-20 text-center">
                        <div className="w-12 h-12 border-4 border-corporate border-t-transparent rounded-full animate-spin mx-auto"></div>
                    </div>
                ) : news.length === 0 ? (
                    <div className="col-span-full py-20 text-center opacity-40">
                         <i className="fa-solid fa-newspaper text-6xl mb-4"></i>
                         <p className="text-xl font-bold">No hay noticias publicadas todavía.</p>
                    </div>
                ) : (
                    news.map((item, idx) => (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            key={item.id}
                            className="bg-white dark:bg-slate-800 rounded-[2.5rem] p-8 border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-2xl transition-all relative overflow-hidden group"
                        >
                            <div className="flex justify-between items-start mb-6">
                                <div className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${
                                    item.type === 'policy' ? 'bg-amber-100 text-amber-600' :
                                    item.type === 'event' ? 'bg-purple-100 text-purple-600' :
                                    'bg-blue-100 text-blue-600'
                                }`}>
                                    {item.type === 'policy' ? 'Normativa' : item.type === 'event' ? 'Evento' : 'Noticia'}
                                </div>
                                {isAdmin && (
                                    <button
                                        onClick={() => handleDelete(item.id)}
                                        className="w-8 h-8 rounded-full bg-red-50 text-red-500 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <i className="fa-solid fa-trash-can text-xs"></i>
                                    </button>
                                )}
                            </div>

                            <h3 className="text-2xl font-black text-slate-800 dark:text-white leading-tight mb-4 group-hover:text-corporate transition-colors">
                                {item.title}
                            </h3>
                            
                            <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed mb-8">
                                {item.content}
                            </p>

                            <div className="flex items-center justify-between pt-6 border-t border-slate-50 dark:border-slate-700/50">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-400 font-black text-[10px]">
                                        {item.author?.name[0]}
                                    </div>
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.author?.name}</span>
                                </div>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{new Date(item.published_at).toLocaleDateString()}</span>
                            </div>
                        </motion.div>
                    ))
                )}
            </div>

            {/* Modal para Nueva Noticia */}
            <AnimatePresence>
                {isModalOpen && (
                    <ModalPortal>
                        <div className="fixed inset-0 z-[10000] bg-slate-900/80 backdrop-blur-xl flex items-center justify-center p-4">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9, y: 30 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: 30 }}
                                className="bg-white dark:bg-slate-800 w-full max-w-2xl rounded-[3rem] shadow-[0_30px_100px_rgba(0,0,0,0.5)] overflow-hidden border border-white/20 dark:border-slate-700/50 flex flex-col"
                            >
                                {/* Header del Modal con Degradado */}
                                <div className="bg-gradient-to-r from-corporate to-indigo-600 p-8 text-white relative overflow-hidden">
                                     <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full translate-x-10 -translate-y-10 blur-2xl"></div>
                                     <div className="flex justify-between items-center relative z-10">
                                         <div>
                                             <h3 className="text-3xl font-black tracking-tight">Crear Publicación</h3>
                                             <p className="text-white/70 text-sm font-medium mt-1">Comparte noticias o eventos con todo el equipo.</p>
                                         </div>
                                         <button 
                                             onClick={() => setIsModalOpen(false)} 
                                             className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white/10 hover:bg-white/20 transition-all group"
                                         >
                                             <i className="fa-solid fa-xmark text-xl transition-transform group-hover:rotate-90"></i>
                                         </button>
                                     </div>
                                </div>

                                <form onSubmit={handleSubmit} className="p-8 space-y-8 bg-white dark:bg-slate-800">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        {/* Título */}
                                        <div className="md:col-span-2 space-y-3">
                                            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-2">Título de la Noticia</label>
                                            <div className="relative group">
                                                <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-600 group-focus-within:text-corporate transition-colors">
                                                    <i className="fa-solid fa-heading text-lg"></i>
                                                </div>
                                                <input
                                                    required
                                                    type="text"
                                                    className="w-full pl-14 pr-6 py-5 bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700 rounded-[1.5rem] outline-none focus:ring-4 focus:ring-corporate/5 focus:border-corporate dark:focus:ring-corporate/10 text-slate-700 dark:text-white font-bold transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600 shadow-inner"
                                                    value={newPost.title}
                                                    onChange={e => setNewPost({ ...newPost, title: e.target.value })}
                                                    placeholder="Ej: Nueva política de teletrabajo..."
                                                />
                                            </div>
                                        </div>

                                        {/* Tipo de Noticia */}
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-2">Categoría</label>
                                            <div className="relative">
                                                <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-600">
                                                    <i className={`fa-solid ${
                                                        newPost.type === 'policy' ? 'fa-scale-balanced' :
                                                        newPost.type === 'event' ? 'fa-calendar-star' :
                                                        'fa-newspaper'
                                                    } text-lg`}></i>
                                                </div>
                                                <select
                                                    className="w-full pl-14 pr-6 py-5 bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700 rounded-[1.5rem] outline-none focus:border-corporate font-bold text-slate-700 dark:text-white transition-all appearance-none cursor-pointer shadow-inner"
                                                    value={newPost.type}
                                                    onChange={e => setNewPost({ ...newPost, type: e.target.value })}
                                                >
                                                    <option value="news">Noticia General</option>
                                                    <option value="event">Evento / Celebración</option>
                                                    <option value="policy">Normativa / Aviso</option>
                                                </select>
                                                <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                                    <i className="fa-solid fa-chevron-down text-xs"></i>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Toggle de Destacado */}
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-2">Prioridad</label>
                                            <button 
                                                type="button"
                                                onClick={() => setNewPost({ ...newPost, pinned: !newPost.pinned })}
                                                className={`w-full flex items-center justify-between px-6 py-5 rounded-[1.5rem] border transition-all shadow-inner ${
                                                    newPost.pinned 
                                                    ? 'bg-corporate/5 border-corporate/30 text-corporate' 
                                                    : 'bg-slate-50 dark:bg-slate-900/50 border-slate-100 dark:border-slate-700 text-slate-400 dark:text-slate-600'
                                                }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <i className={`fa-solid fa-thumbtack ${newPost.pinned ? 'animate-bounce' : 'rotate-45'}`}></i>
                                                    <span className="font-bold text-sm">{newPost.pinned ? 'Noticia Destacada' : 'No Destacada'}</span>
                                                </div>
                                                <div className={`w-10 h-5 rounded-full relative transition-colors ${newPost.pinned ? 'bg-corporate' : 'bg-slate-200 dark:bg-slate-800'}`}>
                                                    <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${newPost.pinned ? 'left-6' : 'left-1'}`}></div>
                                                </div>
                                            </button>
                                        </div>

                                        {/* Contenido */}
                                        <div className="md:col-span-2 space-y-3">
                                            <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-2">Cuerpo del Mensaje</label>
                                            <textarea
                                                required
                                                rows="5"
                                                className="w-full px-8 py-6 bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700 rounded-[2rem] outline-none focus:ring-4 focus:ring-corporate/5 focus:border-corporate dark:focus:ring-corporate/10 text-slate-700 dark:text-white font-medium leading-relaxed transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600 shadow-inner resize-none"
                                                value={newPost.content}
                                                onChange={e => setNewPost({ ...newPost, content: e.target.value })}
                                                placeholder="Describe los detalles de la noticia..."
                                            ></textarea>
                                        </div>
                                    </div>

                                    <div className="flex gap-4 pt-4">
                                        <button
                                            type="button"
                                            onClick={() => setIsModalOpen(false)}
                                            className="px-8 py-5 rounded-2xl font-black text-[11px] uppercase tracking-widest text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all font-bold"
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={isSubmitting}
                                            className="flex-1 py-5 bg-corporate text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-corporate/20 hover:bg-corporate-dark hover:shadow-corporate/40 transition-all disabled:opacity-50 flex items-center justify-center gap-3 active:scale-[0.98]"
                                        >
                                            {isSubmitting ? (
                                                <i className="fa-solid fa-circle-notch fa-spin text-lg"></i>
                                            ) : (
                                                <>
                                                    <i className="fa-solid fa-paper-plane"></i>
                                                    Publicar Ahora
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </form>
                            </motion.div>
                        </div>
                    </ModalPortal>
                )}
            </AnimatePresence>
        </div>
    );
};

export default News;
