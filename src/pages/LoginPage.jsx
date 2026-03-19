import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Dumbbell, Mail, Lock, Loader2, CheckCircle2 } from 'lucide-react';
import { sendPasswordReset } from '../lib/authService.js';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loadingLocal, setLoadingLocal] = useState(false);
  const [resetSent, setResetSent] = useState(false); // <--- CORREGIDO: Estado agregado
  
  const { signIn, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) navigate('/');
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoadingLocal(true);
    try {
      await signIn(email, password);
      navigate('/'); 
    } catch (err) {
      alert("Error: Credenciales inválidas o usuario no registrado.");
    } finally {
      setLoadingLocal(false);
    }
  };

  const handleResetPassword = async () => {
    if (!email) {
      alert("Por favor, ingresá tu email para enviarte el link.");
      return;
    }
  
    try {
      await sendPasswordReset(email);
      setResetSent(true);
      setTimeout(() => setResetSent(false), 5000);
    } catch (err) {
      console.error("Error capturado:", err);
      alert("Error: " + (err.message || "No se pudo enviar el correo. Verificá el email."));
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6 relative overflow-hidden">
      
      {/* Efectos de Iluminación de Fondo */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#FF3131]/10 blur-[140px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#FF3131]/10 blur-[140px] rounded-full" />

      <div className="w-full max-w-sm space-y-8 relative z-10">
        
        {/* Header / Logo */}
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="relative group">
            <div className="absolute inset-0 bg-[#FF3131] blur-2xl opacity-20 group-hover:opacity-40 transition-opacity" />
            <div className="bg-[#0a0a0a] border border-white/10 p-6 rounded-[35px] relative shadow-2xl">
              <Dumbbell className="text-[#FF3131]" size={48} />
            </div>
          </div>
          
          <div className="space-y-2">
            <h1 className="text-5xl font-black text-white italic uppercase tracking-tighter leading-none">
              Full Train <span className="text-[#FF3131]">APP</span>
            </h1>
            <p className="text-gray-500 text-[10px] font-black uppercase tracking-[5px] italic">
              Exclusiva Qst-Gym Argentina
            </p>
          </div>
        </div>

        {/* Card Principal */}
        <div className="bg-[#0a0a0a] border border-white/5 p-6 rounded-[45px] shadow-2xl shadow-black relative overflow-hidden">
          {/* Línea decorativa superior */}
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[#FF3131]/40 to-transparent" />
          
          <form onSubmit={handleSubmit} className="space-y-6">
            
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Email del Atleta</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-[#FF3131] transition-colors" size={18} />
                <input
                  type="email"
                  className="w-full bg-black border border-white/5 rounded-2xl p-4 pl-12 text-white text-sm focus:border-[#FF3131]/50 outline-none transition-all placeholder:text-gray-800"
                  placeholder="ejemplo@gym.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Contraseña</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-[#FF3131] transition-colors" size={18} />
                <input
                  type="password"
                  className="w-full bg-black border border-white/5 rounded-2xl p-4 pl-12 text-white text-sm focus:border-[#FF3131]/50 outline-none transition-all placeholder:text-gray-800"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loadingLocal}
              className="w-full bg-[#FF3131] hover:bg-[#E22A2A] text-white font-black py-4 rounded-2xl uppercase italic tracking-wider transition-all active:scale-95 shadow-xl shadow-[#FF3131]/20 flex items-center justify-center gap-2 mt-2"
            >
              {loadingLocal ? <Loader2 className="animate-spin" size={20} /> : "INICIAR ENTRENAMIENTO"}
            </button>
          </form>

          {/* BOTÓN RESET CENTRADO Y LINDO */}
          <div className="mt-8 flex justify-center">
            <button
              type="button"
              onClick={handleResetPassword}
              className="text-[11px] font-black text-white/30 hover:text-[#FF3131] uppercase tracking-[2px] transition-all italic border-b-2 border-transparent hover:border-[#FF3131]/30 pb-1"
            >
              ¿Olvidaste tu contraseña?
            </button>
          </div>
        </div>
          
        <p className="text-center text-gray-700 text-[10px] font-bold uppercase tracking-[3px]">
          QST-GYM <span className="text-white/20">|</span> <span className="text-gray-500 italic">GST v1.0</span>
        </p>
      </div>

      {/* AVISO TOAST DE EMAIL ENVIADO */}
      {resetSent && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-white text-black px-6 py-4 rounded-2xl flex items-center gap-4 shadow-[0_20px_50px_rgba(0,0,0,0.5)] border-l-4 border-[#FF3131] animate-in slide-in-from-bottom-10 fade-in duration-500 z-[100]">
          <div className="bg-[#FF3131]/10 p-2 rounded-full">
            <CheckCircle2 size={20} className="text-[#FF3131]" />
          </div>
          <div>
            <p className="font-black text-[11px] uppercase tracking-tighter">Email Enviado</p>
            <p className="text-[9px] font-bold text-gray-500 uppercase">Revisá tu bandeja de entrada o spam</p>
          </div>
        </div>
      )}
    </div>
  );
}