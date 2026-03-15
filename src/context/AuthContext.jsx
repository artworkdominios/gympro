import { createContext, useContext, useEffect, useState } from 'react';
import {
  subscribeToAuthChanges,
  signIn as authSignIn,
  signOut as authSignOut,
} from '../lib/authService.js';
import { doc, onSnapshot } from 'firebase/firestore'; 
import { db } from '../lib/firebase';

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
  
  // Settings de diseño/colores (tu lógica anterior)
  const [appSettings, setAppSettings] = useState({ notificationsEnabled: true, timerEnabled: true });
  
  // NUEVO: Estado global de Features (los interruptores maestros)
  const [features, setFeatures] = useState({
    analyticsEnabled: false,
    timerEnabled: false,
    temporizadorEnabled: false,
    notificacionesCuotaEnabled: false
  });

  // 1. Escuchar configuraciones globales (global y features)
  useEffect(() => {
    // Escucha configuraciones de diseño
    const unsubSettings = onSnapshot(doc(db, "configuracion", "global"), (doc) => {
      if (doc.exists()) setAppSettings(doc.data());
    });

    // ESCUCHA DE FEATURES (INTERRUPTORES)
    const unsubFeatures = onSnapshot(doc(db, "configuracion", "features"), (doc) => {
      if (doc.exists()) {
        setFeatures(doc.data());
      }
    });

    return () => {
      unsubSettings();
      unsubFeatures();
    };
  }, []);

  // 2. Lógica de Autenticación
  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges((firebaseUser, userRole, data) => {
      if (firebaseUser) {
        let diasParaVencer = null;
        if (data?.fecha_vencimiento) {
          const hoy = new Date();
          const vto = new Date(data.fecha_vencimiento);
          const diffTime = vto - hoy;
          diasParaVencer = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        }

        setUser({
          ...firebaseUser,
          role: userRole || 'alumno',
          ...data,
          diasParaVencer 
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
    const normalizedRole = user.role.toLowerCase().trim();
    return allowedRoles.some(r => r.toLowerCase() === normalizedRole || (r === 'admin' && normalizedRole === 'administrador'));
  };

  const value = {
    user,
    role: user?.role,
    loading,
    error,
    signIn,
    logout: signOut,
    hasRole,
    isAuthenticated: !!user,
    settings: appSettings,
    features, // EXPORTAMOS LAS FEATURES AQUÍ
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