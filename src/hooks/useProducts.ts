import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, serverTimestamp, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { Product } from '../types';
import { INITIAL_PRODUCTS } from '../data/initialProducts';

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

export const useProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'products'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const productList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Product[];
      setProducts(productList);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'products');
    });

    return unsubscribe;
  }, []);

  const seedProducts = async (force = false) => {
    try {
      const snapshot = await getDocs(collection(db, 'products'));
      
      if (force) {
        for (const d of snapshot.docs) {
          try {
            await deleteDoc(d.ref);
          } catch (e) {
            handleFirestoreError(e, OperationType.DELETE, `products/${d.id}`);
          }
        }
      } else if (snapshot.docs.length > 0) {
        return; // Already seeded
      }

      console.log("Seeding products...");
      for (const product of INITIAL_PRODUCTS) {
        // Create a unique slug using category and English name
        const slug = `${product.category}-${product.nameEn}`.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        try {
          await setDoc(doc(db, 'products', slug), {
            ...product,
            createdAt: serverTimestamp()
          });
        } catch (e) {
          handleFirestoreError(e, OperationType.WRITE, `products/${slug}`);
        }
      }
      console.log("Seeding complete!");
    } catch (err) {
      console.error("Seeding error:", err);
    }
  };

  return { products, loading, seedProducts };
};
