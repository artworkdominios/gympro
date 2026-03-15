import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc, orderBy, serverTimestamp } from 'firebase/firestore';
import { Plus, Trash2, X, History, ChevronDown, Loader2, Search, Link as LinkIcon, Info, CalendarDays, Edit3 } from 'lucide-react';
import GymCard from '../components/ui/GymCard.jsx';
import GymButton from '../components/ui/GymButton.jsx';

export default function RutinasPage() {
  const { user } = useAuth();
  const role = user?.role?.toLowerCase().trim();
  const esAdmin = role === 'administrador' || role === 'admin';
  const esManager = role === 'manager';

  const [alumnos, setAlumnos] = useState([]);
  const [alumnoSeleccionado, setAlumnoSeleccionado] = useState('');
  const [historialRutinas, setHistorialRutinas] = useState([]);
  const [biblioteca, setBiblioteca] = useState([]);
  
  const [bloques, setBloques] = useState([{ nombreDia: 'Día 1', ejercicios: [] }]);
  
  const [showModal, setShowModal] = useState(false);
  const [targetBloqueIndex, setTargetBloqueIndex] = useState(null);
  const [loading, setLoading] = useState(false);
  const [rutinaExpandida, setRutinaExpandida] = useState(null);

  const [busquedaAlumno, setBusquedaAlumno] = useState('');
  const [busquedaHistorial, setBusquedaHistorial] = useState('');
  const [busquedaModal, setBusquedaModal] = useState('');

  useEffect(() => {
    const qAlumnos = query(collection(db, "users"), where("role", "==", "alumno"));
    const unsubAlumnos = onSnapshot(qAlumnos, (snap) => {
      const data = snap.docs.map(d => ({ 
        id: d.id, 
        nombre: d.data().nombre,
        dni: d.data().dni || 'S/D'
      }));
      setAlumnos(data);
      if (data.length > 0 && !alumnoSeleccionado) setAlumnoSeleccionado(data[0].id);
    });

    const qEj = query(collection(db, "ejercicios"), orderBy("nombre", "asc"));
    const unsubEj = onSnapshot(qEj, (snap) => {
      setBiblioteca(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => { unsubAlumnos(); unsubEj(); };
  }, []);

  useEffect(() => {
    if (!alumnoSeleccionado) return;
    const q = query(collection(db, "rutinas"), where("alumnoId", "==", alumnoSeleccionado));
    return onSnapshot(q, (snap) => {
      const lista = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setHistorialRutinas(lista.sort((a, b) => new Date(b.fecha) - new Date(a.fecha)));
    });
  }, [alumnoSeleccionado]);

  // Lógica de Bloques
  const agregarDia = () => {
    setBloques([...bloques, { nombreDia: `Día ${bloques.length + 1}`, ejercicios: [] }]);
  };

  const eliminarDia = (index) => {
    if (bloques.length === 1) return;
    setBloques(bloques.filter((_, i) => i !== index));
  };

  const abrirModalParaBloque = (index) => {
    setTargetBloqueIndex(index);
    setShowModal(true);
  };

  const agregarABloque = (ej) => {
    const nuevosBloques = [...bloques];
    nuevosBloques[targetBloqueIndex].ejercicios.push({
      ...ej,
      s: '4', r: '12', d: '60"', p: '-',
      observaciones: ej.observaciones || '',
      videoUrl: ej.videoUrl || ''
    });
    setBloques(nuevosBloques);
    setShowModal(false);
    setBusquedaModal('');
  };

  const eliminarEjercicioDeBloque = (bloqueIdx, ejIdx) => {
    const nuevosBloques = [...bloques];
    nuevosBloques[bloqueIdx].ejercicios = nuevosBloques[bloqueIdx].ejercicios.filter((_, i) => i !== ejIdx);
    setBloques(nuevosBloques);
  };

  // NUEVO: Funciones de Edición y Borrado
  const cargarParaEditar = (rutina) => {
    if (window.confirm("¿Cargar esta rutina para editar? Se reemplazará el borrador actual.")) {
      const bloquesEdit = rutina.bloques || [{ nombreDia: 'Día 1', ejercicios: rutina.ejercicios || [] }];
      // Usamos JSON parse/stringify para romper la referencia y tener un clon limpio
      setBloques(JSON.parse(JSON.stringify(bloquesEdit)));
      setAlumnoSeleccionado(rutina.alumnoId);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const eliminarRutina = async (id, e) => {
    e.stopPropagation();
    if (!esAdmin) return;
    if (window.confirm("¿Eliminar esta rutina permanentemente?")) {
      try {
        await deleteDoc(doc(db, "rutinas", id));
      } catch (e) {
        alert("Error: " + e.message);
      }
    }
  };

  const guardarNuevaRutina = async () => {
    const tieneEjercicios = bloques.some(b => b.ejercicios.length > 0);
    if (!tieneEjercicios || !alumnoSeleccionado) return;
    
    setLoading(true);
    try {
      await addDoc(collection(db, "rutinas"), {
        alumnoId: alumnoSeleccionado,
        profesorId: user.uid,
        nombreProfesor: user.nombre || 'Staff',
        fecha: new Date().toISOString(),
        bloques: bloques,
        createdAt: serverTimestamp()
      });
      setBloques([{ nombreDia: 'Día 1', ejercicios: [] }]);
      setLoading(false);
      alert("¡RUTINA PUBLICADA! 🔥");
    } catch (e) {
      setLoading(false);
      alert("Error: " + e.message);
    }
  };

  return (
    <div className="animate-in fade-in duration-500 max-w-7xl mx-auto p-4">
      <header className="mb-8 flex justify-between items-center">
        <h1 className="text-4xl font-black italic text-white uppercase tracking-tighter">
          PLANIFICACIÓN <span className="text-[#FF3131]">PRO</span>
        </h1>
        <GymButton onClick={agregarDia} className="bg-white/5 border-white/10 text-[10px]">
          <Plus size={14} className="text-[#FF3131]" /> AÑADIR DÍA
        </GymButton>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* COLUMNA 1: SELECTOR E HISTORIAL */}
        <div className="space-y-4">
          <GymCard>
            <p className="text-[10px] font-black text-gray-500 uppercase mb-4 tracking-widest">Seleccionar Alumno</p>
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" size={14} />
              <input type="text" placeholder="BUSCAR POR DNI/NOMBRE..." value={busquedaAlumno} onChange={(e) => setBusquedaAlumno(e.target.value)}
                className="w-full bg-black border border-white/10 rounded-xl p-3 pl-10 text-white uppercase font-bold text-[10px] outline-none" />
            </div>
            <select value={alumnoSeleccionado} onChange={(e) => setAlumnoSeleccionado(e.target.value)}
              className="w-full bg-black border border-white/10 rounded-xl p-3 text-white uppercase font-bold text-xs outline-none focus:border-[#FF3131]">
              {alumnos.filter(a => a.nombre.toLowerCase().includes(busquedaAlumno.toLowerCase()) || a.dni.includes(busquedaAlumno)).map(a => (
                <option key={a.id} value={a.id}>{a.nombre} - DNI: {a.dni}</option>
              ))}
            </select>
          </GymCard>

          <GymCard className="max-h-[500px] overflow-hidden flex flex-col">
            <h3 className="text-white font-black text-[10px] uppercase mb-4 flex items-center gap-2"><History size={14} className="text-[#FF3131]" /> Historial</h3>
            <div className="space-y-3 overflow-y-auto pr-2 custom-scrollbar">
              {historialRutinas.map((rut) => (
                <div key={rut.id} className="border border-white/5 bg-white/5 rounded-xl">
                  <div className="p-3 flex justify-between items-center cursor-pointer" onClick={() => setRutinaExpandida(rutinaExpandida === rut.id ? null : rut.id)}>
                    <span className="text-white font-black text-[10px]">{new Date(rut.fecha).toLocaleDateString()}</span>
                    <div className="flex gap-3">
                      {(esAdmin || esManager) && (
                        <button onClick={(e) => { e.stopPropagation(); cargarParaEditar(rut); }} className="text-gray-500 hover:text-white transition-colors">
                          <Edit3 size={12} />
                        </button>
                      )}
                      {esAdmin && (
                        <button onClick={(e) => eliminarRutina(rut.id, e)} className="text-gray-500 hover:text-[#FF3131] transition-colors">
                          <Trash2 size={12} />
                        </button>
                      )}
                      <ChevronDown size={14} className={`text-gray-500 transition-transform ${rutinaExpandida === rut.id ? 'rotate-180' : ''}`} />
                    </div>
                  </div>
                  {rutinaExpandida === rut.id && (
                    <div className="p-3 bg-black/40 border-t border-white/5 space-y-1">
                      {rut.bloques?.map((b, i) => (
                        <div key={i} className="text-[8px] text-[#FF3131] font-black uppercase">{b.nombreDia}: {b.ejercicios.length} Ejs</div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </GymCard>
        </div>

        {/* COLUMNA 2 Y 3: CONFIGURADOR DE BLOQUES */}
        <div className="lg:col-span-2 space-y-6">
          {bloques.map((bloque, bIdx) => (
            <div key={bIdx} className="bg-[#0a0a0a] border border-white/5 rounded-[35px] p-6 shadow-2xl animate-in slide-in-from-right-4 duration-300">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                  <div className="bg-[#FF3131]/10 p-2 rounded-xl text-[#FF3131]"><CalendarDays size={18} /></div>
                  <input 
                    className="bg-transparent text-white font-black italic uppercase text-lg outline-none focus:text-[#FF3131] transition-colors"
                    value={bloque.nombreDia}
                    onChange={(e) => {
                      const n = [...bloques]; n[bIdx].nombreDia = e.target.value; setBloques(n);
                    }}
                  />
                </div>
                <div className="flex gap-2">
                  <button onClick={() => abrirModalParaBloque(bIdx)} className="bg-[#FF3131] text-white p-2 px-4 rounded-xl font-black text-[9px] uppercase italic hover:scale-105 transition-transform">
                    + Ejercicio
                  </button>
                  {bloques.length > 1 && (
                    <button onClick={() => eliminarDia(bIdx)} className="text-gray-700 hover:text-red-500 transition-colors"><X size={18}/></button>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                {bloque.ejercicios.length === 0 && (
                  <div className="border-2 border-dashed border-white/5 rounded-3xl p-8 text-center">
                    <p className="text-gray-700 text-[10px] font-black uppercase tracking-widest">Sin ejercicios en este día</p>
                  </div>
                )}
                {bloque.ejercicios.map((ej, eIdx) => (
                  <div key={eIdx} className="bg-white/5 border border-white/5 p-4 rounded-3xl flex flex-col gap-4">
                    <div className="flex justify-between items-center">
                      <span className="text-white font-black italic uppercase text-xs">{ej.nombre}</span>
                      <button onClick={() => eliminarEjercicioDeBloque(bIdx, eIdx)} className="text-gray-700 hover:text-[#FF3131] transition-colors"><Trash2 size={14}/></button>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      {['s', 'r', 'd', 'p'].map(f => (
                        <div key={f} className="bg-black p-2 rounded-xl border border-white/5">
                          <p className="text-[7px] text-gray-600 font-black text-center mb-1 uppercase">{f}</p>
                          <input 
                            className="w-full bg-transparent text-white text-center font-black text-[10px] outline-none focus:text-[#FF3131]"
                            value={ej[f]}
                            onChange={(e) => {
                              const n = [...bloques]; n[bIdx].ejercicios[eIdx][f] = e.target.value; setBloques(n);
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <button 
            onClick={guardarNuevaRutina} 
            disabled={loading}
            className="w-full bg-[#FF3131] p-5 rounded-[25px] text-white font-black italic uppercase tracking-tighter hover:shadow-[0_0_30px_rgba(255,49,49,0.3)] transition-all flex justify-center items-center gap-3"
          >
            {loading ? <Loader2 className="animate-spin" /> : <>PUBLICAR RUTINA COMPLETA 🔥</>}
          </button>
        </div>
      </div>

      {/* MODAL BIBLIOTECA */}
      {showModal && (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="w-full max-w-md bg-[#0a0a0a] border border-white/10 p-6 rounded-[35px] shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-white font-black uppercase italic text-sm">Añadir a {bloques[targetBloqueIndex]?.nombreDia}</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-white"><X size={20} /></button>
            </div>
            <div className="relative mb-6">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#FF3131]" size={16} />
              <input autoFocus placeholder="BUSCAR..." className="w-full bg-black border border-white/10 rounded-2xl p-4 pl-12 text-white font-black text-xs outline-none focus:border-[#FF3131]"
                value={busquedaModal} onChange={(e) => setBusquedaModal(e.target.value)} />
            </div>
            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {biblioteca.filter(ej => ej.nombre.toLowerCase().includes(busquedaModal.toLowerCase())).map(ej => (
                <button key={ej.id} onClick={() => agregarABloque(ej)} className="w-full text-left p-4 rounded-2xl border border-white/5 hover:bg-[#FF3131] group transition-all flex justify-between items-center">
                  <span className="text-white font-black uppercase text-[10px] group-hover:text-black transition-colors">{ej.nombre}</span>
                  <Plus size={14} className="text-[#FF3131] group-hover:text-black" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #1a1a1a; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #FF3131; }
      `}</style>
    </div>
  );
}