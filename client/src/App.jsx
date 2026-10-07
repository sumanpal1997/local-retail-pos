import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import LandingPage from './components/LandingPage';
import AuthModal from './components/AuthModal';
import POSTerminal from './components/POSTerminal';
import Inventory from './components/Inventory';
import KhataLedger from './components/KhataLedger';
import Dashboard from './components/Dashboard';
import SuperAdminDashboard from './components/SuperAdminDashboard';
import AIInvoiceScanner from './components/AIInvoiceScanner';
import ReceiptModal from './components/ReceiptModal';
import { 
  fetchProducts, 
  saveProduct, 
  updateProductStock, 
  fetchCustomers, 
  saveCustomer, 
  recordCustomerPayment, 
  recordCustomerCredit,
  submitOrder, 
  fetchOrders, 
  getStoreProfile,
  fetchStoreProfile,
  updateStoreProfile,
  getCurrentUser,
  logoutUser
} from './services/api';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [currentView, setCurrentView] = useState('landing'); // 'landing' | 'app'
  const [activeTab, setActiveTab] = useState('pos'); // 'pos' | 'inventory' | 'khata' | 'dashboard' | 'superadmin'
  
  // Auth Modal State
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState('login');
  const [authModalPlan, setAuthModalPlan] = useState('pro');

  // Business Data
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [storeInfo, setStoreInfo] = useState(null);
  const [completedOrder, setCompletedOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize session & data
  const loadStoreData = async () => {
    const profile = await fetchStoreProfile();
    setStoreInfo(profile);

    const [prods, custs, ords] = await Promise.all([
      fetchProducts(),
      fetchCustomers(),
      fetchOrders()
    ]);

    setProducts(prods);
    setCustomers(custs);
    setOrders(ords);
  };

  const handleUpdateStoreInfo = async (newProfile) => {
    const saved = await updateStoreProfile(newProfile);
    setStoreInfo(saved);
    return saved;
  };

  useEffect(() => {
    const initApp = async () => {
      setIsLoading(true);
      const user = getCurrentUser();
      if (user) {
        setCurrentUser(user);
        setCurrentView('app');
        if (user.role === 'superadmin') {
          setActiveTab('superadmin');
        } else {
          setActiveTab('pos');
        }
      } else {
        setCurrentView('landing');
      }

      await loadStoreData();
      setIsLoading(false);
    };

    initApp();
  }, []);

  // Auth Handlers
  const handleOpenLogin = () => {
    setAuthModalMode('login');
    setIsAuthModalOpen(true);
  };

  const handleOpenRegister = (plan = 'pro') => {
    setAuthModalMode('register');
    setAuthModalPlan(plan);
    setIsAuthModalOpen(true);
  };

  const handleAuthSuccess = async (authenticatedStore) => {
    setCurrentUser(authenticatedStore);
    setStoreInfo(authenticatedStore);
    setCurrentView('app');

    // Smart role-based routing
    if (authenticatedStore.role === 'superadmin') {
      setActiveTab('superadmin');
    } else {
      setActiveTab('pos');
    }

    await loadStoreData();
  };

  const handleLogout = () => {
    logoutUser();
    setCurrentUser(null);
    setCurrentView('landing');
  };

  // Store Operations Handlers
  const handleOrderCompleted = async (orderPayload) => {
    const savedOrder = await submitOrder(orderPayload);
    const [updatedProds, updatedCusts, updatedOrds] = await Promise.all([
      fetchProducts(),
      fetchCustomers(),
      fetchOrders()
    ]);
    setProducts(updatedProds);
    setCustomers(updatedCusts);
    setOrders(updatedOrds);
    setCompletedOrder(savedOrder);
  };

  const handleAddProduct = async (newProduct) => {
    await saveProduct(newProduct);
    const updated = await fetchProducts();
    setProducts(updated);
  };

  const handleUpdateStock = async (id, delta) => {
    await updateProductStock(id, delta);
    const updated = await fetchProducts();
    setProducts(updated);
  };

  const handleAddCustomer = async (cust) => {
    await saveCustomer(cust);
    const updated = await fetchCustomers();
    setCustomers(updated);
  };

  const handleRecordPayment = async (id, amount, mode, notes, date) => {
    await recordCustomerPayment(id, amount, mode, notes, date);
    const updated = await fetchCustomers();
    setCustomers(updated);
  };

  const handleRecordCredit = async (id, amount, notes, date) => {
    await recordCustomerCredit(id, amount, notes, date);
    const updated = await fetchCustomers();
    setCustomers(updated);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-xs font-semibold text-slate-400">Loading RetailPOS Cloud...</p>
      </div>
    );
  }

  // If visitor is on the Landing Page
  if (currentView === 'landing') {
    return (
      <>
        <LandingPage 
          onOpenLogin={handleOpenLogin} 
          onOpenRegister={handleOpenRegister} 
        />
        <AuthModal
          isOpen={isAuthModalOpen}
          initialMode={authModalMode}
          initialPlan={authModalPlan}
          onClose={() => setIsAuthModalOpen(false)}
          onAuthSuccess={handleAuthSuccess}
        />
      </>
    );
  }

  // If authenticated user is inside the Workspace (Merchant or Super Admin)
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col">
      {/* Top Navigation */}
      <Navbar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        storeInfo={storeInfo}
        currentUser={currentUser}
        onLogout={handleLogout}
        onNavigateHome={() => setCurrentView('landing')}
      />

      {/* Main Content Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {activeTab === 'pos' && (
          <POSTerminal
            products={products}
            onOrderCompleted={handleOrderCompleted}
            storeInfo={storeInfo}
            onUpdateStoreInfo={handleUpdateStoreInfo}
          />
        )}

        {activeTab === 'inventory' && (
          <Inventory
            products={products}
            onAddProduct={handleAddProduct}
            onUpdateStock={handleUpdateStock}
            storeInfo={storeInfo}
            onOpenAIScanner={() => setActiveTab('ai-scanner')}
          />
        )}

        {activeTab === 'ai-scanner' && (
          <AIInvoiceScanner
            onRestockCompleted={async () => {
              const updatedProds = await fetchProducts();
              setProducts(updatedProds);
            }}
            onNavigatePOS={() => setActiveTab('pos')}
            onNavigateInventory={() => setActiveTab('inventory')}
          />
        )}

        {activeTab === 'khata' && (
          <KhataLedger
            customers={customers}
            onAddCustomer={handleAddCustomer}
            onRecordPayment={handleRecordPayment}
            onRecordCredit={handleRecordCredit}
            storeInfo={storeInfo}
          />
        )}

        {activeTab === 'dashboard' && (
          <Dashboard
            orders={orders}
            products={products}
            customers={customers}
            storeInfo={storeInfo}
          />
        )}

        {activeTab === 'superadmin' && (
          <SuperAdminDashboard />
        )}
      </main>

      {/* Completed Order Receipt Modal (Print & WhatsApp) */}
      {completedOrder && (
        <ReceiptModal
          order={completedOrder}
          storeInfo={storeInfo}
          onClose={() => setCompletedOrder(null)}
        />
      )}

      {/* Auth Modal (if opened while in app) */}
      <AuthModal
        isOpen={isAuthModalOpen}
        initialMode={authModalMode}
        initialPlan={authModalPlan}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />
    </div>
  );
}
