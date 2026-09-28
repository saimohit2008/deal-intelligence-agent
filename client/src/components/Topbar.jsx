import React from 'react';
import { Search, Building2, PlusCircle, Sparkles, Bot, ShieldCheck, Bell } from 'lucide-react';

export default function Topbar({ 
  activeTab, 
  deals, 
  selectedDealId, 
  setSelectedDealId, 
  onOpenNewDeal,
  searchQuery,
  setSearchQuery
}) {
  const currentDeal = deals.find(d => d.id === Number(selectedDealId)) || deals[0];

  const getBreadcrumbTitle = () => {
    switch (activeTab) {
      case 'dashboard': return 'Deal Intelligence Overview';
      case 'details': return `Deal Details — ${currentDeal?.company || 'Acme Corp'}`;
      case 'agent': return `AI Agent Copilot — ${currentDeal?.company || 'Acme Corp'}`;
      case 'add_interaction': return 'Log Interaction Note';
      case 'settings': return 'Platform Settings';
      default: return 'Deal Intelligence';
    }
  };

  return (
    <header className="h-16 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/80 px-4 sm:px-6 flex items-center justify-between gap-4 sticky top-0 z-20">
      
      {/* Context Breadcrumb */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
          <span className="text-slate-400">Platform</span>
          <span>/</span>
          <span className="text-white font-bold">{getBreadcrumbTitle()}</span>
        </div>

        {activeTab === 'details' && currentDeal && (
          <span className={`hidden sm:inline-flex px-2.5 py-0.5 text-[10px] font-bold rounded-full border ${
            currentDeal.health === 'At Risk'
              ? 'bg-amber-950/80 text-amber-300 border-amber-700/60'
              : 'bg-emerald-950/80 text-emerald-300 border-emerald-700/60'
          }`}>
            {currentDeal.health}
          </span>
        )}
      </div>

      {/* Center Search Input */}
      <div className="hidden lg:flex items-center max-w-sm w-full bg-slate-900/80 border border-slate-800/80 rounded-xl px-3 py-1.5 focus-within:border-indigo-500/60 transition-all">
        <Search className="w-4 h-4 text-slate-400 shrink-0 mr-2" />
        <input
          type="text"
          value={searchQuery || ''}
          onChange={(e) => setSearchQuery && setSearchQuery(e.target.value)}
          placeholder="Search deal memories, stakeholders, concerns..."
          className="bg-transparent text-xs text-slate-200 placeholder-slate-500 focus:outline-none w-full"
        />
        <span className="text-[10px] text-slate-500 font-mono bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">⌘K</span>
      </div>

      {/* Right Header Actions */}
      <div className="flex items-center gap-3">
        {deals.length > 0 && (
          <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-800 rounded-xl px-2.5 py-1.5 shadow-sm">
            <Building2 className="w-3.5 h-3.5 text-indigo-400" />
            <select
              value={selectedDealId || ''}
              onChange={(e) => setSelectedDealId(Number(e.target.value))}
              className="bg-transparent text-xs font-semibold text-slate-100 focus:outline-none cursor-pointer"
            >
              {deals.map(deal => (
                <option key={deal.id} value={deal.id} className="bg-slate-950 text-slate-100">
                  {deal.company} (${deal.value ? (deal.value/1000).toFixed(0) + 'k' : 0})
                </option>
              ))}
            </select>
          </div>
        )}

        <button
          onClick={onOpenNewDeal}
          className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-md shadow-indigo-600/20 transition-all flex items-center gap-1.5 shrink-0"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">+ New Deal</span>
        </button>
      </div>

    </header>
  );
}
