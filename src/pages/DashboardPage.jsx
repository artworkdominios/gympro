import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom'; 
import { db } from '../lib/firebase';
import { collection, query, where, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { Users, Shield, Dumbbell, Flame, CalendarCheck } from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuth();
  const [profesCount, setProfesCount] = useState(0);
  const [racha, setRacha] = useState(0);
  
  const role = user?.role?.toLowerCase().trim() || '';

  // 1. Contador de profesores (Manager/Admin)
  useEffect(() => {
    if (role === 'manager' || role === 'admin' || role === 'administrador') {
      const q = query(collection(db, "users"), where("role", "in", ["profesor", "profesor ", "PROFESOR"]));
      return onSnapshot(q, (snap) => setProfesCount(snap.size));
    }
  }, [role]);

  // 2. Lógica de Racha (Solo Alumno)
  useEffect(() => {
    if (role === 'alumno' && user?.uid) {
      const q = query(
        collection(db, "asistencia_entrenamientos"),
        where("alumnoId", "==", user.uid),
        orderBy("fecha", "desc"),
        limit(10)
      );

      return onSnapshot(q, (snap) => {
        if (snap.empty) {
          setRacha(0);
          return;
        }
        // Lógica simple: cuenta entrenamientos diferentes en los últimos 7 días
        const diasUnicos = new Set();
        snap.docs.forEach(doc => {
          const fecha = doc.data().fecha?.toDate();
          if (fecha) diasUnicos.add(fecha.toDateString());
        });
        setRacha(diasUnicos.size);
      });
    }
  }, [role, user]);

  const renderContent = () => {
    if (role === 'manager') {
      return (
        <div className="animate-in fade-in duration-700">
          <div className="p-10 bg-[#0a0a0a] border border-white/5 rounded-[40px] shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-10 opacity-5">
              <Shield size={120} className="text-white" />
            </div>
            <header className="relative z-10">
              <h1 className="text-5xl font-black italic text-white uppercase tracking-tighter leading-none mb-4">
                HOLA, <span className="text-[#FF3131]">{user?.nombre?.split(' ')[0] || 'MANAGER'}</span>
              </h1>
              <p className="text-gray-500 text-[10px] font-black uppercase tracking-[5px] mb-8 italic">Gestión de Staff y Rendimiento</p>
              <div className="inline-flex items-center gap-6 bg-white/5 border border-white/10 p-6 rounded-3xl group hover:border-[#FF3131]/30 transition-all">
                <div className="bg-[#FF3131] p-4 rounded-2xl shadow-[0_0_20px_rgba(255,49,49,0.3)] group-hover:scale-110 transition-transform">
                  <Users size={24} className="text-white" />
                </div>
                <div>
                  <p className="text-white text-3xl font-black italic">{profesCount}</p>
                  <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest">Profesores en el equipo</p>
                </div>
              </div>
            </header>
          </div>
        </div>
      );
    }

    if (role === 'administrador' || role === 'admin') {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-8 bg-[#0a0a0a] border border-[#FF3131]/40 rounded-3xl shadow-[0_0_20px_rgba(255,49,49,0.1)]">
            <h2 className="text-[#FF3131] font-black uppercase text-[10px] mb-2 tracking-widest italic">Admin Power</h2>
            <p className="text-4xl font-black text-white mb-2 italic uppercase">SISTEMA ONLINE</p>
            <p className="text-gray-500 text-[10px] uppercase font-bold tracking-widest">Acceso total a base de datos y rutinas</p>
          </div>
          <div className="p-8 bg-[#0a0a0a] border border-white/5 rounded-3xl flex items-center gap-6">
             <div className="text-[#FF3131]"><Users size={32}/></div>
             <div>
                <p className="text-white text-2xl font-black italic">{profesCount}</p>
                <p className="text-gray-500 text-[10px] uppercase font-bold tracking-widest">Profesores registrados</p>
             </div>
          </div>
        </div>
      );
    }

    if (role === 'profesor') {
      return (
        <div className="p-10 bg-[#0a0a0a] border border-white/5 rounded-[40px]">
          <h2 className="text-[#FF3131] font-black uppercase text-sm mb-4 italic tracking-widest">Panel del Instructor</h2>
          <p className="text-white text-2xl font-bold italic mb-6 uppercase">¿A quién vamos a entrenar hoy?</p>
          <Link to="/alumnos" className="inline-block bg-white text-black font-black px-8 py-3 rounded-xl uppercase text-[10px] hover:bg-[#FF3131] hover:text-white transition-all">
            Ver Lista de Alumnos
          </Link>
        </div>
      );
    }

    if (role === 'alumno') {
      return (
        <div className="space-y-6">
          <div className="p-8 bg-[#111] border-l-8 border-[#FF3131] rounded-r-2xl shadow-2xl animate-in fade-in zoom-in duration-500">
            <h1 className="text-3xl font-black text-white uppercase italic mb-2 tracking-tighter">
              Mi <span className="text-[#FF3131]">Entrenamiento</span>
            </h1>
            <p className="text-gray-500 text-[10px] font-bold uppercase mb-6 tracking-[3px]">
              Consulta tu plan y marca tus progresos
            </p>
            <Link 
              to="/mi-rutina" 
              className="inline-block bg-[#FF3131] text-white font-black px-10 py-4 rounded-full uppercase italic hover:scale-105 hover:bg-white hover:text-black transition-all shadow-[0_10px_20px_rgba(255,49,49,0.2)] text-xs"
            >
              Ver Rutina Actual
            </Link>
          </div>

          {/* TARJETA DE MOTIVACIÓN / RACHA */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[#0a0a0a] border border-white/5 p-6 rounded-3xl flex flex-col items-center text-center">
              <Flame size={32} className={racha > 0 ? "text-orange-500 animate-pulse" : "text-gray-800"} />
              <p className="text-white text-2xl font-black italic mt-2">{racha}</p>
              <p className="text-gray-500 text-[8px] font-black uppercase tracking-widest">Días Entrenados</p>
            </div>
            <div className="bg-[#0a0a0a] border border-white/5 p-6 rounded-3xl flex flex-col items-center text-center">
              <CalendarCheck size={32} className="text-[#FF3131]" />
              <p className="text-white text-[10px] font-black uppercase mt-3">Rendimiento</p>
              <p className="text-gray-500 text-[8px] font-black uppercase tracking-widest">{racha >= 3 ? '¡VAS EXCELENTE!' : '¡SEGUI ASI'}</p>
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="mb-12">
        <div className="flex items-center gap-4 mb-2">
          <div className="h-[2px] w-12 bg-[#FF3131]"></div>
          <span className="text-[#FF3131] font-black uppercase tracking-[5px] text-[10px]">QSTGYM-PRO</span>
        </div>
        <h1 className="text-5xl font-black text-white italic tracking-tighter uppercase">
          {role} <span className="text-gray-800">Panel</span>
        </h1>
      </header>
      {renderContent()}
    </div>
  );
}