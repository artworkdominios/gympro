import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { doc, updateDoc, onSnapshot } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, Bell, Timer, Zap, Activity, Clock, Loader2, HeartPulse } from 'lucide-react';

export default function SuperAdminPage() {
  const { user } = useAuth();
  const [actualizando, setActualizando] = useState(null);
  const [features, setFeatures] = useState({
    analyticsEnabled: false,
    timerEnabled: false,
    temporizadorEnabled: false,
    notificacionesCuotaEnabled: false,
    aptoMedicoEnabled: false // Nueva función
  });

  const role = user?.role?.toLowerCase().trim();

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "configuracion", "features"), (snapshot) => {
      if (snapshot.exists()) setFeatures(snapshot.data());
    });
    return () => unsub();
  }, []);

  if (role !== 'administrador' && role !== 'admin') {
    return <div className="h-screen flex items-center justify-center text-white font-black uppercase bg-black text-xs tracking-[10px]">Acceso Denegado</div>;
  }

  const updateFeature = async (key, value) => {
    setActualizando(key);
    try {
      await updateDoc(doc(db, "configuracion", "features"), { [key]: value });
    } catch (error) {
      alert("Error al actualizar: " + error.message);
    } finally {
      setActualizando(null);
    }
  };

  const FeatureCard = ({ id, title, desc, icon: Icon, color, isActive }) => (
    <div className={`bg-[#0a0a0a] border ${isActive ? `border-${color}-500/40` : 'border-white/5'} p-8 rounded-[35px] flex flex-col justify-between hover:scale-[1.02] transition-all duration-300 shadow-2xl`}>
      <div>
        <div className={`p-4 rounded-2xl w-fit mb-6 ${isActive ? `bg-${color}-500/10 text-${color}-500` : 'bg-white/5 text-gray-600'}`}>
          <Icon size={24} />
        </div>
        <h3 className="text-white font-black uppercase italic text-lg mb-2">{title}</h3>
        <p className="text-gray-600 text-[10px] font-bold uppercase leading-relaxed mb-8">{desc}</p>
      </div>
      <button 
        onClick={() => updateFeature(id, !isActive)}
        disabled={actualizando === id}
        className={`w-full py-4 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${
          isActive ? `bg-${color}-600 text-white shadow-lg` : 'bg-white/5 text-gray-500'
        }`}
      >
        {actualizando === id ? <Loader2 size={14} className="animate-spin" /> : isActive ? 'Desactivar' : 'Activar'}
      </button>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto p-4 animate-in fade-in duration-700">
      <header className="mb-12 border-b border-white/5 pb-10">
        <div className="flex items-center gap-4 mb-4">
          <ShieldCheck className="text-[#FF3131]" size={40} />
          <h1 className="text-5xl font-black italic text-white uppercase tracking-tighter">Control <span className="text-[#FF3131]">Maestro</span></h1>
        </div>
        <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.4em]">Arquitectura de Funciones Independientes</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <FeatureCard 
          id="analyticsEnabled" title="Analytics" color="blue" icon={Activity} isActive={features.analyticsEnabled}
          desc="Métricas de ejercicios y afluencia para el Manager." 
        />
        <FeatureCard 
          id="notificacionesCuotaEnabled" title="Alertas" color="red" icon={Bell} isActive={features.notificacionesCuotaEnabled}
          desc="Avisos automáticos de cuotas por vencer o vencidas." 
        />
        <FeatureCard 
          id="aptoMedicoEnabled" title="Apto Médico" color="pink" icon={HeartPulse} isActive={features.aptoMedicoEnabled}
          desc="Control de salud y alertas de vencimiento de certificados." 
        />
        <FeatureCard 
          id="timerEnabled" title="Cronómetro" color="orange" icon={Timer} isActive={features.timerEnabled}
          desc="Reloj de duración total de la rutina para el alumno." 
        />
        <FeatureCard 
          id="temporizadorEnabled" title="Descanso" color="green" icon={Clock} isActive={features.temporizadorEnabled}
          desc="Temporizador de cuenta regresiva entre series." 
        />
      </div>

      <div className="mt-12 p-8 bg-white/[0.02] border border-white/5 rounded-[40px] flex flex-col md:flex-row items-center gap-6">
        <div className="bg-[#FF3131] p-4 rounded-full shadow-2xl shadow-[#FF3131]/20"><Zap className="text-white" size={24} /></div>
        <div>
          <p className="text-white font-black uppercase italic text-xs mb-1">Modo de Control Individual</p>
          <p className="text-gray-500 text-[9px] font-bold uppercase tracking-widest leading-relaxed">Cada switch modifica el acceso en tiempo real. Podés habilitar funciones específicas por cliente o gimnasio.</p>
        </div>
      </div>
    </div>
  );
}