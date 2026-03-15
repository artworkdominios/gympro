import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom'; 
import { db } from '../lib/firebase';
import { collection, query, where, onSnapshot, orderBy, limit, doc, updateDoc } from 'firebase/firestore';
import { Users, Shield, Flame, CalendarCheck, CreditCard, AlertTriangle, Activity, ShieldCheck, X, Search } from 'lucide-react';

export default function DashboardPage() {
  const { user, features } = useAuth();
  const [profesCount, setProfesCount] = useState(0);
  const [alumnosTotales, setAlumnosTotales] = useState(0);
  const [alumnosLista, setAlumnosLista] = useState([]); 
  const [alumnosPendientes, setAlumnosPendientes] = useState([]); 
  const [racha, setRacha] = useState(0);
  const [diasRestantes, setDiasRestantes] = useState(null);
  const [topEjercicios, setTopEjercicios] = useState([]);
  
  // Estados para el Modal de detalle
  const [showModal, setShowModal] = useState(false);
  const [busquedaModal, setBusquedaModal] = useState('');

  const role = user?.role?.toLowerCase().trim() || '';

  // 1. Lógica para Admin / Manager (Contadores y Analytics)
  useEffect(() => {
    if (role === 'manager' || role === 'admin' || role === 'administrador') {
      
      // A. Contador de Profesores
      const qProfes = query(collection(db, "users"), where("role", "in", ["profesor", "profesor ", "PROFESOR"]));
      const unsubProfes = onSnapshot(qProfes, (snap) => setProfesCount(snap.size));

      // B. Contador de Alumnos y Filtrado de Vencidos
      const qAlumnos = query(collection(db, "users"), where("role", "==", "alumno"));
      const unsubAlumnos = onSnapshot(qAlumnos, (snap) => {
        const todos = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setAlumnosLista(todos);
        setAlumnosTotales(todos.length);
        
        const hoy = new Date();
        const pendientes = todos.filter(alumno => {
          if (!alumno.fecha_vencimiento) return true;
          return new Date(alumno.fecha_vencimiento) <= hoy;
        });
        setAlumnosPendientes(pendientes);
      });

      // C. Lógica de Analytics (Ejercicios más asignados)
      const unsubRutinas = onSnapshot(collection(db, "rutinas"), (snap) => {
        const conteo = {};
        snap.docs.forEach(doc => {
          const rutina = doc.data();
          rutina.bloques?.forEach(bloque => {
            bloque.ejercicios?.forEach(ej => {
              const nombre = ej.nombre?.toUpperCase().trim();
              if (nombre) conteo[nombre] = (conteo[nombre] || 0) + 1;
            });
          });
        });
        
        const sorted = Object.entries(conteo)
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);
        setTopEjercicios(sorted);
      });

      return () => { 
        unsubProfes(); 
        unsubAlumnos(); 
        unsubRutinas(); 
      };
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

      const unsubRacha = onSnapshot(q, (snap) => {
        if (snap.empty) { setRacha(0); return; }
        const diasUnicos = new Set();
        snap.docs.forEach(doc => {
          const fecha = doc.data().fecha?.toDate();
          if (fecha) diasUnicos.add(fecha.toDateString());
        });
        setRacha(diasUnicos.size);
      });

      if (user?.fecha_vencimiento) {
        const hoy = new Date();
        const vencimiento = new Date(user.fecha_vencimiento);
        const diffTime = vencimiento - hoy;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        setDiasRestantes(diffDays);
      }

      return () => unsubRacha();
    }
  }, [role, user]);

  // Filtrado para el buscador del modal
  const alumnosFiltradosModal = alumnosPendientes.filter(a => 
    a.nombre?.toLowerCase().includes(busquedaModal.toLowerCase()) || 
    a.dni?.includes(busquedaModal)
  );

  const renderContent = () => {
    // VISTA PARA MANAGER O ADMIN (Dashboard Estadístico)
    if (role === 'manager' || role === 'admin' || role === 'administrador') {
      return (
        <div className="animate-in fade-in duration-700">
          <div className="p-10 bg-[#0a0a0a] border border-white/5 rounded-[40px] shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-10 opacity-5">
              <Shield size={120} className="text-white" />
            </div>
            
            <header className="relative z-10">
              <h1 className="text-5xl font-black italic text-white uppercase tracking-tighter leading-none mb-4">
                HOLA, <span className="text-[#FF3131]">{user?.nombre?.split(' ')[0] || 'ADMIN'}</span>
              </h1>
              <p className="text-gray-500 text-[10px] font-black uppercase tracking-[5px] mb-8 italic">Panel de Control Operativo</p>
              
              <div className="flex flex-wrap gap-4 mb-12">
                {/* Card Alumnos */}
                <div className="inline-flex items-center gap-5 bg-white/5 border border-white/10 p-5 rounded-3xl group">
                  <div className="bg-blue-600 p-4 rounded-2xl group-hover:scale-110 transition-transform">
                    <Activity size={20} className="text-white" />
                  </div>
                  <div>
                    <p className="text-white text-2xl font-black italic">{alumnosTotales}</p>
                    <p className="text-gray-500 text-[8px] font-black uppercase tracking-widest">Alumnos Activos</p>
                  </div>
                </div>

                {/* Card Staff */}
                <div className="inline-flex items-center gap-5 bg-white/5 border border-white/10 p-5 rounded-3xl group">
                  <div className="bg-[#FF3131] p-4 rounded-2xl group-hover:scale-110 transition-transform">
                    <Users size={20} className="text-white" />
                  </div>
                  <div>
                    <p className="text-white text-2xl font-black italic">{profesCount}</p>
                    <p className="text-gray-500 text-[8px] font-black uppercase tracking-widest">Staff Técnico</p>
                  </div>
                </div>

                {/* Card Vencidos (Clickable) */}
                <button 
                  onClick={() => setShowModal(true)}
                  className="inline-flex items-center gap-5 bg-white/5 border border-yellow-500/20 p-5 rounded-3xl group hover:bg-yellow-500/10 hover:border-yellow-500/50 transition-all text-left"
                >
                  <div className="bg-yellow-600 p-4 rounded-2xl shadow-[0_0_20px_rgba(202,138,4,0.3)] group-hover:scale-110 transition-transform">
                    <AlertTriangle size={20} className="text-white" />
                  </div>
                  <div>
                    <p className="text-white text-2xl font-black italic">{alumnosPendientes.length}</p>
                    <p className="text-yellow-500 text-[8px] font-black uppercase tracking-widest italic">Ver Vencidos</p>
                  </div>
                </button>
              </div>

              {/* Módulo Analytics Pro */}
              {features.analyticsEnabled && topEjercicios.length > 0 && (
                <div className="pt-12 border-t border-white/5 animate-in slide-in-from-bottom-4 duration-1000">
                  <div className="flex items-center gap-3 mb-8">
                    <div className="bg-blue-600/10 p-2 rounded-xl text-blue-500">
                      <Activity size={20} />
                    </div>
                    <div>
                      <h3 className="text-white font-black italic uppercase text-lg tracking-tighter">Tendencias <span className="text-blue-500">Pro</span></h3>
                      <p className="text-gray-600 text-[8px] font-black uppercase tracking-[3px]">Ejercicios más asignados por el staff</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                    <div className="space-y-5">
                      {topEjercicios.map((ej, i) => (
                        <div key={i}>
                          <div className="flex justify-between items-end mb-2">
                            <span className="text-white font-bold text-[10px] uppercase tracking-tight">{ej.name}</span>
                            <span className="text-blue-500 font-black text-[9px] uppercase">{ej.count} Usos</span>
                          </div>
                          <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-blue-600 transition-all duration-1000" 
                              style={{ width: `${(ej.count / topEjercicios[0].count) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="bg-blue-600/5 border border-blue-500/10 p-6 rounded-[30px] text-center">
                      <ShieldCheck size={30} className="text-blue-500 mx-auto mb-3" />
                      <p className="text-white font-black italic uppercase text-[10px] mb-2">Análisis de Planta</p>
                      <p className="text-gray-500 text-[9px] uppercase font-bold leading-relaxed">Datos analíticos para optimizar el equipamiento.</p>
                    </div>
                  </div>
                </div>
              )}
            </header>
          </div>

          {/* Botón de toggle solo para Admin */}
          {(role === 'admin' || role === 'administrador') && (
            <div className="flex justify-end mt-4">
              <button 
                onClick={async () => {
                  const configRef = doc(db, "configuracion", "features");
                  await updateDoc(configRef, { analyticsEnabled: !features.analyticsEnabled });
                }}
                className={`px-6 py-2 rounded-full font-black text-[8px] uppercase tracking-widest transition-all ${
                  features.analyticsEnabled ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]' : 'bg-white/5 text-gray-500 border border-white/10'
                }`}
              >
                Analytics Pro: {features.analyticsEnabled ? 'ACTIVADO' : 'DESACTIVADO'}
              </button>
            </div>
          )}

          {/* MODAL DE ALUMNOS VENCIDOS */}
          {showModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-in fade-in duration-300">
              <div className="bg-[#0a0a0a] border border-white/10 w-full max-w-lg rounded-[30px] overflow-hidden shadow-2xl flex flex-col max-h-[80vh]">
                <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/5">
                  <div>
                    <h3 className="text-white font-black uppercase italic tracking-tighter text-xl">Alumnos <span className="text-yellow-500">Vencidos</span></h3>
                    <p className="text-gray-500 text-[8px] font-bold uppercase tracking-widest">Total: {alumnosPendientes.length}</p>
                  </div>
                  <button onClick={() => setShowModal(false)} className="p-2 hover:bg-white/10 rounded-full text-gray-500 transition-colors">
                    <X size={24} />
                  </button>
                </div>

                <div className="p-4 bg-black/50">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" size={16} />
                    <input 
                      type="text" 
                      placeholder="BUSCAR POR NOMBRE O DNI..." 
                      className="w-full bg-black border border-white/5 rounded-xl py-3 pl-10 pr-4 text-white text-[10px] font-bold uppercase outline-none focus:border-yellow-500/50"
                      value={busquedaModal}
                      onChange={(e) => setBusquedaModal(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                  {alumnosFiltradosModal.length > 0 ? (
                    alumnosFiltradosModal.map((alumno) => (
                      <div key={alumno.id} className="p-4 bg-white/5 border border-white/5 rounded-2xl flex justify-between items-center group hover:bg-white/[0.08] transition-all">
                        <div>
                          <p className="text-white font-black uppercase italic text-xs group-hover:text-yellow-500 transition-colors">{alumno.nombre}</p>
                          <p className="text-gray-500 text-[9px] font-bold tracking-widest uppercase">DNI: {alumno.dni || 'S/D'}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-red-500 font-black text-[9px] uppercase">Venció el:</p>
                          <p className="text-white font-mono text-[10px]">{alumno.fecha_vencimiento || 'S/D'}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-center py-10 text-gray-600 font-black uppercase text-[10px] italic tracking-[4px]">Sin resultados</p>
                  )}
                </div>

                <div className="p-6 border-t border-white/5 bg-white/5">
                  <Link 
                    to="/alumnos" 
                    onClick={() => setShowModal(false)}
                    className="w-full block text-center bg-white text-black font-black py-4 rounded-2xl uppercase italic text-[10px] hover:bg-yellow-500 transition-all"
                  >
                    Ir a Gestión de Usuarios
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      );
    }

    // VISTA PARA PROFESOR
    if (role === 'profesor') {
      return (
        <div className="p-10 bg-[#0a0a0a] border border-white/5 rounded-[40px] shadow-2xl">
          <h2 className="text-[#FF3131] font-black uppercase text-sm mb-4 italic tracking-widest">Panel del Instructor</h2>
          <p className="text-white text-2xl font-bold italic mb-6 uppercase">Alumnos en sistema: {alumnosTotales}</p>
          <Link to="/alumnos" className="inline-block bg-white text-black font-black px-8 py-3 rounded-xl uppercase text-[10px] hover:bg-[#FF3131] hover:text-white transition-all">
            Gestionar Rutinas
          </Link>
        </div>
      );
    }

    // VISTA PARA ALUMNO
    if (role === 'alumno') {
      return (
        <div className="space-y-6">
          {features.notificacionesCuotaEnabled && diasRestantes !== null && (
            <div className={`p-4 rounded-2xl border flex items-center justify-between animate-in slide-in-from-top-2 duration-500 ${diasRestantes <= 5 ? 'bg-red-500/10 border-red-500/50' : 'bg-green-500/10 border-green-500/50'}`}>
              <div className="flex items-center gap-3">
                {diasRestantes <= 5 ? <AlertTriangle className="text-red-500" size={20}/> : <CreditCard className="text-green-500" size={20}/>}
                <div>
                  <p className="text-[10px] font-black uppercase text-gray-400">Suscripción</p>
                  <p className="text-white text-xs font-bold uppercase">
                    {diasRestantes <= 0 ? 'Cuota Vencida' : `Vence en ${diasRestantes} días`}
                  </p>
                </div>
              </div>
              <span className="text-[8px] font-black uppercase text-gray-500 italic">{user?.fecha_vencimiento}</span>
            </div>
          )}

          <div className="p-8 bg-[#111] border-l-8 border-[#FF3131] rounded-r-2xl shadow-2xl animate-in fade-in duration-500">
            <h1 className="text-3xl font-black text-white uppercase italic mb-2 tracking-tighter">
              Mi <span className="text-[#FF3131]">Entrenamiento</span>
            </h1>
            <p className="text-gray-500 text-[10px] font-bold uppercase mb-6 tracking-[3px]">Consulta tu plan y marca tus progresos</p>
            <Link 
              to="/mi-rutina" 
              className="inline-block bg-[#FF3131] text-white font-black px-10 py-4 rounded-full uppercase italic hover:scale-105 transition-all text-xs"
            >
              Ver Rutina Actual
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[#0a0a0a] border border-white/5 p-6 rounded-3xl flex flex-col items-center text-center shadow-xl">
              <Flame size={32} className={racha > 0 ? "text-orange-500 animate-pulse" : "text-gray-800"} />
              <p className="text-white text-2xl font-black italic mt-2">{racha}</p>
              <p className="text-gray-500 text-[8px] font-black uppercase tracking-widest">Días Entrenados</p>
            </div>
            <div className="bg-[#0a0a0a] border border-white/5 p-6 rounded-3xl flex flex-col items-center text-center shadow-xl">
              <CalendarCheck size={32} className="text-[#FF3131]" />
              <p className="text-white text-[10px] font-black uppercase mt-3">Estado</p>
              <p className="text-gray-500 text-[8px] font-black uppercase tracking-widest">{racha >= 3 ? '¡VAS EXCELENTE!' : '¡MANTENÉ EL RITMO!'}</p>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 pb-10">
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
      
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #1a1a1a; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #FF3131; }
      `}</style>
    </div>
  );
}