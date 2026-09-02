/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  Globe, 
  Layers, 
  Activity, 
  CheckCircle2, 
  AlertTriangle, 
  FileText, 
  Copy, 
  RefreshCw,
  Terminal
} from 'lucide-react';
import { SystemMetrics } from '../types';

interface OverviewProps {
  metrics: SystemMetrics;
  auditLogs: Array<{
    id: string;
    timestamp: string;
    level: 'INFO' | 'SUCCESS' | 'WARN' | 'ERROR';
    module: string;
    message: string;
  }>;
  onRefresh: () => void;
}

export const Overview: React.FC<OverviewProps> = ({ metrics, auditLogs, onRefresh }) => {
  return (
    <div className="space-y-6" id="overview-tab">
      {/* Top Banner */}
      <div className="bg-[#161B22] border border-[#2D333B] rounded p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-md font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
            🇳🇬 National Civic Data Pipeline
          </h2>
          <p className="text-xs text-[#8B949E] font-mono mt-1">
            REAL-TIME, TRACEABLE DATA INGESTION FOR OFFICIAL NIGERIAN GOVERNMENT PORTALS & LEGISLATIVE RECORDS.
          </p>
        </div>
        <button
          onClick={onRefresh}
          className="flex items-center gap-2 bg-[#238636] hover:bg-[#2EA043] text-white px-4 py-2 rounded text-xs font-mono uppercase tracking-wider transition-colors cursor-pointer select-none border border-[#2D333B]"
          id="btn-refresh-metrics"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh Pipeline Metrics
        </button>
      </div>

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#161B22] border border-[#2D333B] rounded p-4" id="metric-health">
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-[#8B949E] uppercase font-mono tracking-wider">Pipeline Success Rate</span>
            <span className="text-[#58A6FF]">
              <Activity className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold tracking-tight text-white font-mono">
              {metrics.successRate.toFixed(2)}%
            </span>
            <div className="flex items-center gap-1.5 mt-2 text-[9px] text-[#238636]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#238636] animate-pulse"></span>
              <span className="font-mono">Background workers loop active</span>
            </div>
          </div>
        </div>

        <div className="bg-[#161B22] border border-[#2D333B] rounded p-4" id="metric-docs">
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-[#8B949E] uppercase font-mono tracking-wider">Ingested Documents</span>
            <span className="text-[#58A6FF]">
              <FileText className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold tracking-tight text-white font-mono">
              {metrics.documentsIngested.toLocaleString()}
            </span>
            <div className="text-[9px] text-[#8B949E] font-mono mt-2">
              NORMALIZED CIVIC ARCHIVE OBJECTS
            </div>
          </div>
        </div>

        <div className="bg-[#161B22] border border-[#2D333B] rounded p-4" id="metric-dups">
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-[#8B949E] uppercase font-mono tracking-wider">Duplicate Matches</span>
            <span className="text-[#D29922]">
              <Copy className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold tracking-tight text-[#D29922] font-mono">
              {metrics.duplicatesDetected}
            </span>
            <div className="text-[9px] text-[#8B949E] font-mono mt-2">
              SIM-HASH RELATIONSHIPS TRACKED
            </div>
          </div>
        </div>

        <div className="bg-[#161B22] border border-[#2D333B] rounded p-4" id="metric-changes">
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-[#8B949E] uppercase font-mono tracking-wider">Version Updates</span>
            <span className="text-[#BC8CFF]">
              <Layers className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold tracking-tight text-white font-mono">
              {metrics.changesDetected}
            </span>
            <div className="text-[9px] text-[#8B949E] font-mono mt-2">
              MEANINGFUL VERSION DIFFS STORED
            </div>
          </div>
        </div>
      </div>

      {/* Queue health and Source health */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Queue States */}
        <div className="bg-[#161B22] border border-[#2D333B] rounded p-5 lg:col-span-1 flex flex-col justify-between" id="queue-states-card">
          <div>
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-white mb-4 flex items-center gap-2">
              <Layers className="h-4 w-4 text-[#58A6FF]" /> Queue Engine Status
            </h3>
            <div className="space-y-3 font-mono text-xs">
              <div className="flex justify-between items-center py-1.5 border-b border-[#2D333B]">
                <span className="text-[#8B949E]">Processing Jobs</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${metrics.activeJobsCount > 0 ? 'bg-[#D29922]/20 text-[#E3B341] animate-pulse' : 'bg-[#21262D] text-[#8B949E]'}`}>
                  {metrics.activeJobsCount} ACTIVE
                </span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-[#2D333B]">
                <span className="text-[#8B949E]">Pending in Queue</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#21262D] text-[#58A6FF]">
                  {metrics.pendingJobsCount} PENDING
                </span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-[#2D333B]">
                <span className="text-[#8B949E]">Completed Logs</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#21262D] text-[#3FB950]">
                  {metrics.completedJobsCount} SUCCESS
                </span>
              </div>
              <div className="flex justify-between items-center py-1.5">
                <span className="text-[#8B949E]">Failed / DLQ Status</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${metrics.failedJobsCount > 0 ? 'bg-[#F85149]/20 text-[#F85149]' : 'bg-[#21262D] text-[#8B949E]'}`}>
                  {metrics.failedJobsCount} CRITICAL
                </span>
              </div>
            </div>
          </div>
          <div className="mt-5 pt-3 border-t border-[#2D333B] text-[10px] text-[#8B949E] font-mono flex items-center gap-2">
            <span className={`h-2 w-2 rounded-full ${metrics.activeJobsCount > 0 ? 'bg-[#D29922] animate-pulse' : 'bg-[#238636]'}`}></span>
            {metrics.activeJobsCount > 0 ? 'WORKER ACTIVE: PROCESSING CRAWL TASK' : 'WORKER IDLE: WAITING FOR INGEST SCHEDULE'}
          </div>
        </div>

        {/* Source Health Check */}
        <div className="bg-[#161B22] border border-[#2D333B] rounded p-5 lg:col-span-2" id="source-health-card">
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-white mb-4 flex items-center gap-2">
            <Globe className="h-4 w-4 text-[#58A6FF]" /> Target Portals Health Monitor
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[190px] overflow-y-auto pr-1">
            {Object.entries(metrics.sourceHealth).map(([sourceId, health]) => {
              const cleanName = sourceId.replace('src-', '').toUpperCase();
              return (
                <div key={sourceId} className="flex items-center justify-between p-2.5 rounded bg-[#0D1117] border border-[#2D333B]">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-[#8B949E] font-mono tracking-wider">{cleanName}</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-mono text-[10px]">
                    {health === 'healthy' ? (
                      <>
                        <span className="h-2 w-2 rounded-full bg-[#238636]"></span>
                        <span className="text-[#3FB950] font-bold">ONLINE</span>
                      </>
                    ) : health === 'failing' ? (
                      <>
                        <span className="h-2 w-2 rounded-full bg-[#F85149] animate-pulse"></span>
                        <span className="text-[#F85149] font-bold">FAILING</span>
                      </>
                    ) : (
                      <>
                        <span className="h-1.5 w-1.5 rounded-full bg-slate-600"></span>
                        <span className="text-[#8B949E]">UNVISITED</span>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
            {Object.keys(metrics.sourceHealth).length === 0 && (
              <div className="text-xs text-[#8B949E] py-6 text-center col-span-2 font-mono">
                NO TARGETS PRESENT IN CRAWL DATABASE REGISTRY.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* System Audit Trail Log */}
      <div className="bg-[#0D1117] border border-[#2D333B] rounded p-4" id="audit-trail-logs">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-white flex items-center gap-2">
            <Terminal className="h-4 w-4 text-[#58A6FF]" /> Audit Trace Log
          </h3>
          <span className="text-[9px] font-mono text-[#58A6FF] bg-[#21262D] px-2 py-0.5 rounded border border-[#2D333B]">
            AUTO_SCROLL: ON
          </span>
        </div>

        <div className="bg-[#010409] rounded p-3 border border-[#2D333B] font-mono text-[10px] overflow-y-auto h-72 space-y-1.5">
          {auditLogs.map((log) => {
            const timeStr = new Date(log.timestamp).toLocaleTimeString();
            const levelColors = {
              INFO: 'text-[#58A6FF]',
              SUCCESS: 'text-[#7EE787] font-semibold',
              WARN: 'text-[#E3B341] font-semibold',
              ERROR: 'text-[#F85149] font-bold'
            };

            return (
              <div key={log.id} className="flex items-start gap-2 hover:bg-[#161B22]/60 py-0.5 rounded px-1">
                <span className="text-[#8B949E]">[{timeStr}]</span>
                <span className={`min-w-[70px] ${levelColors[log.level]}`}>[{log.level}]</span>
                <span className="text-[#7EE787]">[{log.module}]</span>
                <span className="text-[#E0E0E0] flex-1">{log.message}</span>
              </div>
            );
          })}
          {auditLogs.length === 0 && (
            <div className="text-center text-[#8B949E] py-12 font-mono">
              [SYSTEM STANDBY] NO AUDIT EVENTS IN DATABASE. START A CRAWL TASK TO STREAMS LIVE CONSOLE OUTPUT.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
