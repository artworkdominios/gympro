import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // Asegurate de que la ruta sea correcta

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading, userData } = useAuth();

  // 1. Mientras verifica si hay alguien logueado, mostramos un loading
  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-black">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-[#FF3131]"></div>
      </div>
    );
  }

  // 2. Si no hay usuario, al login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // 3. Si hay usuario pero el rol no está permitido
  if (allowedRoles && !allowedRoles.includes(userData?.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  // 4. Si todo está ok, renderiza la página
  return children;
}