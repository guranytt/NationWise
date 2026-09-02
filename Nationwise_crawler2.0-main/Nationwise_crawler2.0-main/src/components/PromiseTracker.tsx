import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Target, CheckCircle2, XCircle, Clock, AlertTriangle, ChevronRight, X, User } from 'lucide-react';
import { PoliticalPromise, FulfillmentEvent } from '../types';

interface PromiseMetrics {
  total: number;
  byStatus: Record<string, number>;
  byCategory: Record<string, number>;
}

export function PromiseTracker() {
  const [promises, setPromises] = useState<PoliticalPromise[]>([]);
  const [metrics, setMetrics] = useState<PromiseMetrics | null>(null);
  const [selectedPromise, setSelectedPromise] = useState<PoliticalPromise | null>(null);
  const [events, setEvents] = useState<FulfillmentEvent[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000); // refresh every 10s
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const [promRes, metRes] = await Promise.all([
        fetch('/api/promises'),
        fetch('/api/promises/metrics')
      ]);
      setPromises(await promRes.json());
      setMetrics(await metRes.json());
    } catch (e) {
      console.error('Failed to fetch promise data', e);
    }
  };

  const loadPromiseDetails = async (promise: PoliticalPromise) => {
    setSelectedPromise(promise);
    setIsLoadingEvents(true);
    try {
      const res = await fetch(`/api/promises/${promise.id}`);
      const data = await res.json();
      setEvents(data.events || []);
    } catch (e) {
      console.error('Failed to load events', e);
    } finally {
      setIsLoadingEvents(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'fulfilled': return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
      case 'broken': return 'text-red-400 bg-red-400/10 border-red-400/20';
      case 'in_progress': return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
      case 'stalled': return 'text-orange-400 bg-orange-400/10 border-orange-400/20';
      default: return 'text-zinc-400 bg-zinc-400/10 border-zinc-400/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'fulfilled': return <CheckCircle2 className="w-4 h-4" />;
      case 'broken': return <XCircle className="w-4 h-4" />;
      case 'in_progress': return <Activity className="w-4 h-4" />;
      case 'stalled': return <AlertTriangle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  // Basic Activity icon since lucide-react Activity is used above
  const Activity = ({ className }: { className?: string }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
  );


  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-2xl font-semibold text-white flex items-center gap-2">
          <Target className="w-6 h-6 text-indigo-400" />
          AI Promise Tracker
        </h2>
        <p className="text-zinc-400 text-sm mt-1">
          Automatically extracting and tracking political commitments using Gemini.
        </p>
      </header>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {[
          { label: 'Total Tracked', value: metrics?.total || 0, color: 'text-indigo-400' },
          { label: 'Fulfilled', value: metrics?.byStatus['fulfilled'] || 0, color: 'text-emerald-400' },
          { label: 'In Progress', value: metrics?.byStatus['in_progress'] || 0, color: 'text-blue-400' },
          { label: 'Pending', value: metrics?.byStatus['pending'] || 0, color: 'text-zinc-400' },
          { label: 'Broken', value: metrics?.byStatus['broken'] || 0, color: 'text-red-400' },
        ].map(stat => (
          <div key={stat.label} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <h3 className="text-zinc-400 text-xs font-medium uppercase tracking-wider">{stat.label}</h3>
            <div className={`text-3xl font-light mt-2 ${stat.color}`}>{stat.value}</div>
          </div>
        ))}
      </div>

      <div className="flex gap-6 h-[600px]">
        {/* Main List */}
        <div className={`flex-1 bg-zinc-900 border border-zinc-800 rounded-xl flex flex-col overflow-hidden transition-all duration-300 ${selectedPromise ? 'w-1/2 hidden lg:flex' : 'w-full'}`}>
          <div className="p-4 border-b border-zinc-800 flex justify-between items-center">
            <h3 className="text-white font-medium">Extracted Promises</h3>
            <span className="text-xs bg-indigo-500/10 text-indigo-400 px-2 py-1 rounded-full border border-indigo-500/20">
              Live Updates
            </span>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
            {promises.length === 0 ? (
              <div className="text-center text-zinc-500 mt-10">No promises extracted yet. Run a crawl first.</div>
            ) : (
              promises.map(promise => (
                <div 
                  key={promise.id}
                  onClick={() => loadPromiseDetails(promise)}
                  className={`p-4 rounded-lg border transition-all cursor-pointer ${
                    selectedPromise?.id === promise.id 
                      ? 'bg-zinc-800 border-indigo-500/50' 
                      : 'bg-black/20 border-zinc-800/50 hover:border-zinc-700 hover:bg-zinc-800/50'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs border flex items-center gap-1.5 ${getStatusColor(promise.status)}`}>
                      {getStatusIcon(promise.status)}
                      <span className="capitalize">{promise.status.replace('_', ' ')}</span>
                    </span>
                    <span className="text-xs text-zinc-500 capitalize bg-zinc-800 px-2 py-0.5 rounded border border-zinc-700">
                      {promise.category.replace('_', ' ')}
                    </span>
                  </div>
                  
                  <h4 className="text-sm text-white font-medium line-clamp-2 leading-relaxed mb-3">
                    {promise.title}
                  </h4>
                  
                  <div className="flex items-center justify-between text-xs text-zinc-400">
                    <div className="flex items-center gap-1.5 bg-zinc-900 px-2 py-1 rounded border border-zinc-800/50">
                      <User className="w-3 h-3 text-indigo-400" />
                      <span className="truncate max-w-[150px]">{promise.attributedTo}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="opacity-50">Conf:</span>
                      <span className={promise.confidenceScore > 80 ? 'text-emerald-400' : 'text-orange-400'}>
                        {promise.confidenceScore}%
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Details Pane */}
        <AnimatePresence>
          {selectedPromise && (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl flex flex-col overflow-hidden relative"
            >
              <div className="p-4 border-b border-zinc-800 flex justify-between items-start bg-zinc-950/50">
                <div>
                  <h3 className="text-white font-medium text-lg mb-1">{selectedPromise.title}</h3>
                  <div className="flex items-center gap-3 text-xs text-zinc-400 mt-2">
                    <span className="flex items-center gap-1"><User className="w-3 h-3"/> {selectedPromise.attributedTo}</span>
                    <span>•</span>
                    <span>{new Date(selectedPromise.promiseDate).toLocaleDateString()}</span>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedPromise(null)}
                  className="p-1.5 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar">
                
                <section>
                  <h4 className="text-xs uppercase tracking-wider text-zinc-500 font-medium mb-2">The Promise</h4>
                  <p className="text-sm text-zinc-300 leading-relaxed bg-black/20 p-4 rounded-lg border border-zinc-800/50">
                    {selectedPromise.description}
                  </p>
                </section>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-black/20 p-3 rounded-lg border border-zinc-800/50">
                    <div className="text-xs text-zinc-500 mb-1">Target Date</div>
                    <div className="text-sm text-zinc-300">{selectedPromise.targetDate ? new Date(selectedPromise.targetDate).toLocaleDateString() : 'None specified'}</div>
                  </div>
                  <div className="bg-black/20 p-3 rounded-lg border border-zinc-800/50">
                    <div className="text-xs text-zinc-500 mb-1">Budget Amount</div>
                    <div className="text-sm text-zinc-300">{selectedPromise.budgetAmount || 'None specified'}</div>
                  </div>
                </div>

                <section>
                  <h4 className="text-xs uppercase tracking-wider text-zinc-500 font-medium mb-3 flex items-center justify-between">
                    <span>Fulfillment Audit Trail</span>
                    <span className={`px-2 py-0.5 rounded-full border ${getStatusColor(selectedPromise.status)}`}>
                      Current: {selectedPromise.status.replace('_', ' ')}
                    </span>
                  </h4>
                  
                  {isLoadingEvents ? (
                    <div className="text-zinc-500 text-sm animate-pulse">Loading audit trail...</div>
                  ) : events.length === 0 ? (
                    <div className="text-zinc-500 text-sm italic bg-black/20 p-4 rounded-lg border border-zinc-800/50 border-dashed">
                      No evaluation events yet. The system will track this against new documents automatically.
                    </div>
                  ) : (
                    <div className="space-y-4 relative before:absolute before:inset-0 before:ml-2 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-zinc-800 before:to-transparent">
                      {events.map((event, i) => (
                        <div key={event.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                          <div className={`flex items-center justify-center w-4 h-4 rounded-full border-2 border-zinc-900 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-[0_0_0_2px_#27272a] ${
                            event.newStatus === 'fulfilled' ? 'bg-emerald-500' :
                            event.newStatus === 'broken' ? 'bg-red-500' :
                            event.newStatus === 'in_progress' ? 'bg-blue-500' : 'bg-zinc-500'
                          }`}></div>
                          
                          <div className="w-[calc(100%-2rem)] md:w-[calc(50%-1.5rem)] bg-black/40 p-4 rounded-lg border border-zinc-800/50">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-medium text-white capitalize">{event.newStatus.replace('_', ' ')}</span>
                              <span className="text-[10px] text-zinc-500">{new Date(event.evaluatedAt).toLocaleDateString()}</span>
                            </div>
                            <p className="text-xs text-zinc-400 mb-2 leading-relaxed">
                              {event.reasoning}
                            </p>
                            <div className="text-[10px] text-indigo-300/70 border-l-2 border-indigo-500/30 pl-2 italic">
                              "{event.evidence}"
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>

              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
