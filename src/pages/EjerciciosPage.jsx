import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { collection, addDoc, onSnapshot, deleteDoc, doc, updateDoc, query, orderBy } from 'firebase/firestore';
import { Trash2, Edit3, Save, X, ShieldCheck } from 'lucide-react';

export default function EjerciciosPage() {
  const { user } = useAuth();
  const role = user?.role?.toLowerCase().trim();
  const esPoder = role === 'administrador' || role === 'admin' || role === 'manager';
  
  const [ejercicios, setEjercicios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [nuevoEj, setNuevoEj] = useState({ nombre: '', grupo: '' });
  const [editando, setEditando] = useState(null); // ID del ejercicio que se está editando
  const [editData, setEditData] = useState({ nombre: '', grupo: '' });

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
      grupo: nuevoEj.grupo.toUpperCase() 
    });
    setNuevoEj({ nombre: '', grupo: '' });
  };

  const handleUpdate = async (id) => {
    await updateDoc(doc(db, "ejercicios", id), {
      nombre: editData.nombre.toUpperCase(),
      grupo: editData.grupo.toUpperCase()
    });
    setEditando(null);
  };

  if (loading) return <div className="p-20 text-center text-[#FF3131] font-black uppercase tracking-widest">Cargando Base de Datos...</div>;

  return (
    <div className="animate-in fade-in duration-500">
      <header className="mb-8">
        <h1 className="text-4xl font-black italic text-white uppercase tracking-tighter">DATABASE <span className="text-[#FF3131]">EJERCICIOS</span></h1>
      </header>
      
      {esPoder ? (
        <form onSubmit={handleCreate} className="bg-[#0a0a0a] border border-[#FF3131]/20 p-6 rounded-2xl mb-8 flex flex-col md:flex-row gap-4">
          <input type="text" placeholder="NOMBRE" className="flex-1 bg-black border border-white/10 rounded-xl p-4 text-white text-xs font-bold uppercase outline-none focus:border-[#FF3131]" value={nuevoEj.nombre} onChange={e => setNuevoEj({...nuevoEj, nombre: e.target.value})} required />
          <input type="text" placeholder="GRUPO" className="flex-1 bg-black border border-white/10 rounded-xl p-4 text-white text-xs font-bold uppercase outline-none focus:border-[#FF3131]" value={nuevoEj.grupo} onChange={e => setNuevoEj({...nuevoEj, grupo: e.target.value})} required />
          <button type="submit" className="bg-[#FF3131] text-white px-10 py-4 rounded-xl font-black uppercase italic text-xs hover:bg-white hover:text-black transition-all">Añadir</button>
        </form>
      ) : (
        <div className="bg-white/5 p-4 rounded-xl mb-8 border border-white/5 flex items-center gap-3">
          <ShieldCheck size={16} className="text-gray-500" />
          <span className="text-gray-500 text-[9px] font-black uppercase tracking-widest">Modo consulta para {role}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {ejercicios.map(ej => (
          <div key={ej.id} className="bg-[#0a0a0a] border border-white/5 p-5 rounded-2xl flex justify-between items-center group">
            {editando === ej.id ? (
              <div className="flex flex-col gap-2 w-full">
                <input className="bg-black border border-[#FF3131] text-white text-[10px] p-2 uppercase rounded" value={editData.nombre} onChange={e => setEditData({...editData, nombre: e.target.value})} />
                <input className="bg-black border border-white/10 text-gray-400 text-[10px] p-2 uppercase rounded" value={editData.grupo} onChange={e => setEditData({...editData, grupo: e.target.value})} />
                <div className="flex gap-2 mt-1">
                  <button onClick={() => handleUpdate(ej.id)} className="text-green-500 hover:scale-110"><Save size={16}/></button>
                  <button onClick={() => setEditando(null)} className="text-gray-500 hover:scale-110"><X size={16}/></button>
                </div>
              </div>
            ) : (
              <>
                <div>
                  <p className="text-white font-black italic uppercase text-sm">{ej.nombre}</p>
                  <p className="text-[#FF3131] text-[9px] font-black uppercase mt-1">{ej.grupo}</p>
                </div>
                {esPoder && (
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => { setEditando(ej.id); setEditData({ nombre: ej.nombre, grupo: ej.grupo }); }} className="text-gray-500 hover:text-white"><Edit3 size={16}/></button>
                    <button onClick={async () => { if(window.confirm("¿BORRAR?")) await deleteDoc(doc(db, "ejercicios", ej.id)); }} className="text-gray-800 hover:text-[#FF3131]"><Trash2 size={16}/></button>
                  </div>
                )}
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}