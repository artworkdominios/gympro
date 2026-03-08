import { createContext, useContext, useEffect, useState } from 'react';
import {
  subscribeToAuthChanges,
  signIn as authSignIn,
  signOut as authSignOut,
} from '../lib/authService.js';

const AuthContext = createContext(null);

export const ROLES = {
  ADMINISTRADOR: 'administrador',
  MANAGER: 'manager',
  PROFESOR: 'profesor',
  ALUMNO: 'alumno',
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Escuchamos cambios en la autenticación
    const unsubscribe = subscribeToAuthChanges((firebaseUser, userRole, data) => {
      if (firebaseUser) {
        // Si hay usuario, combinamos todo en un solo objeto 'user'
        // Esto arregla que el Sidebar y Dashboard lean bien el rol
        setUser({
          ...firebaseUser,
          role: userRole || 'alumno', // Por defecto alumno si no hay rol
          ...data
        });
      } else {
        setUser(null);
      }
      setLoading(false);
      setError(null);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async (email, password) => {
    setError(null);
    setLoading(true);
    try {
      const result = await authSignIn(email, password);
      // Al loguear, también unificamos el objeto
      setUser({
        ...result.user,
        role: result.role,
        ...result.userData
      });
      return result;
    } catch (err) {
      setError(err.message || 'Error al iniciar sesión');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      await authSignOut();
      setUser(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const hasRole = (...allowedRoles) => {
    if (!user?.role) return false;
    return allowedRoles.includes(user.role.toLowerCase());
  };

  const value = {
    user,
    role: user?.role, // Mantenemos compatibilidad
    loading,
    error,
    signIn,
    logout: signOut, // Renombramos a logout para que coincida con tu Sidebar
    hasRole,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return context;
}