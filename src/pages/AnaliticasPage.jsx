import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import { Users, AlertCircle, HeartPulse, BarChart3, Dumbbell, Clock, UserMinus } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid, AreaChart, Area } from 'recharts';

export default function AnaliticasPage() {
  const [stats, setStats] = useState({ totalAlumnos: 0, cuotasVencidas: 0, aptosVencidos: 0 });
  const [afluenciaData, setAfluenciaData] = useState([]);
  const [horariosData, setHorariosData] = useState([]);
  const [ejerciciosData, setEjerciciosData] = useState([]);
  const [alumnosRiesgo, setAlumnosRiesgo] = useState([]);

  useEffect(() => {
    const hoy = new Date();
    const limiteInactividad = new Date();
    limiteInactividad.setDate(hoy.getDate() - 10);

    // 1. Usuarios y Lógica de Deserción
    const unsubUsers = onSnapshot(collection(db, "users"), (snapshot) => {
      let vencidas = 0;
      let aptos = 0;
      let total = 0;
      const listaRiesgo = [];

      snapshot.docs.forEach(doc => {
        const d = doc.data();
        if (d.role === 'alumno') {
          total++;
          if (d.fecha_vencimiento && new Date(d.fecha_vencimiento) < hoy) vencidas++;
          if (d.fecha_apto && new Date(d.fecha_apto) < hoy) aptos++;
          
          const ultimaAsis = d.ultima_asistencia?.toDate();
          if (!ultimaAsis || ultimaAsis < limiteInactividad) {
            listaRiesgo.push({ nombre: d.nombre, id: doc.id });
          }
        }
      });

      setStats({ totalAlumnos: total, cuotasVencidas: vencidas, aptosVencidos: aptos });
      setAlumnosRiesgo(listaRiesgo.slice(0, 6));
    });

    // 2. Procesar Asistencias (Lógica Diferenciada: Visitas vs Ejercicios)
    const unsubAsistencias = onSnapshot(collection(db, "asistencia_entrenamientos"), (snapshot) => {
      const docs = snapshot.docs.map(d => ({ ...d.data() }));
      
      const dias = ['DOM', 'LUN', 'MAR', 'MIE', 'JUE', 'VIE', 'SAB'];
      const conteoDias = dias.map(d => ({ name: d, visitas: 0 }));
      const conteoHoras = Array.from({ length: 24 }, (_, i) => ({ hora: `${i}hs`, cantidad: 0 }));
      const conteoEjercicios = {};

      const docsOrdenados = docs.sort((a, b) => a.fecha.toDate() - b.fecha.toDate());
      const ultimaVezAlumno = {}; 

      docsOrdenados.forEach(asistencia => {
        if (!asistencia.fecha || !asistencia.alumnoId) return;

        const fechaJs = asistencia.fecha.toDate();
        const alumnoId = asistencia.alumnoId;
        const timestampActual = fechaJs.getTime();
        
        const ultimaVez = ultimaVezAlumno[alumnoId] || 0;
        const esDuplicadoPorError = (timestampActual - ultimaVez) < 3600000; // 60 minutos

        // A. LÓGICA DE VISITA (Con Ventana de Seguridad)
        if (!esDuplicadoPorError) {
          conteoDias[fechaJs.getDay()].visitas++;
          conteoHoras[fechaJs.getHours()].cantidad++;
          ultimaVezAlumno[alumnoId] = timestampActual;
        }

        // B. LÓGICA DE EJERCICIOS (Sin Ventana - Se cuentan SIEMPRE)
        asistencia.ejerciciosRealizados?.forEach(ej => {
          const nombreClean = ej.toUpperCase().trim();
          conteoEjercicios[nombreClean] = (conteoEjercicios[nombreClean] || 0) + 1;
        });
      });

      setAfluenciaData(conteoDias);
      setHorariosData(conteoHoras.filter(h => parseInt(h.hora) >= 6 && parseInt(h.hora) <= 23));
      setEjerciciosData(Object.keys(conteoEjercicios)
        .map(key => ({ name: key, cantidad: conteoEjercicios[key] }))
        .sort((a, b) => b.cantidad - a.cantidad).slice(0, 5));
    });

    return () => { unsubUsers(); unsubAsistencias(); };
  }, []);

  return (
    <div className="animate-in fade-in duration-1000 pb-20 space-y-8">
      <header>
        <h1 className="text-4xl font-black text-white italic uppercase tracking-tighter">Métricas <span className="text-[#FF3131]">QST-GYM</span></h1>
        <p className="text-gray-500 text-[10px] font-black uppercase tracking-[3px]">Inteligencia de negocio optimizada</p>
      </header>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#0a0a0a] border border-white/5 p-6 rounded-[32px]">
          <Users className="text-blue-500 mb-2" size={20} />
          <p className="text-gray-500 text-[9px] font-black uppercase tracking-widest">Alumnos Totales</p>
          <h3 className="text-3xl font-black text-white italic">{stats.totalAlumnos}</h3>
        </div>
        <div className="bg-[#0a0a0a] border border-white/5 p-6 rounded-[32px]">
          <AlertCircle className="text-[#FF3131] mb-2" size={20} />
          <p className="text-gray-500 text-[9px] font-black uppercase tracking-widest">Cuotas Vencidas</p>
          <h3 className="text-3xl font-black text-white italic">{stats.cuotasVencidas}</h3>
        </div>
        <div className="bg-[#0a0a0a] border border-white/5 p-6 rounded-[32px]">
          <HeartPulse className="text-orange-500 mb-2" size={20} />
          <p className="text-gray-500 text-[9px] font-black uppercase tracking-widest">Aptos Vencidos</p>
          <h3 className="text-3xl font-black text-white italic">{stats.aptosVencidos}</h3>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* GRÁFICO DE HORARIOS */}
        <div className="bg-[#0a0a0a] border border-white/5 p-8 rounded-[40px]">
          <div className="flex items-center gap-2 mb-6 text-blue-500">
            <Clock size={18} />
            <h3 className="text-white font-black uppercase italic text-xs tracking-widest">Concurrencia Horaria</h3>
          </div>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={horariosData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" vertical={false} />
                <XAxis dataKey="hora" tick={{fill: '#444', fontSize: 9}} axisLine={false} />
                <Tooltip 
                  contentStyle={{backgroundColor: '#000', border: '1px solid #222', borderRadius: '12px'}}
                  itemStyle={{color: '#3b82f6', fontWeight: '900', fontSize: '12px'}}
                />
                <Area type="monotone" dataKey="cantidad" name="Visitas" stroke="#3b82f6" fill="rgba(59, 130, 246, 0.1)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ALUMNOS EN RIESGO */}
        <div className="bg-[#0a0a0a] border border-white/5 p-8 rounded-[40px]">
          <div className="flex items-center gap-2 mb-6 text-[#FF3131]">
            <UserMinus size={18} />
            <h3 className="text-white font-black uppercase italic text-xs tracking-widest">Ausentes (+10 días)</h3>
          </div>
          <div className="space-y-3">
            {alumnosRiesgo.map((alumno, i) => (
              <div key={i} className="flex justify-between items-center p-4 bg-white/5 rounded-2xl border border-white/5 group hover:border-[#FF3131]/40 transition-colors">
                <p className="text-white font-bold text-[10px] uppercase">{alumno.nombre}</p>
                <span className="text-[#FF3131] font-black text-[9px] uppercase italic tracking-tighter">Contactar</span>
              </div>
            ))}
          </div>
        </div>

        {/* TOP EJERCICIOS */}
        <div className="bg-[#0a0a0a] border border-white/5 p-8 rounded-[40px]">
          <div className="flex items-center gap-2 mb-6 text-green-500">
            <Dumbbell size={18} />
            <h3 className="text-white font-black uppercase italic text-xs tracking-widest">Ejercicios más usados</h3>
          </div>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ejerciciosData} layout="vertical">
                <YAxis dataKey="name" type="category" width={100} tick={{fill: '#666', fontSize: 9, fontWeight: 'bold'}} axisLine={false} tickLine={false}/>
                <XAxis type="number" hide />
                <Tooltip 
                  cursor={{fill: 'rgba(255,255,255,0.02)'}}
                  contentStyle={{backgroundColor: '#000', border: '1px solid #333', borderRadius: '10px'}}
                  itemStyle={{color: '#FF3131', fontWeight: '900'}}
                />
                <Bar dataKey="cantidad" name="Usos" radius={[0, 10, 10, 0]}>
                  {ejerciciosData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? '#FF3131' : '#222'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* AFLUENCIA SEMANAL */}
        <div className="bg-[#0a0a0a] border border-white/5 p-8 rounded-[40px]">
          <div className="flex items-center gap-2 mb-6 text-orange-500">
            <BarChart3 size={18} />
            <h3 className="text-white font-black uppercase italic text-xs tracking-widest">Clientes por día</h3>
          </div>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={afluenciaData}>
                <XAxis dataKey="name" tick={{fill: '#444', fontSize: 10}} axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{backgroundColor: '#000', border: 'none'}}
                  itemStyle={{color: '#f97316', fontWeight: '900'}}
                />
                <Bar dataKey="visitas" name="Alumnos" fill="#f97316" radius={[8, 8, 8, 8]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}