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

  const autoMigratePrices = async (currentProducts: Product[]) => {
    try {
      const migKey = 'billing-products-price-update-2026-v12';
      if (localStorage.getItem(migKey)) return;
      
      // Prevent overlapping runs instantly
      localStorage.setItem(migKey, 'true');
      
      console.log("Analyzing product catalogue for price changes...");
      const updates = [];
      for (const initialProduct of INITIAL_PRODUCTS) {
        const slug = `${initialProduct.category}-${initialProduct.nameEn}`.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        const dbProd = currentProducts.find(p => p.id === slug);
        if (!dbProd) {
          // If product is missing, we need to create it
          updates.push({ id: slug, data: initialProduct });
        } else if (dbProd.price !== initialProduct.price) {
          // If price differs, we update the price
          updates.push({ id: slug, data: { ...dbProd, price: initialProduct.price } });
        }
      }

      if (updates.length === 0) {
        console.log("Product catalog matches latest prices.");
        return;
      }

      console.log(`Syncing ${updates.length} products to updated prices in Firestore...`);
      for (const update of updates) {
        try {
          await setDoc(doc(db, 'products', update.id), {
            ...update.data,
            updatedAt: serverTimestamp()
          }, { merge: true });
        } catch (e) {
          console.warn(`Price sync failed for product slug ${update.id}:`, e);
        }
      }
      console.log("Product prices successfully synchronized.");
    } catch (err) {
      console.error("Auto-migration error:", err);
    }
  };

  useEffect(() => {
    const q = query(collection(db, 'products'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const productList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Product[];
      
      setProducts(productList);
      setLoading(false);

      // Auto-trigger seeding if database is empty
      if (productList.length === 0) {
        seedProducts();
      } else {
        // Run non-destructive automatic price synchronization
        autoMigratePrices(productList);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'products');
    });

    return unsubscribe;
  }, []);

  return { products, loading, seedProducts };
};
