import { useState, useEffect } from 'react';
import { getIssues, getCategories, getStates } from '../api/issues';
import type { Issue, Category } from '../types';
import IssueCard from '../components/issues/IssueCard';
import { Select } from '../components/ui/Select';
import { Button } from '../components/ui/Button';

export default function IssueFeedPage() {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [states, setStates] = useState<string[]>([]);
  
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [categoryId, setCategoryId] = useState('');
  const [state, setState] = useState('');
  const [status, setStatus] = useState('');
  
  useEffect(() => {
    Promise.all([
      getCategories(),
      getStates(),
    ]).then(([cats, stts]) => {
      setCategories(cats);
      setStates(stts);
    });
  }, []);

  const fetchIssues = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (categoryId) params.category_id = categoryId;
      if (state) params.state = state;
      if (status) params.status = status;
      
      const data = await getIssues(params);
      setIssues(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIssues();
  }, [categoryId, state, status]);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8 border-b border-rule pb-4">
        <div>
          <h1 className="text-3xl font-serif text-ink mb-2">Public Records: Issues</h1>
          <p className="text-ink opacity-70 font-sans text-sm">Official log of infrastructure and civic reports.</p>
        </div>
      </div>
      
      <div className="bg-paper p-6 border border-rule mb-8 flex flex-col md:flex-row gap-4 items-end">
        <Select
          label="Filter by Category"
          options={[{ value: '', label: 'All Categories' }, ...categories.map(c => ({ value: c.id, label: c.name }))]}
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
        />
        <Select
          label="Filter by State"
          options={[{ value: '', label: 'All States' }, ...states.map(s => ({ value: s, label: s }))]}
          value={state}
          onChange={(e) => setState(e.target.value)}
        />
        <Select
          label="Filter by Status"
          options={[
            { value: '', label: 'All Statuses' },
            { value: 'submitted', label: 'Submitted' },
            { value: 'acknowledged', label: 'Acknowledged' },
            { value: 'in_progress', label: 'In Progress' },
            { value: 'resolved', label: 'Resolved' },
            { value: 'stalled', label: 'Stalled' },
          ]}
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        />
        <Button variant="outline" onClick={() => { setCategoryId(''); setState(''); setStatus(''); }} className="w-full md:w-auto h-[38px] shrink-0">
          Reset Filters
        </Button>
      </div>
      
      {loading ? (
        <div className="text-center py-12 font-sans text-sm uppercase tracking-widest text-ink">
          Loading Records...
        </div>
      ) : issues.length === 0 ? (
        <div className="text-center py-12 bg-paper border border-rule border-dashed">
          <p className="text-ink opacity-60 font-sans text-sm">No records found matching your criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {issues.map(issue => (
            <IssueCard key={issue.id} issue={issue} />
          ))}
        </div>
      )}
    </div>
  );
}
