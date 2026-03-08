import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { signIn, user } = useAuth();
  const navigate = useNavigate();

  // Si ya hay usuario, mandarlo al dashboard automáticamente
  useEffect(() => {
    if (user) navigate('/');
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await signIn(email, password);
      navigate('/'); // Redirigir tras éxito
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#0a0a0a] border border-[#FF3131]/20 p-8 rounded-2xl">
        <h1 className="text-4xl font-black italic text-[#FF3131] text-center mb-8 tracking-tighter">QSTGYM</h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Email</label>
            <input 
              type="email" 
              className="w-full bg-black border border-white/10 rounded-lg p-3 text-white focus:border-[#FF3131] outline-none"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Contraseña</label>
            <input 
              type="password" 
              className="w-full bg-black border border-white/10 rounded-lg p-3 text-white focus:border-[#FF3131] outline-none"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="w-full bg-[#FF3131] text-white font-black py-3 rounded-lg uppercase italic hover:bg-red-700 transition-all">
            Entrar
          </button>
        </form>
      </div>
    </div>
  );
}