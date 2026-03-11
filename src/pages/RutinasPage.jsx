import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc, orderBy, serverTimestamp } from 'firebase/firestore';
import { Plus, Trash2, X, History, ChevronDown, CheckCircle2, Loader2, Search, Link as LinkIcon, Info } from 'lucide-react';
import GymCard from '../components/ui/GymCard.jsx';
import GymButton from '../components/ui/GymButton.jsx';

export default function RutinasPage() {
  const { user } = useAuth();
  const role = user?.role?.toLowerCase().trim();
  const esAdmin = role === 'administrador' || role === 'admin';

  const [alumnos, setAlumnos] = useState([]);
  const [alumnoSeleccionado, setAlumnoSeleccionado] = useState('');
  const [historialRutinas, setHistorialRutinas] = useState([]);
  const [ejerciciosSeleccionados, setEjerciciosSeleccionados] = useState([]);
  const [biblioteca, setBiblioteca] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rutinaExpandida, setRutinaExpandida] = useState(null);

  // Buscadores
  const [busquedaAlumno, setBusquedaAlumno] = useState('');
  const [busquedaHistorial, setBusquedaHistorial] = useState('');
  const [busquedaModal, setBusquedaModal] = useState('');

  useEffect(() => {
    // Escuchar Alumnos (Traemos el DNI también si existe)
    const qAlumnos = query(collection(db, "users"), where("role", "==", "alumno"));
    const unsubAlumnos = onSnapshot(qAlumnos, (snap) => {
      const data = snap.docs.map(d => ({ 
        id: d.id, 
        nombre: d.data().nombre,
        dni: d.data().dni || 'S/D' // Traemos DNI
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

  // Filtros
  const alumnosFiltrados = alumnos.filter(a => 
    a.nombre?.toLowerCase().includes(busquedaAlumno.toLowerCase()) ||
    a.dni?.includes(busquedaAlumno)
  );

  const historialFiltrado = historialRutinas.filter(rut => 
    rut.ejercicios?.some(ej => ej.nombre.toLowerCase().includes(busquedaHistorial.toLowerCase())) ||
    new Date(rut.fecha).toLocaleDateString().includes(busquedaHistorial)
  );

  const ejerciciosModalFiltrados = biblioteca.filter(ej => 
    ej.nombre?.toLowerCase().includes(busquedaModal.toLowerCase()) ||
    ej.grupo?.toLowerCase().includes(busquedaModal.toLowerCase())
  );

  const agregarABorrador = (ej) => {
    setEjerciciosSeleccionados([
      ...ejerciciosSeleccionados,
      { 
        ...ej, 
        s: '4', 
        r: '12', 
        d: '60"', 
        p: '-', 
        // Si el ejercicio ya tiene video u observaciones en la biblioteca, los usa. Si no, vacío.
        observaciones: ej.observaciones || '', 
        videoUrl: ej.videoUrl || '' 
      }
    ]);
    setShowModal(false);
    setBusquedaModal('');
  };

  const guardarNuevaRutina = async () => {
    if (ejerciciosSeleccionados.length === 0 || !alumnoSeleccionado) return;
    setLoading(true);
    try {
      await addDoc(collection(db, "rutinas"), {
        alumnoId: alumnoSeleccionado,
        profesorId: user.uid,
        nombreProfesor: user.nombre || 'Staff',
        fecha: new Date().toISOString(),
        ejercicios: ejerciciosSeleccionados, // Aquí ya viajan con URL y Obs
        createdAt: serverTimestamp()
      });
      setEjerciciosSeleccionados([]);
      setLoading(false);
      setTimeout(() => alert("¡RUTINA PUBLICADA! 🔥"), 150);
    } catch (e) {
      setLoading(false);
      alert("Error: " + e.message);
    }
  };

  return (
    <div className="animate-in fade-in duration-500 max-w-7xl mx-auto p-4">
      <header className="mb-8">
        <h1 className="text-4xl font-black italic text-white uppercase tracking-tighter">
          PLANIFICACIÓN <span className="text-brandRed">PRO</span>
        </h1>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* COLUMNA 1: ALUMNOS (DNI) E HISTORIAL */}
        <div className="space-y-4">
          <GymCard>
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 block">Alumno (Búsqueda por Nombre o DNI)</label>
            <div className="relative mb-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" size={14} />
              <input 
                type="text"
                placeholder="FILTRAR..."
                value={busquedaAlumno}
                onChange={(e) => setBusquedaAlumno(e.target.value)}
                className="w-full bg-black border border-white/10 rounded-xl p-2.5 pl-9 text-white uppercase font-bold text-[10px] outline-none focus:border-brandRed"
              />
            </div>
            <select
              value={alumnoSeleccionado}
              onChange={(e) => setAlumnoSeleccionado(e.target.value)}
              className="w-full bg-black border border-white/10 rounded-xl p-3 text-white uppercase font-bold text-xs outline-none focus:border-brandRed"
            >
              {alumnosFiltrados.map(a => (
                <option key={a.id} value={a.id}>{a.nombre} - DNI: {a.dni}</option>
              ))}
            </select>
          </GymCard>

          <GymCard>
            <h3 className="text-white font-black text-[10px] uppercase mb-4 flex items-center gap-2">
              <History size={14} className="text-brandRed" /> Historial de Rutinas
            </h3>
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" size={12} />
              <input 
                type="text"
                placeholder="BUSCAR EN HISTORIAL..."
                value={busquedaHistorial}
                onChange={(e) => setBusquedaHistorial(e.target.value)}
                className="w-full bg-white/5 border border-white/5 rounded-lg p-2 pl-9 text-gray-400 uppercase font-bold text-[9px] outline-none focus:border-brandRed/50"
              />
            </div>
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {historialFiltrado.map((rut) => (
                <div key={rut.id} className="border border-white/5 bg-white/5 rounded-xl overflow-hidden">
                  <div className="w-full flex justify-between items-center p-3 cursor-pointer" onClick={() => setRutinaExpandida(rutinaExpandida === rut.id ? null : rut.id)}>
                    <p className="text-white font-black text-[10px] uppercase">{new Date(rut.fecha).toLocaleDateString()}</p>
                    <ChevronDown size={14} className={`text-gray-500 transition-transform ${rutinaExpandida === rut.id ? 'rotate-180' : ''}`} />
                  </div>
                  {rutinaExpandida === rut.id && (
                    <div className="p-3 bg-black/50 space-y-2 border-t border-white/5">
                      {rut.ejercicios.map((ej, i) => (
                        <div key={i} className="text-[9px] uppercase font-bold text-gray-400 flex justify-between">
                          <span>• {ej.nombre}</span>
                          {ej.videoUrl && <LinkIcon size={10} className="text-brandRed" />}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </GymCard>
        </div>

        {/* COLUMNA 2: CONFIGURADOR */}
        <div className="lg:col-span-2">
          <GymCard className="border-brandRed/20 shadow-2xl relative">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-white font-black uppercase text-xs italic">Armado de Rutina</h2>
              <GymButton onClick={() => setShowModal(true)} className="py-2 px-4 text-[10px]">
                <Plus size={14} /> BIBLIOTECA
              </GymButton>
            </div>

            <div className="space-y-3 min-h-[300px]">
              {ejerciciosSeleccionados.map((ej, index) => (
                <div key={index} className="bg-white/5 border border-white/10 p-5 rounded-[30px] space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-white font-black uppercase text-sm italic">{ej.nombre}</h4>
                      <p className="text-[8px] text-brandRed font-bold uppercase">{ej.grupo}</p>
                    </div>
                    <button onClick={() => setEjerciciosSeleccionados(ejerciciosSeleccionados.filter((_, i) => i !== index))} className="text-gray-700 hover:text-brandRed"><Trash2 size={16} /></button>
                  </div>
                  
                  <div className="grid grid-cols-4 gap-2">
                    {['s', 'r', 'd', 'p'].map(campo => (
                      <input key={campo} type="text" value={ej[campo]} onChange={(e) => {
                        const n = [...ejerciciosSeleccionados]; n[index][campo] = e.target.value; setEjerciciosSeleccionados(n);
                      }} className="w-full bg-black border border-white/10 text-white text-[10px] text-center rounded-xl p-2 focus:border-brandRed outline-none" />
                    ))}
                  </div>

                  {/* Editores de URL y Obs (Vienen precargados pero podés cambiarlos solo para esta rutina) */}
                  <div className="space-y-2">
                    <div className="relative">
                      <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" size={12} />
                      <input 
                        type="text" 
                        placeholder="URL Video..." 
                        value={ej.videoUrl || ''} 
                        onChange={(e) => {
                          const n = [...ejerciciosSeleccionados]; n[index].videoUrl = e.target.value; setEjerciciosSeleccionados(n);
                        }}
                        className="w-full bg-black/40 border border-white/5 rounded-lg p-2 pl-9 text-[9px] text-gray-400 outline-none focus:border-brandRed/30"
                      />
                    </div>
                    <div className="relative">
                      <Info className="absolute left-3 top-3 text-gray-600" size={12} />
                      <textarea 
                        placeholder="Observaciones para el alumno..." 
                        value={ej.observaciones || ''} 
                        onChange={(e) => {
                          const n = [...ejerciciosSeleccionados]; n[index].observaciones = e.target.value; setEjerciciosSeleccionados(n);
                        }}
                        className="w-full bg-black/40 border border-white/5 rounded-lg p-2 pl-9 text-[9px] text-gray-400 outline-none focus:border-brandRed/30 min-h-[40px]"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8">
              <GymButton onClick={guardarNuevaRutina} disabled={loading || ejerciciosSeleccionados.length === 0} className="w-full bg-[#FF3131] text-white font-black italic shadow-lg shadow-brandRed/20">
                {loading ? <Loader2 className="animate-spin" size={20} /> : "PUBLICAR RUTINA 🔥"}
              </GymButton>
            </div>
          </GymCard>
        </div>
      </div>

      {/* MODAL BIBLIOTECA */}
      {showModal && (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm flex items-center justify-center p-4">
          <GymCard className="w-full max-w-md border border-white/10">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-white font-black uppercase italic text-sm">Biblioteca</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-white"><X size={20} /></button>
            </div>
            
            <div className="relative mb-6">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-brandRed" size={16} />
              <input 
                type="text"
                autoFocus
                placeholder="BUSCAR EJERCICIO..."
                value={busquedaModal}
                onChange={(e) => setBusquedaModal(e.target.value)}
                className="w-full bg-black border-2 border-brandRed/20 rounded-2xl p-4 pl-12 text-white uppercase font-black text-xs outline-none focus:border-brandRed"
              />
            </div>

            <div className="space-y-2 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
              {ejerciciosModalFiltrados.map(ej => (
                <button key={ej.id} onClick={() => agregarABorrador(ej)} className="w-full text-left p-4 rounded-2xl border border-white/5 text-white font-bold text-[10px] hover:bg-brandRed transition-all flex justify-between uppercase items-center">
                  <div>
                    <p>{ej.nombre}</p>
                    <div className="flex gap-2 mt-1">
                      {ej.videoUrl && <span className="text-[7px] bg-white/10 px-1 rounded text-green-400">VIDEO</span>}
                      {ej.observaciones && <span className="text-[7px] bg-white/10 px-1 rounded text-blue-400">TIPS</span>}
                    </div>
                  </div>
                  <Plus size={14} />
                </button>
              ))}
            </div>
          </GymCard>
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