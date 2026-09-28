import React from 'react';
import { Building2, AlertTriangle, TrendingUp, DollarSign, ArrowRight, MessageSquarePlus, Bot, Clock, Sparkles, ShieldAlert, CheckCircle2, Flame, Calendar, Activity, ChevronRight } from 'lucide-react';

export default function Dashboard({ metrics, deals, recentActivity, onSelectDeal, onNavigate, onOpenNewDeal, searchQuery }) {
  // Filter deals based on search if query exists
  const filteredDeals = deals.filter(d => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return d.company.toLowerCase().includes(q) || d.name.toLowerCase().includes(q) || d.stage.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-8 animate-fadeIn">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-800/60">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-950/60 border border-indigo-800/40 text-indigo-300 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5" /> Persistent Hindsight Sales Intelligence
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Deal Intelligence</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 font-medium">
            Understand what changed, what matters, and what to do next across your sales pipeline.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onOpenNewDeal}
            className="px-4 py-2.5 rounded-xl font-bold text-xs bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-md shadow-indigo-600/20 transition-all flex items-center gap-2"
          >
            <span>+ New Deal</span>
          </button>
        </div>
      </div>

      {/* Summary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="glass-card p-5 rounded-2xl border border-slate-800/80 flex items-center justify-between shadow-sm hover:border-slate-700 transition-all">
          <div className="space-y-1">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Active Deals</p>
            <h3 className="text-2xl font-black text-white">{metrics?.activeDeals || deals.length}</h3>
            <p className="text-[11px] text-emerald-400 flex items-center gap-1 font-medium">
              <CheckCircle2 className="w-3 h-3" /> Evaluation & Negotiation
            </p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-indigo-400">
            <Building2 className="w-5.5 h-5.5" />
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-amber-900/30 bg-amber-950/10 flex items-center justify-between shadow-sm hover:border-amber-800/50 transition-all">
          <div className="space-y-1">
            <p className="text-[11px] font-bold text-amber-300/80 uppercase tracking-wider">At-Risk Deals</p>
            <h3 className="text-2xl font-black text-amber-400">{metrics?.atRiskDeals || 0}</h3>
            <p className="text-[11px] text-amber-400/80 flex items-center gap-1 font-medium">
              <AlertTriangle className="w-3 h-3" /> Security & Budget review
            </p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-amber-950/60 border border-amber-800/50 flex items-center justify-center text-amber-400">
            <ShieldAlert className="w-5.5 h-5.5" />
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-slate-800/80 flex items-center justify-between shadow-sm hover:border-slate-700 transition-all">
          <div className="space-y-1">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Upcoming Follow-ups</p>
            <h3 className="text-2xl font-black text-white">{recentActivity?.length || 0}</h3>
            <p className="text-[11px] text-indigo-400 flex items-center gap-1 font-medium">
              <Calendar className="w-3 h-3" /> Next call prep ready
            </p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-purple-400">
            <Clock className="w-5.5 h-5.5" />
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-slate-800/80 flex items-center justify-between shadow-sm hover:border-slate-700 transition-all">
          <div className="space-y-1">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Pipeline Value</p>
            <h3 className="text-2xl font-black text-white">
              ${(metrics?.totalPipelineValue || 0).toLocaleString()}
            </h3>
            <p className="text-[11px] text-purple-400 flex items-center gap-1 font-medium">
              <TrendingUp className="w-3 h-3" /> Active ARR pipeline
            </p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-emerald-400">
            <DollarSign className="w-5.5 h-5.5" />
          </div>
        </div>

      </div>

      {/* Active Deals Grid / Table Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Building2 className="w-5 h-5 text-indigo-400" />
            Active Deals ({filteredDeals.length})
          </h2>
          <span className="text-xs font-medium text-slate-400">Click deal to open persistent hindsight details</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {filteredDeals.map((deal) => {
            const isAcme = deal.company.includes('Acme');

            return (
              <div
                key={deal.id}
                className={`glass-card p-6 rounded-2xl border transition-all duration-300 relative flex flex-col justify-between ${
                  isAcme
                    ? 'border-indigo-500/40 bg-gradient-to-b from-slate-900/90 to-indigo-950/20 shadow-md shadow-indigo-950/30'
                    : 'border-slate-800/80 hover:border-slate-700'
                }`}
              >
                <div className="space-y-4">
                  {/* Top Line: Company & Value */}
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-extrabold text-indigo-400 uppercase tracking-wider">
                          {deal.company}
                        </span>
                        {isAcme && (
                          <span className="px-2 py-0.5 text-[9px] font-extrabold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-full">
                            CORE DEMO
                          </span>
                        )}
                      </div>
                      <h3 className="text-base font-bold text-white mt-1">{deal.name}</h3>
                    </div>

                    <div className="text-right">
                      <span className="text-lg font-black text-white">
                        ${deal.value ? deal.value.toLocaleString() : 0}
                      </span>
                      <div className="mt-1 flex items-center justify-end gap-1.5">
                        <span className={`px-2.5 py-0.5 text-[11px] font-bold rounded-full ${
                          deal.health === 'At Risk'
                            ? 'bg-amber-950/80 text-amber-300 border border-amber-700/60'
                            : 'bg-emerald-950/80 text-emerald-300 border border-emerald-700/60'
                        }`}>
                          {deal.health}
                        </span>
                        <span className="px-2.5 py-0.5 text-[11px] font-semibold bg-slate-800 text-slate-300 rounded-full border border-slate-700">
                          {deal.stage}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Summary */}
                  <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-3 rounded-xl border border-slate-800/50">
                    {deal.summary}
                  </p>

                  {/* Metadata Row: Last Interaction & Next Action */}
                  <div className="grid grid-cols-2 gap-3 pt-1 text-xs">
                    <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800/80">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block mb-0.5">Last Interaction</span>
                      <span className="font-semibold text-slate-200">
                        {isAcme ? 'Day 28 (Pilot Timeline)' : 'Recent Discovery Call'}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-indigo-950/30 border border-indigo-800/40">
                      <span className="text-[10px] font-bold text-indigo-300 uppercase block mb-0.5">Suggested Next Action</span>
                      <span className="font-semibold text-indigo-200">
                        {isAcme ? 'Dual Technical & Commercial Prep' : 'Send Follow-up Proposal'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer Action Bar */}
                <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between gap-3">
                  <button
                    onClick={() => {
                      onSelectDeal(deal.id);
                      onNavigate('details');
                    }}
                    className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all flex items-center gap-1.5"
                  >
                    <span>View Deal Details</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        onSelectDeal(deal.id);
                        onNavigate('add_interaction');
                      }}
                      className="p-2 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-purple-300 border border-slate-800 transition-all"
                      title="Log Call Interaction Note"
                    >
                      <MessageSquarePlus className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => {
                        onSelectDeal(deal.id);
                        onNavigate('agent');
                      }}
                      className="px-3.5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-sm transition-all flex items-center gap-1.5"
                    >
                      <Bot className="w-3.5 h-3.5" />
                      <span>Ask Deal Agent</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Intelligence Timeline Feed */}
      {recentActivity && recentActivity.length > 0 && (
        <div className="glass-panel p-6 rounded-2xl border border-slate-800/80 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-purple-400" />
              Recent Intelligence Log
            </h2>
            <span className="text-xs text-slate-400">Persistent Event Log</span>
          </div>

          <div className="space-y-3">
            {recentActivity.map((activity) => (
              <div
                key={activity.id}
                className="p-4 rounded-xl bg-slate-900/80 border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-indigo-500/30 transition-all"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-indigo-300 bg-indigo-950/80 px-2 py-0.5 rounded border border-indigo-800/40">
                      {activity.company}
                    </span>
                    <span className="text-xs font-semibold text-slate-400">{activity.date_str}</span>
                  </div>
                  <h4 className="text-sm font-bold text-white">{activity.title}</h4>
                  <p className="text-xs text-slate-300 line-clamp-1">"{activity.content}"</p>
                </div>

                <button
                  onClick={() => {
                    onSelectDeal(activity.deal_id);
                    onNavigate('details');
                  }}
                  className="shrink-0 text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 self-start sm:self-center"
                >
                  <span>Open Hindsight</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
