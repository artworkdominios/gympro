import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc, orderBy, serverTimestamp } from 'firebase/firestore';
import { Plus, Trash2, X, History, ChevronDown, Loader2, Search, CalendarDays, Edit3, Eye, CheckCircle2, Calendar } from 'lucide-react';
import GymCard from '../components/ui/GymCard.jsx';
import GymButton from '../components/ui/GymButton.jsx';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { GripVertical } from 'lucide-react'; // Para el icono de agarre

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
  
  // NUEVO: Estado para fecha de vencimiento (Default: 30 días)
  const [fechaVencimiento, setFechaVencimiento] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  });

  const [showModal, setShowModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [rutinaPreview, setRutinaPreview] = useState(null);
  
  const [targetBloqueIndex, setTargetBloqueIndex] = useState(null);
  const [loading, setLoading] = useState(false);
  const [rutinaExpandida, setRutinaExpandida] = useState(null);

  const [busquedaAlumno, setBusquedaAlumno] = useState('');
  const [busquedaModal, setBusquedaModal] = useState('');
  useEffect(() => {
    const el = document.getElementById('main-scroll');
    if (el) el.scrollTo(0, 0);
  }, []);
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
      // ID único para que el Drag & Drop no se confunda
      instanceId: Math.random().toString(36).substr(2, 9), 
      s: '4', r: '12', d: '60"', p: '-',
      observaciones: ej.observaciones || '',
      videoUrl: ej.videoUrl || ''
    });
    setBloques(nuevosBloques);
    setShowModal(false);
    setBusquedaModal('');
  };

  const eliminarEjercicioDeBloque = (bloqueIdx, instanceId) => {
    const nuevosBloques = [...bloques];
    nuevosBloques[bloqueIdx].ejercicios = nuevosBloques[bloqueIdx].ejercicios.filter(
      (ej) => ej.instanceId !== instanceId
    );
    setBloques(nuevosBloques);
  };

  const verRutinaSinConfirmar = (rutina) => {
    setRutinaPreview(rutina);
    setShowPreviewModal(true);
  };

  const cargarParaEditar = (rutina) => {
    if (window.confirm("¿Cargar esta rutina para usar como base? Se reemplazará el borrador actual.")) {
      const bloquesVer = rutina.bloques || [{ nombreDia: 'Día 1', ejercicios: rutina.ejercicios || [] }];
      setBloques(JSON.parse(JSON.stringify(bloquesVer)));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const eliminarRutina = async (id, e) => {
    e.stopPropagation();
    if (!esAdmin && !esManager) return;
    if (window.confirm("¿Eliminar esta rutina permanentemente?")) {
      try {
        await deleteDoc(doc(db, "rutinas", id));
        // Actualiza estado local inmediatamente
  setHistorialRutinas(prev => prev.filter(r => r.id !== id));
      } catch (e) {
        alert("Error: " + e.message);
      }
    }
  };
  const onDragEnd = (result) => {
    const { source, destination } = result;
    if (!destination) return;
  
    // Obtenemos el índice del bloque desde el droppableId (ej: "bloque-0")
    const sourceBloqueIdx = parseInt(source.droppableId.split('-')[1]);
    const destBloqueIdx = parseInt(destination.droppableId.split('-')[1]);
  
    // Si se movió dentro del mismo bloque
    if (sourceBloqueIdx === destBloqueIdx) {
      const nuevosBloques = [...bloques];
      const items = Array.from(nuevosBloques[sourceBloqueIdx].ejercicios);
      const [reorderedItem] = items.splice(source.index, 1);
      items.splice(destination.index, 0, reorderedItem);
      
      nuevosBloques[sourceBloqueIdx].ejercicios = items;
      setBloques(nuevosBloques);
    }
  };
  
  const guardarNuevaRutina = async () => {
    const tieneEjercicios = bloques.some(b => b.ejercicios.length > 0);
    
    // VALIDACIONES
    if (!alumnoSeleccionado) {
      alert("Debes seleccionar un alumno primero.");
      return;
    }
    if (!tieneEjercicios) {
      alert("La rutina debe tener al menos un ejercicio.");
      return;
    }
    // VALIDACIÓN OBLIGATORIA
    if (!fechaVencimiento) {
      alert("POR FAVOR, SELECCIONÁ UNA FECHA DE VENCIMIENTO PARA LA RUTINA.");
      return;
    }
  
    setLoading(true);
    try {
      await addDoc(collection(db, "rutinas"), {
        alumnoId: alumnoSeleccionado,
        profesorId: user.uid,
        nombreProfesor: user.nombre || 'Staff QST',
        fecha: new Date().toISOString(),
        vencimiento: fechaVencimiento, // Se guarda como "YYYY-MM-DD"
        bloques: bloques,
        createdAt: serverTimestamp()
      });
      
      // Resetear estados tras éxito
      setBloques([{ nombreDia: 'Día 1', ejercicios: [] }]);
      // Opcional: resetear la fecha a los próximos 30 días
      const d = new Date();
      d.setDate(d.getDate() + 30);
      setFechaVencimiento(d.toISOString().split('T')[0]);
      
      setLoading(false);
      setShowSuccessModal(true);
      setTimeout(() => setShowSuccessModal(false), 3000);
    } catch (e) {
      setLoading(false);
      alert("Error al guardar: " + e.message);
    }
  };

  return (
    <div className="animate-in fade-in duration-500 max-w-7xl mx-auto p-4">
      <header className="mb-2 flex flex-col items-center text-center space-y-10">
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
                    <div className="flex flex-col gap-0.5">
                      <span className="text-white font-black text-[10px]">{new Date(rut.fecha).toLocaleDateString()}</span>
                      {rut.nombreProfesor && (
                        <div className="flex flex-col">
                          <span className="text-gray-500 text-[8px] font-bold uppercase tracking-widest italic">
                            Por: <span className="text-[#FF3131]">{rut.nombreProfesor}</span>
                          </span>
                          {rut.vencimiento && (
                             <span className="text-gray-400 text-[7px] font-black uppercase">
                               Vence: {new Date(rut.vencimiento).toLocaleDateString()}
                             </span>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex gap-3">
                      <button onClick={(e) => { e.stopPropagation(); verRutinaSinConfirmar(rut); }} className="text-gray-500 hover:text-[#31FF31] transition-colors">
                        <Eye size={12} />
                        </button>
                     
                      {(esAdmin || esManager) && (
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

        {/* CONFIGURADOR DE BLOQUES */}
      
<div className="lg:col-span-2 space-y-6">
  <DragDropContext onDragEnd={onDragEnd}>
    {bloques.map((bloque, bIdx) => (
      <div key={bIdx} className="bg-[#0a0a0a] border border-white/5 rounded-[35px] p-6 shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-[#FF3131]/10 p-2 rounded-xl text-[#FF3131]"><CalendarDays size={18} /></div>
            <input 
              className="bg-transparent text-white font-black italic uppercase text-lg outline-none focus:text-[#FF3131]"
              value={bloque.nombreDia}
              onChange={(e) => {
                const n = [...bloques]; n[bIdx].nombreDia = e.target.value; setBloques(n);
              }}
            />
          </div>
          <div className="flex gap-2">
            <button onClick={() => abrirModalParaBloque(bIdx)} className="bg-[#FF3131] text-white p-2 px-4 rounded-xl font-black text-[9px] uppercase italic">
              + Ejercicio
            </button>
            {bloques.length > 1 && (
              <button onClick={() => eliminarDia(bIdx)} className="text-gray-700 hover:text-red-500"><X size={18}/></button>
            )}
          </div>
        </div>

        {/* ÁREA DROPABLE PARA CADA BLOQUE */}
        <Droppable droppableId={`bloque-${bIdx}`}>
          {(provided) => (
            <div 
              {...provided.droppableProps} 
              ref={provided.innerRef} 
              className="space-y-3"
            >
              {bloque.ejercicios.map((ej, eIdx) => (
               <Draggable 
               key={ej.instanceId} 
               draggableId={ej.instanceId} 
               index={eIdx}
             >
                  {(provided, snapshot) => (
                    <div 
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      className={`bg-white/5 border p-4 rounded-3xl flex flex-col gap-4 transition-all ${
                        snapshot.isDragging ? 'border-[#FF3131] bg-[#1a1a1a] rotate-1' : 'border-white/5'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          {/* MANIJA PARA ARRASTRAR */}
                          <div {...provided.dragHandleProps} className="text-gray-700 hover:text-white cursor-grab">
                            <GripVertical size={16} />
                          </div>
                          <span className="text-white font-black italic uppercase text-xs">{ej.nombre}</span>
                        </div>
                        <button onClick={() => eliminarEjercicioDeBloque(bIdx, ej.instanceId)} className="text-gray-700 hover:text-[#FF3131]"><Trash2 size={14}/></button>
                      </div>
                      <div className="grid grid-cols-4 gap-2">
                        {['s', 'r', 'd', 'p'].map(f => (
                          <div key={f} className="bg-black p-2 rounded-xl border border-white/5">
                            <p className="text-[7px] text-gray-600 font-black text-center mb-1 uppercase">{f}</p>
                            <input 
                              className="w-full bg-transparent text-white text-center font-black text-[10px] outline-none"
                              value={ej[f]}
                              onChange={(e) => {
                                const n = [...bloques]; n[bIdx].ejercicios[eIdx][f] = e.target.value; setBloques(n);
                              }}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </div>
    ))}
  </DragDropContext>


          {/* SELECTOR DE VENCIMIENTO */}
          <div className="bg-black/40 border border-white/10 p-4 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Calendar size={18} className="text-[#FF3131]" />
              <span className="text-white font-black italic uppercase text-[10px] tracking-widest">Vence el:</span>
              <input 
                type="date" 
                value={fechaVencimiento}
                onChange={(e) => setFechaVencimiento(e.target.value)}
                className="bg-black border border-white/10 rounded-xl p-2 px-4 text-white font-bold text-[10px] outline-none focus:border-[#FF3131]"
              />
            </div>
          {/* <p className="text-gray-500 text-[8px] font-bold uppercase italic md:text-right">
              * El alumno recibirá un aviso días antes de esta fecha.
            </p>*/}
          </div>

          <button onClick={guardarNuevaRutina} disabled={loading} className="w-full bg-[#FF3131] p-5 rounded-[25px] text-white font-black italic uppercase flex justify-center items-center gap-3 shadow-[0_10px_30px_rgba(255,49,49,0.3)] hover:scale-[1.01] transition-all">
            {loading ? <Loader2 className="animate-spin" /> : <>PUBLICAR RUTINA COMPLETA 🔥</>}
          </button>
        </div>
      </div>

      {/* MODAL DE VISTA PREVIA */}
      {showPreviewModal && rutinaPreview && (
        <div className="fixed inset-0 z-[150] bg-black/95 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-[#0a0a0a] border border-white/10 rounded-[40px] flex flex-col max-h-[90vh]">
            <div className="p-8 border-b border-white/5 flex justify-between items-center bg-gradient-to-r from-[#FF3131]/10 to-transparent">
              <div>
                <h3 className="text-white font-black uppercase italic text-xl tracking-tighter">Vista Previa</h3>
                <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">
                  {new Date(rutinaPreview.fecha).toLocaleDateString()} — Por: {rutinaPreview.nombreProfesor}
                </p>
              </div>
              <button onClick={() => setShowPreviewModal(false)} className="text-gray-400 hover:text-white"><X size={24} /></button>
            </div>
            <div className="p-8 overflow-y-auto custom-scrollbar space-y-6">
              {rutinaPreview.bloques?.map((bloque, idx) => (
                <div key={idx} className="space-y-3">
                  <h4 className="text-[#FF3131] font-black italic uppercase text-xs flex items-center gap-2">
                    <div className="h-1 w-3 bg-[#FF3131]"></div> {bloque.nombreDia}
                  </h4>
                  <div className="grid grid-cols-1 gap-2">
                    {bloque.ejercicios.map((ej, eIdx) => (
                      <div key={eIdx} className="bg-white/5 border border-white/5 p-4 rounded-2xl flex justify-between items-center">
                        <div>
                          <p className="text-white font-black uppercase text-[10px]">{ej.nombre}</p>
                          <p className="text-gray-500 text-[9px] font-bold italic">S: {ej.s} | R: {ej.r} | D: {ej.d} | P: {ej.p}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="p-6 border-t border-white/5 bg-black/50">
              <button 
                onClick={() => {
                  if(window.confirm("¿Usar esta rutina como base para una nueva?")) {
                    setBloques(JSON.parse(JSON.stringify(rutinaPreview.bloques)));
                    setShowPreviewModal(false);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }
                }}
                className="w-full bg-white text-black font-black py-4 rounded-2xl uppercase italic text-[10px] hover:bg-[#FF3131] hover:text-white transition-all"
              >
                Copiar al editor para nueva rutina
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL ÉXITO */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
          <div className="relative bg-[#0a0a0a] border border-[#31FF31] p-8 rounded-[40px] text-center max-w-xs w-full">
            <CheckCircle2 size={60} className="text-[#31FF31] mx-auto mb-4" />
            <h2 className="text-white font-black italic text-xl uppercase">¡PUBLICADA!</h2>
          </div>
        </div>
      )}

      {/* MODAL BIBLIOTECA */}
      {showModal && (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#0a0a0a] border border-white/10 p-6 rounded-[35px]">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-white font-black uppercase italic text-sm">Añadir Ejercicio</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-white"><X size={20} /></button>
            </div>
            <div className="relative mb-6">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#FF3131]" size={16} />
              <input autoFocus placeholder="BUSCAR..." className="w-full bg-black border border-white/10 rounded-2xl p-4 pl-12 text-white font-black text-xs outline-none"
                value={busquedaModal} onChange={(e) => setBusquedaModal(e.target.value)} />
            </div>
            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {biblioteca.filter(ej => ej.nombre.toLowerCase().includes(busquedaModal.toLowerCase())).map(ej => (
                <button key={ej.id} onClick={() => agregarABloque(ej)} className="w-full text-left p-4 rounded-2xl border border-white/5 hover:bg-[#FF3131] group transition-all flex justify-between items-center">
                  <span className="text-white font-black uppercase text-[10px] group-hover:text-black">{ej.nombre}</span>
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