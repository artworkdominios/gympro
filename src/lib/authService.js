import {
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  sendPasswordResetEmail, // <--- Nuevo import
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase.js';

const USERS_COLLECTION = 'users';

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

export async function signIn(email, password) {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  const roleData = await getUserRole(userCredential.user.uid);
  return {
    user: userCredential.user,
    role: roleData?.role ?? 'alumno',
    userData: roleData?.userData ?? { id: userCredential.user.uid },
  };
}

// NUEVA FUNCIÓN: Envía el mail de recuperación
export async function sendPasswordReset(email) {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error) {
    throw error;
  }
}

export async function signOut() {
  await firebaseSignOut(auth);
}

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