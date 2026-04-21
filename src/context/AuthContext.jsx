import { createContext, useContext, useEffect, useState } from 'react';
import { auth } from '../firebase/config';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { saveUserProfile, getUserProfile } from '../firebase/firestore';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        const prof = await getUserProfile(u.uid);
        setProfile(prof);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  const signup = async (email, password, name) => {
    const { user: u } = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(u, { displayName: name });
    const defaultProfile = {
      name,
      email,
      goal: 'maintain',
      calorieGoal: 2000,
      proteinGoal: 150,
      weightUnit: 'kg',
    };
    await saveUserProfile(u.uid, defaultProfile);
    setProfile(defaultProfile);
  };

  const login = (email, password) =>
    signInWithEmailAndPassword(auth, email, password);

  const loginWithGoogle = async () => {
    const result = await signInWithPopup(auth, new GoogleAuthProvider());
    const u = result.user;
    const existing = await getUserProfile(u.uid);
    if (!existing) {
      const defaultProfile = {
        name: u.displayName,
        email: u.email,
        goal: 'maintain',
        calorieGoal: 2000,
        proteinGoal: 150,
        weightUnit: 'kg',
      };
      await saveUserProfile(u.uid, defaultProfile);
      setProfile(defaultProfile);
    } else {
      setProfile(existing);
    }
  };

  const logout = () => signOut(auth);

  const resetPassword = (email) => sendPasswordResetEmail(auth, email);

  const refreshProfile = async () => {
    if (user) {
      const prof = await getUserProfile(user.uid);
      setProfile(prof);
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, profile, loading, signup, login, loginWithGoogle, logout, resetPassword, refreshProfile }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
