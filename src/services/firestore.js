// Firestore Service — CRUD operations for all collections
import {
  collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc,
  setDoc, query, where, orderBy, limit, serverTimestamp, arrayUnion,
  arrayRemove, increment, onSnapshot
} from 'firebase/firestore';
import { db } from './firebase';

// ── Users ──
export async function getUserById(uid) {
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function updateUser(uid, data) {
  await updateDoc(doc(db, 'users', uid), { ...data, updatedAt: serverTimestamp() });
}

export async function getUsersByRole(role) {
  const q = query(collection(db, 'users'), where('role', '==', role));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function getPendingTeachers() {
  const q = query(
    collection(db, 'users'),
    where('role', '==', 'teacher'),
    where('status', '==', 'pending')
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function approveTeacher(uid) {
  await updateUser(uid, { status: 'active' });
}

export async function rejectTeacher(uid) {
  await updateUser(uid, { status: 'rejected' });
}

// ── Classrooms ──
export async function createClassroom(data) {
  const code = generateClassCode();
  const classroomData = {
    ...data,
    code,
    students: [],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };
  const ref = await addDoc(collection(db, 'classrooms'), classroomData);
  return { id: ref.id, ...classroomData };
}

export async function getClassroomByCode(code) {
  const q = query(collection(db, 'classrooms'), where('code', '==', code));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { id: d.id, ...d.data() };
}

export async function getClassroomsByTeacher(teacherId) {
  const q = query(
    collection(db, 'classrooms'),
    where('teacherId', '==', teacherId),
    orderBy('createdAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function getStudentClassrooms(studentId) {
  const q = query(
    collection(db, 'classrooms'),
    where('students', 'array-contains', studentId)
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function joinClassroom(classroomId, studentId) {
  await updateDoc(doc(db, 'classrooms', classroomId), {
    students: arrayUnion(studentId),
    updatedAt: serverTimestamp()
  });
}

export async function removeStudentFromClassroom(classroomId, studentId) {
  await updateDoc(doc(db, 'classrooms', classroomId), {
    students: arrayRemove(studentId),
    updatedAt: serverTimestamp()
  });
}

// ── Tests ──
export async function createTest(data) {
  const testData = {
    ...data,
    status: 'draft',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };
  const ref = await addDoc(collection(db, 'tests'), testData);
  return { id: ref.id, ...testData };
}

export async function getTestById(testId) {
  const snap = await getDoc(doc(db, 'tests', testId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function getTestsByClassroom(classroomId) {
  const q = query(
    collection(db, 'tests'),
    where('classroomId', '==', classroomId),
    orderBy('createdAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function getTestsByTeacher(teacherId) {
  const q = query(
    collection(db, 'tests'),
    where('teacherId', '==', teacherId),
    orderBy('createdAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function getActiveTestsForStudent(classroomIds) {
  if (!classroomIds.length) return [];
  const q = query(
    collection(db, 'tests'),
    where('classroomId', 'in', classroomIds.slice(0, 10)),
    where('status', '==', 'published')
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function publishTest(testId) {
  await updateDoc(doc(db, 'tests', testId), {
    status: 'published',
    updatedAt: serverTimestamp()
  });
}

export async function updateTest(testId, data) {
  await updateDoc(doc(db, 'tests', testId), {
    ...data,
    updatedAt: serverTimestamp()
  });
}

// ── Submissions ──
export async function createSubmission(data) {
  const submissionData = {
    ...data,
    submittedAt: serverTimestamp()
  };
  const ref = await addDoc(collection(db, 'submissions'), submissionData);
  return { id: ref.id, ...submissionData };
}

export async function getSubmissionsByTest(testId) {
  const q = query(collection(db, 'submissions'), where('testId', '==', testId));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function getSubmissionsByStudent(studentId) {
  const q = query(
    collection(db, 'submissions'),
    where('studentId', '==', studentId),
    orderBy('submittedAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function getStudentSubmission(testId, studentId) {
  const q = query(
    collection(db, 'submissions'),
    where('testId', '==', testId),
    where('studentId', '==', studentId)
  );
  const snap = await getDocs(q);
  return snap.empty ? null : { id: snap.docs[0].id, ...snap.docs[0].data() };
}

export async function updateSubmission(submissionId, data) {
  await updateDoc(doc(db, 'submissions', submissionId), data);
}

// ── Gemini API Keys (Admin) ──
export async function getGeminiKeys() {
  const snap = await getDoc(doc(db, 'config', 'gemini_keys'));
  return snap.exists() ? snap.data().keys || [] : [];
}

export async function updateGeminiKeys(keys) {
  await setDoc(doc(db, 'config', 'gemini_keys'), {
    keys,
    updatedAt: serverTimestamp()
  });
}

// ── Utility ──
function generateClassCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}
