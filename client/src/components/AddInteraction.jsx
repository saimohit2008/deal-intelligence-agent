import React, { useState } from 'react';
import { Sparkles, MessageSquare, Calendar, Building2, Save, CheckCircle2, ArrowRight, Bot, AlertCircle, Loader2 } from 'lucide-react';

export default function AddInteraction({ deals, selectedDealId, onAddInteractionSuccess, onNavigate }) {
  const [dealId, setDealId] = useState(selectedDealId || (deals[0] ? deals[0].id : ''));
  const [title, setTitle] = useState('');
  const [dateStr, setDateStr] = useState('Day 25');
  const [content, setContent] = useState('');

  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedResult, setExtractedResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  const activeDeal = deals.find(d => d.id === Number(dealId)) || deals[0];

  const handleLoadMariaSampleNote = () => {
    setTitle("Interaction 7: CFO Financial Review & Phased Rollout Discussion");
    setDateStr('Day 25');
    setContent(
      "Today's meeting included Maria, the CFO of Acme Corp. Maria is concerned about implementation costs and wants a phased rollout. She said the initial deployment budget is limited and asked whether we can start with 50 users before expanding to the entire organization."
    );
    setErrorMsg(null);
  };

  const handleLoadTechSampleNote = () => {
    setTitle('Interaction 8: SSO Security Deep-Dive & Architecture Review');
    setDateStr('Day 28');
    setContent(
      'Follow-up call with David (CTO) and Security Engineer Alex. We resolved David\'s remaining SSO questions by demonstrating Okta SAML2 integration. However, David raised a new concern about GDPR data residency in Europe. I promised to get a written confirmation from legal by Friday.'
    );
    setErrorMsg(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      setErrorMsg('Please provide both an interaction title and meeting notes content.');
      return;
    }

    setIsProcessing(true);
    setErrorMsg(null);
    setExtractedResult(null);

    try {
      const res = await fetch(`/api/deals/${dealId}/interactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          content,
          date_str: dateStr
        })
      });

      if (!res.ok) {
        throw new Error('Failed to save interaction');
      }

      const data = await res.json();
      setExtractedResult(data);
      setIsProcessing(false);

      if (onAddInteractionSuccess) {
        onAddInteractionSuccess(dealId);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || 'An error occurred while extracting deal intelligence.');
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn">
      
      {/* Header */}
      <div className="glass-panel p-6 rounded-2xl border border-gray-800/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-950/60 border border-purple-800/40 text-purple-300 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5" /> AI Interaction Extraction Engine
          </div>
          <h1 className="text-2xl font-bold text-white">Log Sales Interaction Note</h1>
          <p className="text-xs text-gray-400 mt-1">
            Input meeting notes or call transcripts. Gemini AI will automatically extract stakeholders, objections, concerns, commitments, and update persistent memory.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleLoadMariaSampleNote}
            className="px-3 py-2 rounded-xl text-xs font-semibold bg-indigo-950/80 hover:bg-indigo-900 text-indigo-300 border border-indigo-700/50 transition-all flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Load Maria (CFO) Note</span>
          </button>
          <button
            onClick={handleLoadTechSampleNote}
            className="px-3 py-2 rounded-xl text-xs font-semibold bg-gray-800 hover:bg-gray-700 text-purple-300 border border-gray-700 transition-all flex items-center gap-1.5"
          >
            <span>Tech Note</span>
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/50 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Form and Realtime Result Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Interaction Form */}
        <form onSubmit={handleSubmit} className="lg:col-span-2 glass-panel p-6 rounded-2xl border border-gray-800/80 space-y-5">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Select Deal */}
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-indigo-400" />
                Select Target Deal
              </label>
              <select
                value={dealId}
                onChange={(e) => setDealId(e.target.value)}
                className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2.5 text-sm text-gray-100 focus:outline-none focus:border-indigo-500"
              >
                {deals.map(d => (
                  <option key={d.id} value={d.id}>
                    {d.company} ({d.name})
                  </option>
                ))}
              </select>
            </div>

            {/* Date / Day Label */}
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-purple-400" />
                Timeline Marker (e.g. Day 25)
              </label>
              <input
                type="text"
                value={dateStr}
                onChange={(e) => setDateStr(e.target.value)}
                placeholder="Day 25 or 2026-09-28"
                className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2.5 text-sm text-gray-100 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Interaction Title */}
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1 flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
              Interaction Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Interaction 7: CFO Financial Review"
              className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2.5 text-sm text-gray-100 focus:outline-none focus:border-indigo-500"
              required
            />
          </div>

          {/* Meeting Notes Content */}
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">
              Conversation & Meeting Notes / Transcript
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={6}
              placeholder="Paste raw conversation notes here..."
              className="w-full bg-gray-900 border border-gray-800 rounded-xl p-3 text-sm text-gray-100 focus:outline-none focus:border-indigo-500 leading-relaxed"
              required
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isProcessing}
            className="w-full py-3 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Extracting Deal Intelligence with Gemini...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Analyze & Save to Persistent Memory</span>
              </>
            )}
          </button>

        </form>

        {/* Real-time Extraction Results Card */}
        <div className="glass-panel p-6 rounded-2xl border border-gray-800/80 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-gray-800 pb-3">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            Extracted Memory Result
          </h3>

          {isProcessing && (
            <div className="p-8 text-center space-y-3">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-400 mx-auto" />
              <p className="text-xs font-semibold text-indigo-300">Extracting structured entities...</p>
              <p className="text-[11px] text-gray-400">Parsing stakeholders, objections, security concerns & promises...</p>
            </div>
          )}

          {!isProcessing && !extractedResult && (
            <div className="p-8 text-center text-gray-400 space-y-2">
              <MessageSquare className="w-8 h-8 text-gray-600 mx-auto" />
              <p className="text-xs">No interaction processed yet.</p>
              <p className="text-[11px] text-gray-500">Fill out notes on the left and click analyze to test memory extraction.</p>
            </div>
          )}

          {!isProcessing && extractedResult && (
            <div className="space-y-4 animate-fadeIn">
              <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/50 flex items-center gap-2 text-emerald-300 text-xs font-semibold">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Successfully added to persistent memory!</span>
              </div>

              {/* Summary */}
              {extractedResult.extracted?.summary && (
                <div className="space-y-1">
                  <p className="text-[11px] font-bold text-gray-400 uppercase">AI Summary:</p>
                  <p className="text-xs text-gray-200 bg-gray-900/80 p-2.5 rounded-lg border border-gray-800">
                    {extractedResult.extracted.summary}
                  </p>
                </div>
              )}

              {/* Saved Memories Tags */}
              {extractedResult.savedMemories && extractedResult.savedMemories.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-[11px] font-bold text-gray-400 uppercase">New Memory Nodes Created:</p>
                  <div className="space-y-1.5">
                    {extractedResult.savedMemories.map((mem, i) => (
                      <div key={i} className="p-2 rounded-lg bg-gray-900 border border-gray-800 text-xs flex items-center justify-between">
                        <span className="font-semibold text-indigo-300 uppercase text-[10px]">
                          {mem.category}:
                        </span>
                        <span className="text-gray-200 font-medium">{mem.value} {mem.details ? `(${mem.details})` : ''}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-gray-400">Interaction saved (no new distinct entity tags extracted).</p>
              )}

              {/* Actions */}
              <div className="pt-3 border-t border-gray-800 flex items-center justify-between">
                <button
                  onClick={() => onNavigate('details')}
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
                >
                  <span>View Deal Timeline</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => onNavigate('agent')}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 text-white flex items-center gap-1"
                >
                  <Bot className="w-3.5 h-3.5" />
                  <span>Ask AI Agent</span>
                </button>
              </div>

            </div>
          )}

        </div>

      </div>

    </div>
  );
}
