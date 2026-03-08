import { useAuth } from '../context/AuthContext';
import { User, Mail, Shield, Calendar } from 'lucide-react';

export default function PerfilPage() {
  const { user } = useAuth();

  return (
    <div className="max-w-2xl mx-auto animate-in fade-in duration-500">
      <header className="mb-10 text-center">
        <div className="inline-block p-4 rounded-full bg-[#FF3131]/10 border border-[#FF3131]/20 mb-4">
           <User size={48} className="text-[#FF3131]" />
        </div>
        <h1 className="text-4xl font-black italic text-white uppercase tracking-tighter">Mi <span className="text-[#FF3131]">Perfil</span></h1>
        <p className="text-gray-500 text-[10px] font-black uppercase tracking-[4px] mt-2">{user?.role || 'Usuario'}</p>
      </header>

      <div className="bg-[#0a0a0a] border border-white/5 rounded-3xl p-8 space-y-6 shadow-2xl">
        <div className="flex items-center gap-6 border-b border-white/5 pb-6">
          <div className="text-gray-600"><User size={20} /></div>
          <div>
            <p className="text-[10px] font-black text-[#FF3131] uppercase mb-1">Nombre Completo</p>
            <p className="text-white font-bold uppercase italic text-lg">{user?.nombre || 'No asignado'}</p>
          </div>
        </div>

        <div className="flex items-center gap-6 border-b border-white/5 pb-6">
          <div className="text-gray-600"><Mail size={20} /></div>
          <div>
            <p className="text-[10px] font-black text-[#FF3131] uppercase mb-1">Correo Electrónico</p>
            <p className="text-white font-bold text-lg lowercase">{user?.email}</p>
          </div>
        </div>

        <div className="flex items-center gap-6 border-b border-white/5 pb-6">
          <div className="text-gray-600"><Shield size={20} /></div>
          <div>
            <p className="text-[10px] font-black text-[#FF3131] uppercase mb-1">Nivel de Acceso</p>
            <p className="text-white font-bold uppercase text-lg">{user?.role || 'Alumno'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}