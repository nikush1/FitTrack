import { db } from './config';
import {
  collection, addDoc, getDocs, deleteDoc,
  doc, query, where, serverTimestamp,
  setDoc, getDoc, updateDoc
} from 'firebase/firestore';

// NOTE: No orderBy() used — sorting is done client-side in AppContext.
// This avoids the need for composite Firestore indexes entirely.

// ── Diet Logs ──────────────────────────────────────────────────────────────
export const addDietLog = (userId, data) =>
  addDoc(collection(db, 'dietLogs'), { userId, ...data, createdAt: serverTimestamp() });

export const getDietLogs = async (userId) => {
  const q = query(collection(db, 'dietLogs'), where('userId', '==', userId));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

export const deleteDietLog = (docId) => deleteDoc(doc(db, 'dietLogs', docId));

export const updateDietLog = (docId, data) =>
  updateDoc(doc(db, 'dietLogs', docId), data);

// ── Workout Logs ───────────────────────────────────────────────────────────
export const addWorkoutLog = (userId, data) =>
  addDoc(collection(db, 'workoutLogs'), { userId, ...data, createdAt: serverTimestamp() });

export const getWorkoutLogs = async (userId) => {
  const q = query(collection(db, 'workoutLogs'), where('userId', '==', userId));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

export const deleteWorkoutLog = (docId) => deleteDoc(doc(db, 'workoutLogs', docId));

export const updateWorkoutLog = (docId, data) =>
  updateDoc(doc(db, 'workoutLogs', docId), data);

// ── Weight Logs ────────────────────────────────────────────────────────────
export const addWeightLog = (userId, data) =>
  addDoc(collection(db, 'weightLogs'), { userId, ...data, createdAt: serverTimestamp() });

export const getWeightLogs = async (userId) => {
  const q = query(collection(db, 'weightLogs'), where('userId', '==', userId));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

export const deleteWeightLog = (docId) => deleteDoc(doc(db, 'weightLogs', docId));

// ── User Profile ───────────────────────────────────────────────────────────
export const saveUserProfile = (userId, data) =>
  setDoc(doc(db, 'users', userId), data, { merge: true });

export const getUserProfile = async (userId) => {
  const snap = await getDoc(doc(db, 'users', userId));
  return snap.exists() ? snap.data() : null;
};

export const updateUserProfile = (userId, data) =>
  updateDoc(doc(db, 'users', userId), data);
