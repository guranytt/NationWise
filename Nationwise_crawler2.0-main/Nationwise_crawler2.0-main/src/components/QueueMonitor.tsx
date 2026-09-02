/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Layers, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Trash2,
  RefreshCw,
  Search,
  Filter
} from 'lucide-react';
import { QueueJob, JobStatus } from '../types';

interface QueueMonitorProps {
  jobs: QueueJob[];
  onClearHistory: () => void;
  onRefresh: () => void;
}

export const QueueMonitor: React.FC<QueueMonitorProps> = ({ jobs, onClearHistory, onRefresh }) => {
  const [filterStatus, setFilterStatus] = useState<JobStatus | 'all'>('all');
  const [searchUrl, setSearchUrl] = useState('');

  const filteredJobs = jobs.filter(j => {
    const statusMatch = filterStatus === 'all' || j.status === filterStatus;
    const urlMatch = !searchUrl || (j.payload.url && j.payload.url.toLowerCase().includes(searchUrl.toLowerCase()));
    return statusMatch && urlMatch;
  });

  const getStatusBadge = (status: JobStatus) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 bg-[#21262D] text-[#8B949E] border border-[#2D333B] px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono">
            <Clock className="h-3 w-3" /> Pending
          </span>
        );
      case 'processing':
        return (
          <span className="inline-flex items-center gap-1 bg-[#D29922]/20 text-[#E3B341] border border-[#D29922]/30 px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono animate-pulse">
            <RefreshCw className="h-3 w-3 animate-spin" /> In Progress
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 bg-[#238636]/20 text-[#3FB950] border border-[#238636]/30 px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono">
            <CheckCircle className="h-3 w-3" /> Completed
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1 bg-[#F85149]/20 text-[#F85149] border border-[#F85149]/30 px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono">
            <XCircle className="h-3 w-3" /> Failed (DLQ)
          </span>
        );
    }
  };

  const getJobTypeLabel = (type: string) => {
    switch (type) {
      case 'crawl_source': return 'Crawl Base Source';
      case 'rss_poll': return 'RSS Feed Polling';
      case 'sitemap_parse': return 'Sitemap XML Parsing';
      case 'web_crawl_url': return 'Scrape Webpage HTML';
      case 'normalize_doc': return 'Document Normalization';
      case 'deduplicate_doc': return 'Similarity Deduplication';
      case 'diff_doc': return 'Version Diff Analysis';
      default: return type;
    }
  };

  return (
    <div className="space-y-6" id="queue-monitor-tab">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-md font-mono font-bold uppercase tracking-wider text-white flex items-center gap-2">
            Queue and Asynchronous Workers
          </h2>
          <p className="text-xs text-[#8B949E] font-mono mt-1">
            MONITOR BACKGROUND INGESTION PIPELINES, WORKERS THREAD, CRAWLING QUEUES, AND FAILURES.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onClearHistory}
            className="flex items-center gap-1.5 bg-[#21262D] hover:bg-[#30363D] border border-[#2D333B] text-[#E0E0E0] px-3.5 py-2 rounded text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer"
            title="Clear Historical logs"
          >
            <Trash2 className="h-4 w-4" />
            Clear Completed Logs
          </button>
          <button
            onClick={onRefresh}
            className="flex items-center gap-1.5 bg-[#238636] hover:bg-[#2EA043] border border-[#2D333B] text-white px-3.5 py-2 rounded text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer"
          >
            <RefreshCw className="h-4 w-4" />
            Sync Queue
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-[#161B22] border border-[#2D333B] rounded p-4 flex flex-col md:flex-row justify-between items-center gap-3">
        {/* Search */}
        <div className="relative w-full md:w-72">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-[#8B949E]">
            <Search className="h-3.5 w-3.5" />
          </span>
          <input
            type="text"
            placeholder="Search crawl URLs..."
            value={searchUrl}
            onChange={e => setSearchUrl(e.target.value)}
            className="w-full bg-[#0B0E14] border border-[#2D333B] rounded pl-9.5 pr-3.5 py-2 text-xs font-mono text-white focus:outline-none focus:border-[#58A6FF] placeholder:text-gray-600"
          />
        </div>

        {/* Status filters */}
        <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0 font-mono" id="queue-filters-group">
          <span className="text-[10px] text-[#8B949E] uppercase tracking-wider mr-1.5 flex items-center gap-1 flex-shrink-0">
            <Filter className="h-3.5 w-3.5" /> Filters:
          </span>
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-3 py-1.5 rounded text-[10px] font-bold uppercase tracking-wider select-none cursor-pointer transition-all ${filterStatus === 'all' ? 'bg-[#238636] text-white border border-[#2D333B]' : 'bg-[#0B0E14] text-[#8B949E] hover:bg-[#21262D] border border-[#2D333B]'}`}
          >
            All ({jobs.length})
          </button>
          <button
            onClick={() => setFilterStatus('pending')}
            className={`px-3 py-1.5 rounded text-[10px] font-bold uppercase tracking-wider select-none cursor-pointer transition-all ${filterStatus === 'pending' ? 'bg-[#238636] text-white border border-[#2D333B]' : 'bg-[#0B0E14] text-[#8B949E] hover:bg-[#21262D] border border-[#2D333B]'}`}
          >
            Pending ({jobs.filter(j => j.status === 'pending').length})
          </button>
          <button
            onClick={() => setFilterStatus('processing')}
            className={`px-3 py-1.5 rounded text-[10px] font-bold uppercase tracking-wider select-none cursor-pointer transition-all ${filterStatus === 'processing' ? 'bg-[#238636] text-white border border-[#2D333B]' : 'bg-[#0B0E14] text-[#8B949E] hover:bg-[#21262D] border border-[#2D333B]'}`}
          >
            Active ({jobs.filter(j => j.status === 'processing').length})
          </button>
          <button
            onClick={() => setFilterStatus('completed')}
            className={`px-3 py-1.5 rounded text-[10px] font-bold uppercase tracking-wider select-none cursor-pointer transition-all ${filterStatus === 'completed' ? 'bg-[#238636] text-white border border-[#2D333B]' : 'bg-[#0B0E14] text-[#8B949E] hover:bg-[#21262D] border border-[#2D333B]'}`}
          >
            Success ({jobs.filter(j => j.status === 'completed').length})
          </button>
          <button
            onClick={() => setFilterStatus('failed')}
            className={`px-3 py-1.5 rounded text-[10px] font-bold uppercase tracking-wider select-none cursor-pointer transition-all ${filterStatus === 'failed' ? 'bg-[#238636] text-white border border-[#2D333B]' : 'bg-[#0B0E14] text-[#F85149] hover:bg-[#21262D] border border-[#2D333B]'}`}
          >
            Failed ({jobs.filter(j => j.status === 'failed').length})
          </button>
        </div>
      </div>

      {/* Jobs Table list */}
      <div className="bg-[#161B22] border border-[#2D333B] rounded overflow-hidden" id="queue-jobs-table-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#E0E0E0] font-mono">
            <thead className="text-[10px] text-[#8B949E] uppercase bg-[#0D1117] border-b border-[#2D333B]">
              <tr>
                <th className="px-5 py-3">Job ID</th>
                <th className="px-5 py-3">Pipeline Task</th>
                <th className="px-5 py-3">Source target</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Payload details</th>
                <th className="px-5 py-3 text-right">Attempts</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2D333B]/60">
              {filteredJobs.map((job) => {
                const cleanSourceId = job.sourceId.replace('src-', '').toUpperCase();
                return (
                  <tr key={job.id} className="hover:bg-[#0D1117]/40 transition-colors" id={`job-row-${job.id}`}>
                    <td className="px-5 py-3.5 text-[#8B949E] font-bold">
                      #{job.id.replace('job-', '')}
                    </td>
                    <td className="px-5 py-3.5 text-white font-bold">
                      {getJobTypeLabel(job.type)}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-[10px] text-[#8B949E] bg-[#0B0E14] px-2 py-0.5 rounded border border-[#2D333B]">
                        {cleanSourceId}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      {getStatusBadge(job.status)}
                    </td>
                    <td className="px-5 py-3.5 max-w-sm">
                      <div className="truncate text-xs text-[#8B949E]" title={job.payload.url || JSON.stringify(job.payload)}>
                        {job.payload.url ? (
                          <span className="hover:underline hover:text-[#58A6FF] cursor-pointer">{job.payload.url}</span>
                        ) : (
                          JSON.stringify(job.payload)
                        )}
                      </div>
                      {/* Show error logs if failed */}
                      {job.status === 'failed' && job.error && (
                        <div className="mt-1.5 flex items-start gap-1.5 text-[10px] text-[#F85149] bg-[#F85149]/5 p-2 rounded border border-[#F85149]/20 leading-relaxed select-text">
                          <AlertCircle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
                          <span className="line-clamp-2" title={job.error}>{job.error}</span>
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-right text-[#8B949E]">
                      <span className={job.attempts > 1 ? "text-[#E3B341] font-bold" : ""}>
                        {job.attempts}
                      </span>
                      <span className="text-[#8B949E]/50">/{job.maxAttempts}</span>
                    </td>
                  </tr>
                );
              })}
              {filteredJobs.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-[#8B949E] font-mono">
                    [QUEUE CLEAR] NO MATCHING INGESTION TASKS FOUND IN WORKER RECORD DATABASE.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
