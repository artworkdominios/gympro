import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { Dumbbell, Loader2, Flame, Timer, AlertTriangle, RotateCcw, HeartPulse } from 'lucide-react';
import ExerciseItem from '../components/ui/ExerciseItem.jsx';
import GymButton from '../components/ui/GymButton.jsx';
import GymCard from '../components/ui/GymCard.jsx';
import SuccessModal from '../components/ui/SuccessModal.jsx';

export default function MiRutinaPage() {
  const { user, features } = useAuth();
  
  const [rutina, setRutina] = useState(null);
  const [loading, setLoading] = useState(true);
  const [completados, setCompletados] = useState([]);
  const [guardando, setGuardando] = useState(false);
  const [ejercicioAbierto, setEjercicioAbierto] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const [bloqueActivoIdx, setBloqueActivoIdx] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);

  // Cálculo de días para vencimiento de Apto Médico
  const getDiasApto = () => {
    if (!user?.fecha_apto) return null;
    const hoy = new Date();
    const venc = new Date(user.fecha_apto);
    const diff = venc - hoy;
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const diasApto = getDiasApto();

  useEffect(() => {
    let interval = null;
    if (isActive && features.timerEnabled) {
      interval = setInterval(() => {
        setSeconds((s) => s + 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isActive, features.timerEnabled]);

  const formatTime = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const resetTimer = () => {
    setIsActive(false);
    setSeconds(0);
  };

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
    });
    return () => unsub();
  }, [user]);

  const toggleEjercicio = (nombre) => {
    setCompletados(prev => 
      prev.includes(nombre) ? prev.filter(item => item !== nombre) : [...prev, nombre]
    );
  };

  const handleExpand = (nombre) => {
    setEjercicioAbierto(ejercicioAbierto === nombre ? null : nombre);
  };

  const finalizarEntrenamiento = async () => {
    if (completados.length === 0) return;
    setGuardando(true);
    const ejerciciosDelDia = rutina.bloques[bloqueActivoIdx].ejercicios;
    
    try {
      await addDoc(collection(db, "asistencia_entrenamientos"), {
        alumnoId: user.uid,
        alumnoNombre: user.nombre || 'Alumno',
        fecha: serverTimestamp(),
        diaNombre: rutina.bloques[bloqueActivoIdx].nombreDia,
        ejerciciosRealizados: completados,
        totalEjercicios: ejerciciosDelDia.length,
        rutinaId: rutina.id,
        tiempoTotal: seconds
      });

      if (window.navigator.vibrate) {
        window.navigator.vibrate([100, 50, 100]); 
      }

      setCompletados([]); 
      setIsActive(false);
      setSeconds(0);
      setGuardando(false);
      setTimeout(() => setShowSuccessModal(true), 100);
    }
    catch (e) {
      setGuardando(false);
      alert("Error al guardar: " + e.message);
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

  const bloqueActual = rutina?.bloques ? rutina.bloques[bloqueActivoIdx] : null;

  return (
    <div className="relative max-w-md mx-auto p-4 pb-24 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* CONTENEDOR DE ALERTAS DINÁMICAS */}
      <div className="space-y-3 mb-6">
        {/* Alerta de Cuota */}
        {features.notificacionesCuotaEnabled && user?.diasParaVencer !== null && user.diasParaVencer <= 5 && (
          <div className="bg-[#FF3131]/10 border border-[#FF3131]/50 p-4 rounded-2xl flex items-center gap-4 animate-in slide-in-from-top duration-500">
            <AlertTriangle className="text-[#FF3131]" size={20} />
            <div>
              <p className="text-white font-black text-[9px] uppercase">Cuota de Gimnasio</p>
              <p className="text-[#FF3131] font-bold text-[8px] uppercase italic">
                {user.diasParaVencer <= 0 ? "TU MEMBRESÍA HA VENCIDO" : `VENCE EN ${user.diasParaVencer} DÍAS`}
              </p>
            </div>
          </div>
        )}

        {/* Alerta de Apto Médico */}
        {features.aptoMedicoEnabled && diasApto !== null && diasApto <= 30 && (
          <div className="bg-blue-500/10 border border-blue-500/50 p-4 rounded-2xl flex items-center gap-4 animate-in slide-in-from-top duration-500">
            <HeartPulse className="text-blue-500" size={25} />
            <div>
              <p className="text-white font-black text-[9px] uppercase">Apto Médico</p>
              <p className="text-blue-500 font-bold text-[10px] uppercase italic">
                {diasApto <= 0 ? "CERTIFICADO VENCIDO" : `VENCE EN ${diasApto} DÍAS`}
              </p>
            </div>
          </div>
        )}
      </div>

      <header className="mb-6 text-center">
        <div className="flex justify-center mb-2">
          <Flame className="text-[#FF3131] drop-shadow-[0_0_10px_rgba(255,49,49,0.5)]" size={40} />
        </div>
        <h1 className="text-5xl font-black italic text-white uppercase tracking-tighter">
          MI <span className="text-[#FF3131]">PLAN</span>
        </h1>
        
        {features.timerEnabled && (
          <div className="mt-4 flex flex-col items-center animate-in zoom-in duration-300">
             <div className="bg-white/5 border border-white/10 px-4 py-2 rounded-full flex items-center gap-3 shadow-xl">
                <Timer size={16} className={isActive ? "text-[#FF3131] animate-pulse" : "text-gray-600"} />
                <span className="text-xl font-mono font-black text-white">{formatTime(seconds)}</span>
                
                <div className="flex gap-1 ml-2">
                  <button 
                    onClick={() => setIsActive(!isActive)}
                    className={`text-[9px] font-black uppercase px-3 py-1.5 rounded-lg transition-all ${isActive ? "bg-white/10 text-white" : "bg-[#FF3131] text-white"}`}
                  >
                    {isActive ? "Pausar" : "Iniciar"}
                  </button>
                  <button onClick={resetTimer} className="bg-white/5 text-gray-400 p-1.5 rounded-lg border border-white/10">
                    <RotateCcw size={14} />
                  </button>
                </div>
             </div>
          </div>
        )}
      </header>

      {!rutina ? (
        <GymCard className="border border-dashed border-white/5 p-16 rounded-[40px] text-center">
          <Dumbbell className="mx-auto text-gray-900 mb-6" size={60} />
          <p className="text-gray-500 font-black uppercase text-[10px] tracking-[0.15em] leading-relaxed">
            Sin rutina asignada.
          </p>
        </GymCard>
      ) : (
        <div className="space-y-6">
          {rutina.bloques && (
            <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
              {rutina.bloques.map((bloque, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setBloqueActivoIdx(idx);
                    setCompletados([]); 
                    setEjercicioAbierto(null);
                  }}
                  className={`flex-none px-5 py-2.5 rounded-2xl font-black text-[10px] uppercase italic transition-all border ${
                    bloqueActivoIdx === idx 
                      ? "bg-[#FF3131] border-[#FF3131] text-white shadow-[0_0_15px_rgba(255,49,49,0.3)]" 
                      : "bg-white/5 border-white/10 text-gray-500"
                  }`}
                >
                  {bloque.nombreDia}
                </button>
              ))}
            </div>
          )}

          <div className="space-y-4">
            {bloqueActual?.ejercicios?.map((ej, idx) => (
              <ExerciseItem
                key={`${bloqueActivoIdx}-${idx}`}
                ejercicio={ej}
                isDone={completados.includes(ej.nombre)}
                isOpen={ejercicioAbierto === ej.nombre}
                onToggle={() => toggleEjercicio(ej.nombre)}
                onExpand={() => handleExpand(ej.nombre)}
                showRestTimer={features.temporizadorEnabled}
              />
            ))}
          </div>

          <div className="pt-4">
            <GymButton
              onClick={finalizarEntrenamiento}
              disabled={guardando || completados.length === 0}
              className="bg-[#FF3131] text-white py-6 rounded-[30px] shadow-lg shadow-[#FF3131]/20"
            >
              {guardando ? <Loader2 className="animate-spin" /> : <>FINALIZAR ENTRENAMIENTO <Flame size={18} /></>}
            </GymButton>
          </div>
        </div>
      )}

      <SuccessModal open={showSuccessModal} onClose={() => setShowSuccessModal(false)} />
    </div>
  );
}