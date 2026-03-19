import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { collection, addDoc, onSnapshot, deleteDoc, doc, updateDoc, query, orderBy } from 'firebase/firestore';
import { Trash2, Edit3, X, Play, Search, Loader2, Link as LinkIcon, Check } from 'lucide-react';

export default function EjerciciosPage() {
  const { user } = useAuth();
  const role = user?.role?.toLowerCase().trim();
  const esPoder = role === 'administrador' || role === 'admin' || role === 'manager';

  const [ejercicios, setEjercicios] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [loading, setLoading] = useState(true);
  const [videoActivo, setVideoActivo] = useState(null);
  
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
    try {
      await addDoc(collection(db, "ejercicios"), {
        ...nuevoEj,
        nombre: nuevoEj.nombre.toUpperCase(),
        grupo: nuevoEj.grupo.toUpperCase()
      });
      setNuevoEj({ nombre: '', grupo: '', videoUrl: '', observaciones: '' });
    } catch (error) { alert("Error: " + error.message); }
  };

  const handleUpdate = async (id) => {
    try {
      await updateDoc(doc(db, "ejercicios", id), {
        ...editData,
        nombre: editData.nombre.toUpperCase(),
        grupo: editData.grupo.toUpperCase()
      });
      setEditando(null);
    } catch (error) { alert("Error: " + error.message); }
  };

  const filtrados = ejercicios.filter(ej => 
    ej.nombre.toLowerCase().includes(busqueda.toLowerCase()) || 
    ej.grupo.toLowerCase().includes(busqueda.toLowerCase())
  );

  if (loading) return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <Loader2 className="animate-spin text-[#FF3131]" size={40} />
    </div>
  );

  return (
    <div className="animate-in fade-in duration-500 max-w-7xl mx-auto p-4 pb-32">
      <header className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-3xl md:text-4xl font-black italic text-white uppercase tracking-tighter">
          BIBLIOTECA DE <span className="text-[#FF3131]">EJERCICIOS</span>
        </h1>
        <div className="relative w-full md:w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#FF3131]" size={18} />
          <input 
            type="text" 
            placeholder="BUSCAR..." 
            className="w-full bg-[#0a0a0a] border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-white text-[10px] font-black uppercase outline-none focus:border-[#FF3131]"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>
      </header>

      {esPoder && (
        <form onSubmit={handleCreate} className="bg-[#0a0a0a] border border-[#FF3131]/20 p-6 md:p-8 rounded-[35px] mb-12 space-y-4 shadow-2xl">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <input type="text" placeholder="NOMBRE" className="bg-black border border-white/5 rounded-2xl p-4 text-white text-xs font-bold uppercase outline-none focus:border-[#FF3131]" value={nuevoEj.nombre} onChange={e => setNuevoEj({...nuevoEj, nombre: e.target.value})} required />
             <input type="text" placeholder="GRUPO MUSCULAR" className="bg-black border border-white/5 rounded-2xl p-4 text-white text-xs font-bold uppercase outline-none focus:border-[#FF3131]" value={nuevoEj.grupo} onChange={e => setNuevoEj({...nuevoEj, grupo: e.target.value})} required />
           </div>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <input type="text" placeholder="URL VIDEO (DIRECTO)" className="bg-black border border-white/5 rounded-2xl p-4 text-white text-[10px] outline-none focus:border-[#FF3131]" value={nuevoEj.videoUrl} onChange={e => setNuevoEj({...nuevoEj, videoUrl: e.target.value})} />
             <textarea placeholder="TIPS TÉCNICOS" className="bg-black border border-white/5 rounded-2xl p-4 text-white text-[10px] outline-none focus:border-[#FF3131] min-h-[52px] resize-none" value={nuevoEj.observaciones} onChange={e => setNuevoEj({...nuevoEj, observaciones: e.target.value})} />
           </div>
           <button type="submit" className="w-full bg-[#FF3131] text-white py-4 rounded-2xl font-black uppercase italic text-xs hover:scale-[1.01] transition-all shadow-[0_0_20px_rgba(255,49,49,0.2)]">Publicar Ejercicio 🔥</button>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtrados.map(ej => (
          <div key={ej.id} className="bg-[#0a0a0a] border border-white/5 p-6 rounded-[32px] group hover:border-[#FF3131]/30 transition-all flex flex-col h-full shadow-2xl relative overflow-hidden">
            
            {editando === ej.id ? (
              <div className="space-y-3 animate-in zoom-in duration-200">
                <div className="space-y-1">
                  <p className="text-[7px] text-gray-500 font-black uppercase ml-1">Nombre</p>
                  <input className="w-full bg-black border border-[#FF3131] text-white text-xs p-3 rounded-xl uppercase font-bold outline-none" value={editData.nombre} onChange={e => setEditData({...editData, nombre: e.target.value})} />
                </div>
                
                <div className="space-y-1">
                  <p className="text-[7px] text-gray-500 font-black uppercase ml-1">Grupo</p>
                  <input className="w-full bg-black border border-white/10 text-white text-[10px] p-3 rounded-xl uppercase font-bold outline-none focus:border-[#FF3131]" value={editData.grupo} onChange={e => setEditData({...editData, grupo: e.target.value})} />
                </div>

                <div className="space-y-1">
                  <p className="text-[7px] text-gray-500 font-black uppercase ml-1">URL Video</p>
                  <input className="w-full bg-black border border-white/10 text-white text-[10px] p-3 rounded-xl outline-none focus:border-[#FF3131]" value={editData.videoUrl} onChange={e => setEditData({...editData, videoUrl: e.target.value})} />
                </div>

                <div className="space-y-1">
                  <p className="text-[7px] text-gray-500 font-black uppercase ml-1">Tips Técnicos</p>
                  <textarea className="w-full bg-black border border-white/10 text-white text-[10px] p-3 rounded-xl outline-none focus:border-[#FF3131] min-h-[60px] resize-none" value={editData.observaciones} onChange={e => setEditData({...editData, observaciones: e.target.value})} />
                </div>

                <div className="flex gap-2 pt-2">
                  <button onClick={() => handleUpdate(ej.id)} className="flex-1 bg-[#31FF31] text-black p-3 rounded-xl font-black text-[10px] uppercase flex justify-center items-center gap-1 hover:bg-green-400 transition-colors">
                    <Check size={14} /> GUARDAR
                  </button>
                  <button onClick={() => setEditando(null)} className="flex-1 bg-white/10 text-white p-3 rounded-xl font-black text-[10px] uppercase">Cancelar</button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col h-full">
                <div className="flex justify-between mb-4">
                  <div>
                    <h3 className="text-white font-black italic uppercase text-lg group-hover:text-[#FF3131] transition-colors leading-tight">{ej.nombre}</h3>
                    <p className="text-[#FF3131] text-[9px] font-black uppercase tracking-widest mt-1">{ej.grupo}</p>
                  </div>
                  {esPoder && (
                    <div className="flex gap-1">
                      <button onClick={() => { setEditando(ej.id); setEditData(ej); }} className="text-gray-600 hover:text-white p-2 transition-colors"><Edit3 size={14}/></button>
                      <button onClick={async () => { if(window.confirm("¿Borrar?")) await deleteDoc(doc(db, "ejercicios", ej.id)); }} className="text-gray-800 hover:text-red-500 p-2 transition-colors"><Trash2 size={14}/></button>
                    </div>
                  )}
                </div>

                {ej.observaciones && (
                  <div className="bg-white/5 p-3 rounded-2xl mb-4 border-l-2 border-[#FF3131]">
                    <p className="text-gray-400 text-[10px] italic leading-tight">{ej.observaciones}</p>
                  </div>
                )}

                <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <LinkIcon size={12} className={ej.videoUrl ? "text-[#FF3131]" : "text-gray-800"} />
                    <span className="text-[8px] font-black uppercase text-gray-500 tracking-widest">{ej.videoUrl ? "VIDEO DISPONIBLE" : "SIN VIDEO"}</span>
                  </div>
                  {ej.videoUrl && (
                    <button 
                      onClick={() => setVideoActivo(ej)}
                      className="text-white bg-[#FF3131] p-3 rounded-xl hover:scale-110 shadow-[0_0_15px_rgba(255,49,49,0.4)] transition-all"
                    >
                      <Play size={12} fill="currentColor"/>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {videoActivo && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/95 backdrop-blur-md" onClick={() => setVideoActivo(null)}></div>
          <div className="relative w-full max-w-2xl bg-[#0a0a0a] border border-[#FF3131]/30 rounded-[35px] overflow-hidden shadow-[0_0_50px_rgba(255,49,49,0.2)] animate-in zoom-in duration-300">
            <div className="p-4 flex justify-between items-center border-b border-white/5">
              <h4 className="text-white font-black italic uppercase text-xs tracking-widest">{videoActivo.nombre}</h4>
              <button onClick={() => setVideoActivo(null)} className="text-white/50 hover:text-[#FF3131]"><X size={20}/></button>
            </div>
            <div className="aspect-video bg-black flex items-center justify-center">
              <video 
                key={videoActivo.videoUrl}
                src={videoActivo.videoUrl} 
                className="w-full h-full object-contain"
                controls
                playsInline
                webkit-playsinline="true"
                autoPlay
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}