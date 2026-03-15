import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
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
    <div className="flex flex-col md:flex-row min-h-screen bg-[#050505] text-white">
      <Sidebar />
      <main className="flex-1 p-4 md:p-8 overflow-y-auto pb-24 md:pb-8">
        {children}
      </main>
    </div>
  );
}

function ProtectedRoute({ children, requireFeature = null }) {
  const { user, loading, features } = useAuth();
  
  if (loading) return (
    <div className="bg-[#050505] min-h-screen flex items-center justify-center">
      <div className="text-[#FF3131] font-black animate-pulse uppercase tracking-[5px]">Cargando QST GYM APP...</div>
    </div>
  );
  
  if (!user) return <Navigate to="/login" replace />;

  // Si la ruta requiere una feature específica y está apagada, redirige al home
  if (requireFeature && features && !features[requireFeature]) {
    return <Navigate to="/" replace />;
  }
  
  return <AppLayout>{children}</AppLayout>;
}

const PlaceholderPage = ({ title }) => (
  <div className="p-10 border border-dashed border-[#FF3131]/20 rounded-2xl text-center">
    <h2 className="text-2xl font-black italic text-white uppercase">{title}</h2>
    <p className="text-gray-500 mt-2">Sección en construcción para QSTGYM.</p>
  </div>
);

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path="/alumnos" element={<ProtectedRoute><AlumnosPage /></ProtectedRoute>} />
          <Route path="/ejercicios" element={<ProtectedRoute><EjerciciosPage /></ProtectedRoute>} />
          <Route path="/staff" element={<ProtectedRoute><UsuariosPage /></ProtectedRoute>} />
          <Route path="/rutinas" element={<ProtectedRoute><RutinasPage /></ProtectedRoute>} />
          <Route path="/mi-rutina" element={<ProtectedRoute><MiRutinaPage /></ProtectedRoute>} />
          <Route path="/perfil" element={<ProtectedRoute><PerfilPage /></ProtectedRoute>} />
          <Route path="/log-actividad" element={<ProtectedRoute><LogActividadPage /></ProtectedRoute>} />
          <Route path="/super-admin" element={<ProtectedRoute><SuperAdminPage /></ProtectedRoute>} />
          
          {/* RUTA DE ANALYTICS PROTEGIDA */}
          <Route 
            path="/analytics" 
            element={
              <ProtectedRoute requireFeature="analyticsEnabled">
                <AnalyticsPage />
              </ProtectedRoute>
            } 
          />

          <Route path="/config" element={<ProtectedRoute><PlaceholderPage title="Configuración" /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}