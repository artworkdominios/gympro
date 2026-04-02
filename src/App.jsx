import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import UpdatePrompt from './components/UpdatePrompt.jsx';
import LoginPage from './pages/LoginPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import AlumnosPage from './pages/AlumnosPage.jsx';
import Sidebar from './components/Sidebar.jsx';
import EjerciciosPage from './pages/EjerciciosPage.jsx';
import UsuariosPage from './pages/UsuariosPage.jsx';
import RutinasPage from './pages/RutinasPage.jsx';
import MiRutinaPage from './pages/MiRutinaPage.jsx'; 
import PerfilPage from './pages/PerfilPage';
import LogActividadPage from './pages/LogActividadPage';
import SuperAdminPage from './pages/SuperAdminPage';
import AnalyticsPage from './pages/AnaliticasPage.jsx';

function AppLayout({ children }) {
  return (
    <div className="flex flex-col md:flex-row h-screen w-full bg-[#050505] text-white overflow-hidden">
      <Sidebar />
      {/* 1. Quitamos content-center (que empujaba el contenido hacia arriba/abajo)
          2. Aseguramos que el scroll sea vertical y empiece desde el inicio (content-start)
      */}
      <main 
        id="main-scroll" 
        className="flex-1 h-full w-full overflow-y-auto overflow-x-hidden pt-[env(safe-area-inset-top)] pb-24 md:pb-8"
      >
        <div className="w-full max-w-7xl mx-auto px-4 md:px-10 py-8 animate-in fade-in zoom-in duration-500 flex flex-col items-center">
          <div className="w-full">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}

// PROTECCIÓN POR ROLES Y MEMBRESÍA
function ProtectedRoute({ children, allowedRoles = [], requireFeature = null, blockIfVencido = false }) {
  const { user, loading, features } = useAuth();
  
  if (loading) return (
    <div className="bg-[#050505] h-[100dvh] w-full flex items-center justify-center">
      <div className="text-[#FF3131] font-black animate-pulse uppercase tracking-[5px] text-[10px]">Cargando QST GYM...</div>
    </div>
  );
  
  if (!user) return <Navigate to="/login" replace />;

  // BLOQUEO POR MEMBRESÍA VENCIDA: 
  // Si la ruta pide bloquear vencidos (como mi-rutina) y el usuario está vencido, lo mandamos al perfil.
  if (blockIfVencido && user.role === 'alumno' && user.isVencido) {
    return <Navigate to="/perfil" replace />;
  }

  // Si la ruta tiene roles definidos y el usuario no tiene uno de esos roles, rebota al dashboard
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  if (requireFeature && features && !features[requireFeature]) {
    return <Navigate to="/" replace />;
  }
  
  return <AppLayout>{children}</AppLayout>;
}

const PlaceholderPage = ({ title }) => (
  <div className="flex flex-col items-center justify-center text-center p-10 border border-dashed border-[#FF3131]/20 rounded-[40px] bg-[#0a0a0a]">
    <h2 className="text-2xl font-black italic text-white uppercase">{title}</h2>
    <p className="text-gray-500 mt-2 text-[10px] uppercase tracking-widest">Sección en desarrollo</p>
  </div>
);

export default function App() {
  return (
    <BrowserRouter>
      <UpdatePrompt />
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          
          {/* ACCESO GENERAL (Logueados) */}
          <Route path="/" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path="/perfil" element={<ProtectedRoute><PerfilPage /></ProtectedRoute>} />

          {/* SOLO ALUMNOS - Agregamos 'blockIfVencido' para que no entren si deben la cuota */}
          <Route path="/mi-rutina" element={
            <ProtectedRoute allowedRoles={['alumno', 'admin']} blockIfVencido={true}>
              <MiRutinaPage />
            </ProtectedRoute>
          } />

          {/* GESTIÓN DE ALUMNOS (Admin, Manager, Profesor) */}
          <Route path="/alumnos" element={
            <ProtectedRoute allowedRoles={['admin', 'manager']}><AlumnosPage /></ProtectedRoute>
          } />
          <Route path="/rutinas" element={
            <ProtectedRoute allowedRoles={['admin', 'manager', 'profesor']}><RutinasPage /></ProtectedRoute>
          } />

          {/* GESTIÓN TÉCNICA (Admin y Manager) */}
          <Route path="/ejercicios" element={
            <ProtectedRoute allowedRoles={['admin', 'manager']}><EjerciciosPage /></ProtectedRoute>
          } />

          {/* SOLO ADMIN */}
          <Route path="/staff" element={
            <ProtectedRoute allowedRoles={['admin']}><UsuariosPage /></ProtectedRoute>
          } />
          <Route path="/log-actividad" element={
            <ProtectedRoute allowedRoles={['admin']}><LogActividadPage /></ProtectedRoute>
          } />
          <Route path="/super-admin" element={
            <ProtectedRoute allowedRoles={['admin']}><SuperAdminPage /></ProtectedRoute>
          } />
          <Route 
            path="/analytics" 
            element={
              <ProtectedRoute allowedRoles={['admin']} requireFeature="analyticsEnabled">
                <AnalyticsPage />
              </ProtectedRoute>
            } 
          />

          <Route path="/config" element={<ProtectedRoute allowedRoles={['admin']}><PlaceholderPage title="Configuración" /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}