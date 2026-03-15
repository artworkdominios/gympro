import { useState, useEffect } from 'react';
import { User, Mail, Lock, Key, RefreshCcw, CreditCard, Search, ShieldAlert, Trash2, Calendar } from 'lucide-react'; 
import { db, auth } from '../lib/firebase'; 
import { createUserWithEmailAndPassword, sendPasswordResetEmail, signOut, getAuth } from 'firebase/auth';
import { doc, setDoc, collection, getDocs, query, orderBy, where, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { initializeApp, getApps } from 'firebase/app';

// Configuración de Auth secundaria para no cerrar la sesión del Admin actual
const firebaseConfig = auth.app.options;
const secondaryApp = getApps().find(app => app.name === "Secondary") 
                     || initializeApp(firebaseConfig, "Secondary");
const secondaryAuth = getAuth(secondaryApp);

export default function UsuariosPage() {
  const [loading, setLoading] = useState(false);
  const [usuarios, setUsuarios] = useState([]); 
  const [busqueda, setBusqueda] = useState('');
  const [formData, setFormData] = useState({
    nombre: '',
    dni: '',
    email: '',
    password: '',
    role: 'alumno',
    fecha_pago: new Date().toISOString().split('T')[0],
    fecha_vencimiento: ''
  });

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
      // 1. Verificación de DNI duplicado
      const qDni = query(collection(db, "users"), where("dni", "==", formData.dni));
      const dniCheck = await getDocs(qDni);
      if (!dniCheck.empty) throw new Error("Este DNI ya está registrado.");

      // 2. Crear usuario en Auth (App secundaria)
      const userCredential = await createUserWithEmailAndPassword(secondaryAuth, formData.email, formData.password);
      const newUser = userCredential.user;

      // 3. Preparar data para Firestore
      const userData = {
        nombre: formData.nombre.toUpperCase().trim(),
        dni: formData.dni.trim(),
        email: formData.email.toLowerCase().trim(),
        role: formData.role,
        createdAt: serverTimestamp(),
        // Agregamos un campo de búsqueda normalizado por si acaso
        searchName: formData.nombre.toLowerCase()
      };

      if (formData.role === 'alumno') {
        userData.fecha_pago = formData.fecha_pago;
        userData.fecha_vencimiento = formData.fecha_vencimiento;
      }

      // 4. Guardar en Firestore y desloguear la app secundaria
      await setDoc(doc(db, "users", newUser.uid), userData);
      await signOut(secondaryAuth);

      alert(`¡ÉXITO! ${formData.nombre} registrado.`);
      
      // Reset Form
      setFormData({ 
        nombre: '', dni: '', email: '', password: '', role: 'alumno', 
        fecha_pago: new Date().toISOString().split('T')[0], fecha_vencimiento: '' 
      });
      
      fetchUsuarios(); 
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (email) => {
    if (!window.confirm(`¿Enviar correo de recuperación a ${email}?`)) return;
    try {
      await sendPasswordResetEmail(auth, email);
      alert("Email de recuperación enviado correctamente.");
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  const handleDelete = async (id, nombre) => {
    if (!window.confirm(`¿ESTÁS SEGURO? Se eliminará a ${nombre}. Esta acción no borra las credenciales de Auth, solo el perfil de Firestore.`)) return;
    try {
      await deleteDoc(doc(db, "users", id));
      fetchUsuarios();
    } catch (err) {
      alert("Error al eliminar: " + err.message);
    }
  };

  const usuariosFiltrados = usuarios.filter(u => 
    u.nombre?.toLowerCase().includes(busqueda.toLowerCase()) || 
    u.dni?.includes(busqueda) || 
    u.email?.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="max-w-6xl animate-in fade-in duration-500 mx-auto p-4">
      {/* HEADER */}
      <header className="mb-8 flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-black italic text-white uppercase tracking-tighter">
            Gestión de <span className="text-[#FF3131]">Usuarios</span>
          </h1>
          <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mt-1">Admin Panel QSTGYM</p>
        </div>
        <div className="flex items-center gap-2 bg-[#FF3131]/10 px-4 py-2 rounded-xl border border-[#FF3131]/20">
          <ShieldAlert size={14} className="text-[#FF3131]" />
          <span className="text-[10px] text-white font-black uppercase italic">Sesión Administrador</span>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* FORMULARIO DE ALTA */}
        <form onSubmit={handleSubmit} className="bg-[#0a0a0a] border border-white/5 p-8 rounded-3xl space-y-6 h-fit shadow-2xl">
          <h2 className="text-white font-black uppercase text-sm italic border-l-4 border-[#FF3131] pl-3">Alta de Usuario</h2>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-gray-500 ml-1 tracking-tighter">Nombre Completo</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" size={16} />
                  <input type="text" value={formData.nombre} className="w-full bg-black border border-white/10 rounded-xl py-4 pl-10 text-white text-xs font-bold outline-none focus:border-[#FF3131]" placeholder="NOMBRE" onChange={(e) => setFormData({...formData, nombre: e.target.value})} required />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-gray-500 ml-1 tracking-tighter">DNI</label>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" size={16} />
                  <input type="text" value={formData.dni} className="w-full bg-black border border-white/10 rounded-xl py-4 pl-10 text-white text-xs font-bold outline-none focus:border-[#FF3131]" placeholder="DNI" onChange={(e) => setFormData({...formData, dni: e.target.value})} required />
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-gray-500 ml-1 tracking-tighter">Email de acceso</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" size={16} />
                <input type="email" value={formData.email} className="w-full bg-black border border-white/10 rounded-xl py-4 pl-10 text-white text-xs font-bold outline-none focus:border-[#FF3131]" placeholder="EMAIL" onChange={(e) => setFormData({...formData, email: e.target.value})} required />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-gray-500 ml-1 tracking-tighter">Contraseña Temporal</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" size={16} />
                <input type="password" value={formData.password} className="w-full bg-black border border-white/10 rounded-xl py-4 pl-10 text-white text-xs font-bold outline-none focus:border-[#FF3131]" placeholder="MÍN. 6 CARACTERES" onChange={(e) => setFormData({...formData, password: e.target.value})} required />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-gray-500 ml-1 tracking-tighter">Asignar Rol</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {['administrador', 'manager', 'profesor', 'alumno'].map((r) => (
                <button key={r} type="button" onClick={() => setFormData({...formData, role: r})} className={`p-2.5 rounded-xl text-[8px] font-black uppercase border transition-all ${formData.role === r ? 'bg-[#FF3131] border-[#FF3131] text-white shadow-lg' : 'bg-black border-white/5 text-gray-600 hover:border-white/20'}`}>
                  {r}
                </button>
              ))}
            </div>
          </div>

          {formData.role === 'alumno' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-white/5 animate-in slide-in-from-top-2">
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-[#FF3131] flex items-center gap-1 tracking-widest"><Calendar size={10}/> Fecha de Pago</label>
                <input type="date" className="w-full bg-black border border-white/10 rounded-xl p-3 text-white text-xs font-bold outline-none focus:border-[#FF3131]" value={formData.fecha_pago} onChange={e => setFormData({...formData, fecha_pago: e.target.value})} required />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-[#FF3131] flex items-center gap-1 tracking-widest"><Calendar size={10}/> Vencimiento</label>
                <input type="date" className="w-full bg-black border border-white/10 rounded-xl p-3 text-white text-xs font-bold outline-none focus:border-[#FF3131]" value={formData.fecha_vencimiento} onChange={e => setFormData({...formData, fecha_vencimiento: e.target.value})} required />
              </div>
            </div>
          )}

          <button type="submit" disabled={loading} className="w-full bg-white text-black font-black py-5 rounded-2xl uppercase italic hover:bg-[#FF3131] hover:text-white transition-all transform active:scale-95 shadow-xl shadow-white/5 disabled:opacity-50">
            {loading ? 'REGISTRANDO...' : 'CREAR USUARIO 🔥'}
          </button>
        </form>

        {/* LISTA DE USUARIOS */}
        <div className="bg-[#0a0a0a] border border-white/5 rounded-3xl flex flex-col overflow-hidden h-[700px] shadow-2xl">
          <div className="p-6 border-b border-white/5 bg-white/5 space-y-4">
            <div className="flex justify-between items-center px-1">
              <h2 className="text-white font-black uppercase text-[10px] italic tracking-widest text-gray-400">Usuarios Activos</h2>
              <button onClick={fetchUsuarios} className="text-gray-500 hover:text-[#FF3131] transition-all"><RefreshCcw size={16} /></button>
            </div>
            
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#FF3131]" size={18} />
              <input type="text" placeholder="BUSCAR NOMBRE, DNI O EMAIL..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} className="w-full bg-black border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white text-[10px] font-black uppercase outline-none focus:border-[#FF3131]" />
            </div>
          </div>
          
          <div className="overflow-y-auto flex-1 custom-scrollbar">
            {usuariosFiltrados.length > 0 ? (
              usuariosFiltrados.map((u) => (
                <div key={u.id} className="p-5 border-b border-white/5 hover:bg-white/[0.02] flex items-center justify-between group transition-all">
                  <div className="flex flex-col gap-1">
                    <span className="text-white font-bold text-sm uppercase tracking-tight group-hover:text-[#FF3131] transition-colors">{u.nombre}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600 text-[10px] font-medium">{u.email}</span>
                      <span className="text-gray-400 text-[9px] font-black uppercase italic bg-white/5 px-2 py-0.5 rounded">DNI: {u.dni || 'S/D'}</span>
                    </div>
                    {u.role === 'alumno' && u.fecha_vencimiento && (
                      <span className="text-[8px] font-black text-[#FF3131] uppercase">Vence: {u.fecha_vencimiento}</span>
                    )}
                    <div className="mt-2">
                      <span className="px-2 py-0.5 rounded-lg bg-[#FF3131]/10 text-[#FF3131] text-[8px] font-black uppercase border border-[#FF3131]/20">
                        {u.role}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleResetPassword(u.email)} title="Reset Password" className="p-3 bg-orange-500/10 text-orange-500 rounded-xl hover:bg-orange-500 hover:text-white transition-all transform hover:rotate-6"><Key size={18} /></button>
                    <button onClick={() => handleDelete(u.id, u.nombre)} title="Eliminar" className="p-3 bg-[#FF3131]/10 text-[#FF3131] rounded-xl hover:bg-[#FF3131] hover:text-white transition-all transform hover:-rotate-6"><Trash2 size={18} /></button>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-20 text-center text-gray-800 font-black uppercase italic text-xs tracking-widest">Sin resultados</div>
            )}
          </div>
        </div>
      </div>
      
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #1a1a1a; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #FF3131; }
      `}</style>
    </div>
  );
}