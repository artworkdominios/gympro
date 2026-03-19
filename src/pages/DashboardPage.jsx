import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { db } from '../lib/firebase';
import { collection, query, where, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { Users, Shield, Flame, CalendarCheck, CreditCard, AlertTriangle, Activity, X, Search, ChevronRight, BarChart3, HeartPulse } from 'lucide-react';

export default function DashboardPage() {
  const { user, features, isVencido, isAptoVencido } = useAuth();
  const [profesCount, setProfesCount] = useState(0);
  const [alumnosTotales, setAlumnosTotales] = useState(0);
  const [alumnosPendientes, setAlumnosPendientes] = useState([]);
  const [racha, setRacha] = useState(0);

  const [showModal, setShowModal] = useState(false);
  const [busquedaModal, setBusquedaModal] = useState('');

  const role = user?.role?.toLowerCase().trim() || '';

  // 1. Lógica para Admin / Manager
  useEffect(() => {
    if (['manager', 'admin', 'administrador'].includes(role)) {
      const qProfes = query(collection(db, "users"), where("role", "in", ["profesor", "profesor ", "PROFESOR"]));
      const unsubProfes = onSnapshot(qProfes, (snap) => setProfesCount(snap.size));

      const qAlumnos = query(collection(db, "users"), where("role", "==", "alumno"));
      const unsubAlumnos = onSnapshot(qAlumnos, (snap) => {
        const todos = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setAlumnosTotales(todos.length);

        const hoy = new Date();
        const pendientes = todos.filter(alumno => {
          if (!alumno.fecha_vencimiento) return true;
          return new Date(alumno.fecha_vencimiento) <= hoy;
        });
        setAlumnosPendientes(pendientes);
      });

      return () => { unsubProfes(); unsubAlumnos(); };
    }
  }, [role]);

  // 2. Lógica para Alumno
  useEffect(() => {
    if (role === 'alumno' && user?.uid) {
      const q = query(
        collection(db, "asistencia_entrenamientos"),
        where("alumnoId", "==", user.uid),
        orderBy("fecha", "desc"),
        limit(10)
      );

      const unsubRacha = onSnapshot(q, (snap) => {
        const diasUnicos = new Set();
        snap.docs.forEach(doc => {
          const fecha = doc.data().fecha?.toDate();
          if (fecha) diasUnicos.add(fecha.toDateString());
        });
        setRacha(diasUnicos.size);
      });

      return () => unsubRacha();
    }
  }, [role, user?.uid]);

  const alumnosFiltradosModal = alumnosPendientes.filter(a =>
    a.nombre?.toLowerCase().includes(busquedaModal.toLowerCase()) || a.dni?.includes(busquedaModal)
  );

  const renderContent = () => {
    if (['manager', 'admin', 'administrador'].includes(role)) {
      return (
        <div className="animate-in fade-in duration-700 space-y-6">
          <div className="p-10 bg-[#0a0a0a] border border-white/5 rounded-[40px] shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-10 opacity-5">
              <Shield size={120} className="text-white" />
            </div>

            <header className="relative z-10">
              <h1 className="text-5xl font-black italic text-white uppercase tracking-tighter mb-4">
                HOLA, <span className="text-[#FF3131]">{user?.nombre?.split(' ')[0]}</span>
              </h1>
              <p className="text-gray-500 text-[10px] font-black uppercase tracking-[5px] mb-12 italic">Panel Operativo</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-white/5 border border-white/10 p-6 rounded-3xl flex items-center gap-5">
                  <div className="bg-blue-600 p-4 rounded-2xl text-white"><Activity size={20} /></div>
                  <div>
                    <p className="text-white text-2xl font-black italic">{alumnosTotales}</p>
                    <p className="text-gray-500 text-[8px] font-black uppercase tracking-widest">Alumnos</p>
                  </div>
                </div>

                <div className="bg-white/5 border border-white/10 p-6 rounded-3xl flex items-center gap-5">
                  <div className="bg-[#FF3131] p-4 rounded-2xl text-white"><Users size={20} /></div>
                  <div>
                    <p className="text-white text-2xl font-black italic">{profesCount}</p>
                    <p className="text-gray-500 text-[8px] font-black uppercase tracking-widest">Staff</p>
                  </div>
                </div>

                <button onClick={() => setShowModal(true)} className="bg-white/5 border border-yellow-500/20 p-6 rounded-3xl flex items-center gap-5 hover:bg-yellow-500/10 transition-all">
                  <div className="bg-yellow-600 p-4 rounded-2xl text-white shadow-lg shadow-yellow-600/20"><AlertTriangle size={20} /></div>
                  <div>
                    <p className="text-white text-2xl font-black italic">{alumnosPendientes.length}</p>
                    <p className="text-yellow-500 text-[8px] font-black uppercase tracking-widest italic text-left">Ver Vencidos</p>
                  </div>
                </button>
              </div>
            </header>
          </div>

          {features.analyticsEnabled && (
            <Link to="/analytics" className="block p-8 bg-blue-600/10 border border-blue-500/20 rounded-[30px] group hover:border-blue-500/50 transition-all">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className="bg-blue-600 p-3 rounded-xl text-white"><BarChart3 size={24} /></div>
                  <div>
                    <h3 className="text-white font-black italic uppercase text-xl">Ver Analíticas Exclusivas</h3>
                    <p className="text-blue-400 text-[9px] font-bold uppercase tracking-widest">Asistencia, Usos y Negocio</p>
                  </div>
                </div>
                <ChevronRight className="text-blue-500 group-hover:translate-x-2 transition-transform" />
              </div>
            </Link>
          )}

          {showModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-in fade-in duration-300">
              <div className="bg-[#0a0a0a] border border-white/10 w-full max-w-lg rounded-[30px] overflow-hidden flex flex-col max-h-[80vh]">
                <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/5">
                  <h3 className="text-white font-black uppercase italic text-xl">Alumnos <span className="text-yellow-500">Vencidos</span></h3>
                  <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-white transition-colors"><X size={24} /></button>
                </div>
                <div className="p-4 bg-black/50">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" size={16} />
                    <input
                      type="text"
                      placeholder="BUSCAR ALUMNO..."
                      className="w-full bg-black border border-white/5 rounded-xl py-3 pl-10 text-white text-[10px] font-black uppercase outline-none focus:border-yellow-500/50"
                      value={busquedaModal}
                      onChange={(e) => setBusquedaModal(e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                  {alumnosFiltradosModal.map((alumno) => (
                    <div key={alumno.id} className="p-4 bg-white/5 border border-white/5 rounded-2xl flex justify-between items-center">
                      <div>
                        <p className="text-white font-black uppercase italic text-xs">{alumno.nombre}</p>
                        <p className="text-gray-500 text-[8px] font-bold tracking-widest">DNI: {alumno.dni || 'S/D'}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-red-500 font-black text-[8px] uppercase">Vencimiento</p>
                        <p className="text-white font-mono text-[10px]">{alumno.fecha_vencimiento || '---'}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-6 bg-white/5">
                  <Link to="/alumnos" onClick={() => setShowModal(false)} className="w-full block text-center bg-white text-black font-black py-4 rounded-2xl uppercase italic text-[10px]">Gestionar todos los alumnos</Link>
                </div>
              </div>
            </div>
          )}
        </div>
      );
    }

    if (role === 'profesor') {
      return (
        <div className="grid grid-cols-1 gap-6">
          <div className="p-10 bg-[#0a0a0a] border border-white/5 rounded-[40px]">
            <h2 className="text-[#FF3131] font-black uppercase text-[10px] mb-4 tracking-widest italic">Instructor Panel</h2>
            <p className="text-white text-3xl font-black italic mb-8 uppercase leading-tight">Tienes {alumnosTotales} alumnos <br /> con tu rutina</p>
          </div>
        </div>
      );
    }

    if (role === 'alumno') {
      return (
        <div className="space-y-6">

          {/* SECCIÓN ALERTAS UNIFICADA */}
          <div className="space-y-6 mb-6">
            {/* A. CARTEL DE APTO MÉDICO */}

            {features.aptoMedicoEnabled && (
              <div className="bg-blue-500/10 border border-blue-500/50 p-4 rounded-2xl flex items-center gap-4 animate-in slide-in-from-top duration-500">
                <HeartPulse
                  className={`text-blue-500 ${(isAptoVencido || (user?.diasApto !== null && user?.diasApto <= 7)) ? 'animate-pulse' : ''}`}
                  size={25}
                />
                <div className="flex-1">
                  <p className="text-white font-black text-[15px] uppercase tracking-tighter">Apto Médico</p>

                  {/* 1. Lógica del mensaje principal */}
                  <p className="text-blue-500 font-bold text-[10px] uppercase italic leading-tight">
                    {isAptoVencido
                      ? "CERTIFICADO VENCIDO / PENDIENTE"
                      : (user?.diasApto !== null && user?.diasApto <= 30
                        ? `ATENCIÓN: VENCE EN ${user.diasApto} DÍAS`
                        : "APTO MÉDICO VIGENTE")}
                  </p>

                  {/* 2. Lógica de la FECHA (Sin condiciones de vencimiento) */}
                  <p className="text-gray-500 font-black text-[12px] uppercase mt-1 tracking-widest italic">
                    Vence el: <span className="text-blue-400">
                      {user?.fecha_apto
                        ? new Date(user.fecha_apto + 'T00:00:00').toLocaleDateString('es-AR')
                        : 'SIN FECHA CARGADA'}
                    </span>
                  </p>
                </div>
              </div>
            )}
            {/* B. CARTEL DE CUOTA  */}
            {features.notificacionesCuotaEnabled && user?.diasParaVencer !== null && user.diasParaVencer <= 7 && (
              <div className={`p-4 rounded-2xl border flex items-center justify-between transition-all duration-500 
        ${user.diasParaVencer <= 3 ? 'animate-cuota-blink border-red-500/50 bg-red-500/10' : 'bg-[#0a0a0a] border-white/5'}`}>
                <div className="flex items-center gap-4">
                  <CreditCard className={user.diasParaVencer <= 3 ? 'text-red-500' : 'text-green-500'} size={20} />
                  <div>
                    <p className="text-[10px] font-black uppercase text-gray-500">Membresía</p>
                    <p className="text-white text-[12px] font-black uppercase italic">
                      {isVencido ? 'MEMBRESÍA VENCIDA' : `VENCE EN ${user.diasParaVencer} DÍAS`}
                    </p>
                  </div>
                </div>
                {user.diasParaVencer <= 3 && <AlertTriangle size={18} className="text-red-500 animate-bounce" />}
              </div>
            )}
          </div>


          <div className="p-10 bg-[#111] border-l-8 border-[#FF3131] rounded-3xl shadow-2xl relative overflow-hidden">
            <div className="relative z-10">
              <h1 className="text-4xl font-black text-white uppercase italic mb-2">Entrenar <span className="text-[#FF3131]">Hoy</span></h1>
              <p className="text-gray-500 text-[10px] font-bold uppercase mb-8 tracking-[3px]">Tu rutina personalizada lista</p>
              <Link to="/mi-rutina" className="bg-[#FF3131] text-white font-black px-10 py-4 rounded-full uppercase italic text-[11px] hover:scale-105 transition-transform inline-block shadow-lg shadow-[#FF3131]/20">Abrir mi plan</Link>
            </div>
            <Flame className="absolute top-1/2 right-[-20px] -translate-y-1/2 text-white/5" size={180} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[#0a0a0a] border border-white/5 p-8 rounded-[35px] text-center">
              <Flame size={40} className={`mx-auto mb-3 ${racha > 0 ? "text-orange-500 animate-pulse" : "text-gray-800"}`} />
              <p className="text-white text-3xl font-black italic leading-none">{racha}</p>
              <p className="text-gray-500 text-[8px] font-black uppercase mt-1 tracking-widest">Días Entrenados</p>
            </div>
            <div className="bg-[#0a0a0a] border border-white/5 p-8 rounded-[35px] text-center">
              <CalendarCheck size={40} className="mx-auto mb-3 text-[#FF3131]" />
              <p className="text-white text-[10px] font-black uppercase leading-tight">¡{racha >= 3 ? 'IMPARABLE!' : 'VAMOS'}!</p>
              <p className="text-gray-500 text-[8px] font-black uppercase mt-1 tracking-widest">Completa la Semana!</p>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 pb-10">
      <header className="mb-10 flex justify-between items-end">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="h-[2px] w-8 bg-[#FF3131]"></div>
            <span className="text-[#FF3131] font-black uppercase tracking-[4px] text-[9px]">QSTGYM SISTEMAS</span>
          </div>
          <h1 className="text-4xl font-black text-gray-500 italic tracking-tighter uppercase"><span className="text-white"> Bienvenida/o </span>{user?.nombre} </h1>
        </div>
      </header>

      {renderContent()}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #1a1a1a; border-radius: 10px; }

        @keyframes cuota-blink {
          0%, 100% { background-color: rgba(239, 68, 68, 0.05); }
          50% { background-color: rgba(239, 68, 68, 0.25); }
        }
        .animate-cuota-blink {
          animation: cuota-blink 1.2s infinite ease-in-out;
        }
      `}</style>
    </div>
  );
}