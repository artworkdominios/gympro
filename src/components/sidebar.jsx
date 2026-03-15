import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Home, 
  Users, 
  Dumbbell, 
  UserCircle, 
  LayoutDashboard, 
  Settings, 
  LogOut, 
  Menu, 
  X, 
  ClipboardList, 
  History,
  ShieldCheck,
  BarChart3 // <--- Ícono para Analytics
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout, features } = useAuth(); // Extraemos features
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error("Error al cerrar sesión", error);
    }
  };

  const role = user?.role?.toLowerCase().trim() || 'alumno';

  const menuItems = [
    { 
      path: '/', 
      name: 'Dashboard', 
      icon: <Home size={20} />, 
      roles: ['administrador', 'admin', 'manager', 'profesor', 'alumno'] 
    },
    { 
      path: '/mi-rutina', 
      name: 'Mi Rutina', 
      icon: <Dumbbell size={20} />, 
      roles: ['alumno'] 
    },
    { 
      path: '/analytics', 
      name: 'Analytics', 
      icon: <BarChart3 size={20} />, 
      roles: ['administrador', 'admin', 'manager'],
      feature: 'analyticsEnabled' // <--- Requiere esta feature activa
    },
    { 
      path: '/alumnos', 
      name: 'Alumnos', 
      icon: <Users size={20} />, 
      roles: ['administrador', 'admin', 'manager', 'profesor'] 
    },
    { 
      path: '/ejercicios', 
      name: 'Ejercicios', 
      icon: <ClipboardList size={20} />, 
      roles: ['administrador', 'admin', 'manager'] 
    },
    { 
      path: '/rutinas', 
      name: 'Rutinas', 
      icon: <LayoutDashboard size={20} />, 
      roles: ['administrador', 'admin', 'manager', 'profesor'] 
    },
    { 
      path: '/staff', 
      name: 'Staff / Usuarios', 
      icon: <UserCircle size={20} />, 
      roles: ['administrador', 'admin'] 
    },
    { 
      path: '/log-actividad', 
      name: 'Log Actividad', 
      icon: <History size={20} />, 
      roles: ['administrador', 'admin'] 
    },
    { 
      path: '/super-admin', 
      name: 'Control Maestro', 
      icon: <ShieldCheck size={20} />, 
      roles: ['administrador', 'admin'] 
    },
    { 
      path: '/perfil', 
      name: 'Mi Perfil', 
      icon: <Settings size={20} />, 
      roles: ['administrador', 'admin', 'manager', 'profesor', 'alumno'] 
    },
  ];

  // FILTRADO DINÁMICO: Por Rol Y por Feature activa
  const filteredItems = menuItems.filter(item => {
    const hasRole = item.roles.includes(role);
    const featureActive = item.feature ? features?.[item.feature] : true;
    return hasRole && featureActive;
  });

  const NavContent = () => (
    <div className="flex flex-col h-full bg-[#0a0a0a] border-r border-white/5 p-4">
      <div className="mb-10 px-2">
        <h1 className="text-2xl font-black italic text-white uppercase tracking-tighter">
          QST<span className="text-[#FF3131]">GYM</span>
        </h1>
        <div className="flex items-center gap-2 mt-1">
          <div className="w-2 h-2 rounded-full bg-[#FF3131] animate-pulse"></div>
          <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest">{role} panel</span>
        </div>
      </div>

      <nav className="flex-1 space-y-1">
        {filteredItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setIsOpen(false)}
              className={`flex items-center gap-3 px-4 py-4 rounded-2xl transition-all duration-300 group ${
                isActive 
                ? 'bg-[#FF3131] text-white shadow-lg shadow-[#FF3131]/20' 
                : 'text-gray-500 hover:bg-white/5 hover:text-white'
              }`}
            >
              <span className={`${isActive ? 'text-white' : 'group-hover:text-[#FF3131] transition-colors'}`}>
                {item.icon}
              </span>
              <span className="text-[10px] font-black uppercase italic tracking-wider">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <button
        onClick={handleLogout}
        className="mt-auto flex items-center gap-3 px-4 py-4 rounded-2xl text-gray-500 hover:bg-red-500/10 hover:text-red-500 transition-all duration-300 group"
      >
        <LogOut size={20} className="group-hover:rotate-12 transition-transform" />
        <span className="text-[10px] font-black uppercase italic tracking-wider">Cerrar Sesión</span>
      </button>
    </div>
  );

  return (
    <>
      <div className="md:hidden flex items-center justify-between p-4 bg-[#0a0a0a] border-b border-white/5 sticky top-0 z-50">
        <h1 className="text-xl font-black italic text-white uppercase">QST<span className="text-[#FF3131]">GYM</span></h1>
        <button onClick={() => setIsOpen(!isOpen)} className="text-white p-2">
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      <aside className="hidden md:block w-72 h-screen sticky top-0">
        <NavContent />
      </aside>

      {isOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsOpen(false)}></div>
          <aside className="fixed inset-y-0 left-0 w-72 shadow-2xl animate-in slide-in-from-left duration-300">
            <NavContent />
          </aside>
        </div>
      )}
    </>
  );
}