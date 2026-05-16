import React, { useState } from 'react';
import { useCustomers } from '../hooks/useCustomers';
import { Search, Plus, User, Phone, Wallet, ChevronRight } from 'lucide-react';
import { formatCurrency, cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { Customer } from '../types';
import { useScrollLock } from '../hooks/useScrollLock';

const CustomersPage = () => {
  const { customers, loading, addCustomer, updateCustomer } = useCustomers();
  const [searchTerm, setSearchTerm] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [showConfirmUpdate, setShowConfirmUpdate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');

  // Lock scroll when add/edit customer modal is open
  useScrollLock(isAdding || !!editingCustomer);

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone?.includes(searchTerm)
  );

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName) return;
    await addCustomer(newName, newPhone);
    setNewName('');
    setNewPhone('');
    setIsAdding(false);
  };

  const handleEditClick = (customer: Customer) => {
    setEditingCustomer(customer);
    setNewName(customer.name);
    setNewPhone(customer.phone || '');
  };

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCustomer || !newName) return;
    setShowConfirmUpdate(true);
  };

  const confirmUpdate = async () => {
    if (!editingCustomer) return;
    await updateCustomer(editingCustomer.id, newName, newPhone);
    setEditingCustomer(null);
    setShowConfirmUpdate(false);
    setNewName('');
    setNewPhone('');
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-2xl font-black text-gray-900 leading-tight">Customer List</h2>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search customers..."
          className="w-full bg-white border border-gray-200 rounded-2xl py-4 pl-12 pr-4 text-base focus:ring-2 focus:ring-orange-500 outline-none shadow-sm"
        />
      </div>

      <div className="grid grid-cols-1 gap-3">
        {filteredCustomers.map((customer) => (
          <div 
            key={customer.id}
            onClick={() => handleEditClick(customer)}
            className="bg-white p-5 rounded-[32px] border border-gray-100 shadow-sm flex items-center justify-between group active:scale-[0.98] transition-all cursor-pointer"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-orange-100 rounded-2xl flex items-center justify-center text-orange-600">
                <User className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-gray-900 text-lg leading-none">{customer.name}</h3>
                <p className="text-xs text-gray-400 font-medium flex items-center gap-1">
                  <Phone className="w-3 h-3" />
                  {customer.phone || 'No phone'}
                </p>
              </div>
            </div>
            
            <div className="text-right space-y-1">
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-none">Balance</p>
              <p className={cn(
                "text-xl font-black tracking-tighter",
                customer.pendingBalance > 0 ? "text-red-500" : "text-green-500"
              )}>
                {formatCurrency(customer.pendingBalance)}
              </p>
            </div>
          </div>
        ))}

        {filteredCustomers.length === 0 && (
          <div className="py-20 text-center text-gray-400 font-medium">कोई ग्राहक नहीं मिला</div>
        )}
      </div>

      <button 
        onClick={() => {
          setNewName('');
          setNewPhone('');
          setIsAdding(true);
        }}
        className="fixed bottom-24 right-6 w-14 h-14 bg-orange-600 text-white rounded-full shadow-2xl flex items-center justify-center active:scale-90 transition-all z-20"
      >
        <Plus className="w-8 h-8" />
      </button>

      {/* Add/Edit Customer Modal */}
      <AnimatePresence>
        {(isAdding || editingCustomer) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setIsAdding(false);
                setEditingCustomer(null);
                setShowConfirmUpdate(false);
              }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.form
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              onSubmit={editingCustomer ? handleUpdateSubmit : handleAddSubmit}
              className="relative w-full max-w-sm bg-white rounded-[40px] shadow-2xl p-8"
            >
              <h3 className="text-2xl font-black text-gray-900 mb-6">
                {editingCustomer ? 'Update Customer' : 'Add New Customer'}
              </h3>
              
              <div className="space-y-4 mb-8">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Name</label>
                  <input
                    type="text"
                    required
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="e.g. Rajesh Bhai"
                    className="w-full bg-gray-50 border-none rounded-2xl py-4 px-5 text-gray-900 focus:ring-2 focus:ring-orange-500 outline-none transition-all font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Phone (Optional)</label>
                  <input
                    type="tel"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder="9999999999"
                    className="w-full bg-gray-50 border-none rounded-2xl py-4 px-5 text-gray-900 focus:ring-2 focus:ring-orange-500 outline-none transition-all font-bold"
                  />
                </div>
              </div>

              {!showConfirmUpdate ? (
                <div className="flex gap-3">
                  <button 
                    type="button"
                    onClick={() => {
                      setIsAdding(false);
                      setEditingCustomer(null);
                    }}
                    className="flex-1 bg-gray-100 text-gray-600 font-bold py-4 rounded-2xl active:scale-95 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 bg-orange-600 text-white font-bold py-4 rounded-2xl shadow-lg shadow-orange-200 active:scale-95 transition-all"
                  >
                    {editingCustomer ? 'Update' : 'Save'}
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-center text-sm font-bold text-orange-600 mb-4 animate-pulse uppercase tracking-wider">Are you sure you want to update?</p>
                  <div className="flex gap-3">
                    <button 
                      type="button"
                      onClick={() => setShowConfirmUpdate(false)}
                      className="flex-1 bg-gray-100 text-gray-600 font-bold py-4 rounded-2xl active:scale-95 transition-all"
                    >
                      No
                    </button>
                    <button 
                      type="button"
                      onClick={confirmUpdate}
                      className="flex-1 bg-orange-600 text-white font-bold py-4 rounded-2xl shadow-lg active:scale-95 transition-all"
                    >
                      Yes, Update
                    </button>
                  </div>
                </div>
              )}
            </motion.form>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CustomersPage;
