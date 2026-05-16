import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, addDoc, serverTimestamp, orderBy, limit, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { Bill } from '../types';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export const useBills = () => {
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'bills'), orderBy('timestamp', 'desc'), limit(50));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const billList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Bill[];
      setBills(billList);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'bills');
    });

    return unsubscribe;
  }, []);

  const addBill = async (bill: Omit<Bill, 'id' | 'timestamp'>) => {
    try {
      const docRef = await addDoc(collection(db, 'bills'), {
        ...bill,
        timestamp: serverTimestamp()
      });
      return docRef.id;
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, 'bills');
    }
  };

  const deleteBill = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'bills', id));
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `bills/${id}`);
    }
  };

  const updateBill = async (id: string, updates: Partial<Bill>) => {
    try {
      await updateDoc(doc(db, 'bills', id), {
        ...updates,
        updatedAt: serverTimestamp()
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `bills/${id}`);
    }
  };

  return { bills, loading, addBill, deleteBill, updateBill };
};
