import { useAuth } from '../context/AuthContext';
import { 
  Users, 
  Dumbbell, 
  ClipboardList, 
  LogOut, 
  Home, 
  Activity,
  Library // <--- Importamos este para la biblioteca
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

export default function Sidebar() {
  const { logout, user } = useAuth();
  const location = useLocation();

  const role = user?.role?.toLowerCase().trim() || 'alumno';

  const menuConfig = {
    administrador: [
      { name: 'Inicio', icon: <Home size={20}/>, path: '/' },
      { name: 'Alumnos', icon: <Users size={20}/>, path: '/alumnos' },
      { name: 'Rutinas', icon: <ClipboardList size={20}/>, path: '/rutinas' },
      { name: 'Biblioteca', icon: <Library size={20}/>, path: '/ejercicios' }, // <--- AGREGADO
      { name: 'Staff', icon: <Users size={20}/>, path: '/staff' },
      { name: 'Reg', icon: <Activity size={20}/>, path: '/log-actividad'},
    ],
    manager: [
      { name: 'Inicio', icon: <Home size={20}/>, path: '/' },
      { name: 'Alumnos', icon: <Users size={20}/>, path: '/alumnos' },
      { name: 'Rutinas', icon: <ClipboardList size={20}/>, path: '/rutinas' },
      { name: 'Biblioteca', icon: <Library size={20}/>, path: '/ejercicios' }, // <--- AGREGADO
      { name: 'Reg', icon: <Activity size={20}/>, path: '/log-actividad'},
    ],
    profesor: [
      { name: 'Inicio', icon: <Home size={20}/>, path: '/' },
      { name: 'Alumnos', icon: <Users size={20}/>, path: '/alumnos' },
      { name: 'Rutinas', icon: <ClipboardList size={20}/>, path: '/rutinas' },
      { name: 'Biblioteca', icon: <Library size={20}/>, path: '/ejercicios' }, // <--- AGREGADO
      { name: 'Reg', icon: <Activity size={20}/>, path: '/log-actividad'},
    ],
    alumno: [
      { name: 'Inicio', icon: <Home size={20}/>, path: '/' },
      { name: 'Rutina', icon: <Dumbbell size={20}/>, path: '/mi-rutina' },
      { name: 'Perfil', icon: <Activity size={20}/>, path: '/perfil' },
    ]
  };

  const currentMenu = (role === 'admin' || role === 'administrador') 
    ? menuConfig.administrador 
    : (menuConfig[role] || menuConfig.alumno);

  // ... (Resto del código del componente sigue igual)
  return (
    <>
      {/* --- SIDEBAR PARA DESKTOP --- */}
      <div className="hidden md:flex w-64 bg-[#0a0a0a] border-r border-[#FF3131]/20 p-6 flex-col h-screen sticky top-0 z-50">
        <div className="mb-10">
          <h1 className="text-[#FF3131] text-3xl font-black italic tracking-tighter uppercase leading-none">QST<br/>GYM</h1>
          <p className="text-[10px] text-gray-500 uppercase tracking-[4px] font-bold mt-2">{role}</p>
        </div>
        
        <nav className="flex-1 space-y-2">
          {currentMenu.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link 
                key={item.name} 
                to={item.path} 
                className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                  isActive 
                  ? 'bg-[#FF3131] text-white shadow-[0_0_20px_rgba(255,49,49,0.3)]' 
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {item.icon}
                <span className="font-black uppercase text-[11px] tracking-widest">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <button 
          onClick={logout} 
          className="mt-auto flex items-center gap-3 p-4 bg-white/5 rounded-xl text-gray-400 hover:text-[#FF3131] transition-all font-black uppercase text-[10px] tracking-widest"
        >
          <LogOut size={18} />
          <span>Salir</span>
        </button>
      </div>

      {/* --- MENU INFERIOR PARA MÓVIL --- */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[#0a0a0a]/90 backdrop-blur-lg border-t border-[#FF3131]/20 px-2 py-3 z-[100] flex justify-around items-center">
        {currentMenu.slice(0, 5).map((item) => { // Aumenté a 5 para que entre la Biblioteca en mobile si hay espacio
          const isActive = location.pathname === item.path;
          return (
            <Link 
              key={item.name} 
              to={item.path} 
              className={`flex flex-col items-center gap-1 px-3 py-1 rounded-lg transition-all ${
                isActive ? 'text-[#FF3131]' : 'text-gray-500'
              }`}
            >
              {item.icon}
              <span className="text-[9px] font-black uppercase tracking-tighter">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </>
  );
}