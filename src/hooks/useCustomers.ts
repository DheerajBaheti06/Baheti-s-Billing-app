import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, addDoc, serverTimestamp, orderBy, doc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Customer } from '../types';

export const useCustomers = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'customers'), orderBy('name', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const customerList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Customer[];
      setCustomers(customerList);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const addCustomer = async (name: string, phone?: string) => {
    await addDoc(collection(db, 'customers'), {
      name,
      phone: phone || '',
      pendingBalance: 0,
      updatedAt: serverTimestamp()
    });
  };

  const updateBalance = async (customerId: string, amount: number) => {
    const customerRef = doc(db, 'customers', customerId);
    await updateDoc(customerRef, {
      pendingBalance: increment(amount),
      updatedAt: serverTimestamp()
    });
  };

  const updateCustomer = async (id: string, name: string, phone: string) => {
    const customerRef = doc(db, 'customers', id);
    await updateDoc(customerRef, {
      name,
      phone: phone || '',
      updatedAt: serverTimestamp()
    });
  };

  return { customers, loading, addCustomer, updateBalance, updateCustomer };
};
