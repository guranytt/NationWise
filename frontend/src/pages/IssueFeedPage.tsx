import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { getIssues } from '../api/issues';
import type { Issue } from '../types';
import GlassCard from '../components/ui/GlassCard';
import Badge from '../components/ui/Badge';
import { Clock, MapPin, Search, Filter } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function IssueFeedPage() {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterState, setFilterState] = useState('');

  useEffect(() => {
    loadIssues();
  }, []);

  const loadIssues = async () => {
    try {
      setLoading(true);
      const data = await getIssues();
      setIssues(data);
    } catch (error) {
      console.error("Failed to load issues", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredIssues = issues.filter(issue => {
    const matchesSearch = issue.title.toLowerCase().includes(search.toLowerCase()) || 
                          issue.description.toLowerCase().includes(search.toLowerCase());
    const matchesState = filterState ? issue.state === filterState : true;
    return matchesSearch && matchesState;
  });

  const uniqueStates = Array.from(new Set(issues.map(i => i.state)));

  const getStatusColor = (status: string) => {
    switch(status.toLowerCase()) {
      case 'resolved': return 'success';
      case 'in progress': return 'warning';
      default: return 'secondary';
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-500 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl md:text-5xl font-display font-bold text-nw-text-light dark:text-nw-text-dark mb-3">
            Civic Issues Feed
          </h1>
          <p className="text-nw-text-light-muted dark:text-nw-text-dark-muted max-w-2xl">
            Live feed of infrastructure and civic issues reported by citizens across Nigeria.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-nw-text-light-muted dark:text-nw-text-dark-muted" />
            <input 
              type="text" 
              placeholder="Search issues..." 
              className="input-field pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="relative w-full sm:w-48">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-nw-text-light-muted dark:text-nw-text-dark-muted" />
            <select 
              className="input-field pl-9 appearance-none"
              value={filterState}
              onChange={(e) => setFilterState(e.target.value)}
            >
              <option value="">All States</option>
              {uniqueStates.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-nw-primary/30 border-t-nw-primary rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-6">
          {filteredIssues.map(issue => (
            <Link key={issue.id} to={`/issues/${issue.id}`} className="block group">
              <GlassCard hoverEffect className="p-6 transition-colors group-hover:bg-black/5 dark:group-hover:bg-white/5">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="space-y-2 flex-grow">
                    <div className="flex items-center gap-3">
                      <Badge variant={getStatusColor(issue.status)}>{issue.status}</Badge>
                      <span className="text-sm font-medium text-nw-primary dark:text-nw-primary-light">
                        {issue.category?.name || 'General'}
                      </span>
                    </div>
                    
                    <h3 className="text-xl font-semibold text-nw-text-light dark:text-nw-text-dark group-hover:text-nw-primary dark:group-hover:text-nw-primary-light transition-colors">
                      {issue.title}
                    </h3>
                    
                    <p className="text-nw-text-light-muted dark:text-nw-text-dark-muted line-clamp-2">
                      {issue.description}
                    </p>
                    
                    <div className="flex items-center gap-4 text-xs text-nw-text-light-muted dark:text-nw-text-dark-muted pt-2">
                      <span className="flex items-center">
                        <MapPin className="w-3.5 h-3.5 mr-1" />
                        {issue.state}{issue.lga ? `, ${issue.lga}` : ''}
                      </span>
                      <span className="flex items-center">
                        <Clock className="w-3.5 h-3.5 mr-1" />
                        {formatDistanceToNow(new Date(issue.created_at), { addSuffix: true })}
                      </span>
                      {issue.routed_agency && (
                        <span className="hidden md:inline">
                          Routed to: <strong>{issue.routed_agency.name}</strong>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </GlassCard>
            </Link>
          ))}
          
          {filteredIssues.length === 0 && (
            <div className="py-20 text-center">
              <p className="text-nw-text-light-muted dark:text-nw-text-dark-muted">No issues found matching your filters.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
