import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { collection, query, where, onSnapshot, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { Search, Trash2, UserCircle, Edit3, X, Save, Shield } from 'lucide-react';

export default function AlumnosPage() {
  const { user } = useAuth();
  const role = user?.role?.toLowerCase().trim();
  
  // Permisos: Solo Admin y Manager gestionan
  const esGestion = role === 'administrador' || role === 'admin' || role === 'manager';

  const [alumnos, setAlumnos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [editando, setEditando] = useState(null);
  const [nuevoNombre, setNuevoNombre] = useState('');

  useEffect(() => {
    const q = query(collection(db, "users"), where("role", "==", "alumno"));
    return onSnapshot(q, (snapshot) => {
      setAlumnos(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
  }, []);

  const handleUpdate = async (id) => {
    if (!nuevoNombre.trim()) return;
    await updateDoc(doc(db, "users", id), { nombre: nuevoNombre.toUpperCase() });
    setEditando(null);
  };

  const handleDelete = async (id, nombre) => {
    if (!esGestion) return;
    if (window.confirm(`¿BORRAR DEFINITIVAMENTE A ${nombre}?`)) {
      await deleteDoc(doc(db, "users", id));
    }
  };

  const filtrados = alumnos.filter(a => a.nombre?.toLowerCase().includes(busqueda.toLowerCase()));

  return (
    <div className="animate-in fade-in duration-500">
      <header className="mb-8">
        <h1 className="text-4xl font-black italic text-white uppercase tracking-tighter">
          {esGestion ? 'Gestión' : 'Lista'} <span className="text-[#FF3131]">Alumnos</span>
        </h1>
      </header>

      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
        <input 
          type="text" 
          placeholder="BUSCAR ALUMNO POR NOMBRE..." 
          className="w-full bg-[#0a0a0a] border border-white/5 rounded-xl py-4 pl-12 text-white text-[10px] font-black uppercase outline-none focus:border-[#FF3131]/50"
          onChange={(e) => setBusqueda(e.target.value)}
        />
      </div>

      <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
        <table className="w-full text-left">
          <thead className="bg-white/5 text-[#FF3131] text-[10px] font-black uppercase tracking-widest">
            <tr>
              <th className="p-5">Alumno</th>
              <th className="p-5">Email</th>
              {esGestion && <th className="p-5 text-right">Acciones</th>}
            </tr>
          </thead>
          <tbody>
            {alumnos.length === 0 ? (
              <tr><td colSpan="3" className="p-10 text-center text-gray-500 text-[10px] font-black uppercase">No hay alumnos registrados</td></tr>
            ) : filtrados.map((a) => (
              <tr key={a.id} className="border-b border-white/5 hover:bg-white/[0.01]">
                <td className="p-5">
                  {editando === a.id ? (
                    <div className="flex gap-2">
                      <input 
                        className="bg-black border border-[#FF3131] rounded px-2 py-1 text-white text-xs uppercase"
                        value={nuevoNombre}
                        onChange={(e) => setNuevoNombre(e.target.value)}
                        autoFocus
                      />
                      <button onClick={() => handleUpdate(a.id)} className="text-green-500"><Save size={16}/></button>
                      <button onClick={() => setEditando(null)} className="text-gray-500"><X size={16}/></button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <UserCircle className={esGestion ? "text-[#FF3131]" : "text-gray-600"} size={20} />
                      <span className="text-white font-bold uppercase text-xs italic tracking-tight">{a.nombre}</span>
                    </div>
                  )}
                </td>
                <td className="p-5 text-gray-500 text-xs">{a.email}</td>
                {esGestion && (
                  <td className="p-5 text-right space-x-4">
                    <button 
                      onClick={() => { setEditando(a.id); setNuevoNombre(a.nombre); }} 
                      className="text-gray-500 hover:text-white transition-colors"
                    >
                      <Edit3 size={16} />
                    </button>
                    <button 
                      onClick={() => handleDelete(a.id, a.nombre)} 
                      className="text-gray-700 hover:text-[#FF3131] transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}