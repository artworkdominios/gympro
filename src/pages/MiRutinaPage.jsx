import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { Dumbbell, Loader2, Flame } from 'lucide-react';
import ExerciseItem from '../components/ui/ExerciseItem.jsx';
import GymButton from '../components/ui/GymButton.jsx';
import GymCard from '../components/ui/GymCard.jsx';
import SuccessModal from '../components/ui/SuccessModal.jsx';

export default function MiRutinaPage() {
  const { user } = useAuth();
  const [rutina, setRutina] = useState(null);
  const [loading, setLoading] = useState(true);
  const [completados, setCompletados] = useState([]);
  const [guardando, setGuardando] = useState(false);
  const [ejercicioAbierto, setEjercicioAbierto] = useState(null); // Nuevo estado para el acordeón
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

  const handleExpand = (nombre) => {
    setEjercicioAbierto(ejercicioAbierto === nombre ? null : nombre);
  };

  const finalizarEntrenamiento = async () => {
    if (completados.length === 0) return;
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
      setCompletados([]); 
      setGuardando(false);
      setTimeout(() => setShowSuccessModal(true), 100);
    } catch (e) {
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

  return (
    <div className="relative max-w-md mx-auto p-4 pb-24 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="mb-8 text-center">
        <div className="flex justify-center mb-2">
          <Flame className="text-brandRed drop-shadow-[0_0_10px_rgba(255,49,49,0.5)]" size={40} />
        </div>
        <h1 className="text-5xl font-black italic text-white uppercase tracking-tighter">
          MI <span className="text-[#FF3131]">PLAN</span>
        </h1>
        
        {rutina && (
          <div className="flex flex-col items-center gap-1 mt-2">
            <span className="bg-[#31FF31]/20 text-[#31FF31] text-[10px] px-4 py-1.5 rounded-full font-black border border-[#31FF31]/40 shadow-[0_0_15px_rgba(49,255,49,0.2)]">
              RUTINA ACTIVA
            </span>
            <p className="text-gray-600 text-[8px] font-black uppercase tracking-[0.2em] mt-1">
              Sincronizado: {new Date(rutina.fecha).toLocaleDateString()}
            </p>
          </div>
        )}
      </header>

      {!rutina ? (
        <GymCard className="border border-dashed border-white/5 p-16 rounded-[40px] text-center">
          <Dumbbell className="mx-auto text-gray-900 mb-6" size={60} />
          <p className="text-gray-500 font-black uppercase text-[10px] tracking-[0.15em] leading-relaxed">
            Tu instructor aún no ha <br/> asignado tu rutina semanal.
          </p>
        </GymCard>
      ) : (
        <div className="space-y-5">
          {rutina.ejercicios.map((ej, idx) => (
            <ExerciseItem
              key={idx}
              ejercicio={ej}
              isDone={completados.includes(ej.nombre)}
              isOpen={ejercicioAbierto === ej.nombre}
              onToggle={() => toggleEjercicio(ej.nombre)}
              onExpand={() => handleExpand(ej.nombre)}
            />
          ))}

          <div className="pt-4">
            <GymButton
              onClick={finalizarEntrenamiento}
              disabled={guardando || completados.length === 0}
              // Forzamos el color rojo sólido y sombra
              className="bg-[#FF3131] hover:bg-[#FF3131]/90 text-white shadow-[0_0_20px_rgba(255,49,49,0.3)] border-none"
            >
              {guardando ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>FINALIZAR ENTRENAMIENTO <Flame size={18} /></>
              )}
            </GymButton>
            <div className="h-24 md:h-0"></div>
          </div>
        </div>
      )}

      <SuccessModal
        open={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
      />
    </div>
  );
}