import { useState, useEffect } from 'react';
import { db, auth } from '../lib/firebase'; 
import { 
  collection, 
  onSnapshot, 
  query, 
  where, 
  doc, 
  updateDoc, 
  setDoc, 
  getDocs,
  serverTimestamp 
} from 'firebase/firestore';
import { 
  createUserWithEmailAndPassword, 
  signOut, 
  getAuth 
} from 'firebase/auth';
import { initializeApp, getApps } from 'firebase/app';
import { 
  Search, 
  UserPlus, 
  MoreVertical, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  HeartPulse, 
  Mail, 
  Lock 
} from 'lucide-react';

// Configuración de Auth secundaria (Igual que en UsuariosPage)
const firebaseConfig = auth.app.options;
const secondaryApp = getApps().find(app => app.name === "Secondary") 
                     || initializeApp(firebaseConfig, "Secondary");
const secondaryAuth = getAuth(secondaryApp);

export default function AlumnosPage() {
  const [alumnos, setAlumnos] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAlumno, setSelectedAlumno] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [features, setFeatures] = useState({ aptoMedicoEnabled: false });
  
  // Estados del Formulario
  const [editNombre, setEditNombre] = useState('');
  const [editDni, setEditDni] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editFecha, setEditFecha] = useState('');
  const [editApto, setEditApto] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Escuchar configuración de apto médico
    const unsubConfig = onSnapshot(doc(db, "configuracion", "features"), (snap) => {
      if (snap.exists()) setFeatures(snap.data());
    });

    // Escuchar solo alumnos en tiempo real
    const q = query(collection(db, "users"), where("role", "==", "alumno"));
    const unsubAlumnos = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAlumnos(docs);
    });

    return () => { unsubConfig(); unsubAlumnos(); };
  }, []);

  const getEstadoData = (fechaVencimiento, fechaApto) => {
    const hoy = new Date();
    let cuota = { label: 'VIGENTE', color: 'text-green-500', bg: 'bg-green-500/10', icon: <CheckCircle2 size={12}/> };
    
    if (!fechaVencimiento) {
      cuota = { label: 'SIN FECHA', color: 'text-gray-500', bg: 'bg-gray-500/10', icon: null };
    } else if (new Date(fechaVencimiento) < hoy) {
      cuota = { label: 'VENCIDO', color: 'text-[#FF3131]', bg: 'bg-red-500/10', icon: <AlertCircle size={12}/> };
    }

    let apto = { label: 'OK', color: 'text-gray-500', alerta: false };
    if (features.aptoMedicoEnabled && fechaApto) {
      const vencApto = new Date(fechaApto);
      const diffDays = Math.ceil((vencApto - hoy) / (1000 * 60 * 60 * 24));
      if (diffDays <= 0) apto = { label: 'APTO VENCIDO', color: 'text-[#FF3131]', alerta: true };
      else if (diffDays <= 30) apto = { label: `VENCE EN ${diffDays} DÍAS`, color: 'text-yellow-500', alerta: true };
    } else if (features.aptoMedicoEnabled && !fechaApto) {
      apto = { label: 'PENDIENTE', color: 'text-gray-600', alerta: true };
    }
    return { cuota, apto };
  };

  const handleOpenNew = () => {
    setSelectedAlumno(null);
    setEditNombre('');
    setEditDni('');
    setEditEmail('');
    setEditPassword('');
    setEditFecha('');
    setEditApto('');
    setIsModalOpen(true);
  };

  const openModal = (alumno) => {
    setSelectedAlumno(alumno);
    setEditNombre(alumno.nombre || '');
    setEditDni(alumno.dni || '');
    setEditEmail(alumno.email || '');
    setEditPassword(''); 
    setEditFecha(alumno.fecha_vencimiento || '');
    setEditApto(alumno.fecha_apto || '');
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    if (!editNombre || !editDni || !editEmail) return alert("Nombre, DNI e Email son obligatorios");
    
    setLoading(true);
    try {
      const payload = {
        nombre: editNombre.toUpperCase().trim(),
        dni: editDni.trim(),
        email: editEmail.toLowerCase().trim(),
        fecha_vencimiento: editFecha,
        fecha_apto: editApto,
        role: 'alumno', // Rol fijo como pediste
        updatedAt: serverTimestamp()
      };

      if (selectedAlumno?.id) {
        // ACTUALIZACIÓN DE ALUMNO EXISTENTE
        await updateDoc(doc(db, "users", selectedAlumno.id), payload);
        alert("Alumno actualizado correctamente");
      } else {
        // ALTA DE NUEVO ALUMNO (Lógica UsuariosPage)
        if (!editPassword) throw new Error("La contraseña es obligatoria");

        // 1. Verificar DNI duplicado
        const qDni = query(collection(db, "users"), where("dni", "==", editDni.trim()));
        const dniCheck = await getDocs(qDni);
        if (!dniCheck.empty) throw new Error("Este DNI ya está registrado en el sistema.");

        // 2. Crear en Firebase Auth (Vía App Secundaria para no desloguearte)
        const userCredential = await createUserWithEmailAndPassword(secondaryAuth, editEmail.trim(), editPassword);
        const newUid = userCredential.user.uid;

        // 3. Crear documento en Firestore usando el mismo UID
        await setDoc(doc(db, "users", newUid), {
          ...payload,
          createdAt: serverTimestamp()
        });

        // 4. Limpiar Auth secundario
        await signOut(secondaryAuth);
        alert(`¡ÉXITO! Alumno ${editNombre.toUpperCase()} creado.`);
      }

      setIsModalOpen(false);
    } catch (error) {
      console.error("Error al guardar:", error);
      alert("ERROR: " + error.message);
    } finally { 
      setLoading(false); 
    }
  };

  const filteredAlumnos = alumnos.filter(alumno => {
    const term = searchTerm.toLowerCase();
    const { cuota, apto } = getEstadoData(alumno.fecha_vencimiento, alumno.fecha_apto);
    return (
      alumno.nombre?.toLowerCase().includes(term) ||
      alumno.dni?.toString().includes(term) ||
      alumno.email?.toLowerCase().includes(term) ||
      cuota.label.toLowerCase().includes(term) ||
      apto.label.toLowerCase().includes(term)
    );
  });

  return (
    <div className="animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
        <div>
          <h1 className="text-4xl font-black text-white italic tracking-tighter uppercase">
            Gestión de <span className="text-[#FF3131]">Alumnos</span>
          </h1>
          <p className="text-gray-500 text-[10px] font-bold uppercase tracking-[3px]">Panel Administrativo</p>
        </div>
        <button onClick={handleOpenNew} className="bg-white text-black font-black px-6 py-3 rounded-2xl flex items-center gap-2 uppercase text-[10px] hover:bg-[#FF3131] hover:text-white transition-all shadow-lg">
          <UserPlus size={16} /> Nuevo Alumno
        </button>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
        <input 
          type="text"
          placeholder="BUSCAR POR NOMBRE, DNI, EMAIL O ESTADO..."
          className="w-full bg-[#0a0a0a] border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white text-[10px] font-bold tracking-widest focus:border-[#FF3131] outline-none transition-all"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="bg-[#0a0a0a] border border-white/5 rounded-[32px] overflow-hidden shadow-2xl">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/5 bg-white/5">
              <th className="p-6 text-[9px] font-black text-gray-400 uppercase tracking-widest">Alumno / Detalles</th>
              <th className="p-6 text-[9px] font-black text-gray-400 uppercase tracking-widest">Estado Cuota</th>
              {features.aptoMedicoEnabled && <th className="p-6 text-[9px] font-black text-gray-400 uppercase tracking-widest">Apto Médico</th>}
              <th className="p-6 text-[9px] font-black text-gray-400 uppercase tracking-widest text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filteredAlumnos.map((alumno) => {
              const { cuota, apto } = getEstadoData(alumno.fecha_vencimiento, alumno.fecha_apto);
              return (
                <tr key={alumno.id} className="hover:bg-white/[0.02] transition-colors group">
                  <td className="p-6">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-gradient-to-br from-[#FF3131] to-[#b31d1d] rounded-xl flex items-center justify-center text-white font-black italic">
                        {alumno.nombre?.charAt(0)}
                      </div>
                      <div>
                        <p className="text-white font-bold text-sm uppercase italic">{alumno.nombre}</p>
                        <p className="text-gray-500 text-[9px] font-bold italic tracking-widest">DNI: {alumno.dni} | {alumno.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-6">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[8px] font-black ${cuota.bg} ${cuota.color}`}>
                      {cuota.icon} {cuota.label}
                    </span>
                  </td>
                  {features.aptoMedicoEnabled && (
                    <td className="p-6">
                      <div className={`flex items-center gap-2 text-[10px] font-bold ${apto.color}`}>
                        <HeartPulse size={14} className={apto.alerta ? "animate-pulse" : ""} />
                        {apto.label}
                      </div>
                    </td>
                  )}
                  <td className="p-6 text-right">
                    <button onClick={() => openModal(alumno)} className="text-gray-500 hover:text-white p-2">
                      <MoreVertical size={20} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm">
          <div className="bg-[#111] border border-white/10 w-full max-w-lg rounded-[40px] overflow-hidden shadow-2xl animate-in zoom-in-95">
            <div className="p-8 bg-gradient-to-r from-[#FF3131]/10 to-transparent border-b border-white/5 flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter">{selectedAlumno ? 'Perfil Alumno' : 'Nuevo Alumno'}</h2>
                <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">Acceso y Datos Personales</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-white"><X size={24} /></button>
            </div>

            <form onSubmit={handleSave} className="p-8 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[8px] font-black text-[#FF3131] uppercase tracking-[2px]">Nombre Completo</label>
                  <input type="text" value={editNombre} onChange={(e) => setEditNombre(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white text-xs font-bold outline-none focus:border-[#FF3131]" required />
                </div>
                <div className="space-y-1">
                  <label className="text-[8px] font-black text-[#FF3131] uppercase tracking-[2px]">DNI</label>
                  <input type="text" value={editDni} onChange={(e) => setEditDni(e.target.value.replace(/\D/g, ''))} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white text-xs font-bold outline-none focus:border-[#FF3131]" required />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[8px] font-black text-[#FF3131] uppercase tracking-[2px]">Email de Acceso</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" size={14} />
                  <input type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 pl-10 text-white text-xs font-bold outline-none focus:border-[#FF3131]" required />
                </div>
              </div>

              {!selectedAlumno && (
                <div className="space-y-1">
                  <label className="text-[8px] font-black text-[#FF3131] uppercase tracking-[2px]">Contraseña Temporal</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" size={14} />
                    <input type="password" value={editPassword} onChange={(e) => setEditPassword(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 pl-10 text-white text-xs font-bold outline-none focus:border-[#FF3131]" required={!selectedAlumno} />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[8px] font-black text-[#FF3131] uppercase tracking-[2px]">Venc. Cuota</label>
                  <input type="date" value={editFecha} onChange={(e) => setEditFecha(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white text-xs font-bold outline-none focus:border-[#FF3131]" required />
                </div>
                <div className="space-y-1">
                  <label className="text-[8px] font-black text-[#FF3131] uppercase tracking-[2px]">Venc. Apto</label>
                  <input type="date" value={editApto} onChange={(e) => setEditApto(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white text-xs font-bold outline-none focus:border-[#FF3131]" />
                </div>
              </div>

              <div className="p-8 bg-white/[0.02] border-t border-white/5 flex gap-3 -mx-8 -mb-8 mt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 bg-white/5 text-white font-black py-4 rounded-2xl uppercase text-[10px]">Cancelar</button>
                <button type="submit" disabled={loading} className="flex-1 bg-[#FF3131] text-white font-black py-4 rounded-2xl uppercase text-[10px] shadow-[0_0_20px_rgba(255,49,49,0.3)] disabled:opacity-50">
                  {loading ? 'PROCESANDO...' : selectedAlumno ? 'GUARDAR' : 'CREAR'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}