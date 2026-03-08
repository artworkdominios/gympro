/**
 * Auth Service - Lógica de autenticación separada de la UI
 * Facilita migración a React Native al mantener la lógica desacoplada
 */

import {
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase.js';

const USERS_COLLECTION = 'users';

/**
 * Obtiene el rol del usuario desde Firestore (colección 'users')
 * @param {string} uid - ID del usuario en Firebase Auth
 * @returns {Promise<{role: string, userData: object} | null>}
 */
export async function getUserRole(uid) {
  try {
    const userDoc = await getDoc(doc(db, USERS_COLLECTION, uid));
    if (userDoc.exists()) {
      const data = userDoc.data();
      return {
        role: data.role || 'alumno',
        userData: { id: uid, ...data },
      };
    }
    return null;
  } catch (error) {
    console.error('Error fetching user role:', error);
    throw error;
  }
}

/**
 * Inicia sesión con email y contraseña
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{user: object, role: string, userData: object}>}
 */
export async function signIn(email, password) {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  const roleData = await getUserRole(userCredential.user.uid);
  return {
    user: userCredential.user,
    role: roleData?.role ?? 'alumno',
    userData: roleData?.userData ?? { id: userCredential.user.uid },
  };
}

/**
 * Cierra la sesión del usuario
 */
export async function signOut() {
  await firebaseSignOut(auth);
}

/**
 * Suscribe a cambios en el estado de autenticación
 * @param {function} callback - (user, role, userData) => void
 * @returns {function} - Función para cancelar la suscripción
 */
export function subscribeToAuthChanges(callback) {
  return onAuthStateChanged(auth, async (firebaseUser) => {
    if (!firebaseUser) {
      callback(null, null, null);
      return;
    }
    try {
      const roleData = await getUserRole(firebaseUser.uid);
      callback(firebaseUser, roleData?.role ?? 'alumno', roleData?.userData ?? { id: firebaseUser.uid });
    } catch (error) {
      console.error('Auth state change error:', error);
      callback(firebaseUser, 'alumno', { id: firebaseUser.uid });
    }
  });
}
