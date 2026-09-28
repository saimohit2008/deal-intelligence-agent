import React, { useState, useEffect, useRef } from 'react';
import { Bot, Send, Sparkles, Building2, User, RefreshCw, AlertTriangle, ShieldCheck, CheckSquare, Swords, Layers, HelpCircle, Loader2 } from 'lucide-react';
import MarkdownRenderer from './MarkdownRenderer';
import { getApiUrl } from '../config/api';

export default function AiAgent({ dealData, onNavigate }) {
  const [messages, setMessages] = useState([]);
  const [inputQuery, setInputQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const deal = dealData?.deal;
  const interactions = dealData?.interactions || [];
  const memories = dealData?.memories || {};

  // Initialize chat history or initial welcome message
  useEffect(() => {
    if (deal) {
      fetchChatHistory(deal.id);
    }
  }, [deal?.id]);

  const fetchChatHistory = async (dealId) => {
    try {
      const res = await fetch(getApiUrl(`/api/deals/${dealId}/chats`));
      if (res.ok) {
        const history = await res.json();
        if (history.length > 0) {
          setMessages(history);
        } else {
          // Welcome message with dynamic summary
          setMessages([
            {
              sender: 'agent',
              message: `Hello! I am your **Deal Intelligence Agent** with full Hindsight Memory for **${deal.company}**.\n\nI have loaded **${interactions.length} historical interactions** and **${Object.values(memories).flat().length} extracted memory nodes** across all deal conversations.\n\nAsk me anything about this deal or click **"Prepare me for my next call"** below to generate your personalized call brief!`,
              created_at: new Date().toISOString()
            }
          ]);
        }
      }
    } catch (err) {
      console.error('Error fetching chat history:', err);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSendMessage = async (queryText) => {
    const textToSend = queryText || inputQuery;
    if (!textToSend.trim() || !deal) return;

    const userMsg = {
      sender: 'user',
      message: textToSend,
      created_at: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputQuery('');
    setIsLoading(true);

    try {
      const res = await fetch(getApiUrl('/api/agent/chat'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dealId: deal.id,
          message: textToSend
        })
      });

      if (!res.ok) throw new Error('Agent failed to respond');

      const data = await res.json();
      setMessages(prev => [...prev, {
        sender: 'agent',
        message: data.message,
        created_at: data.timestamp
      }]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, {
        sender: 'agent',
        message: `⚠️ Sorry, I encountered an error retrieving deal memory: ${err.message}`,
        created_at: new Date().toISOString()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const presetQueries = [
    { label: '📋 Prepare me for my next call', query: `Prepare me for my next call with ${deal?.company || 'the client'}.` },
    { label: '👥 Who are the key stakeholders?', query: `Who are all the stakeholders in the ${deal?.company || 'deal'} deal, what are their current concerns, and how have those concerns evolved over time?` },
    { label: '⚠️ What objections have we faced?', query: `What objections have been raised so far?` },
    { label: '🔄 What changed recently?', query: `What changed recently in the ${deal?.company || 'deal'} deal?` },
    { label: '🤝 What commitments are still open?', query: `What commitments are still open?` },
  ];

  if (!deal) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center text-gray-400">
        <Bot className="w-12 h-12 text-indigo-400 animate-pulse mb-3" />
        <p>Loading AI Agent...</p>
      </div>
    );
  }

  const allMemoryList = Object.values(memories).flat();

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fadeIn">

      {/* Persistent Hindsight Memory Context Bar */}
      <div className="glass-panel p-4 rounded-2xl border border-indigo-500/30 bg-gradient-to-r from-indigo-950/60 via-gray-900 to-purple-950/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-600/30 border border-indigo-500/50 flex items-center justify-center text-indigo-300 shrink-0">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white">Deal Agent: {deal.company}</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            </div>
            <p className="text-xs text-indigo-200">
              Grounded in {interactions.length} interactions & {allMemoryList.length} memory entities
            </p>
          </div>
        </div>

        {/* Dynamic Memory Pills */}
        <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
          {memories.stakeholders && memories.stakeholders.slice(0, 3).map((sh, idx) => (
            <span key={idx} className="px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800/40">
              👤 {sh.value} ({sh.details || 'Stakeholder'})
            </span>
          ))}
          {memories.concerns && memories.concerns.slice(0, 2).map((con, idx) => (
            <span key={idx} className="px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800/40">
              🛡️ {con.value}
            </span>
          ))}
        </div>
      </div>

      {/* Preset Prompt Chips */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-gray-400 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-purple-400" />
          Quick Hindsight Prompts:
        </p>
        <div className="flex flex-wrap gap-2">
          {presetQueries.map((preset, idx) => (
            <button
              key={idx}
              disabled={isLoading}
              onClick={() => handleSendMessage(preset.query)}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-gray-900 hover:bg-indigo-950/80 text-gray-200 hover:text-indigo-200 border border-gray-800 hover:border-indigo-500/50 transition-all flex items-center gap-1.5 shadow-sm disabled:opacity-50"
            >
              <span>{preset.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Chat Messages Log Area */}
      <div className="glass-panel p-6 rounded-2xl border border-gray-800/80 space-y-6 min-h-[420px] max-h-[600px] overflow-y-auto">
        {messages.map((msg, index) => {
          const isAgent = msg.sender === 'agent';

          return (
            <div
              key={index}
              className={`flex items-start gap-3.5 ${isAgent ? 'justify-start' : 'justify-end'}`}
            >
              {isAgent && (
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shrink-0 shadow-md shadow-indigo-600/30">
                  <Bot className="w-5 h-5" />
                </div>
              )}

              <div
                className={`max-w-3xl rounded-2xl p-5 border shadow-lg ${
                  isAgent
                    ? 'bg-gray-900/90 border-gray-800 text-gray-100'
                    : 'bg-indigo-600 text-white border-indigo-500 rounded-tr-none'
                }`}
              >
                {isAgent ? (
                  <MarkdownRenderer content={msg.message} />
                ) : (
                  <p className="text-sm font-medium leading-relaxed">{msg.message}</p>
                )}
                <span className="block text-[10px] text-gray-400 mt-2 text-right">
                  {new Date(msg.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>

              {!isAgent && (
                <div className="w-9 h-9 rounded-xl bg-gray-800 border border-gray-700 flex items-center justify-center text-gray-300 shrink-0">
                  <User className="w-5 h-5" />
                </div>
              )}
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-start gap-3.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shrink-0 shadow-md">
              <Bot className="w-5 h-5 animate-pulse" />
            </div>
            <div className="bg-gray-900/90 border border-gray-800 rounded-2xl p-4 text-gray-300 text-xs flex items-center gap-3">
              <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
              <span>Analyzing historical deal memory & generating response...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="glass-panel p-2.5 rounded-2xl border border-gray-800/80 flex items-center gap-2"
      >
        <input
          type="text"
          value={inputQuery}
          onChange={(e) => setInputQuery(e.target.value)}
          placeholder={`Ask anything about ${deal.company}...`}
          className="flex-1 bg-transparent px-4 py-2.5 text-sm text-gray-100 focus:outline-none placeholder-gray-500"
          disabled={isLoading}
        />

        <button
          type="submit"
          disabled={isLoading || !inputQuery.trim()}
          className="px-4 py-2.5 rounded-xl font-bold text-xs bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-md shadow-indigo-600/20 transition-all flex items-center gap-1.5 disabled:opacity-40"
        >
          <span>Send</span>
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>

    </div>
  );
}
