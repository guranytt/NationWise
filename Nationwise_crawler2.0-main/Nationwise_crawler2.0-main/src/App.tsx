/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Globe, 
  Layers, 
  FileText, 
  Copy, 
  Terminal, 
  Activity,
  Github,
  Compass,
  Target
} from 'lucide-react';
import { Source, QueueJob, NormalizedDocument, DuplicateRelation, SystemMetrics } from './types';
import { Overview } from './components/Overview';
import { SourceRegistry } from './components/SourceRegistry';
import { QueueMonitor } from './components/QueueMonitor';
import { DocLibrary } from './components/DocLibrary';
import { DeduplicationHub } from './components/DeduplicationHub';
import { BroadCrawlPanel } from './components/BroadCrawlPanel';
import { PromiseTracker } from './components/PromiseTracker';

type ActiveTab = 'overview' | 'sources' | 'queue' | 'documents' | 'deduplication' | 'broad_crawl' | 'promises';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');

  // Backend States
  const [sources, setSources] = useState<Source[]>([]);
  const [jobs, setJobs] = useState<QueueJob[]>([]);
  const [documents, setDocuments] = useState<NormalizedDocument[]>([]);
  const [duplicates, setDuplicates] = useState<DuplicateRelation[]>([]);
  const [metrics, setMetrics] = useState<SystemMetrics>({
    totalCrawls: 0,
    successRate: 100,
    activeJobsCount: 0,
    pendingJobsCount: 0,
    completedJobsCount: 0,
    failedJobsCount: 0,
    sourceHealth: {},
    documentsIngested: 0,
    duplicatesDetected: 0,
    changesDetected: 0
  });
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  // Fetch Operations
  const fetchData = async () => {
    try {
      const [resSources, resJobs, resDocs, resDups, resMetrics, resLogs] = await Promise.all([
        fetch('/api/sources'),
        fetch('/api/jobs'),
        fetch('/api/documents'),
        fetch('/api/duplicates'),
        fetch('/api/metrics'),
        fetch('/api/logs')
      ]);

      if (resSources.ok) setSources(await resSources.json());
      if (resJobs.ok) setJobs(await resJobs.json());
      if (resDocs.ok) setDocuments(await resDocs.json());
      if (resDups.ok) setDuplicates(await resDups.json());
      if (resMetrics.ok) setMetrics(await resMetrics.json());
      if (resLogs.ok) setAuditLogs(await resLogs.json());
    } catch (err) {
      console.error('Failed to sync data from crawler backend API', err);
    }
  };

  // Sync data on mount, and poll every 4 seconds for real-time background queue and crawl logs
  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 4000);
    return () => clearInterval(interval);
  }, []);

  // Source CRUD operations
  const handleCreateSource = async (newSrc: Omit<Source, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const res = await fetch('/api/sources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSrc)
      });
      if (res.ok) fetchData();
    } catch (err) {
      console.error('Failed to create source target', err);
    }
  };

  const handleUpdateSource = async (id: string, updates: Partial<Omit<Source, 'id' | 'createdAt' | 'updatedAt'>>) => {
    try {
      const res = await fetch(`/api/sources/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (res.ok) fetchData();
    } catch (err) {
      console.error('Failed to update source target', err);
    }
  };

  const handleDeleteSource = async (id: string) => {
    if (!window.confirm('Are you sure you want to remove this source target from the active crawler registry? This cannot be undone.')) return;
    try {
      const res = await fetch(`/api/sources/${id}`, { method: 'DELETE' });
      if (res.ok) fetchData();
    } catch (err) {
      console.error('Failed to delete source target', err);
    }
  };

  const handleTriggerCrawl = async (id: string) => {
    try {
      const res = await fetch(`/api/sources/${id}/crawl`, { method: 'POST' });
      if (res.ok) {
        fetchData();
      }
    } catch (err) {
      console.error('Failed to trigger manual crawl', err);
    }
  };

  // Queue Operations
  const handleClearHistory = async () => {
    try {
      const res = await fetch('/api/jobs/clear', { method: 'POST' });
      if (res.ok) fetchData();
    } catch (err) {
      console.error('Failed to clear finished jobs from registry', err);
    }
  };

  // Document Operations
  const handleViewDoc = async (id: string) => {
    const res = await fetch(`/api/documents/${id}`);
    if (!res.ok) throw new Error('Document details failed to fetch');
    return await res.json();
  };

  return (
    <div className="min-h-screen bg-[#0B0E14] text-[#E0E0E0] flex flex-col font-sans border-t-4 border-[#58A6FF]" id="app-root">
      {/* Header Bar */}
      <header className="border-b border-[#2D333B] bg-[#161B22] sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl" title="Republic of Nigeria">🇳🇬</span>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-md font-bold text-white uppercase tracking-wider font-mono">CivicPulse Ingestion Engine</h1>
                <span className="bg-[#21262D] text-[#58A6FF] text-[9px] font-mono font-bold tracking-widest uppercase border border-[#2D333B] px-2 py-0.5 rounded">
                  v1.0.4
                </span>
              </div>
              <p className="text-[11px] text-[#8B949E] font-mono mt-0.5">
                GOVERNMENT INGESTION, BROAD CRAWLS & SOURCE TRACEABILITY PIPELINE
              </p>
            </div>
          </div>

          {/* Active Workers Pulse indicator */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2.5 text-[11px] font-mono text-[#8B949E] bg-[#0D1117] border border-[#2D333B] px-3.5 py-1.5 rounded">
              <span className={`h-2.5 w-2.5 rounded-full ${metrics.activeJobsCount > 0 ? 'bg-[#D29922] animate-pulse' : 'bg-[#238636]'}`}></span>
              <span>SYSTEM STATE: <span className="font-semibold text-white">{metrics.activeJobsCount > 0 ? 'INGESTING_ACTIVE' : 'LISTENING_IDLE'}</span></span>
            </div>
            
            <a 
              href="https://github.com" 
              target="_blank" 
              rel="noreferrer" 
              className="text-[#8B949E] hover:text-white transition-colors"
            >
              <Github className="h-4.5 w-4.5" />
            </a>
          </div>
        </div>
      </header>

      {/* Main Navigation and Content Stage */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col md:flex-row gap-8">
        
        {/* Left Sidebar Navigation */}
        <aside className="w-full md:w-64 shrink-0 space-y-6">
          <div>
            <div className="text-[10px] font-bold text-[#8B949E] uppercase tracking-widest pl-2 mb-3 font-mono">
              Core Modules
            </div>
            <nav className="space-y-1" id="nav-group">
              <button
                onClick={() => setActiveTab('overview')}
                className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-mono uppercase tracking-wider select-none cursor-pointer transition-all border-l-2 ${activeTab === 'overview' ? 'bg-[#1F242C] border-[#58A6FF] text-white font-bold' : 'border-transparent text-[#8B949E] hover:bg-[#161B22] hover:text-white'}`}
              >
                <span className={`text-[10px] ${activeTab === 'overview' ? 'text-[#58A6FF]' : 'opacity-40'}`}>01</span>
                <Activity className="h-3.5 w-3.5" />
                <span>Overview</span>
              </button>
              <button
                onClick={() => setActiveTab('sources')}
                className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-mono uppercase tracking-wider select-none cursor-pointer transition-all border-l-2 ${activeTab === 'sources' ? 'bg-[#1F242C] border-[#58A6FF] text-white font-bold' : 'border-transparent text-[#8B949E] hover:bg-[#161B22] hover:text-white'}`}
              >
                <span className={`text-[10px] ${activeTab === 'sources' ? 'text-[#58A6FF]' : 'opacity-40'}`}>02</span>
                <Globe className="h-3.5 w-3.5" />
                <span>Source Registry</span>
              </button>
              <button
                onClick={() => setActiveTab('queue')}
                className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-mono uppercase tracking-wider select-none cursor-pointer transition-all border-l-2 ${activeTab === 'queue' ? 'bg-[#1F242C] border-[#58A6FF] text-white font-bold' : 'border-transparent text-[#8B949E] hover:bg-[#161B22] hover:text-white'}`}
              >
                <span className={`text-[10px] ${activeTab === 'queue' ? 'text-[#58A6FF]' : 'opacity-40'}`}>03</span>
                <Layers className="h-3.5 w-3.5" />
                <span>Queue ({jobs.filter(j => j.status === 'pending' || j.status === 'processing').length})</span>
              </button>
              <button
                onClick={() => setActiveTab('documents')}
                className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-mono uppercase tracking-wider select-none cursor-pointer transition-all border-l-2 ${activeTab === 'documents' ? 'bg-[#1F242C] border-[#58A6FF] text-white font-bold' : 'border-transparent text-[#8B949E] hover:bg-[#161B22] hover:text-white'}`}
              >
                <span className={`text-[10px] ${activeTab === 'documents' ? 'text-[#58A6FF]' : 'opacity-40'}`}>04</span>
                <FileText className="h-3.5 w-3.5" />
                <span>Doc Library ({documents.length})</span>
              </button>
              <button
                onClick={() => setActiveTab('deduplication')}
                className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-mono uppercase tracking-wider select-none cursor-pointer transition-all border-l-2 ${activeTab === 'deduplication' ? 'bg-[#1F242C] border-[#58A6FF] text-white font-bold' : 'border-transparent text-[#8B949E] hover:bg-[#161B22] hover:text-white'}`}
              >
                <span className={`text-[10px] ${activeTab === 'deduplication' ? 'text-[#58A6FF]' : 'opacity-40'}`}>05</span>
                <Copy className="h-3.5 w-3.5" />
                <span>Deduplication ({duplicates.length})</span>
              </button>
              <button
                onClick={() => setActiveTab('broad_crawl')}
                className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-mono uppercase tracking-wider select-none cursor-pointer transition-all border-l-2 ${activeTab === 'broad_crawl' ? 'bg-[#1F242C] border-[#58A6FF] text-white font-bold' : 'border-transparent text-[#8B949E] hover:bg-[#161B22] hover:text-white'}`}
                id="nav-btn-broad-crawl"
              >
                <span className={`text-[10px] ${activeTab === 'broad_crawl' ? 'text-[#58A6FF]' : 'opacity-40'}`}>06</span>
                <Compass className="h-3.5 w-3.5" />
                <span>Broad Crawl</span>
              </button>
              <button
                onClick={() => setActiveTab('promises')}
                className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-mono uppercase tracking-wider select-none cursor-pointer transition-all border-l-2 ${activeTab === 'promises' ? 'bg-[#1F242C] border-[#58A6FF] text-white font-bold' : 'border-transparent text-[#8B949E] hover:bg-[#161B22] hover:text-white'}`}
                id="nav-btn-promises"
              >
                <span className={`text-[10px] ${activeTab === 'promises' ? 'text-[#58A6FF]' : 'opacity-40'}`}>07</span>
                <Target className="h-3.5 w-3.5" />
                <span>Promise Tracker</span>
              </button>
            </nav>
          </div>

          <div className="pt-6 pl-2 border-t border-[#2D333B] text-[10px] text-[#8B949E] font-mono space-y-1.5">
            <div>LOCAL: {new Date().toLocaleDateString()}</div>
            <div>STATUS: ONLINE_COMPLIANT</div>
            <div>TARGETS: NIGERIA_CIVIC</div>
            <div className="pt-3">
              <div className="bg-[#161B22] border border-[#2D333B] p-3 rounded">
                <div className="text-[9px] uppercase text-[#8B949E] mb-2 font-mono tracking-wider">Worker Nodes (12/12)</div>
                <div className="flex gap-1">
                  <div className="h-3 flex-1 bg-[#238636] opacity-80 rounded-sm"></div>
                  <div className="h-3 flex-1 bg-[#238636] opacity-80 rounded-sm"></div>
                  <div className="h-3 flex-1 bg-[#238636] opacity-80 rounded-sm"></div>
                  <div className="h-3 flex-1 bg-[#238636] opacity-80 rounded-sm"></div>
                  <div className={`h-3 flex-1 opacity-80 rounded-sm ${metrics.activeJobsCount > 0 ? 'bg-[#D29922]' : 'bg-[#238636]'}`}></div>
                  <div className="h-3 flex-1 bg-[#238636] opacity-80 rounded-sm"></div>
                  <div className="h-3 flex-1 bg-[#238636] opacity-80 rounded-sm"></div>
                  <div className="h-3 flex-1 bg-[#238636] opacity-80 rounded-sm"></div>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Dynamic Tab Viewport */}
        <section className="flex-1 min-w-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'overview' && (
                <Overview 
                  metrics={metrics} 
                  auditLogs={auditLogs} 
                  onRefresh={fetchData} 
                />
              )}

              {activeTab === 'sources' && (
                <SourceRegistry
                  sources={sources}
                  onCreate={handleCreateSource}
                  onUpdate={handleUpdateSource}
                  onDelete={handleDeleteSource}
                  onTriggerCrawl={handleTriggerCrawl}
                />
              )}

              {activeTab === 'queue' && (
                <QueueMonitor
                  jobs={jobs}
                  onClearHistory={handleClearHistory}
                  onRefresh={fetchData}
                />
              )}

              {activeTab === 'documents' && (
                <DocLibrary
                  documents={documents}
                  onViewDoc={handleViewDoc}
                />
              )}

              {activeTab === 'deduplication' && (
                <DeduplicationHub
                  duplicates={duplicates}
                  documents={documents}
                />
              )}

              {activeTab === 'broad_crawl' && (
                <BroadCrawlPanel />
              )}
              
              {activeTab === 'promises' && (
                <PromiseTracker />
              )}
            </motion.div>
          </AnimatePresence>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 text-xs text-gray-500 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p>
            &copy; 2026 Civic Data Ingestion System. Developed as primary proof-of-promise auditability layers.
          </p>
          <div className="flex items-center gap-4">
            <span className="text-emerald-500/80 font-bold">● COMPLIANCE MODE: SECURE_INGEST</span>
            <span className="text-gray-700">|</span>
            <span className="text-slate-400">Nigerian Gov Civic Portals Ingestion Unit</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
