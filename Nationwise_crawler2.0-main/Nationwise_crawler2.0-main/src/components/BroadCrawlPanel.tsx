/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Globe, 
  Activity, 
  Cpu, 
  Plus, 
  Check, 
  X, 
  Settings, 
  Sparkles, 
  Compass, 
  AlertTriangle, 
  User, 
  ShieldAlert, 
  RefreshCw,
  Gauge,
  Layers,
  ChevronRight,
  TrendingUp,
  Sliders,
  Clock
} from 'lucide-react';
import { FrontierUrl, DomainConfig, PoliticalEntity, BroadCrawlAnalytics } from '../../server/broadTypes';

export const BroadCrawlPanel: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'analytics' | 'frontier' | 'seeds' | 'domains'>('analytics');
  
  // State
  const [analytics, setAnalytics] = useState<BroadCrawlAnalytics>({
    totalDiscovered: 0,
    pendingInFrontier: 0,
    processingInFrontier: 0,
    completedInFrontier: 0,
    failedInFrontier: 0,
    activeDomainsCount: 0,
    totalThroughputPages: 0,
    staticFetchCount: 0,
    dynamicFetchCount: 0,
    relevanceDistribution: { high: 0, medium: 0, low: 0 }
  });

  const [frontierUrls, setFrontierUrls] = useState<FrontierUrl[]>([]);
  const [domainConfigs, setDomainConfigs] = useState<DomainConfig[]>([]);
  const [entities, setEntities] = useState<PoliticalEntity[]>([]);

  // Form Inputs
  const [newUrl, setNewUrl] = useState('');
  const [newUrlDepth, setNewUrlDepth] = useState(1);
  const [newEntityName, setNewEntityName] = useState('');
  const [newEntityType, setNewEntityType] = useState<PoliticalEntity['type']>('ministry');
  
  const [editingDomain, setEditingDomain] = useState<string | null>(null);
  const [editBudget, setEditBudget] = useState(250);
  const [editDelay, setEditDelay] = useState(2000);
  const [editMaxDepth, setEditMaxDepth] = useState(3);
  const [editConcurrency, setEditConcurrency] = useState(2);

  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; isError?: boolean } | null>(null);

  // Sync / Fetch Data
  const fetchAllBroadData = async () => {
    try {
      const [resAnal, resFront, resDom, resEnt] = await Promise.all([
        fetch('/api/broad/analytics'),
        fetch('/api/broad/frontier'),
        fetch('/api/broad/domains'),
        fetch('/api/broad/entities')
      ]);

      if (resAnal.ok) setAnalytics(await resAnal.json());
      if (resFront.ok) setFrontierUrls(await resFront.json());
      if (resDom.ok) setDomainConfigs(await resDom.json());
      if (resEnt.ok) setEntities(await resEnt.json());
    } catch (err) {
      console.error('Failed to sync Broad Crawl backend data', err);
    }
  };

  useEffect(() => {
    fetchAllBroadData();
    const interval = setInterval(fetchAllBroadData, 4000);
    return () => clearInterval(interval);
  }, []);

  // Actions
  const handleAddUrlToFrontier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUrl) return;
    setIsLoading(true);
    setStatusMessage(null);

    try {
      const res = await fetch('/api/broad/frontier/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: newUrl, depth: Number(newUrlDepth) })
      });

      if (res.ok) {
        setStatusMessage({ text: 'URL successfully entered into Crawl Frontier!' });
        setNewUrl('');
        setNewUrlDepth(1);
        fetchAllBroadData();
      } else {
        const errData = await res.json();
        setStatusMessage({ text: errData.error || 'Failed to add URL.', isError: true });
      }
    } catch {
      setStatusMessage({ text: 'Network communication error.', isError: true });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddEntity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEntityName) return;
    setIsLoading(true);
    setStatusMessage(null);

    try {
      const res = await fetch('/api/broad/entities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newEntityName, type: newEntityType })
      });

      if (res.ok) {
        setStatusMessage({ text: `Registered political entity: "${newEntityName}" & generated candidate targets.` });
        setNewEntityName('');
        fetchAllBroadData();
      } else {
        const errData = await res.json();
        setStatusMessage({ text: errData.error || 'Failed to register entity.', isError: true });
      }
    } catch {
      setStatusMessage({ text: 'Network communication error.', isError: true });
    } finally {
      setIsLoading(false);
    }
  };

  const handleApproveSeed = async (entityId: string, seedId: string) => {
    try {
      const res = await fetch(`/api/broad/entities/${entityId}/approve/${seedId}`, { method: 'POST' });
      if (res.ok) {
        setStatusMessage({ text: 'Portal approved and integrated into Core Source Registry!' });
        fetchAllBroadData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRejectSeed = async (entityId: string, seedId: string) => {
    try {
      const res = await fetch(`/api/broad/entities/${entityId}/reject/${seedId}`, { method: 'POST' });
      if (res.ok) {
        setStatusMessage({ text: 'Candidate discarded.' });
        fetchAllBroadData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveDomainConfig = async (domain: string) => {
    try {
      const res = await fetch(`/api/broad/domains/${domain}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dailyBudget: editBudget,
          rateLimitMs: editDelay,
          maxDepth: editMaxDepth,
          concurrencyLimit: editConcurrency
        })
      });

      if (res.ok) {
        setEditingDomain(null);
        setStatusMessage({ text: `Politeness configurations updated for domain "${domain}".` });
        fetchAllBroadData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const startEditDomain = (cfg: DomainConfig) => {
    setEditingDomain(cfg.domain);
    setEditBudget(cfg.dailyBudget);
    setEditDelay(cfg.rateLimitMs);
    setEditMaxDepth(cfg.maxDepth);
    setEditConcurrency(cfg.concurrencyLimit);
  };

  return (
    <div className="space-y-6" id="broad-crawl-panel">
      {/* Upper Status Cards */}
      <div className="bg-[#161B22] border border-[#2D333B] rounded p-5 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Compass className="h-5 w-5 text-[#58A6FF]" />
            <h2 className="text-md font-bold text-white uppercase tracking-wider font-mono">
              Broad Crawl & Discovery Platform
            </h2>
          </div>
          <p className="text-xs text-[#8B949E] font-mono mt-1">
            CONTINUOUS RECURSIVE DISCOVERY, GOVERNMENT RELEVANCE FILTERING, AND ENTITY SEED EXPANSION ENGINE.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button 
            onClick={() => setActiveSubTab('analytics')}
            className={`px-3 py-1.5 rounded text-xs font-mono uppercase tracking-wider transition-all border cursor-pointer select-none ${activeSubTab === 'analytics' ? 'bg-[#1F242C] text-white border-[#58A6FF]' : 'bg-transparent text-[#8B949E] border-[#2D333B] hover:text-white'}`}
          >
            Analytics
          </button>
          <button 
            onClick={() => setActiveSubTab('frontier')}
            className={`px-3 py-1.5 rounded text-xs font-mono uppercase tracking-wider transition-all border cursor-pointer select-none ${activeSubTab === 'frontier' ? 'bg-[#1F242C] text-white border-[#58A6FF]' : 'bg-transparent text-[#8B949E] border-[#2D333B] hover:text-white'}`}
          >
            Crawl Frontier ({frontierUrls.filter(u => u.crawlStatus === 'pending').length})
          </button>
          <button 
            onClick={() => setActiveSubTab('seeds')}
            className={`px-3 py-1.5 rounded text-xs font-mono uppercase tracking-wider transition-all border cursor-pointer select-none ${activeSubTab === 'seeds' ? 'bg-[#1F242C] text-white border-[#58A6FF]' : 'bg-transparent text-[#8B949E] border-[#2D333B] hover:text-white'}`}
          >
            Seed Expansion ({entities.length})
          </button>
          <button 
            onClick={() => setActiveSubTab('domains')}
            className={`px-3 py-1.5 rounded text-xs font-mono uppercase tracking-wider transition-all border cursor-pointer select-none ${activeSubTab === 'domains' ? 'bg-[#1F242C] text-white border-[#58A6FF]' : 'bg-transparent text-[#8B949E] border-[#2D333B] hover:text-white'}`}
          >
            Domain Settings
          </button>
        </div>
      </div>

      {statusMessage && (
        <div className={`p-4 rounded border text-xs font-mono flex items-center justify-between ${statusMessage.isError ? 'bg-[#F85149]/10 border-[#F85149]/40 text-[#F85149]' : 'bg-[#238636]/10 border-[#238636]/40 text-[#7EE787]'}`}>
          <span>{statusMessage.text}</span>
          <button onClick={() => setStatusMessage(null)} className="text-[#8B949E] hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Analytics Sub-Tab */}
      {activeSubTab === 'analytics' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-[#161B22] border border-[#2D333B] rounded p-4">
              <span className="text-[10px] text-[#8B949E] uppercase font-mono tracking-wider block">Total Discovered Links</span>
              <span className="text-2xl font-bold text-white font-mono mt-1 block">{analytics.totalDiscovered.toLocaleString()}</span>
              <div className="text-[9px] text-[#3FB950] font-mono mt-2">↑ CONTINUALLY DISCOVERING</div>
            </div>
            <div className="bg-[#161B22] border border-[#2D333B] rounded p-4">
              <span className="text-[10px] text-[#8B949E] uppercase font-mono tracking-wider block">Pending Queue</span>
              <span className="text-2xl font-bold text-[#58A6FF] font-mono mt-1 block">{analytics.pendingInFrontier}</span>
              <div className="text-[9px] text-[#8B949E] font-mono mt-2">WAITING IN FRONTIER</div>
            </div>
            <div className="bg-[#161B22] border border-[#2D333B] rounded p-4">
              <span className="text-[10px] text-[#8B949E] uppercase font-mono tracking-wider block">Active Domains</span>
              <span className="text-2xl font-bold text-[#D29922] font-mono mt-1 block">{analytics.activeDomainsCount}</span>
              <div className="text-[9px] text-[#8B949E] font-mono mt-2">BALANCED CRITERIA CAP</div>
            </div>
            <div className="bg-[#161B22] border border-[#2D333B] rounded p-4">
              <span className="text-[10px] text-[#8B949E] uppercase font-mono tracking-wider block">Throughput (Today)</span>
              <span className="text-2xl font-bold text-white font-mono mt-1 block">{analytics.totalThroughputPages}</span>
              <div className="text-[9px] text-[#8B949E] font-mono mt-2">PAGES CRAWLED & PARSED</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Fetch Distribution Routing */}
            <div className="bg-[#161B22] border border-[#2D333B] rounded p-5">
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-white mb-4 flex items-center gap-2">
                <Cpu className="h-4 w-4 text-[#58A6FF]" /> Fetch Routing Engine (Static vs Dynamic)
              </h3>
              <p className="text-[11px] text-[#8B949E] font-mono mb-4">
                Reduces Playwright browser rendering resource consumption by routing clean static files to Scrapy fetcher engines.
              </p>
              
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs font-mono mb-1 text-white">
                    <span>Static Scrapy Engine ({analytics.staticFetchCount})</span>
                    <span>{analytics.totalDiscovered > 0 ? Math.round((analytics.staticFetchCount / analytics.totalDiscovered) * 100) : 100}%</span>
                  </div>
                  <div className="w-full bg-[#21262D] h-3 rounded-full overflow-hidden">
                    <div 
                      className="bg-[#238636] h-full" 
                      style={{ width: `${analytics.totalDiscovered > 0 ? (analytics.staticFetchCount / analytics.totalDiscovered) * 100 : 100}%` }}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-mono mb-1 text-white">
                    <span>Dynamic Playwright Engine ({analytics.dynamicFetchCount})</span>
                    <span>{analytics.totalDiscovered > 0 ? Math.round((analytics.dynamicFetchCount / analytics.totalDiscovered) * 100) : 0}%</span>
                  </div>
                  <div className="w-full bg-[#21262D] h-3 rounded-full overflow-hidden">
                    <div 
                      className="bg-[#D29922] h-full" 
                      style={{ width: `${analytics.totalDiscovered > 0 ? (analytics.dynamicFetchCount / analytics.totalDiscovered) * 100 : 0}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              <div className="mt-5 p-3 rounded bg-[#0D1117] border border-[#2D333B] text-[10px] text-[#8B949E] font-mono flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#238636]"></span>
                Routing Cache Active: Preserving static routing rules for parsed schemas
              </div>
            </div>

            {/* Relevance Distribution */}
            <div className="bg-[#161B22] border border-[#2D333B] rounded p-5">
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-white mb-4 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-[#58A6FF]" /> Civic Relevance Distribution
              </h3>
              <p className="text-[11px] text-[#8B949E] font-mono mb-4">
                Distribution of newly discovered URLs based on Government Relevance Classifier criteria. Only medium/high scores are allowed in the Frontier.
              </p>

              <div className="space-y-3 font-mono text-xs">
                <div className="flex justify-between items-center py-1.5 border-b border-[#2D333B]">
                  <span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-[#3FB950]"></span> High Relevance (score &gt;= 75)</span>
                  <span className="font-bold text-white">{analytics.relevanceDistribution.high}</span>
                </div>
                <div className="flex justify-between items-center py-1.5 border-b border-[#2D333B]">
                  <span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-[#D29922]"></span> Medium Relevance (40 - 74)</span>
                  <span className="font-bold text-white">{analytics.relevanceDistribution.medium}</span>
                </div>
                <div className="flex justify-between items-center py-1.5">
                  <span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-[#F85149]"></span> Low Relevance (&lt; 40 - Suppressed)</span>
                  <span className="font-bold text-[#8B949E]">{analytics.relevanceDistribution.low} (Filtered)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Crawl Frontier Sub-Tab */}
      {activeSubTab === 'frontier' && (
        <div className="space-y-6">
          {/* Quick Add Form */}
          <div className="bg-[#161B22] border border-[#2D333B] rounded p-5">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-white mb-4 flex items-center gap-2">
              <Plus className="h-4 w-4 text-[#58A6FF]" /> Manually Inject Seed URL to Crawl Frontier
            </h3>
            <form onSubmit={handleAddUrlToFrontier} className="flex flex-col sm:flex-row gap-3">
              <input 
                type="url"
                required
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                placeholder="https://example.gov.ng/press-release"
                className="flex-1 bg-[#0D1117] border border-[#2D333B] px-3 py-2 rounded text-xs font-mono focus:outline-none focus:border-[#58A6FF] text-white"
              />
              <div className="w-full sm:w-40">
                <select
                  value={newUrlDepth}
                  onChange={(e) => setNewUrlDepth(Number(e.target.value))}
                  className="w-full bg-[#0D1117] border border-[#2D333B] px-3 py-2 rounded text-xs font-mono focus:outline-none text-white"
                >
                  <option value={1}>Crawl Depth 1</option>
                  <option value={2}>Crawl Depth 2</option>
                  <option value={3}>Crawl Depth 3</option>
                </select>
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="bg-[#238636] hover:bg-[#2EA043] disabled:opacity-50 text-white px-4 py-2 rounded text-xs font-mono uppercase tracking-wider font-bold transition-colors select-none cursor-pointer border border-[#2D333B]"
              >
                Inject Target
              </button>
            </form>
          </div>

          {/* Queue Table */}
          <div className="bg-[#161B22] border border-[#2D333B] rounded overflow-hidden">
            <div className="p-4 border-b border-[#2D333B] flex justify-between items-center">
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-white">
                Pending URL Backlog ({frontierUrls.length} entries)
              </h3>
              <span className="text-[10px] text-[#8B949E] font-mono">SORTED BY PRIORITY WEIGHTS</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs font-mono">
                <thead>
                  <tr className="bg-[#0D1117] border-b border-[#2D333B] text-[#8B949E]">
                    <th className="p-3">Target URL</th>
                    <th className="p-3">Domain</th>
                    <th className="p-3 text-center">Depth</th>
                    <th className="p-3 text-center">Relevance Score</th>
                    <th className="p-3 text-center">Priority</th>
                    <th className="p-3 text-center">Fetch Type</th>
                    <th className="p-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2D333B]">
                  {frontierUrls.map((item) => {
                    const statusColors = {
                      pending: 'bg-[#21262D] text-[#58A6FF]',
                      processing: 'bg-[#D29922]/20 text-[#D29922] animate-pulse',
                      completed: 'bg-[#238636]/20 text-[#238636]',
                      failed: 'bg-[#F85149]/20 text-[#F85149]'
                    };

                    return (
                      <tr key={item.id} className="hover:bg-[#161B22]/50">
                        <td className="p-3 font-semibold text-white truncate max-w-xs sm:max-w-md" title={item.url}>
                          {item.url}
                        </td>
                        <td className="p-3 text-[#8B949E]">{item.domain}</td>
                        <td className="p-3 text-center text-[#8B949E]">{item.crawlDepth}</td>
                        <td className="p-3 text-center">
                          <span className={`px-2 py-0.5 rounded font-bold ${item.relevanceScore >= 75 ? 'bg-[#238636]/10 text-[#3FB950]' : 'bg-[#D29922]/10 text-[#E3B341]'}`}>
                            {item.relevanceScore}% (conf: {item.confidenceScore}%)
                          </span>
                        </td>
                        <td className="p-3 text-center font-bold text-[#58A6FF]">{item.priorityScore}</td>
                        <td className="p-3 text-center text-white capitalize">{item.fetchType}</td>
                        <td className="p-3 text-right">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${statusColors[item.crawlStatus] || statusColors.pending}`}>
                            {item.crawlStatus.toUpperCase()}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                  {frontierUrls.length === 0 && (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-[#8B949E] font-mono">
                        NO TARGET URLS WAITING IN THE CRAWL FRONTIER. ADD A TARGET OR ENTITY SEED TO BEGIN.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Seed Expansion Sub-Tab */}
      {activeSubTab === 'seeds' && (
        <div className="space-y-6">
          {/* Register Political Entity */}
          <div className="bg-[#161B22] border border-[#2D333B] rounded p-5">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-white mb-4 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[#58A6FF]" /> Register Political Entity (Automated Source Expansion)
            </h3>
            <form onSubmit={handleAddEntity} className="flex flex-col sm:flex-row gap-3">
              <input 
                type="text"
                required
                value={newEntityName}
                onChange={(e) => setNewEntityName(e.target.value)}
                placeholder="e.g. Federal Ministry of Environment"
                className="flex-1 bg-[#0D1117] border border-[#2D333B] px-3 py-2 rounded text-xs font-mono focus:outline-none focus:border-[#58A6FF] text-white"
              />
              <div className="w-full sm:w-48">
                <select
                  value={newEntityType}
                  onChange={(e) => setNewEntityType(e.target.value as any)}
                  className="w-full bg-[#0D1117] border border-[#2D333B] px-3 py-2 rounded text-xs font-mono focus:outline-none text-white"
                >
                  <option value="ministry">Ministry / Cabinet</option>
                  <option value="agency">Agency / Commission</option>
                  <option value="politician">Politician / Office-Holder</option>
                  <option value="program">Government Program</option>
                  <option value="local_gov">Local Government Authority</option>
                </select>
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="bg-[#238636] hover:bg-[#2EA043] disabled:opacity-50 text-white px-4 py-2 rounded text-xs font-mono uppercase tracking-wider font-bold transition-colors select-none cursor-pointer border border-[#2D333B]"
              >
                Expand Seeds
              </button>
            </form>
          </div>

          {/* Entities Grid */}
          <div className="space-y-4">
            {entities.map((ent) => (
              <div key={ent.id} className="bg-[#161B22] border border-[#2D333B] rounded p-5 space-y-4">
                <div className="flex justify-between items-center border-b border-[#2D333B] pb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-white font-mono font-bold text-sm">{ent.name}</span>
                    <span className="bg-[#21262D] text-[#8B949E] text-[10px] font-mono uppercase px-2 py-0.5 rounded border border-[#2D333B]">
                      {ent.type.toUpperCase()}
                    </span>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${ent.status === 'approved' ? 'bg-[#238636]/20 text-[#3FB950]' : 'bg-[#D29922]/20 text-[#E3B341]'}`}>
                    {ent.status.toUpperCase()}
                  </span>
                </div>

                {ent.discoveredSources.length > 0 ? (
                  <div className="space-y-3">
                    <div className="text-[10px] text-[#8B949E] font-mono uppercase tracking-wider">Discovered Portal Candidates:</div>
                    <div className="space-y-2">
                      {ent.discoveredSources.map((seed) => (
                        <div key={seed.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-[#0D1117] border border-[#2D333B] p-3 rounded gap-3">
                          <div className="font-mono text-xs">
                            <div className="text-white font-bold">{seed.title}</div>
                            <div className="text-[#58A6FF] truncate max-w-sm md:max-w-xl mt-0.5">{seed.url}</div>
                            <div className="text-[10px] text-[#8B949E] mt-1 italic">Reason: {seed.reason}</div>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <div className="text-right font-mono text-[10px] pr-2">
                              <span className="text-[#3FB950] font-bold">Rel: {seed.relevance}%</span>
                              <span className="text-[#8B949E] block">Conf: {seed.confidence}%</span>
                            </div>
                            <button
                              onClick={() => handleApproveSeed(ent.id, seed.id)}
                              className="bg-[#238636]/20 hover:bg-[#238636] hover:text-white text-[#3FB950] px-2.5 py-1.5 rounded transition-all flex items-center gap-1 cursor-pointer"
                              title="Approve and register source"
                            >
                              <Check className="h-3.5 w-3.5" />
                              <span className="text-[10px] font-mono uppercase font-bold">Approve</span>
                            </button>
                            <button
                              onClick={() => handleRejectSeed(ent.id, seed.id)}
                              className="bg-[#F85149]/10 hover:bg-[#F85149] hover:text-white text-[#F85149] p-1.5 rounded transition-all cursor-pointer"
                              title="Discard candidate"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-[#8B949E] font-mono text-center py-4">
                    ALL PORTAL CANDIDATES HAVE BEEN PROCESSED OR NO SEEDS REMAIN.
                  </div>
                )}
              </div>
            ))}

            {entities.length === 0 && (
              <div className="bg-[#161B22] border border-[#2D333B] rounded p-8 text-center text-[#8B949E] font-mono">
                NO SEED EXPANSION ENTITIES IN DATABASE. REGISTER AN ENTITY TO INITIATE TRACING.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Domain Sub-Tab */}
      {activeSubTab === 'domains' && (
        <div className="space-y-6">
          <div className="bg-[#161B22] border border-[#2D333B] rounded overflow-hidden">
            <div className="p-4 border-b border-[#2D333B] flex justify-between items-center">
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-white">
                Domain Budgets & Politeness Manager
              </h3>
              <span className="text-[10px] text-[#8B949E] font-mono">DURABLE POLITENESS COMPLIANCE</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs font-mono">
                <thead>
                  <tr className="bg-[#0D1117] border-b border-[#2D333B] text-[#8B949E]">
                    <th className="p-3">Domain</th>
                    <th className="p-3 text-center">Daily Budget</th>
                    <th className="p-3 text-center">Pages Crawled Today</th>
                    <th className="p-3 text-center">Max Depth</th>
                    <th className="p-3 text-center">Crawl Delay (Rate Limit)</th>
                    <th className="p-3 text-center">Concurrency Limit</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2D333B]">
                  {domainConfigs.map((cfg) => {
                    const isEditing = editingDomain === cfg.domain;

                    return (
                      <tr key={cfg.domain} className="hover:bg-[#161B22]/50">
                        <td className="p-3 text-white font-semibold">{cfg.domain}</td>
                        <td className="p-3 text-center">
                          {isEditing ? (
                            <input 
                              type="number"
                              value={editBudget}
                              onChange={(e) => setEditBudget(Number(e.target.value))}
                              className="w-20 bg-[#0D1117] border border-[#2D333B] text-center p-1 rounded text-white"
                            />
                          ) : (
                            cfg.dailyBudget
                          )}
                        </td>
                        <td className="p-3 text-center text-[#8B949E]">
                          {cfg.pagesCrawledToday} / {cfg.dailyBudget}
                        </td>
                        <td className="p-3 text-center">
                          {isEditing ? (
                            <input 
                              type="number"
                              value={editMaxDepth}
                              onChange={(e) => setEditMaxDepth(Number(e.target.value))}
                              className="w-16 bg-[#0D1117] border border-[#2D333B] text-center p-1 rounded text-white"
                            />
                          ) : (
                            cfg.maxDepth
                          )}
                        </td>
                        <td className="p-3 text-center">
                          {isEditing ? (
                            <input 
                              type="number"
                              value={editDelay}
                              onChange={(e) => setEditDelay(Number(e.target.value))}
                              className="w-20 bg-[#0D1117] border border-[#2D333B] text-center p-1 rounded text-white"
                            />
                          ) : (
                            `${cfg.rateLimitMs}ms`
                          )}
                        </td>
                        <td className="p-3 text-center">
                          {isEditing ? (
                            <input 
                              type="number"
                              value={editConcurrency}
                              onChange={(e) => setEditConcurrency(Number(e.target.value))}
                              className="w-16 bg-[#0D1117] border border-[#2D333B] text-center p-1 rounded text-white"
                            />
                          ) : (
                            cfg.concurrencyLimit
                          )}
                        </td>
                        <td className="p-3 text-right">
                          {isEditing ? (
                            <div className="flex justify-end gap-1.5">
                              <button
                                onClick={() => handleSaveDomainConfig(cfg.domain)}
                                className="bg-[#238636] text-white px-2.5 py-1 rounded text-[10px] uppercase font-bold cursor-pointer"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => setEditingDomain(null)}
                                className="bg-[#21262D] text-[#8B949E] px-2.5 py-1 rounded text-[10px] uppercase font-bold cursor-pointer"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => startEditDomain(cfg)}
                              className="bg-[#21262D] hover:bg-[#30363D] text-white px-2.5 py-1 rounded text-[10px] uppercase font-bold transition-all cursor-pointer border border-[#2D333B] flex items-center gap-1 ml-auto"
                            >
                              <Settings className="h-3 w-3" /> Configure
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {domainConfigs.length === 0 && (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-[#8B949E] font-mono">
                        NO REGISTERED DOMAINS YET. DOMAINS WILL POPULATE ONCE URLS ARE DISCOVERED IN THE FRONTIER.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
