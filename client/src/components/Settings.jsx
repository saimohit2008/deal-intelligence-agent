import React from 'react';
import { Settings as SettingsIcon, BrainCircuit, ShieldCheck, Key, Database, RotateCcw, CheckCircle2, Cpu, Sparkles } from 'lucide-react';

export default function Settings({ onResetSeed }) {
  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn">
      
      {/* Header */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-950/60 border border-indigo-800/40 text-indigo-300 text-xs font-semibold mb-2">
            <SettingsIcon className="w-3.5 h-3.5" /> Platform Settings & Configuration
          </div>
          <h1 className="text-2xl font-bold text-white">Deal Intelligence Engine Settings</h1>
          <p className="text-xs text-slate-400 mt-1">
            Configure AI model connections, database persistence, and demo environment defaults.
          </p>
        </div>

        <button
          onClick={onResetSeed}
          className="px-4 py-2.5 rounded-xl text-xs font-bold bg-amber-950/60 hover:bg-amber-900 text-amber-300 border border-amber-800/40 transition-all flex items-center gap-2 shrink-0 self-start md:self-auto"
        >
          <RotateCcw className="w-4 h-4 text-amber-400" />
          <span>Reset Acme Corp Demo Baseline Data</span>
        </button>
      </div>

      {/* Settings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* AI Model Connection Card */}
        <div className="glass-card p-6 rounded-2xl border border-slate-800/80 space-y-4">
          <div className="flex items-center gap-2 text-indigo-400 pb-3 border-b border-slate-800">
            <Cpu className="w-5 h-5" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">AI Intelligence Model</h2>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs">
              <div>
                <p className="font-bold text-white">Gemini 2.5 Flash API</p>
                <p className="text-[11px] text-slate-400">Google Generative AI SDK</p>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800/50 text-[10px] font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Active
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
              <p className="text-xs font-semibold text-slate-300">Extraction Schema</p>
              <p className="text-[11px] text-slate-400">Structured JSON extraction for Stakeholders, Objections, Competitors, Concerns, Commitments.</p>
            </div>
          </div>
        </div>

        {/* Database & Memory Engine Card */}
        <div className="glass-card p-6 rounded-2xl border border-slate-800/80 space-y-4">
          <div className="flex items-center gap-2 text-purple-400 pb-3 border-b border-slate-800">
            <Database className="w-5 h-5" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">Persistent Memory Store</h2>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs">
              <div>
                <p className="font-bold text-white">SQLite Relational Engine</p>
                <p className="text-[11px] text-slate-400">deals.db • Foreign Key Memory Cascades</p>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800/50 text-[10px] font-bold flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> Persistent
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
              <p className="text-xs font-semibold text-slate-300">Deduplication Engine</p>
              <p className="text-[11px] text-slate-400">Jaccard word-overlap content similarity & stop-word entity filtering enabled.</p>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
