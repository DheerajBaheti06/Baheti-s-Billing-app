import React, { useState } from 'react';
import { useProducts } from '../hooks/useProducts';
import { useAuth } from '../context/AuthContext';
import { Search, Plus, Trash2, RefreshCw, X, Edit3, Save } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Product, Unit } from '../types';
import { cn } from '../lib/utils';
import { db } from '../lib/firebase';
import { doc, deleteDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useTranslation } from '../hooks/useTranslation';
import { ProductIcon } from '../components/ProductIcon';
import { useScrollLock } from '../hooks/useScrollLock';
import { toast } from 'react-hot-toast';

const ProductsPage = () => {
  const { products, loading, seedProducts } = useProducts();
  const { user } = useAuth();
  const { t } = useTranslation();
  
  const isAdmin = user?.role === 'admin';
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isCleaning, setIsCleaning] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Add/Edit State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Lock scroll when modal is open
  useScrollLock(isModalOpen);
  const [formData, setFormData] = useState({
    nameHi: '',
    nameEn: '',
    price: '' as string | number,
    category: 'नमकीन',
    unit: Unit.KG
  });

  const categories = Array.from(new Set(products.map(p => p.category)));

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setFormData({ nameHi: '', nameEn: '', price: '', category: 'नमकीन', unit: Unit.KG });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (p: Product) => {
    setEditingProduct(p);
    setFormData({ 
      nameHi: p.nameHi, 
      nameEn: p.nameEn, 
      price: String(p.price), 
      category: p.category, 
      unit: p.unit as Unit
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    const toastId = toast.loading('Saving changes...');
    try {
      const id = editingProduct?.id || formData.nameEn.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const finalPrice = Math.max(0, Number(formData.price) || 0);
      await setDoc(doc(db, 'products', id), {
        nameHi: formData.nameHi,
        nameEn: formData.nameEn,
        category: formData.category,
        unit: formData.unit,
        price: finalPrice,
        createdAt: editingProduct?.createdAt || serverTimestamp()
      }, { merge: true });
      toast.success(editingProduct ? 'Product price updated successfully!' : 'Product added successfully to catalog!', { id: toastId });
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
      toast.error('Failed to save product changes.', { id: toastId });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Delete this product from catalog?')) {
      const toastId = toast.loading('Deleting product...');
      try {
        await deleteDoc(doc(db, 'products', id));
        toast.success('Product deleted from catalog!', { id: toastId });
      } catch (err) {
        console.error(err);
        toast.error('Failed to delete product from catalog.', { id: toastId });
      }
    }
  };

  const handleReset = async () => {
    if (window.confirm('This will delete all current products. Continue?')) {
      setIsCleaning(true);
      const toastId = toast.loading('Resetting catalog...');
      try {
        for (const p of products) {
          await deleteDoc(doc(db, 'products', p.id));
        }
        toast.success('All catalog products deleted successfully!', { id: toastId });
      } catch (err) {
        console.error(err);
        toast.error('Failed to reset catalog.', { id: toastId });
      } finally {
        setIsCleaning(false);
      }
    }
  };

  const handleSeed = async () => {
    setIsSeeding(true);
    const toastId = toast.loading('Loading default product prices...');
    try {
      await seedProducts();
      toast.success('Default product catalogue loaded successfully!', { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error('Failed to load default products.', { id: toastId });
    } finally {
      setIsSeeding(false);
    }
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.nameHi.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         p.nameEn.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory ? p.category === selectedCategory : true;
    return matchesSearch && matchesCategory;
  });

  if (loading) return (
    <div className="flex flex-col items-center justify-center p-20">
      <RefreshCw className="w-8 h-8 text-orange-200 animate-spin mb-4" />
      <p className="text-gray-400 font-bold text-xs uppercase tracking-widest">{t('loading')}</p>
    </div>
  );

  return (
    <div className="space-y-6 pb-20 px-2">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h2 className="text-xl font-black text-gray-900 dark:text-gray-100 leading-tight">{t('catalog')}</h2>
          <p className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase">{products.length} {t('items')}</p>
        </div>
        <div className="flex gap-1">
          {isAdmin && (
            <>
              <button 
                onClick={handleReset}
                className="p-2 text-gray-300 dark:text-gray-600 hover:text-primary transition-colors"
                title="Reset Catalog"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
              <button 
                onClick={handleOpenAdd}
                className="bg-primary text-white p-2 rounded-xl shadow-lg shadow-primary/10 active:scale-90 transition-all font-black text-[10px] flex items-center gap-1 uppercase px-3"
              >
                <Plus className="w-4 h-4" />
                {t('addNew')}
              </button>
            </>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t('filterCatalog')}
            className="w-full bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold focus:ring-2 focus:ring-primary outline-none shadow-sm dark:text-white dark:placeholder:text-gray-600"
          />
        </div>
        
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-2 px-2 scrollbar-hide no-scrollbar">
          <button
            onClick={() => setSelectedCategory(null)}
            className={cn(
              "whitespace-nowrap px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all",
              !selectedCategory ? "bg-primary text-white shadow-md shadow-primary/10" : "bg-white dark:bg-gray-900 text-gray-400 dark:text-gray-500 border border-gray-100 dark:border-gray-800"
            )}
          >
            {t('all')}
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={cn(
                "whitespace-nowrap px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all",
                selectedCategory === cat ? "bg-primary text-white shadow-md shadow-primary/10" : "bg-white dark:bg-gray-900 text-gray-400 dark:text-gray-500 border border-gray-100 dark:border-gray-800"
              )}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-2">
          {filteredProducts.map(product => (
            <motion.div
              layout
              key={product.id}
              className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-4 rounded-2xl shadow-sm flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-gray-50 dark:bg-gray-800 rounded-xl text-gray-400 dark:text-gray-500">
                  <ProductIcon category={product.category} className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-gray-100 leading-tight text-sm">{product.nameHi}</h3>
                  <p className="text-[10px] text-gray-400 dark:text-gray-500 font-medium leading-none mb-1">{product.nameEn}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-black text-primary bg-primary/5 dark:bg-primary/20 px-1.5 py-0.5 rounded-md uppercase">₹{product.price}/{product.unit}</span>
                    <span className="text-[9px] font-bold text-gray-300 dark:text-gray-600 uppercase">{product.category}</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-1">
                {isAdmin && (
                  <>
                    <button 
                      onClick={() => handleOpenEdit(product)}
                      className="p-2 text-gray-300 hover:text-blue-500 transition-colors"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDelete(product.id)}
                      className="p-2 text-gray-300 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          ))}
          
          {filteredProducts.length === 0 && (
            <div className="py-20 text-center bg-gray-50 dark:bg-gray-900/50 rounded-[32px] border-2 border-dashed border-gray-100 dark:border-gray-800">
              <ProductIcon category="अन्य" className="w-12 h-12 text-gray-200 dark:text-gray-700 mx-auto mb-4" />
              <p className="text-gray-400 font-bold text-sm mb-6">
                {searchTerm ? 'No items matching your search' : 'Your catalogue is empty'}
              </p>
              {isAdmin && !searchTerm && (
                <button 
                  onClick={handleSeed}
                  disabled={isSeeding}
                  className="inline-flex items-center gap-2 bg-white dark:bg-gray-800 text-primary border border-primary/20 px-6 py-3 rounded-2xl font-black text-[10px] uppercase shadow-sm hover:bg-primary hover:text-white transition-all active:scale-95 disabled:opacity-50"
                >
                  {isSeeding ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  Load Demo Products
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.form
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              onSubmit={handleSubmit}
              className="relative w-full max-w-md bg-white dark:bg-gray-900 rounded-t-[40px] sm:rounded-3xl p-8 shadow-2xl flex flex-col gap-4 border-t border-gray-100 dark:border-gray-800"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xl font-black text-gray-900 dark:text-gray-100">{editingProduct ? t('editProduct') : t('addProduct')}</h3>
                <button type="button" onClick={() => setIsModalOpen(false)} className="p-2 text-gray-400"><X className="w-6 h-6" /></button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase mb-1 ml-1 tracking-widest">{t('nameHindi')}</label>
                  <input
                    required
                    value={formData.nameHi}
                    onChange={e => setFormData({...formData, nameHi: e.target.value})}
                    placeholder="e.g. मगद नमकीन"
                    className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-xl py-3 px-4 font-bold text-sm focus:ring-2 focus:ring-primary outline-none transition-all dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase mb-1 ml-1 tracking-widest">{t('nameEnglish')}</label>
                  <input
                    required
                    value={formData.nameEn}
                    onChange={e => setFormData({...formData, nameEn: e.target.value})}
                    placeholder="e.g. Magad Namkeen"
                    className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-xl py-3 px-4 font-bold text-sm focus:ring-2 focus:ring-primary outline-none transition-all dark:text-white"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase mb-1 ml-1 tracking-widest">{t('price')}</label>
                    <input
                      required
                      type="number"
                      value={formData.price}
                      onChange={e => {
                        setFormData({
                          ...formData,
                          price: e.target.value
                        });
                      }}
                      placeholder="e.g. 320"
                      className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-xl py-3 px-4 font-bold text-sm focus:ring-2 focus:ring-primary outline-none transition-all dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase mb-1 ml-1 tracking-widest">{t('unit')}</label>
                    <select
                      value={formData.unit}
                      onChange={e => setFormData({...formData, unit: e.target.value as Unit})}
                      className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-xl py-3 px-4 font-bold text-sm focus:ring-2 focus:ring-primary outline-none transition-all appearance-none dark:text-white"
                    >
                      {Object.values(Unit).map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase mb-1 ml-1 tracking-widest">{t('category')}</label>
                  <select
                    value={formData.category}
                    onChange={e => setFormData({...formData, category: e.target.value})}
                    className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-xl py-3 px-4 font-bold text-sm focus:ring-2 focus:ring-primary outline-none transition-all appearance-none dark:text-white"
                  >
                    {['नमकीन', 'अचार', 'आम पापड़', 'मसाले', 'पापड़', 'अन्य'].map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSaving}
                className="w-full bg-primary text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 mt-4 active:scale-95 transition-all shadow-lg hover:shadow-primary/25 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                {editingProduct ? t('saveChanges') : t('addToCatalog')}
              </button>
            </motion.form>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProductsPage;
