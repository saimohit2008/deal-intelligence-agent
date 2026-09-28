import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import Dashboard from './components/Dashboard';
import DealDetails from './components/DealDetails';
import AddInteraction from './components/AddInteraction';
import AiAgent from './components/AiAgent';
import Settings from './components/Settings';
import NewDealModal from './components/NewDealModal';
import { Loader2 } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [deals, setDeals] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  
  const [selectedDealId, setSelectedDealId] = useState(null);
  const [selectedDealData, setSelectedDealData] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [isLoading, setIsLoading] = useState(true);
  const [isNewDealOpen, setIsNewDealOpen] = useState(false);

  // Fetch all deals and metrics on load
  const fetchDeals = async () => {
    try {
      const res = await fetch('/api/deals');
      if (res.ok) {
        const data = await res.json();
        setDeals(data.deals || []);
        setMetrics(data.metrics || null);
        setRecentActivity(data.recentActivity || []);

        if (data.deals && data.deals.length > 0) {
          // Default to Acme Corp if available, else first deal
          const acme = data.deals.find(d => d.company.includes('Acme'));
          const defaultId = acme ? acme.id : data.deals[0].id;
          setSelectedDealId(prev => prev || defaultId);
        }
      }
    } catch (err) {
      console.error('Error fetching deals:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDeals();
  }, []);

  // Fetch detailed deal hindsight memory whenever selectedDealId changes
  const fetchDealDetails = async (id) => {
    if (!id) return;
    try {
      const res = await fetch(`/api/deals/${id}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedDealData(data);
      }
    } catch (err) {
      console.error('Error fetching deal detail:', err);
    }
  };

  useEffect(() => {
    if (selectedDealId) {
      fetchDealDetails(selectedDealId);
    }
  }, [selectedDealId]);

  const handleResetSeed = async () => {
    if (!confirm('Reset Acme Corp demo data to 6 core interactions?')) return;
    setIsLoading(true);
    try {
      await fetch('/api/seed', { method: 'POST' });
      await fetchDeals();
      if (selectedDealId) {
        await fetchDealDetails(selectedDealId);
      }
    } catch (err) {
      console.error('Error resetting seed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDealCreated = (newDeal) => {
    setDeals(prev => [newDeal, ...prev]);
    setSelectedDealId(newDeal.id);
    fetchDeals();
  };

  const handleAddInteractionSuccess = async (dealId) => {
    await fetchDeals();
    await fetchDealDetails(dealId);
  };

  if (isLoading && deals.length === 0) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
        <p className="text-sm font-semibold tracking-wide text-indigo-300">
          Initializing Deal Intelligence Memory Engine...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex font-sans selection:bg-indigo-500 selection:text-white">
      
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        deals={deals}
        selectedDealId={selectedDealId}
        setSelectedDealId={setSelectedDealId}
        onResetSeed={handleResetSeed}
        onOpenNewDeal={() => setIsNewDealOpen(true)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Top Header */}
        <Topbar
          activeTab={activeTab}
          deals={deals}
          selectedDealId={selectedDealId}
          setSelectedDealId={setSelectedDealId}
          onOpenNewDeal={() => setIsNewDealOpen(true)}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />

        {/* Viewport */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 overflow-y-auto">
          {activeTab === 'dashboard' && (
            <Dashboard
              metrics={metrics}
              deals={deals}
              recentActivity={recentActivity}
              onSelectDeal={(id) => setSelectedDealId(id)}
              onNavigate={(tab) => setActiveTab(tab)}
              onOpenNewDeal={() => setIsNewDealOpen(true)}
              searchQuery={searchQuery}
            />
          )}

          {activeTab === 'details' && (
            <DealDetails
              dealData={selectedDealData}
              onNavigate={(tab) => setActiveTab(tab)}
              onAddInteraction={(id) => {
                setSelectedDealId(id);
                setActiveTab('add_interaction');
              }}
            />
          )}

          {activeTab === 'agent' && (
            <AiAgent
              dealData={selectedDealData}
              onNavigate={(tab) => setActiveTab(tab)}
            />
          )}

          {activeTab === 'add_interaction' && (
            <AddInteraction
              deals={deals}
              selectedDealId={selectedDealId}
              onAddInteractionSuccess={handleAddInteractionSuccess}
              onNavigate={(tab) => setActiveTab(tab)}
            />
          )}

          {activeTab === 'settings' && (
            <Settings
              onResetSeed={handleResetSeed}
            />
          )}
        </main>

        {/* Footer */}
        <footer className="border-t border-slate-900 bg-slate-950/80 py-4 text-center text-xs text-slate-400">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-300">Deal Intelligence Agent</span>
              <span className="text-[10px] bg-indigo-950 text-indigo-400 px-2 py-0.5 rounded border border-indigo-800/40 font-semibold">
                HINDSIGHT MEMORY DEMO
              </span>
            </div>
            <p>© 2026 Hackathon Submission • Persistent Sales Deal Memory Engine</p>
          </div>
        </footer>

      </div>

      {/* New Deal Modal */}
      <NewDealModal
        isOpen={isNewDealOpen}
        onClose={() => setIsNewDealOpen(false)}
        onDealCreated={handleDealCreated}
      />

    </div>
  );
}
