import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  TrendingUp, 
  CreditCard, 
  DollarSign, 
  Activity, 
  CheckCircle, 
  Ban, 
  Plus, 
  RefreshCw, 
  Search, 
  ShieldCheck, 
  Globe, 
  BarChart2
} from 'lucide-react';
import { fetchSuperAdminOverview, updateStoreStatus, createOrganization } from '../services/api';

export default function SuperAdminDashboard() {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [planFilter, setPlanFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [actionMessage, setActionMessage] = useState(null);

  // New Store Form State
  const [newStore, setNewStore] = useState({
    storeName: '',
    ownerName: '',
    email: '',
    phone: '',
    city: '',
    plan: 'pro'
  });

  const loadData = async () => {
    setIsLoading(true);
    const result = await fetchSuperAdminOverview();
    if (result) {
      setData(result);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggleStatus = async (store) => {
    const nextStatus = store.status === 'active' ? 'suspended' : 'active';
    const res = await updateStoreStatus(store._id, { status: nextStatus });
    if (res) {
      setActionMessage({
        type: 'success',
        text: `Updated ${store.storeName} status to "${nextStatus.toUpperCase()}"`
      });
      loadData();
    }
  };

  const handleChangePlan = async (storeId, newPlan) => {
    const fee = newPlan === 'enterprise' ? 1999 : newPlan === 'pro' ? 799 : 0;
    const res = await updateStoreStatus(storeId, { plan: newPlan, monthlyFee: fee });
    if (res) {
      setActionMessage({
        type: 'success',
        text: `Updated store subscription plan to ${newPlan.toUpperCase()}`
      });
      loadData();
    }
  };

  const handleCreateStore = async (e) => {
    e.preventDefault();
    if (!newStore.storeName || !newStore.ownerName || !newStore.email || !newStore.phone) return;

    const res = await createOrganization(newStore);
    if (res) {
      setActionMessage({
        type: 'success',
        text: `Successfully provisioned organization "${newStore.storeName}"!`
      });
      setIsCreateModalOpen(false);
      setNewStore({
        storeName: '',
        ownerName: '',
        email: '',
        phone: '',
        city: '',
        plan: 'pro'
      });
      loadData();
    }
  };

  if (isLoading && !data) {
    return (
      <div className="min-h-[500px] flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-xs font-semibold text-slate-600">Gathering Platform SaaS Telemetry...</p>
      </div>
    );
  }

  const { summary, dailyTransactions = [], storesBreakdown = [], recentPlatformOrders = [] } = data || {};

  // Find max daily amount for chart scale
  const maxDailyAmount = Math.max(...dailyTransactions.map(d => d.totalAmount || 0), 1000);

  // Filter stores
  const filteredStores = storesBreakdown.filter(s => {
    const matchesSearch = 
      s.storeName.toLowerCase().includes(search.toLowerCase()) ||
      s.ownerName.toLowerCase().includes(search.toLowerCase()) ||
      s.city.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase());
    const matchesPlan = planFilter === 'ALL' || s.plan === planFilter;
    const matchesStatus = statusFilter === 'ALL' || s.status === statusFilter;
    return matchesSearch && matchesPlan && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Top Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 border border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-indigo-500/20 text-indigo-300 text-[11px] px-2.5 py-0.5 rounded-full font-bold border border-indigo-400/30 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" /> SaaS Product Owner Console
            </span>
            <span className="bg-emerald-500/20 text-emerald-300 text-[11px] px-2.5 py-0.5 rounded-full font-bold border border-emerald-400/30 flex items-center gap-1">
              <Activity className="w-3 h-3 text-emerald-400 animate-pulse" /> Live Telemetry
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight">Super Admin Platform Overview</h1>
          <p className="text-xs text-slate-300 mt-1 max-w-xl">
            Real-time monitoring across all onboarded retail organizations, daily transaction volumes, subscription MRR, and platform-wide invoice streams.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            disabled={isLoading}
            className="p-2.5 bg-slate-800/80 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700 transition flex items-center gap-1.5"
            title="Refresh metrics"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/30 transition flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Provision New Organization
          </button>
        </div>
      </div>

      {/* Action Notification */}
      {actionMessage && (
        <div className="bg-indigo-50 border border-indigo-200 text-indigo-900 p-3.5 rounded-xl text-xs font-medium flex items-center justify-between animate-in fade-in">
          <span>{actionMessage.text}</span>
          <button onClick={() => setActionMessage(null)} className="font-bold text-indigo-500 hover:text-indigo-800">✕</button>
        </div>
      )}

      {/* 4 High-Impact KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Organizations */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Organizations</span>
            <p className="text-3xl font-black text-slate-900 mt-1">{summary?.totalOrganizations || 0}</p>
            <div className="flex items-center gap-2 mt-2 text-[11px] text-slate-600">
              <span className="text-emerald-600 font-bold flex items-center gap-0.5">
                <CheckCircle className="w-3 h-3" /> {summary?.activeOrganizationsCount || 0} Active
              </span>
              <span>•</span>
              <span className="text-indigo-600 font-bold">{summary?.activeOrganizationsToday || 0} Transacting Today</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Building2 className="w-6 h-6" />
          </div>
        </div>

        {/* Today's Platform GMV */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Today's Platform GMV</span>
            <p className="text-3xl font-black text-emerald-600 mt-1">
              ₹{(summary?.todayPlatformGMV || 0).toLocaleString()}
            </p>
            <span className="text-[11px] text-slate-500 mt-2 block font-medium">
              Processed across <strong className="text-slate-800">{summary?.todayOrderCount || 0}</strong> orders today
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        {/* Lifetime Processed GMV */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Lifetime Platform GMV</span>
            <p className="text-3xl font-black text-slate-900 mt-1">
              ₹{(summary?.totalPlatformGMV || 0).toLocaleString()}
            </p>
            <span className="text-[11px] text-slate-500 mt-2 block font-medium">
              Across <strong className="text-slate-800">{summary?.totalOrdersCount || 0}</strong> total store invoices
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <CreditCard className="w-6 h-6" />
          </div>
        </div>

        {/* SaaS Recurring Revenue (MRR) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Projected SaaS MRR</span>
            <p className="text-3xl font-black text-indigo-600 mt-1">
              ₹{(summary?.estimatedSaaSMRR || 0).toLocaleString()}
            </p>
            <span className="text-[11px] text-slate-500 mt-2 block font-medium">
              Annual Run Rate: <strong className="text-slate-800">₹{((summary?.estimatedSaaSMRR || 0) * 12).toLocaleString()}</strong>
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Daily Transaction Growth (Past 7 Days Bar Chart) */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-indigo-600" />
              <h3 className="font-bold text-slate-900 text-sm">Platform Daily Transaction Volume (Past 7 Days)</h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Aggregate gross merchant volume and order velocity processed per day across all shops
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg font-medium">
              Average: ₹{Math.round(dailyTransactions.reduce((acc, d) => acc + d.totalAmount, 0) / (dailyTransactions.length || 1)).toLocaleString()} / day
            </span>
          </div>
        </div>

        {/* Chart Bars */}
        <div className="grid grid-cols-7 gap-2 sm:gap-4 items-end h-44 pt-6 pb-2">
          {(() => {
            const todayStr = new Date().toISOString().slice(0, 10);
            return dailyTransactions.map((day) => {
              const heightPercent = Math.max(12, Math.round((day.totalAmount / maxDailyAmount) * 100));
              const isToday = day.date === todayStr;

            return (
              <div key={day.date} className="flex flex-col items-center h-full justify-end group relative">
                {/* Tooltip */}
                <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-10 bg-slate-900 text-white text-[10px] py-1 px-2 rounded font-semibold whitespace-nowrap pointer-events-none z-10 shadow-lg">
                  ₹{day.totalAmount.toLocaleString()} ({day.orderCount} orders)
                </div>

                {/* Amount label */}
                <span className="text-[10px] font-bold text-slate-500 mb-1 opacity-80 group-hover:opacity-100">
                  ₹{Math.round(day.totalAmount / 1000)}k
                </span>

                {/* Bar */}
                <div 
                  style={{ height: `${heightPercent}%` }}
                  className={`w-full max-w-[42px] rounded-t-lg transition-all duration-300 ${
                    isToday
                      ? 'bg-gradient-to-t from-indigo-700 to-indigo-500 shadow-md shadow-indigo-300'
                      : 'bg-gradient-to-t from-slate-200 to-indigo-200 group-hover:from-indigo-400 group-hover:to-indigo-300'
                  }`}
                />

                {/* Date Label */}
                <span className={`text-[11px] font-semibold mt-2 ${isToday ? 'text-indigo-600 font-bold' : 'text-slate-600'}`}>
                  {day.label}
                </span>
                <span className="text-[9px] text-slate-400">
                  {day.orderCount} txns
                </span>
              </div>
            );
          });
        })()}
        </div>
      </div>

      {/* Main Grid: Organization League & Live Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Attached Organizations Table (8 Cols) */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col overflow-hidden">
          <div className="p-5 border-b border-slate-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Connected Organizations Directory</h3>
                <p className="text-xs text-slate-500">Retail merchants currently subscribed and operating on the platform</p>
              </div>

              {/* Filter Pills */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex gap-1 overflow-x-auto bg-slate-100 p-1 rounded-xl">
                  {['ALL', 'starter', 'pro', 'enterprise'].map((p) => (
                    <button
                      key={p}
                      onClick={() => setPlanFilter(p)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold capitalize transition ${
                        planFilter === p
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>

                <div className="flex gap-1 overflow-x-auto bg-slate-100 p-1 rounded-xl">
                  {['ALL', 'active', 'trial', 'suspended'].map((st) => (
                    <button
                      key={st}
                      onClick={() => setStatusFilter(st)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold capitalize transition ${
                        statusFilter === st
                          ? 'bg-slate-900 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Search Input */}
            <div className="mt-4 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search organizations by name, owner, city or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Store Name & City</th>
                  <th className="px-4 py-3">Owner Contact</th>
                  <th className="px-4 py-3">SaaS Plan</th>
                  <th className="px-4 py-3 text-right">Today's Sales</th>
                  <th className="px-4 py-3 text-right">Lifetime Volume</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStores.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="p-8 text-center text-slate-400">
                      No organizations found matching your criteria.
                    </td>
                  </tr>
                ) : (
                  filteredStores.map((store) => {
                    const isSuspended = store.status === 'suspended';
                    const isTrial = store.status === 'trial';

                    return (
                      <tr key={store._id} className="hover:bg-slate-50/80 transition">
                        <td className="px-4 py-3">
                          <div className="font-bold text-slate-900">{store.storeName}</div>
                          <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                            <Globe className="w-3 h-3" /> {store.city} {store.state ? `(${store.state})` : ''}
                          </div>
                        </td>

                        <td className="px-4 py-3">
                          <div className="font-semibold text-slate-700">{store.ownerName}</div>
                          <div className="text-[11px] text-slate-400">{store.phone}</div>
                        </td>

                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            store.plan === 'enterprise'
                              ? 'bg-purple-100 text-purple-800 border border-purple-200'
                              : store.plan === 'pro'
                              ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                              : 'bg-slate-100 text-slate-700 border border-slate-200'
                          }`}>
                            {store.plan}
                          </span>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            ₹{store.monthlyFee}/mo
                          </div>
                        </td>

                        <td className="px-4 py-3 text-right">
                          <div className="font-bold text-slate-900">₹{(store.todayVolume || 0).toLocaleString()}</div>
                          <div className="text-[10px] text-slate-400">{store.todayOrders || 0} orders</div>
                        </td>

                        <td className="px-4 py-3 text-right">
                          <div className="font-extrabold text-emerald-700">₹{(store.totalVolume || 0).toLocaleString()}</div>
                          <div className="text-[10px] text-slate-400">{store.totalOrders || 0} invoices</div>
                        </td>

                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isSuspended
                              ? 'bg-rose-100 text-rose-800'
                              : isTrial
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {store.status}
                          </span>
                        </td>

                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleToggleStatus(store)}
                              className={`p-1.5 rounded-lg text-xs font-semibold transition ${
                                isSuspended
                                  ? 'bg-emerald-100 hover:bg-emerald-200 text-emerald-800'
                                  : 'bg-rose-50 hover:bg-rose-100 text-rose-700'
                              }`}
                              title={isSuspended ? 'Activate Organization' : 'Suspend Organization'}
                            >
                              {isSuspended ? <CheckCircle className="w-3.5 h-3.5" /> : <Ban className="w-3.5 h-3.5" />}
                            </button>

                            <select
                              value={store.plan}
                              onChange={(e) => handleChangePlan(store._id, e.target.value)}
                              className="bg-slate-100 text-[10px] font-bold text-slate-700 py-1 px-1.5 rounded border border-slate-200 focus:outline-none"
                            >
                              <option value="starter">Starter</option>
                              <option value="pro">Pro</option>
                              <option value="enterprise">Enterprise</option>
                            </select>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Live Platform Order Stream (4 Cols) */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-600 animate-pulse" />
              <h3 className="font-bold text-slate-900 text-xs">Live Cross-Store Transaction Stream</h3>
            </div>
            <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
              Real-Time
            </span>
          </div>

          <div className="divide-y divide-slate-100 overflow-y-auto max-h-[500px]">
            {recentPlatformOrders.length === 0 ? (
              <p className="p-6 text-center text-xs text-slate-400">No transactions recorded yet.</p>
            ) : (
              recentPlatformOrders.map((ord) => (
                <div key={ord._id} className="p-3.5 hover:bg-slate-50 transition">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-indigo-700 text-xs">{ord.storeName}</span>
                    <span className="font-black text-slate-900 text-xs">₹{ord.grandTotal}</span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span className="font-mono text-[10px] text-slate-400">#{ord.invoiceNumber}</span>
                    <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-[10px] font-semibold">
                      {ord.paymentMethod}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                    <span>{ord.customerName}</span>
                    <span>{new Date(ord.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Provision New Organization Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="font-bold text-base text-slate-900 mb-1">Provision New Retail Organization</h3>
            <p className="text-xs text-slate-500 mb-4">Onboard a new merchant organization to the SaaS platform</p>

            <form onSubmit={handleCreateStore} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Store / Business Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Royal Mart Supermarket"
                  value={newStore.storeName}
                  onChange={(e) => setNewStore({ ...newStore, storeName: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Owner Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Vikram Singhania"
                  value={newStore.ownerName}
                  onChange={(e) => setNewStore({ ...newStore, ownerName: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Email *</label>
                  <input
                    type="email"
                    required
                    placeholder="store@domain.com"
                    value={newStore.email}
                    onChange={(e) => setNewStore({ ...newStore, email: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Phone *</label>
                  <input
                    type="tel"
                    required
                    placeholder="98XXXXXXXX"
                    value={newStore.phone}
                    onChange={(e) => setNewStore({ ...newStore, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">City / Region</label>
                  <input
                    type="text"
                    placeholder="e.g. Mumbai"
                    value={newStore.city}
                    onChange={(e) => setNewStore({ ...newStore, city: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">SaaS Plan</label>
                  <select
                    value={newStore.plan}
                    onChange={(e) => setNewStore({ ...newStore, plan: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="starter">Starter (₹0/mo)</option>
                    <option value="pro">Pro Merchant (₹799/mo)</option>
                    <option value="enterprise">Enterprise (₹1,999/mo)</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="flex-1 py-2 rounded-lg border border-slate-200 font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-sm"
                >
                  Provision Store
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
