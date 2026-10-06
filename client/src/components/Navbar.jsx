import React from 'react';
import { ShoppingCart, Package, BookOpen, BarChart3, Store, Sparkles, LogOut, Home, ShieldCheck } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, storeInfo, currentUser, onLogout, onNavigateHome }) {
  const isSuperAdmin = currentUser?.role === 'superadmin';

  const merchantNavItems = [
    { id: 'pos', label: 'POS Billing', icon: ShoppingCart },
    { id: 'inventory', label: 'Inventory & Stock', icon: Package },
    { id: 'ai-scanner', label: 'AI Bill Restock', icon: Sparkles, isAi: true },
    { id: 'khata', label: 'Customer Khata', icon: BookOpen },
    { id: 'dashboard', label: 'Store Insights', icon: BarChart3 },
  ];

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs print:hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Store / Admin Profile */}
          <div className="flex items-center gap-3">
            <div 
              onClick={onNavigateHome}
              className={`h-10 w-10 rounded-xl flex items-center justify-center text-white shadow-md cursor-pointer transition ${
                isSuperAdmin 
                  ? 'bg-indigo-600 shadow-indigo-200 hover:bg-indigo-700' 
                  : 'bg-emerald-600 shadow-emerald-200 hover:bg-emerald-700'
              }`}
              title="Return to Landing Page"
            >
              {isSuperAdmin ? <ShieldCheck className="h-5 w-5" /> : <Store className="h-5 w-5" />}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 text-base sm:text-lg leading-tight tracking-tight">
                  {isSuperAdmin ? 'SaaS Super Admin HQ' : (storeInfo?.storeName || 'Local Retail POS')}
                </span>
                
                {isSuperAdmin ? (
                  <span className="bg-indigo-50 text-indigo-700 text-[10px] px-2 py-0.5 rounded-full font-bold border border-indigo-200 flex items-center gap-1">
                    👑 Product Owner
                  </span>
                ) : (
                  <span className="bg-emerald-50 text-emerald-700 text-[10px] px-2 py-0.5 rounded-full font-semibold border border-emerald-200 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-emerald-500" />
                    {storeInfo?.plan ? `${storeInfo.plan.toUpperCase()} Plan` : 'Live'}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">
                {isSuperAdmin 
                  ? `Logged in as ${currentUser?.email || 'admin@retailpos.com'}`
                  : `${storeInfo?.ownerName || 'Merchant'} • ${storeInfo?.address?.city || 'Local Store'}`}
              </p>
            </div>
          </div>

          {/* Navigation Controls */}
          <nav className="flex items-center space-x-1 sm:space-x-2">
            {/* If Super Admin, show toggle to switch between admin console and previewing the store */}
            {isSuperAdmin ? (
              <>
                <button
                  onClick={() => setActiveTab('superadmin')}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all border ${
                    activeTab === 'superadmin'
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                      : 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100'
                  }`}
                >
                  <span>👑 Admin Console</span>
                </button>
                <button
                  onClick={() => setActiveTab('pos')}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                    activeTab === 'pos'
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                  title="Test Terminal Experience"
                >
                  <ShoppingCart className="w-4 h-4" />
                  <span className="hidden sm:inline">POS Preview</span>
                </button>
              </>
            ) : (
              merchantNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                      isActive
                        ? item.isAi 
                          ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-300' 
                          : 'bg-emerald-600 text-white shadow-sm shadow-emerald-300'
                        : item.isAi
                          ? 'text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 font-semibold'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="hidden md:inline">{item.label}</span>
                    {item.isAi && (
                      <span className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded-full uppercase tracking-wider ${
                        isActive ? 'bg-white/20 text-white' : 'bg-indigo-100 text-indigo-700'
                      }`}>
                        AI
                      </span>
                    )}
                  </button>
                );
              })
            )}

            {/* Quick Landing Page / Home button */}
            <div className="h-6 w-px bg-slate-200 mx-1 hidden sm:block"></div>
            <button
              onClick={onNavigateHome}
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
              title="Return to SaaS Landing Page"
            >
              <Home className="w-4 h-4" />
            </button>

            {/* Log Out button */}
            <button
              onClick={onLogout}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg border border-rose-200 transition"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
}
