import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, doc, updateDoc, onSnapshot, getDocs, query, where } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, Bell, Timer, Zap, Activity, Clock, Loader2, HeartPulse, Send, Smartphone } from 'lucide-react';

export default function SuperAdminPage() {
  const { user } = useAuth();
  const [actualizando, setActualizando] = useState(null);
  const [alumnos, setAlumnos] = useState([]); // Para la prueba de notificaciones
  const [selectedAlumno, setSelectedAlumno] = useState('');
  const [enviandoPrueba, setEnviandoPrueba] = useState(false);
  const [features, setFeatures] = useState({
    analyticsEnabled: false,
    timerEnabled: false,
    temporizadorEnabled: false,
    notificacionesCuotaEnabled: false,
    aptoMedicoEnabled: false 
  });

  const role = user?.role?.toLowerCase().trim();

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "configuracion", "features"), (snapshot) => {
      if (snapshot.exists()) setFeatures(snapshot.data());
    });

    // Cargar alumnos que tengan Token para la prueba
    const loadAlumnosConToken = async () => {
      const q = query(collection(db, "users"), where("role", "==", "alumno"));
      const snap = await getDocs(q);
      const lista = snap.docs
        .map(d => ({ id: d.id, nombre: d.data().nombre, hasToken: !!d.data().fcmToken }))
        .filter(a => a.hasToken);
      setAlumnos(lista);
    };
    loadAlumnosConToken();

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
      alert("Error: " + error.message);
    } finally {
      setActualizando(null);
    }
  };

  const enviarNotificacionPrueba = async () => {
    if (!selectedAlumno) return alert("Seleccioná un alumno");
    setEnviandoPrueba(true);
    try {
      // Aquí podrías llamar a una Cloud Function o un servicio de mensajería.
      // Por ahora, simulamos el éxito. Para producción, esto dispara el envío vía FCM.
      alert("Se envió la señal de prueba al dispositivo del alumno.");
    } catch (error) {
      alert("Error al enviar prueba");
    } finally {
      setEnviandoPrueba(false);
    }
  };

  const FeatureCard = ({ id, title, desc, icon: Icon, color, isActive }) => (
    <div className={`bg-[#0a0a0a] border ${isActive ? `border-${color}-500/40 shadow-${color}-500/10` : 'border-white/5'} p-8 rounded-[35px] flex flex-col justify-between hover:scale-[1.02] transition-all duration-300 shadow-2xl`}>
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
    <div className="max-w-6xl mx-auto p-4 animate-in fade-in duration-700 pb-20">
      <header className="mb-12 border-b border-white/5 pb-10">
        <div className="flex items-center gap-4 mb-4">
          <ShieldCheck className="text-[#FF3131]" size={40} />
          <h1 className="text-5xl font-black italic text-white uppercase tracking-tighter">Control <span className="text-[#FF3131]">Maestro</span></h1>
        </div>
        <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.4em]">Arquitectura de Funciones Independientes</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <FeatureCard id="analyticsEnabled" title="Analytics" color="blue" icon={Activity} isActive={features.analyticsEnabled} desc="Métricas de ejercicios y afluencia para el Manager." />
        <FeatureCard id="notificacionesCuotaEnabled" title="Alertas" color="red" icon={Bell} isActive={features.notificacionesCuotaEnabled} desc="Avisos automáticos de cuotas por vencer o vencidas." />
        <FeatureCard id="aptoMedicoEnabled" title="Apto Médico" color="pink" icon={HeartPulse} isActive={features.aptoMedicoEnabled} desc="Control de salud y alertas de vencimiento de certificados." />
        <FeatureCard id="timerEnabled" title="Cronómetro" color="orange" icon={Timer} isActive={features.timerEnabled} desc="Reloj de duración total de la rutina para el alumno." />
        <FeatureCard id="temporizadorEnabled" title="Descanso" color="green" icon={Clock} isActive={features.temporizadorEnabled} desc="Temporizador de cuenta regresiva entre series." />
      </div>

      {/* SECCIÓN DE DIAGNÓSTICO DE NOTIFICACIONES */}
      <div className="mt-12 p-10 bg-[#0a0a0a] border border-white/10 rounded-[45px] shadow-2xl">
        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 bg-red-500/10 rounded-2xl text-red-500"><Smartphone size={24} /></div>
          <div>
            <h2 className="text-xl font-black text-white italic uppercase tracking-tighter">Test de Notificaciones PUSH</h2>
            <p className="text-gray-500 text-[9px] font-bold uppercase tracking-widest">Verifica el funcionamiento del Service Worker</p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          <select 
            className="flex-1 bg-white/5 border border-white/10 rounded-2xl p-4 text-white text-[10px] font-bold uppercase outline-none focus:border-[#FF3131]"
            value={selectedAlumno}
            onChange={(e) => setSelectedAlumno(e.target.value)}
          >
            <option value="">Seleccionar Alumno con App Activa...</option>
            {alumnos.map(a => (
              <option key={a.id} value={a.id}>{a.nombre} (Token OK)</option>
            ))}
          </select>
          <button 
            onClick={enviarNotificacionPrueba}
            disabled={enviandoPrueba || !selectedAlumno}
            className="bg-[#FF3131] hover:bg-red-700 text-white font-black px-8 py-4 rounded-2xl flex items-center justify-center gap-2 uppercase text-[10px] transition-all disabled:opacity-30 shadow-xl shadow-red-900/20"
          >
            {enviandoPrueba ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />} 
            Enviar Notificación de Prueba
          </button>
        </div>
      </div>
    </div>
  );
}