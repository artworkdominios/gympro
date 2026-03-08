import { useState, useEffect } from 'react';
import { User, Mail, Lock, Key, RefreshCcw } from 'lucide-react';
import { auth, db } from '../lib/firebase'; 
import { createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { doc, setDoc, collection, getDocs, query, orderBy } from 'firebase/firestore';

export default function UsuariosPage() {
  const [loading, setLoading] = useState(false);
  const [usuarios, setUsuarios] = useState([]); // Estado para la lista de usuarios
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    password: '',
    role: 'alumno'
  });

  // 1. Función para obtener los usuarios de Firestore
  const fetchUsuarios = async () => {
    try {
      const q = query(collection(db, "users"), orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);
      const lista = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUsuarios(lista);
    } catch (err) {
      console.error("Error al obtener usuarios:", err);
    }
  };

  useEffect(() => {
    fetchUsuarios();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;

      await setDoc(doc(db, "users", user.uid), {
        nombre: formData.nombre.toUpperCase(),
        email: formData.email,
        role: formData.role,
        createdAt: new Date()
      });

      alert(`¡ÉXITO! Usuario ${formData.nombre} creado.`);
      setFormData({ nombre: '', email: '', password: '', role: 'alumno' });
      fetchUsuarios(); // Recargamos la lista automáticamente
    } catch (err) {
      alert("Error al crear: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // 2. FUNCIÓN PARA RESETEAR CONTRASEÑA
  const handleResetPassword = async (email) => {
    if (!window.confirm(`¿Enviar correo de recuperación a ${email}?`)) return;
    
    try {
      await sendPasswordResetEmail(auth, email);
      alert("Email de restablecimiento enviado. El usuario deberá seguir las instrucciones en su correo.");
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  return (
    <div className="max-w-6xl animate-in fade-in duration-500">
      <header className="mb-8">
        <h1 className="text-4xl font-black italic text-white uppercase tracking-tighter">
          Gestión de <span className="text-[#FF3131]">Usuarios</span>
        </h1>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* COLUMNA IZQUIERDA: FORMULARIO */}
        <form onSubmit={handleSubmit} className="bg-[#0a0a0a] border border-white/5 p-8 rounded-2xl space-y-6 h-fit">
          <h2 className="text-white font-black uppercase text-sm italic border-l-4 border-[#FF3131] pl-3">Registrar Nuevo</h2>
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest">Nombre</label>
              <div className="relative mt-2">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" size={18} />
                <input type="text" value={formData.nombre} className="w-full bg-black border border-white/10 rounded-xl py-3 pl-10 text-white outline-none focus:border-[#FF3131]" placeholder="NOMBRE" onChange={(e) => setFormData({...formData, nombre: e.target.value})} required />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest">Email</label>
              <div className="relative mt-2">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" size={18} />
                <input type="email" value={formData.email} className="w-full bg-black border border-white/10 rounded-xl py-3 pl-10 text-white outline-none focus:border-[#FF3131]" placeholder="EMAIL" onChange={(e) => setFormData({...formData, email: e.target.value})} required />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest">Contraseña Temporal</label>
              <div className="relative mt-2">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" size={18} />
                <input type="password" value={formData.password} className="w-full bg-black border border-white/10 rounded-xl py-3 pl-10 text-white outline-none focus:border-[#FF3131]" placeholder="MÍN. 6 CARACTERES" onChange={(e) => setFormData({...formData, password: e.target.value})} required />
              </div>
            </div>
          </div>

          <div>
            <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest">Rol</label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {['administrador', 'manager', 'profesor', 'alumno'].map((r) => (
                <button key={r} type="button" onClick={() => setFormData({...formData, role: r})} className={`p-2 rounded-lg text-[9px] font-bold uppercase border transition-all ${formData.role === r ? 'bg-[#FF3131] border-[#FF3131] text-white' : 'bg-black border-white/5 text-gray-500 hover:border-white/20'}`}>
                  {r}
                </button>
              ))}
            </div>
          </div>

          <button type="submit" disabled={loading} className="w-full bg-white text-black font-black py-4 rounded-xl uppercase italic hover:bg-[#FF3131] hover:text-white transition-all">
            {loading ? 'CREANDO...' : 'CREAR USUARIO'}
          </button>
        </form>

        {/* COLUMNA DERECHA: LISTADO Y ACCIONES */}
        <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl flex flex-col overflow-hidden h-[600px]">
          <div className="p-4 border-b border-white/5 flex justify-between items-center bg-white/5">
            <h2 className="text-white font-black uppercase text-xs italic tracking-widest">Usuarios en Sistema</h2>
            <button onClick={fetchUsuarios} className="text-gray-500 hover:text-white transition-colors">
              <RefreshCcw size={16} />
            </button>
          </div>
          
          <div className="overflow-y-auto flex-1 custom-scrollbar">
            {usuarios.map((u) => (
              <div key={u.id} className="p-4 border-b border-white/5 hover:bg-white/[0.02] flex items-center justify-between group">
                <div className="flex flex-col">
                  <span className="text-white font-bold text-sm uppercase tracking-tight">{u.nombre}</span>
                  <span className="text-gray-500 text-[10px] lowercase">{u.email}</span>
                  <div className="mt-1">
                    <span className="px-2 py-0.5 rounded bg-[#FF3131]/10 text-[#FF3131] text-[8px] font-black uppercase border border-[#FF3131]/20">
                      {u.role}
                    </span>
                  </div>
                </div>
                
                <button 
                  onClick={() => handleResetPassword(u.email)}
                  className="p-3 bg-orange-500/10 text-orange-500 rounded-xl hover:bg-orange-500 hover:text-white transition-all shadow-lg"
                  title="Resetear Contraseña"
                >
                  <Key size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}