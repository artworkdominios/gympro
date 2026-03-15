import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { collection, addDoc, onSnapshot, deleteDoc, doc, updateDoc, query, orderBy } from 'firebase/firestore';
import { Trash2, Edit3, X, Play, Search, Loader2, Link as LinkIcon, AlignLeft } from 'lucide-react';

export default function EjerciciosPage() {
  const { user } = useAuth();
  const role = user?.role?.toLowerCase().trim();
  const esPoder = role === 'administrador' || role === 'admin' || role === 'manager';

  const [ejercicios, setEjercicios] = useState([]);
  const [busqueda, setBusqueda] = useState('');
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
    try {
      await addDoc(collection(db, "ejercicios"), {
        ...nuevoEj,
        nombre: nuevoEj.nombre.toUpperCase(),
        grupo: nuevoEj.grupo.toUpperCase()
      });
      setNuevoEj({ nombre: '', grupo: '', videoUrl: '', observaciones: '' });
    } catch (error) {
      alert("Error al crear: " + error.message);
    }
  };

  const handleUpdate = async (id) => {
    try {
      await updateDoc(doc(db, "ejercicios", id), {
        ...editData,
        nombre: editData.nombre.toUpperCase(),
        grupo: editData.grupo.toUpperCase()
      });
      setEditando(null);
    } catch (error) {
      alert("Error al actualizar: " + error.message);
    }
  };

  const filtrados = ejercicios.filter(ej => 
    ej.nombre.toLowerCase().includes(busqueda.toLowerCase()) || 
    ej.grupo.toLowerCase().includes(busqueda.toLowerCase())
  );

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <Loader2 className="animate-spin text-[#FF3131]" size={40} />
    </div>
  );

  return (
    <div className="animate-in fade-in duration-500 max-w-7xl mx-auto p-4">
      <header className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-4xl font-black italic text-white uppercase tracking-tighter">
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
        <form onSubmit={handleCreate} className="bg-[#0a0a0a] border border-[#FF3131]/20 p-8 rounded-[35px] mb-12 space-y-4">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <input type="text" placeholder="NOMBRE" className="bg-black border border-white/5 rounded-2xl p-4 text-white text-xs font-bold uppercase outline-none focus:border-[#FF3131]" value={nuevoEj.nombre} onChange={e => setNuevoEj({...nuevoEj, nombre: e.target.value})} required />
             <input type="text" placeholder="GRUPO MUSCULAR" className="bg-black border border-white/5 rounded-2xl p-4 text-white text-xs font-bold uppercase outline-none focus:border-[#FF3131]" value={nuevoEj.grupo} onChange={e => setNuevoEj({...nuevoEj, grupo: e.target.value})} required />
           </div>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <input type="text" placeholder="URL VIDEO" className="bg-black border border-white/5 rounded-2xl p-4 text-white text-[10px] outline-none focus:border-[#FF3131]" value={nuevoEj.videoUrl} onChange={e => setNuevoEj({...nuevoEj, videoUrl: e.target.value})} />
             <textarea placeholder="TIPS Y OBSERVACIONES TÉCNICAS" className="bg-black border border-white/5 rounded-2xl p-4 text-white text-[10px] outline-none focus:border-[#FF3131] min-h-[52px] resize-none" value={nuevoEj.observaciones} onChange={e => setNuevoEj({...nuevoEj, observaciones: e.target.value})} />
           </div>
           <button type="submit" className="w-full bg-[#FF3131] text-white py-5 rounded-2xl font-black uppercase italic text-xs hover:bg-white hover:text-black transition-all">
            Publicar Ejercicio 🔥
           </button>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtrados.map(ej => (
          <div key={ej.id} className="bg-[#0a0a0a] border border-white/5 p-6 rounded-[32px] group hover:border-[#FF3131]/30 transition-all flex flex-col">
            {editando === ej.id ? (
              <div className="space-y-3">
                <input className="w-full bg-black border border-[#FF3131] text-white text-xs p-3 rounded-xl uppercase font-bold outline-none" value={editData.nombre} onChange={e => setEditData({...editData, nombre: e.target.value})} />
                <input className="w-full bg-black border border-white/10 text-white text-[10px] p-3 rounded-xl uppercase font-bold outline-none" value={editData.grupo} onChange={e => setEditData({...editData, grupo: e.target.value})} />
                <input className="w-full bg-black border border-white/10 text-white text-[9px] p-3 rounded-xl outline-none" placeholder="Video URL" value={editData.videoUrl} onChange={e => setEditData({...editData, videoUrl: e.target.value})} />
                <textarea className="w-full bg-black border border-white/10 text-white text-[9px] p-3 rounded-xl outline-none min-h-[60px] resize-none" placeholder="Tips / Observaciones" value={editData.observaciones} onChange={e => setEditData({...editData, observaciones: e.target.value})} />
                <div className="flex gap-2">
                  <button onClick={() => handleUpdate(ej.id)} className="flex-1 bg-green-600 text-white p-3 rounded-xl font-black text-[10px] uppercase">Guardar</button>
                  <button onClick={() => setEditando(null)} className="flex-1 bg-white/10 text-white p-3 rounded-xl font-black text-[10px] uppercase">X</button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col h-full">
                <div className="flex justify-between mb-4">
                  <div>
                    <h3 className="text-white font-black italic uppercase text-lg leading-tight group-hover:text-[#FF3131] transition-colors">{ej.nombre}</h3>
                    <p className="text-[#FF3131] text-[9px] font-black uppercase tracking-widest mt-1">{ej.grupo}</p>
                  </div>
                  {esPoder && (
                    <div className="flex gap-1">
                      <button onClick={() => { setEditando(ej.id); setEditData(ej); }} className="text-gray-500 hover:text-white p-2 transition-colors"><Edit3 size={14}/></button>
                      <button onClick={async () => { if(window.confirm("¿Borrar?")) await deleteDoc(doc(db, "ejercicios", ej.id)); }} className="text-gray-800 hover:text-red-500 p-2 transition-colors"><Trash2 size={14}/></button>
                    </div>
                  )}
                </div>

                {ej.observaciones && (
                  <div className="bg-white/5 p-3 rounded-2xl mb-4 border-l-2 border-[#FF3131]">
                    <div className="flex items-center gap-2 mb-1">
                      <AlignLeft size={10} className="text-gray-500" />
                      <span className="text-[7px] font-black text-gray-500 uppercase">Tips de entrenamiento</span>
                    </div>
                    <p className="text-gray-400 text-[10px] italic leading-tight">{ej.observaciones}</p>
                  </div>
                )}

                <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <LinkIcon size={12} className={ej.videoUrl ? "text-[#FF3131]" : "text-gray-800"} />
                    <span className="text-[8px] font-black uppercase text-gray-500">{ej.videoUrl ? "VIDEO OK" : "SIN VIDEO"}</span>
                  </div>
                  {ej.videoUrl && (
                    <a href={ej.videoUrl} target="_blank" rel="noreferrer" className="text-white bg-[#FF3131] p-2 rounded-xl hover:scale-110 transition-all">
                      <Play size={10} fill="currentColor"/>
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}