import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc, orderBy, serverTimestamp } from 'firebase/firestore';
import { Plus, Trash2, X, History, ChevronDown, CheckCircle2, Clock, Weight, Loader2 } from 'lucide-react';

export default function RutinasPage() {
  const { user } = useAuth();
  const role = user?.role?.toLowerCase().trim();
  const esAdmin = role === 'administrador' || role === 'admin';
  const esStaff = esAdmin || role === 'manager' || role === 'profesor';
  
  const [alumnos, setAlumnos] = useState([]);
  const [alumnoSeleccionado, setAlumnoSeleccionado] = useState('');
  const [historialRutinas, setHistorialRutinas] = useState([]);
  const [ejerciciosSeleccionados, setEjerciciosSeleccionados] = useState([]);
  const [biblioteca, setBiblioteca] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rutinaExpandida, setRutinaExpandida] = useState(null);

  useEffect(() => {
    // Cargar alumnos para el selector
    const qAlumnos = query(collection(db, "users"), where("role", "==", "alumno"));
    const unsubAlumnos = onSnapshot(qAlumnos, (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, nombre: d.data().nombre }));
      setAlumnos(data);
      if (data.length > 0 && !alumnoSeleccionado) setAlumnoSeleccionado(data[0].id);
    });

    // Cargar biblioteca de ejercicios
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

  const borrarRutinaHistorial = async (id, e) => {
    e.stopPropagation();
    if (!esAdmin) return alert("Solo un administrador puede eliminar registros del historial.");
    if (window.confirm("¿BORRAR ESTA RUTINA DEL HISTORIAL? Esta acción no se puede deshacer.")) {
      try {
        await deleteDoc(doc(db, "rutinas", id));
      } catch (err) {
        alert("Error al borrar: " + err.message);
      }
    }
  };

  const guardarNuevaRutina = async () => {
    if (ejerciciosSeleccionados.length === 0) return alert("Agrega al menos un ejercicio para la nueva rutina.");
    if (!alumnoSeleccionado) return alert("Seleccioná un alumno primero.");
    
    setLoading(true);
    try {
      const dataParaGuardar = {
        alumnoId: alumnoSeleccionado,
        profesorId: user.uid,
        nombreProfesor: user.nombre || 'Staff',
        fecha: new Date().toISOString(),
        ejercicios: ejerciciosSeleccionados,
        createdAt: serverTimestamp()
      };

      await addDoc(collection(db, "rutinas"), dataParaGuardar);
      
      // IMPORTANTE: Limpiamos estados antes del alert para evitar bloqueos de UI
      setEjerciciosSeleccionados([]);
      setLoading(false);
      
      // Pequeño delay para que React procese el fin del loading antes del alert bloqueante
      setTimeout(() => {
        alert("¡RUTINA PUBLICADA EXITOSAMENTE! 🔥");
      }, 150);

    } catch (e) { 
      setLoading(false);
      alert("Error al guardar: " + e.message); 
    }
  };

  const agregarABorrador = (ej) => {
    setEjerciciosSeleccionados([
      ...ejerciciosSeleccionados, 
      { ...ej, s: '4', r: '12', d: '60"', p: '-' } 
    ]);
    setShowModal(false);
  };

  return (
    <div className="animate-in fade-in duration-500 max-w-7xl mx-auto p-4">
      <header className="mb-8">
        <h1 className="text-4xl font-black italic text-white uppercase tracking-tighter">
          PLANIFICACIÓN <span className="text-[#FF3131]">PRO</span>
        </h1>
        <p className="text-gray-500 text-[10px] font-bold uppercase tracking-[0.2em]">Gestión de entrenamientos y carga progresiva</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-4">
          <div className="bg-[#0a0a0a] border border-white/5 p-6 rounded-2xl">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Seleccionar Alumno</label>
            <select 
              value={alumnoSeleccionado} 
              onChange={(e) => setAlumnoSeleccionado(e.target.value)} 
              className="w-full bg-black border border-white/10 rounded-xl p-3 text-white mt-2 uppercase font-bold text-xs outline-none focus:border-[#FF3131] transition-colors"
            >
              {alumnos.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
            </select>
          </div>

          <div className="bg-[#0a0a0a] border border-white/5 p-6 rounded-2xl">
            <h3 className="text-white font-black text-[10px] uppercase mb-4 flex items-center gap-2">
              <History size={14} className="text-[#FF3131]"/> Historial de Rutinas
            </h3>
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
              {historialRutinas.length === 0 && <p className="text-gray-700 text-[10px] uppercase text-center py-4">Sin registros previos</p>}
              {historialRutinas.map((rut, index) => (
                <div key={rut.id} className={`border rounded-xl overflow-hidden transition-all ${
                  index === 0 ? 'border-[#31FF31]/30 bg-[#31FF31]/5' : 'border-white/5 bg-white/5'
                }`}>
                  <div 
                    className="w-full flex justify-between items-center p-3 hover:bg-white/5 transition-all cursor-pointer" 
                    onClick={() => setRutinaExpandida(rutinaExpandida === rut.id ? null : rut.id)}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-white font-black text-[10px] uppercase">
                          {new Date(rut.fecha).toLocaleDateString()}
                        </p>
                        {index === 0 && (
                          <span className="text-[8px] bg-[#31FF31] text-black px-1.5 py-0.5 rounded font-black">ACTIVA</span>
                        )}
                      </div>
                      <p className="text-gray-500 text-[8px] uppercase">{rut.nombreProfesor}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {esAdmin && (
                        <button onClick={(e) => borrarRutinaHistorial(rut.id, e)} className="p-1 hover:text-[#FF3131] text-gray-700 transition-colors">
                          <Trash2 size={12}/>
                        </button>
                      )}
                      <ChevronDown size={14} className={`text-gray-500 transition-transform ${rutinaExpandida === rut.id ? 'rotate-180' : ''}`} />
                    </div>
                  </div>
                  
                  {rutinaExpandida === rut.id && (
                    <div className="p-3 bg-black/50 space-y-2 border-t border-white/5 animate-in slide-in-from-top-2 duration-300">
                      {rut.ejercicios.map((ej, i) => (
                        <div key={i} className="flex justify-between text-[9px] uppercase font-bold text-gray-400">
                          <span>{ej.nombre}</span>
                          <span className="text-[#FF3131]">
                            {ej.s}S x {ej.r}R | {ej.p || '-'} | {ej.d || '-'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <div className="bg-[#0a0a0a] border border-[#FF3131]/20 p-6 rounded-2xl shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#FF3131]/5 blur-3xl -z-10"></div>
            
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-white font-black uppercase text-xs italic tracking-widest">Configurar Nuevo Plan</h2>
                <p className="text-gray-600 text-[8px] uppercase mt-1">Ajusta series, reps, descanso y carga</p>
              </div>
              <button 
                onClick={() => setShowModal(true)} 
                className="bg-white text-black px-4 py-2 rounded-lg font-black text-[10px] uppercase hover:bg-[#FF3131] hover:text-white transition-all flex items-center gap-2"
              >
                <Plus size={14}/> Biblioteca
              </button>
            </div>

            <div className="space-y-3 min-h-[200px]">
              {ejerciciosSeleccionados.length === 0 && (
                <div className="h-40 border border-dashed border-white/5 rounded-2xl flex flex-col items-center justify-center text-gray-700">
                  <Plus size={24} className="mb-2 opacity-20"/>
                  <p className="text-[10px] font-black uppercase italic">No hay ejercicios cargados</p>
                </div>
              )}
              
              {ejerciciosSeleccionados.map((ej, index) => (
                <div key={index} className="bg-black border border-white/10 p-4 rounded-xl flex items-center justify-between gap-4 animate-in zoom-in-95 duration-200">
                  <div className="flex-1">
                    <h4 className="text-white font-black uppercase text-sm italic">{ej.nombre}</h4>
                    <p className="text-[8px] text-[#FF3131] font-bold uppercase">{ej.grupo}</p>
                  </div>
                  
                  <div className="flex gap-2 items-end">
                    {[
                      { key: 's', label: 'SER', ph: '4' },
                      { key: 'r', label: 'REP', ph: '12' },
                      { key: 'd', label: 'DES', ph: '60"' },
                      { key: 'p', label: 'PES', ph: 'KG' }
                    ].map(campo => (
                      <div key={campo.key} className="flex flex-col items-center">
                        <span className="text-[7px] text-gray-600 uppercase font-black mb-1">{campo.label}</span>
                        <input 
                          type="text" 
                          placeholder={campo.ph}
                          value={ej[campo.key]} 
                          onChange={(e) => { 
                            const n = [...ejerciciosSeleccionados]; 
                            n[index][campo.key] = e.target.value; 
                            setEjerciciosSeleccionados(n); 
                          }} 
                          className="w-11 bg-white/5 border border-white/10 text-white text-[11px] text-center rounded-lg p-1.5 focus:border-[#FF3131] outline-none transition-colors" 
                        />
                      </div>
                    ))}
                    <button 
                      onClick={() => setEjerciciosSeleccionados(ejerciciosSeleccionados.filter((_, i) => i !== index))} 
                      className="text-gray-700 hover:text-red-500 p-1.5 mb-0.5"
                    >
                      <Trash2 size={16}/>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <button 
              onClick={guardarNuevaRutina} 
              disabled={loading || ejerciciosSeleccionados.length === 0} 
              className="w-full mt-8 bg-[#FF3131] text-white font-black py-4 rounded-xl uppercase italic text-xs shadow-[0_0_30px_rgba(255,49,49,0.2)] disabled:opacity-50 disabled:shadow-none transition-all active:scale-[0.98] flex items-center justify-center gap-3"
            >
              {loading ? (
                <><Loader2 size={16} className="animate-spin"/> PUBLICANDO...</>
              ) : (
                <><CheckCircle2 size={16}/> GUARDAR Y PUBLICAR RUTINA</>
              )}
            </button>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0a0a0a] border border-white/10 w-full max-w-md rounded-3xl p-6 shadow-2xl">
             <div className="flex justify-between items-center mb-6">
                <h3 className="text-white font-black uppercase tracking-tighter flex items-center gap-2">
                  <Plus size={18} className="text-[#FF3131]"/> Biblioteca
                </h3>
                <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-white transition-colors">
                  <X size={20} />
                </button>
             </div>
             <div className="space-y-2 max-h-[450px] overflow-y-auto pr-2 custom-scrollbar">
                {biblioteca.map(ej => (
                  <button 
                    key={ej.id} 
                    onClick={() => agregarABorrador(ej)} 
                    className="w-full group text-left p-4 rounded-2xl border border-white/5 text-white font-bold text-xs hover:bg-[#FF3131] hover:border-[#FF3131] uppercase transition-all flex justify-between items-center"
                  >
                    <div>
                      <p className="group-hover:text-white transition-colors">{ej.nombre}</p>
                      <p className="text-[8px] text-gray-500 group-hover:text-white/70 uppercase">{ej.grupo}</p>
                    </div>
                    <Plus size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
             </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #1a1a1a; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #FF3131; }
      `}</style>
    </div>
  );
}