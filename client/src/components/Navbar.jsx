import React from 'react';
import { BrainCircuit, LayoutDashboard, FileText, Bot, PlusCircle, RotateCcw, ShieldAlert, Sparkles, Building2 } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, deals, selectedDealId, setSelectedDealId, onResetSeed, onOpenNewDeal }) {
  const currentDeal = deals.find(d => d.id === Number(selectedDealId)) || deals[0];

  return (
    <header className="sticky top-0 z-40 bg-gray-950/80 backdrop-blur-xl border-b border-gray-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Differentiator Badge */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 shadow-lg shadow-indigo-500/30">
              <BrainCircuit className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-gray-200 to-indigo-200 bg-clip-text text-transparent">
                  Deal Intelligence
                </span>
                <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider bg-gradient-to-r from-indigo-500/20 to-purple-500/20 text-indigo-300 border border-indigo-500/40 rounded-full flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5" />
                  Hindsight Memory
                </span>
              </div>
              <p className="text-xs text-gray-400 font-medium hidden sm:block">AI-Powered Persistent Deal Memory</p>
            </div>
          </div>

          {/* Deal Selector Dropdown */}
          {deals.length > 0 && (
            <div className="hidden md:flex items-center gap-2 bg-gray-900/90 border border-gray-800 rounded-lg px-3 py-1.5 shadow-inner">
              <Building2 className="w-4 h-4 text-indigo-400" />
              <span className="text-xs font-medium text-gray-400">Deal:</span>
              <select
                value={selectedDealId}
                onChange={(e) => setSelectedDealId(Number(e.target.value))}
                className="bg-transparent text-sm font-semibold text-gray-100 focus:outline-none cursor-pointer pr-2"
              >
                {deals.map(deal => (
                  <option key={deal.id} value={deal.id} className="bg-gray-900 text-gray-100">
                    {deal.company} ({deal.stage}) - ${deal.value ? deal.value.toLocaleString() : 0}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Navigation Links */}
          <nav className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/40 shadow-sm'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-gray-900'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </button>

            <button
              onClick={() => setActiveTab('details')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'details'
                  ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/40 shadow-sm'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-gray-900'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">Deal Details</span>
            </button>

            <button
              onClick={() => setActiveTab('agent')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'agent'
                  ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/40 shadow-sm'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-gray-900'
              }`}
            >
              <Bot className="w-4 h-4 text-indigo-400" />
              <span className="font-semibold">AI Deal Agent</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            </button>

            <button
              onClick={() => setActiveTab('add_interaction')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'add_interaction'
                  ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/40 shadow-sm'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-gray-900'
              }`}
            >
              <PlusCircle className="w-4 h-4 text-purple-400" />
              <span className="hidden sm:inline">Add Interaction</span>
            </button>
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={onResetSeed}
              title="Reset Acme Corp Demo Data"
              className="p-2 rounded-lg text-gray-400 hover:text-amber-300 hover:bg-amber-950/40 border border-transparent hover:border-amber-800/40 transition-all flex items-center gap-1.5 text-xs"
            >
              <RotateCcw className="w-4 h-4" />
              <span className="hidden lg:inline">Reset Demo Data</span>
            </button>

            <button
              onClick={onOpenNewDeal}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-500 hover:to-purple-500 shadow-md shadow-indigo-600/20 transition-all flex items-center gap-1.5"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>New Deal</span>
            </button>
          </div>

        </div>
      </div>
    </header>
  );
}
