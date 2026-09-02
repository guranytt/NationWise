/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Globe, 
  Plus, 
  Trash2, 
  Edit3, 
  Play, 
  X, 
  Check, 
  Link2, 
  AlertCircle 
} from 'lucide-react';
import { Source, SourceType, CrawlPriority, CrawlFrequency } from '../types';

interface SourceRegistryProps {
  sources: Source[];
  onCreate: (src: Omit<Source, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onUpdate: (id: string, updates: Partial<Omit<Source, 'id' | 'createdAt' | 'updatedAt'>>) => void;
  onDelete: (id: string) => void;
  onTriggerCrawl: (id: string) => void;
}

export const SourceRegistry: React.FC<SourceRegistryProps> = ({
  sources,
  onCreate,
  onUpdate,
  onDelete,
  onTriggerCrawl
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingSourceId, setEditingSourceId] = useState<string | null>(null);

  // Form States
  const [name, setName] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [sourceType, setSourceType] = useState<SourceType>('government_website');
  const [crawlFrequency, setCrawlFrequency] = useState<CrawlFrequency>('daily');
  const [crawlPriority, setCrawlPriority] = useState<CrawlPriority>('medium');
  const [sitemapUrl, setSitemapUrl] = useState('');
  const [rssUrl, setRssUrl] = useState('');
  const [maxDepth, setMaxDepth] = useState(2);
  const [allowlist, setAllowlist] = useState('');
  const [blocklist, setBlocklist] = useState('');
  const [respectRobots, setRespectRobots] = useState(true);
  const [rateLimitMs, setRateLimitMs] = useState(1500);

  const [notification, setNotification] = useState<string | null>(null);

  const resetForm = () => {
    setName('');
    setBaseUrl('');
    setSourceType('government_website');
    setCrawlFrequency('daily');
    setCrawlPriority('medium');
    setSitemapUrl('');
    setRssUrl('');
    setMaxDepth(2);
    setAllowlist('');
    setBlocklist('');
    setRespectRobots(true);
    setRateLimitMs(1500);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !baseUrl) return;

    onCreate({
      name,
      baseUrl,
      sourceType,
      crawlFrequency,
      crawlPriority,
      sitemapUrl: sitemapUrl || undefined,
      rssUrl: rssUrl || undefined,
      crawlRules: {
        maxDepth,
        allowlist: allowlist.split(',').map(s => s.trim()).filter(Boolean),
        blocklist: blocklist.split(',').map(s => s.trim()).filter(Boolean),
        respectRobots,
        rateLimitMs
      },
      isActive: true
    });

    setShowAddForm(false);
    resetForm();
    showToast('Source successfully added to target registry!');
  };

  const startEdit = (src: Source) => {
    setEditingSourceId(src.id);
    setName(src.name);
    setBaseUrl(src.baseUrl);
    setSourceType(src.sourceType);
    setCrawlFrequency(src.crawlFrequency);
    setCrawlPriority(src.crawlPriority);
    setSitemapUrl(src.sitemapUrl || '');
    setRssUrl(src.rssUrl || '');
    setMaxDepth(src.crawlRules.maxDepth);
    setAllowlist(src.crawlRules.allowlist.join(', '));
    setBlocklist(src.crawlRules.blocklist.join(', '));
    setRespectRobots(src.crawlRules.respectRobots);
    setRateLimitMs(src.crawlRules.rateLimitMs);
  };

  const handleUpdate = (id: string) => {
    onUpdate(id, {
      name,
      baseUrl,
      sourceType,
      crawlFrequency,
      crawlPriority,
      sitemapUrl: sitemapUrl || undefined,
      rssUrl: rssUrl || undefined,
      crawlRules: {
        maxDepth,
        allowlist: allowlist.split(',').map(s => s.trim()).filter(Boolean),
        blocklist: blocklist.split(',').map(s => s.trim()).filter(Boolean),
        respectRobots,
        rateLimitMs
      }
    });

    setEditingSourceId(null);
    resetForm();
    showToast('Source settings updated successfully.');
  };

  const handleToggleActive = (src: Source) => {
    onUpdate(src.id, { isActive: !src.isActive });
    showToast(`Source target ${!src.isActive ? 'activated' : 'paused'}.`);
  };

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const getSourceTypeLabel = (type: SourceType) => {
    switch (type) {
      case 'government_website': return 'Gov Website';
      case 'ministry_portal': return 'Ministry Portal';
      case 'press_releases': return 'Press Releases';
      case 'policy_page': return 'Policy Page';
      case 'manifesto_document': return 'Statutory Manual';
    }
  };

  return (
    <div className="space-y-6" id="source-registry-tab">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#161B22] border border-[#238636] text-[#E0E0E0] px-4 py-3 rounded shadow-2xl flex items-center gap-2.5 max-w-sm animate-bounce" id="toast-notify">
          <Check className="h-4 w-4 text-[#3FB950] bg-[#238636]/20 p-0.5 rounded" />
          <span className="text-xs font-mono font-bold tracking-tight">{notification}</span>
        </div>
      )}

      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-md font-mono font-bold uppercase tracking-wider text-white flex items-center gap-2">
            Target Source Registry
          </h2>
          <p className="text-xs text-[#8B949E] font-mono mt-1">
            CONFIGURE APPROVED PUBLIC PORTALS, CRAWL SCHEDULES, SITEMAP STRUCTURES, AND RSS TRIGGERS.
          </p>
        </div>
        {!showAddForm && (
          <button
            onClick={() => { resetForm(); setShowAddForm(true); setEditingSourceId(null); }}
            className="flex items-center gap-1.5 bg-[#238636] hover:bg-[#2EA043] text-white px-4 py-2 rounded text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer border border-[#2D333B]"
            id="btn-register-source"
          >
            <Plus className="h-4 w-4" />
            Register Source
          </button>
        )}
      </div>

      {/* Source Form (Add / Edit) */}
      {(showAddForm || editingSourceId) && (
        <form onSubmit={editingSourceId ? (e) => { e.preventDefault(); handleUpdate(editingSourceId); } : handleCreate} className="bg-[#161B22] border border-[#2D333B] rounded p-6 space-y-4 font-mono text-xs" id="source-config-form">
          <div className="flex justify-between items-center pb-3 border-b border-[#2D333B]">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">
              {editingSourceId ? 'Modify Source Configuration' : 'Register New Approved Source'}
            </h3>
            <button
              type="button"
              onClick={() => { setShowAddForm(false); setEditingSourceId(null); resetForm(); }}
              className="text-[#8B949E] hover:text-white p-1 rounded"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-[#8B949E] uppercase tracking-wider mb-1.5">Portal / Source Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Budget Office of the Federation"
                className="w-full bg-[#0B0E14] border border-[#2D333B] rounded px-3 py-2 text-white focus:outline-none focus:border-[#58A6FF]"
                id="input-source-name"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-[#8B949E] uppercase tracking-wider mb-1.5">Base URL (Domain Root)</label>
              <input
                type="url"
                required
                value={baseUrl}
                onChange={e => setBaseUrl(e.target.value)}
                placeholder="https://www.budgetoffice.gov.ng"
                className="w-full bg-[#0B0E14] border border-[#2D333B] rounded px-3 py-2 text-white focus:outline-none focus:border-[#58A6FF]"
                id="input-source-url"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-[#8B949E] uppercase tracking-wider mb-1.5">Source Classification</label>
              <select
                value={sourceType}
                onChange={e => setSourceType(e.target.value as SourceType)}
                className="w-full bg-[#0B0E14] border border-[#2D333B] rounded px-3 py-2 text-white focus:outline-none focus:border-[#58A6FF]"
              >
                <option value="government_website">Government Website</option>
                <option value="ministry_portal">Ministry Portal</option>
                <option value="press_releases">Press Release Page</option>
                <option value="policy_page">Policy Page</option>
                <option value="manifesto_document">Statutory Manual</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-[#8B949E] uppercase tracking-wider mb-1.5">Crawl Frequency</label>
              <select
                value={crawlFrequency}
                onChange={e => setCrawlFrequency(e.target.value as CrawlFrequency)}
                className="w-full bg-[#0B0E14] border border-[#2D333B] rounded px-3 py-2 text-white focus:outline-none focus:border-[#58A6FF]"
              >
                <option value="hourly">Hourly polling</option>
                <option value="daily">Daily intervals</option>
                <option value="weekly">Weekly sweep</option>
                <option value="manual">Manual trigger only</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-[#8B949E] uppercase tracking-wider mb-1.5">Crawl Priority</label>
              <select
                value={crawlPriority}
                onChange={e => setCrawlPriority(e.target.value as CrawlPriority)}
                className="w-full bg-[#0B0E14] border border-[#2D333B] rounded px-3 py-2 text-white focus:outline-none focus:border-[#58A6FF]"
              >
                <option value="high">High Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="low">Low Priority</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-[#8B949E] uppercase tracking-wider mb-1.5">Sitemap URL (XML File Link - Optional)</label>
              <input
                type="url"
                value={sitemapUrl}
                onChange={e => setSitemapUrl(e.target.value)}
                placeholder="https://www.budgetoffice.gov.ng/sitemap.xml"
                className="w-full bg-[#0B0E14] border border-[#2D333B] rounded px-3 py-2 text-white focus:outline-none focus:border-[#58A6FF]"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-[#8B949E] uppercase tracking-wider mb-1.5">RSS / Atom Feed URL (Optional)</label>
              <input
                type="url"
                value={rssUrl}
                onChange={e => setRssUrl(e.target.value)}
                placeholder="https://www.budgetoffice.gov.ng/feed"
                className="w-full bg-[#0B0E14] border border-[#2D333B] rounded px-3 py-2 text-white focus:outline-none focus:border-[#58A6FF]"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-[#2D333B]">
            <h4 className="text-[10px] font-bold text-[#3FB950] uppercase tracking-wider mb-3">Broad Crawl Crawling Parameters</h4>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-[9px] font-bold text-[#8B949E] uppercase mb-1">Max Crawl Depth</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={maxDepth}
                  onChange={e => setMaxDepth(parseInt(e.target.value))}
                  className="w-full bg-[#0B0E14] border border-[#2D333B] rounded px-2.5 py-1.5 text-white"
                />
              </div>
              <div>
                <label className="block text-[9px] font-bold text-[#8B949E] uppercase mb-1">Politeness Limit (ms)</label>
                <input
                  type="number"
                  step="100"
                  value={rateLimitMs}
                  onChange={e => setRateLimitMs(parseInt(e.target.value))}
                  className="w-full bg-[#0B0E14] border border-[#2D333B] rounded px-2.5 py-1.5 text-white"
                />
              </div>
              <div className="sm:col-span-2 flex items-center h-full pt-4">
                <label className="flex items-center gap-2 text-[#8B949E] select-none cursor-pointer">
                  <input
                    type="checkbox"
                    checked={respectRobots}
                    onChange={e => setRespectRobots(e.target.checked)}
                    className="rounded text-[#238636] bg-[#0B0E14] border-[#2D333B] h-4 w-4"
                  />
                  Strictly Respect robots.txt (Compliant Mode)
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-[9px] font-bold text-[#8B949E] uppercase mb-1">URL Path Allowlist (Comma separated)</label>
                <input
                  type="text"
                  value={allowlist}
                  onChange={e => setAllowlist(e.target.value)}
                  placeholder="/speeches, /news, /publications"
                  className="w-full bg-[#0B0E14] border border-[#2D333B] rounded px-2.5 py-1.5 text-white"
                />
              </div>
              <div>
                <label className="block text-[9px] font-bold text-[#8B949E] uppercase mb-1">URL Path Blocklist (Comma separated)</label>
                <input
                  type="text"
                  value={blocklist}
                  onChange={e => setBlocklist(e.target.value)}
                  placeholder="/wp-content, /tag, /category"
                  className="w-full bg-[#0B0E14] border border-[#2D333B] rounded px-2.5 py-1.5 text-white"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-[#2D333B]">
            <button
              type="button"
              onClick={() => { setShowAddForm(false); setEditingSourceId(null); resetForm(); }}
              className="bg-[#21262D] hover:bg-[#30363D] border border-[#2D333B] text-[#E0E0E0] px-4 py-2 rounded text-xs font-bold transition-colors cursor-pointer select-none"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-[#238636] hover:bg-[#2EA043] border border-[#2D333B] text-white px-5 py-2 rounded text-xs font-bold transition-colors cursor-pointer select-none flex items-center gap-1.5"
              id="btn-save-source"
            >
              <Check className="h-3.5 w-3.5" />
              {editingSourceId ? 'Update Settings' : 'Save & Active'}
            </button>
          </div>
        </form>
      )}

      {/* Sources Grid Card List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4" id="sources-grid">
        {sources.map(src => (
          <div key={src.id} className="bg-[#161B22] border border-[#2D333B] rounded p-5 hover:border-[#58A6FF]/40 transition-all flex flex-col justify-between group" id={`source-card-${src.id}`}>
            <div>
              <div className="flex justify-between items-start gap-2">
                <div>
                  <h3 className="font-bold text-sm text-white group-hover:text-[#58A6FF] transition-colors flex items-center gap-2 uppercase tracking-wide font-mono">
                    <Globe className="h-4 w-4 text-[#58A6FF]" /> {src.name}
                  </h3>
                  <a
                    href={src.baseUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-[#8B949E] flex items-center gap-1.5 hover:text-[#58A6FF] mt-1.5 font-mono hover:underline"
                  >
                    <Link2 className="h-3 w-3" /> {src.baseUrl}
                  </a>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wide bg-[#0D1117] border border-[#2D333B] ${src.crawlPriority === 'high' ? 'text-[#F85149]' : src.crawlPriority === 'medium' ? 'text-[#E3B341]' : 'text-[#8B949E]'}`}>
                    {src.crawlPriority}
                  </span>
                  <button
                    onClick={() => handleToggleActive(src)}
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wide select-none cursor-pointer ${src.isActive ? 'bg-[#238636]/20 text-[#3FB950] border border-[#238636]/30' : 'bg-[#21262D] text-[#8B949E] border border-[#2D333B]'}`}
                  >
                    {src.isActive ? 'Active' : 'Paused'}
                  </button>
                </div>
              </div>

              {/* Crawl Attributes */}
              <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 mt-4 text-[11px] font-mono bg-[#0D1117] p-3 rounded border border-[#2D333B]">
                <div className="text-[#8B949E]">Classification: <span className="text-[#E0E0E0] font-medium">{getSourceTypeLabel(src.sourceType)}</span></div>
                <div className="text-[#8B949E]">Frequency: <span className="text-[#E0E0E0] font-medium capitalize">{src.crawlFrequency}</span></div>
                <div className="text-[#8B949E] col-span-2 flex items-center gap-1 truncate">
                  <span className="text-[#8B949E]">RSS:</span> 
                  <span className={src.rssUrl ? "text-[#3FB950] font-bold" : "text-[#8B949E]/50"}>{src.rssUrl ? 'Configured' : 'None'}</span>
                  <span className="text-[#2D333B] mx-1">|</span>
                  <span className="text-[#8B949E]">Sitemap:</span> 
                  <span className={src.sitemapUrl ? "text-[#3FB950] font-bold" : "text-[#8B949E]/50"}>{src.sitemapUrl ? 'Configured' : 'None'}</span>
                </div>
              </div>

              <div className="mt-3.5 flex items-center gap-1.5 text-[10px] text-[#8B949E] font-mono">
                <AlertCircle className="h-3.5 w-3.5" />
                LAST INGESTION: <span className="text-[#E0E0E0] font-medium">{src.lastCrawlTimestamp ? new Date(src.lastCrawlTimestamp).toLocaleString() : 'NEVER_VISITED'}</span>
              </div>
            </div>

            {/* Actions Footer */}
            <div className="flex justify-end gap-2 mt-5 pt-3 border-t border-[#2D333B]">
              <button
                onClick={() => startEdit(src)}
                className="flex items-center gap-1 bg-[#21262D] hover:bg-[#30363D] border border-[#2D333B] text-white px-3 py-1.5 rounded text-[11px] font-mono uppercase tracking-wider transition-all cursor-pointer"
                title="Edit Configuration"
              >
                <Edit3 className="h-3 w-3" /> Edit
              </button>
              <button
                onClick={() => onDelete(src.id)}
                className="flex items-center gap-1 bg-[#21262D] hover:bg-[#F85149]/20 hover:text-[#F85149] border border-[#2D333B] text-[#8B949E] px-3 py-1.5 rounded text-[11px] font-mono uppercase tracking-wider transition-all cursor-pointer"
                title="Delete Source"
              >
                <Trash2 className="h-3 w-3" /> Delete
              </button>
              <button
                onClick={() => onTriggerCrawl(src.id)}
                disabled={!src.isActive}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded text-[11px] font-mono font-bold uppercase tracking-wider transition-all cursor-pointer ${src.isActive ? 'bg-[#238636] hover:bg-[#2EA043] border border-[#2D333B] text-white' : 'bg-[#21262D] text-[#8B949E]/40 border border-[#2D333B] cursor-not-allowed'}`}
                id={`btn-manual-crawl-${src.id}`}
              >
                <Play className="h-3 w-3 fill-current" /> Run Crawl
              </button>
            </div>
          </div>
        ))}
        {sources.length === 0 && (
          <div className="text-center text-[#8B949E] py-16 col-span-2 bg-[#161B22] border border-[#2D333B] rounded font-mono text-xs">
            NO REGISTERED TARGET PORTALS IN DATABASE REGISTRY. CREATE A TARGET PORTAL TO START INGESTION.
          </div>
        )}
      </div>
    </div>
  );
};
