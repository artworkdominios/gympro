import { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Home, Users, Dumbbell, UserCircle, LayoutDashboard, 
  Settings, LogOut, ClipboardList, History,
  ShieldCheck, BarChart3 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Sidebar() {
  const { user, logout, features } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const scrollRef = useRef(null);

  // Función para la vibración (Haptic Feedback)
  const triggerHaptic = () => {
    if (window.navigator && window.navigator.vibrate) {
      window.navigator.vibrate(10); // Vibración corta de 10ms
    }
  };

  const handleLogout = async () => {
    triggerHaptic();
    try { await logout(); navigate('/login'); } catch (e) { console.error(e); }
  };

  const role = user?.role?.toLowerCase().trim() || 'alumno';

  const menuItems = [
    { path: '/', name: 'Inicio', icon: <Home size={20} />, roles: ['administrador', 'admin', 'manager', 'profesor', 'alumno'] },
    { path: '/mi-rutina', name: 'Rutina', icon: <Dumbbell size={20} />, roles: ['alumno'] },
    { path: '/analytics', name: 'Métricas', icon: <BarChart3 size={20} />, roles: ['administrador', 'admin', 'manager'], feature: 'analyticsEnabled' },
    { path: '/alumnos', name: 'Alumnos', icon: <Users size={20} />, roles: ['administrador', 'admin', 'manager'] },
    { path: '/ejercicios', name: 'Biblioteca', icon: <ClipboardList size={20} />, roles: ['administrador', 'admin', 'manager'] },
    { path: '/rutinas', name: 'Rutinas', icon: <LayoutDashboard size={20} />, roles: ['administrador', 'admin', 'manager', 'profesor'] },
    { path: '/staff', name: 'Staff', icon: <UserCircle size={20} />, roles: ['administrador', 'admin'] },
    { path: '/log-actividad', name: 'Log', icon: <History size={20} />, roles: ['administrador', 'admin'] },
    { path: '/super-admin', name: 'Master', icon: <ShieldCheck size={20} />, roles: ['administrador', 'admin'] },
    { path: '/perfil', name: 'Perfil', icon: <Settings size={20} />, roles: ['administrador', 'admin', 'manager', 'profesor', 'alumno'] },
  ];

  const filteredItems = menuItems.filter(item => 
    item.roles.includes(role) && (item.feature ? features?.[item.feature] : true)
  );

  useEffect(() => {
    const activeItem = document.getElementById(`tab-${location.pathname}`);
    if (activeItem && scrollRef.current) {
      activeItem.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [location.pathname]);

  return (
    <>
      {/* --- DESKTOP SIDEBAR --- */}
      <aside className="hidden md:flex flex-col w-72 h-screen sticky top-0 bg-[#0a0a0a] border-r border-white/5 p-4 overflow-y-auto">
        <div className="mb-10 px-2 flex-shrink-0">
          <h1 className="text-2xl font-black italic text-white uppercase tracking-tighter">QST<span className="text-[#FF3131]">GYM</span></h1>
          <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest mt-1">● {role} panel</p>
        </div>
        <nav className="flex-1 space-y-1">
          {filteredItems.map((item) => (
            <Link 
              key={item.path} 
              to={item.path} 
              className={`flex items-center gap-3 px-4 py-4 rounded-2xl transition-all duration-300 group ${location.pathname === item.path ? 'bg-[#FF3131] text-white shadow-lg shadow-[#FF3131]/20' : 'text-gray-500 hover:bg-white/5 hover:text-white'}`}
            >
              <span className={location.pathname === item.path ? 'text-white' : 'group-hover:text-[#FF3131]'}>{item.icon}</span>
              <span className="text-[10px] font-black uppercase italic tracking-wider">{item.name}</span>
            </Link>
          ))}
        </nav>
        <button onClick={handleLogout} className="mt-6 mb-4 flex items-center gap-3 px-4 py-4 rounded-2xl text-gray-500 hover:bg-red-500/10 hover:text-red-500 transition-all"><LogOut size={20} /><span className="text-[10px] font-black uppercase italic">Cerrar Sesión</span></button>
      </aside>

      {/* --- MOBILE TAB BAR --- */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-[100] bg-[#0a0a0a]/80 backdrop-blur-xl border-t border-white/10 pb-[env(safe-area-inset-bottom)]">
        <nav ref={scrollRef} className="flex items-center overflow-x-auto no-scrollbar py-2 px-4 gap-2 scroll-smooth">
          {filteredItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                id={`tab-${item.path}`}
                to={item.path}
                onClick={triggerHaptic}
                className={`flex flex-col items-center justify-center min-w-[75px] py-2 rounded-xl transition-all ${isActive ? 'text-[#FF3131]' : 'text-gray-500'}`}
              >
                <div className={`p-2 rounded-lg transition-all ${isActive ? 'bg-[#FF3131]/10' : ''}`}>
                  {item.icon}
                </div>
                <span className={`text-[9px] font-black uppercase mt-1 tracking-tighter ${isActive ? 'opacity-100' : 'opacity-60'}`}>
                  {item.name}
                </span>
                {isActive && <div className="w-1 h-1 bg-[#FF3131] rounded-full mt-1 animate-pulse" />}
              </Link>
            );
          })}
          <button onClick={handleLogout} className="flex flex-col items-center justify-center min-w-[75px] py-2 text-gray-700">
            <LogOut size={20} />
            <span className="text-[8px] font-black uppercase mt-1">Salir</span>
          </button>
        </nav>
      </div>

      {/* Header móvil minimalista con Notch protection */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-[#050505]/60 backdrop-blur-md z-[60] pt-[env(safe-area-inset-top)] px-6 py-4 flex justify-between items-center border-b border-white/5">
         <h1 className="text-xl font-black italic text-white uppercase tracking-tighter">QST<span className="text-[#FF3131]">GYM</span></h1>
         <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-full border border-white/5">
            <div className="w-1.5 h-1.5 rounded-full bg-[#31FF31] shadow-[0_0_8px_#31FF31]"></div>
            <span className="text-[9px] font-black text-white uppercase tracking-widest">{user?.name?.split(' ')[0] || 'Conectado'}</span>
         </div>
      </div>
    </>
  );
}