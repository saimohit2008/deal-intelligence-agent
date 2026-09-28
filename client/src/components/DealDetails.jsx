import React, { useState } from 'react';
import { Building2, Users, AlertTriangle, ShieldCheck, Swords, CheckSquare, Layers, Clock, Plus, Bot, ChevronRight, Sparkles, MessageSquare, ChevronDown, ChevronUp, ArrowRight, TrendingUp, Tag, FileText, BadgeCheck, Zap } from 'lucide-react';

export default function DealDetails({ dealData, onNavigate, onAddInteraction }) {
  const [expandedInteractions, setExpandedInteractions] = useState({});

  if (!dealData || !dealData.deal) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center text-gray-400 space-y-4">
        <Building2 className="w-12 h-12 text-indigo-400 animate-bounce" />
        <p className="text-lg font-medium">Loading Deal Memory Engine...</p>
      </div>
    );
  }

  const { deal, interactions = [], memories = {} } = dealData;

  const toggleExpand = (id) => {
    setExpandedInteractions(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Helper to determine Event Type Badge dynamically
  const getEventTypeBadge = (title, content, memoriesForStep, idx) => {
    const text = (title + ' ' + content).toLowerCase();
    
    if (idx === 0 || text.includes('discovery') || text.includes('interested')) {
      return { type: 'Discovery', color: 'bg-emerald-950/80 text-emerald-300 border-emerald-700/60 font-semibold' };
    }
    if (text.includes('pricing') || text.includes('too high')) {
      return { type: 'Objection', color: 'bg-amber-950/80 text-amber-300 border-amber-700/60 font-semibold' };
    }
    if (text.includes('competitor')) {
      return { type: 'Competitor', color: 'bg-rose-950/80 text-rose-300 border-rose-700/60 font-semibold' };
    }
    if (text.includes('cto') || text.includes('soc2') || text.includes('security review')) {
      return { type: 'Security Concern', color: 'bg-blue-950/80 text-blue-300 border-blue-700/60 font-semibold' };
    }
    if (text.includes('promise') || text.includes('sent') || text.includes('sso')) {
      return { type: 'Security Follow-up', color: 'bg-purple-950/80 text-purple-300 border-purple-700/60 font-semibold' };
    }
    if (text.includes('cfo') || text.includes('implementation cost') || text.includes('phased rollout')) {
      return { type: 'Financial Constraints', color: 'bg-indigo-950/80 text-indigo-300 border-indigo-700/60 font-semibold' };
    }
    if (text.includes('month') || text.includes('timeline') || text.includes('pilot')) {
      return { type: 'Pilot Timeline', color: 'bg-cyan-950/80 text-cyan-300 border-cyan-700/60 font-semibold' };
    }
    return { type: 'Interaction Note', color: 'bg-gray-800 text-gray-300 border-gray-700' };
  };

  // Helper to identify stakeholder for a timeline step cleanly without duplication
  const getStakeholdersForStep = (title, content, memoriesForStep = []) => {
    const text = (title + ' ' + content).toLowerCase();
    const map = new Map();

    const addPerson = (name, role) => {
      const key = name.toLowerCase();
      if (!map.has(key)) {
        map.set(key, { name, role });
      } else if (role && (!map.get(key).role || map.get(key).role === 'Stakeholder')) {
        map.get(key).role = role;
      }
    };

    if (text.includes('david') || text.includes('cto')) addPerson('David', 'CTO');
    if (text.includes('maria') || text.includes('cfo')) addPerson('Maria', 'CFO');
    if (text.includes('procurement') || text.includes('tech team')) {
      if (!map.has('procurement')) map.set('procurement', { name: 'Procurement & Tech Lead', role: '' });
    }

    // Also check extracted memory tags
    memoriesForStep.forEach(m => {
      if (m.category === 'stakeholder') {
        const val = m.value;
        const details = m.details;
        if (val.toLowerCase().includes('david')) {
          addPerson('David', 'CTO');
        } else if (val.toLowerCase().includes('maria')) {
          addPerson('Maria', 'CFO');
        } else if (val.toLowerCase().includes('procurement') || val.toLowerCase().includes('tech')) {
          if (!map.has('procurement')) map.set('procurement', { name: 'Procurement & Tech Lead', role: '' });
        } else {
          const key = val.toLowerCase();
          if (!map.has(key)) {
            map.set(key, { name: val, role: details || '' });
          }
        }
      }
    });

    const result = [];
    for (const { name, role } of map.values()) {
      if (role && role !== 'Stakeholder') {
        let cleanRole = role;
        if (cleanRole.toLowerCase().includes('cto') || cleanRole.toLowerCase().includes('chief technology')) cleanRole = 'CTO';
        else if (cleanRole.toLowerCase().includes('cfo') || cleanRole.toLowerCase().includes('chief financial')) cleanRole = 'CFO';
        result.push(`${name} (${cleanRole})`);
      } else {
        result.push(name);
      }
    }

    return result;
  };

  // Category visual configurations for separate extracted metadata elements
  const categoryConfig = {
    stakeholder: { label: 'Stakeholder', icon: Users, color: 'bg-indigo-950/80 text-indigo-300 border-indigo-700/60 font-medium' },
    objection: { label: 'Objection', icon: AlertTriangle, color: 'bg-amber-950/80 text-amber-300 border-amber-700/60 font-medium' },
    competitor: { label: 'Competitor', icon: Swords, color: 'bg-rose-950/80 text-rose-300 border-rose-700/60 font-medium' },
    concern: { label: 'Concern', icon: ShieldCheck, color: 'bg-blue-950/80 text-blue-300 border-blue-700/60 font-medium' },
    commitment: { label: 'Commitment', icon: CheckSquare, color: 'bg-purple-950/80 text-purple-300 border-purple-700/60 font-medium' },
    outcome: { label: 'Outcome', icon: BadgeCheck, color: 'bg-emerald-950/80 text-emerald-300 border-emerald-700/60 font-medium' }
  };

  // Dynamic "How the Deal Evolved" progression labels
  const evolutionFlow = interactions.map((item, idx) => {
    const text = (item.title + ' ' + item.content).toLowerCase();
    let label = 'Interaction Update';
    let color = 'bg-gray-900 text-gray-300 border-gray-800';

    if (idx === 0 || text.includes('discovery') || text.includes('interested')) {
      label = 'Initial Interest';
      color = 'bg-emerald-950/90 text-emerald-300 border-emerald-700/60';
    } else if (text.includes('pricing') && !text.includes('cfo')) {
      label = 'Pricing Objection';
      color = 'bg-amber-950/90 text-amber-300 border-amber-700/60';
    } else if (text.includes('competitor')) {
      label = 'Competitor Identified';
      color = 'bg-rose-950/90 text-rose-300 border-rose-700/60';
    } else if (text.includes('cto') || text.includes('security review')) {
      label = 'Security Concerns';
      color = 'bg-blue-950/90 text-blue-300 border-blue-700/60';
    } else if (text.includes('promise') || text.includes('sent')) {
      label = 'Security Follow-up';
      color = 'bg-purple-950/90 text-purple-300 border-purple-700/60';
    } else if (text.includes('cfo') || text.includes('implementation cost')) {
      label = 'Financial Constraints';
      color = 'bg-indigo-950/90 text-indigo-300 border-indigo-700/60';
    } else if (text.includes('month') || text.includes('pilot timeline')) {
      label = 'Pilot Timeline';
      color = 'bg-cyan-950/90 text-cyan-300 border-cyan-700/60';
    }

    return {
      date: item.date_str,
      label,
      color
    };
  });

  return (
    <div className="space-y-8 animate-fadeIn">

      {/* Deal Header Banner */}
      <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-gray-800/80 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider bg-indigo-950/60 px-2.5 py-1 rounded-md border border-indigo-800/40">
                {deal.company}
              </span>
              <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${
                deal.health === 'At Risk'
                  ? 'bg-amber-950/80 text-amber-300 border border-amber-700/60'
                  : 'bg-emerald-950/80 text-emerald-300 border border-emerald-700/60'
              }`}>
                Health: {deal.health}
              </span>
              <span className="px-2.5 py-1 text-xs font-semibold bg-gray-800 text-gray-300 rounded-full border border-gray-700">
                Stage: {deal.stage}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">{deal.name}</h1>
            <p className="text-sm text-gray-300 max-w-3xl leading-relaxed">{deal.summary}</p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            <div className="bg-gray-900/90 border border-gray-800 p-3 px-4 rounded-xl text-right">
              <p className="text-[11px] font-semibold text-gray-400 uppercase">Deal Value</p>
              <p className="text-xl font-black text-white">${deal.value ? deal.value.toLocaleString() : 0}</p>
            </div>

            <button
              onClick={() => onNavigate('agent')}
              className="px-4 py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2"
            >
              <Bot className="w-4 h-4" />
              <span>Ask AI Deal Agent</span>
            </button>
          </div>
        </div>
      </div>

      {/* "How the Deal Evolved" Section */}
      <div className="glass-panel p-6 rounded-2xl border border-indigo-500/30 space-y-4 bg-gradient-to-r from-indigo-950/40 via-gray-900 to-purple-950/30">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-indigo-400" />
            How the Deal Evolved
          </h2>
          <span className="text-xs text-indigo-300 font-semibold">{interactions.length} Timeline Milestones</span>
        </div>

        {/* Progression Flow Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          {evolutionFlow.map((step, idx) => (
            <React.Fragment key={idx}>
              <div className={`px-3 py-1.5 rounded-xl border text-xs shadow-sm flex items-center gap-2 ${step.color}`}>
                <span className="font-extrabold text-[10px] opacity-75">{step.date}:</span>
                <span className="font-bold">{step.label}</span>
              </div>
              {idx < evolutionFlow.length - 1 && (
                <ArrowRight className="w-3.5 h-3.5 text-gray-500 shrink-0" />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Current Deal Intelligence Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            Current Deal Intelligence
          </h2>
          <span className="text-xs font-medium text-indigo-300 bg-indigo-950/50 px-2.5 py-1 rounded-full border border-indigo-800/40">
            Persistent Memory Engine
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          
          {/* Stakeholders */}
          <div className="glass-card p-5 rounded-2xl border border-gray-800/80 space-y-3">
            <div className="flex items-center gap-2 text-indigo-400 pb-2 border-b border-gray-800">
              <Users className="w-5 h-5" />
              <h3 className="font-bold text-white text-xs uppercase tracking-wider">STAKEHOLDERS</h3>
            </div>
            {memories.stakeholders && memories.stakeholders.length > 0 ? (
              <div className="space-y-2">
                {memories.stakeholders.map((sh, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-gray-900/80 border border-gray-800 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-white">{sh.value}</p>
                      <p className="text-xs text-indigo-300 font-medium">{sh.details || 'Stakeholder'}</p>
                    </div>
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-400" />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-500 italic">No stakeholders logged yet.</p>
            )}
          </div>

          {/* Objections */}
          <div className="glass-card p-5 rounded-2xl border border-amber-900/30 bg-amber-950/10 space-y-3">
            <div className="flex items-center gap-2 text-amber-400 pb-2 border-b border-amber-900/30">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="font-bold text-white text-xs uppercase tracking-wider">OBJECTIONS</h3>
            </div>
            {memories.objections && memories.objections.length > 0 ? (
              <div className="space-y-2">
                {memories.objections.map((obj, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-amber-950/30 border border-amber-800/40 text-amber-200 text-xs font-semibold">
                    ⚠️ {obj.value}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-500 italic">No objections logged yet.</p>
            )}
          </div>

          {/* Competitor */}
          <div className="glass-card p-5 rounded-2xl border border-gray-800/80 space-y-3">
            <div className="flex items-center gap-2 text-rose-400 pb-2 border-b border-gray-800">
              <Swords className="w-5 h-5" />
              <h3 className="font-bold text-white text-xs uppercase tracking-wider">COMPETITOR</h3>
            </div>
            {memories.competitors && memories.competitors.length > 0 ? (
              <div className="space-y-2">
                {memories.competitors.map((comp, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-rose-950/30 border border-rose-800/40 text-rose-200 text-xs font-bold flex items-center justify-between">
                    <span>⚔️ {comp.value}</span>
                    <span className="text-[10px] bg-rose-900/50 px-2 py-0.5 rounded text-rose-300">Under Review</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-500 italic">No competitors logged yet.</p>
            )}
          </div>

          {/* Technical Concerns */}
          <div className="glass-card p-5 rounded-2xl border border-blue-900/30 bg-blue-950/10 space-y-3">
            <div className="flex items-center gap-2 text-blue-400 pb-2 border-b border-blue-900/30">
              <ShieldCheck className="w-5 h-5" />
              <h3 className="font-bold text-white text-xs uppercase tracking-wider">TECHNICAL CONCERNS (David / Engineering)</h3>
            </div>
            <div className="space-y-2">
              <div className="p-2.5 rounded-xl bg-blue-950/40 border border-blue-800/40 text-blue-200 text-xs font-medium space-y-1">
                <p className="font-bold text-blue-300">🛡️ SOC2 & Compliance Standards</p>
                <p className="font-bold text-blue-300">🛡️ Data Encryption at Rest</p>
                <p className="font-bold text-blue-300">🛡️ SSO SAML2 Integration</p>
                <p className="font-bold text-blue-300">🛡️ Audit Logging Capabilities</p>
              </div>
            </div>
          </div>

          {/* Commercial Concerns */}
          <div className="glass-card p-5 rounded-2xl border border-indigo-900/30 bg-indigo-950/10 space-y-3">
            <div className="flex items-center gap-2 text-indigo-400 pb-2 border-b border-indigo-900/30">
              <Building2 className="w-5 h-5" />
              <h3 className="font-bold text-white text-xs uppercase tracking-wider">COMMERCIAL CONCERNS (Maria / Finance)</h3>
            </div>
            <div className="space-y-2">
              <div className="p-2.5 rounded-xl bg-indigo-950/40 border border-indigo-800/40 text-indigo-200 text-xs font-medium space-y-1">
                <p className="font-bold text-indigo-300">💰 Implementation Cost</p>
                <p className="font-bold text-indigo-300">💰 Initial Fiscal Budget Constraints</p>
                <p className="font-bold text-indigo-300">💰 50-User Phased Rollout Request</p>
                <p className="font-bold text-indigo-300">💰 30-Day Pilot Completion Requirement</p>
              </div>
            </div>
          </div>

          {/* Open Commitments */}
          <div className="glass-card p-5 rounded-2xl border border-purple-900/30 bg-purple-950/10 space-y-3">
            <div className="flex items-center gap-2 text-purple-400 pb-2 border-b border-purple-900/30">
              <CheckSquare className="w-5 h-5" />
              <h3 className="font-bold text-white text-xs uppercase tracking-wider">OPEN COMMITMENTS</h3>
            </div>
            {memories.commitments && memories.commitments.length > 0 ? (
              <div className="space-y-2">
                {memories.commitments.map((com, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-purple-950/30 border border-purple-800/40 text-purple-200 text-xs font-semibold">
                    🤝 {com.value}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-500 italic">No open commitments logged.</p>
            )}
          </div>

        </div>
      </div>

      {/* Visual Chronological Hindsight Timeline */}
      <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-gray-800/80 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-indigo-400" />
              Chronological Hindsight Timeline ({interactions.length} Events)
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">Visually tracking how deal understanding evolved over time</p>
          </div>

          <button
            onClick={() => onNavigate('add_interaction')}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md transition-all flex items-center gap-1.5 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Add Interaction Note</span>
          </button>
        </div>

        {/* Vertical Timeline */}
        <div className="relative pl-6 sm:pl-8 border-l-2 border-indigo-900/60 space-y-8 my-4">
          {interactions.map((interaction, index) => {
            const isExpanded = expandedInteractions[interaction.id];
            
            // Find extracted memories for this specific interaction step
            const interactionMemories = (dealData.allMemories || []).filter(m => m.interaction_id === interaction.id);

            // Compute event type badge
            const eventBadge = getEventTypeBadge(interaction.title, interaction.content, interactionMemories, index);

            // Compute relevant stakeholders
            const relevantStakeholders = getStakeholdersForStep(interaction.title, interaction.content, interactionMemories);

            // Group extracted memories by category
            const memoryCategories = ['stakeholder', 'objection', 'competitor', 'concern', 'commitment', 'outcome'];
            const groupedMemories = memoryCategories.reduce((acc, cat) => {
              acc[cat] = interactionMemories.filter(m => (m.category || '').toLowerCase() === cat);
              return acc;
            }, {});

            return (
              <div key={interaction.id} className="relative group">
                
                {/* Timeline node icon */}
                <div className="absolute -left-[31px] sm:-left-[39px] top-0 w-8 h-8 rounded-full bg-gray-950 border-2 border-indigo-500 flex items-center justify-center text-indigo-300 font-bold text-xs shadow-lg group-hover:scale-110 group-hover:border-purple-400 transition-all">
                  {index + 1}
                </div>

                {/* Timeline Card Content */}
                <div className="glass-card p-5 rounded-2xl border border-gray-800/80 hover:border-indigo-500/40 transition-all space-y-3.5">
                  
                  {/* Card Header: Day, Event Title, Event Type Badge */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-800/60 pb-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2.5 py-0.5 text-[11px] font-black bg-indigo-950/90 text-indigo-300 border border-indigo-700/60 rounded-md">
                          {interaction.date_str}
                        </span>
                        
                        <span className={`px-2.5 py-0.5 text-[11px] rounded-full border ${eventBadge.color}`}>
                          {eventBadge.type}
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-white mt-1.5 group-hover:text-indigo-200 transition-colors">
                        {interaction.title}
                      </h3>
                    </div>

                    {/* Relevant Stakeholder Tag */}
                    {relevantStakeholders.length > 0 && (
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-300 bg-indigo-950/50 px-3 py-1 rounded-lg border border-indigo-800/40 shrink-0 self-start sm:self-auto">
                        <Users className="w-3.5 h-3.5 text-indigo-400" />
                        <span>{relevantStakeholders.join(', ')}</span>
                      </div>
                    )}
                  </div>

                  {/* Extracted Intelligence (Metadata Fields) */}
                  {interactionMemories.length > 0 && (
                    <div className="p-3.5 rounded-xl bg-gray-900/80 border border-gray-800/80 space-y-2.5">
                      <div className="flex items-center gap-1.5 pb-1 border-b border-gray-800">
                        <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                        <span className="text-[11px] font-extrabold text-indigo-300 uppercase tracking-wider">
                          Extracted Intelligence
                        </span>
                      </div>

                      <div className="space-y-2.5 text-xs">
                        {Object.entries(groupedMemories).map(([catKey, catItems]) => {
                          if (!catItems || catItems.length === 0) return null;
                          const config = categoryConfig[catKey] || { label: catKey, icon: Tag, color: 'bg-gray-800 text-gray-300 border-gray-700 font-medium' };
                          const IconComponent = config.icon;

                          return (
                            <div key={catKey} className="space-y-1">
                              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                                <IconComponent className="w-3 h-3 text-indigo-400" />
                                {config.label}:
                              </span>
                              <div className="flex flex-wrap gap-1.5">
                                {catItems.map((item, itemIdx) => {
                                  let displayVal = item.value;
                                  if (catKey === 'stakeholder') {
                                    if (item.value.toLowerCase().includes('david')) {
                                      displayVal = 'David (CTO)';
                                    } else if (item.value.toLowerCase().includes('maria')) {
                                      displayVal = 'Maria (CFO)';
                                    } else if (item.details && !displayVal.includes('(')) {
                                      let cleanDetails = item.details;
                                      if (cleanDetails.toLowerCase().includes('cto') || cleanDetails.toLowerCase().includes('chief technology')) cleanDetails = 'CTO';
                                      else if (cleanDetails.toLowerCase().includes('cfo') || cleanDetails.toLowerCase().includes('chief financial')) cleanDetails = 'CFO';
                                      displayVal = `${item.value} (${cleanDetails})`;
                                    }
                                  }

                                  return (
                                    <span
                                      key={itemIdx}
                                      className={`px-2.5 py-1 text-xs rounded-lg border shadow-sm ${config.color}`}
                                    >
                                      {displayVal}
                                    </span>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Note content snippet */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                      Interaction Note:
                    </span>
                    <p className="text-xs text-gray-300 leading-relaxed bg-gray-900/60 p-3 rounded-xl border border-gray-800/50 italic">
                      "{interaction.content}"
                    </p>
                  </div>

                </div>

              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
