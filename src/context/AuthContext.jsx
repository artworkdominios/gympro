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
  ADMIN: 'admin',
  MANAGER: 'manager',
  PROFESOR: 'profesor',
  ALUMNO: 'alumno',
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [appSettings, setAppSettings] = useState({ notificationsEnabled: true, timerEnabled: true });
  const [features, setFeatures] = useState({
    analyticsEnabled: false,
    timerEnabled: false,
    temporizadorEnabled: false,
    notificacionesCuotaEnabled: false,
    aptoMedicoEnabled: false 
  });

  // 1. Listeners de Configuración
  // 1. Listeners de Configuración (Mejorado para evitar errores 400)
useEffect(() => {
  let unsubSettings = () => {};
  let unsubFeatures = () => {};

  try {
    unsubSettings = onSnapshot(doc(db, "configuracion", "global"), 
      (docSnap) => { if (docSnap.exists()) setAppSettings(docSnap.data()); },
      (err) => console.warn("Esperando permisos de settings...")
    );

    unsubFeatures = onSnapshot(doc(db, "configuracion", "features"), 
      (docSnap) => { if (docSnap.exists()) setFeatures(docSnap.data()); },
      (err) => console.warn("Esperando permisos de features...")
    );
  } catch (e) {
    console.error("Error inicializando listeners:", e);
  }

  return () => { unsubSettings(); unsubFeatures(); };
}, []);

  // 2. Función de Cálculo Genérica
  const calcularDiasDiferencia = (fechaString) => {
    if (!fechaString) return null;
    try {
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0); 
      
      const fechaDestino = new Date(fechaString);
      // Compensación de zona horaria para evitar errores de "un día antes"
      fechaDestino.setMinutes(fechaDestino.getMinutes() + fechaDestino.getTimezoneOffset());
      fechaDestino.setHours(0, 0, 0, 0);
      
      const diferenciaEnMilisegundos = fechaDestino.getTime() - hoy.getTime();
      return Math.ceil(diferenciaEnMilisegundos / (1000 * 60 * 60 * 24));
    } catch (e) {
      return null;
    }
  };

  // 3. Listener Realtime del Usuario
  useEffect(() => {
    let unsubUserDoc = null;

    const unsubscribeAuth = subscribeToAuthChanges((firebaseUser) => {
      if (firebaseUser) {
        unsubUserDoc = onSnapshot(doc(db, "users", firebaseUser.uid), (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            
            let finalRole = data.role?.toLowerCase().trim() || ROLES.ALUMNO;
            if (finalRole === 'administrador') finalRole = ROLES.ADMIN;

            // Cálculos de Cuota
            const diasCuota = calcularDiasDiferencia(data.fecha_vencimiento) ?? 0;
            const cuotaVencida = diasCuota <= 0 && finalRole === ROLES.ALUMNO;

            // CORRECCIÓN: Usamos "fecha_apto" y separamos estados
            const diasApto = calcularDiasDiferencia(data.fecha_apto);
            const aptoVencido = (diasApto !== null && diasApto <= 0) && finalRole === ROLES.ALUMNO;
            const aptoFaltante = (diasApto === null) && finalRole === ROLES.ALUMNO;

            setUser({
              ...firebaseUser,
              ...data,
              uid: firebaseUser.uid,
              role: finalRole,
              diasParaVencer: diasCuota,
              isVencido: cuotaVencida,
              diasApto: diasApto,      
              isAptoVencido: aptoVencido,
              isAptoFaltante: aptoFaltante 
            });
            
            setLoading(false);
          } else {
            setLoading(false);
          }
        });
      } else {
        if (unsubUserDoc) unsubUserDoc();
        setUser(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubUserDoc) unsubUserDoc();
    };
  }, []);

  const signIn = async (email, password) => {
    setError(null);
    setLoading(true);
    try {
      return await authSignIn(email, password);
    } catch (err) {
      setError(err.message || 'Error al iniciar sesión');
      throw err;
    } finally { setLoading(false); }
  };

  const logout = async () => {
    setLoading(true);
    try { await authSignOut(); setUser(null); } 
    catch (err) { setError(err.message); } 
    finally { setLoading(false); }
  };

  const value = {
    user,
    isVencido: user?.isVencido || false, 
    isAptoVencido: user?.isAptoVencido || false,
    isAptoFaltante: user?.isAptoFaltante || false, 
    role: user?.role,
    loading,
    error,
    signIn,
    logout,
    isAuthenticated: !!user,
    settings: appSettings,
    features,
  };

  if (loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-black gap-4">
        <img src="/logo192.png" alt="QST GYM" className="w-16 h-16 animate-pulse" />
        <p className="text-white font-black text-[10px] uppercase tracking-widest animate-pulse">
          Cargando QST GYM...
        </p>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}