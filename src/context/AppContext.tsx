
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Customer, MilkEntry, Farmer, FarmerMilkEntry, FarmerPayment, ProductEntry, LeftoverSale } from '@/lib/types';
import { translations, Language } from '@/lib/i18n';
import * as db from '@/lib/db';

interface AppContextType {
  customers: Customer[];
  entries: MilkEntry[];
  farmers: Farmer[];
  farmerEntries: FarmerMilkEntry[];
  farmerPayments: FarmerPayment[];
  productEntries: ProductEntry[];
  leftoverSales: LeftoverSale[];
  addCustomer: (customer: Omit<Customer, 'id'>) => void;
  updateCustomer: (customer: Customer) => void;
  deleteCustomer: (id: string) => void;
  addOrUpdateEntry: (entry: Omit<MilkEntry, 'id'>) => void;
  getEntry: (customerId: string, date: string) => MilkEntry | undefined;
  getCustomerById: (id: string) => Customer | undefined;
  addFarmer: (farmer: Omit<Farmer, 'id'>) => void;
  updateFarmer: (farmer: Farmer) => void;
  deleteFarmer: (id: string) => void;
  addOrUpdateFarmerEntry: (entry: Omit<FarmerMilkEntry, 'id'>) => void;
  getFarmerEntry: (farmerId: string, date: string) => FarmerMilkEntry | undefined;
  getFarmerById: (id: string) => Farmer | undefined;
  addFarmerPayment: (payment: Omit<FarmerPayment, 'id'>) => void;
  updateFarmerPayment: (payment: FarmerPayment) => void;
  deleteFarmerPayment: (id: string) => void;
  addOrUpdateProductEntry: (entry: Omit<ProductEntry, 'id'>) => void;
  deleteProductEntry: (id: string) => void;
  addLeftoverSale: (sale: Omit<LeftoverSale, 'id'>) => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: keyof typeof translations.en) => string;
  exportBackup: () => void;
  restoreBackup: (backupData: any) => boolean;
  inAppRemindersEnabled: boolean;
  setInAppRemindersEnabled: (enabled: boolean) => void;
  resetAllData: () => void;
  isDataLoaded: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [entries, setEntries] = useState<MilkEntry[]>([]);
  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [farmerEntries, setFarmerEntries] = useState<FarmerMilkEntry[]>([]);
  const [farmerPayments, setFarmerPayments] = useState<FarmerPayment[]>([]);
  const [productEntries, setProductEntries] = useState<ProductEntry[]>([]);
  const [leftoverSales, setLeftoverSales] = useState<LeftoverSale[]>([]);
  const [language, setLanguageState] = useState<Language>('en');
  const [inAppRemindersEnabled, setInAppRemindersEnabledState] = useState(false);
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  useEffect(() => {
    async function loadData() {
      if (typeof window !== 'undefined') {
        const [
          storedCustomers, 
          storedEntries, 
          storedFarmers,
          storedFarmerEntries,
          storedFarmerPayments,
          storedProductEntries,
          storedLeftoverSales,
          storedLanguage, 
          storedRemindersEnabled
        ] = await Promise.all([
          db.get<Customer[]>('customers'),
          db.get<MilkEntry[]>('entries'),
          db.get<Farmer[]>('farmers'),
          db.get<FarmerMilkEntry[]>('farmerEntries'),
          db.get<FarmerPayment[]>('farmerPayments'),
          db.get<ProductEntry[]>('productEntries'),
          db.get<LeftoverSale[]>('leftoverSales'),
          db.get<Language>('language'),
          db.get<boolean>('inAppRemindersEnabled')
        ]).catch(err => {
          console.error("Failed to load data from IndexedDB:", err);
          return [null, null, null, null, null, null, null, null, null];
        });

        setCustomers(storedCustomers || []);
        setEntries(storedEntries || []);
        setFarmers(storedFarmers || []);
        setFarmerEntries(storedFarmerEntries || []);
        setFarmerPayments(storedFarmerPayments || []);
        setProductEntries(storedProductEntries || []);
        setLeftoverSales(storedLeftoverSales || []);
        setLanguageState(storedLanguage || 'en');
        setInAppRemindersEnabledState(storedRemindersEnabled ?? true);
        setIsDataLoaded(true);
      }
    }
    loadData();
  }, []);

  useEffect(() => { if (isDataLoaded) db.set('customers', customers); }, [customers, isDataLoaded]);
  useEffect(() => { if (isDataLoaded) db.set('entries', entries); }, [entries, isDataLoaded]);
  useEffect(() => { if (isDataLoaded) db.set('farmers', farmers); }, [farmers, isDataLoaded]);
  useEffect(() => { if (isDataLoaded) db.set('farmerEntries', farmerEntries); }, [farmerEntries, isDataLoaded]);
  useEffect(() => { if (isDataLoaded) db.set('farmerPayments', farmerPayments); }, [farmerPayments, isDataLoaded]);
  useEffect(() => { if (isDataLoaded) db.set('productEntries', productEntries); }, [productEntries, isDataLoaded]);
  useEffect(() => { if (isDataLoaded) db.set('leftoverSales', leftoverSales); }, [leftoverSales, isDataLoaded]);
  useEffect(() => { if (isDataLoaded) db.set('language', language); }, [language, isDataLoaded]);
  useEffect(() => { if (isDataLoaded) db.set('inAppRemindersEnabled', inAppRemindersEnabled); }, [inAppRemindersEnabled, isDataLoaded]);

  const addCustomer = useCallback((customer: Omit<Customer, 'id'>) => {
    const newCustomer = { ...customer, id: crypto.randomUUID() };
    setCustomers(prev => [...prev, newCustomer]);
  }, []);

  const updateCustomer = useCallback((updatedCustomer: Customer) => {
    setCustomers(prev => prev.map(c => c.id === updatedCustomer.id ? updatedCustomer : c));
  }, []);

  const deleteCustomer = useCallback((id: string) => {
    setCustomers(prev => prev.filter(c => c.id !== id));
    setEntries(prev => prev.filter(e => e.customerId !== id));
    setProductEntries(prev => prev.filter(e => e.customerId !== id));
  }, []);

  const addOrUpdateEntry = useCallback((entryData: Omit<MilkEntry, 'id'>) => {
    setEntries(prevEntries => {
      const entryDate = entryData.date;
      const existingEntryIndex = prevEntries.findIndex(e => e.customerId === entryData.customerId && e.date === entryDate);
      if (existingEntryIndex > -1) {
        const updatedEntries = [...prevEntries];
        const existingEntry = updatedEntries[existingEntryIndex];
        updatedEntries[existingEntryIndex] = { ...existingEntry, ...entryData };
        return updatedEntries;
      } else {
        return [...prevEntries, { ...entryData, id: crypto.randomUUID() }];
      }
    });
  }, []);

  const getEntry = useCallback((customerId: string, date: string): MilkEntry | undefined => {
    return entries.find(e => e.customerId === customerId && e.date === date);
  }, [entries]);
  
  const getCustomerById = useCallback((id: string) => {
    return customers.find(c => c.id === id);
  }, [customers]);

  const addFarmer = useCallback((farmer: Omit<Farmer, 'id'>) => {
    const newFarmer = { ...farmer, id: crypto.randomUUID() };
    setFarmers(prev => [...prev, newFarmer]);
  }, []);

  const updateFarmer = useCallback((updatedFarmer: Farmer) => {
    setFarmers(prev => prev.map(f => f.id === updatedFarmer.id ? updatedFarmer : f));
  }, []);

  const deleteFarmer = useCallback((id: string) => {
    setFarmers(prev => prev.filter(f => f.id !== id));
    setFarmerEntries(prev => prev.filter(e => e.farmerId !== id));
    setFarmerPayments(prev => prev.filter(p => p.farmerId !== id));
  }, []);

  const addOrUpdateFarmerEntry = useCallback((entryData: Omit<FarmerMilkEntry, 'id'>) => {
    setFarmerEntries(prevEntries => {
      const entryDate = entryData.date;
      const existingEntryIndex = prevEntries.findIndex(e => e.farmerId === entryData.farmerId && e.date === entryDate);
      if (existingEntryIndex > -1) {
        const updatedEntries = [...prevEntries];
        const existingEntry = updatedEntries[existingEntryIndex];
        updatedEntries[existingEntryIndex] = { ...existingEntry, ...entryData };
        return updatedEntries;
      } else {
        return [...prevEntries, { ...entryData, id: crypto.randomUUID() }];
      }
    });
  }, []);

  const getFarmerEntry = useCallback((farmerId: string, date: string): FarmerMilkEntry | undefined => {
    return farmerEntries.find(e => e.farmerId === farmerId && e.date === date);
  }, [farmerEntries]);

  const getFarmerById = useCallback((id: string) => {
    return farmers.find(f => f.id === id);
  }, [farmers]);

  const addFarmerPayment = useCallback((payment: Omit<FarmerPayment, 'id'>) => {
    const newPayment = { ...payment, id: crypto.randomUUID() };
    setFarmerPayments(prev => [...prev, newPayment]);
  }, []);

  const updateFarmerPayment = useCallback((updatedPayment: FarmerPayment) => {
    setFarmerPayments(prev => prev.map(p => p.id === updatedPayment.id ? updatedPayment : p));
  }, []);

  const deleteFarmerPayment = useCallback((id: string) => {
    setFarmerPayments(prev => prev.filter(p => p.id !== id));
  }, []);

  const addOrUpdateProductEntry = useCallback((entryData: Omit<ProductEntry, 'id'>) => {
    setProductEntries(prevEntries => {
        return [...prevEntries, { ...entryData, id: crypto.randomUUID() }];
    });
  }, []);

  const deleteProductEntry = useCallback((id: string) => {
    setProductEntries(prev => prev.filter(p => p.id !== id));
  }, []);

  const addLeftoverSale = useCallback((sale: Omit<LeftoverSale, 'id'>) => {
    const newSale = { ...sale, id: crypto.randomUUID() };
    setLeftoverSales(prev => [...prev, newSale]);
  }, []);

  const setLanguage = useCallback((lang: Language) => { setLanguageState(lang); }, []);
  const setInAppRemindersEnabled = useCallback((enabled: boolean) => { setInAppRemindersEnabledState(enabled); }, []);

  const t = useCallback((key: keyof typeof translations.en) => {
    return translations[language]?.[key] || translations.en[key];
  }, [language]);
  
  const exportBackup = useCallback(() => {
    const backupData = { customers, entries, farmers, farmerEntries, farmerPayments, productEntries, leftoverSales, language, inAppRemindersEnabled };
    const jsonString = JSON.stringify(backupData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `milk-diary-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [customers, entries, farmers, farmerEntries, farmerPayments, productEntries, leftoverSales, language, inAppRemindersEnabled]);

  const restoreBackup = useCallback((backupData: any): boolean => {
    try {
      const isValid = backupData && 
                      Array.isArray(backupData.customers) && 
                      Array.isArray(backupData.entries);

      if (isValid) {
        setCustomers(backupData.customers || []);
        setEntries(backupData.entries || []);
        setFarmers(backupData.farmers || []);
        setFarmerEntries(backupData.farmerEntries || []);
        setFarmerPayments(backupData.farmerPayments || []);
        setProductEntries(backupData.productEntries || []);
        setLeftoverSales(backupData.leftoverSales || []);
        setLanguageState((backupData.language && (backupData.language === 'en' || backupData.language === 'hi')) ? backupData.language : 'en');
        setInAppRemindersEnabledState(backupData.inAppRemindersEnabled ?? true);
        
        db.set('customers', backupData.customers || []);
        db.set('entries', backupData.entries || []);
        db.set('farmers', backupData.farmers || []);
        db.set('farmerEntries', backupData.farmerEntries || []);
        db.set('farmerPayments', backupData.farmerPayments || []);
        db.set('productEntries', backupData.productEntries || []);
        db.set('leftoverSales', backupData.leftoverSales || []);
        db.set('language', (backupData.language && (backupData.language === 'en' || backupData.language === 'hi')) ? backupData.language : 'en');
        db.set('inAppRemindersEnabled', backupData.inAppRemindersEnabled ?? true);

        return true;
      }
      return false;
    } catch (error) {
      console.error("Error restoring backup:", error);
      return false;
    }
  }, []);

  const resetAllData = useCallback(async () => {
    // Clear state
    setCustomers([]);
    setEntries([]);
    setFarmers([]);
    setFarmerEntries([]);
    setFarmerPayments([]);
    setProductEntries([]);
    setLeftoverSales([]);

    try {
      await db.del('customers');
      await db.del('entries');
      await db.del('farmers');
      await db.del('farmerEntries');
      await db.del('farmerPayments');
      await db.del('productEntries');
      await db.del('leftoverSales');
    } catch (error) {
      console.error("Failed to clear IndexedDB:", error);
    }
  }, []);

  return (
    <AppContext.Provider value={{ customers, entries, farmers, farmerEntries, farmerPayments, productEntries, leftoverSales, addCustomer, updateCustomer, deleteCustomer, addOrUpdateEntry, getEntry, getCustomerById, addFarmer, updateFarmer, deleteFarmer, addOrUpdateFarmerEntry, getFarmerEntry, getFarmerById, addFarmerPayment, updateFarmerPayment, deleteFarmerPayment, addOrUpdateProductEntry, deleteProductEntry, addLeftoverSale, language, setLanguage, t, exportBackup, restoreBackup, inAppRemindersEnabled, setInAppRemindersEnabled, resetAllData, isDataLoaded }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
