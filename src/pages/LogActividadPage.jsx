import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, query, orderBy, limit, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { Timer, User, CheckCircle2, Trash2, Calendar, Trophy } from 'lucide-react';

export default function LogActividadPage() {
  const { user } = useAuth();
  const role = user?.role?.toLowerCase().trim();
  const esPoder = role === 'admin' || role === 'administrador' || role === 'manager';

  const [actividades, setActividades] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Traemos los últimos 50 entrenamientos finalizados
    const q = query(
      collection(db, "asistencia_entrenamientos"),
      orderBy("fecha", "desc"),
      limit(50)
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(d => ({
        id: d.id,
        ...d.data(),
        // Convertimos el timestamp de Firebase a objeto Date de JS
        fechaFormateada: d.data().fecha?.toDate() 
      }));
      setActividades(docs);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  const borrarLog = async (id) => {
    if (!esPoder) return;
    if (window.confirm("¿BORRAR ESTE REGISTRO DE ACTIVIDAD?")) {
      await deleteDoc(doc(db, "asistencia_entrenamientos", id));
    }
  };

  if (loading) return <div className="p-20 text-center text-[#FF3131] font-black uppercase italic">Sincronizando Feed...</div>;

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in duration-700">
      <header className="mb-10">
        <h1 className="text-4xl font-black italic text-white uppercase tracking-tighter">
        Registro de <span className="text-[#FF3131]">ACTIVIDAD</span>
        </h1>
        <p className="text-gray-500 text-[10px] font-black uppercase tracking-[4px] mt-2 italic">Control de asistencia en tiempo real</p>
      </header>

      <div className="space-y-4">
        {actividades.length === 0 ? (
          <div className="bg-[#0a0a0a] border border-white/5 p-20 rounded-[40px] text-center">
            <Calendar className="mx-auto text-gray-800 mb-4" size={48} />
            <p className="text-gray-500 font-bold uppercase text-xs tracking-widest">Aún no hay entrenamientos registrados hoy</p>
          </div>
        ) : (
          actividades.map((act) => (
            <div key={act.id} className="bg-[#0a0a0a] border border-white/5 p-6 rounded-[32px] hover:border-[#FF3131]/30 transition-all group relative">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                
                {/* Info del Alumno */}
                <div className="flex items-center gap-4">
                  <div className="bg-gradient-to-br from-[#FF3131] to-[#800000] p-3 rounded-2xl shadow-[0_0_15px_rgba(255,49,49,0.2)]">
                    <User size={20} className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-white font-black uppercase italic text-sm tracking-tight">
                      {act.alumnoNombre}
                    </h3>
                    <div className="flex items-center gap-2 text-gray-500 text-[9px] font-black uppercase mt-1">
                      <Timer size={10} className="text-[#FF3131]" />
                      {act.fechaFormateada ? act.fechaFormateada.toLocaleString() : 'Recién ahora'}
                    </div>
                  </div>
                </div>

                {/* Status del Entrenamiento */}
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <div className="flex items-center gap-2 justify-end">
                      <Trophy size={14} className="text-yellow-500" />
                      <span className="text-white font-black text-xs italic uppercase">
                        {act.ejerciciosRealizados?.length} / {act.totalEjercicios || '?'} Ejs
                      </span>
                    </div>
                    <p className="text-[8px] text-gray-600 font-black uppercase tracking-widest mt-1">Rutina Completada</p>
                  </div>

                  {/* Botón Borrar (Solo Admin/Manager) */}
                  {esPoder && (
                    <button 
                      onClick={() => borrarLog(act.id)}
                      className="text-gray-800 hover:text-[#FF3131] transition-colors p-2"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>

              {/* Lista desplegable de qué ejercicios hizo (opcional visual) */}
              <div className="mt-4 flex flex-wrap gap-2 pt-4 border-t border-white/5">
                {act.ejerciciosRealizados?.map((ej, i) => (
                  <span key={i} className="bg-white/5 text-gray-400 text-[8px] font-black px-2 py-1 rounded-md uppercase flex items-center gap-1">
                    <CheckCircle2 size={8} className="text-[#FF3131]" /> {ej}
                  </span>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}