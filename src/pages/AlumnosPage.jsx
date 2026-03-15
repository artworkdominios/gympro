import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, onSnapshot, query, where, doc, updateDoc } from 'firebase/firestore';
import { Search, UserPlus, MoreVertical, Calendar, CreditCard, CheckCircle2, AlertCircle, Save, X, HeartPulse } from 'lucide-react';

export default function AlumnosPage() {
  const [alumnos, setAlumnos] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAlumno, setSelectedAlumno] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [features, setFeatures] = useState({ aptoMedicoEnabled: false }); // Estado para el Control Maestro
  
  const [editNombre, setEditNombre] = useState('');
  const [editFecha, setEditFecha] = useState('');
  const [editApto, setEditApto] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // 1. Escuchar Configuración del Control Maestro
    const unsubConfig = onSnapshot(doc(db, "configuracion", "features"), (snap) => {
      if (snap.exists()) setFeatures(snap.data());
    });

    // 2. Escuchar Lista de Alumnos
    const q = query(collection(db, "users"), where("role", "==", "alumno"));
    const unsubAlumnos = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      }));
      setAlumnos(docs);
    });

    return () => {
      unsubConfig();
      unsubAlumnos();
    };
  }, []);

  // Lógica combinada de estados (Cuota y Apto Médico)
  const getEstadoData = (fechaVencimiento, fechaApto) => {
    const hoy = new Date();
    
    // Estado de Cuota
    let cuota = { label: 'VIGENTE', color: 'text-green-500', bg: 'bg-green-500/10', icon: <CheckCircle2 size={12}/> };
    if (!fechaVencimiento) {
      cuota = { label: 'SIN FECHA', color: 'text-gray-500', bg: 'bg-gray-500/10', icon: null };
    } else if (new Date(fechaVencimiento) < hoy) {
      cuota = { label: 'VENCIDO', color: 'text-[#FF3131]', bg: 'bg-red-500/10', icon: <AlertCircle size={12}/> };
    }

    // Estado de Apto Médico (solo si está habilitado en Control Maestro)
    let apto = { label: 'OK', color: 'text-gray-500', alerta: false };
    if (features.aptoMedicoEnabled && fechaApto) {
      const vencApto = new Date(fechaApto);
      const diffTime = vencApto - hoy;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays <= 0) {
        apto = { label: 'APTO VENCIDO', color: 'text-[#FF3131]', alerta: true };
      } else if (diffDays <= 30) {
        apto = { label: `VENCE EN ${diffDays} DÍAS`, color: 'text-yellow-500', alerta: true };
      }
    } else if (features.aptoMedicoEnabled && !fechaApto) {
      apto = { label: 'PENDIENTE', color: 'text-gray-600', alerta: true };
    }

    return { cuota, apto };
  };

  const openModal = (alumno) => {
    setSelectedAlumno(alumno);
    setEditNombre(alumno.nombre || '');
    setEditFecha(alumno.fecha_vencimiento || '');
    setEditApto(alumno.fecha_apto || ''); // Cargamos fecha de apto
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    if (!selectedAlumno?.id) return;
    setLoading(true);
    try {
      const userRef = doc(db, "users", selectedAlumno.id);
      await updateDoc(userRef, {
        nombre: editNombre,
        fecha_vencimiento: editFecha,
        fecha_apto: editApto // Guardamos fecha de apto
      });
      setIsModalOpen(false);
      setSelectedAlumno(null);
    } catch (error) {
      console.error("Error:", error);
      alert("Error al guardar");
    } finally {
      setLoading(false);
    }
  };

  const filteredAlumnos = alumnos.filter(alumno => {
    const term = searchTerm.toLowerCase();
    const { cuota, apto } = getEstadoData(alumno.fecha_vencimiento, alumno.fecha_apto);
    
    return (
      alumno.nombre?.toLowerCase().includes(term) ||
      alumno.username?.toLowerCase().includes(term) ||
      cuota.label.toLowerCase().includes(term) ||
      (features.aptoMedicoEnabled && apto.label.toLowerCase().includes(term))
    );
  });

  return (
    <div className="animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
        <div>
          <h1 className="text-4xl font-black text-white italic tracking-tighter uppercase">
            Gestión de <span className="text-[#FF3131]">Alumnos</span>
          </h1>
          <p className="text-gray-500 text-[10px] font-bold uppercase tracking-[3px]">Panel Administrativo</p>
        </div>
        <button className="bg-white text-black font-black px-6 py-3 rounded-2xl flex items-center gap-2 uppercase text-[10px] hover:bg-[#FF3131] hover:text-white transition-all">
          <UserPlus size={16} /> Nuevo Alumno
        </button>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
        <input 
          type="text"
          placeholder="BUSCAR POR NOMBRE, ESTADO O APTO..."
          className="w-full bg-[#0a0a0a] border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white text-[10px] font-bold tracking-widest focus:border-[#FF3131] outline-none transition-all"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="bg-[#0a0a0a] border border-white/5 rounded-[32px] overflow-hidden shadow-2xl">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/5 bg-white/5">
              <th className="p-6 text-[9px] font-black text-gray-400 uppercase tracking-widest">Alumno</th>
              <th className="p-6 text-[9px] font-black text-gray-400 uppercase tracking-widest">Estado Cuota</th>
              {features.aptoMedicoEnabled && (
                <th className="p-6 text-[9px] font-black text-gray-400 uppercase tracking-widest">Apto Médico</th>
              )}
              <th className="p-6 text-[9px] font-black text-gray-400 uppercase tracking-widest text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filteredAlumnos.map((alumno) => {
              const { cuota, apto } = getEstadoData(alumno.fecha_vencimiento, alumno.fecha_apto);
              return (
                <tr key={alumno.id} className="hover:bg-white/[0.02] transition-colors group">
                  <td className="p-6">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-gradient-to-br from-[#FF3131] to-[#b31d1d] rounded-xl flex items-center justify-center text-white font-black italic">
                        {alumno.nombre?.charAt(0)}
                      </div>
                      <div>
                        <p className="text-white font-bold text-sm uppercase italic">{alumno.nombre}</p>
                        <p className="text-gray-500 text-[9px] font-bold italic">@{alumno.username}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-6">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[8px] font-black tracking-tighter ${cuota.bg} ${cuota.color}`}>
                      {cuota.icon} {cuota.label}
                    </span>
                  </td>
                  {features.aptoMedicoEnabled && (
                    <td className="p-6">
                      <div className={`flex items-center gap-2 text-[10px] font-bold ${apto.color}`}>
                        <HeartPulse size={14} className={apto.alerta ? "animate-pulse" : ""} />
                        {apto.label}
                      </div>
                    </td>
                  )}
                  <td className="p-6 text-right">
                    <button onClick={() => openModal(alumno)} className="text-gray-500 hover:text-white p-2">
                      <MoreVertical size={20} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm">
          <div className="bg-[#111] border border-white/10 w-full max-w-lg rounded-[40px] overflow-hidden shadow-2xl animate-in zoom-in-95">
            <div className="p-8 bg-gradient-to-r from-[#FF3131]/10 to-transparent border-b border-white/5 flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter">Perfil Alumno</h2>
                <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">Edición de datos y fechas</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-white">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-[9px] font-black text-[#FF3131] uppercase tracking-[2px]">Nombre</label>
                <input 
                  type="text" value={editNombre}
                  onChange={(e) => setEditNombre(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white text-xs font-bold outline-none focus:border-[#FF3131]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-[#FF3131] uppercase tracking-[2px]">Venc. Cuota</label>
                  <input 
                    type="date" value={editFecha}
                    onChange={(e) => setEditFecha(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white text-xs font-bold outline-none"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-[#FF3131] uppercase tracking-[2px]">Venc. Apto</label>
                  <input 
                    type="date" value={editApto}
                    onChange={(e) => setEditApto(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white text-xs font-bold outline-none"
                  />
                </div>
              </div>

              <div className="p-8 bg-white/[0.02] border-t border-white/5 flex gap-3 -mx-8 -mb-8 mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 bg-white/5 text-white font-black py-4 rounded-2xl uppercase text-[10px]">
                  Cancelar
                </button>
                <button 
                  type="submit" disabled={loading}
                  className="flex-1 bg-[#FF3131] text-white font-black py-4 rounded-2xl uppercase text-[10px] shadow-[0_0_20px_rgba(255,49,49,0.3)] disabled:opacity-50"
                >
                  {loading ? 'GUARDANDO...' : 'GUARDAR CAMBIOS'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}