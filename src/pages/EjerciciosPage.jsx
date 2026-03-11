import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { collection, addDoc, onSnapshot, deleteDoc, doc, updateDoc, query, orderBy } from 'firebase/firestore';
import { Trash2, Edit3, Save, X, ShieldCheck, Link as LinkIcon, Info, ExternalLink, Play } from 'lucide-react';

export default function EjerciciosPage() {
  const { user } = useAuth();
  const role = user?.role?.toLowerCase().trim();
  const esPoder = role === 'administrador' || role === 'admin' || role === 'manager';

  const [ejercicios, setEjercicios] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [nuevoEj, setNuevoEj] = useState({ nombre: '', grupo: '', videoUrl: '', observaciones: '' });
  const [editando, setEditando] = useState(null); 
  const [editData, setEditData] = useState({ nombre: '', grupo: '', videoUrl: '', observaciones: '' });

  useEffect(() => {
    const q = query(collection(db, "ejercicios"), orderBy("nombre", "asc"));
    return onSnapshot(q, (snapshot) => {
      setEjercicios(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!esPoder) return;
    await addDoc(collection(db, "ejercicios"), {
      ...nuevoEj,
      nombre: nuevoEj.nombre.toUpperCase(),
      grupo: nuevoEj.grupo.toUpperCase(),
      videoUrl: nuevoEj.videoUrl,
      observaciones: nuevoEj.observaciones
    });
    setNuevoEj({ nombre: '', grupo: '', videoUrl: '', observaciones: '' });
  };

  const handleUpdate = async (id) => {
    await updateDoc(doc(db, "ejercicios", id), {
      nombre: editData.nombre.toUpperCase(),
      grupo: editData.grupo.toUpperCase(),
      videoUrl: editData.videoUrl,
      observaciones: editData.observaciones
    });
    setEditando(null);
  };

  if (loading) return <div className="p-20 text-center text-[#FF3131] font-black uppercase tracking-widest animate-pulse">Cargando Base de Datos...</div>;

  return (
    <div className="animate-in fade-in duration-500 max-w-7xl mx-auto p-4">
      <header className="mb-8">
        <h1 className="text-4xl font-black italic text-white uppercase tracking-tighter">LISTA DE <span className="text-[#FF3131]">EJERCICIOS</span></h1>
      </header>

      {esPoder ? (
        <form onSubmit={handleCreate} className="bg-[#0a0a0a] border border-[#FF3131]/20 p-6 rounded-2xl mb-8 space-y-4 shadow-xl shadow-[#FF3131]/5">
          <div className="flex flex-col md:flex-row gap-4">
            <input type="text" placeholder="NOMBRE DEL EJERCICIO" className="flex-1 bg-black border border-white/10 rounded-xl p-4 text-white text-xs font-bold uppercase outline-none focus:border-[#FF3131]" value={nuevoEj.nombre} onChange={e => setNuevoEj({ ...nuevoEj, nombre: e.target.value })} required />
            <input type="text" placeholder="GRUPO (PECHO, PIERNAS...)" className="flex-1 bg-black border border-white/10 rounded-xl p-4 text-white text-xs font-bold uppercase outline-none focus:border-[#FF3131]" value={nuevoEj.grupo} onChange={e => setNuevoEj({ ...nuevoEj, grupo: e.target.value })} required />
          </div>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <input type="text" placeholder="URL VIDEO" className="w-full bg-black border border-white/10 rounded-xl p-4 text-white text-[10px] font-bold outline-none focus:border-[#FF3131]" value={nuevoEj.videoUrl} onChange={e => setNuevoEj({ ...nuevoEj, videoUrl: e.target.value })} />
              {nuevoEj.videoUrl && <a href={nuevoEj.videoUrl} target="_blank" rel="noreferrer" className="absolute right-3 top-1/2 -translate-y-1/2 text-[#FF3131] hover:text-white"><ExternalLink size={14}/></a>}
            </div>
            <input type="text" placeholder="TIPS / OBSERVACIONES" className="flex-1 bg-black border border-white/10 rounded-xl p-4 text-white text-[10px] font-bold outline-none focus:border-[#FF3131]" value={nuevoEj.observaciones} onChange={e => setNuevoEj({ ...nuevoEj, observaciones: e.target.value })} />
          </div>
          <button type="submit" className="w-full bg-[#FF3131] text-white py-4 rounded-xl font-black uppercase italic text-xs hover:bg-white hover:text-black transition-all transform active:scale-[0.98]">Añadir a la Biblioteca 🔥</button>
        </form>
      ) : (
        <div className="bg-white/5 p-4 rounded-xl mb-8 border border-white/5 flex items-center gap-3">
          <ShieldCheck size={16} className="text-gray-500" />
          <span className="text-gray-500 text-[9px] font-black uppercase tracking-widest">Modo consulta para {role}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {ejercicios.map(ej => (
          <div key={ej.id} className="bg-[#0a0a0a] border border-white/5 p-5 rounded-2xl group transition-all hover:border-white/20 hover:shadow-lg">
            {editando === ej.id ? (
              <div className="flex flex-col gap-3 w-full">
                <input className="bg-black border border-[#FF3131] text-white text-[10px] p-2 uppercase rounded font-bold" value={editData.nombre} onChange={e => setEditData({ ...editData, nombre: e.target.value })} />
                <input className="bg-black border border-white/10 text-gray-400 text-[10px] p-2 uppercase rounded font-bold" value={editData.grupo} onChange={e => setEditData({ ...editData, grupo: e.target.value })} />
                <div className="relative">
                  <input placeholder="URL VIDEO" className="w-full bg-black border border-white/10 text-white text-[9px] p-2 rounded pr-8" value={editData.videoUrl} onChange={e => setEditData({ ...editData, videoUrl: e.target.value })} />
                  {editData.videoUrl && <a href={editData.videoUrl} target="_blank" rel="noreferrer" className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500"><ExternalLink size={12}/></a>}
                </div>
                <textarea placeholder="OBSERVACIONES" className="bg-black border border-white/10 text-white text-[9px] p-2 rounded min-h-[60px]" value={editData.observaciones} onChange={e => setEditData({ ...editData, observaciones: e.target.value })} />
                <div className="flex gap-4 mt-2 justify-end border-t border-white/5 pt-2">
                  <button onClick={() => handleUpdate(ej.id)} className="text-green-500 hover:text-green-400 flex items-center gap-1 text-[10px] font-black uppercase"><Save size={14} /> Guardar</button>
                  <button onClick={() => setEditando(null)} className="text-gray-500 hover:text-white flex items-center gap-1 text-[10px] font-black uppercase"><X size={14} /> Cancelar</button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col h-full">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-white font-black italic uppercase text-sm leading-tight group-hover:text-[#FF3131] transition-colors">{ej.nombre}</p>
                    <p className="text-gray-600 text-[9px] font-black uppercase">{ej.grupo}</p>
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                    <button onClick={() => { setEditando(ej.id); setEditData({ nombre: ej.nombre, grupo: ej.grupo, videoUrl: ej.videoUrl || '', observaciones: ej.observaciones || '' }); }} className="text-gray-500 hover:text-white bg-white/5 p-1.5 rounded-lg"><Edit3 size={14} /></button>
                    <button onClick={async () => { if (window.confirm("¿BORRAR?")) await deleteDoc(doc(db, "ejercicios", ej.id)); }} className="text-gray-800 hover:text-[#FF3131] bg-white/5 p-1.5 rounded-lg"><Trash2 size={14} /></button>
                  </div>
                </div>

                <div className="mt-auto space-y-3">
                  <div className="flex items-center justify-between bg-black/40 p-2 rounded-xl">
                    <div className="flex items-center gap-2">
                      <LinkIcon size={12} className={ej.videoUrl ? "text-[#FF3131]" : "text-gray-800"} />
                      <span className={`text-[8px] font-black uppercase ${ej.videoUrl ? "text-gray-300" : "text-gray-700"}`}>
                        {ej.videoUrl ? "Video Listo" : "Sin Video"}
                      </span>
                    </div>
                    {ej.videoUrl && (
                      <a href={ej.videoUrl} target="_blank" rel="noreferrer" className="bg-[#FF3131] p-1 rounded-md text-white hover:scale-110 transition-transform">
                        <Play size={10} fill="currentColor" />
                      </a>
                    )}
                  </div>
                  
                  <div className="bg-black/20 p-2 rounded-xl border border-white/5 min-h-[45px]">
                    <div className="flex items-center gap-2 mb-1">
                      <Info size={10} className={ej.observaciones ? "text-blue-500" : "text-gray-800"} />
                      <span className="text-[7px] text-gray-500 font-black uppercase tracking-tighter">Observaciones</span>
                    </div>
                    <p className="text-[9px] text-gray-400 font-medium italic line-clamp-2 leading-relaxed">
                      {ej.observaciones || "Ingresa Tips"}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}