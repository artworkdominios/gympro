import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Dumbbell, Mail, Lock, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loadingLocal, setLoadingLocal] = useState(false);
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

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6 relative overflow-hidden">
      
      {/* Luces de fondo */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#FF3131]/5 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#FF3131]/5 blur-[120px] rounded-full" />

      <div className="w-full max-w-sm space-y-8 relative z-10">
        
        {/* SECCIÓN LOGO */}
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="relative group">
            <div className="absolute inset-0 bg-[#FF3131] blur-2xl opacity-20 group-hover:opacity-40 transition-opacity" />
            <div className="bg-[#0a0a0a] border border-white/10 p-5 rounded-[30px] relative shadow-2xl">
              {/* --- LOGO --- */}
              {/* <img src="/tu-logo.png" className="w-20 h-20 object-contain" alt="Logo" /> */}
              <Dumbbell className="text-[#FF3131]" size={42} />
              {/* ---------------------------- */}
            </div>
          </div>
          
          <div className="space-y-2">
            <h1 className="text-5xl font-black text-white italic uppercase tracking-tighter leading-none">
            Full Train <span className="text-[#FF3131]">APP</span>
            </h1>
            <p className="text-gray-500 text-[10px] font-black uppercase tracking-[4px] italic">
             Exclusiva para Qst-Gym Argentina
            </p>
          </div>
        </div>

        {/* FORMULARIO */}
        <div className="bg-[#0a0a0a] border border-white/5 p-5 rounded-[40px] shadow-2xl shadow-black">
          <form onSubmit={handleSubmit} className="space-y-5">
            
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Ingresa tu email</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-[#FF3131] transition-colors" size={18} />
                <input
                  type="text"
                  className="w-full bg-black border border-white/5 rounded-2xl p-4 pl-12 text-white text-sm focus:border-[#FF3131]/50 outline-none transition-all placeholder:text-gray-800"
                  placeholder="ejemplo@gym.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Contraseña</label>
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
              className="w-full bg-[#FF3131] hover:bg-[#D72626] text-white font-black py-4 rounded-2xl uppercase italic tracking-wider transition-all active:scale-95 shadow-lg shadow-[#FF3131]/10 flex items-center justify-center gap-2"
            >
              {loadingLocal ? <Loader2 className="animate-spin" size={20} /> : "ENTRAR"}
            </button>
          </form>
        </div>

        <p className="text-center text-gray-600 text-[9px] font-bold uppercase tracking-widest">
        QST-GYM Mediante <span className="text-white">APP GST</span> v1.0
        </p>
      </div>
    </div>
  );
}