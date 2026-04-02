import { useAuth } from '../context/AuthContext';
import { User, Mail, Shield, AlertCircle, CreditCard } from 'lucide-react';

export default function PerfilPage() {
  // Traemos 'features' y el 'user' (que ya trae diasParaVencer inyectado)
  const { user, features } = useAuth();

  // Usamos el valor que ya calculamos en el Contexto o 0 si es negativo
  const dias = user?.diasParaVencer !== null ? user.diasParaVencer : null;

  return (
    <div className="max-w-2xl mx-auto animate-in fade-in duration-500 p-4">
      <header className="mb-10 text-center">
        <div className="inline-block p-4 rounded-full bg-[#FF3131]/10 border border-[#FF3131]/20 mb-4 shadow-[0_0_30px_rgba(255,49,49,0.1)]">
           <User size={48} className="text-[#FF3131]" />
        </div>
        <h1 className="text-4xl font-black italic text-white uppercase tracking-tighter">Mi <span className="text-[#FF3131]">Perfil</span></h1>
        <p className="text-gray-500 text-[10px] font-black uppercase tracking-[4px] mt-2">{user?.role || 'Usuario'}</p>
      </header>

      <div className="grid gap-6">
        {/* TARJETA DE ESTADO DE PAGO (Solo Alumnos y si la Feature está activa) */}
        {user?.role === 'alumno' && features.notificacionesCuotaEnabled && (
          <div className={`p-6 rounded-3xl border ${dias <= 5 ? 'bg-red-500/10 border-red-500/30' : 'bg-green-500/10 border-green-500/30'} flex items-center justify-between shadow-2xl animate-in slide-in-from-top-4`}>
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-2xl ${dias <= 5 ? 'bg-red-500 text-white' : 'bg-green-500 text-white'}`}>
                <CreditCard size={24} />
              </div>
              <div>
                <p className="text-white font-black uppercase italic text-sm">
                  {dias <= 0 ? 'CUOTA VENCIDA' : `CUOTA ACTIVA`}
                </p>
                <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">
                  Vence: {user?.fecha_vencimiento || 'No registrada'}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className={`text-2xl font-black italic ${dias <= 5 ? 'text-red-500' : 'text-green-500'}`}>
                {dias > 0 ? dias : 0}
              </p>
              <p className="text-[8px] text-gray-600 font-black uppercase">Días restantes</p>
            </div>
          </div>
        )}

        {/* DATOS DE CUENTA */}
        <div className="bg-[#0a0a0a] border border-white/5 rounded-3xl p-8 space-y-6 shadow-2xl">
          <div className="flex items-center gap-6 border-b border-white/5 pb-6">
            <div className="text-gray-600"><User size={20} /></div>
            <div className="flex-1">
              <p className="text-[10px] font-black text-[#FF3131] uppercase mb-1">Nombre Completo</p>
              <p className="text-white font-bold uppercase italic text-lg">{user?.nombre || 'No asignado'}</p>
            </div>
          </div>

          <div className="flex items-center gap-6 border-b border-white/5 pb-6">
            <div className="text-gray-600"><Mail size={20} /></div>
            <div className="flex-1">
              <p className="text-[10px] font-black text-[#FF3131] uppercase mb-1">Correo Electrónico</p>
              <p className="text-white font-bold text-lg lowercase">{user?.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-gray-600"><Shield size={20} /></div>
            <div className="flex-1">
              <p className="text-[10px] font-black text-[#FF3131] uppercase mb-1">Nivel de Acceso</p>
              <p className="text-white font-bold uppercase text-lg">{user?.role || 'Alumno'}</p>
            </div>
          </div>
        </div>

        {/* Mensaje de aviso de renovación (Solo si la notificación está activa) */}
        {user?.role === 'alumno' && features.notificacionesCuotaEnabled && dias <= 5 && (
          <div className="flex items-center gap-3 bg-white/5 p-4 rounded-2xl border border-dashed border-white/10">
            <AlertCircle size={16} className="text-orange-500" />
            <p className="text-[9px] text-gray-500 font-bold uppercase tracking-tight">
              Recordá renovar tu cuota en recepción antes de la fecha de vencimiento para evitar la baja del sistema.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}