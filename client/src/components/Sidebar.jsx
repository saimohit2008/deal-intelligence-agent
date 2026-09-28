import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Building2, 
  Bot, 
  PlusCircle, 
  Settings, 
  ChevronLeft, 
  ChevronRight, 
  BrainCircuit, 
  Sparkles, 
  RotateCcw,
  FileText,
  Flame,
  ShieldCheck,
  Search
} from 'lucide-react';

export default function Sidebar({ 
  activeTab, 
  setActiveTab, 
  deals, 
  selectedDealId, 
  setSelectedDealId, 
  onResetSeed, 
  onOpenNewDeal 
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const selectedDeal = deals.find(d => d.id === Number(selectedDealId)) || deals[0];

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'details', label: 'Deal Details', icon: Building2, badge: selectedDeal?.company },
    { id: 'agent', label: 'AI Agent', icon: Bot, isAi: true },
    { id: 'add_interaction', label: 'Add Interaction', icon: PlusCircle },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  return (
    <aside 
      className={`relative bg-slate-950/90 backdrop-blur-xl border-r border-slate-800/80 flex flex-col justify-between transition-all duration-300 z-30 shrink-0 ${
        isCollapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Top Brand Logo Section */}
      <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
        {!isCollapsed ? (
          <div 
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => setActiveTab('dashboard')}
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/20 group-hover:scale-105 transition-transform">
              <BrainCircuit className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm text-white tracking-tight">Deal Intelligence</span>
              </div>
              <p className="text-[10px] font-semibold text-indigo-400 tracking-wider uppercase">HINDSIGHT MEMORY</p>
            </div>
          </div>
        ) : (
          <div 
            className="w-9 h-9 mx-auto rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white cursor-pointer"
            onClick={() => setActiveTab('dashboard')}
            title="Deal Intelligence Agent"
          >
            <BrainCircuit className="w-5 h-5" />
          </div>
        )}

        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden md:flex p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900 border border-transparent hover:border-slate-800 transition-all"
          title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Main Navigation Items */}
      <div className="px-3 py-4 flex-1 space-y-6 overflow-y-auto">
        
        {/* Deal Context Selector Pill */}
        {!isCollapsed && deals.length > 0 && (
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-2.5 space-y-1.5 shadow-inner">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <Building2 className="w-3 h-3 text-indigo-400" /> Active Context:
            </span>
            <select
              value={selectedDealId || ''}
              onChange={(e) => setSelectedDealId(Number(e.target.value))}
              className="w-full bg-slate-950 text-xs font-semibold text-slate-100 rounded-lg p-1.5 border border-slate-800 focus:outline-none cursor-pointer"
            >
              {deals.map(deal => (
                <option key={deal.id} value={deal.id}>
                  {deal.company} (${deal.value ? (deal.value/1000).toFixed(0) + 'k' : 0})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Navigation List */}
        <div className="space-y-1">
          {!isCollapsed && (
            <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Navigation
            </p>
          )}

          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center ${isCollapsed ? 'justify-center px-0 py-2.5' : 'justify-between px-3 py-2.5'} rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-indigo-600/15 text-indigo-300 border border-indigo-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/80 border border-transparent'
                }`}
                title={isCollapsed ? item.label : undefined}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-400' : 'text-slate-400'}`} />
                  {!isCollapsed && <span>{item.label}</span>}
                </div>

                {!isCollapsed && item.isAi && (
                  <span className="px-2 py-0.5 text-[9px] font-bold bg-indigo-500/20 text-indigo-300 rounded-full border border-indigo-500/30 flex items-center gap-1">
                    <Sparkles className="w-2.5 h-2.5" /> AI
                  </span>
                )}

                {!isCollapsed && item.badge && !item.isAi && (
                  <span className="text-[10px] text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800 truncate max-w-[80px]">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Quick Action Button */}
        {!isCollapsed && (
          <div className="pt-2">
            <button
              onClick={onOpenNewDeal}
              className="w-full py-2.5 px-3 rounded-xl text-xs font-bold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center gap-2"
            >
              <PlusCircle className="w-4 h-4" />
              <span>+ New Deal</span>
            </button>
          </div>
        )}

      </div>

      {/* Bottom Footer Actions */}
      <div className="p-3 border-t border-slate-800/80 space-y-2">
        <button
          onClick={onResetSeed}
          className={`w-full flex items-center ${isCollapsed ? 'justify-center p-2' : 'justify-between px-3 py-2'} rounded-xl text-xs font-medium text-slate-400 hover:text-amber-300 hover:bg-amber-950/30 border border-transparent hover:border-amber-800/40 transition-all`}
          title="Reset Acme Corp Demo Baseline Data"
        >
          <div className="flex items-center gap-2">
            <RotateCcw className="w-4 h-4 text-amber-400" />
            {!isCollapsed && <span>Reset Demo Data</span>}
          </div>
        </button>

        {!isCollapsed && (
          <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/60 flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-indigo-950 border border-indigo-800/40 flex items-center justify-center text-indigo-400 font-bold text-xs">
              SE
            </div>
            <div className="overflow-hidden text-left">
              <p className="text-xs font-bold text-white truncate">Hackathon Demo</p>
              <p className="text-[10px] text-slate-400 truncate">Microsoft Judges Review</p>
            </div>
          </div>
        )}
      </div>

    </aside>
  );
}
