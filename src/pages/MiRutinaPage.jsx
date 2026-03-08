import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { CheckCircle2, Circle, Dumbbell, Loader2, Flame, Timer, Weight, PartyPopper, X } from 'lucide-react';

export default function MiRutinaPage() {
  const { user } = useAuth();
  const [rutina, setRutina] = useState(null);
  const [loading, setLoading] = useState(true);
  const [completados, setCompletados] = useState([]);
  const [guardando, setGuardando] = useState(false);
  
  // NUEVO ESTADO: Controla la visibilidad del cartel de éxito
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  useEffect(() => {
    if (!user?.uid) return;

    const q = query(collection(db, "rutinas"), where("alumnoId", "==", user.uid));
    
    const unsub = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        const masReciente = docs.sort((a, b) => new Date(b.fecha) - new Date(a.fecha))[0];
        setRutina(masReciente);
      } else {
        setRutina(null);
      }
      setLoading(false);
    }, (error) => {
      console.error("Error en Firebase:", error);
      setLoading(false);
    });

    return () => unsub();
  }, [user]);

  const toggleEjercicio = (nombre) => {
    setCompletados(prev => 
      prev.includes(nombre) 
        ? prev.filter(item => item !== nombre) 
        : [...prev, nombre]
    );
  };

  const finalizarEntrenamiento = async () => {
    if (completados.length === 0) return; // Podrías poner un modal de advertencia aquí también

    setGuardando(true);
    try {
      await addDoc(collection(db, "asistencia_entrenamientos"), {
        alumnoId: user.uid,
        alumnoNombre: user.nombre || 'Alumno',
        fecha: serverTimestamp(),
        ejerciciosRealizados: completados,
        totalEjercicios: rutina.ejercicios.length,
        rutinaId: rutina.id
      });
      
      // Limpiamos los checks
      setCompletados([]); 
      setGuardando(false);

      // CORRECCIÓN: Mostramos el nuevo Modal en lugar del Alert nativo
      setTimeout(() => {
        setShowSuccessModal(true);
      }, 100);

    } catch (e) {
      setGuardando(false);
      alert("Error al guardar: " + e.message); // Este alert podrías cambiarlo luego por un modal de error
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-black gap-4">
        <Loader2 className="animate-spin text-[#FF3131]" size={40} />
        <p className="text-white font-black text-[10px] uppercase tracking-widest animate-pulse">Cargando Plan...</p>
      </div>
    );
  }

  return (
    <div className="relative max-w-md mx-auto p-4 pb-24 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="mb-8 text-center">
        <div className="flex justify-center mb-2">
          <Flame className="text-[#FF3131] drop-shadow-[0_0_10px_rgba(255,49,49,0.5)]" size={40} />
        </div>
        <h1 className="text-5xl font-black italic text-white uppercase tracking-tighter">
          MI <span className="text-[#FF3131]">PLAN</span>
        </h1>
        {rutina && (
          <div className="flex flex-col items-center gap-1 mt-2">
            <span className="bg-[#31FF31]/10 text-[#31FF31] text-[9px] px-3 py-1 rounded-full font-black border border-[#31FF31]/20">
              RUTINA ACTIVA
            </span>
            <p className="text-gray-600 text-[8px] font-black uppercase tracking-[0.2em]">
              Sincronizado: {new Date(rutina.fecha).toLocaleDateString()}
            </p>
          </div>
        )}
      </header>

      {!rutina ? (
        <div className="bg-[#0a0a0a] border border-dashed border-white/5 p-16 rounded-[40px] text-center">
          <Dumbbell className="mx-auto text-gray-900 mb-6" size={60} />
          <p className="text-gray-500 font-black uppercase text-[10px] tracking-[0.15em] leading-relaxed">
            Tu instructor aún no ha <br/> asignado tu rutina semanal.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {rutina.ejercicios.map((ej, idx) => {
            const isDone = completados.includes(ej.nombre);
            return (
              <div 
                key={idx} 
                onClick={() => toggleEjercicio(ej.nombre)}
                className={`group transition-all duration-300 cursor-pointer p-6 rounded-[35px] border-2 ${
                  isDone 
                  ? 'bg-[#FF3131]/5 border-[#FF3131]/40 shadow-[inset_0_0_20px_rgba(255,49,49,0.1)]' 
                  : 'bg-[#0a0a0a] border-white/5 hover:border-white/10'
                }`}
              >
                <div className="flex justify-between items-start mb-5">
                  <div>
                    <h3 className={`text-xl font-black italic uppercase transition-all ${
                      isDone ? 'text-gray-600 line-through opacity-50' : 'text-white'
                    }`}>
                      {ej.nombre}
                    </h3>
                    <p className="text-[#FF3131] text-[9px] font-black uppercase tracking-widest opacity-80">{ej.grupo}</p>
                  </div>
                  <div className={`p-1 rounded-full transition-colors ${isDone ? 'bg-[#FF3131]' : 'bg-white/5'}`}>
                    {isDone ? <CheckCircle2 className="text-black" size={20} /> : <Circle className="text-gray-800" size={20} />}
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  <div className="bg-white/5 p-2.5 rounded-2xl text-center border border-white/5">
                    <p className="text-gray-600 text-[7px] font-black uppercase mb-1">Series</p>
                    <p className="text-white font-black text-xs">{ej.s}</p>
                  </div>
                  <div className="bg-white/5 p-2.5 rounded-2xl text-center border border-white/5">
                    <p className="text-gray-600 text-[7px] font-black uppercase mb-1">Reps</p>
                    <p className="text-white font-black text-xs">{ej.r}</p>
                  </div>
                  <div className="bg-white/5 p-2.5 rounded-2xl text-center border border-white/5 flex flex-col items-center justify-center">
                    <Timer size={10} className="text-[#FF3131] mb-1 opacity-50"/>
                    <p className="text-white font-black text-[10px]">{ej.d || '-'}</p>
                  </div>
                  <div className="bg-[#FF3131]/10 p-2.5 rounded-2xl text-center border border-[#FF3131]/10 flex flex-col items-center justify-center">
                    <Weight size={10} className="text-[#FF3131] mb-1"/>
                    <p className="text-white font-black text-[10px]">{ej.p || '-'}</p>
                  </div>
                </div>
              </div>
            );
          })}

          <div className="pt-4">
            <button 
              onClick={finalizarEntrenamiento}
              disabled={guardando || completados.length === 0}
              className="w-full bg-[#FF3131] text-white font-black py-5 rounded-[25px] uppercase italic shadow-[0_10px_40px_rgba(255,49,49,0.4)] hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:shadow-none"
            >
              {guardando ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>FINALIZAR ENTRENAMIENTO <Flame size={18} /></>
              )}
            </button>
            <div className="h-24 md:h-0"></div>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------------- */}
      {/* NUEVO: CARTEL DE ÉXITO (MODAL) - DISEÑO MINIMALISTA NEÓN */}
      {/* ----------------------------------------------------------- */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
          {/* Backdrop (Fondo desenfocado) */}
          <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" onClick={() => setShowSuccessModal(false)}></div>
          
          {/* Contenido del Cartel */}
          <div className="relative bg-[#0a0a0a] border-2 border-[#FF3131]/40 rounded-[40px] p-10 w-full max-w-sm text-center shadow-[0_0_60px_rgba(255,49,49,0.2)] animate-in zoom-in-95 duration-300">
            {/* Botón Cerrar (X) */}
            <button 
                onClick={() => setShowSuccessModal(false)}
                className="absolute top-5 right-5 text-gray-700 hover:text-white transition-colors"
            >
                <X size={20} />
            </button>

            {/* Icono Principal */}
            <div className="flex justify-center mb-6">
              <div className="bg-[#FF3131]/10 p-4 rounded-full border border-[#FF3131]/30">
                <PartyPopper className="text-[#FF3131] drop-shadow-[0_0_8px_rgba(255,49,49,0.5)]" size={32} />
              </div>
            </div>

            {/* Texto Principal */}
            <h2 className="text-3xl font-black italic text-white uppercase tracking-tighter leading-tight mb-2">
              Entrenamiento<br/>finalizado!
            </h2>
            
            {/* Texto Secundario */}
            <p className="text-gray-400 font-bold uppercase text-[10px] tracking-[0.2em]">
              ¡Gran trabajo! <br/> Continua mañana!
            </p>

            {/* Botón de cierre */}
            <button 
                onClick={() => setShowSuccessModal(false)}
                className="mt-10 w-full bg-white text-black font-black py-4 rounded-[20px] uppercase italic text-xs tracking-widest active:scale-95 transition-all"
            >
                Entendido
            </button>
          </div>
        </div>
      )}
    </div>
  );
}